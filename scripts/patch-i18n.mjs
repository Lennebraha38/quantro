import fs from "node:fs";

let s = fs.readFileSync("app.js", "utf8");
const before = s;

/* 1) Ölü `.ml` satırlarını kaldır, `[data-i18n-text]` desteği ekle */
const oldLang = `  const mb = document.querySelector(".ml");
  if (mb) mb.textContent = LANG === "tr" ? "TR" : LANG.toUpperCase();
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });`;
const newLang = `  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll("[data-i18n-text]").forEach((el) => {
    el.textContent = t(el.dataset.i18nText);
  });
  document.querySelectorAll("[data-lang-toggle]").forEach((el) => {
    el.textContent = LANG === "tr" ? "TR" : LANG.toUpperCase();
  });`;
if (!s.includes(oldLang)) throw new Error("applyLang blogu bulunamadi");
s = s.replace(oldLang, newLang);

/* 2) Dairesel menüye alt bar ekle: ana sayfa + dil */
const oldHint = `    const hint = document.createElement("p");
    hint.className = "radial-hint";
    hint.textContent = "Kapatmak için ESC veya ortadaki düğme";
    ring.append(holder, hint);`;
const newHint = `    const hint = document.createElement("p");
    hint.className = "radial-hint";
    hint.textContent = "Kapatmak için ESC veya ortadaki düğme";
    const bar = document.createElement("div");
    bar.className = "radial-bar";
    const home = document.createElement("a");
    home.className = "rb";
    home.href = "index.html";
    home.textContent = "← Ana Sayfa";
    const lang = document.createElement("button");
    lang.className = "rb";
    lang.dataset.langToggle = "1";
    lang.setAttribute("aria-label", "Dili değiştir");
    lang.textContent = "TR";
    bar.append(home, lang);
    ring.append(holder, hint, bar);`;
if (!s.includes(oldHint)) throw new Error("hint blogu bulunamadi");
s = s.replace(oldHint, newHint);

/* 3) Dil butonuna tıklama davranışı ekle */
const oldCore = `    core.addEventListener("click", () => setMenu(false));`;
const newCore = `    core.addEventListener("click", () => setMenu(false));
    lang.addEventListener("click", () => {
      toggleLang();
      setMenu(false);
    });`;
if (!s.includes(oldCore)) throw new Error("core click bulunamadi");
s = s.replace(oldCore, newCore);

fs.writeFileSync("app.js", s);
console.log("app.js: i18n + radial alt bar guncellendi");
console.log("degisiklik:", before.length, "->", s.length, "karakter");
