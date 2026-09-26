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

const DV = [
  { n: "iPhone SE   ", w: 375, h: 667, t: 1 },
  { n: "iPhone 15   ", w: 393, h: 852, t: 1 },
  { n: "iPad Pro12.9", w: 1024, h: 1366, t: 1 },
  { n: "MacBook Air ", w: 1440, h: 900, t: 0 },
  { n: "Windows1366 ", w: 1366, h: 768, t: 0 },
];

const browser = await chromium.launch();
for (const d of DV) {
  const ctx = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: 2,
    hasTouch: !!d.t,
    isMobile: !!d.t,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/index.html`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(700);

  const nav = await page.evaluate(() => {
    const n = document.querySelector("#nav");
    const cs = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    const de = document.documentElement;
    return {
      pos: cs.position,
      top: Math.round(r.top),
      pad: cs.paddingTop,
      cls: n.className || "(yok)",
      burger: getComputedStyle(document.querySelector(".nav-burger")).display,
      links: getComputedStyle(document.querySelector(".nav-links")).display,
      hScroll: de.scrollWidth - de.clientWidth,
    };
  });

  const btn = await page.evaluate(() => {
    const g = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return {
        t: Math.round(r.top),
        b: Math.round(r.bottom),
        l: Math.round(r.left),
        r: Math.round(r.right),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    };
    const btt = g(".btt");
    const chat = g("#qtr-chat");
    let ov = null;
    if (btt && chat)
      ov = !(btt.r <= chat.l || btt.l >= chat.r || btt.b <= chat.t || btt.t >= chat.b);
    return { btt, chat, ov };
  });

  const scrolls = btn.ov ? "CAKISMA VAR" : "yok";
  console.log(`[${d.n}]`);
  console.log(
    `   nav ${nav.pos} | scroll sonrasi top=${nav.top}px ${nav.top < 0 ? "-> sayfayla asagi kaldi (yapismiyor)" : "-> YAPISIKAN"}`,
  );
  console.log(`   nav padding=${nav.pad} scrolled="${nav.cls}" -> kuculme/arkaplan yok`);
  console.log(`   burger=${nav.burger} nav-links=${nav.links} | yatay tasma=${nav.hScroll}px`);
  console.log(`   btt  ${btn.btt ? `${btn.btt.l},${btn.btt.t} ${btn.btt.w}x${btn.btt.h}` : "yok"}`);
  console.log(
    `   chat ${btn.chat ? `${btn.chat.l},${btn.chat.t} ${btn.chat.w}x${btn.chat.h}` : "yok"}`,
  );
  console.log(`   btt/chat cakismasi: ${scrolls}`);
  await ctx.close();
}
await browser.close();
server.close();
