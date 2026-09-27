-- =============================================================================
-- Panel de administración: lo que le falta a la base de datos
-- Proyecto de Supabase: Spotter (tjbofdfdtpwlybgyaber). NO es el de la web.
-- Escrito el 27/09/2026. Corresponde al §5 de PANEL-ADMIN.md.
-- =============================================================================
--
-- QUÉ TOCA ESTE FICHERO
--   Solo añade funciones nuevas (`create function`). No crea, borra ni modifica
--   ninguna tabla, ninguna columna, ningún dato y ninguna política de RLS.
--   La app no llama a nada de esto: puede aplicarse con la app en producción.
--   Al final del fichero están las líneas para deshacerlo entero.
--
-- LO QUE YA EXISTÍA Y AQUÍ NO SE REPITE
--   `resolver_denuncia(p_report_id, p_action, p_reason, p_expires_at)` ya cierra
--   una denuncia, apunta la acción, suspende, banea y retira contenido, y admite
--   suspensiones con fecha de caducidad que `reactivar_suspensiones_vencidas`
--   levanta solas. El panel la llama tal cual.
--   También existen `report_content` (la app denuncia) y `moderar_sitio`.
--
-- LO QUE FALTA Y AÑADE ESTE FICHERO
--   1. Ver la cola de denuncias con nombres y contenido, no con identificadores.
--   2. Abrir una denuncia y entender el caso.
--   3. Suspender o reactivar desde la pantalla de Personas, sin denuncia previa.
--   4. Marcar una denuncia como «la estoy mirando» o descartarla.
--   5. La ficha de quien modera, sin la que hoy `resolver_denuncia` falla.
--
-- POR QUÉ FUNCIONES Y NO POLÍTICAS DE LECTURA
--   Hoy `users`, `messages` y `user_photos` solo los lee su dueño, y así debe
--   seguir. Una función `security definer` se salta RLS, pero solo devuelve las
--   columnas escritas aquí: el panel ve el mensaje denunciado, no los 810
--   mensajes de la base de datos.
--
-- CÓMO SE PROTEGEN
--   1. Primera línea de cada función: si quien llama no es staff, error.
--   2. `set search_path`: fija dónde busca los nombres, para que nadie pueda
--      colar una tabla suya delante de la nuestra.
--   3. Permiso de ejecución solo para sesiones con cuenta iniciada.
--   Quien es staff lo dice `app_metadata.staff` del token, que solo se cambia
--   desde el panel de Supabase o con la clave de servicio.
--
-- REGLAS DEL ESQUEMA QUE SE RESPETAN
--   - Aquí no se borra nada: todo lleva `deleted_at` y todo se filtra por él.
--     La excepción es el contenido denunciado, que se enseña aunque esté
--     retirado: es la prueba de la denuncia, y por eso viaja con su marca.
--   - `users.location` no sale nunca. El panel trabaja con ciudad, como la app.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. es_staff() — la comprobación que repiten todas las demás
-- -----------------------------------------------------------------------------
create or replace function public.es_staff()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(((auth.jwt() -> 'app_metadata') ->> 'staff')::boolean, false);
$$;

comment on function public.es_staff() is
  'Cierto si la sesion actual tiene app_metadata.staff = true. Misma condicion que las politicas reports_staff y moderation_staff.';


-- -----------------------------------------------------------------------------
-- 2. asegurar_perfil_staff() — quién firma cada acción
-- -----------------------------------------------------------------------------
--
-- `moderation_actions.moderator_id` es obligatorio y apunta a `public.users`, y
-- `reports.reviewed_by_id` también. Una cuenta del panel vive en `auth.users`
-- pero no tiene por qué tener ficha en `public.users`: hoy hay 342 cuentas así,
-- gente que se registró y no terminó el alta.
--
-- Consecuencia comprobada: una cuenta del panel sin ficha NO puede moderar.
-- `resolver_denuncia` falla al apuntar la acción, aunque sea staff.
--
-- Esta función crea esa ficha la primera vez que hace falta, con lo mínimo que
-- exige la tabla y en estado `pending`:
--   - Sin deportes, así que `ensure_daily_lineup` no la puede proponer a nadie:
--     exige compartir deporte. No sale en la serie de nadie.
--   - Sin ubicación, así que tampoco aparece por cercanía.
--   - Sin recomendaciones, matches, grupos ni chats, así que `puedo_ver_a`
--     devuelve falso para cualquiera: nadie puede abrir ese perfil.
--   - En `pending`, así que no cuenta como persona activa en las métricas.
--
-- Una ficha por persona del equipo, y solo la primera vez. La alternativa era
-- un único usuario de sistema «Spotter» firmando todo, pero entonces el
-- registro diría «Spotter suspendió a esta persona» en vez de «Paula la
-- suspendió»: justo lo que el registro existe para evitar.
-- -----------------------------------------------------------------------------
create or replace function public.asegurar_perfil_staff()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid := auth.uid();
  v_email text;
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if v_id is null then
    raise exception 'sin sesion' using errcode = '42501';
  end if;

  if exists (select 1 from public.users where id = v_id) then
    return v_id;
  end if;

  select email into v_email from auth.users where id = v_id;

  insert into public.users (id, username, display_name, birth_date, status)
  values (
    v_id,
    'equipo_' || replace(left(v_id::text, 8), '-', ''),
    coalesce(nullif(split_part(v_email, '@', 1), ''), 'Equipo Spotter'),
    date '2000-01-01',
    'pending'
  )
  on conflict (id) do nothing;

  return v_id;
