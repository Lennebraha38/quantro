# Kuantum Dolanıklık: Einstein'ı Rahatsız Eden "Hayalet"

**Emoji:** 🔗
**Etiketler:** kuantum, dolanıklık, temel-fizik
**Özet:** İki parçacık, aralarında kocaman mesafeler olsa bile birbirine bağlı davranır. Einstein buna "uzaktan ürkütücü etki" demişti — haklıydı, ürkütücü ama gerçek.

## İki Parçacık, Tek Durum

Kuantum dolanıklık (entanglement), iki veya daha fazla parçacığın durumlarının birbirinden bağımsız olarak tanımlanamadığı kuantum olgusudur. İki parçacığı dolanık hâle getirdiğinizde, aralarındaki mesafe ne olursa olsun, birinin durumu diğerinin durumuyla anında korelasyon gösterir.

En meşhur örneği Bell durumudur:

`|Φ⁺⟩ = (|00⟩ + |11⟩) / √2`

Bu ifade şunu söyler: Ölçüm yapana kadar her iki parçacığın da "0" ya da her ikisinin de "1" olma ihtimali vardır. Ama ikisinden biri ölçüldüğünde diğeri, kilometrelerce uzakta olsa bile, aynı değeri alır.

## Einstein Neden Rahatsızdı?

1935'te Einstein, Podolsky ve Rosen (EPR) bu durumu analiz etti. Einstein'ın itirazı basitti: Bir parçacığın özelliği, uzakta başka bir parçacığa "söylenmeden" anında değişmemeli. Bilgi ışıktan hızlı gidemez — görelilik teorisinin temel kuralı budur.

Einstein bu durumu "uzaktan ürkütücü etki" (spooky action at a distance) olarak adlandırdı ve kuantum mekaniğinin eksik olduğunu savundu. Ona göre parçacıkların "gizli değişkenleri" vardı; teoride görünmeyen ama gerçekte önceden belirlenmiş özellikler.

## Bell'in Cevabı

1964'te fizikçi John Bell bu tartışmayı test edilebilir hâle getirdi. **Bell eşitsizliği** adlı matematiksel sınır, iki olası dünyayı ayırt ediyordu:

- **Gizli değişkenler doğruysa:** Bell eşitsizliği her zaman sağlanır (istatistiksel sınır aşılamaz).
- **Kuantum mekaniği doğruysa:** Bell eşitsizliği ihlal edilir.

Deneysel testler (Aspect 1982, ve sonrasında binlerce kez) kuantum mekaniğinin haklı olduğunu gösterdi: **Bell eşitsizliği ihlal ediliyor.** Evren, gizli değişkenli yerel bir teori değil.

## Bu "Bilgi" Aktarımı mı?

Kritik nokta: Dolanıklık bilgiyi ışıktan hızlı iletmez. Ölçüm sonucu rastgeledir — Alice sonucunu görmeden Bob'un sonucu hakkında hiçbir şey söyleyemez. Korelasyon kuantum kanunlarına uyar; ama bilgi ancak klasik kanallarla (ışık hızında) iletilebilir. Bu yüzden görelilik güvende kalır.

## Ne İşe Yarar?

- **Kuantum anahtar dağıtımı (BB84):** Bir dinleyici (Eve) kuantum kanalını ölçerse, ölçüm durumu bozar ve taraflar dinlemeyi fark eder. Dolanıklık, kriptografiyi "fiziksel olarak güvenli" yapar.
- **Kuantum ışınlanma:** Madde değil, **bilgi** ışınlanır. Alice dolaşık bir çiftin yarısını paylaştığı Bob'a, kübitin durumunu iki klasik bit eşliğinde birebir aktarabilir.
- **Kuantum bilgisayarlar:** Dolanıklık, kübitler arası gücün kaynağıdır — klasik bilgisayarın asla taklit edemeyeceği hesaplama alanını açar.

## Lab'da Deneyin

Quantro Lab'daki Devre Simülatörü'nde q0'a **H** (Hadamard), ardından ikisine **CNOT** uygulayın ve ölçün. |00⟩ ve |11⟩ sonuçlarını neredeyse %50-%50 göreceksiniz — |01⟩ veya |10⟩ neredeyse asla çıkmaz. Bu, gözlerinizin önündeki dolanıklıktır.

Ardından BB84 aracını açın, Eve dinleyicisini etkinleştirin ve anahtarın nasıl çöktüğünü izleyin.

`quantro-1.vercel.app`
