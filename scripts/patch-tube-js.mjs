import fs from "node:fs";

let s = fs.readFileSync("app.js", "utf8");

const ANCHOR = `    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) setMenu(false);
    });
  }`;

const TUBE = `    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && open) setMenu(false);
    });
  }

  /* ── Tubelight: üzerine gelinen/aktif öğeye kayan ışık ── */
  const tube = document.getElementById("tubelight");
  const glow = document.getElementById("tlglow");
  if (tube && glow) {
    const items = [...tube.querySelectorAll(".nb, .nav-cta")];
    const place = (el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const b = tube.getBoundingClientRect();
      glow.style.width = r.width + "px";
      glow.style.transform = "translateX(" + (r.left - b.left - 5) + "px)";
      glow.style.opacity = "1";
    };
    const home = () => place(tube.querySelector(".on") || items[0]);
    items.forEach((el) => {
      el.addEventListener("mouseenter", () => place(el));
      el.addEventListener("focus", () => place(el));
    });
    tube.addEventListener("mouseleave", home);
    /* Açık sayfayı işaretle */
    const cur = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const act = items.find((e) => (e.getAttribute("href") || "").toLowerCase() === cur);
    if (act) {
      items.forEach((e) => e.classList.remove("on"));
      act.classList.add("on");
    }
    requestAnimationFrame(home);
    addEventListener("resize", home);
  }`;

const n = s.split(ANCHOR).length - 1;
if (n !== 1) throw new Error(`anchor ${n} kez bulundu (1 bekleniyordu)`);
s = s.replace(ANCHOR, TUBE);
fs.writeFileSync("app.js", s);
console.log("tubelight JS eklendi");
