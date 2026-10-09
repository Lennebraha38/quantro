-- ═══════════════════════════════════════════════════════════════
-- Quantro GRID · grid_results
-- Her tarayicidan gelen dogrulanmis Monte Carlo is birimi.
-- Yalnizca API (service role) yazar; anon istemciye dogrudan
-- tablo erisimi kapalidir (RLS acik, public policy yok).
-- Uygulama: Supabase SQL Editor'de bir kez calistirin.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.grid_results (
  id          bigint generated always as identity primary key,
  unit_id     text not null unique,
  experiment  text not null,
  theta       double precision not null,
  seed        bigint,
  shots       integer not null check (shots > 0 and shots <= 65536),
  counts      jsonb not null,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index if not exists grid_results_experiment_idx on public.grid_results (experiment);
create index if not exists grid_results_created_idx on public.grid_results (created_at desc);
create index if not exists grid_results_theta_idx on public.grid_results (theta);

alter table public.grid_results enable row level security;

-- Public policy YOK: anon/authenticated anahtarlarla dogrudan okuma/yazma kapali.
-- Okuma yalnizca /api/grid/stats uzerinden (service role) yapilir; boylece
-- ham IP ozeti ve veri manipule edilemez.

comment on table public.grid_results is
  'Quantro GRID: dogrulanmis dagitik Monte Carlo is birimleri. unit_id ile idempotent; sunucu sonucu (theta,seed) ciftinden yeniden uretip dogrular.';
