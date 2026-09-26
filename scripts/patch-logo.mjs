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

/* Yörünge monogramı: halka (Q) + eğik yörünge elipsi + cyan çekirdek nokta.
   Sitenin mevcut atom/yörünge görsel diliyle aynı. */
const LOGO = `<a href="index.html" class="nav-logo" aria-label="Quantro — ana sayfa">
            <span class="nav-mark" aria-hidden="true"
              ><svg viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="9.4" stroke="currentColor" stroke-width="1.7" />
                <ellipse
                  cx="16"
                  cy="16"
                  rx="14.2"
                  ry="5.6"
                  stroke="currentColor"
                  stroke-width="1.25"
                  opacity=".45"
                  transform="rotate(-30 16 16)"
                />
                <circle cx="26.4" cy="9.6" r="2.2" fill="var(--cyan)" />
              </svg></span
            >
            <span class="nav-word">Quantro</span>
          </a>`;

const OLD = /<a href="index\.html" class="nav-logo">Q<span>U<\/span>ANTRO<\/a>/g;

let ok = 0;
const skip = [];
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  if (!OLD.test(s)) {
    skip.push(f);
    OLD.lastIndex = 0;
    continue;
  }
  OLD.lastIndex = 0;
  s = s.replace(OLD, LOGO);
  fs.writeFileSync(f, s);
  ok++;
}
console.log(`logo guncellendi: ${ok}/${files.length}`);
if (skip.length) console.log("ATLANDI:", skip.join(", "));
