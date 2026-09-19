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

Gereksinim: **Node.js ≥ 18** (yerleşik CI de dâhil hiçbir npm paketi gerekmez).

```bash
git clone https://github.com/Lennebraha38/Quantro-Vercel-Project.git
cd Quantro-Vercel-Project
npm install --package-lock-only   # lock senkronu (opsiyonel)
npm run build                     # bütünlük kontrolü
npm test                          # 23 test (simülatör + API güvenliği)
npm run check                     # build + test birlikte
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
| `ADMIN_PASSWORD` | Evet | Panel şifresi (timing-safe karşılaştırma; uzun/rastgele değer kullanın) |
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
- Yorum/iletişim uçları honeypot + IP tabanlı **rate-limit** korumalıdır.
- Supabase'te **RLS** açıktır; doğrudan istemci erişimi veriye erişemez.

---

## Test & CI

```bash
npm test
└── test/quantro.test.js   # Kuantum simülatör davranışları (X, H, Bell, GHZ, PRNG)
└── test/_lib.test.js      # JWT doğrulama, rate-limiter, auth katmanı
```

GitHub Actions (`.github/workflows/node.js.yml`) her push'ta şunları çalıştırır:
`npm ci` → `npm run build` → `npm test`. Bağımlılık yok, network gerektirmez.

---

## Teknoloji

- **Vanilla JS** (build sistemi yok, doğrudan `module.exports`/global uyumlu)
- Node 18+ Serverless Functions + Supabase (Postgres/RLS)
- Resend (e-posta), ANU Qrng (gerçek kuantum rastgelelik)
- PWA Service Worker, JSON-LD SEO, 8 dil i18n (`/lab/` klasörü)

---

## Lisans

[MIT](./LICENSE) — © 2026 Quantro — Kuantum ve Astrofizik ARGE.