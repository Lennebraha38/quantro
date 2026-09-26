import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const port = await new Promise((r) => server.listen(0, () => r(server.address().port)));
const BASE = `http://127.0.0.1:${port}`;
const browser = await chromium.launch();

/* ── 1) Kademeli açılış: her öğe merkezden farklı anda çıkmalı ── */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/index.html`, { waitUntil: "load" });
await page.waitForTimeout(500);

const frames = [];
await page.evaluate(() => {
  document.getElementById("burger").click();
});
for (let f = 0; f < 26; f++) {
  frames.push(
    await page.evaluate(() => {
      const items = [...document.querySelectorAll("#radial .ri")];
      return items.map((e) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
        return { d: Math.round(Math.hypot(m.e, m.f)), o: +getComputedStyle(e).opacity };
      });
    }),
  );
  await page.waitForTimeout(30);
}
const core = { x: 720, y: 450 };
console.log("KADEMELI ACIILIS (her ogenin merkeze uzakligi, 30ms aralikla):");
[0, 2, 4, 6, 9, 13, 20, 25].forEach((f) => {
  if (f >= frames.length) return;
  const d = frames[f].map((x) => x.d);
  const o = frames[f].map((x) => x.o);
  console.log(
    `  t=${String(f * 30).padStart(3)}ms  mesafe: ${d
      .slice(0, 9)
      .map((x) => String(x).padStart(3))
      .join("")}  |  opaklik: ${o.map((x) => x.toFixed(1)).join("")}`,
  );
});
const stagger = frames[2].map((x) => x.d);
const distinct = new Set(stagger).size;
console.log(
  `  -> t=60ms'de ${distinct} farkli mesafe = ${distinct > 1 ? "KADEMELI (içeriden dışarı) ✓" : "KADEMESIZ ✗"}`,
);

/* ── 2) i18n: dil değişince halka etiketleri değişmeli ── */
const tr = await page.evaluate(() =>
  [...document.querySelectorAll("#radial .ri span")].map((e) => e.textContent),
);
await page.evaluate(() => {
  document.getElementById("radial").classList.remove("open");
  toggleLang();
});
await page.waitForTimeout(300);
await page.evaluate(() => {
  document.getElementById("burger").click();
});
await page.waitForTimeout(900);
const lang = await page.evaluate(() => document.documentElement.lang);
const other = await page.evaluate(() =>
  [...document.querySelectorAll("#radial .ri span")].map((e) => e.textContent),
);
const barLang = await page.evaluate(
  () => document.querySelector("#radial [data-lang-toggle]")?.textContent,
);
console.log(`\ni18N  dil=${lang}  alt bar dili=${barLang}`);
console.log(`  TR : ${tr.join(" · ")}`);
console.log(`  ${lang.toUpperCase()} : ${other.join(" · ")}`);
const changed = tr.filter((t, i) => t !== other[i]).length;
console.log(
  `  -> ${changed}/9 etiket cevrildi ${changed >= 5 ? "✓" : "(sadece kisa dil adi olanlar cevrildi)"}`,
);

await browser.close();
server.close();
