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

const DV = [
  { n: "iPhone SE ", w: 375, h: 667, t: 1 },
  { n: "iPhone 15 ", w: 393, h: 852, t: 1 },
  { n: "iPad Pro  ", w: 1024, h: 1366, t: 1 },
  { n: "MacBook  ", w: 1440, h: 900, t: 0 },
  { n: "Win1366  ", w: 1366, h: 768, t: 0 },
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
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);

  const r = await page.evaluate(() => {
    const g = (s) => {
      const e = document.querySelector(s);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return {
        l: Math.round(b.left),
        r: Math.round(b.right),
        w: Math.round(b.width),
        h: Math.round(b.height),
      };
    };
    const lg = document.querySelector(".nav-logo");
    const cs = getComputedStyle(lg);
    const mk = document.querySelector(".nav-mark svg");
    return {
      logo: g(".nav-logo"),
      word: g(".nav-word"),
      mark: g(".nav-mark"),
      ls: cs.letterSpacing,
      fs: cs.fontSize,
      weight: cs.fontWeight,
      trackPct: Math.round((parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)) * 1000) / 10,
      svgRendered: mk ? Math.round(mk.getBoundingClientRect().width) : 0,
      pill: g("#tubelight"),
      burger: g(".nav-burger"),
      ariaLabel: lg.getAttribute("aria-label"),
      text: lg.textContent.replace(/\s+/g, "").trim(),
      hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const ok =
    r.svgRendered > 0 &&
    r.ls !== "normal" &&
    r.trackPct < 12 &&
    r.hScroll === 0 &&
    r.mark &&
    r.pill &&
    r.pill.l >= r.logo.r - 1 &&
    r.burger.l >= r.pill.r - 1;
  if (!ok) fail++;
  console.log(
    `[${d.n}] logo ${r.logo.w}x${r.logo.h} | harf araligi ${r.ls} (${r.trackPct}% - onceki %26) | ${r.fs} / ${r.weight}`,
  );
  console.log(
    `   monogram ${r.mark.w}x${r.mark.h} svg=${r.svgRendered}px | kelime "${r.word.w}px" | aria="${r.ariaLabel}" | icerik="${r.text}"`,
  );
  console.log(
    `   pill ${r.pill.w}px | cakisma yok=${r.pill.l >= r.logo.r - 1} | yatay tasma=${r.hScroll}px | ${ok ? "GECTI" : "*** KALDI ***"}`,
  );
  if (errs.length) {
    console.log("   JS HATA:", errs.join(" | "));
    fail++;
  }
  await ctx.close();
}
await browser.close();
srv.close();
console.log(fail === 0 ? "\nTUM CIHAZLAR GECTI" : `\n${fail} KONTROL BASARISIZ`);
process.exit(fail === 0 ? 0 : 1);
