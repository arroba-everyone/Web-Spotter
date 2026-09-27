-- =============================================================================
-- Panel de administración: la evolución por semanas, para las gráficas
-- Proyecto de Supabase: Spotter (tjbofdfdtpwlybgyaber). NO es el de la web.
-- Escrito el 27/09/2026.
-- =============================================================================
--
-- POR SEMANAS Y NO POR DÍAS
--   Con los números de hoy (unos pocos Spots al día) una gráfica diaria son
--   catorce ceros y dos palitos: no se lee nada. Por semanas se ve la forma.
--   Cuando la app tenga más movimiento, se cambia el `date_trunc` y ya está.
--
-- POR QUÉ NO SALEN LAS ALTAS
--   La semana del 31/08 hay 743 altas de golpe: es la importación de la v1, no
--   gente que llegó sola. En una gráfica esa barra aplasta a todas las demás y
--   cuenta una mentira. Las altas se quedan como número suelto.
--
-- NO TOCA NINGUNA TABLA. Solo añade una función de lectura.
-- =============================================================================

create or replace function public.admin_series(p_semanas integer default 8)
returns table (
  semana      date,
  spots       bigint,
  mensajes    bigint,
  denuncias   bigint
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
    with semanas as (
      select generate_series(
               date_trunc('week', now()) - make_interval(weeks => greatest(p_semanas, 1) - 1),
               date_trunc('week', now()),
               interval '1 week'
             )::date as semana
    )
    select s.semana,
           (select count(*) from public.matches m
             where m.status = 'matched'
               and date_trunc('week', m.matched_at)::date = s.semana
               and m.deleted_at is null),
           (select count(*) from public.messages me
             where date_trunc('week', me.created_at)::date = s.semana
               and me.deleted_at is null),
           (select count(*) from public.reports r
             where date_trunc('week', r.created_at)::date = s.semana
               and r.deleted_at is null)
      from semanas s
     order by s.semana;
end;
$$;

comment on function public.admin_series(integer) is
  'Spots confirmados, mensajes y denuncias por semana, para las graficas del inicio del panel.';

revoke all    on function public.admin_series(integer) from public;
grant execute on function public.admin_series(integer) to authenticated;


-- =============================================================================
-- PARA DESHACERLO
--   drop function if exists public.admin_series(integer);
-- =============================================================================
