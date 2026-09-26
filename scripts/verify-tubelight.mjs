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
  await page.waitForTimeout(700);

  const pill = await page.evaluate(() => {
    const t = document.getElementById("tubelight");
    const g = document.getElementById("tlglow");
    const tr = t.getBoundingClientRect();
    const items = [...t.querySelectorAll(".nb, .nav-cta")];
    const vis = items.filter((e) => getComputedStyle(e).display !== "none");
    const small = vis.filter((e) => {
      const b = e.getBoundingClientRect();
      return b.height < 24;
    });
    return {
      radius: getComputedStyle(t).borderRadius,
      blur: getComputedStyle(t).backdropFilter,
      items: vis.length,
      small: small.length,
      glowW: Math.round(parseFloat(g.style.width) || 0),
      glowOp: +getComputedStyle(g).opacity,
      pillFits: tr.right <= innerWidth && tr.left >= 0,
      // burger ile cakisma
      noClash: (() => {
        const bk = document.querySelector(".nav-burger").getBoundingClientRect();
        return tr.right <= bk.left + 1;
      })(),
      // logo ile cakisma
      logoClash: (() => {
        const lg = document.querySelector(".nav-logo").getBoundingClientRect();
        return tr.left >= lg.right - 1;
      })(),
      hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  // isik kayiyor mu
  await page.hover("#langbtn");
  await page.waitForTimeout(650);
  const onLang = await page.evaluate(() => {
    const g = document.getElementById("tlglow");
    return {
      w: Math.round(parseFloat(g.style.width)),
      x: Math.round(new DOMMatrixReadOnly(getComputedStyle(g).transform).e),
    };
  });
  await page.hover(".nav-cta");
  await page.waitForTimeout(650);
  const onCta = await page.evaluate(() => {
    const g = document.getElementById("tlglow");
    return {
      w: Math.round(parseFloat(g.style.width)),
      x: Math.round(new DOMMatrixReadOnly(getComputedStyle(g).transform).e),
    };
  });

  // aktif sayfa isaretleme (iletisim.html)
  await page.goto(`${BASE}/iletisim.html`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const activeMark = await page.evaluate(() => {
    const on = document.querySelector("#tubelight .on");
    return on ? on.textContent.trim() : "(yok)";
  });

  const ok =
    pill.items === 2 &&
    pill.small === 0 &&
    pill.glowW > 0 &&
    pill.glowOp === 1 &&
    pill.pillFits &&
    pill.noClash &&
    pill.logoClash &&
    pill.hScroll === 0 &&
    onLang.x !== onCta.x;
  if (!ok) fail++;
  console.log(
    `[${d.n}] pill: ${pill.items} oge | r=${pill.radius} | glow=${pill.glowW}px op=${pill.glowOp} | min hedef ${pill.small} kucuk`,
  );
  console.log(
    `   EN ustu x=${onLang.x} w=${onLang.w} | Iletisim ustu x=${onCta.x} w=${onCta.w} | kaydi=${onLang.x !== onCta.x ? "EVET" : "HAYIR"}`,
  );
  console.log(
    `   pill sigdi=${pill.pillFits} burger-cakisma yok=${pill.noClash} logo-cakisma yok=${pill.logoClash} | yatay tasma=${pill.hScroll}px`,
  );
  console.log(`   iletisim.html aktif isaret: "${activeMark}" | ${ok ? "GECTI" : "*** KALDI ***"}`);
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
