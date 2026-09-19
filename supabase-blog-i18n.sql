-- ============================================================
-- Quantro · Blog içerik çevirileri (blog_posts_i18n)
-- blog-articles/<slug>.<lang>.md kaynakları tools/import-blog.mjs
-- ile bu tabloya yüklenir. Her satır: (slug, lang) → içerik.
-- Okuma: anon (herkes) · Yazma: yalnızca service-role.
-- ============================================================
create table if not exists public.blog_posts_i18n (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  lang text not null default 'tr',
  title text not null default '',
  summary text not null default '',
  content text not null default '',
  updated_at timestamptz not null default now(),
  constraint blog_posts_i18n_uniq unique (slug, lang)
);

alter table public.blog_posts_i18n enable row level security;

-- Herkes çevirileri okuyabilir (blog.html anon key ile çeker)
drop policy if exists "blog_posts_i18n public read" on public.blog_posts_i18n;
create policy "blog_posts_i18n public read" on public.blog_posts_i18n
  for select using (true);

-- Yazma yalnızca sunucu: anon INSERT/UPDATE/DELETE kapalı
drop policy if exists "blog_posts_i18n service write" on public.blog_posts_i18n;
create policy "blog_posts_i18n service write" on public.blog_posts_i18n
  for all using (
    (select auth.jwt() ->> 'role'::text) = 'service_role'
  ) with check (
    (select auth.jwt() ->> 'role'::text) = 'service_role'
  );

create index if not exists blog_posts_i18n_lang_idx on public.blog_posts_i18n (lang);