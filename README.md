# Quantro — Kuantum ve Astrofizik ARGE

Kuantum bilgisayarlar, astrofizik ve bilimsel AR-GE üzerine interaktif keşif
laboratuvarı. Statik site + Vercel Serverless API mimarisiyle tamamı
bağımlılıksız (dependency-free) çalışır.

> Canlı: https://quantro-1.vercel.app · PWA (offline çalışır) · 8 dil desteği

[![Lisans MIT](https://img.shields.io/badge/license-MIT-00c8f0)](./LICENSE)
[![Bağımlılık yok](https://img.shields.io/badge/dependencies-0-00c8f0)]()
[![npm: quantro-js](https://img.shields.io/badge/npm-quantro--js-00c8f0)](https://www.npmjs.com/package/quantro-js)
[![Test](https://img.shields.io/github/actions/workflow/status/Lennebraha38/quantro/node.js.yml?branch=main&label=CI)](https://github.com/Lennebraha38/quantro/actions)
[![Stars](https://img.shields.io/github/stars/Lennebraha38/quantro?style=social)]()

---

## Özellikler

- **13 interaktif laboratuvar aracı** (`/quantro-lab.html`):
  kuantum rastgelelik motoru (ANU Qrng), devre simülatörü, BB84 kuantum
  şifreleme, evren yaşı hesaplayıcı, kara delik simülatörü, Doppler, Planck
  kartları ve quiz.
- **Kuantum devre simülatörü** (`quantro.js`): tensör ürünü tabanlı saf durum
  simülasyonu (`H, X, Y, Z, RY, CX, CZ`), Bell/GHZ dolanıklık durumları,
  tohumlanabilir PRNG (`mulberry32`) ile deterministik örnekleme.
- **AR&GE sekmesi** (`arastirma.html`): yayın/araştırma alanı.
- **Blog** (`/blog.html`): Markdown tabanlı içerik yönetimi.
- **Yönetim paneli** (`/qtr-admin.html`): giriş korumalı CMS — token doğrulama,
  rate-limit, blog/posta/şifreleme yönetimi.
- **KVKK uyumlu** çerez onayı + gizlilik.
- **PWA / Service Worker**: `manifest.webmanifest` + `sw.js` (offsay önbelleği).

---

## Savunulabilir "ilk" iddiaları

Genel ("Türkiye'de ilk kuantum site") iddialarından kaçınılır — aşağıdaki üçü niş ve
ölçülebilir olduğu için sitede (Başarılar bölümü, `index.html#basari`) ve lab
için söylenir:

1. **İlk Türkçe, açık kaynak (MIT) lisanslı çok araçlı kuantum + astrofizik araç seti**
   — rakip Türkçe platformlar (Quantum4Edu, QuantumLab Pro) açık kaynak değil.
2. **İlk Türkçe canlı kuantum rastgelelik motoru** — ANU'nun fiziksel kuantum kaynağına
   bağlanır (`api/anu.js`); rakiplerde gerçek fiziksel kaynak yok.
3. **İlk 8 dilli kuantum araç seti ve blog** — arayüz + içerik birlikte
   TR/EN/FR/ES/IT/RU/KO/AR.

Kanıt zinciri: git commit geçmişi + `CHANGELOG.md` tarihleri + Wayback/Archive kaydı
(kampanya yayınlanınca) + canlı demo (Vercel). Bu metinler `app.js` ve `lab/i18n-*.js`
içinde 8 dilde tutulur.

---

## Mimari

```
/                  Anasayfa ve statik HTML sayfaları
  css/
    base.css       Ortak tasarım sistemi (token, reset, KVKK, a11y)
    blog.css       Blog sayfası stili
    lab.css        Laboratuvar stili
    admin.css      Yönetim paneli stili
    style.css      Ana site stili
  api/             Vercel Serverless Functions (Node 18+)
    _lib.js        Paylaşılan yardımcılar (JWT, rate-limit, supabase)
    auth.js        Admin giriş
    blog.js        Blog içerik yönetimi
    comments.js    Yorumlar
    likes.js       Beğeniler (+ yorum beğenileri)
    contact.js     E-posta bildirimi (Resend)
    messages.js    Mesajlar
    feed.js        RSS/feed
    anu.js         Kuantum rastgelelik proxy (ANU Qrng)
  lab/             Laboratuvar araç içerikleri (i18n: 8 dil)
  blog-articles/   Blog yazıları (Markdown, `<slug>.<lang>.md` — 8 dil)
  tools/
    import-blog.mjs   blog-articles → Supabase (blog_posts + blog_posts_i18n)
  scripts/
    build.mjs      Build / bütünlük kontrolü (HTML referans doğrulaması)
    coverage.mjs   Kapsam eşiği kontrolü (satır 80 · dal 75 · fonksiyon 85)
    metrics.mjs    PageSpeed Insights: ALAN (CrUX) + LAB (Lighthouse)
  test/            Node testleri (node:test)
  supabase-security.sql   Güvenlik politikaları (RLS)
  supabase-comments-v2.sql Yorum tabloları
  supabase-blog-i18n.sql  İçerik çevirileri (blog_posts_i18n)
  supabase-errors.sql     Hata raporlama tablosu
```

### API uçları

| Uç | Amaç |
|---|---|
| `POST /api/auth` | Admin giriş → imzalı oturum token'ı (2 saat) |
| `GET/POST /api/blog` | Blog yazıları |
| `POST /api/comments` | Yorum ekleme |
| `POST /api/likes` · `api/comment-likes` | Beğeni |
| `POST /api/contact` | İletişim formu → e-posta |
| `GET/POST /api/messages` | Panel içi mesajlar |
| `GET /api/feed` | RSS/feed |
| `GET /api/anu` | ANU kuantum rastgelelik vekili (CORS aşımlı) |

---

## Başlangıç

Gereksinim: **Node.js ≥ 18**. Runtime (site + `/api`) harici npm paketi içermez;
yalnızca test araçları devDependency'dir.

```bash
git clone https://github.com/Lennebraha38/quantro.git
cd quantro
npm ci                # lock'a göre kurulum
npm run build         # bütünlük kontrolü (HTML referansları + vercel.json)
npm test              # 44 birim testi (simülatör + API güvenliği + handler'lar + içerik-i18n)
npm run test:coverage # eşik kontrollü kapsam (satır 80% · dal 75% · fonksiyon 85%)
npm run check         # build + test birlikte
```

Tarayıcı E2E testleri (12 senaryo) için önce Playwright tarayıcısı:

```bash
npm ci
npx playwright install chromium
npm run test:e2e      # sayfa render, lab akışları, i18n(+blog), PWA, CSP ihlali
```

Vercel CLI ile yerel çalıştırma:

```bash
npm i -g vercel
vercel dev        # http://localhost:3000
```

---

## Ortam Değişkenleri

`.env` dosyası (veya Vercel dashboard → Environment Variables).

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `SUPABASE_URL` | Evet | Supabase proje URL'i (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Evet | Service-role key (sadece serverless tarafı — tarayıcıya asla) |
| `AUTH_SECRET` | Evet | Panel JWT imzalama anahtarı (uzun, rastgele) |
| `ADMIN_PASSWORD` | Evet | Panel şifresi (scrypt türeviyle timing-safe doğrulanır; uzun/rastgele değer kullanın) |
| `RESEND_API_KEY` | Kayıt bildirimi için | Resend API anahtarı |
| `NOTIFY_EMAIL` | Kayıt bildirimi için | Alıcı e-posta |
| `NOTIFY_FROM` | Hayır | Gönderici (`Quantro <onboarding@resend.dev>` varsayılan) |

### Supabase kurulumu

1. `supabase-security.sql`'i **SQL Editor**'da çalıştır (RLS + kullanıcı rolleri).
2. `supabase-comments-v2.sql`'i çalıştır (blog/comment/like tabloları).
3. `supabase-blog-i18n.sql`'i çalıştır (içerik çeviri tablosu `blog_posts_i18n`).
4. `supabase-errors.sql`'i çalıştır (hata raporlama tablosu, opsiyonel).
5. `vercel.json`'daki CORS/orijin kısıtlarını kendi domain'ine göre güncelle.

### Blog içeriği

Yazılar `blog-articles/<slug>.<lang>.md` olarak sürülür (TR kaynak + 7 çeviri:
en, fr, es, it, ru, ko, ar → 8 dilin tamamı).
Üstbilgi: `# Başlık`, `**Emoji:**`, `**Etiketler:**`/`**Tags:**`, `**Özet:**`/`**Summary:**`.
Supabase'e yüklemek için (service-role):

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/import-blog.mjs
```

TR kaynak `blog_posts`'a, tüm diller `blog_posts_i18n`'e yazılır. Tarayıcıda
`blog.html` aktif dili (qlang) çeker, çevirisi olmayan dilde TR içeriği gösterir
(şu an içerik de 8 dilin tamamında mevcut).

---

## Yönetim Paneli

`/qtr-admin.html` → `ADMIN_PASSWORD` ile giriş. Başarılı girişte sunucu,
HMAC-SHA256 (`AUTH_SECRET`) ile imzalı, 2 saat geçerli bir oturum token'ı üretir
(`timingSafeEqual` ile doğrulanır).

- Token **bearer** olarak `Authorization: Bearer <token>` ile taşınır.
- Tüm yazma uçlarında `requireAuth` + IP tabanlı **rate-limit** uygulanır.
- Token imzası/geçerliliği her istekte doğrulanır; şifreler plaintext saklanmaz.

### Güvenlik notları

- Service-role key yalnızca sunucuda tutulur; tarayıcı koduna asla düşmez.
- Şifre ve token'lar **timing-safe** karşılaştırılır; admin şifresi plaintext
  hatırlanmaz — `api/_lib.js#verifyAdminPassword` `scrypt` türevi anahtarla
  doğrular (salt, `AUTH_SECRET`'ten türer).
- **CSP** sıkılaştırılmıştır: script kaynaklarında `unsafe-eval` yok; bu E2E
  ile doğrulanır (`test/e2e.test.js` — sıfır ihlal). İzin verilen kaynaklar
  `vercel.json`'dadır.
- Yorum/iletişim uçları honeypot + IP tabanlı **rate-limit** korumalıdır.
- Supabase'te **RLS** açıktır; doğrudan istemci erişimi veriye erişemez.
- İstemci **hata raporlama** bağımlılıksızdır: `api/report.js` tarayıcıdaki
  alınmamış hataları (en fazla 1 / 10 sn) `errors` tablosuna yazar
  (`supabase-errors.sql` şeması) — arıza durumunda sessizce geçer, siteyi
  etkilemez.

---

## Test & CI

```bash
npm test                 # 44 birim testi
└── test/quantro.test.js # Kuantum simülatör (X, H, CX, Bell, GHZ, seeded PRNG)
└── test/_lib.test.js    # JWT doğrulama, scrypt, rate-limiter, auth katmanı
└── test/api-handlers.test.js # api/auth · comments · blog (mock fetch)
└── test/localize.test.js     # blog içerik yerelleştirme (blog-localize.js)

npm run test:e2e         # 12 E2E (Playwright + Chromium)
└── test/e2e.test.js     # sayfa render, lab(13 araç/QRNG/QuantumCircuit),
                         # admin giriş, PWA, i18n+kalıcılık, blog i18n,
                         # admin i18n, CWV (fcp/lcp/cls), CSP sıfır-ihlal

npm run test:coverage    # birim + kapsam eşiği kontrolü (Node ≥ 20)
                         # eşikler: satır 80% · dal 75% · fonksiyon 85%
                         # (scripts/coverage.mjs — altında kalırsa exit 1)

npm run metrics:field    # PageSpeed Insights (PSI_API_KEY gerekir)
                         # ALAN = gerçek kullanıcı (CrUX) · LAB = Lighthouse
```

GitHub Actions (`.github/workflows/node.js.yml`) 3 iş çalıştırır:
- **unit** — `npm ci` → `npm run build` → `npm test` (Node 18/20/22)
- **coverage** — `npm run test:coverage` (PR'lerde)
- **e2e** — `npx playwright install --with-deps chromium` → `npm run test:e2e`

Gece performans işi `.github/workflows/perf.yml`: canlı site için PageSpeed
Alan (CrUX) + Lab (Lighthouse) metriklerini toplar (secret: `PSI_API_KEY`).

PR'lere Vercel önizleme deploy'u: `.github/workflows/preview.yml`
(`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secret'larını gerektirir).

---

## Teknoloji

- **Vanilla JS** (build sistemi yok, doğrudan `module.exports`/global uyumlu)
- Node 18+ Serverless Functions + Supabase (Postgres/RLS)
- Resend (e-posta), ANU Qrng (gerçek kuantum rastgelelik)
- PWA Service Worker, JSON-LD SEO, **8 dil i18n** — ana site (`app.js` I18N),
  lab (`/lab/` + `lab-core.js`) ve blog arayüzü (`blog-i18n.js`) ortak `qlang`
  ile; RTL (Arapça) destekli. Yönetim paneli TR/EN (`admin-i18n.js`).
  **Blog içeriği**: TR kaynak doyalar `blog-articles/*.tr.md` + 7 çeviri
  (`*.en|fr|es|it|ru|ko|ar.md`) → `blog_posts_i18n` üzerinden aktif dille
  gösterilir (`blog-localize.js`); çevirisi olmayan dilde TR yazı gösterilir.
- **Core Web Vitals** E2E içinde ölçülür (`test/e2e.test.js` — CWV senaryosu):
  FCP/LCP < 4000 ms ve CLS < 0.1 hedefi, index + blog sayfalarında
  sınır ihlali olursa test kızar.

---

## Marka / SEO / PR

- [SEO · GSC + Bing kurulum](MARKA/SEO-GSC-KURULUM.md) — hreflang (8 dil) + sitemap hazır
- [PR / Medya dosyası](MARKA/PR-MEDYA-DOSYASI.md) — basın bülteni, medya pitch, 7 günlük X/LinkedIn serisi
- [Alan adı kurulumu](MARKA/DOMAIN-KURULUM.md) — kalıcı domain, Vercel bağlama, GitHub/npm marka taşıma

npm kütüphanesi (`quantro-js`, MIT):

```bash
npm install quantro-js
const { QuantumCircuit, bellState, sampleDistribution } = require('quantro-js');
const qc = new QuantumCircuit(2);
bellState(qc);
console.log(sampleDistribution(qc, 1024, 42)); // Bell |00> + |11>
```

## Lisans

[MIT](./LICENSE) — © 2026 Quantro — Kuantum ve Astrofizik ARGE.