# Quantro API Referansı

Canlı: `https://quantro-1.vercel.app/api/*` · Tüm yanıtlar JSON ve UTF-8.
Hizmet dışı durumda bile uçlar zarif olarak `200` (degrade) döner; backend
yoksa 500 fırlatılmaz.

Ortak hatalar:

| Durum | Anlam |
|---|---|
| `400` | Hatalı gövde / doğrulama (örn. geçersiz e-posta) |
| `401` | Yetki token'ı eksik/geçersiz |
| `404` | Bilinmeyen uç |
| `405` | Desteklenmeyen HTTP yöntemi |
| `429` | Rate limit aşıldı |
| `503` | Gerekli ortam değişkeni eksik |

---

## `GET /api/health`

Sağlık raporu (uptime robotları ve kullanıcı için). `Cache-Control: no-store`.

```json
{ "status": "ok", "uptime": 176.1, "services": { "site": "ok", "supabase": "ok", "anu": "ok" }, "timeMs": 948, "now": "…" }
```

- `status`: `ok` — tüm bileşenler; `degraded` — Supabase çevrimdışı (site çalışmaya devam eder).

## `GET /api/stats`

Topluluk & güvenilirlik göstergeleri. 10 dk önbellek (`Cache-Control: public, max-age=600`, CORS `*`).

```json
{ "github": { "stars": 0, "forks": 0, "openIssues": 0 }, "npm": { "downloadsLastMonth": 0, "version": "1.0.0" }, "blogPosts": 3, "anu": "ok", "collectedAt": "…" }
```

- Dış API erişilemezse `github`/`npm` `null` olabilir. `npm.version` indirme API'si geriden gelse bile registry'den her zaman dolu gelir.

## `POST /api/newsletter`

Bülten aboneliği (KVKK 6698). Gövde: `{ "email": "…", "lang": "tr" }`.

- Başarı: `200 {"ok": true, "persisted": true|false}` — `persisted:false` = backend tablosu bekliyor (bellek kuyruğu).
- **Rate limit:** IP başına 5 istek / 15 dk → `429`.
- **Doğrulama:** geçersiz e-posta → `400`.

## `POST /api/auth`

Yönetim girişi. Gövde: `{ "password": "…" }`.

```json
{ "token": "…", "expires_in": 7200 }
```

- Yanlış şifre → `401`. AUTH_SECRET tanımsızsa → `503`.

## `GET /api/blog` · `POST /api/blog`

Yazı listesi / yönetimi.

- `GET`: herkese açık; sorgu `?id=` istenen yazıyı döner, yoksa liste.
- `POST`: yalnız yetkili (`Authorization: Bearer <token>`, scrypt doğrulamalı).
- Backend çevrimdışıyken `GET` statik yedeği (`blog-articles/`) sunar.

## `GET /api/comments` · `POST /api/comments`

- `GET` (auth'suz): yazı yorumları (`?post=`).
- `POST`: yorum ekler (yetki gerekmez; sahtekarlık koruması olarak IP tabanlı rate limit + token doğrulama isteğe bağlı).

## `GET /api/likes` · `POST /api/likes` · `POST /api/comment-likes`

Beğeni sayaçları ve oylama. Backend tabloları `post_likes` / `blog_comments`.

## `POST /api/contact`

İletişim formu gönderimi. Supabase çevrimdışıyken istek kabul edilir ve kuyruğa alınır.

## `GET /api/feed`

RSS 2.0 beslemesi (`/feed.xml`'e rewrite). Backend öncelikli, statik yedekli.

## `GET /api/anu`

ANU Qrng proxy'si. Sorgu: `?length=` (1–1024 bayt). Gerçek fiziksel kuantum
rastgeleliği; istemci tarafı anahtarlarla imzalanır.

---

### Notlar

- `apifns/{health,stats,newsletter}.js` tek catch-all fonksiyon üzerinden
  (`api/[...path].js`) çalışır; böylece Hobby planın 12-fonksiyon sınırı aşılmaz.
- Yönetim oturumları HMAC-SHA256 imzalı, 2 saat geçerli; parola tek yönlü (scrypt).
- Tam uç bazlı test yelpazesi: `test/api-handlers.test.js`, `test/api-extra.test.js`.