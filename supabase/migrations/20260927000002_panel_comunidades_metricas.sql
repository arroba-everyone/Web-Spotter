-- =============================================================================
-- Panel de administración: comunidades, métricas y sitios por revisar
-- Proyecto de Supabase: Spotter (tjbofdfdtpwlybgyaber). NO es el de la web.
-- Escrito el 27/09/2026. Corresponde a las fases 2 y 3 de PANEL-ADMIN.md §8.
-- Se aplica DESPUÉS de 20260927000001_panel_admin.sql, del que usa `es_staff()`
-- y `asegurar_perfil_staff()`.
-- =============================================================================
--
-- QUÉ TOCA ESTE FICHERO
--   Solo añade funciones nuevas. No crea, borra ni modifica ninguna tabla,
--   columna, dato ni política de RLS. La app no llama a nada de esto.
--
-- COMUNIDAD NO ES GRUPO (PANEL-ADMIN.md §4)
--   - Grupo: lo crea cualquiera con sus Spots confirmados y escriben todos.
--     El panel no los administra, solo los modera.
--   - Comunidad: la crea Spotter, entra cualquiera y solo escriben quienes la
--     administran. Las dos que hay hoy se crearon a mano con SQL. Esto es lo
--     que estas funciones vienen a sustituir.
--   Por eso todas comprueban `group_type = 'community'`: desde el panel no se
--   puede tocar por error el grupo privado de nadie.
--
-- UNA COMUNIDAD NO SE BORRA
--   `admin_delete_community` marca `deleted_at`, como todo en este esquema.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. admin_metrics() — la pantalla de inicio
-- -----------------------------------------------------------------------------
-- Cuatro números y poco más, no un cuadro de mando (§6.2). El primero es el que
-- importa: cuántas denuncias esperan y desde cuándo espera la más antigua, que
-- es la promesa de 24 horas de las condiciones de uso.
-- -----------------------------------------------------------------------------
create or replace function public.admin_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'denuncias_pendientes', (
      select count(*) from public.reports
       where status in ('pending', 'reviewing') and deleted_at is null
    ),
    -- Horas que lleva esperando la denuncia sin atender más antigua.
    'espera_mas_larga_horas', (
      select round(extract(epoch from (now() - min(created_at))) / 3600)
        from public.reports
       where status = 'pending' and deleted_at is null
    ),
    'personas_activas', (
      select count(*) from public.users
       where status = 'active' and deleted_at is null
    ),
    'altas_semana', (
      select count(*) from public.users
       where created_at >= now() - interval '7 days' and deleted_at is null
    ),
    'spots_confirmados_semana', (
      select count(*) from public.matches
       where status = 'matched'
         and matched_at >= now() - interval '7 days'
         and deleted_at is null
    ),
    'conversaciones_vivas', (
      select count(*) from public.chats
       where last_message_at >= now() - interval '7 days' and deleted_at is null
    ),
    'comunidades', (
      select count(*) from public.groups
       where group_type = 'community' and deleted_at is null
    ),
    'sitios_por_revisar', (select count(*) from public.v_places_por_revisar)
  );
end;
$$;

comment on function public.admin_metrics() is
  'Los numeros de la pantalla de inicio del panel. El primero es cuantas denuncias esperan y desde cuando.';


