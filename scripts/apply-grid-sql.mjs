/* Quantro GRID · supabase-grid.sql'i Management API ile uygula.
   Kullanim: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-grid-sql.mjs
   Token yalnizca bu tek islem icin kullanilir; sonra iptal edilebilir. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const URL_ENV = process.env.SUPABASE_URL || "";
const REF = (URL_ENV.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1];
const SQL_FILE = path.join(ROOT, process.argv[2] || "supabase-grid.sql");

if (!TOKEN || !TOKEN.startsWith("sbp_")) {
  console.error("HATA: SUPABASE_ACCESS_TOKEN (sbp_...) gerekli.");
  process.exit(2);
}
if (!REF) {
  console.error("HATA: SUPABASE_URL okunamadi (proje ref bulunamadi).");
  process.exit(2);
}

const query = fs.readFileSync(SQL_FILE, "utf8");
console.log(`▸ Proje: ${REF} · dosya: supabase-grid.sql (${query.length} bayt)`);

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});
const text = await res.text();
console.log(`▸ HTTP ${res.status}`);
console.log(text.slice(0, 600));

if (!res.ok) {
  console.error("\n✗ SQL uygulanamadi.");
  process.exit(1);
}

/* Dogrula: tablo artik var mi? (service role ile REST) */
const SB = URL_ENV.replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (SB && KEY) {
  const probe = await fetch(`${SB}/rest/v1/grid_results?select=id&limit=1`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  console.log(`▸ Dogrulama (grid_results REST): HTTP ${probe.status}`);
  console.log(probe.ok ? "✓ TABLO HAZIR" : "✗ " + (await probe.text()).slice(0, 200));
  process.exit(probe.ok ? 0 : 1);
}
console.log("✓ SQL uygulandi (REST dogrulamasi icin anahtar yok).");
