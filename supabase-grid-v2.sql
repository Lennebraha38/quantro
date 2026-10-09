-- ═══════════════════════════════════════════════════════════════
-- Quantro GRID · v2 migrasyonu
--   1. node_id kolonu (pseudonim istemci kimliği, liderlik için)
--   2. ip_hash + zaman indeksi (günlük katkı sayımı için)
--   3. grid_summary(): TEK çağrıda özet + 48 bin
--      (PostgREST toplama fonksiyonları bu projede kapalı: PGRST123)
--   4. grid_leaderboard(): node_id bazında liderlik
-- Uygulama: SQL Editor'de bir kez VEYA Management API ile.
-- Yalnızca service_role çağırabilir.
-- ═══════════════════════════════════════════════════════════════

alter table public.grid_results add column if not exists node_id text;

create index if not exists grid_results_node_idx on public.grid_results (node_id);
create index if not exists grid_results_ip_time_idx
  on public.grid_results (ip_hash, created_at desc);

-- ── Özet (toplam + düğüm + 48 bin) ──────────────────────────────
create or replace function public.grid_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
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
        group by 1
      ) b on b.bi = i
    ), '[]'::jsonb)
  )
  from public.grid_results;
$$;

-- ── Liderlik (node_id, kısaltılmış) ─────────────────────────────
create or replace function public.grid_leaderboard(p_limit int default 10)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  from (
    select left(node_id, 8) as node,
           count(*) as units,
           sum(shots) as shots
    from public.grid_results
    where node_id is not null
    group by node_id
    order by units desc, shots desc
    limit greatest(1, least(p_limit, 50))
  ) t;
$$;

-- ── Yalnızca service_role ───────────────────────────────────────
revoke all on function public.grid_summary() from public, anon, authenticated;
revoke all on function public.grid_leaderboard(int) from public, anon, authenticated;
grant execute on function public.grid_summary() to service_role;
grant execute on function public.grid_leaderboard(int) to service_role;
