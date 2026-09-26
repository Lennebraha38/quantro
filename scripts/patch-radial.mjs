import fs from "node:fs";

const NEW = `  const burger = document.getElementById("burger");
  if (burger) {
    /* ── Dairesel menü: tek kaynaktan (js/nav-data.js) üretilir ── */
    const NAV = window.QUANTRO_NAV || [];
    const ring = document.createElement("div");
    ring.className = "radial";
    ring.id = "radial";
    ring.setAttribute("role", "dialog");
    ring.setAttribute("aria-modal", "true");
    ring.setAttribute("aria-label", "Site menüsü");
    const N = NAV.length;
    NAV.forEach((it, n) => {
      const a = (360 / N) * n - 90;
      const el = document.createElement("a");
      el.className = "ri";
      el.href = it.href;
      el.style.setProperty("--a", a + "deg");
      el.style.setProperty("--i", n);
      el.setAttribute("aria-label", it.t2 || it.t);
      if (it.k) el.dataset.i18nText = it.k;
      const ic = document.createElement("i");
      ic.textContent = it.i;
      const lb = document.createElement("span");
      lb.textContent = it.t;
      el.append(ic, lb);
      ring.appendChild(el);
    });
    const core = document.createElement("button");
    core.className = "radial-core";
    core.setAttribute("aria-label", "Menüyü kapat");
    core.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"/></svg>';
    const holder = document.createElement("div");
    holder.className = "radial-ring";
    holder.append(core);
    const hint = document.createElement("p");
    hint.className = "radial-hint";
    hint.textContent = "Kapatmak için ESC veya ortadaki düğme";
    ring.append(holder, hint);
    document.body.appendChild(ring);

    let open = false;
    const setMenu = (on) => {
      open = on;
      ring.classList.toggle("open", on);
      burger.setAttribute("aria-expanded", on ? "true" : "false");
      document.body.style.overflow = on ? "hidden" : "";
      if (on) {
        const f = ring.querySelector(".ri");
        if (f) f.focus();
      } else {
        burger.focus();
      }
    };
    burger.addEventListener("click", () => setMenu(!open));
    core.addEventListener("click", () => setMenu(false));
    ring.addEventListener("click", (e) => {
      if (e.target === ring) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) setMenu(false);
    });
  }`;

let s = fs.readFileSync("app.js", "utf8");
const lines = s.split("\n");
// 1955..1978 (1-indexli) = dizin 1954..1977
const start = 1954;
const end = 1978; // dizin sonu (haric)
const before = lines.slice(0, start);
const after = lines.slice(end);
s = before.join("\n") + "\n" + NEW + "\n" + after.join("\n");
fs.writeFileSync("app.js", s);
console.log("app.js guncellendi");
