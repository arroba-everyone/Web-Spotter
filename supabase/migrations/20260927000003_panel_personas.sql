-- =============================================================================
-- Panel de administración: la pantalla de Personas
-- Proyecto de Supabase: Spotter (tjbofdfdtpwlybgyaber). NO es el de la web.
-- Escrito el 27/09/2026. Corresponde al §6.4 de PANEL-ADMIN.md.
-- Se aplica DESPUÉS de 20260927000001_panel_admin.sql, del que usa `es_staff()`.
-- =============================================================================
--
-- QUÉ TOCA ESTE FICHERO
--   Solo añade dos funciones de lectura. No escribe nada. Para suspender o
--   reactivar se usa `admin_set_user_status`, que está en el primer fichero.
--
-- LO QUE NO DEVUELVE, A PROPÓSITO
--   - `users.location`: la ubicación exacta no sale del servidor (§4). El panel
--     trabaja con la ciudad, igual que la app.
--   - Los chats de nadie: leer conversaciones no es una función del panel. Solo
--     se ve lo que alguien ha denunciado, y eso va por `admin_report_context`.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. admin_search_users() — buscar por nombre o usuario
-- -----------------------------------------------------------------------------
-- Busca sin distinguir mayúsculas ni acentos: «alvaro» encuentra a «Álvaro».
-- Por eso pasa las dos partes por `sin_acentos`, que ya usa el buscador de
-- sitios de la app.
-- -----------------------------------------------------------------------------
create or replace function public.admin_search_users(
  p_query text    default null,
  p_limit integer default 50
)
returns table (
  id                   uuid,
  display_name         text,
  username             text,
  status               public.user_status_enum,
  city_name            text,
  created_at           timestamptz,
  last_active_at       timestamptz,
  denuncias_recibidas  bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_patron text;
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  v_patron := '%' || lower(public.sin_acentos(coalesce(btrim(p_query), ''))) || '%';

  return query
    select u.id, u.display_name::text, u.username::text, u.status,
           u.city_name::text, u.created_at, u.last_active_at,
           coalesce((
             select count(*) from public.reports r
              where r.reported_user_id = u.id and r.deleted_at is null
           ), 0)
      from public.users u
     where u.deleted_at is null
       and (
         coalesce(btrim(p_query), '') = ''
         or lower(public.sin_acentos(u.display_name)) like v_patron
         or lower(public.sin_acentos(u.username))     like v_patron
       )
     -- Quien más denuncias acumula, primero: es a quien hay que mirar.
     order by 8 desc, u.last_active_at desc nulls last
     limit greatest(p_limit, 0);
end;
$$;

comment on function public.admin_search_users(text, integer) is
  'Busca personas por nombre o usuario para la pantalla de Personas. Sin texto, devuelve las que mas denuncias acumulan.';


-- -----------------------------------------------------------------------------
-- 2. admin_user_detail() — la ficha
-- -----------------------------------------------------------------------------
-- Lo público del perfil, el estado de la cuenta, sus fotos, las denuncias que
-- ha recibido y lo que se ha hecho con ella. Las fotos vienen con su
-- `storage_key`: el enlace hay que firmarlo aparte, porque el cajón es privado.
-- -----------------------------------------------------------------------------
create or replace function public.admin_user_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user public.users%rowtype;
begin
  if not public.es_staff() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  select * into v_user from public.users where id = p_user_id;

  if not found then
    raise exception 'persona no encontrada' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'persona', jsonb_build_object(
      'id',             v_user.id,
      'display_name',   v_user.display_name,
      'username',       v_user.username,
      'status',         v_user.status,
      'bio',            v_user.bio,
      'city_name',      v_user.city_name,
      'language',       v_user.language,
      'birth_date',     v_user.birth_date,
      'created_at',     v_user.created_at,
      'last_active_at', v_user.last_active_at,
      'deleted_at',     v_user.deleted_at
    ),

    'deportes', coalesce((
      select jsonb_agg(jsonb_build_object('sport', s.name, 'skill_level', us.skill_level)
                       order by s.name)
        from public.user_sports us
        join public.sports s on s.id = us.sport_id
       where us.user_id = p_user_id and us.deleted_at is null
    ), '[]'::jsonb),

    'fotos', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'storage_key', f.storage_key,
                                          'is_primary', f.is_primary,
                                          'moderation_status', f.moderation_status)
                       order by f.position)
        from public.user_photos f
       where f.user_id = p_user_id and f.deleted_at is null
    ), '[]'::jsonb),

    'denuncias_recibidas', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'reason', r.reason, 'status', r.status,
                                          'target_type', r.target_type, 'created_at', r.created_at)
                       order by r.created_at desc)
        from public.reports r
       where r.reported_user_id = p_user_id and r.deleted_at is null
    ), '[]'::jsonb),

    'acciones', coalesce((
      select jsonb_agg(jsonb_build_object('action', a.action, 'reason', a.reason,
                                          'expires_at', a.expires_at, 'created_at', a.created_at)
                       order by a.created_at desc)
        from public.moderation_actions a
       where a.target_user_id = p_user_id and a.deleted_at is null
    ), '[]'::jsonb)
  );
end;
$$;

comment on function public.admin_user_detail(uuid) is
  'Ficha de una persona para el panel: perfil publico, fotos, denuncias recibidas y acciones tomadas. Sin ubicacion y sin chats.';


-- -----------------------------------------------------------------------------
-- 3. Permisos
-- -----------------------------------------------------------------------------
revoke all on function public.admin_search_users(text, integer) from public;
revoke all on function public.admin_user_detail(uuid)           from public;

grant execute on function public.admin_search_users(text, integer) to authenticated;
grant execute on function public.admin_user_detail(uuid)           to authenticated;


-- =============================================================================
-- PARA DESHACERLO
--   drop function if exists public.admin_user_detail(uuid);
--   drop function if exists public.admin_search_users(text, integer);
-- =============================================================================
