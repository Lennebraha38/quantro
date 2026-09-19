# Gerçek Rastgelelik Nedir?

**Emoji:** 🎲
**Etiketler:** kuantum, rastgelelik, kriptografi
**Özet:** Bilgisayarların ürettiği rastgele sayılar aslında sahte. Gerçek rastgelelik yalnızca doğanın kuantum belirsizliğinden gelir. Peki bu nasıl mümkün?

## Rastgelelik Sandığımızdan Zor

Bir yazı tura atın. Yazı mı tura mı? Cevap gerçekten belirsizdir çünkü parayı etkileyen yüzlerce mikroskobik etkeni (el hareketi, hava sürtünmesi, yüzey pürüzlülüğü) hesap etmek imkânsızdır. Bu, "pratik" bir belirsizliktir: kuralları bilsek tahmin edebiliriz ama bilmiyoruz.

Bilgisayarların ürettiği rastgelelik ise daha da sınırlıdır. Klasik bir bilgisayar deterministtir — aynı girdi her zaman aynı çıktıyı verir. Bu yüzden "rastgele sayı üretme" fonksiyonları aslında bir algoritmayı belirli bir **tohum** (seed) değeriyle çalıştırır. Aynı tohum, her zaman aynı sayı dizisini üretir. Bu dizileri istatistiksel olarak rastgelemiş gibi yapmak için özenle tasarlanır, ama **gerçekte tahmin edilebilirdirler**.

Buna "sözde rastgelelik" (pseudo-randomness) denir. Bir kriptografi sistemi için bu, saldırganın tohumu tahmin edebileceği anlamına gelir.

## Kuantum Dünyasında Belirsizlik Gerçektir

Kuantum mekaniğinin devrimi tam burada yatar: temel düzeyde belirsizlik **doğanın kendisinin** bir özelliğidir, bilgi eksikliğimizin değil.

Bir elektron, ölçüm yapılana kadar süperpozisyon hâlindedir — belirli bir konumu yoktur. Ölçüm anında olasılıklardan biri "çöker". Bu çöküşün hangi sonucu vereceği, hiçbir teori tarafından tahmin edilemez. Fizik bu noktada kesin bir cevap vermez; sadece olasılık verir.

Heisenberg belirsizlik ilkesi bu durumu özetler:

`Δx · Δp ≥ ℏ/2`

Bir parçacığın konumunu ne kadar kesin bilirseniz, momentumunu o kadar az bilirsiniz. Bu bir ölçüm cihazının hatası değil, **evrenin yapısıdır**.

## ANU Nasıl Gerçek Rastgelelik Üretiyor?

Avustralya Ulusal Üniversitesi'nin kuantum rastgelelik motoru, bu ilkeyi kullanır. Yarı saydam bir aynaya bir foton gönderilir; foton ya yansır ya da geçer. Bu iki sonucun hangisinin gerçekleşeceği kuantum belirsizliğine bağlıdır — tahmin edilemez.

Daha da güçlü bir yöntem: **vakum dalgalanması**. "Boş" uzay bile aslında boş değildir; kuantum alanları sürekli dalgalanır. Bu dalgalanmaların gürültüsü ölçülerek gerçek, tahmin edilemez rastgele bitler üretilir.

Quantro Lab'daki Kuantum Rastgelelik Motoru, ANU'nun bu gerçek kuantum kaynağına bağlanır. Yani ekranda gördüğünüz sayılar bir algoritmanın değil, **evrenin kendisinin** ürünüdür.

## Neden Önemli?

Gerçek rastgelelik üç alanda hayati rol oynar:

- **Kriptografi:** Şifreleme anahtarları tahmin edilemez olmalıdır. Sözde rastgele anahtar, çözülebilir demektir.
- **Bilimsel simülasyon:** Monte Carlo simülasyonları rastgele örneklemeye dayanır; kaynak ne kadar iyi olursa sonuç o kadar güvenilir olur.
- **Kuantum ağlar:** Kuantum anahtar dağıtımı, rastgeleliği güvenliğin temeli yapar.

## Siz de Deneyin

Kavramı kağıt üzerinde anlamak bir şeydir, görmek başka. Quantro Lab'daki rastgelelik motorunda "Gerçek Kuantum (ANU)" kaynağını seçip bir sayı üretin. Ardından "Web Crypto" simülasyonuna geçin — ikisini ayırt edebilir misiniz? İstatistiksel testler (Ki-Kare) gerçek kuantum kaynağının gürültüsünü sıklıkla açığa çıkarır.

`quantro-1.vercel.app`
