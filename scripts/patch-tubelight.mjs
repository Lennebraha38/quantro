import fs from "node:fs";

const files = [
  "index.html",
  "hakkimizda.html",
  "arastirma.html",
  "simulasyon.html",
  "docs.html",
  "iletisim.html",
  "basarilar.html",
  "bilim.html",
];

const NEW = `<div class="tubelight" id="tubelight">
          <span class="tubelight-glow" id="tlglow" aria-hidden="true"></span>
          <button class="nb" id="langbtn" onclick="toggleLang()">EN</button>
          <a href="iletisim.html" class="nav-cta" data-i18n="nav.contact">İletişim</a>
        </div>`;

// langbtn (inline style + onmouseover/onmouseout) + nav-cta -> tubelight icinde
const RE =
  /<button\s+class="nb"[\s\S]*?<\/button>\s*<a href="iletisim\.html" class="nav-cta"[^>]*>[^<]*<\/a>/;

let ok = 0;
const skip = [];
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  if (!RE.test(s)) {
    skip.push(f);
    continue;
  }
  const rep = s.replace(RE, NEW);
  fs.writeFileSync(f, rep);
  ok++;
}
console.log(`tubelight uygulandi: ${ok}/${files.length}`);
if (skip.length) console.log("ATLANDI:", skip.join(", "));
