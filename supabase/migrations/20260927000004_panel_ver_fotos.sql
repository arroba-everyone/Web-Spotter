-- =============================================================================
-- Panel de administración: poder VER lo que se denuncia
-- Proyecto de Supabase: Spotter (tjbofdfdtpwlybgyaber). NO es el de la web.
-- Escrito el 27/09/2026. Corresponde al §5.4 de PANEL-ADMIN.md.
-- =============================================================================
--
-- EL PROBLEMA
--   En una denuncia contra una persona no hay mensaje ni foto señalada: solo
--   «Darwin denuncia a Marta por otro motivo». Con eso no se puede decidir
--   nada, y las denuncias falsas existen. Hace falta ver el perfil de quien
--   está señalado: sus fotos, su descripción y sus deportes, que es justo lo
--   que ve cualquiera en la app antes de dar un Spot.
--
-- QUÉ TOCA ESTE FICHERO
--   1. Dos políticas NUEVAS de Storage para que el equipo pueda abrir las fotos.
--      No modifica ni borra ninguna de las que ya hay: se suman a ellas.
--   2. Reemplaza `admin_report_context` para que traiga el perfil completo de
--      la persona señalada. Mismo nombre y mismos parámetros.
--
-- POR QUÉ POLÍTICAS NUEVAS Y NO TOCAR LAS DE LA APP
--   Las de la app deciden quién ve la foto de quién, y son delicadas. Añadir
--   una política aparte deja claro qué es de la app y qué es del panel, y
--   quitarla mañana es una línea sin riesgo de romper nada.
--
-- CUIDADO: las fotos siguen siendo privadas. Los cajones no se hacen públicos.
-- El panel las abre con un enlace firmado que caduca en un minuto, y solo
-- dentro de la ficha de una denuncia.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. El equipo puede ver las fotos de perfil
-- -----------------------------------------------------------------------------
drop policy if exists "el equipo ve las fotos de perfil" on storage.objects;

create policy "el equipo ve las fotos de perfil"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'user-photos' and public.es_staff());


-- -----------------------------------------------------------------------------
-- 2. El equipo puede ver las imágenes enviadas en los chats
-- -----------------------------------------------------------------------------
-- Un mensaje denunciado puede ser una imagen. Sin esto, la denuncia por
-- desnudos en un chat no se puede revisar.
-- -----------------------------------------------------------------------------
drop policy if exists "el equipo ve los adjuntos denunciados" on storage.objects;

create policy "el equipo ve los adjuntos denunciados"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'chat-media' and public.es_staff());


-- -----------------------------------------------------------------------------
-- 3. admin_report_context() con el perfil de quien está señalado
-- -----------------------------------------------------------------------------
-- Cambia respecto a la versión anterior:
--   - `senalado` trae ahora sus fotos, sus deportes y su edad.
--   - `mensaje` y `conversacion` traen la clave del adjunto, para poder verlo.
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
      select jsonb_build_object('id', u.id, 'display_name', u.display_name, 'username', u.username,
                                'status', u.status, 'created_at', u.created_at,
                                'denuncias_puestas', (
                                  select count(*) from public.reports r
                                   where r.reporter_id = u.id and r.deleted_at is null
                                ))
        from public.users u where u.id = v_report.reporter_id
    ),

    -- El perfil de quien está señalado, tal como lo ve cualquiera en la app.
    'senalado', (
      select jsonb_build_object(
               'id', u.id, 'display_name', u.display_name, 'username', u.username,
               'status', u.status, 'city_name', u.city_name, 'bio', u.bio,
               'edad', extract(year from age(u.birth_date))::int,
               'last_active_at', u.last_active_at, 'created_at', u.created_at,
               'fotos', coalesce((
                 select jsonb_agg(jsonb_build_object('id', f.id, 'storage_key', f.storage_key,
                                                     'is_primary', f.is_primary,
                                                     'moderation_status', f.moderation_status)
                                  order by f.position)
                   from public.user_photos f
                  where f.user_id = u.id and f.deleted_at is null
               ), '[]'::jsonb),
               'deportes', coalesce((
                 select jsonb_agg(jsonb_build_object('sport', s.name, 'skill_level', us.skill_level)
                                  order by s.name)
                   from public.user_sports us
                   join public.sports s on s.id = us.sport_id
                  where us.user_id = u.id and us.deleted_at is null
               ), '[]'::jsonb))
        from public.users u where u.id = v_report.reported_user_id
    ),

    'mensaje', (
      select jsonb_build_object(
               'id', m.id, 'sender_id', m.sender_id, 'body', m.body, 'type', m.type,
               'attachment_key', m.attachment_key,
               'created_at', m.created_at, 'is_hidden', m.is_hidden, 'deleted_at', m.deleted_at)
        from public.messages m where m.id = v_report.message_id
    ),

    'conversacion', coalesce((
      select jsonb_agg(
               jsonb_build_object('id', v.id, 'sender_id', v.sender_id, 'body', v.body,
                                  'attachment_key', v.attachment_key,
                                  'created_at', v.created_at, 'is_hidden', v.is_hidden)
               order by v.created_at)
        from (
          select m.id, m.sender_id, m.body, m.attachment_key, m.created_at, m.is_hidden
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
  'Todo lo necesario para decidir sobre una denuncia: el perfil de quien esta senalado con sus fotos, el contenido denunciado, hasta once mensajes de contexto y el historial.';


-- =============================================================================
-- PARA DESHACERLO
--   drop policy if exists "el equipo ve las fotos de perfil" on storage.objects;
--   drop policy if exists "el equipo ve los adjuntos denunciados" on storage.objects;
--   (la función se queda; es la versión buena. Para volver atrás, se aplica de
--    nuevo la de 20260927000001_panel_admin.sql)
-- =============================================================================
