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
  { n: "iPhone SE ", w: 375, h: 667, t: 1 },
  { n: "iPhone 15 ", w: 393, h: 852, t: 1 },
  { n: "iPad Pro  ", w: 1024, h: 1366, t: 1 },
  { n: "MacBook  ", w: 1440, h: 900, t: 0 },
  { n: "Win1366  ", w: 1366, h: 768, t: 0 },
  { n: "KisaWin  ", w: 1280, h: 620, t: 0 },
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

  const closed = await page.evaluate(() => {
    const b = document.querySelector(".nav-burger");
    const cs = getComputedStyle(b);
    const links = getComputedStyle(document.querySelector(".nav-links")).display;
    return {
      burger: cs.display,
      size: `${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`,
      links,
    };
  });

  await page.click(".nav-burger");
  await page.waitForTimeout(500);

  const open = await page.evaluate(() => {
    const m = document.querySelector("#mobnav");
    const cs = getComputedStyle(m);
    const r = m.getBoundingClientRect();
    const items = [...m.querySelectorAll("a.ml, button.ml")];
    const de = document.documentElement;
    const last = items[items.length - 1].getBoundingClientRect();
    const small = items.filter((e) => {
      const b = e.getBoundingClientRect();
      return b.height < 32;
    }).length;
    return {
      open: m.classList.contains("open"),
      scrollH: Math.round(m.scrollHeight),
      clientH: Math.round(m.clientHeight),
      scrollable: m.scrollHeight > m.clientHeight,
      items: items.length,
      small,
      lastVisible: last.bottom <= de.clientHeight + 1,
      bodyLock: document.body.style.overflow,
      expanded: document.querySelector(".nav-burger").getAttribute("aria-expanded"),
      hScroll: de.scrollWidth - de.clientWidth,
    };
  });

  // ESC ile kapat
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const esc = await page.evaluate(() => ({
    open: document.querySelector("#mobnav").classList.contains("open"),
    bodyLock: document.body.style.overflow || "(serbest)",
  }));

  console.log(`[${d.n}] burger=${closed.burger} ${closed.size} nav-links=${closed.links}`);
  console.log(
    `   menu acildi=${open.open} | ${open.items} oge | kucuk hedef=${open.small} | son oge gorunur=${open.lastVisible}`,
  );
  console.log(
    `   kaydirma=${open.scrollable ? "var (" + open.scrollH + ">" + open.clientH + ")" : "yok"} | yatay tasma=${open.hScroll}px | aria-expanded=${open.expanded}`,
  );
  console.log(`   ESC ile kapandi=${!esc.open} | govde kilidi=${esc.bodyLock}`);
  await ctx.close();
}
await browser.close();
server.close();
