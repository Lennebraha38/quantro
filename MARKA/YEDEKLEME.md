# Yedekleme / Yeniden Kurulum Rehberi

Durum: 2026-09-20. Site, statik olarak kaynaktan yeniden üretilebilir — Supabase
katmanı yalnızca yorum/beğeni/bülten; gerekirse tamamen çalışmadan devam eder.

## 1) Kaynaklar (kalıcı gerçek — git'te)

| Kaynak | Yer | Üretilen |
|--------|-----|----------|
| Blog yazıları (Markdown) | `blog-articles/*.tr.md` + 7 dil çevirisi | hiçbir şey |
| Statik blog paketi | `npm run blog:static` → `blog-static.js` | verilir, commit'lenir |
| Blog JSON-RSS | `api/feed.js` (arka plan kapalıysa markdown'dan) | `/feed.xml` |
| Sitemap | `npm run sitemap` → `sitemap.xml` | commit'lenir |
| SQL şemaları | `sql/` (blog, yorum, beğeni, iletişim, bülten, hata) | Supabase SQL editor |
| Deploy | `vercel --token "$VERCEL_TOKEN"` (çalışma dizininde `vercel link`) | — |

## 2) Geri yükleme sırası (taze makine)

1. `git clone git@github.com:Lennebraha38/quantro.git && cd quantro`
2. `npm ci`
3. `node scripts/gen-blog.mjs && npm run sitemap` (üretilenler zaten commit'te;
   değişiklik varsa bu adım günceller)
4. `npm run check` → build + 44 birim test + bağlantı denetimi
5. `npm run test:e2e` → 12 E2E (Chromium: `npx playwright install --with-deps chromium`)
6. `vercel deploy --prod --token "$VERCEL_TOKEN"`
7. Canlı doğrulama: `curl /api/health` → `{"status":"ok"|"degraded"}`;
   `/api/stats`, `/feed.xml`, `/favicon.ico`→200; `/blog.html#kuantum-dolaniklik`
   içerik render'ı (Supabase'siz).

## 3) Supabase yeniden kurulumu (kullanıcı işi — geçerli proje NXDOMAIN)

1. supabase.com → Yeni proje → `.env` / Vercel env güncelle
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
2. SQL Editor'de `sql/*.sql`'u sırayla çalıştır (blog, yorum, beğeni, iletişim,
   bülten + `supabase-newsletter.sql`).
3. Blog içeriği gerek yok (statiktir); dilersen `tools/import-blog.mjs` ile
   `blog_posts`/`blog_posts_i18n` doldurulur (adet/etkileşim sayımı için).
4. RLS: yalnızca `service_role` insert/select; anon yalnızca `select`.

## 4) Kırılma / yok etme senaryoları

- **Supabase ölür** → site, blog, RSS, bülten, iletişim degrade olur ama çalışır
  (`/api/health` → `degraded`); hiçbir sayfa 500 vermez.
- **Vercel çöker** → kodu yerel sunar; CI `uptime.yml` arıza kaydı açar.
- **Domain alındığında** → canonical/hreflang/sitemap/OG `quantro-1.vercel.app`
  → yeni domaine geçir (3 dosya), GSC'ye ekle, eskiye 301.