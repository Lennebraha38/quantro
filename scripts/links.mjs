// ═══════════════════════════════════════════════════════════
// Quantro · iç bağlantı denetimi (CI'da çalışır)
// Tüm kök HTML dosyalarındaki yerel href/src hedeflerinin gerçekten
// var olduğunu doğrular. Extern (http/https/mailto/tel), çapa (#),
// veri ve sunucusuz (/api → rewrite) rotaları yok sayar.
//   node scripts/links.mjs   (kırık bağlantıda çıkış 1)
// ═══════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_PREFIX = ['/api/', '/insta/'];

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const missing = [];
const checked = new Set();

function resolveTarget(file, target) {
  if (target.startsWith('#') || !target) return null;
  const q = target.search(/[?#]/);
  const clean = q === -1 ? target : target.slice(0, q);
  if (!clean || clean.startsWith('/')) return clean; // kök-izafi: dosya kökünde ara
  return path.posix.normalize(path.posix.join(path.posix.dirname(file), clean));
}

for (const file of htmlFiles) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const regex = /(?:href|src|poster)=["']([^"']+)["']/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    const raw = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|about:)/i.test(raw)) continue;
    const target = resolveTarget(file, raw);
    if (!target) continue;
    if (SKIP_PREFIX.some((p) => target.startsWith(p))) continue;
    const key = target;
    if (checked.has(key)) continue;
    checked.add(key);
    const fp = path.join(ROOT, key.replace(/^\//, ''));
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) {
      missing.push(`${file} → ${raw}`);
    }
  }
}

if (missing.length) {
  console.error('KIRIK BAĞLANTILAR:');
  for (const l of missing) console.error('  ' + l);
  process.exit(1);
}
console.log(`Bağlantı denetimi OK (${checked.size} benzersiz yerel hedef, ${htmlFiles.length} html)`);