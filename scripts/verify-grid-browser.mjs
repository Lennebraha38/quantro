#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · tarayici uctan uca dogrulama (cok-motorlu)

   Amac:
   - Sayfa gercek tarayicida hatasiz aciliyor mu?
   - Web Worker + quantro.js, o motorda histogrami dogru uretiyor mu?
     (counts toplami = shots)
   - Ilk katkidan sonra ag toplami (stats+liderlik) yenileniyor mu?
   - HICBIR VERI YAZILMAZ: yalnizca /result POST'u sahtelenir; /unit,
     /stats gercek. Boylece canli veri seti kirlenmez.

   Service worker BLOKLANIR. Aksi halde Playwright route'u SW tarafindan
   baypas edilebilir ve sahtelenen /result gercekten sunucuya gidebilir
   (bu hatayi bir kez yaptik — tekrar olmasin).

   Kullanim:
     node scripts/verify-grid-browser.mjs                     # chromium
     BROWSER=webkit  node scripts/verify-grid-browser.mjs     # Safari motoru
     BASE_URL=http://localhost:3000 node scripts/verify-grid-browser.mjs
   ═══════════════════════════════════════════════════════════════ */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium, webkit, firefox } = require("playwright");

const ENGINE = (process.env.BROWSER || "chromium").toLowerCase();
const BASE = process.env.BASE_URL || "https://quantro-1.vercel.app";
const engines = { chromium, webkit, firefox };
const engine = engines[ENGINE];
if (!engine) {
  console.error("Bilinmeyen BROWSER: " + ENGINE + " (chromium|webkit|firefox)");
  process.exit(2);
}

let failures = 0;
function check(label, cond, extra) {
  console.log("   " + (cond ? "OK  " : "HATA") + " " + label + (extra ? " — " + extra : ""));
  if (!cond) failures++;
}

const browser = await engine.launch();
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + String(e.message).slice(0, 160)));
page.on("console", (m) => {
  if (m.type() === "error") errs.push("console: " + m.text().slice(0, 160));
});

const events = [];
const resultBodies = [];
let unitShots = null;

await page.route("**/api/grid**", async (route) => {
  try {
    const url = route.request().url();
    const op = (url.match(/op=([a-z]+)/) || [])[1] || "?";
    events.push({ op, t: Date.now() });

    if (op === "unit") {
      const resp = await route.fetch();
      try {
        unitShots = (await resp.json()).shots;
      } catch (e) {}
      return await route.fulfill({ response: resp });
    }
    if (op === "result") {
      try {
        const b = route.request().postDataJSON();
        const c = b.counts || {};
        const arr = Array.isArray(c) ? c : [c["0"] || 0, c["1"] || 0, c["2"] || 0, c["3"] || 0];
        resultBodies.push({
          sum: arr.reduce((a, x) => a + x, 0),
          experiment: b.experiment,
          theta: b.theta,
          seed: b.seed,
        });
      } catch (e) {}
      // Sunucuya YAZMA: sahte basari.
      return await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, stored: true, verified: true }),
      });
    }
    return await route.continue();
  } catch (e) {
    /* kapanis sirasinda ucustaki istekler — yoksay */
  }
});

console.log("\n── GRID tarayici testi · motor=" + ENGINE + " · " + BASE + " ──");

await page.goto(BASE + "/quantro-grid.html", { waitUntil: "load", timeout: 30000 });
await page.waitForFunction(() => window.__quantroGrid && window.__quantroGrid.start, {
  timeout: 25000,
});
// canli istatistik yuklenene kadar bekle (asiyon: boot'ta loadStats cagrilir)
await page
  .waitForFunction(
    () => {
      const i = window.__quantroGrid.stats();
      return i && i.node && i.stats;
    },
    { timeout: 20000 },
  )
  .catch(() => {});
const info = await page.evaluate(() => window.__quantroGrid.stats());
check("istemci yuklendi, dugum kimligi var", !!(info && info.node));
check("canli istatistik alani dolu (data-source)", !!(info && info.stats));

await page.evaluate(() => window.__quantroGrid.start());
// en az 2 sonuc islenene kadar bekle (en fazla 15 sn)
const t0 = Date.now();
while (resultBodies.length < 2 && Date.now() - t0 < 15000) {
  await page.waitForTimeout(200);
}
await page.evaluate(() => {
  try {
    window.__quantroGrid.stop();
  } catch (e) {}
});

const results = events.filter((e) => e.op === "result");
const stats = events.filter((e) => e.op === "stats");
const lb = events.filter((e) => e.op === "leaderboard");
const statsAfterFirst = results.length && stats.some((s) => s.t > results[0].t);
const lbAfterFirst = results.length && lb.some((s) => s.t > results[0].t);

check("en az bir is birimi islendi", resultBodies.length >= 1, "result=" + resultBodies.length);
check(
  "worker histogram uretti (toplam = shots)",
  resultBodies.length >= 1 && unitShots != null && resultBodies[0].sum === unitShots,
  "sum=" + (resultBodies[0] && resultBodies[0].sum) + " shots=" + unitShots,
);
check(
  "her sonuc toplami = shots",
  resultBodies.length >= 1 && resultBodies.every((r) => r.sum === unitShots),
);
check("ilk katkidan sonra stats yenilendi", !!statsAfterFirst);
check("ilk katkidan sonra liderlik yenilendi", !!lbAfterFirst);
check("sayfa/consol hatasi yok", errs.length === 0, errs.slice(0, 3).join(" | "));

await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => {});
await context.close();
await browser.close();

console.log(
  "\n" + (failures === 0 ? "GRID TARAYICI TEMIZ" : "BASARISIZ: " + failures + " kontrol"),
);
process.exit(failures === 0 ? 0 : 1);
