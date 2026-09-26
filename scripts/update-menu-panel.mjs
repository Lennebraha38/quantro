import fs from "node:fs";

const PANEL = `<div class="mob-nav" id="mobnav">
  <button class="mn-close" id="mnclose" aria-label="Menüyü kapat">&#10005;</button>
  <div class="mn-grid">
    <div class="mn-col">
      <span class="mn-h">Ke&#351;fet</span>
      <a href="hakkimizda.html" class="ml" data-i18n="nav.about"><i>01</i>Hakkımızda</a>
      <a href="basarilar.html" class="ml" data-i18n="nav.achievements"><i>02</i>Başarılarımız</a>
      <a href="arastirma.html" class="ml" data-i18n="nav.research"><i>03</i>Araştırma</a>
      <a href="simulasyon.html" class="ml" data-i18n="nav.sim"><i>04</i>Simülasyon</a>
      <a href="bilim.html" class="ml"><i>05</i>Sözlük &amp; Ekosistem</a>
    </div>
    <div class="mn-col">
      <span class="mn-h">Kaynaklar</span>
      <a href="blog.html" class="ml" data-i18n="nav.blog"><i>06</i>Blog</a>
      <a href="quantro-lab.html" class="ml" data-i18n="nav.lab"><i>07</i>Lab &#128252;</a>
      <a href="docs.html" class="ml"><i>08</i>Docs</a>
      <a href="iletisim.html" class="ml" data-i18n="nav.contact"><i>09</i>İletişim</a>
    </div>
  </div>
  <div class="mn-foot">
    <a href="index.html" class="ml" data-i18n="nav.home">&#8592; Ana Sayfa</a>
    <button class="ml" onclick="toggleLang()">EN</button>
  </div>
</div>`;

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

let ok = 0,
  skip = [];
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const re = /<div class="mob-nav" id="mobnav">[\s\S]*?<\/div>\s*(?=<main)/;
  if (!re.test(s)) {
    skip.push(f);
    continue;
  }
  s = s.replace(re, PANEL + "\n");
  fs.writeFileSync(f, s);
  ok++;
}
console.log(`panel guncellendi: ${ok}/${files.length}`);
if (skip.length) console.log("ATLANDI (panel bulunamadi):", skip.join(", "));