-- -----------------------------------------------------------------------------
-- 2. admin_communities() — el listado
-- -----------------------------------------------------------------------------
create or replace function public.admin_communities(
  p_limit  integer default 100,
  p_offset integer default 0
)
returns table (
  id              uuid,
  name            text,
  description     text,
  photo_url       text,
  visibility      public.visibility_enum,
  sport_id        uuid,
  sport_name      text,
  place_id        uuid,
  place_name      text,
  area_name       text,
  members_count   integer,
  max_members     smallint,
  last_message_at timestamptz,
  created_at      timestamptz
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
    select g.id, g.name::text, g.description, g.photo_url, g.visibility,
           g.sport_id, s.name::text, g.place_id, p.name::text, g.area_name::text,
           g.members_count, g.max_members, g.last_message_at, g.created_at
      from public.groups g
      left join public.sports s on s.id = g.sport_id
      left join public.places p on p.id = g.place_id
     where g.group_type = 'community'
       and g.deleted_at is null
     order by g.created_at desc
     limit greatest(p_limit, 0)
    offset greatest(p_offset, 0);
end;
$$;

comment on function public.admin_communities(integer, integer) is
  'Comunidades vivas, de la mas nueva a la mas antigua. Los grupos de la gente no salen aqui.';


-- -----------------------------------------------------------------------------
-- 3. admin_create_community() — crear sin tocar SQL
-- -----------------------------------------------------------------------------
-- IMPORTANTE, QUIÉN ESCRIBE DESPUÉS
--   En una comunidad solo pueden escribir los miembros con papel `admin` o
--   `moderator`, y escriben desde la app con su propia cuenta (lo exige la
--   política `messages_write`). La cuenta del panel NO sirve para eso: es una
--   ficha sin alta terminada, nadie entra en la app con ella.
--
--   Por eso está `p_admin_username`: el nombre de usuario en la app de quien va
--   a llevar la comunidad. Es el gimnasio, la marca, o la cuenta personal de
--   quien la vaya a mantener. Se le deja dentro como administradora y puede
--   escribir desde el primer momento.
--
--   Si se deja vacío, la comunidad nace sin nadie que pueda escribir en ella.
--   Se arregla después con `admin_set_community_member`, pero es mejor no
--   dejarla así: una comunidad muda no le sirve a nadie.
--
--   Quien figura como creadora sigue siendo la cuenta del panel, a propósito:
--   así la comunidad es de Spotter y el gimnasio no se la puede llevar.
--
-- El `slug` se saca del nombre y, si ya estuviera cogido, se le añade un trozo
-- del identificador: es una dirección, no un nombre visible.
-- -----------------------------------------------------------------------------
create or replace function public.admin_create_community(
  p_name           text,
  p_description    text                    default null,
  p_photo_url      text                    default null,
  p_sport_id       uuid                    default null,
  p_place_id       uuid                    default null,
  p_area_name      text                    default null,
  p_visibility     public.visibility_enum  default 'public',
  p_max_members    smallint                default null,
  p_admin_username text                    default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creador uuid;
  v_gestor  uuid;
  v_slug    text;
  v_id      uuid;
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  if coalesce(btrim(p_name), '') = '' then
    raise exception 'la comunidad necesita un nombre' using errcode = '22023';
  end if;

  v_creador := public.asegurar_perfil_staff();

  -- La cuenta de la app que llevará la comunidad, si se ha indicado.
  if coalesce(btrim(p_admin_username), '') <> '' then
    select id into v_gestor
      from public.users
     where lower(username) = lower(btrim(p_admin_username))
       and deleted_at is null;

    if v_gestor is null then
      raise exception 'no existe la cuenta %, revisa el nombre de usuario en la app',
        btrim(p_admin_username) using errcode = 'P0002';
    end if;
  end if;

  v_slug := btrim(regexp_replace(lower(public.sin_acentos(p_name)), '[^a-z0-9]+', '-', 'g'), '-');
  if v_slug = '' then
    v_slug := 'comunidad';
  end if;
  if exists (select 1 from public.groups where slug = v_slug) then
    v_slug := v_slug || '-' || left(replace(gen_random_uuid()::text, '-', ''), 4);
  end if;

  insert into public.groups
    (group_type, slug, name, description, photo_url, created_by_id,
     sport_id, place_id, area_name, visibility, max_members)
  values
    ('community', v_slug, btrim(p_name), p_description, p_photo_url, v_creador,
     p_sport_id, p_place_id, p_area_name, p_visibility, p_max_members)
  returning id into v_id;

  -- La cuenta del panel entra como administradora para poder gestionarla,
  -- aunque no escriba: quien escribe es la cuenta de la app de abajo.
  insert into public.group_users (group_id, user_id, role, status, joined_at)
  values (v_id, v_creador, 'admin', 'active', now());

  if v_gestor is not null and v_gestor <> v_creador then
    insert into public.group_users (group_id, user_id, role, status, joined_at, invited_by_id)
    values (v_id, v_gestor, 'admin', 'active', now(), v_creador);
  end if;

  return v_id;
end;
$$;

comment on function public.admin_create_community(text, text, text, uuid, uuid, text, public.visibility_enum, smallint, text) is
  'Crea una comunidad y deja dentro como administradora a la cuenta de la app indicada, que sera la que pueda escribir.';


-- -----------------------------------------------------------------------------
-- 4. admin_update_community() — editar
-- -----------------------------------------------------------------------------
-- Todos los campos son opcionales: lo que se deja sin rellenar no se toca.
-- Para vaciar la descripción o la foto se manda la cadena vacía.
-- -----------------------------------------------------------------------------
create or replace function public.admin_update_community(
  p_group_id    uuid,
  p_name        text                   default null,
  p_description text                   default null,
  p_photo_url   text                   default null,
  p_sport_id    uuid                   default null,
  p_place_id    uuid                   default null,
  p_area_name   text                   default null,
  p_visibility  public.visibility_enum default null,
  p_max_members smallint               default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  update public.groups
     set name        = coalesce(nullif(btrim(p_name), ''), name),
         description = case when p_description is null then description
                            when btrim(p_description) = '' then null
                            else p_description end,
         photo_url   = case when p_photo_url is null then photo_url
                            when btrim(p_photo_url) = '' then null
                            else p_photo_url end,
         sport_id    = coalesce(p_sport_id, sport_id),
         place_id    = coalesce(p_place_id, place_id),
         area_name   = coalesce(nullif(btrim(p_area_name), ''), area_name),
         visibility  = coalesce(p_visibility, visibility),
         max_members = coalesce(p_max_members, max_members),
         updated_at  = now()
   where id = p_group_id
     and group_type = 'community'
     and deleted_at is null;

  if not found then
    raise exception 'comunidad no encontrada' using errcode = 'P0002';
  end if;
end;
$$;

comment on function public.admin_update_community(uuid, text, text, text, uuid, uuid, text, public.visibility_enum, smallint) is
  'Edita una comunidad. Lo que va vacio no se toca; para borrar un texto se manda la cadena vacia.';


-- -----------------------------------------------------------------------------
-- 5. admin_delete_community() — retirar una comunidad
-- -----------------------------------------------------------------------------
create or replace function public.admin_delete_community(
  p_group_id uuid,
  p_reason   text
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

  v_moderator := public.asegurar_perfil_staff();

  update public.groups
     set deleted_at = now(), updated_at = now()
   where id = p_group_id
     and group_type = 'community'
     and deleted_at is null;

  if not found then
    raise exception 'comunidad no encontrada' using errcode = 'P0002';
  end if;

  -- Queda rastro, como con las personas. Sin `target_user_id`: no señala a nadie.
  insert into public.moderation_actions (moderator_id, action, scope, reason)
  values (v_moderator, 'content_removal', 'group', p_reason);
end;
$$;

comment on function public.admin_delete_community(uuid, text) is
  'Marca una comunidad como retirada. No borra la fila: aqui no se borra nada.';


-- -----------------------------------------------------------------------------
-- 6. admin_community_members() — quién está dentro
-- -----------------------------------------------------------------------------
create or replace function public.admin_community_members(p_group_id uuid)
returns table (
  user_id      uuid,
  display_name text,
  username     text,
  role         public.group_role_enum,
  status       public.group_user_status_enum,
  joined_at    timestamptz,
  user_status  public.user_status_enum
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
    select gu.user_id, u.display_name::text, u.username::text,
           gu.role, gu.status, gu.joined_at, u.status
      from public.group_users gu
      join public.users u on u.id = gu.user_id
     where gu.group_id = p_group_id
       and gu.deleted_at is null
     order by gu.role, gu.joined_at nulls last;
end;
$$;

comment on function public.admin_community_members(uuid) is
  'Miembros de una comunidad, con su papel dentro y el estado de su cuenta.';


-- -----------------------------------------------------------------------------
-- 7. admin_set_community_member() — dar papeles y quitar gente
-- -----------------------------------------------------------------------------
-- Con `p_status = 'left'` se saca a alguien de la comunidad; con `'banned'`, se
-- le impide volver a entrar. Solo funciona sobre comunidades: los grupos de la
-- gente se moderan desde la denuncia, no desde aquí.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_community_member(
  p_group_id uuid,
  p_user_id  uuid,
  p_role     public.group_role_enum        default null,
  p_status   public.group_user_status_enum default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.groups
     where id = p_group_id and group_type = 'community' and deleted_at is null
  ) then
    raise exception 'comunidad no encontrada' using errcode = 'P0002';
  end if;

  update public.group_users
     set role       = coalesce(p_role, role),
         status     = coalesce(p_status, status),
         updated_at = now()
   where group_id = p_group_id
     and user_id  = p_user_id
     and deleted_at is null;

  if not found then
    raise exception 'esa persona no esta en la comunidad' using errcode = 'P0002';
  end if;
end;
$$;

comment on function public.admin_set_community_member(uuid, uuid, public.group_role_enum, public.group_user_status_enum) is
  'Cambia el papel o el estado de un miembro de una comunidad.';


-- -----------------------------------------------------------------------------
-- 8. admin_places_por_revisar() — los sitios que da de alta la gente
-- -----------------------------------------------------------------------------
-- La vista ya existe y ya trae el contexto (vecinos a 200 m, altas de esa
-- cuenta en 24 horas). Esto solo la deja leer al panel. Para aprobar o rechazar
-- se usa la función que ya existe: `moderar_sitio(p_place_id, p_aprobado, p_nota)`.
-- -----------------------------------------------------------------------------
create or replace function public.admin_places_por_revisar()
returns setof public.v_places_por_revisar
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  return query select * from public.v_places_por_revisar;
end;
$$;

comment on function public.admin_places_por_revisar() is
  'Sitios dados de alta por la gente que esperan revision. Para aprobarlos o rechazarlos se usa moderar_sitio.';


-- -----------------------------------------------------------------------------
-- 9. Permisos
-- -----------------------------------------------------------------------------
revoke all on function public.admin_metrics()                                                                                                             from public;
revoke all on function public.admin_communities(integer, integer)                                                                                         from public;
revoke all on function public.admin_create_community(text, text, text, uuid, uuid, text, public.visibility_enum, smallint, text)                                from public;
revoke all on function public.admin_update_community(uuid, text, text, text, uuid, uuid, text, public.visibility_enum, smallint)                          from public;
revoke all on function public.admin_delete_community(uuid, text)                                                                                          from public;
revoke all on function public.admin_community_members(uuid)                                                                                               from public;
revoke all on function public.admin_set_community_member(uuid, uuid, public.group_role_enum, public.group_user_status_enum)                               from public;
revoke all on function public.admin_places_por_revisar()                                                                                                  from public;

grant execute on function public.admin_metrics()                                                                                                          to authenticated;
grant execute on function public.admin_communities(integer, integer)                                                                                      to authenticated;
grant execute on function public.admin_create_community(text, text, text, uuid, uuid, text, public.visibility_enum, smallint, text)                             to authenticated;
grant execute on function public.admin_update_community(uuid, text, text, text, uuid, uuid, text, public.visibility_enum, smallint)                       to authenticated;
grant execute on function public.admin_delete_community(uuid, text)                                                                                       to authenticated;
grant execute on function public.admin_community_members(uuid)                                                                                            to authenticated;
grant execute on function public.admin_set_community_member(uuid, uuid, public.group_role_enum, public.group_user_status_enum)                             to authenticated;
grant execute on function public.admin_places_por_revisar()                                                                                               to authenticated;


-- =============================================================================
-- PARA DESHACERLO ENTERO
--   drop function if exists public.admin_places_por_revisar();
--   drop function if exists public.admin_set_community_member(uuid, uuid, public.group_role_enum, public.group_user_status_enum);
--   drop function if exists public.admin_community_members(uuid);
--   drop function if exists public.admin_delete_community(uuid, text);
--   drop function if exists public.admin_update_community(uuid, text, text, text, uuid, uuid, text, public.visibility_enum, smallint);
--   drop function if exists public.admin_create_community(text, text, text, uuid, uuid, text, public.visibility_enum, smallint, text);
--   drop function if exists public.admin_communities(integer, integer);
--   drop function if exists public.admin_metrics();
-- =============================================================================
