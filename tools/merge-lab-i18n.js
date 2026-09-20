const fs = require("fs");

const langs = ["tr", "en", "fr", "es", "it", "ru", "ko", "ar"];

function quoteAware(src, from) {
  let depth = 0,
    inStr = false,
    esc = false;
  for (let j = from; j < src.length; j++) {
    const c = src[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return j;
    }
  }
  return -1;
}

function labDict(l) {
  const src = fs.readFileSync("lab/i18n-" + l + ".js", "utf8");
  const m = src.match(/I18N\['\w+'\]=\s*\{/);
  const st = src.indexOf("{", m.index);
  const end = quoteAware(src, st);
  return Function("return (" + src.slice(st, end + 1) + ")")();
}

const s = fs.readFileSync("index.html", "utf8");
const im = s.match(/const I18N\s*=\s*\{/);
const start = s.indexOf("{", im.index);

const re = new RegExp("\\b(" + langs.join("|") + ")\\s*:\\s*\\{", "g");
const blocks = [];
let mt;
while ((mt = re.exec(s))) {
  if (mt.index < start) continue;
  const bracePos = s.indexOf("{", mt.index);
  blocks.push({ lang: mt[1], bracePos, close: quoteAware(s, bracePos) });
}
blocks.sort((a, b) => a.bracePos - b.bracePos);

const SKIP = new Set(["qc.title", "qc.body", "qc.accept", "qc.reject"]);
const RENAME = { "hero.desc": "lab.hero.desc", "hero.scroll": "lab.hero.scroll" };

let out = s;
let inserted = 0;
for (const b of blocks) {
  const lab = labDict(b.lang);
  const entries = [];
  for (const k of Object.keys(lab)) {
    let key = k;
    if (SKIP.has(k)) continue;
    if (RENAME[k]) key = RENAME[k];
    entries.push("  " + JSON.stringify(key) + ": " + JSON.stringify(lab[k]));
  }
  const insert = ",\n" + entries.join(",\n") + "\n";
  out = out.slice(0, b.close) + insert + out.slice(b.close);
  // shift subsequent block positions
  const delta = insert.length;
  for (const other of blocks) {
    if (other.bracePos > b.close) {
      other.bracePos += delta;
      other.close += delta;
    }
  }
  inserted += entries.length;
  console.log(b.lang, "+" + entries.length, "entries");
}

fs.writeFileSync("index.html", out);
console.log("total inserted:", inserted);
