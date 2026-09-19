# Changelog

Tüm önemli değişiklikler bu dosyada not edilir. Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/),
sürüm: [SemVer](https://semver.org/).

## 1.6.0 — 2026-09-19

### Eklendi
- **Başarılar bölümü** (`index.html#basari`) — 3 savunulabilir "ilk" iddiası:
  açık kaynak (MIT) çok araçlı set · canlı kuantum rastgelelik (ANU) · 8 dilli
  araç seti + blog. `app.js`'de 8 dile çevrildi.
- README'ye **"Savunulabilir ilk iddiaları"** bölümü (niş + kanıt zinciri).

### Değişti
- Riskli genel iddialar kaldırıldı (savunulamaz): "Türkiye'de İlk · 13 Araç",
  "Türkiye'nin ilk interaktif kuantum araç seti" → niş/savunulabilir ifadelere
  çevirildi (index, lab hero/badge/intro, tüm `lab/i18n-*.js` + fallback HTML).

## 1.5.0 — 2026-09-19

### Eklendi
- **İçerik çevirisi 8 dile tamamlandı** — `blog-articles/*.<lang>.md` artık
  tr/en/fr/es/it/ru/ko/ar (3 yazı × 8 dil = 24 dosya); arayüz + içerik aynı
  `qlang` ile hizalanıyor. Import: `node tools/import-blog.mjs` (24 satır i18n).

## 1.4.0 — 2026-09-19

### Eklendi
- **Blog içerik i18n (TR→EN)** — `blog-articles/*.<lang>.md` yapısı (TR kaynak +
  EN çeviri); `blog_posts_i18n` tablosu (`supabase-blog-i18n.sql`), import:
  `tools/import-blog.mjs`; istemcide `blog-localize.js` ile aktif dille birleştirme
  (çeviri yoksa TR fallback). Arama, tarih, okuma süresi ve tüm kart/buton
  metinleri dile bağlandı; dil değişince içerik yeniden render edilir.
- **PageSpeed metrikleri** — `scripts/metrics.mjs` Alan (CrUX/field) + Lab
  (Lighthouse) toplar, POOR alan metriğinde exit 1; `npm run metrics:field`.
- **Gece performans CI** — `.github/workflows/perf.yml` (cron + push + manual),
  secret `PSI_API_KEY`.
- **Kapsam yükseldi** — satır %87.56 · dal %81.91 · fonksiyon %91.24 (eşiklerin üstü).

### Değişti
- Birim testleri 39 → 44 (`test/localize.test.js`: pickLang, localizePost,
  formatDate, readTime).

## 1.3.0 — 2026-09-19

### Eklendi
- **Yönetim paneli i18n (TR/EN)** — `admin-i18n.js`; giriş, kenar çubuğu,
  istatistikler, form etiketleri/butonları ve dinamik liste butonları
  (Sil/Onayla) çevrilir, `qlang` ile senkron. Sistem güvenlik mesajları TR kalır.
- **CWV ölçümü** — E2E içinde `fcp/lcp/cls` hedefi: FCP/LCP < 4000 ms,
  CLS < 0.1 (index + blog). Sınır ihlalinde test kızar.
- Admin: `#langbtn` (üst çubuk) ile TR/EN geçişi; script `sw.js` SHELL'ine eklendi.

## 1.2.0 — 2026-09-19

### Eklendi
- **Kalan kalite açıkları**:
  - `test/api-handlers.test.js` → 15 API handler testi (auth/comments/blog, mock fetch); toplam 39 birim testi.
  - `scripts/coverage.mjs` → kapsam eşiği zorlaması (satır 80% · dal 75% · fonksiyon 85%); `npm run test:coverage` eşik altında exit 1.
  - **Blog arayüzü i18n** — `blog-i18n.js`, ana site ve lab ile aynı `qlang`/`#langbtn` üzerinden 8 dil + RTL (Arapça); blog yazılarının kendisi TR kalır.
  - **İstemci hata raporlama** — `api/report.js` + `app.js` global error hook + `supabase-errors.sql`; bağımlılıksız, fail-safe.

### Değişti
- E2E 9 → 10 senaryo (blog dil değişimi).

## 1.1.0 — 2026-09-19

### Eklendi
- **Kalite/Mühendislik paketi**:
  - `package.json` + `package-lock.json` → GitHub Actions (Node 18/20/22) artık
    `npm ci` → `npm run build` → `npm test` ile çalışır.
  - `scripts/build.mjs`: bağımlılıksız build/bütünlük kontrolü — tüm HTML
    referanslarını diske karşı doğrular (112 referans), `vercel.json`'u parser eder.
  - Birim testleri: `test/quantro.test.js` (kuantum simülatör: X/H/CX/Bell/GHZ, seeded PRNG)
    + `test/_lib.test.js` (JWT, tamper/expired, rate-limiter, auth, scrypt).
  - **E2E test** (`test/e2e.test.js`, Playwright + gerçek Chromium): sayfa render,
    lab 13 araç, QRNG sim akışı, tarayıcı içi QuantumCircuit API, admin giriş,
    PWA, i18n dil değişimi ve kalıcılık.
  - **Coverage**: `npm run test:coverage` (Node ≥20), CI'da PR bazlı job.
  - `README.md`, `LICENSE` (MIT), `.gitignore`, `CHANGELOG.md`, `CONTRIBUTING.md`.

### Değişti
- CSS çoğaltması kaldırıldı: blog/lab/admin sayfalarındaki inline `<style>`
  blokları `css/base.css` + sayfaya özel dosyalara taşındı (**−810 satır**).
- KVKK çerez onayı ve `prefers-reduced-motion` tek kaynakta (`css/base.css`).
- `insta/onizleme.html` kırık referansları düzeltildi (`insta/…` → `../insta/…`).
- Service Worker önbelleği `quantro-v1.11.0`; yeni CSS dosyaları shell'e eklendi.
- `quantro-lab.html` JSON-LD: "9 araç" → "13 araç" (tutarlılık).

### Güvenlik
- CSP'den `unsafe-eval` kaldırıldı (E2E: sıfır ihlal doğrulandı).
- Admin şifresi artık plaintext karşılaştırılmıyor; `scrypt` türevi anahtar
  üzerinden timing-safe karşılaştırılıyor (`verifyAdminPassword`).

### Notlar
- Blog sayfası ve yönetim paneli Türkçe'dir (bilinen kapsam). Ana site ve Lab
  8 dilde uluslararasıdır.

## 1.0.0 — ilk stabil sürüm

Statik site + Vercel Serverless: 13 lab aracı, kuantum simülatör, BB84,
blog CMS, admin panel, PWA, 8 dil i18n, Supabase/RLS, KVKK çerez onayı.