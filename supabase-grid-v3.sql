-- ═══════════════════════════════════════════════════════════════
-- Quantro GRID · v3 migrasyonu
--   grid_summary'i deney bazinda filtrelenebilir yapar.
--   Donen: { shots, units, nodes, bins, totalShots, totalUnits, totalNodes }
--   - shots/units/nodes/bins : p_experiment (null => tum deneyler)
--   - total*                 : her zaman tum deneyler (baslik toplamlari)
-- Not: PostgREST toplama fonksiyonlari kapali (PGRST123); toplam
-- SQL icinde yapilir. Yalnizca service_role cagirabilir.
-- ═══════════════════════════════════════════════════════════════

drop function if exists public.grid_summary();

create or replace function public.grid_summary(p_experiment text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'shots', coalesce(sum(shots), 0),
    'units', count(*),
    'nodes', count(distinct ip_hash),
    'bins', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'theta', (i + 0.5) * (2 * pi() / 48.0),
          'shots', coalesce(b.shots, 0),
          'p00', case when coalesce(b.shots, 0) > 0 then b.s00::float / b.shots else 0 end,
          'p11', case when coalesce(b.shots, 0) > 0 then b.s11::float / b.shots else 0 end
        ) order by i
      )
      from generate_series(0, 47) as i
      left join (
        select width_bucket(theta, 0, 2 * pi(), 48) - 1 as bi,
               sum(shots) as shots,
               sum(coalesce((counts ->> 0)::int, 0)) as s00,
               sum(coalesce((counts ->> 3)::int, 0)) as s11
        from public.grid_results
        where p_experiment is null or experiment = p_experiment
        group by 1
      ) b on b.bi = i
    ), '[]'::jsonb)
  )
  into result
  from public.grid_results
  where p_experiment is null or experiment = p_experiment;

  select result || jsonb_build_object(
    'totalShots', coalesce(sum(shots), 0),
    'totalUnits', count(*),
    'totalNodes', count(distinct ip_hash)
  )
  into result
  from public.grid_results;

  return result;
end;
$$;

revoke all on function public.grid_summary(text) from public, anon, authenticated;
grant execute on function public.grid_summary(text) to service_role;
