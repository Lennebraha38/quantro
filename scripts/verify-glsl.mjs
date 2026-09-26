/* GLSL kaynak tutarliligi: fragment shader'in kullandigi her
   uniform'u kendi icinde bildirmesi ve varying'lerin vertex
   shader ile eslesmesi gerekir. Bu olmadan shader derlenmez,
   startNebula() null doner ve canvas WebGL'e bagli kalir; boylece
   2D yedek de calisamaz (getContext("2d") null). */
import fs from "node:fs";

const s = fs.readFileSync("js/entropy.js", "utf8");

function arr(name) {
  const a = s.indexOf("var " + name + " = [");
  if (a === -1) throw new Error(name + " dizisi bulunamadi");
  const b = s.indexOf("].join", a);
  if (b === -1) throw new Error(name + " dizisi bitmiyor (].join yok)");
  return s.slice(a, b);
}
const VS = arr("VS");
const FS = arr("FS");
const all = (t, re) => [...t.matchAll(re)].map((m) => m[1]);

const vsU = all(VS, /"uniform \w+ (\w+);"/g);
const fsU = all(FS, /"uniform \w+ (\w+);"/g);
const vsV = all(VS, /"varying \w+ (\w+);"/g);
const fsV = all(FS, /"varying \w+ (\w+);"/g);

let fail = 0;
function kontrol(ad, ok, detay) {
  if (!ok) fail++;
  console.log(`${ok ? "GECTI " : "KALDI "} ${ad}${detay ? " — " + detay : ""}`);
}

console.log(`VS uniform: ${vsU.join(", ")}`);
console.log(`FS uniform: ${fsU.join(", ")}\n`);

/* 1) FS'in kullandigi uniform'larin hepsi FS icinde bildirilmis olmali */
const fsUsed = [...new Set([...FS.matchAll(/\bu[A-Z]\w*/g)].map((m) => m[0]))];
const eksikU = fsUsed.filter((u) => !fsU.includes(u));
kontrol(
  "FS kullandigi tum uniform bildirilmis",
  eksikU.length === 0,
  eksikU.length ? "EKSIK: " + eksikU.join(", ") : `${fsUsed.length} uniform`,
);

/* 2) VS kullandigi uniform'lar listesinde olmali (getUniformLocation) */
const vsUsed = [...new Set([...VS.matchAll(/\bu[A-Z]\w*/g)].map((m) => m[0]))];
const kayipsizU = vsUsed.filter((u) => !vsU.includes(u));
kontrol(
  "VS kullandigi tum uniform bildirilmis",
  kayipsizU.length === 0,
  kayipsizU.length ? "EKSIK: " + kayipsizU.join(", ") : "",
);

/* 3) uIntensity uniform'u listede olmali, yoksa autoExpose calismaz */
const listede = /"uSize", "uDpr", "uMotion", "uIntensity"/.test(s);
kontrol("uIntensity getUniformLocation listesinde", listede);

/* 4) varying'ler eslesmeli (vertex yaziyor, fragment okuyor) */
const uyusmazV = fsV.filter((v) => !vsV.includes(v));
const fazlaV = vsV.filter((v) => !fsV.includes(v));
kontrol(
  "varying'ler VS <-> FS eslesiyor",
  uyusmazV.length === 0 && fazlaV.length === 0,
  uyusmazV.length || fazlaV.length
    ? "uymayan: " + [...uyusmazV, ...fazlaV].join(", ")
    : vsV.join(", "),
);

/* 5) her iki shader'da main() olmali */
kontrol("VS main() iceriyor", /"void main\(\) \{"/.test(VS));
kontrol("FS main() iceriyor", /"void main\(\) \{"/.test(FS));

/* 6) fragment cikisinda alpha: additive harmalamada alpha da
   birikiyor; 1.0 yazmak dogru (yoksa gorsel daha soluk olur) */
kontrol("FS alpha = 1.0", /gl_FragColor = vec4\(c, 1\.0\)/.test(FS));

console.log(fail === 0 ? "\nGLSL TUTARLILIK TAMAM" : `\n${fail} KONTROL BASARISIZ`);
process.exit(fail === 0 ? 0 : 1);
