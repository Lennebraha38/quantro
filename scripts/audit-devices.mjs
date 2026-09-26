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
    return res.end("nf");
  }
  res.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});

const DEVICES = [
  { n: "iPhone SE", w: 375, h: 667, dpr: 2, touch: true },
  { n: "iPhone 13", w: 390, h: 844, dpr: 3, touch: true },
  { n: "iPhone 15 Pro", w: 393, h: 852, dpr: 3, touch: true },
  { n: "iPhone 15 ProMax", w: 430, h: 932, dpr: 3, touch: true },
  { n: "iPad mini", w: 744, h: 1133, dpr: 2, touch: true },
  { n: "iPad Air", w: 820, h: 1180, dpr: 2, touch: true },
  { n: "iPad Pro 11", w: 834, h: 1194, dpr: 2, touch: true },
  { n: "iPad Pro 12.9", w: 1024, h: 1366, dpr: 2, touch: true },
  { n: "MacBook Air 13", w: 1440, h: 900, dpr: 2, touch: false },
  { n: "MacBook Pro 16", w: 1728, h: 1117, dpr: 2, touch: false },
  { n: "Windows 1366", w: 1366, h: 768, dpr: 1, touch: false },
  { n: "Windows 4K", w: 3840, h: 2160, dpr: 2, touch: false },
  { n: "Android small", w: 360, h: 740, dpr: 3, touch: true },
];

const PAGES = [
  "index.html",
  "basarilar.html",
  "bilim.html",
  "hakkimizda.html",
  "blog.html",
  "simulasyon.html",
];

const server0 = await new Promise((r) => server.listen(0, () => r(server.address().port)));
const BASE = `http://127.0.0.1:${server0}`;
fs.mkdirSync("tmp/shots", { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const d of DEVICES) {
  const ctx = await browser.newContext({
    viewport: { width: d.w, height: d.h },
    deviceScaleFactor: d.dpr,
    hasTouch: d.touch,
    isMobile: d.touch,
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(m.text().slice(0, 120));
  });
  page.on("pageerror", (e) => errs.push("JS: " + e.message.slice(0, 120)));

  for (const pg of PAGES) {
    errs.length = 0;
    await page.goto(`${BASE}/${pg}`, { waitUntil: "load" });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);

    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const over = [];
      const vw = de.clientWidth;
      for (const el of document.querySelectorAll("body *")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (b.right > vw + 2 || b.left < -2) {
          const cs = getComputedStyle(el);
          if (cs.position === "fixed") continue;
          over.push(
            `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]} r=${Math.round(b.right)}`,
          );
        }
      }
      // kucuk dokunma hedefleri
      const small = [];
      for (const el of document.querySelectorAll("a,button,input,select,textarea")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (b.height < 32 || b.width < 24) {
          small.push(
            `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]} ${Math.round(b.width)}x${Math.round(b.height)}`,
          );
        }
      }
      // nav sabit mi
      const nav = document.querySelector("nav#nav");
      const navCS = nav ? getComputedStyle(nav) : null;
      return {
        hScroll: de.scrollWidth - de.clientWidth,
        over: [...new Set(over)].slice(0, 4),
        small: [...new Set(small)].slice(0, 4),
        navPos: navCS ? navCS.position : "yok",
        title: document.title,
      };
    });

    if (r.hScroll > 1)
      problems.push({ d: d.n, pg, t: "YATAY TASMA", v: `${r.hScroll}px`, x: r.over });
    if (r.over.length) problems.push({ d: d.n, pg, t: "TAŞAN ELEMAN", v: r.over.join(" | ") });
    if (r.small.length) problems.push({ d: d.n, pg, t: "KÜÇÜK HEDEF", v: r.small.join(" | ") });
    if (errs.length)
      problems.push({ d: d.n, pg, t: "JS HATASI", v: [...new Set(errs)].slice(0, 2).join(" | ") });

    if (pg === "index.html" || pg === "basarilar.html") {
      await page.screenshot({
        path: `tmp/shots/${pg.replace(".html", "")}-${d.n.replace(/[^a-z0-9]/gi, "_")}.png`,
        fullPage: false,
      });
    }
  }
  await ctx.close();
}

await browser.close();
server.close();

const g = {};
for (const p of problems) (g[p.t] ??= []).push(p);
console.log(
  `\n═══ ${DEVICES.length} cihaz × ${PAGES.length} sayfa = ${DEVICES.length * PAGES.length} kombinasyon ═══\n`,
);
for (const [t, list] of Object.entries(g)) {
  console.log(`── ${t} (${list.length}) ──`);
  const seen = new Set();
  for (const p of list) {
    const k = `${p.pg}|${p.v}`;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`  [${p.d}] ${p.pg}: ${p.v}`);
  }
  console.log();
}
if (!problems.length) console.log("SORUN YOK");
