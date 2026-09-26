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

let added = 0,
  removed = 0,
  miss = [];
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");

  // eski iki kolonlu paneli kaldır
  const re = /<div class="mob-nav" id="mobnav">[\s\S]*?<\/div>\s*(?=<main)/;
  if (re.test(s)) {
    s = s.replace(re, "");
    removed++;
  }

  // nav-data.js'i app.js'ten hemen önce ekle
  if (!/nav-data\.js/.test(s)) {
    if (/<script src="app\.js"><\/script>/.test(s)) {
      s = s.replace(
        '<script src="app.js"></script>',
        '<script src="js/nav-data.js"></script>\n<script src="app.js"></script>',
      );
      added++;
    } else {
      miss.push(f);
    }
  }
  fs.writeFileSync(f, s);
}
console.log(`eski panel kaldirildi: ${removed} | nav-data.js eklendi: ${added}`);
if (miss.length) console.log("app.js bulunamadi:", miss.join(", "));
