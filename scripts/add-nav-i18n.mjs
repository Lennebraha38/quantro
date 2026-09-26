import fs from "node:fs";

/* Sözlük & Docs çevirileri — 8 dil */
const ADD = {
  tr: { s: "Sözlük", d: "Docs" },
  en: { s: "Glossary", d: "Docs" },
  fr: { s: "Lexique", d: "Docs" },
  es: { s: "Glosario", d: "Docs" },
  it: { s: "Glossario", d: "Docs" },
  ru: { s: "Глоссарий", d: "Docs" },
  ko: { s: "용어집", d: "Docs" },
  ar: { s: "معجم", d: "Docs" },
};

let lines = fs.readFileSync("app.js", "utf8").split("\n");

/* EXT tablosunun dil bloklarını bul (ilk 8 tanesi, "const EXT" icindekiler) */
const extStart = lines.findIndex((l) => /const EXT = \{/.test(l));
const langs = [];
for (let i = extStart; i < extStart + 1700 && langs.length < 8; i++) {
  const m = lines[i].match(/^ {2}([a-z]{2}): \{$/);
  if (m) langs.push({ lang: m[1], line: i });
}
console.log("bulunan diller:", langs.map((x) => x.lang).join(", "));
if (langs.length !== 8) throw new Error("8 dil bekleniyordu");

/* her dil blogunda "nav.about" satirini bul, hemen araya ekle */
let added = 0;
for (const { lang, line } of langs) {
  let idx = -1;
  for (let i = line; i < line + 30; i++) {
    if (/^ {4}"nav\.about":/.test(lines[i])) {
      idx = i;
      break;
    }
  }
  if (idx === -1) {
    console.log(`  ${lang}: nav.about bulunamadi, atlaniyor`);
    continue;
  }
  if (lines[idx + 1] && lines[idx + 1].includes('"nav.science"')) {
    console.log(`  ${lang}: zaten var`);
    continue;
  }
  const t = ADD[lang];
  lines.splice(idx + 1, 0, `    "nav.science": "${t.s}",`, `    "nav.docs": "${t.d}",`);
  added++;
}
fs.writeFileSync("app.js", lines.join("\n"));
console.log(`nav.science + nav.docs eklendi: ${added}/8 dil`);

/* nav-data.js'i güncelle: Sözlük ve Docs artik cevrilebilir */
let nd = fs.readFileSync("js/nav-data.js", "utf8");
nd = nd.replace(
  '{ href: "bilim.html", i: "❑", t: "Sözlük", t2: "Sözlük & Ekosistem" }',
  '{ href: "bilim.html", i: "❑", t: "Sözlük", t2: "Sözlük & Ekosistem", k: "nav.science" }',
);
nd = nd.replace(
  '{ href: "docs.html", i: "▤", t: "Docs" }',
  '{ href: "docs.html", i: "▤", t: "Docs", k: "nav.docs" }',
);
fs.writeFileSync("js/nav-data.js", nd);
console.log("nav-data.js: bilim + docs ceviri anahtarlari baglandi");
