# Changelog

Tüm önemli değişiklikler bu dosyada not edilir. Format: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/),
sürüm: [SemVer](https://semver.org/).

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