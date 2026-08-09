-- ═══════════════════════════════════════════════════════════════
-- QUANTRO · Güvenlik Sertleştirme (RLS)
-- Supabase Dashboard → SQL Editor'a yapıştırıp RUN deyin.
--
-- NE YAPAR?
-- • blog_posts: anon (yayınlanabilir anahtar) YALNIZCA yayınlanmış
--   yazıları okuyabilir. Yazma/güncelleme/silme HİÇBİR tarayıcı
--   tarafından yapılamaz; yalnız sunucu (service_role) yapabilir.
-- • blog_comments: anon yalnızca ONAYLI yorumları okuyabilir.
--   Yorum eklemek /api/comments üzerinden sunucu ile yapılır;
--   tarayıcıdan doğrudan INSERT yapılamaz. Onaylama/silme yalnız
--   admin (service_role) içindir.
-- • contact_messages: anon yalnızca form gönderebilir (INSERT).
--   Okuma/güncelleme/silme yalnız sunucuya açıktır — ziyaretçi
--   mesajları artık tarayıcıdan okunamaz.
-- ═══════════════════════════════════════════════════════════════

-- ── BLOG YAZILARI ──
alter table public.blog_posts enable row level security;

drop policy if exists "anon_blog_read_published" on public.blog_posts;
create policy "anon_blog_read_published"
  on public.blog_posts
  for select
  to anon
  using (published = true);

-- ── BLOG YORUMLARI ──
create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  name text not null,
  email text,
  content text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.blog_comments enable row level security;

drop policy if exists "anon_comment_read_approved" on public.blog_comments;
create policy "anon_comment_read_approved"
  on public.blog_comments
  for select
  to anon
  using (is_approved = true);

-- NOT: blog_comments için anon INSERT yetkisi VERİLMEDİ. Yorumlar
-- yalnızca /api/comments (service_role) üzerinden eklenir; böylece
-- spam doğrulaması sunucuda yapılır.

-- ── İLETİŞİM MESAJLARI ──
alter table public.contact_messages enable row level security;

drop policy if exists "anon_msg_insert" on public.contact_messages;
create policy "anon_msg_insert"
  on public.contact_messages
  for insert
  to anon
  with check (true);

-- ── DOĞRULAMA ──
-- Aşağıdaki sorgular 0 satır döndürmeli (anon yazamıyor/okuyamıyor olmalı):
--
-- select count(*) from public.blog_posts where published = false;  -- anon olarak
-- select * from public.contact_messages;                            -- anon olarak
-- select * from public.blog_comments where is_approved = false;     -- anon olarak
-- insert into public.blog_comments (post_slug,name,content) values ('x','y','z'); -- anon olarak HATA vermeli
--
-- NOT: service_role anahtarı RLS'yi OTOMATİK olarak atlar. Sitenin
-- /api/* uçları bu anahtarı kullandığı için admin işlemleri etkilenmez.
