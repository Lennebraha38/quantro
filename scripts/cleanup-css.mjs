import fs from "node:fs";

let s = fs.readFileSync("style.css", "utf8");
const start = s.indexOf(".mob-nav {");
if (start === -1) throw new Error(".mob-nav bulunamadi");

// eski panel CSS'inin bittiği yer: @media (max-width:1100px) bloğu
const endMark = s.indexOf(".nav-burger {\n  display: flex;");
if (endMark === -1) throw new Error("nav-burger bulunamadi");

const removed = s.slice(start, endMark);
const KEPT = [".radial", ".ri ", ".radial.open", ".nav-burger", "@media"];
const suspicious = removed
  .split("\n")
  .filter((l) => l.trim().startsWith(".") && !KEPT.some((k) => l.includes(k)));
console.log("kaldirilan blok satiri:", removed.split("\n").length);
console.log("sasiri kontrolu:", suspicious.length ? suspicious.join(" | ") : "temiz");

s = s.slice(0, start) + s.slice(endMark);

// kısa ekran media query'lerindeki ölü mob-nav/mn-* kurallarını temizle
s = s.replace(/\n  \.mob-nav \{[\s\S]*?\n  \}\n  \.mob-nav\.open \{[\s\S]*?\n  \}\n/g, "\n");
s = s.replace(/\n  \.mob-nav a\.ml \{[\s\S]*?\n  \}\n/g, "\n");
s = s.replace(/\n  \.mn-grid \{[\s\S]*?\n  \}\n/g, "\n");
s = s.replace(/\n  \.mn-h \{[\s\S]*?\n  \}\n/g, "\n");
s = s.replace(/\n  \.mn-foot \{[\s\S]*?\n  \}\n/g, "\n");

s += `
.radial-bar {
  position: fixed;
  bottom: 62px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease 0.3s, transform 0.3s ease 0.3s;
}
.radial.open .radial-bar {
  opacity: 1;
  transform: translateY(0);
}
.rb {
  min-height: 40px;
  padding: 10px 20px;
  border: 1px solid var(--cyanM);
  border-radius: 999px;
  background: rgba(4, 8, 16, 0.7);
  color: var(--cyan);
  font-family: var(--fm);
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.rb:hover,
.rb:focus-visible {
  background: var(--cyan);
  border-color: var(--cyan);
  color: var(--void);
}
`;

fs.writeFileSync("style.css", s);
console.log("style.css: olu CSS temizlendi, radial-bar eklendi");
console.log("kalan .mob-nav referansi:", (s.match(/mob-nav/g) || []).length);
console.log("kalan .ml referansi:", (s.match(/\.ml\b/g) || []).length);
