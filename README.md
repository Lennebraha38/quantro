# Quantro — Kuantum ve Astrofizik ARGE

Kuantum bilgisayarlar, astrofizik ve bilimsel AR-GE üzerine interaktif keşif
laboratuvarı. Statik site + Vercel Serverless API mimarisiyle tamamı
bağımlılıksız (dependency-free) çalışır.

> Canlı: https://quantro-1.vercel.app · PWA (offline çalışır) · 8 dil desteği

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
  blog-articles/   Blog yazıları (Markdown)
  insta/           Tanıtım/tasarım prototipleri
  scripts/
    build.mjs      Build / bütünlük kontrolü (HTML referans doğrulaması)
  test/            Node testleri (node:test)
  supabase-security.sql   Güvenlik politikaları (RLS)
  supabase-comments-v2.sql Yorum tabloları
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
git clone https://github.com/Lennebraha38/Quantro-Vercel-Project.git
cd Quantro-Vercel-Project
npm ci                # lock'a göre kurulum
npm run build         # bütünlük kontrolü (HTML referansları + vercel.json)
npm test              # 24 birim testi (simülatör + API güvenliği)
npm run test:coverage # aynı testler + kapsam raporu (Node ≥ 20)
npm run check         # build + test birlikte
```

Tarayıcı E2E testleri (9 senaryo) için önce Playwright tarayıcısı:

```bash
npm ci
npx playwright install chromium
npm run test:e2e      # sayfa render, lab akışları, i18n, PWA, CSP ihlali
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
3. `vercel.json`'daki CORS/orijin kısıtlarını kendi domain'ine göre güncelle.

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

---

## Test & CI

```bash
npm test                 # 24 birim testi
└── test/quantro.test.js # Kuantum simülatör (X, H, CX, Bell, GHZ, seeded PRNG)
└── test/_lib.test.js    # JWT doğrulama, scrypt, rate-limiter, auth katmanı

npm run test:e2e         # 9 E2E (Playwright + Chromium)
└── test/e2e.test.js     # sayfa render, lab(13 araç/QRNG/QuantumCircuit),
                         # admin giriş, PWA, i18n+kalıcılık, CSP sıfır-ihlal

npm run test:coverage    # birim + kapsam raporu (Node ≥ 20)
```

GitHub Actions (`.github/workflows/node.js.yml`) 3 iş çalıştırır:
- **unit** — `npm ci` → `npm run build` → `npm test` (Node 18/20/22)
- **coverage** — `npm run test:coverage` (PR'lerde)
- **e2e** — `npx playwright install --with-deps chromium` → `npm run test:e2e`

PR'lere Vercel önizleme deploy'u: `.github/workflows/preview.yml`
(`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secret'larını gerektirir).

---

## Teknoloji

- **Vanilla JS** (build sistemi yok, doğrudan `module.exports`/global uyumlu)
- Node 18+ Serverless Functions + Supabase (Postgres/RLS)
- Resend (e-posta), ANU Qrng (gerçek kuantum rastgelelik)
- PWA Service Worker, JSON-LD SEO, **8 dil i18n** — ana site (`app.js` I18N)
  ve lab (`/lab/` + `lab-core.js`) ortak `qlang` ile; RTL (Arapça) destekli.
  Kapsam notu: blog sayfası ve yönetim paneli Türkçe'dir.

---

## Lisans

[MIT](./LICENSE) — © 2026 Quantro — Kuantum ve Astrofizik ARGE.