end;
$$;

comment on function public.asegurar_perfil_staff() is
  'Devuelve el id de quien modera y crea su ficha minima en public.users la primera vez. Sin ella, moderation_actions.moderator_id no se puede rellenar.';


-- -----------------------------------------------------------------------------
-- 3. admin_reports() — la cola de denuncias, con contexto
-- -----------------------------------------------------------------------------
-- La más antigua sin atender, arriba: lo que se mide es el tiempo de respuesta,
-- y las condiciones de uso prometen 24 horas.
-- `denuncias_acumuladas` es la señal más útil de la lista: una persona con seis
-- denuncias no es lo mismo que una con una.
-- -----------------------------------------------------------------------------
create or replace function public.admin_reports(
  p_status public.report_status_enum default null,
  p_limit  integer                    default 50,
  p_offset integer                    default 0
)
returns table (
  id                   uuid,
  created_at           timestamptz,
  status               public.report_status_enum,
  target_type          public.report_target_enum,
  reason               public.report_reason_enum,
  description          text,
  reporter_id          uuid,
  reporter_name        text,
  reported_user_id     uuid,
  reported_name        text,
  reported_status      public.user_status_enum,
  message_body         text,
  message_hidden       boolean,
  group_name           text,
  denuncias_acumuladas bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  return query
    select
      r.id,
      r.created_at,
      r.status,
      r.target_type,
      r.reason,
      r.description,
      r.reporter_id,
      quien.display_name::text,
      r.reported_user_id,
      senalado.display_name::text,
      senalado.status,
      -- El mensaje denunciado se enseña aunque se haya retirado: es la prueba.
      m.body,
      (m.is_hidden or m.deleted_at is not null),
      g.name::text,
      coalesce((
        select count(*)
          from public.reports otras
         where otras.reported_user_id = r.reported_user_id
           and otras.deleted_at is null
      ), 0)
      from public.reports r
      left join public.users    quien    on quien.id    = r.reporter_id
      left join public.users    senalado on senalado.id = r.reported_user_id
      left join public.messages m        on m.id        = r.message_id
      left join public.groups   g        on g.id        = r.group_id
     where r.deleted_at is null
       and (p_status is null or r.status = p_status)
     order by r.created_at asc
     limit greatest(p_limit, 0)
    offset greatest(p_offset, 0);
end;
$$;

comment on function public.admin_reports(public.report_status_enum, integer, integer) is
  'Cola de denuncias para el panel, de la mas antigua a la mas nueva. Sin p_status, las devuelve todas.';


-- -----------------------------------------------------------------------------
-- 4. admin_report_context() — abrir una denuncia
-- -----------------------------------------------------------------------------
-- Devuelve un jsonb porque cada tipo de denuncia trae cosas distintas (un
-- mensaje, una foto, un grupo). Con una tabla harían falta cuatro funciones o
-- una fila llena de columnas vacías.
--
-- De la conversación salen como mucho ONCE mensajes: el denunciado y los de
-- alrededor. No es «leer el chat»: es lo justo para saber si un mensaje suelto
-- era una broma entre conocidos o acoso.
-- -----------------------------------------------------------------------------
create or replace function public.admin_report_context(p_report_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_report   public.reports%rowtype;
  v_chat_id  uuid;
  v_group_id uuid;
  v_momento  timestamptz;
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  select * into v_report
    from public.reports
   where id = p_report_id
     and deleted_at is null;

  if not found then
    raise exception 'denuncia no encontrada' using errcode = 'P0002';
  end if;

  select m.chat_id, m.group_id, m.created_at
    into v_chat_id, v_group_id, v_momento
    from public.messages m
   where m.id = v_report.message_id;

  return jsonb_build_object(
    'denuncia', jsonb_build_object(
      'id',          v_report.id,
      'created_at',  v_report.created_at,
      'status',      v_report.status,
      'target_type', v_report.target_type,
      'reason',      v_report.reason,
      'description', v_report.description
    ),

    'quien_denuncia', (
      select jsonb_build_object('id', u.id, 'display_name', u.display_name, 'username', u.username)
        from public.users u where u.id = v_report.reporter_id
    ),

    'senalado', (
      select jsonb_build_object(
               'id', u.id, 'display_name', u.display_name, 'username', u.username,
               'status', u.status, 'city_name', u.city_name, 'bio', u.bio,
               'last_active_at', u.last_active_at, 'created_at', u.created_at)
        from public.users u where u.id = v_report.reported_user_id
    ),

    'mensaje', (
      select jsonb_build_object(
               'id', m.id, 'sender_id', m.sender_id, 'body', m.body, 'type', m.type,
               'created_at', m.created_at, 'is_hidden', m.is_hidden, 'deleted_at', m.deleted_at)
        from public.messages m where m.id = v_report.message_id
    ),

    -- Los once mensajes más cercanos en el tiempo, ordenados para leerlos.
    'conversacion', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', v.id, 'sender_id', v.sender_id, 'body', v.body,
                                  'created_at', v.created_at, 'is_hidden', v.is_hidden)
               order by v.created_at)
        from (
          select m.id, m.sender_id, m.body, m.created_at, m.is_hidden
            from public.messages m
           where (v_chat_id  is not null and m.chat_id  = v_chat_id)
              or (v_group_id is not null and m.group_id = v_group_id)
           order by abs(extract(epoch from (m.created_at - v_momento)))
           limit 11
        ) v
    ), '[]'::jsonb),

    'foto', (
      select jsonb_build_object('id', p.id, 'storage_key', p.storage_key,
                                'moderation_status', p.moderation_status,
                                'deleted_at', p.deleted_at)
        from public.user_photos p where p.id = v_report.photo_id
    ),

    'grupo', (
      select jsonb_build_object('id', g.id, 'name', g.name, 'group_type', g.group_type)
        from public.groups g where g.id = v_report.group_id
    ),

    'historial', jsonb_build_object(
      'denuncias_recibidas', (
        select count(*) from public.reports r
         where r.reported_user_id = v_report.reported_user_id and r.deleted_at is null
      ),
      'acciones', coalesce((
        select jsonb_agg(jsonb_build_object('action', a.action, 'reason', a.reason,
                                            'expires_at', a.expires_at,
                                            'created_at', a.created_at)
                         order by a.created_at desc)
          from public.moderation_actions a
         where a.target_user_id = v_report.reported_user_id and a.deleted_at is null
      ), '[]'::jsonb)
    )
  );
