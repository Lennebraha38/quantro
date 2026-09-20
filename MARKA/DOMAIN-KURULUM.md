# Alan Adı · Kalıcı Marka Domaini

Şu an: `quantro-1.vercel.app` (üretim), repo: `Lennebraha38/Quantro-Vercel-Project`.
Marka için kalıcı domain + temiz GitHub isim alanı şart.

## 1) Alan adı seçenekleri

| Domain | Yıllık (yaklaşık) | Neden | Risk |
|---|---|---|---|
| `quantro.dev` | ~40–50 $ | en kısa, developer/jskitibi | .dev alalı çok, dolu olabilir |
| `quantro.tech` | ~10–15 $ | teknoloji markası için doğal | .tech daha az "premium" algı |
| `quantro.com.tr` | ~50-60 $ (tr alanı teyitli firmadan) | lokal TR güveni | TR kayıtta evrak, .com.tr'ler OG |
| `getquantro.com` | ~10 $ | envanter açık | uzun, "get" ön eki |

**Öneri:** `quantro.dev` boşsa al (marka+SEO). Değilse `quantro.tech`.
Kayıtçı önerileri: Vercel'in kendi DNS'iyle uyumlu olması için **Namecheap /
Porkbun / Cloudflare Registrar** (CF en kolay: DNS+registrar aynı panel).

## 2) Vercel'e bağlama

Vercel CLI ile (token repo'da yapılandırılmış):

```bash
vercel domains buy quantro.dev        # kayıt (Vercel registrar)
vercel domains add quantro.dev
vercel project ls                      # quantro-1 projesini bul
vercel domains inspect quantro.dev
```

Dashboard yolu: Quantro projesi → **Settings → Domains** → Add
(Doğrudan bağlama, DNS panel Vercel'de otomatik.)

## 3) DNS kayıtları (Vercel ışıkta)

Vercel `quantro-1.vercel.app`'i `CNAME`/ALIAS ile geliştirir.

- **Apex kök (`quantro.dev`):** ALIAS → `76.76.21.21` (Vercel anycast) veya
  `cname.vercel-dns.com`
- **www:** CNAME → `cname.vercel-dns.com`
- **TXT:** `verification` (Vercel doğrulama satırı — dashboard'dan gelir)
- Yönetilen DNS seçersen kayıtlar otomatik.

SSL: Vercel Let's Encrypt'i otomatik verir (domains sahteciliğe karşı doğrular).

## 4) Sonra kod değişikliği (domain swap) — kontrol listesi

Aşağıdaki noktalara eski adresin yerine yenisini yaz:

- [ ] 6 HTML sayfası: `canonical`, `og:url`, hreflang blokları
- [ ] `sitemap.xml` (tüm `<loc>` + `xhtml:link href`)
- [ ] `robots.txt` (Sitemap satırı)
- [ ] `manifest.webmanifest` (start_url + scope + icons)
- [ ] `vercel.json` (redirect/rewrite hedefleri, `Content-Security-Policy`
      `frame-ancestors` vs. — zaten domain bağımsız ama kontrol et)
- [ ] Ana sayfa OG image URL'leri (`img/og-quantro.png` vardır — path aynı)

Not: `vercel.json` CSP, cdnjs/Supabase/ANU gibi üçüncü partileri izin verir —
domain değişiminden etkilenmez.

## 5) GitHub isim alanını temizle

Repo şu an `Lennebraha38/Quantro-Vercel-Project`. Marka için:

1. GitHub → Settings → Change repository name → `quantro` (veya `quantro-js`).
2. README badge URL'leri, `package.json` `repository`, `packages/quantro`
   `repository` alanlarındaki repo adını güncelle.
3. README top'undaki badge'ler (`github.com/Lennebraha38/Quantro-Vercel-Project`)
   aynı anda düzeltilir.

## 6) npm paketi

`quantro-js` hazır (bkz. `package/quantro/`). Yayın:

```bash
npm login                                    # bir kez
npm run pkg:sync && (cd package/quantro && npm publish --access public)
npm view quantro-js version                  # doğrula
```

Paket içeriği `files` ile sınırlı: `quantro.js`, `LICENSE`, `README.md`,
`package.json` — siteyle aynı licençeli, tek dosya, bağımlılıksız.

## 7) Kapanış "marka kimliği" planı

- Logo: mevcut cyan/şeffaf kimlik korunur (değişiklik gerekmez).
- Sosyal handle'lar: `quantro.dev` → Instagram/X `@quantro.dev` (şimdi
  `quantro38`; marka ile eşitle).
- E-posta: `info@quantro.dev` + mevcut quantro38@gmail.com PWA'ya yönlendirme.
- OG görseli: `img/og-quantro.png` domain-etiketli yeni baskı (isteğe bağlı).