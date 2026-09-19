-- ============================================================
-- Quantro · İstemci hata raporlama tablosu (opsiyonel)
-- src: api/report.js — tarayıcı global error'ları buraya yazılır.
-- Yalnızca service-role erişimi vardır; RLS kapalı PUBLIC yazma.
-- ============================================================
create table if not exists public.errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text,
  stack text,
  page text,
  lang text,
  ua text,
  ip text
);

alter table public.errors enable row level security;

-- Sadece sunucu (service-role) tarafı: istemci hiçbir yetkisi yok
drop policy if exists "errors none" on public.errors;
create policy "errors none" on public.errors
  for all using (false) with check (false);

-- Admin görüntüleme (opsiyonel): service-role token'ı doğrudan geçerli
drop policy if exists "errors admin read" on public.errors;
create policy "errors admin read" on public.errors
  for select using (
    (select auth.jwt() ->> 'role'::text) = 'service_role'
    or (select auth.jwt() ->> 'role'::text) = 'admin'
  );

create index if not exists errors_created_at_idx on public.errors (created_at desc);