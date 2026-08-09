-- ═══════════════════════════════════════════════════════════════
-- QUANTRO · Güvenlik Sertleştirme (RLS)
-- Supabase Dashboard → SQL Editor'a yapıştırıp RUN deyin.
--
-- NE YAPAR?
-- • blog_posts: anon (yayınlanabilir anahtar) YALNIZCA yayınlanmış
--   yazıları okuyabilir. Yazma/güncelleme/silme HİÇBİR tarayıcı
--   tarafından yapılamaz; yalnız sunucu (service_role) yapabilir.
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
--
-- NOT: service_role anahtarı RLS'yi OTOMATİK olarak atlar. Sitenin
-- /api/* uçları bu anahtarı kullandığı için admin işlemleri etkilenmez.
