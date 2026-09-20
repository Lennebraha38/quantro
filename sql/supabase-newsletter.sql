-- ═══════════════════════════════════════════════════════════
-- Quantro · Bülten aboneliği şeması (Supabase)
-- Not: Bu tablo yeniden kurulduğunda eski dönemde backend çevrimdışı
-- iken toplanan kayıtlar (api/newsletter.js bellekte) senkronize edilebilir.
-- ═══════════════════════════════════════════════════════════

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  lang text default 'tr',
  source text default 'site',
  created_at timestamptz default now(),
  constraint newsletters_email_key unique (email)
);

-- Küçük harfe normalize et ve tekilleştir
create unique index if not exists newsletters_email_lower_idx
  on public.newsletters (lower(email));

alter table public.newsletters enable row level security;

-- İstemci (anon) doğrudan yazamaz; yalnızca service_role üzerinden
-- api/newsletter.js yazar. Okuma da kapalı (gizlilik).
drop policy if exists "newsletters_insert_via_service" on public.newsletters;
create policy "newsletters_insert_via_service"
  on public.newsletters for insert
  to service_role with check (true);

comment on table public.newsletters is
  'Quantro bülten aboneleri — KVKK 6698 kapsamında yalnızca bülten için kullanılır.';