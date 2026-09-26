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
const BASE = `http://127.0.0.1:${port}`;

/* Ekran görüntüsünü tarayıcıya geri besleyip GERÇEK kompozit
   pikselleri okur — canvas'ın sayfada görünür olduğunu kanıtlar. */
async function shotVariance(page, clip) {
  const buf = await page.screenshot({ clip });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0,
      sum = 0,
      sum2 = 0,
      maxc = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      sum += l;
      sum2 += l * l;
      n++;
      if (l > maxc) maxc = l;
    }
    const mean = sum / n;
    return {
      std: Math.round(Math.sqrt(Math.max(0, sum2 / n - mean * mean)) * 100) / 100,
      mean: Math.round(mean * 100) / 100,
      maxc: Math.round(maxc),
    };
  }, buf.toString("base64"));
}

const PAGES = [
  "index.html",
  "hakkimizda.html",
  "arastirma.html",
  "simulasyon.html",
  "basarilar.html",
  "bilim.html",
  "docs.html",
  "iletisim.html",
  "blog.html",
  "quantro-lab.html",
];
const browser = await chromium.launch();
let fail = 0;

for (const pg of PAGES) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${BASE}/${pg}`, { waitUntil: "load" });
  await page.waitForTimeout(2600);

  const r = await page.evaluate(() => {
    const cv = document.getElementById("entropy-bg");
    const cs = cv ? getComputedStyle(cv) : null;
    const html = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    // opakligi olan en buyuk bolum yuzeyi
    let alpha = 1;
    document.querySelectorAll("section, .about, .domains, .method, .founder").forEach((el) => {
      const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
      if (m) {
        const p = m[1].split(",").map((x) => parseFloat(x));
        if (p.length === 4 && p[3] < alpha) alpha = p[3];
      }
    });
    return {
      cvYok: !cv,
      pos: cs && cs.position,
      z: cs && cs.zIndex,
      pe: cs && cs.pointerEvents,
      htmlBg: html.backgroundColor,
      bodyBg: body.backgroundColor,
      bolumAlfa: alpha,
      hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const fps = await page.evaluate(
    () =>
      new Promise((res) => {
        let n = 0;
        const t = performance.now();
        const tick = () => {
          n++;
          if (performance.now() - t < 1000) requestAnimationFrame(tick);
          else res(n);
        };
        requestAnimationFrame(tick);
      }),
  );

  // GERCEK gorunurluk: sayfa icerigini gizle, yalnizca canvas olceg.
  // Boylece olcum saf olarak akis alanini yansitir.
  await page.addStyleTag({ content: "body > *:not(#entropy-bg){visibility:hidden !important}" });
  await page.waitForTimeout(1400);
  const v = await shotVariance(page, { x: 60, y: 60, width: 500, height: 360 });
  await page.addStyleTag({ content: "body > *:not(#entropy-bg){visibility:visible !important}" });

  const bodyTr = /rgba\(0, 0, 0, 0\)|transparent/.test(r.bodyBg);
  const ok =
    !r.cvYok &&
    r.pos === "fixed" &&
    r.z === "-1" &&
    r.pe === "none" &&
    bodyTr &&
    r.hScroll === 0 &&
    fps >= 25 &&
    v.std > 0.4;
  if (!ok) fail++;
  console.log(
    `${ok ? "GECTI " : "KALDI "} ${pg.padEnd(17)} pos=${r.pos} z=${r.z} pe=${r.pe} body=${r.bodyBg} alpha=${r.bolumAlfa} tasma=${r.hScroll}px FPS=${fps}`,
  );
  console.log(
    `        gorunur piksel: std=${v.std} mean=${v.mean} max=${v.maxc} ${v.std > 0.4 ? "(akis alani ekranda)" : "(duz zemin — alan gorunmuyor!)"}`,
  );
  if (errs.length) {
    console.log("        JS HATA:", errs.join(" | "));
    fail++;
  }
  await page.close();
}

/* reduced-motion: canvas hic olusmamali */
const rmCtx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  reducedMotion: "reduce",
});
const rm = await rmCtx.newPage();
await rm.goto(`${BASE}/index.html`, { waitUntil: "load" });
await rm.waitForTimeout(1200);
const rmHas = await rm.evaluate(() => !!document.getElementById("entropy-bg"));
console.log(`\nreduced-motion: canvas ${rmHas ? "OLUSTURULDU (hata)" : "olusturulmedi ✓"}`);
if (rmHas) fail++;
const rmBg = await rm.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log(
  `reduced-motion gövde arka planı: ${rmBg} (saydam kalmalı, ama canvas yoksa düz zemin görünür)`,
);
await rmCtx.close();

await browser.close();
srv.close();
console.log(fail === 0 ? "\nTUM SAYFALAR GECTI" : `\n${fail} KONTROL BASARISIZ`);
process.exit(fail === 0 ? 0 : 1);
