# SEO · Google Search Console + Bing Webmaster Kurulumu

Durum: `?lang=` URL parametreli hreflang (8 dil) + sitemap hazır. Bu rehber,
dizine ekleme ve doğrulamayı uçtan uca anlatır.

## 1) Alan adı kararını ver (önce)

Sitenin tamamındaki canonical/hreflang/sitemap/OG şu an `quantro-1.vercel.app`
üzerinde. Marka için kalıcı domain alınmadan GSC'ye göndermeyin — sonra
domain değişince her şey tekrar taşınır. Sıra:

1. Domain al (bkz. `MARKA/DOMAIN-KURULUM.md`).
2. Vercel projesine bağla.
3. Kodda canonical/hreflang/sitemap/robots/OG `https://quantro.dev` (veya
   seçtiğin) yap. (3 satırlık düzenleme — `vercel.json` + sitemap + her
   sayfanın head bloğu.)
4. Aşağıdakileri o yeni domainle uygula.

## 2) Google Search Console

1. https://search.google.com/search-console → "Mülk ekle" → **URL öneki**:
   `https://quantro.dev/`
2. **DNS doğrulama** (önerilir): verdiği TXT kaydını alan adı sağlayıcına ekle
   (Vercel DNS paneli üzerinden 1 dakika). TXT dışında herhangi bir HTML
   dosyası yükleme/kaldırma gerekmez.
3. **Sitemap gönder:** `https://quantro.dev/sitemap.xml`
4. **hreflang hata kontrolü:** URL Denetimi'yle `/?lang=en` aç, sonra
   "Sayfa dizine eklendi" bekle. Hata çıkarsa "Genel → Uluslararası hedefleme"
   raporuna bak.

Beklenen bilinen sınırlama: `?lang=` varyantları aynı DOM'u sunar (JS ile dil
değişir); Google bunu kabul eder ama içerik sinyalleri zayıftır. İleride
istediğinde her dil için gerçek alt dizin (`/en/`, `/ar/`) + Vercel Rewrite
+ sunucu tarafı dil cookie kurabiliriz.

## 3) Bing Webmaster Tools

1. https://www.bing.com/webmasters → **Import from GSC** (tek tıkla aktar).
2. Sitemap aynı URL ile otomatik alınır.

## 4) Anahtar kelime hedef tablosu

| Amaç | TR sorgu | EN sorgu |
|---|---|---|
| Lab ana sayfa | kuantum tarayıcı, kuantum rastgelelik | quantum random number generator |
| Araçlar | bloch küresi, kuantum devre simülatörü | quantum circuit simulator |
| Blog | kuantum dolanıklık, kara delik, gerçek rastgelelik | quantum entanglement |

Hedef: her sayfa yalnızca 1–2 temel sorguya odaklansın; başlık (title) bunlarla
başlasın, description davetkar bitsin.

## 5) İşlem listesi (kontrol çizelgesi)

- [ ] Domain bağlandı (bkz. DOMAIN-KURULUM)
- [ ] Canonical/hreflang/sitemap/robots/OG domain'e geçti
- [ ] GSC mülk eklendi (DNS TXT) → URL öneki
- [ ] Sitemap gönderildi → "Geçerli" durumu
- [ ] Başka sayfa (arastirma/simulasyon/lab) URL Denetimi + dizine ekleme
- [ ] Bing'e GSC'den import
- [ ] 2 hafta sonra "Performans" raporunda ilk TR sorgular görülüyor

## 6) Vercel'de notu düş

`vercel.json` içindeki CSP/header'lar domain bağımsız çalışır (kaynak
listeleri üçüncü parti CDN/Supabase), tek değişiklik canonical URL'lerdir.