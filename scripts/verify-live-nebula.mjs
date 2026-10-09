import { chromium } from "playwright";

const BASE = "https://quantro-1.vercel.app";
const PAGES = ["index.html", "hakkimizda.html", "blog.html", "quantro-lab.html", "iletisim.html"];
const YOK =
  /GL Driver Message|CONTEXT_LOST_WEBGL|WebGL: |THREE\.WebGLRenderer|Failed to load resource/;

const b = await chromium.launch();
let fail = 0;

for (const pg of PAGES) {
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    const t = m.text();
    if (YOK.test(t)) return;
    if (m.type() === "error") errs.push("CONSOLE: " + t);
  });
  await page.goto(`${BASE}/${pg}`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(3500);

  const r = await page.evaluate(() => {
    const cv = document.getElementById("entropy-bg");
    if (!cv) return { yok: true };
    const cs = getComputedStyle(cv);
    const o = {
      mod: window.__quantroEntropy ? window.__quantroEntropy.mode : "?",
      parts: window.__quantroEntropy ? window.__quantroEntropy.count() : -1,
      w: cv.width,
      h: cv.height,
      pos: cs.position,
      z: cs.zIndex,
      pe: cs.pointerEvents,
      body: getComputedStyle(document.body).backgroundColor,
      tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
    // gercek gorunurluk: sayfa icerigini gizle, canvas'in kendi
    // piksellerini olc
    const st = document.createElement("style");
    st.id = "__olcumStili";
    st.textContent = "body > *:not(#entropy-bg){visibility:hidden !important}";
    document.head.appendChild(st);
    return o;
  });

  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 700 } });
  const v = await page.evaluate(async (b64) => {
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
      s = 0,
      s2 = 0,
      max = 0,
      lit = 0;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      s += l;
      s2 += l * l;
      n++;
      if (l > max) max = l;
      if (l > 24) lit++;
    }
    const m = s / n;
    return {
      std: Math.round(Math.sqrt(Math.max(0, s2 / n - m * m)) * 100) / 100,
      mean: Math.round(m * 100) / 100,
      max: Math.round(max),
      dolu: Math.round((lit / n) * 100),
    };
  }, shot.toString("base64"));

  // visibility:hidden butonu TIKLANAMAZ yapar; olcum sonrasi kaldir
  await page.evaluate(() => {
    const e = document.getElementById("__olcumStili");
    if (e) e.remove();
  });
  await page.waitForTimeout(400);

  // tiklama engeli
  const cta = page.locator("a.btn, .nav-pill-cta, .hero-cta, button").first();
  let tik = "yok";
  if (await cta.count()) {
    try {
      await cta.click({ timeout: 4000 });
      tik = "evet";
    } catch {
      tik = "HAYIR";
    }
  }

  const ok =
    !r.yok &&
    r.pos === "fixed" &&
    r.z === "-1" &&
    r.pe === "none" &&
    r.tasma === 0 &&
    v.std > 1.5 &&
    tik === "evet" &&
    errs.length === 0;
  if (!ok) fail++;
  console.log(
    `${ok ? "GECTI " : "KALDI "} ${pg.padEnd(17)} mod=${r.mod} parcacik=${r.parts} canvas=${r.w}x${r.h}`,
  );
  console.log(
    `        alan: std=${v.std} mean=${v.mean} max=${v.max} dolu%=${v.dolu} | tasma=${r.tasma}px tiklama=${tik} hata=${errs.length}`,
  );
  if (errs.length) console.log("        " + errs.slice(0, 2).join(" | "));
  await page.close();
}
await b.close();
console.log(fail === 0 ? "\nCANLI TUM KONTROLLER GECTI" : `\n${fail} CANLI KONTROL BASARISIZ`);
process.exit(fail === 0 ? 0 : 1);
