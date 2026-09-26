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
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

const rows = await page.evaluate(() => {
  const out = [];
  document
    .querySelectorAll(
      "h1, h2, h3, .d-title, .sec-title, .contact-h2, .b-title, .pi-title, .m-title, .step-title",
    )
    .forEach((el) => {
      const cs = getComputedStyle(el);
      const fs2 = parseFloat(cs.fontSize);
      if (fs2 < 22) return;
      const ls = cs.letterSpacing;
      const lsPx = ls === "normal" ? 0 : parseFloat(ls);
      const lh = cs.lineHeight === "normal" ? 0 : parseFloat(cs.lineHeight);
      out.push({
        sel:
          el.tagName.toLowerCase() +
          (el.className ? "." + String(el.className).split(" ").filter(Boolean).join(".") : ""),
        fs: Math.round(fs2),
        ls: lsPx,
        lsPct: Math.round((lsPx / fs2) * 1000) / 10,
        lhRatio: lh ? Math.round((lh / fs2) * 100) / 100 : "normal",
        text: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 42),
      });
    });
  return out;
});

console.log("BASLIK | punto | letter-spacing | % | line-height");
console.log("-------------------------------------------------------------");
rows.forEach((r) => {
  const bad_ls = r.ls > 0.4;
  const bad_lh = typeof r.lhRatio === "number" && (r.lhRatio > 1.25 || r.lhRatio < 0.95);
  const flag = (bad_ls ? " ARALIK" : "") + (bad_lh ? " SATIR" : "");
  console.log(
    `${r.fs}px ls=${r.ls}px (${r.lsPct}%) lh=${r.lhRatio}${flag}`.padEnd(46) + " " + r.text,
  );
});
console.log("-------------------------------------------------------------");
console.log(
  `toplam: ${rows.length} baslik | lspacing>0.4px: ${rows.filter((r) => r.ls > 0.4).length}`,
);

await browser.close();
srv.close();
