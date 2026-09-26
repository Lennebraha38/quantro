/* ═════════════════════════════════════════════════════════
   QUANTRO · ÖNCEKİ-ART (PRIOR ART) TARAMASI
   ── Ne yapar?
     data/prior-art.json'deki rakip kayıt defterini denetler ve
     GitHub'ı TARİH SINIRLI şekilde tarayarak yeni rakip aday
     arar. Sitedeki "İlklerimiz" bölümünün dürüst kalmasını
     sağlayan ikinci mekanizmadır.

   ── Neden var?
     verify-claims.mjs "yaptığım şey doğru mu" diye bakar.
     Bu script ise "bunu daha önce yapan var mı" diye bakar.
     İkisi birlikte şu anlık resim verir:
       1. iddianın dayandığı olgular doğru mu
       2. o olguların öncesinde benzer bir şey var mı

     Asıl güvenlik kuralı (bu yüzden script hata verir):
       · KAYIT DEFTERİNDE celisir:true olan bir rakip varsa
         çıkış 1 → "bu iddia artık savunulamaz" demektir.
         Yani bir gün gerçekten bileşimin tamamını karşılayan
         bir rakip bulunursa site otomatik olarak KIRILIR.
         Böylece "ilk" iddiası kendi kendini yalanlayamaz.

     Bulunmamak kanıt değildir. Bu script kanıt üretmez; yalnızca
     "şu anda bilinen durum şu" diye tarihli bir kayıt tutar.

   Çalıştırma:
     node scripts/prior-art-scan.mjs           → raporu yazar
     node scripts/prior-art-scan.mjs --check    → değişiklik varsa çıkış 1
   ═════════════════════════════════════════════════════════ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defPath = path.join(root, "data", "prior-art.json");
const outPath = path.join(root, "data", "prior-art-scan.json");
const checkOnly = process.argv.includes("--check");

/* Tarama tarihinden ÖNCE oluşturulmuş projeler aranır.
   Çünkü öncelik sorusu "ondan önce var mıydı" sorusudur. */
const REFERANS = "2026-07-01";
const SORGULAR = [
  { q: "kuantum", etiket: "kuantum" },
  { q: "quantum simulator turkish", etiket: "turkish quantum simulator" },
  { q: "kuantum simülatör", etiket: "kuantum simülatör" },
  { q: "quantum tools turkish", etiket: "turkish quantum tools" },
];

const hata = [];
const uyari = [];

/* ── 1. Kayıt defteri denetimi (ölümcül) ────────────────────── */
const def = JSON.parse(fs.readFileSync(defPath, "utf8"));
const rakipler = Array.isArray(def.rakipler) ? def.rakipler : [];
if (!rakipler.length)
  hata.push("prior-art.json: 'rakipler' listesi boş — rakip kaydı silinmişse bu bir regresyondur");

for (const r of rakipler) {
  const etiket = r.ad || "(isimsiz kayit)";
  for (const alan of ["ad", "url", "ne", "gerekce"]) {
    if (!r[alan]) hata.push(`${etiket}: zorunlu alan eksik → "${alan}"`);
  }
  if (typeof r.celisir !== "boolean")
    hata.push(`${etiket}: "celisir" alani boolean olmali (true/false)`);
  if (r.tarih !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(r.tarih || ""))) {
    hata.push(`${etiket}: "tarih" ya YYYY-AA-GG ya da null olmali (tarih: "${r.tarih}")`);
  }
  if (r.tarih === null && !r.tarihNotu) {
    hata.push(
      `${etiket}: tarih null ise "tarihNotu" ile NEDEN bilinemedigi yazilmali (bosluk birakilmaz)`,
    );
  }
  if (!/^https:\/\//.test(r.url || "")) hata.push(`${etiket}: url https:// ile baslamali`);

  /* ── Güvenlik kuralı: bileşimi gerçekten karşılayan rakip ── */
  if (r.celisir === true) {
    hata.push(
      `${etiket}: celisir=true → bu kayit "once bu isi yapan vardi" demektir. ` +
        `Iddia savunulamaz; once iddiayi daralt veya kaldir, sonra bu kaydi celisir:true yap.`,
    );
  }
  if (r.manuelIncelemeGerekli === true && r.risk !== "yuksek") {
    uyari.push(`${etiket}: manuel inceleme gerekli ama risk alani "yuksek" degil`);
  }
}

/* Bileşimin kendisi tanımlı mı? Yoksa "ilk" boşlukta durur. */
const kombinasyon = def.kombinasyon?.ozellikler;
if (!Array.isArray(kombinasyon) || kombinasyon.length < 2) {
  hata.push(
    "prior-art.json: 'kombinasyon.ozellikler' en az 2 ozelligi icermeli — iddianin siniri tanimsizsa 'ilk' iddiasi tanimsizdir",
  );
}

/* ── 2. Canlı tarama: yeni rakip adayları ───────────────────────
   --check (CI kapısı) canlı AĞ ÇAĞRISI YAPMAZ. Denetim iki parçaya
   bölünmüştür:
     · kayıt defteri denetimi → ağdan bağımsız, deterministik, ÖLÜMCÜL
     · canlı rakip taraması   → ağa bağlı, zayıf, yalnızca raporlar
   Böylece CI yavaşlamaz ve ağ dalgalanması kapıyı bozmaz.
   Canlı tarama `npm run prior-art` ile ve gece akışında çalışır. */
