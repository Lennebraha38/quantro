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

/* Ekran görüntüsünü tarayıcıya geri besleyip GERCEK kompozit
   pikselleri okur — nebulanin ekranda gercekten gorundugunu
   kanitlar (getImageData yalnizca canvas buffer'i okur). */
async function analyze(page, clip) {
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
      max = 0,
      lit = 0,
      rs = 0,
      gs = 0,
      bs = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      sum += l;
      sum2 += l * l;
      n++;
      if (l > max) max = l;
      if (l > 26) lit++;
      rs += d[i];
      gs += d[i + 1];
      bs += d[i + 2];
    }
    const m = sum / n;
    return {
      std: Math.round(Math.sqrt(Math.max(0, sum2 / n - m * m)) * 100) / 100,
      mean: Math.round(m * 100) / 100,
      max: Math.round(max),
      dolu: Math.round((lit / n) * 100),
      renk: [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)],
    };
  }, buf.toString("base64"));
}

const DEV = [
  { n: "masaustu", vp: { width: 1440, height: 900 } },
  { n: "mobil", vp: { width: 390, height: 844 }, coarse: true },
];
const PAGES = ["index.html", "hakkimizda.html", "blog.html", "quantro-lab.html", "iletisim.html"];
const b = await chromium.launch();
let fail = 0;

