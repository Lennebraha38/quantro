/* Nebula parametre taramasi: ortalama parlaklik (gorunurluk) ile
   tepe parlaklik (beyaz ekran riski) arasindaki dengeyi olcer.
   Gercek tuval olculeri: 1440x900, dpr1. */
import fs from "node:fs";

const GW = 1440,
  GH = 900;
const src = fs.readFileSync("js/entropy.js", "utf8");
const m = /vec3 c = vColor \* \(halo \* ([0-9.]+) \+ core \* ([0-9.]+)\)/.exec(src);
if (!m) throw new Error("shader katsayilari okunamadi");
const HALO = parseFloat(m[1]),
  CORE = parseFloat(m[2]);
const VCOLOR_MAX = 1.0,
  VBRIGHT_MAX = 1.0;

function sim(n, sizePx) {
  const acc = new Float32Array(GW * GH);
  // nokta capi: gl_PointSize = size * dpr * (10/z), z~5 -> size*2
  const ptr = Math.max(1, Math.round(sizePx * 2));
  for (let i = 0; i < n; i++) {
    const px = Math.random() * (GW - ptr),
      py = Math.random() * (GH - ptr);
    const peak = VCOLOR_MAX * (HALO + CORE) * VBRIGHT_MAX;
    const ix0 = px | 0,
      iy0 = py | 0;
    for (let y = iy0; y < iy0 + ptr && y < GH; y++) {
      for (let x = ix0; x < ix0 + ptr && x < GW; x++) {
        const d = Math.hypot(x - (px + ptr / 2), y - (py + ptr / 2)) / (ptr / 2);
        if (d > 1) continue;
        const t = 1 - d;
        acc[y * GW + x] += peak * (t * t * HALO + Math.pow(t, 6) * CORE);
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
    doygun: Math.round((hot / acc.length) * 100000) / 1000,
    ort: Math.round((sum / acc.length) * 1000) / 1000,
  };
}

console.log(`shader tepe (parciacik basina) = ${(HALO + CORE).toFixed(2)}`);
console.log(`canvas ${GW}x${GH} = ${((GW * GH) / 1e6).toFixed(2)}M px, zemin parlakligi ~0.025\n`);
console.log("  n     size  |  ort     max     doygun%   yorum");
console.log("  " + "-".repeat(58));

let best = null;
for (const n of [12000, 18000, 24000, 30000]) {
  for (const size of [3.2, 5, 7, 9]) {
    const r = sim(n, size);
    // hedef: ort 0.04-0.14 (gorunur), doygun < 0.2%, max < 0.95
    const gorunur = r.ort >= 0.04 && r.ort <= 0.14;
    const guvenli = r.doygun < 0.2 && r.max < 0.95;
    const uygun = gorunur && guvenli;
    if (uygun && !best) best = { n, size, r };
    console.log(
      `  ${String(n).padEnd(5)} ${String(size).padEnd(5)} |  ${String(r.ort).padEnd(7)} ${String(r.max).padEnd(7)} ${String(r.doygun).padEnd(9)} ${uygun ? "<< UYGUN" : gorunur ? "(gorunur, guvenli degil)" : guvenli ? "(guvenli, soluk)" : "(soluk + riskli)"}`,
    );
  }
}
console.log("\n" + "-".repeat(58));
if (best)
  console.log(
    `SECIM: count=${best.n} size=${best.size}  ort=${best.r.ort} max=${best.r.max} doygun=%${best.r.doygun}`,
  );
else console.log("SECIM YOK: katsayilar da degistirilmeli");
