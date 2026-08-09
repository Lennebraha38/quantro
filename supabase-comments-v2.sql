-- ═══════════════════════════════════════════════════════════════
-- QUANTRO · Yorum v2 (beğeni + yanıt) Migration
-- Supabase Dashboard → SQL Editor'a yapıştırıp RUN deyin.
--
-- NE YAPAR?
-- • blog_comments tablosuna "likes" (beğeni sayacı) ve "parent_id"
--   (yanıt için üst yorum) sütunları ekler.
-- • Yazı beğenisini geri çekme (unlike) için decrement_post_like
--   fonksiyonu ekler.
-- • Yorum beğenisi artır/azalt fonksiyonları ekler.
--   Tüm RPC'ler yalnızca sunucu (service_role) tarafından çağrılabilir.
-- ═══════════════════════════════════════════════════════════════

-- ── YORUM TABLOSU: beğeni sayacı + yanıt (üst yorum) ──
alter table public.blog_comments add column if not exists likes integer not null default 0;
alter table public.blog_comments add column if not exists parent_id uuid;

create index if not exists idx_blog_comments_parent on public.blog_comments (parent_id);

-- ── YAZI BEĞENİSİNİ GERİ ÇEKME (unlike) ──
create or replace function public.decrement_post_like(p_slug text)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.post_likes
  set likes = greatest(public.post_likes.likes - 1, 0), updated_at = now()
  where post_slug = p_slug
  returning likes
$$;

revoke execute on function public.decrement_post_like(text) from public, anon, authenticated;
grant execute on function public.decrement_post_like(text) to service_role;

-- ── YORUM BEĞENİSİ: artır ──
create or replace function public.increment_comment_like(p_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.blog_comments
  set likes = public.blog_comments.likes + 1
  where id = p_id
  returning likes
$$;

revoke execute on function public.increment_comment_like(uuid) from public, anon, authenticated;
grant execute on function public.increment_comment_like(uuid) to service_role;

-- ── YORUM BEĞENİSİ: azalt (geri çek) ──
create or replace function public.decrement_comment_like(p_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.blog_comments
  set likes = greatest(public.blog_comments.likes - 1, 0)
  where id = p_id
  returning likes
$$;

revoke execute on function public.decrement_comment_like(uuid) from public, anon, authenticated;
grant execute on function public.decrement_comment_like(uuid) to service_role;

-- ── DOĞRULAMA (anon olarak) ──
-- select count(*) from public.blog_comments where likes > 0;            -- onaylılar görünür
-- select * from public.blog_comments where parent_id is not null;       -- yanıtlar görünür
-- select public.decrement_post_like('ornek-slug');                      -- HATA vermeli (yetkisiz)
-- select public.increment_comment_like('<id>');                         -- HATA vermeli (yetkisiz)
