# Katkı Rehberi

Quantro'ya katkıda bulunduğun için teşekkürler! Aşağıdaki kurallar gözden
geçirildikten sonra pull request açabilirsin.

## Başlarken

```bash
git clone https://github.com/Lennebraha38/quantro.git
cd quantro
npm ci
npm run build   # bütünlük kontrolü
npm test        # birim testleri
```

## Geliştirme döngüsü

1. Değişikliğini açıkla: issue aç veya mevcut issue'ya bağlan.
2. `main`'den ayrı bir dal oluştur: `git checkout -b feat/kisa-aciklama`.
3. Değişikliği yap → en azından etkilenen alan için teste ekle.
4. Çalıştır:
   ```bash
   npm run check        # build + birim testler
   npm run test:e2e     # tarayıcı E2E (ön koşul: npx playwright install chromium)
   ```
5. PR aç; CI (birim + coverage + E2E) yeşil olmalı.

## Kurallar

- **Bağımlılıksız çalışma süresi:** runtime kodu (site + `/api`) harici npm
  paketi kullanmaz. Sadece devDependency olarak test araçları eklenebilir.
- **Yeni özellik = test:** simülatör/yapı mantığı için `test/*.test.js`,
  tarayıcı akışları için `test/e2e.test.js` ekle.
- **env'ler:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`,
  `AUTH_SECRET` gibi değerleri asla commit etme; `.env.*` gitignore'dadır.
- **Güvenlik hassasiyeti:** şifre/token doğrulama `api/_lib.js`'deki timing-safe
  yardımcıları kullanmalı (`safeEqual`, `verifyAdminPassword`, `verifyToken`).
- **CSS:** yeni stilleri `css/` altındaki sayfa grubu dosyasında tut;
  inline `<style>` bloğu ekleme. Ortak görünüm `css/base.css`'ten gelir.
- **i18n:** ana site metinleri `app.js` → `I18N`'den, lab `lab-core.js` →
  `I18N`'den beslenir; her dildaki dil dosyasına da ekle (`/lab/i18n-*.js`).

## Sürüm notları

Kullanıcıya görünür değişiklikleri `CHANGELOG.md`'ye ekle.