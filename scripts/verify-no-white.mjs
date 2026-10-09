/* ═══════════════════════════════════════════════════════════════
   BEYAZ EKRAN REGRESYON TESTI (soak)

   Kullanici "bir sure sonra beyaz ekran" diyordu. Gercek neden
   WebGL context kaybiydi: shader'lar dogru derleniyordu ama context
   180 ms - 6 sn sonra duser ve canvas beyaz kalirdi. Arka plan
   artik 2D (context kaybolmaz, source-over beyaz uretemez).

   Bu test SURELI IZLEME yapar: her sayfayi saniyelerce acar, periyodik
   olarak GERCEK pikselleri okur ve su kosullari dener:
     - hicbir anda beyaza yakin piksel olmamali
     - arka plan gorunur kalmali (cok karanlik da olmamali)
     - kanvas her zaman yerinde ve dogru boyutta olmali
     - konsolda hata olmamali
   ═══════════════════════════════════════════════════════════════ */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PAGES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["index.html", "hakkimizda.html", "blog.html", "quantro-lab.html", "iletisim.html"];
const SECONDS = Number(process.env.SOAK_SECONDS || 45);
/* CANLI=1 ile yerel sunucu yerine production adresi denetlenir. */
const CANLI = process.env.CANLI === "1";
const ORIGIN = CANLI ? "https://quantro-1.vercel.app" : `http://localhost:${8894}`;
const PORT = 8894;
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

let srv = null;
if (!CANLI) {
  srv = spawn("python3", ["-m", "http.server", String(PORT)], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 1200));
}
const browser = await chromium.launch({ args: ARGS });

let fail = 0;
const ozel = (ok, ad, detay) => {
  if (!ok) fail++;
  console.log(`   ${ok ? "OK  " : "FAIL"} ${ad}${detay ? " — " + detay : ""}`);
};

for (const pg of PAGES) {
  console.log(`\n── ${ORIGIN}/${pg} (${SECONDS}s soak) ──`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const hatalar = [];
  page.on("pageerror", (e) => hatalar.push(String(e.message).slice(0, 120)));

  await page.goto(`${ORIGIN}/${pg}`, { waitUntil: "load" });

  const t0 = Date.now();
  const ortalamalar = [];
  let enParlak = 0,
    beyazPiksel = 0,
    boyutHatasi = 0,
    sira = 0;

  while (Date.now() - t0 < SECONDS * 1000) {
    await page.waitForTimeout(1500);
    /* Ilk iki ornemek atilir: sayfa ilk karede henuz cizilmemis
       olabiliyor (canvas temizleme / resize). Tek bir bos kare
       "ekran siyah" sanilip testi yanlis alarmla dusuruyordu. */
    sira++;
    if (sira <= 2) continue;
    const r = await page.evaluate(() => {
      const c = document.getElementById("entropy-bg");
      if (!c) return { err: "canvas yok" };
      const g = c.getContext("2d", { willReadFrequently: true });
      if (!g) return { err: "2d context yok", w: c.width, h: c.height };
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let max = 0,
        white = 0,
        sum = 0,
        n = 0;
      for (let i = 0; i < d.length; i += 4 * 53) {
        const m = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (m > max) max = m;
        if (m > 235) white++;
        sum += m;
        n++;
      }
      return { max, ort: sum / n, beyazPct: (white / n) * 100, w: c.width, h: c.height };
    });
    if (r.err) {
      boyutHatasi++;
      if (boyutHatasi === 1) console.log(`   (ilk hata: ${r.err} ${r.w || ""}x${r.h || ""})`);
      continue;
    }
    ortalamalar.push(r.ort);
    enParlak = Math.max(enParlak, r.max);
    beyazPiksel = Math.max(beyazPiksel, r.beyazPct);
    if (r.w < 100 || r.h < 100) boyutHatasi++;
  }

  ortalamalar.sort((a, b) => a - b);
  const medyan = ortalamalar.length ? ortalamalar[Math.floor(ortalamalar.length / 2)] : 0;
  const enSoluk = ortalamalar.length ? ortalamalar[0] : 0;
  const mod = await page.evaluate(() => (window.__quantroEntropy || {}).mode);
  console.log(`   mod=${mod} ornek=${ortalamalar.length}`);
  console.log(
    `   ortalama: en soluk=${enSoluk.toFixed(1)} medyan=${medyan.toFixed(1)}/255` +
      ` | en parlak=${enParlak.toFixed(0)}/255 | beyaz%=${beyazPiksel.toFixed(2)}`,
  );

  /* 1) Hicbir anda beyaza yakin piksel olmamali. Tek bir parlak
        parciacik cekirdegi olabilir ama oran sifira yakin kalmali. */
  ozel(beyazPiksel < 0.5, "beyaza yakin piksel yok", `%${beyazPiksel.toFixed(2)}`);
  /* 2) Ekran beyaz DEGIL. Medyan kullanilir: tek bir kareye
        bagli kalan bir kare yanlis alarm uretiyordu. */
  ozel(medyan < 90, "ekran beyaz DEGIL", `medyan=${medyan.toFixed(1)}/255`);
  /* 3) Gorunur kalmali */
  ozel(medyan > 4, "arka plan soluk degil", `medyan=${medyan.toFixed(1)}/255`);
  /* 3) Kanvas yerinde */
  ozel(boyutHatasi === 0, "canvas boyutu sorunsuz", boyutHatasi ? boyutHatasi + " hatali" : "");
  /* 4) WebGL kullanilmamali */
  ozel(mod === "2d-fallback", "2D yol kullaniliyor (context kaybolmaz)", "mod=" + mod);
  /* 5) Konsol temiz */
  ozel(hatalar.length === 0, "sayfa hatasi yok", hatalar[0] || "");

  await ctx.close();
}

await browser.close();
if (srv) srv.kill();
console.log(fail === 0 ? "\nSOAK TEMIZ: beyaz ekran yok" : `\n${fail} SORUN`);
process.exit(fail === 0 ? 0 : 1);