const yeniAdaylar = [];
let taramaHatasi = null;
if (!checkOnly) {
  for (const { q, etiket } of SORGULAR) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q + ` created:<${REFERANS}`)}&per_page=10&sort=created&order=asc`;
    try {
      const r = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "application/vnd.github+json", "User-Agent": "quantro-prior-art" },
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const bilinen = new Set(
        rakipler.map((x) => (x.url || "").replace(/^https:\/\/github\.com\//i, "").toLowerCase()),
      );
      for (const it of j.items || []) {
        if (bilinen.has(String(it.full_name || "").toLowerCase())) continue; // zaten kayıtlı
        yeniAdaylar.push({
          depo: it.full_name,
          olusturma: (it.created_at || "").slice(0, 10),
          lisans: it.license?.spdx_id || "YOK",
          dil: it.language ?? "bilinmiyor",
          yildiz: it.stargazers_count ?? 0,
          aciklama: (it.description || "").replace(/\s+/g, " ").slice(0, 120),
          sorgu: etiket,
        });
      }
    } catch (e) {
      /* Ağ hatası taramayı BOZMAZ — yalnızca uyarı üretir.
       Yoksa her ağ dalgalanmasında sahte "temiz" sonuç çıkar. */
      taramaHatasi = `canli tarama tamamlanamadi: ${e.message}`;
    }
  }
  if (taramaHatasi) uyari.push(taramaHatasi);
  if (!yeniAdaylar.length && !taramaHatasi) {
    uyari.push("canli tarama hicbir yeni aday bulmadi — API erisimi veya sorgu degismis olabilir");
  }
}

/* ── 3. Rapor ───────────────────────────────────────────────── */
const celiren = rakipler.filter((r) => r.celisir).length;
const ozet =
  rakipler.length > 0
    ? `${rakipler.length} rakip kayitli, ${celiren} tanesi iddiayi celiriyor. ` +
      `Bilesimdeki yedi ozelligin tamami tek bir rakipte bulunamadi; bu "ilk" degil, "bu tarihe kadar bulunamadi" iddiasidir.`
    : "Rakip kaydi yok — bu bir tarama yapilmamis veya temizlenmis olabilir; guvenilmez.";

const sonuc = {
  uretim: new Date().toISOString(),
  referansTarih: REFERANS,
  kayitliRakip: rakipler.length,
  celirenRakip: celiren,
  yeniAday: yeniAdaylar.length,
  yeniAdaylar: yeniAdaylar
    .sort((a, b) => String(a.olusturma).localeCompare(String(b.olusturma)))
    .slice(0, 25),
  /* Sitenin okuyacağı tek cümle: neyin kanıtlandigi. */
  ozet,
};

/* --check yalnızca AĞDAN BAĞIMSIZ alanları karşılaştırır.
   yeniAdaylar canlı taramaya ağımlıdır; --check'te boş kalır ve
   dosyadaki dolu listeyle karşılaştırılırsa her zaman "değişti" der,
   yani kapı kalıcı olarak kırık olur. */
const cekirdek = (o) =>
  JSON.stringify({ r: o.referansTarih, k: o.kayitliRakip, c: o.celirenRakip, o: o.ozet });
const cekirdekAl = (s) => {
  try {
    const j = JSON.parse(s);
    return cekirdek(j);
  } catch {
    return null;
  }
};

/* ── 4. Denetim sonucu: HATA ÖNCE raporlanır ───────────────────
   Güvenlik kuralı (celisir:true) --check modunda da görünmeli;
   aksi halde CI kırmızıyı sebepsiz gösterir. */
for (const u of uyari) console.warn("  ! " + u);
if (hata.length) {
  console.error("\n✗ ÖNCEKİ-ART DENETİMİ BAŞARISIZ:");
  for (const h of hata) console.error("   · " + h);
  process.exit(1);
}

if (checkOnly) {
  const eski = fs.existsSync(outPath) ? cekirdekAl(fs.readFileSync(outPath, "utf8")) : null;
  if (eski === null) {
    console.error("✗ data/prior-art-scan.json yok veya bozuk — calistir: npm run prior-art");
    process.exit(1);
  }
  if (eski !== cekirdek(sonuc)) {
    console.error("✗ prior-art kaydi degisti — calistir: npm run prior-art");
    process.exit(1);
  }
  console.log(`✓ prior-art denetimi gecti (${rakipler.length} rakip kayitli, ${celiren} celiren)`);
} else {
  fs.writeFileSync(outPath, JSON.stringify(sonuc, null, 2) + "\n");
  console.log(`✓ prior-art: ${rakipler.length} rakip kayitli, ${sonuc.yeniAday} yeni aday`);
  if (yeniAdaylar.length) {
    console.log("  YENI ADAYLAR (incelenmeli — bileşimi karsiliyor mu?):");
    for (const y of sonuc.yeniAdaylar.slice(0, 10)) {
      const d = String(y.depo ?? "?");
      const l = String(y.licans ?? "?");
      const a = String(y.aciklama ?? "");
      console.log(`   · ${y.olusturma ?? "?"}  ${d.padEnd(38)} ${l.padEnd(11)} ${a.slice(0, 52)}`);
    }
  }
  console.log("  " + sonuc.ozet);
}
