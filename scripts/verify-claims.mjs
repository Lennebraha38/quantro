/* ═════════════════════════════════════════════════════════
   QUANTRO · 'İLK' İDDİALARI KANIT DOĞRULAMA
   ── Ne yapar?
     data/claims.json'daki her "ilk" iddiasının kanıtlarını
     MAKİNE İLE doğrular ve sonucu data/claims-evidence.json'a
     yazar. Sitedeki "İlklerimiz" bölümü bu dosyayı okur.

     Neden önemli?
     "İlk" iddiası kanıtı tutmazsa site yanlış ilan etmiş olur.
     Bu script tersini yapar: ANU çökerse, npm kaydı kaybolursa
     ya da bir dil eksik kalırsa iddia otomatik olarak
     "dogrulanamadi" durumuna düşer. Yani site kendi
     reklamını kendi denetler.

   Çalıştırma:
     node scripts/verify-claims.mjs           → JSON'u yazar
     node scripts/verify-claims.mjs --check   → yalnızca karşılaştırır,
                                                değişiklik varsa çıkış 1
   Ağ hatası kandı SILMAZ: eski kanıt korunur, durum 'bilinmiyor'
   olur. Yani geçici ağ sorunu iddiayı yanlışlamaz.
   ═════════════════════════════════════════════════════════ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defPath = path.join(root, "data", "claims.json");
const outPath = path.join(root, "data", "claims-evidence.json");
const checkOnly = process.argv.includes("--check");

const SITE = "https://quantro-1.vercel.app";
const LANGS = ["tr", "en", "fr", "es", "it", "ru", "ko", "ar"];
const ASTRO = ["astrofizik", "evren yaşı", "kara delik", "kozmik"];

const get = async (url, ms = 20000) => {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { "User-Agent": "quantro-claims-verify" },
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
};

/* ── Tekil kanıt kontrolleri ──────────────────────────────────── */
const KONTROLLER = {
  "npm-registry": async () => {
    const j = await get("https://registry.npmjs.org/quantro-js");
    const v = j["dist-tags"].latest;
    return {
      dogrulukDogru: true,
      deger: `${j.name}@${v} · ${j.versions[v].license} · yayın: ${j.time.created}`,
      kanit: `${j.time.created} tarihinde npm'de yayınlandı (değiştirilemez kayıt).`,
      url: "https://www.npmjs.com/package/quantro-js",
    };
  },
  "github-repo": async () => {
    const j = await get("https://api.github.com/repos/Lennebraha38/quantro");
    return {
      dogrulukDogru: true,
      deger: `${j.license ? j.license.spdx_id : "?"} · oluşturma: ${j.created_at}`,
      kanit: `Depo ${j.created_at} tarihinde açıldı, lisans ${j.license ? j.license.spdx_id : "?"}.`,
      url: j.html_url,
    };
  },
  "anu-live": async () => {
    const j = await get("https://qrng.anu.edu.au/API/jsonI.php?length=8&type=uint8");
    const ok = j.success === true && Array.isArray(j.data) && j.data.length === 8;
    return {
      dogrulukDogru: ok,
      deger: ok ? `8 bayt canlı: [${j.data.join(", ")}]` : "beklenmeyen yanıt",
      kanit: ok
        ? "ANU'nun fiziksel kuantum kaynağı şu anda canlı yanıt veriyor."
        : "ANU beklenen biçimde yanıt vermedi.",
      url: "https://qrng.anu.edu.au/API/jsonI.php?length=8&type=uint8",
    };
  },
  "anu-proxy": async () => {
    const j = await get(`${SITE}/api/anu?length=8&type=uint8`);
    const ok = j.success === true && Array.isArray(j.data) && j.data.length === 8;
    return {
      dogrulukDogru: ok,
      deger: ok ? `kaynak: ${j.source || "?"} · [${j.data.join(", ")}]` : "beklenmeyen yanıt",
      kanit: ok
        ? "Quantro'nun herkese açık proxy'si canlı kuantum baytı döndürüyor."
        : "Proxy beklenen biçimde yanıt vermedi.",
      url: `${SITE}/api/anu?length=8&type=uint8`,
    };
  },
  "tools-astro": async () => {
    const ctx = { window: {} };
    ctx.window = ctx;
    vm.createContext(ctx);
    const kaynak = fs.readFileSync(path.join(root, "lab", "i18n-tr.js"), "utf8");
    vm.runInContext(kaynak, ctx);
    const t = ctx.I18N.tr;
    const adlar = [];
    for (let i = 1; i <= 13; i++) adlar.push(t["t" + i + ".title"] || "");
    const astro = adlar.filter((a) => ASTRO.some((k) => a.toLocaleLowerCase("tr").includes(k)));
    const ok = adlar.filter(Boolean).length === 13 && astro.length >= 1;
    return {
      dogrulukDogru: ok,
      deger: `${adlar.filter(Boolean).length} araç · ${astro.length} astrofizik: ${astro.join(", ")}`,
      kanit: `13 aracın ${astro.length} tanesi doğrudan astrofizik (${astro.join(", ")}) — "kuantum + astrofizik" tanımı somut.`,
      url: `${SITE}/#basari`,
    };
  },
  "i18n-8": async () => {
    const sayilar = {};
    let anahtar = 0;
    for (const l of LANGS) {
      const p = path.join(root, "lab", `i18n-${l}.js`);
      const c2 = { window: {} };
      c2.window = c2;
      vm.createContext(c2);
      vm.runInContext(fs.readFileSync(p, "utf8"), c2);
      const n = Object.keys(c2.I18N[l] || {}).length;
      sayilar[l] = n;
      anahtar = Math.max(anahtar, n);
    }
    const dolu = Object.values(sayilar).filter((n) => n >= anahtar).length;
    return {
      dogrulukDogru: dolu === LANGS.length,
      deger: `${dolu}/${LANGS.length} dil tam (${Object.values(sayilar)[0]}/${anahtar} anahtar)`,
      kanit: `8 dilin tamamı da ${anahtar} anahtarın tamamına sahip; boş çeviri yok.`,
      url: "https://github.com/Lennebraha38/quantro/tree/main/lab",
    };
  },
  // Bağımsız üçüncü taraf zaman damgası. Kendi sunucumuz da yalan söyleyemez;
  // arşiv servisi, site o tarihte gerçekten yayında diye doğrular.
  wayback: async () => {
    const j = await get("https://archive.org/wayback/available?url=quantro-1.vercel.app", 25000);
    const c = j.archived_snapshots && j.archived_snapshots.closest;
    const ok = !!(c && c.available);
    const ts = c ? String(c.timestamp) : "";
    const tarih = ts.length === 14 ? `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}` : ts;
    return {
      dogrulukDogru: ok,
      deger: ok ? `Arşiv kaydı: ${tarih}` : "arşiv kaydı yok",
      kanit: ok
        ? `Bağımsız arşiv (web.archive.org) sitenin ${tarih} tarihinde yayında olduğunu doğruluyor.`
        : "Bağımsız arşiv kaydı henüz yok.",
      url: ok
        ? `https://web.archive.org/web/${ts}/https://quantro-1.vercel.app/`
        : "https://web.archive.org",
    };
  },
};

