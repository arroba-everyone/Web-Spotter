-- =============================================================================
-- Panel de administración: meter a alguien en una comunidad
-- Proyecto de Supabase: Spotter (tjbofdfdtpwlybgyaber). NO es el de la web.
-- Escrito el 27/09/2026.
-- =============================================================================
--
-- EL FALLO QUE ARREGLA
--   `admin_set_community_member` solo cambiaba el papel de quien YA estaba
--   dentro. Pero el caso normal es justo el contrario: acabas de crear la
--   comunidad del gimnasio y quieres darle la administración a una cuenta que
--   todavía no ha entrado. Antes eso fallaba con «esa persona no esta en la
--   comunidad», que es verdad y no sirve de nada.
--
-- QUÉ AÑADE
--   Una función que busca la cuenta por su nombre de usuario exacto y la mete
--   en la comunidad con el papel que se le diga. Si ya estaba, le cambia el
--   papel; si se había ido, vuelve a entrar.
--
--   Solo funciona sobre comunidades. En los grupos de la gente el panel no
--   mete a nadie: eso es cosa de quien los creó.
--
-- NO TOCA NINGUNA TABLA. Solo añade una función.
-- =============================================================================

create or replace function public.admin_add_community_member(
  p_group_id uuid,
  p_username text,
  p_role     public.group_role_enum default 'admin'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creador uuid;
  v_persona uuid;
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

  -- Por nombre de usuario exacto: parecerse no basta cuando se reparte mando.
  -- La arroba se quita aqui tambien: escribirla es lo normal al copiar un perfil.
  select id into v_persona
    from public.users
   where lower(username) = lower(ltrim(btrim(p_username), '@'))
     and deleted_at is null;

  if v_persona is null then
    raise exception 'no existe la cuenta %, revisa el nombre de usuario en la app',
      btrim(p_username) using errcode = 'P0002';
  end if;

  v_creador := public.asegurar_perfil_staff();

  -- Si ya tiene fila en la comunidad se actualiza, aunque se hubiera ido.
  update public.group_users
     set role       = p_role,
         status     = 'active',
         deleted_at = null,
         joined_at  = coalesce(joined_at, now()),
         updated_at = now()
   where group_id = p_group_id
     and user_id  = v_persona;

  if not found then
    insert into public.group_users (group_id, user_id, role, status, joined_at, invited_by_id)
    values (p_group_id, v_persona, p_role, 'active', now(), v_creador);
  end if;

  return v_persona;
end;
$$;

comment on function public.admin_add_community_member(uuid, text, public.group_role_enum) is
  'Mete a una cuenta de la app en una comunidad con el papel indicado, buscandola por su nombre de usuario exacto. Si ya estaba, le cambia el papel.';

revoke all    on function public.admin_add_community_member(uuid, text, public.group_role_enum) from public;
grant execute on function public.admin_add_community_member(uuid, text, public.group_role_enum) to authenticated;


-- =============================================================================
-- PARA DESHACERLO
--   drop function if exists public.admin_add_community_member(uuid, text, public.group_role_enum);
-- =============================================================================
