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

-- Küçük harfe normalize edilmiş benzersizlik
create unique index if not exists newsletters_email_lower_idx
  on public.newsletters (lower(email));

-- GİZLİLİK: RLS aç (anon hiçbir şey okuyup yazamaz). Yazma yalnızca
-- service_role üzerinden yapılır; service_role RLS'i otomatik baypas eder,
-- bu yüzden ayrı bir insert politikası gerekmez.
alter table public.newsletters enable row level security;

comment on table public.newsletters is
  'Quantro bülten aboneleri — KVKK 6698 kapsamında yalnızca bülten için kullanılır.';