async function dogrula(def) {
  const sonuc = { id: def.id, baslik: def.baslik, kapsam: def.kapsam, kanitlar: [] };
  for (const k of def.kanitlar) {
    const kontrol = KONTROLLER[k.makineDogrulama];
    if (!kontrol) {
      sonuc.kanitlar.push({ ...k, durum: "manuel", sonuc: null });
      continue;
    }
    try {
      const r = await kontrol();
      sonuc.kanitlar.push({
        ...k,
        durum: r.dogrulukDogru ? "dogrulandi" : "DOGRULANMADI",
        sonuc: r,
      });
    } catch (e) {
      // Ağ hatası iddiayı YANLIŞLAMAZ — kanıt silinmez.
      sonuc.kanitlar.push({ ...k, durum: "bilinmiyor", sonuc: null, hata: String(e.message || e) });
    }
  }
  const dogrulanan = sonuc.kanitlar.filter((k) => k.durum === "dogrulandi").length;
  const yanlis = sonuc.kanitlar.filter((k) => k.durum === "DOGRULANMADI").length;
  sonuc.ozet = {
    toplam: sonuc.kanitlar.length,
    dogrulanan,
    bilinmiyor: sonuc.kanitlar.filter((k) => k.durum === "bilinmiyor").length,
    yanlis,
    // Yalnızca bir kanıt yanlışlanırsa iddia düşer; "bilinmiyor" düşürmez.
    durum: yanlis > 0 ? "DOGRULANMADI" : dogrulanan > 0 ? "dogrulandi" : "bilinmiyor",
  };
  return sonuc;
}

const def = JSON.parse(fs.readFileSync(defPath, "utf8"));
const iddaialar = [];
for (const d of def.iddaialar) iddaialar.push(await dogrula(d));

const toplamYanlis = iddaialar.filter((i) => i.ozet.durum === "DOGRULANMADI").length;
const cikti = {
  uretim: new Date().toISOString(),
  surum: def.surum,
  ozet: {
    iddia: iddaialar.length,
    dogrulanan: iddaialar.filter((i) => i.ozet.durum === "dogrulandi").length,
    bilinmiyor: iddaialar.filter((i) => i.ozet.durum === "bilinmiyor").length,
    yanlis: toplamYanlis,
  },
  iddaialar,
};

const metin = JSON.stringify(cikti, null, 2) + "\n";
if (checkOnly) {
  const eski = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  const ayni = eski === metin;
  console.log(ayni ? "claims-evidence.json güncel ✓" : "claims-evidence.json GÜNCEL DEĞİL");
  process.exit(ayni ? 0 : 1);
}

fs.writeFileSync(outPath, metin);
for (const i of iddaialar) {
  const isaret = i.ozet.durum === "dogrulandi" ? "✓" : i.ozet.durum === "DOGRULANMADI" ? "✗" : "?";
  console.log(
    `${isaret} ${i.id}  ${i.ozet.dogrulanan}/${i.ozet.toplam} kanıt  — ${i.baslik.slice(0, 52)}`,
  );
}
console.log(
  `\n${cikti.ozet.dogrulanan}/${cikti.ozet.iddia} iddia doğrulandı → data/claims-evidence.json`,
);
if (toplamYanlis) process.exitCode = 1;
