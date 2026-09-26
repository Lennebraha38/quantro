import fs from "node:fs";

/* ── 1) css/base.css: ortak kabuk ── */
let b = fs.readFileSync("css/base.css", "utf8");
const before = b;

b = b.replace("  --deep: #07111f;", "  --deep: rgba(7, 17, 31, 0.72);");
b = b.replace("  --surface: #0d1f35;", "  --surface: rgba(13, 31, 53, 0.66);");

b = b.replace(
  `html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}`,
  `html {
  scroll-behavior: smooth;
  overflow-x: hidden;
  /* Sayfa zemini burada kalır; gövde saydam olunca
     akış alanı canvas'ı görünür olur */
  background: var(--void);
}`,
);

b = b.replace(
  `body {
  background: var(--void);`,
  `body {
  background: transparent;`,
);

b += `
/* ══════════════════════════════════════════════════════════════
   ENTROPY ARKA PLAN (ortak kabuk)
   Akış alanı canvas'ı sayfa zemini; bölüm yüzeyleri yarı
   saydam olduğu için alan bütün sayfada görünür.
   ══════════════════════════════════════════════════════════════ */
#entropy-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  display: block;
}
.no-entropy,
.no-entropy body {
  background: var(--void);
}
@media (prefers-reduced-motion: reduce) {
  #entropy-bg {
    display: none;
  }
}
`;
fs.writeFileSync("css/base.css", b);
console.log(`css/base.css: ${before.length} -> ${b.length} karakter`);

/* ── 2) style.css: aynı değişkenler, yinelenen entropy bloğu kaldırılır ── */
let s = fs.readFileSync("style.css", "utf8");
const sBefore = s;

s = s.replace("  --deep: #07111f;", "  --deep: rgba(7, 17, 31, 0.72);");
s = s.replace("  --surface: #0d1f35;", "  --surface: rgba(13, 31, 53, 0.66);");

/* style.css'e eklediğim entropy bloğu artık base.css'de */
const start = s.indexOf(
  "/* ══════════════════════════════════════════════════════════════\n   ENTROPY ARKA PLAN",
);
if (start !== -1) {
  const endMark = s.indexOf(
    ".no-entropy,\n.no-entropy body {\n  background: var(--void);\n}",
    start,
  );
  const end =
    endMark !== -1
      ? endMark + ".no-entropy,\n.no-entropy body {\n  background: var(--void);\n}".length
      : start;
  s = s.slice(0, start) + s.slice(end);
  console.log("style.css: yinelenen entropy blogu kaldirildi");
} else console.log("style.css: entropy blogu bulunamadi (atlandi)");

fs.writeFileSync("style.css", s);
console.log(`style.css: ${sBefore.length} -> ${s.length} karakter`);

/* ── 3) js/entropy.js: konumu satır içi sabitle ──
   JS yolu sayfanın hangi CSS'i yüklediğinden bağımsız olsun */
let e = fs.readFileSync("js/entropy.js", "utf8");
if (!e.includes("entropyInline")) {
  e = e.replace(
    `  cv.setAttribute("aria-hidden", "true");`,
    `  cv.setAttribute("aria-hidden", "true");
  /* Konum satır içinde: CSS yükleme sırasından bağımsız çalışır */
  cv.style.cssText =
    "position:fixed;top:0;left:0;right:0;bottom:0;z-index:-1;pointer-events:none;display:block";
  window.__entropyInline = true;`,
  );
  fs.writeFileSync("js/entropy.js", e);
  console.log("js/entropy.js: satir ici konum eklendi");
}
console.log("TAMAM");
