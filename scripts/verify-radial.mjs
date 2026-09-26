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
let fail = 0;
for (const d of DV) {
  const ctx = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: 2,
    hasTouch: !!d.t,
    isMobile: !!d.t,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/index.html`, { waitUntil: "load" });
  await page.waitForTimeout(600);

  const burger = await page.evaluate(() => {
    const b = document.querySelector(".nav-burger");
    const r = b.getBoundingClientRect();
    return {
      display: getComputedStyle(b).display,
      size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    };
  });

  await page.click(".nav-burger");
  await page.waitForTimeout(1200);

  const open = await page.evaluate(() => {
    const ring = document.getElementById("radial");
    if (!ring) return { err: "radial yok" };
    const items = [...ring.querySelectorAll(".ri")];
    const vw = innerWidth,
      vh = innerHeight;
    let offscreen = 0,
      small = 0,
      overlap = 0;
    const boxes = items.map((e) => {
      const b = e.getBoundingClientRect();
      if (b.width < 24 || b.height < 24) small++;
      if (b.left < -1 || b.top < -1 || b.right > vw + 1 || b.bottom > vh + 1) offscreen++;
      return b;
    });
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          c = boxes[j];
        if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) overlap++;
      }
    const core = ring.querySelector(".radial-core").getBoundingClientRect();
    const bar = ring.querySelector(".radial-bar");
    return {
      open: ring.classList.contains("open"),
      items: items.length,
      opacity: getComputedStyle(items[0]).opacity,
      offscreen,
      small,
      overlap,
      barVisible: bar ? getComputedStyle(bar).opacity : "yok",
      coreInView: core.left >= 0 && core.right <= vw && core.top >= 0 && core.bottom <= vh,
      hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyLock: document.body.style.overflow,
    };
  });

  // merkez butonu ile kapat
  await page.click(".radial-core");
  await page.waitForTimeout(600);
  const closedCore = await page.evaluate(
    () => !document.getElementById("radial").classList.contains("open"),
  );

  // ESC ile aç/kapat
  await page.click(".nav-burger");
  await page.waitForTimeout(700);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const closedEsc = await page.evaluate(() => ({
    open: document.getElementById("radial").classList.contains("open"),
    lock: document.body.style.overflow || "(serbest)",
  }));

  const ok =
    open.open &&
    open.items === 9 &&
    open.offscreen === 0 &&
    open.small === 0 &&
    open.overlap === 0 &&
    open.hScroll === 0 &&
    closedCore &&
    !closedEsc.open;
  if (!ok) fail++;
  console.log(`[${d.n}] burger=${burger.display} ${burger.size}`);
  console.log(
    `   halka=${open.items} oge | opaklik=${open.opacity} | ekran disi=${open.offscreen} | kucuk=${open.small} | cakisma=${open.overlap}`,
  );
  console.log(
    `   alt bar=${open.barVisible} | merkez ekranda=${open.coreInView} | yatay tasma=${open.hScroll}px | govde kilidi=${open.bodyLock}`,
  );
  console.log(
    `   merkez ile kapandi=${closedCore} | ESC ile kapandi=${!closedEsc.open} | kilit=${closedEsc.lock} | ${ok ? "GECTI" : "*** KALDI ***"}`,
  );
  if (errs.length) {
    console.log("   JS HATA:", errs.join(" | "));
    fail++;
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(fail === 0 ? "\nTUM CIHAZLAR GECTI" : `\n${fail} KONTROL BASARISIZ`);
process.exit(fail === 0 ? 0 : 1);