end;
$$;

comment on function public.admin_report_context(uuid) is
  'Todo lo necesario para decidir sobre una denuncia: el contenido senalado, hasta once mensajes de contexto y el historial de esa persona.';


-- -----------------------------------------------------------------------------
-- 5. admin_marcar_denuncia() — «la estoy mirando» y «no era nada»
-- -----------------------------------------------------------------------------
-- `resolver_denuncia` deja siempre la denuncia en `resolved`, que es lo correcto
-- cuando se toma una medida. Faltan los otros dos pasos de la cola:
--   - `reviewing`: al abrirla, para que dos personas no revisen lo mismo.
--   - `dismissed`: se miró y no había nada que hacer. Exige motivo y deja
--     rastro con acción `none`, porque «no hacer nada» también es una decisión.
-- -----------------------------------------------------------------------------
create or replace function public.admin_marcar_denuncia(
  p_report_id uuid,
  p_status    public.report_status_enum,
  p_reason    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moderator uuid;
  v_report    public.reports%rowtype;
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  if p_status not in ('reviewing', 'dismissed') then
    raise exception 'usa resolver_denuncia para cerrar con una accion'
      using errcode = '22023';
  end if;

  if p_status = 'dismissed' and coalesce(btrim(p_reason), '') = '' then
    raise exception 'descartar tambien necesita un motivo' using errcode = '22023';
  end if;

  v_moderator := public.asegurar_perfil_staff();

  select * into v_report
    from public.reports
   where id = p_report_id
     and deleted_at is null
     for update;

  if not found then
    raise exception 'denuncia no encontrada' using errcode = 'P0002';
  end if;

  update public.reports
     set status         = p_status,
         reviewed_by_id = v_moderator,
         -- Mientras se mira todavía no está revisada: la fecha se pone al cerrar.
         reviewed_at    = case when p_status = 'dismissed' then now() else null end,
         updated_at     = now()
   where id = p_report_id;

  if p_status = 'dismissed' then
    insert into public.moderation_actions
      (report_id, moderator_id, target_user_id, action, scope, reason)
    values
      (p_report_id, v_moderator, v_report.reported_user_id, 'none', 'global', p_reason);
  end if;
end;
$$;

comment on function public.admin_marcar_denuncia(uuid, public.report_status_enum, text) is
  'Pasa una denuncia a reviewing (al abrirla) o a dismissed (con motivo y rastro). Para cerrarla con una medida se usa resolver_denuncia.';


-- -----------------------------------------------------------------------------
-- 6. admin_set_user_status() — suspender o reactivar sin denuncia delante
-- -----------------------------------------------------------------------------
-- La usa la pantalla de Personas. Cuando la medida sale de una denuncia se usa
-- `resolver_denuncia`, que además deja la denuncia cerrada.
--
-- `p_expires_at` sirve para suspensiones temporales: si se rellena,
-- `reactivar_suspensiones_vencidas` devuelve la cuenta a `active` sola.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_user_status(
  p_user_id    uuid,
  p_status     public.user_status_enum,
  p_reason     text,
  p_expires_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moderator uuid;
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'hace falta un motivo' using errcode = '22023';
  end if;

  -- Borrar una cuenta es cosa de su dueño desde la app, no del panel.
  if p_status not in ('active', 'suspended', 'banned') then
    raise exception 'estado no valido: %', p_status using errcode = '22023';
  end if;

  v_moderator := public.asegurar_perfil_staff();

  update public.users
     set status     = p_status,
         updated_at = now()
   where id = p_user_id
     and deleted_at is null;

  if not found then
    raise exception 'persona no encontrada' using errcode = 'P0002';
  end if;

  insert into public.moderation_actions
    (moderator_id, target_user_id, action, scope, reason, expires_at)
  values
    (v_moderator,
     p_user_id,
     case p_status
       when 'suspended' then 'suspend'::public.moderation_action_enum
       when 'banned'    then 'ban'::public.moderation_action_enum
       else 'none'::public.moderation_action_enum
     end,
     'global',
     p_reason,
     p_expires_at);
end;
$$;

comment on function public.admin_set_user_status(uuid, public.user_status_enum, text, timestamptz) is
  'Cambia el estado de una cuenta desde la pantalla de Personas y lo apunta en moderation_actions.';


-- -----------------------------------------------------------------------------
-- 7. Permisos
-- -----------------------------------------------------------------------------
-- Estas funciones se saltan RLS, así que el permiso se da solo a sesiones con
-- cuenta iniciada y quien manda de verdad es el `es_staff()` de dentro. `anon`
-- (la web sin sesión) no las puede ni llamar.
-- -----------------------------------------------------------------------------
revoke all on function public.es_staff()                                                              from public;
revoke all on function public.asegurar_perfil_staff()                                                 from public;
revoke all on function public.admin_reports(public.report_status_enum, integer, integer)              from public;
revoke all on function public.admin_report_context(uuid)                                              from public;
revoke all on function public.admin_marcar_denuncia(uuid, public.report_status_enum, text)            from public;
revoke all on function public.admin_set_user_status(uuid, public.user_status_enum, text, timestamptz) from public;

grant execute on function public.es_staff()                                                              to authenticated;
grant execute on function public.asegurar_perfil_staff()                                                 to authenticated;
grant execute on function public.admin_reports(public.report_status_enum, integer, integer)              to authenticated;
grant execute on function public.admin_report_context(uuid)                                              to authenticated;
grant execute on function public.admin_marcar_denuncia(uuid, public.report_status_enum, text)            to authenticated;
grant execute on function public.admin_set_user_status(uuid, public.user_status_enum, text, timestamptz) to authenticated;


-- =============================================================================
-- PARA DESHACERLO ENTERO
-- Deja la base de datos como estaba. Lo único que sobrevive son las filas que el
-- panel haya escrito mientras tanto: acciones de moderación, denuncias cerradas
-- y las fichas de equipo creadas por `asegurar_perfil_staff`.
--
--   drop function if exists public.admin_set_user_status(uuid, public.user_status_enum, text, timestamptz);
--   drop function if exists public.admin_marcar_denuncia(uuid, public.report_status_enum, text);
--   drop function if exists public.admin_report_context(uuid);
--   drop function if exists public.admin_reports(public.report_status_enum, integer, integer);
--   drop function if exists public.asegurar_perfil_staff();
--   drop function if exists public.es_staff();
-- =============================================================================
