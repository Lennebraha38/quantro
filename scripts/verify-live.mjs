import { chromium } from "playwright";

const BASE = "https://quantro-1.vercel.app";
/* Kapsamli sayfalar: blog + lab daha once hataliydi, index hero + iletisim buton */
const PAGES = ["index.html", "blog.html", "quantro-lab.html", "iletisim.html"];
const b = await chromium.launch();
let fail = 0;

for (const pg of PAGES) {
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(`${BASE}/${pg}`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(3000);

  const r = await page.evaluate(() => {
    const cv = document.getElementById("entropy-bg");
    const cs = cv && getComputedStyle(cv);
    // canvas'in gercekten piksel urettigini dogrudan dogrula
    let nonEmpty = null;
    if (cv && cv.width) {
      const g = cv.getContext("2d");
      const d = g.getImageData(0, 0, Math.min(cv.width, 400), Math.min(cv.height, 300)).data;
      let lit = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 6) lit++;
      nonEmpty = lit;
    }
    return {
      cvYok: !cv,
      pos: cs && cs.position,
      z: cs && cs.zIndex,
      pe: cs && cs.pointerEvents,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      litPiksel: nonEmpty,
      tasma: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  // tiklama engeli: canvas'in ustundeki bir butona tikla
  const cta = page.locator("a.btn, .hero-cta, .nav-pill-cta, button").first();
  let tiklandi = null;
  if (await cta.count()) {
    try {
      await cta.click({ timeout: 4000 });
      tiklandi = "evet";
    } catch {
      tiklandi = "HAYIR - tiklama engellendi";
    }
  }

  const ok =
    !r.cvYok &&
    r.pos === "fixed" &&
    r.z === "-1" &&
    r.pe === "none" &&
    /rgba\(0, 0, 0, 0\)|transparent/.test(r.bodyBg) &&
    (r.litPiksel ?? 0) > 50 &&
    r.tasma === 0 &&
    tiklandi === "evet" &&
    errs.length === 0;
  if (!ok) fail++;

  console.log(`${ok ? "GECTI " : "KALDI "} ${pg.padEnd(17)} pos=${r.pos} z=${r.z} pe=${r.pe}`);
  console.log(
    `        body=${r.bodyBg} | lit piksel=${r.litPiksel} | tasma=${r.tasma}px | tiklama=${tiklandi} | hata=${errs.length}`,
  );
  if (errs.length) console.log("        " + errs.slice(0, 2).join(" | "));
  await page.close();
}
await b.close();
console.log(fail === 0 ? "\nCANLI TUM KONTROLLER GECTI" : `\n${fail} CANLI KONTROL BASARISIZ`);
process.exit(fail === 0 ? 0 : 1);
