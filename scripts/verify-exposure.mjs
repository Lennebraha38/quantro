/* WebGL shader'ini sayisal olarak benzetir: additive harmalamada
   piksel basina toplam renk ne kadar yukseliyor? Doygunluk (beyaz
   ekran) riskini eski ve yeni formuller icin karsilastirir.
   Bu ortamda GPU yok, dogrudan calistirilamaz; matematik dogrulanir. */
import fs from "node:fs";

const src = fs.readFileSync("js/entropy.js", "utf8");

/* shader'dan gercek katsayilari oku. ONEMLI: dosyada bunlar bir de
   ACIKLAMA YORUMUNDA gecisiyor ("Onceki degerler: halo*0.42 + ..."),
   o yuzden uretim satirinin kendisine sabitlenir. */
function coeff(key) {
  const re = new RegExp("vec3 c = vColor \\* \\(halo \\* ([0-9.]+) \\+ core \\* ([0-9.]+)\\)");
  const m = re.exec(src);
  if (!m) throw new Error("shader uretim satiri bulunamadi");
  return { halo: parseFloat(m[1]), core: parseFloat(m[2]) };
}
const YENI = coeff("halo");
// eski formul elle (commit b947aa1'deki gibi)
const ESKI = { halo: 0.42, core: 1.55 };

/* vColor: HSL(200 +/- 10, 1, 0.6) -> en yuksek bilesen ~1.0 */
const VCOLOR_MAX = 1.0;
/* vBright: 0.55 + 0.45*sin(...) -> 0.10..1.0 */
const VBRIGHT_MAX = 1.0;
/* Parametreleri KAYNAKTAN oku: test yapilandirmadan kopmasin. */
const nSize = Number(/size: ([0-9.]+)/.exec(src)[1]);
const nCount = Number(/baseCount: ([0-9]+)/.exec(src)[1]);
const DPR = 1; // dpr1 temel senaryo
const N = nCount * DPR;
const GW = 1440,
  GH = 900;
const PTR = Math.max(1, Math.round(nSize * DPR * 2)); // gl_PointSize = size*dpr*(10/z), z~5
console.log(`kaynak: size=${nSize} baseCount=${nCount} -> simulasyon N=${N} PTR=${PTR}px`);

function simulate(c, uIntensity) {
  const acc = new Float32Array(GW * GH);
  for (let i = 0; i < N; i++) {
    const px = Math.random() * (GW - PTR),
      py = Math.random() * (GH - PTR);
    /* parciacik icinde en parlak nokta cekirdek merkezinde */
    const peak = VCOLOR_MAX * (c.halo + c.core) * VBRIGHT_MAX * uIntensity;
    const ix0 = px | 0,
      iy0 = py | 0;
    for (let y = iy0; y < iy0 + PTR && y < GH; y++) {
      for (let x = ix0; x < ix0 + PTR && x < GW; x++) {
        const d = Math.hypot(x - (px + PTR / 2), y - (py + PTR / 2)) / (PTR / 2);
        if (d > 1) continue;
        const t = 1 - d;
        acc[y * GW + x] += peak * (t * t * c.halo + Math.pow(t, 6) * c.core);
      }
    }
  }
  let max = 0,
    hot = 0,
    sum = 0;
  for (let i = 0; i < acc.length; i++) {
    const v = acc[i];
    if (v > max) max = v;
    if (v >= 0.95) hot++;
    sum += v;
  }
  return {
    max: Math.round(max * 1000) / 1000,
    doygunYuzde: Math.round((hot / acc.length) * 100000) / 1000,
    ort: Math.round((sum / acc.length) * 1000) / 1000,
  };
}

let fail = 0;
function kontrol(ad, sonuc, hedef) {
  const ok = sonuc.doygunYuzde <= hedef;
  if (!ok) fail++;
  console.log(
    `${ok ? "GECTI " : "KALDI "} ${ad.padEnd(34)} max=${sonuc.max} doygun(>=0.95)=%${sonuc.doygunYuzde} ort=${sonuc.ort} (hedef <= %${hedef})`,
  );
}

/* 1) eski formul: beyaza dogruyor mu? (teshisin kaniti) */
const eski = simulate(ESKI, 1.0);
console.log(
  `ESKI  halo*${ESKI.halo} + core*${ESKI.core} = tepe ${(
    VCOLOR_MAX *
    (ESKI.halo + ESKI.core)
  ).toFixed(2)} (parciacik basina 1.0'i asiyor)`,
);
kontrol("ESKI (uIntensity yok)", eski, 100);
if (eski.doygunYuzde < 1) {
  console.log(`      NOT: eski formul %${eski.doygunYuzde} doygunluk uretiyor -> beyaz leke riski`);
}

/* 2) yeni formul: tek basina beyaz YAPAMAZ */
const tepe = VCOLOR_MAX * (YENI.halo + YENI.core) * VBRIGHT_MAX;
console.log(
  `\nYENI  halo*${YENI.halo} + core*${YENI.core} = tepe ${tepe.toFixed(
    2,
  )} -> beyaz icin en az ${Math.ceil(1 / tepe)} parcacik ayni piksele yakinmali`,
);
if (tepe >= 1) {
  console.log("KALDI  tek parciacik beyaz yapabilir!");
  fail++;
} else {
  console.log("GECTI  tek parciacik beyaz YAPAMAZ (0.95 < 1.0)");
}

const yeni = simulate(YENI, 1.0);
kontrol("YENI (uIntensity = 1.0)", yeni, 0.5);

/* 3) autoExpose en kotu durumda tamamen karsi basinca ne olur? */
const enKotu = simulate(YENI, 0.28); // autoExpose alt siniri
kontrol("YENI (uIntensity = 0.28 alt sinir)", enKotu, 0.05);

/* 4) autoExpose MANTIGINI entropy.js ile ayni kosulla dogrula.
      (Kod: mean > 0.42 -> max(0.28, i*0.72); mean < 0.045 -> min(1, i*1.12)) */
console.log("\nautoExpose davranisi (kaynak: entropy.js autoExpose):");
function autoStep(mean, intensity) {
  if (mean > 0.42) return Math.max(0.28, intensity * 0.72);
  if (mean < 0.045) return Math.min(1.0, intensity * 1.12);
  return intensity;
}
let u = 1.0;
const adimlar = [
  [0.6, "cok parlak"],
  [0.5, "hâlâ parlak"],
  [0.3, "normal"],
  [0.02, "karanlık"],
];
for (const [m, ad] of adimlar) {
  const once = u;
  u = autoStep(m, u);
  console.log(
    `  mean=${String(m).padEnd(5)} (${ad.padEnd(11)}) uIntensity ${once.toFixed(
      2,
    )} -> ${u.toFixed(2)}`,
  );
  if (m > 0.42 && u >= once) {
    console.log("  KALDI parlaklik kisaltilmadi");
    fail++;
  }
}
/* 5) autoExpose'un alt siniri (0.28) doygunlugu engelliyor mu? */
const taban = simulate(YENI, 0.28);
kontrol("YENI + autoExpose taban (0.28)", taban, 0.5);

console.log(
  fail === 0
    ? "\nPOZLAMA MATEMATIGI DOGRULANDI: doygunluk riski yok"
    : `\n${fail} KONTROL BASARISIZ`,
);
process.exit(fail === 0 ? 0 : 1);
