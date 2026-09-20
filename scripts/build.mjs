/* ═════════════════════════════════════════════════════════
   QUANTRO · BUILD / BÜTÜNLÜK KONTROLÜ (bağımsız, Node≥18)
   ── Ne yapar?
     1. vercel.json'un JSON olarak ayrıştırıldığını doğrular
     2. Bütün *.html dosyalarındaki yerel src/href referanslarının
        diske karşılığını kontrol eder (çalışmayan link yakalanır)
     3. Klasör içeriğiyle ilgili özet rapor basar
   Çıkış kodu 0 = temiz · 1 = kırık referans / hatalı yapı.
   ═════════════════════════════════════════════════════════ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = /^(https?:|mailto:|tel:|\/\/|data:|blob:|javascript:|#)/;
const errors = [];
let links = 0;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function checkVerelConfig() {
  const file = path.join(root, "vercel.json");
  try {
    const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      !Array.isArray(cfg.headers) ||
      !Array.isArray(cfg.redirects) ||
      !Array.isArray(cfg.rewrites)
    ) {
      throw new Error("beklenen alanlar eksik (headers/redirects/rewrites)");
    }
    console.log(
      `  ✓ vercel.json geçerli (${cfg.headers.length} header, ${cfg.redirects.length} redirect, ${cfg.rewrites.length} rewrite)`,
    );
  } catch (e) {
    errors.push(`vercel.json: ${e.message}`);
  }
}

function checkHtmlFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  if (!/<!doctype html>/i.test(raw))
    errors.push(`${path.relative(root, file)}: <!DOCTYPE html> bulunamadı`);
  const re = /(?:src|href|data-src)=["']([^"'#\s?]+)["']/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const url = m[1];
    if (SKIP.test(url)) continue;
    links++;
    const clean = url.split(/[?#]/)[0].replace(/^\/+/, "");
    if (!clean) continue;
    const target = path.resolve(path.dirname(file), clean);
    if (!fs.existsSync(target))
      errors.push(`${path.relative(root, file)} → kırık referans: ${url}`);
  }
}

const htmlFiles = walk(root);
console.log(`▸ QUANTRO build — ${htmlFiles.length} HTML dosyası`);
console.log("  ── Vercel yapılandırması ──");
checkVerelConfig();
console.log("  ── Referans bütünlüğü ──");
for (const f of htmlFiles) checkHtmlFile(f);

// Klasör özeti
const totals = { html: 0, js: 0, css: 0, sql: 0 };
totals.html = htmlFiles.length;
for (const e of fs.readdirSync(root)) {
  if (e.endsWith(".js")) totals.js++;
  if (e.endsWith(".css")) totals.css++;
  if (e.endsWith(".sql")) totals.sql++;
}
totals.js += fs.readdirSync(path.join(root, "api")).filter((f) => f.endsWith(".js")).length;
totals.js += fs.readdirSync(path.join(root, "lab")).filter((f) => f.endsWith(".js")).length;
for (const dir of ["css", "scripts", "test", "blog-articles", "insta"]) {
  if (!fs.existsSync(path.join(root, dir))) continue;
  for (const f of fs.readdirSync(path.join(root, dir))) {
    if (f.endsWith(".js")) totals.js++;
    if (f.endsWith(".css")) totals.css++;
  }
}
console.log(`  ✓ kontrol edilen yerel referans: ${links}`);
console.log(
  `  ✓ içerik: ${totals.html} HTML · ${totals.js} JS · ${totals.css} CSS · ${totals.sql} SQL`,
);

if (errors.length) {
  console.error("\n✗ Hatalar:");
  for (const e of errors) console.error("   - " + e);
  process.exit(1);
}
console.log("\n✓ BUILD TEMİZ");
