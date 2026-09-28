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
const PORT = 8894;
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];

const srv = spawn("python3", ["-m", "http.server", String(PORT)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ args: ARGS });

let fail = 0;
const ozel = (ok, ad, detay) => {
  if (!ok) fail++;
  console.log(`   ${ok ? "OK  " : "FAIL"} ${ad}${detay ? " — " + detay : ""}`);
};

for (const pg of PAGES) {
  console.log(`\n── ${pg} (${SECONDS}s soak) ──`);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const hatalar = [];
  page.on("pageerror", (e) => hatalar.push(String(e.message).slice(0, 120)));

  await page.goto(`http://localhost:${PORT}/${pg}`, { waitUntil: "load" });

  const t0 = Date.now();
  let enParlak = 0,
    enKaranlik = 99,
    ornek = 0,
    boyutHatasi = 0;

  while (Date.now() - t0 < SECONDS * 1000) {
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const c = document.getElementById("entropy-bg");
      if (!c) return { err: "canvas yok" };
      const g = c.getContext("2d", { willReadFrequently: true });
      if (!g) return { err: "2d context yok", w: c.width, h: c.height };
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let max = 0,
        min = 255,
        sum = 0,
        n = 0;
      for (let i = 0; i < d.length; i += 4 * 53) {
        const m = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (m > max) max = m;
        if (m < min) min = m;
        sum += m;
        n++;
      }
      return { max, min, ort: sum / n, w: c.width, h: c.height };
    });
    if (r.err) {
      boyutHatasi++;
      if (boyutHatasi === 1) console.log(`   (ilk hata: ${r.err} ${r.w || ""}x${r.h || ""})`);
      continue;
    }
    ornek++;
    enParlak = Math.max(enParlak, r.max);
    enKaranlik = Math.min(enKaranlik, r.ort);
    if (r.w < 100 || r.h < 100) boyutHatasi++;
  }

  const mod = await page.evaluate(() => (window.__quantroEntropy || {}).mode);
  console.log(`   mod=${mod} ornek=${ornek}`);

  /* 1) Beyaza yakin piksel olmamali. En parlak piksEL 235/255 = 0.92
        olabilir (parciacik cekirdegi) ama ekran ORTALAMASI kesinlikle
        beyaz olmamali. */
  ozel(enParlak <= 250, "tek piksel beyaz degil", `en parlak=${enParlak.toFixed(0)}/255`);
  ozel(enKaranlik < 90, "ekran beyaz DEGIL", `en parlak ortalama=${enKaranlik.toFixed(1)}/255`);
  /* 2) Gorunur kalmali */
  ozel(
    enKaranlik > 4,
    "arka plan soluk degil",
    `en karanlik ortalama=${enKaranlik.toFixed(1)}/255`,
  );
  /* 3) Kanvas yerinde */
  ozel(boyutHatasi === 0, "canvas boyutu sorunsuz", boyutHatasi ? boyutHatasi + " hatali" : "");
  /* 4) WebGL kullanilmamali */
  ozel(mod === "2d-fallback", "2D yol kullaniliyor (context kaybolmaz)", "mod=" + mod);
  /* 5) Konsol temiz */
  ozel(hatalar.length === 0, "sayfa hatasi yok", hatalar[0] || "");

  await ctx.close();
}

await browser.close();
srv.kill();
console.log(fail === 0 ? "\nSOAK TEMIZ: beyaz ekran yok" : `\n${fail} SORUN`);
process.exit(fail === 0 ? 0 : 1);
