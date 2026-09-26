/* ═════════════════════════════════════════════════════════
   QUANTRO · ZENAI SENKRONİZASYONU
   ── Ne yapar?
     Lennebraha38/ZENAI deposunun main dalındaki son commit'i
     (sha, tarih, başlık) data/zenai.json'a yazar. Site bu JSON'u
     client-side okuyup rozeti günceller; böylece ZENAI'da bir
     değişiklik olduğunda site de (deploy sonrası) otomatik yansır.
   Çalışma modları:
     node scripts/zenai-sync.mjs          → JSON'u yazar (yerel)
     node scripts/zenai-sync.mjs --check   → yalnızca karşılaştırır,
                                              değişiklik varsa çıkış kodu 1
   Kimlik doğrulama: GITHUB_TOKEN / GH_TOKEN varsa kullanılır (limit
   yükselir); yoksa anon çağrı (60 req/saat yeterli, günlük 1 çağrı).
   Ağ hatası JSON'u bozmaz: eski veri korunur, uyarı basılır.
   ═════════════════════════════════════════════════════════ */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "data", "zenai.json");
const REPO = "Lennebraha38/ZENAI";
const BRANCH = "main";
const checkOnly = process.argv.includes("--check");
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "quantro-zenai-sync",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

let remote;
try {
  const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${BRANCH}`, {
    headers,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} ${res.statusText}`);
  const c = await res.json();
  remote = {
    repo: REPO,
    branch: BRANCH,
    sha: String(c.sha).slice(0, 7),
    full: c.sha,
    date: c.commit.committer.date,
    msg: String(c.commit.message || "")
      .split("\n")[0]
      .slice(0, 72),
    url: `https://github.com/${REPO}`,
  };
} catch (e) {
  console.error(`⚠ ZENAI'ya ulaşılamadı (${e.message}); mevcut veri korunuyor.`);
  process.exit(checkOnly ? 1 : 0);
}

const current = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : null;
const changed = !current || current.full !== remote.full;

if (checkOnly) {
  if (changed) {
    console.log(`✗ ZENAI güncellenmiş: ${current?.sha ?? "-"} → ${remote.sha} (json tazelenmeli)`);
    process.exit(1);
  }
  console.log(`✓ ZENAI senkron (${remote.sha})`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(remote, null, 2)}\n`);
console.log(
  changed
    ? `↻ ZENAI güncellendi: ${current?.sha ?? "-"} → ${remote.sha}`
    : `✓ ZENAI senkron (${remote.sha})`,
);
