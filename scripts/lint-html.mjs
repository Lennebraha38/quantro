// Quantro · lint-html — HTML içindeki inline <script> gövdelerini
// (ld+json / importmap / modül ve src'li etiketler hariç) ESLint'in
// tarayıcı blok kurallarıyla sanal dosyalar üzerinde denetler.
//   node scripts/lint-html.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set([".git", "node_modules", "insta", "package"]);

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".html")) htmlFiles.push(p);
  }
})(root);

const eslint = new ESLint({ cwd: root, overrideConfigFile: path.join(root, "eslint.config.mjs") });
const JS_TYPES = new Set(["text/javascript", "application/javascript", ""]);
let problems = 0;

for (const file of htmlFiles) {
  const raw = fs.readFileSync(file, "utf8");
  const blocks = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const type = (m[1].match(/type\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || "";
    if (!JS_TYPES.has(type)) continue;
    const code = m[2] || "";
    if (!code.trim()) continue;
    blocks.push(code);
  }
  if (!blocks.length) continue;

  const results = await eslint.lintText(blocks.join("\n;\n"), {
    filePath: "inline/" + path.basename(file) + ".js",
  });
  const errors = results.reduce((a, r) => a + r.errorCount, 0);
  const warnings = results.reduce((a, r) => a + r.warningCount, 0);
  problems += errors + warnings;
  if (errors + warnings) {
    console.log(path.relative(root, file) + `: ${errors} hata, ${warnings} uyarı`);
    for (const r of results)
      for (const x of r.messages) console.log(`  ${x.line}:${x.column}  ${x.message}`);
  }
}

if (problems) {
  console.error(`\n✗ INLINE LINT: ${problems} problem`);
  process.exit(1);
}
console.log(
  `✓ inline script denetimi temiz (${htmlFiles.length} HTML` + (process.exitCode === 0 ? ")" : ")"),
);
