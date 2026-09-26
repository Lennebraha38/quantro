import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const M = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
};
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    s.writeHead(404);
    return s.end();
  }
  s.writeHead(200, { "content-type": M[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
});
const port = await new Promise((r) => srv.listen(0, () => r(srv.address().port)));

const PAGES = process.argv[2]
  ? [process.argv[2]]
  : [
      "index.html",
      "iletisim.html",
      "arastirma.html",
      "simulasyon.html",
      "hakkimizda.html",
      "basarilar.html",
      "bilim.html",
      "docs.html",
    ];
const browser = await chromium.launch();

for (const p of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/${p}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("h1, h2, h3, div").forEach((el) => {
      if (!el.querySelector("br")) return;
      const spans = [...el.children].filter((c) => c.tagName === "SPAN");
      if (spans.length < 2) return;
      const cs = getComputedStyle(el);
      const fs2 = parseFloat(cs.fontSize);
      if (fs2 < 22) return;
      const brDisplay = getComputedStyle(el.querySelector("br")).display;
      const blockSpans = spans.every((s) => getComputedStyle(s).display === "block");
      // ardışık span'lar arası gerçek dikey bosluk
      let gap = null;
      for (let i = 0; i < spans.length - 1; i++) {
        const a = spans[i].getBoundingClientRect();
        const b = spans[i + 1].getBoundingClientRect();
        if (b.top > a.bottom) {
          gap = Math.round(b.top - a.bottom);
          break;
        }
      }
      out.push({
        cls: el.className ? String(el.className).split(" ")[0] : el.tagName.toLowerCase(),
        fs: Math.round(fs2),
        lh:
          cs.lineHeight === "normal"
            ? "n"
            : Math.round((parseFloat(cs.lineHeight) / fs2) * 100) / 100,
        blockSpans,
        brDisplay,
        gap,
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30),
      });
    });
    return out;
  });
  if (r.length) {
    console.log(`\n── ${p} ──`);
    r.forEach((x) => {
      const bad = x.blockSpans && x.brDisplay !== "none";
      console.log(
        `  ${x.fs}px lh=${x.lh} blockSpan=${x.blockSpans} br=${x.brDisplay} gap=${x.gap}px ${bad ? "  <-- PHANTOM SATIR" : ""}  "${x.text}"`,
      );
    });
  } else console.log(`\n── ${p} ──  (cok satirli baslik yok)`);
  await page.close();
}
await browser.close();
srv.close();