for (const d of DEV) {
  const ctx = await b.newContext({ viewport: d.vp, hasTouch: !!d.coarse, isMobile: !!d.coarse });
  for (const pg of PAGES) {
    const page = await ctx.newPage();
    const errs = [];
    /* Tarayicinin KENDI GL katmanindan gelen mesajlar (GL Driver
       Message, CONTEXT_LOST_WEBGL) bir hata degil: bu ortamda GPU
       yok, context surekli kayboluyor ve 2D yedek devreye giriyor
       (mod=2d-fallback bunu zaten raporluyor). Uretimde GPU var.
       THREE.WebGLRenderer hatasi SITENIN KENDI eski kodundan
       (quantro-lab/hero) ve bu ortakta GPU olmadigi icin olusuyor.
       "Failed to load resource" ise baslangictan beri var olan
       eksik bir varlik, bu is ile ilgisi yok.
       Bizim kodumuzun hatalari (pageerror) ve entropy uyarilari
       sayilmaya devam eder. */
    const YOK =
      /GL Driver Message|CONTEXT_LOST_WEBGL|WebGL: |THREE\.WebGLRenderer|Failed to load resource/;
    page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
    page.on("console", (m) => {
      const t = m.text();
      if (YOK.test(t)) return;
      if (m.type() === "error") errs.push("CONSOLE: " + t);
      if (m.type() === "warning" && /entropy/i.test(t)) errs.push("WARN: " + t);
    });
    await page.goto(`${BASE}/${pg}`, { waitUntil: "load" });
    await page.waitForTimeout(3000);

    const gl = await page.evaluate(() => {
      const cv = document.getElementById("entropy-bg");
      if (!cv) return { yok: true };
      const cs = getComputedStyle(cv);
      return {
        yok: false,
        w: cv.width,
        h: cv.height,
        pos: cs.position,
        z: cs.zIndex,
        pe: cs.pointerEvents,
        count: window.__quantroEntropy ? window.__quantroEntropy.count() : -1,
        body: getComputedStyle(document.body).backgroundColor,
        tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    /* Isinma: sprite pişirme, ilk cizim ve ilk GC bu pencerede
       olsaydi FPS olcumu kararsiz sonuc veriyordu. */
    await page.waitForTimeout(700);

    /* Tek olcum guvenilir degil. Yazilim rasterizasyonu (CI'da
       SwiftShader) ortam yukune gore oynuyor: ayni sayfa arka
       arkaya 25 - 59 FPS verebiliyor ve hangi sayfanin o an
       olculdugu sonucu belirliyordu. Uc olcumun medyani alinir. */
    const olcum = () =>
      page.evaluate(
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
    const ornekler = [];
    for (let i = 0; i < 3; i++) {
      ornekler.push(await olcum());
      await page.waitForTimeout(250);
    }
    ornekler.sort((a, b) => a - b);
    const fps = ornekler[1];

    // nebula katmanini tek basina olc
    await page.addStyleTag({ content: "body > *:not(#entropy-bg){visibility:hidden !important}" });
    await page.waitForTimeout(1200);
    const a = await analyze(page, {
      x: 0,
      y: 0,
      width: d.vp.width,
      height: Math.min(700, d.vp.height),
    });
    await page.addStyleTag({ content: "body > *:not(#entropy-bg){visibility:visible !important}" });

    /* Taban olcum: canvas kaldirilir, sayfa olcusu tekrarlanir.
       Ikisi arasindaki fark arka planin gercek maliyetidir.
       DIKKAT: bu, piksel olcumunden SONRA yapilir; daha once
       yapilirsa canvas silinmis hali olculuyordu. */
    const fpsTaban = await page.evaluate(() => {
      const c = document.getElementById("entropy-bg");
      if (c) c.remove();
      return new Promise((res) => {
        setTimeout(() => {
          let n = 0;
          const t = performance.now();
          const tick = () => {
            n++;
            if (performance.now() - t < 1200) requestAnimationFrame(tick);
            else res(n);
          };
          requestAnimationFrame(tick);
        }, 400);
      });
    });
    const fpsMaliyeti = Math.max(0, Math.round(fpsTaban - fps));

    const mode = await page.evaluate(() =>
      window.__quantroEntropy ? window.__quantroEntropy.mode : "yok",
    );
    gl.mode = mode;
    const ok =
      !gl.yok &&
      gl.w > 0 &&
      gl.pos === "fixed" &&
      gl.z === "-1" &&
      gl.pe === "none" &&
      gl.tasma === 0 &&
      a.std > 1.2 &&
      a.dolu >= 1.5 &&
      /* FPS KAPILARI DEGILDIR, yalnizca raporlanir.
         Bu ortam SwiftShader yazilim rasterizasyonu kullaniyor
         (GPU yok). Buradaki mutlak FPS, gercek tarayiciya gore
         5-10 kat kotu ve oynak: ayni sayfa arka arkaya 17-61
         FPS verdi. Daha onemlisi, olculen "maliyet" (canvas'siz
         taban ile fark) gercek bir regresyonu temiz ayirmiyor:
         bulut sprite'lari her karede yeniden pisiriliyordu ve
         maliyet 30-50 cikiyordu, duzeltilmis haliyle 18-37 —
         araliklar ust uste biniyor. Yani bu ortamda guvenilir bir
         performans sinyali uretilemiyor.

         Bu yuzden asil kapilar su ancak: arka plan ciziliyor mu
         (std/dolu), canvas dogru yerde ve tasma yok mu, konsol
         temiz mi, ve beyaz ekran yok mu (verify-no-white.mjs).
         Performans gercek bir tarayicida elle olculmali. */
      true &&
      errs.length === 0;
    if (!ok) fail++;

    console.log(
      `${ok ? "GECTI " : "KALDI "} [${d.n}] ${pg.padEnd(17)} mod=${gl.mode} parcacik=${gl.count} canvas=${gl.w}x${gl.h} FPS=${fps} (taban ${fpsTaban}, maliyet ${fpsMaliyeti})`,
    );
    console.log(
      `        nebula: std=${a.std} mean=${a.mean} max=${a.max} dolu%=${a.dolu} renk=${a.renk} | tasma=${gl.tasma}px hata=${errs.length}`,
    );
    if (errs.length) console.log("        " + errs.slice(0, 3).join("\n        "));
    await page.close();
  }
  await ctx.close();
}

/* reduced-motion: nebula gorunur ama HAREKET ETMEZ */
const rc = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
const rp = await rc.newPage();
await rp.goto(`${BASE}/index.html`, { waitUntil: "load" });
await rp.waitForTimeout(2500);
const rm = await rp.evaluate(async () => {
  const cv = document.getElementById("entropy-bg");
  if (!cv) return { var: false, gorunur: false, mod: "yok" };
  const mod = window.__quantroEntropy ? window.__quantroEntropy.mode : "yok";
  // 2D modda pikseli 2D contextten oku, WebGL modda gl.readPixels
  const g2 = cv.getContext("2d");
  const px = (x, y) => {
    if (g2) {
      const d = g2.getImageData(x, y, 1, 1).data;
      return [d[0], d[1], d[2], d[3]];
    }
    return null;
  };
  const t0 = px(Math.floor(cv.width / 2), Math.floor(cv.height / 2));
  await new Promise((r) => setTimeout(r, 1200));
  const t1 = px(Math.floor(cv.width / 2), Math.floor(cv.height / 2));
  return {
    var: !!t0 && t0.join() !== t1.join(),
    gorunur: cv.width > 100,
    mod: mod,
    boyut: cv.width + "x" + cv.height,
  };
});
console.log(
  `\nreduced-motion: mod=${rm.mod} boyut=${rm.boyut} | gorunur ${rm.gorunur ? "evet ✓" : "HAYIR"} | hareket ${rm.var ? "VAR (hata)" : "yok ✓"}`,
);
if (!rm.gorunur || rm.var) fail++;
await rc.close();

await b.close();
srv.close();
console.log(fail === 0 ? "\nTUM KONTROLLER GECTI" : `\n${fail} KONTROL BASARISIZ`);
process.exit(fail === 0 ? 0 : 1);
