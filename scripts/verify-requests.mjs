/* Sayfa yuklenirken gelen TUM 404/500 yanitlarini kaydeder.
   scripts/links.mjs yalnizca yerel baglantilari denetler; tarayici
   ise favicon, ogeler, harici URL'ler dahil her seyi ister. */
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["index.html"];

const PORT = 8899;
const srv = spawn("python3", ["-m", "http.server", String(PORT)], {
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
let fail = 0;

for (const pg of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const bad = [];
  const seen = new Set();

  page.on("response", (r) => {
    const s = r.status();
    const u = r.url();
    // /api/* sunucu-suz fonksiyonlardir; statik dosya sunucusunda
    // (python3 -m http.server) tanimli degildir, 404 vermesi BEKLENIR.
    // Vercel'de gercekten cozuluyor; canli dogrulama ayrica bakilir.
    if (new URL(u).pathname.startsWith("/api/")) return;
    if (s >= 400 && !seen.has(u)) {
      seen.add(u);
      bad.push(`${s} ${u.replace(`http://localhost:${PORT}`, "")}`);
    }
  });
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (!seen.has(u)) {
      seen.add(u);
      bad.push(`FAIL ${r.failure()?.errorText} ${u.replace(`http://localhost:${PORT}`, "")}`);
    }
  });
  page.on("console", (m) => {
    if (m.type() === "error") bad.push(`CONSOLE ${m.text()}`);
  });

  await page.goto(`http://localhost:${PORT}/${pg}`, { waitUntil: "load" });
  await page.waitForTimeout(3500);

  if (bad.length) {
    fail += bad.length;
    console.log(`KALDI  ${pg} — ${bad.length} sorun`);
    for (const b of bad) console.log(`       ${b}`);
  } else {
    console.log(`GECTI  ${pg} — tum istekler 2xx/3xx`);
  }
  await ctx.close();
}

await browser.close();
srv.kill();
console.log(fail === 0 ? "\nHATALI ISTEK YOK" : `\n${fail} SORUN`);
process.exit(fail === 0 ? 0 : 1);
