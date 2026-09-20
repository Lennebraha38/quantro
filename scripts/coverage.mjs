/* ═════════════════════════════════════════════════════════
   QUANTRO · KAPSAM EŞİĞİ KONTROLÜ (Node ≥ 20)
   ── node:test coverage raporunu çalıştırır, "all files"
      satırını ayrıştırır ve eşiklerin altında kalınırsa exit 1.
   Eşikler: satır ≥ 80% · dal ≥ 75% · fonksiyon ≥ 85%
   ═════════════════════════════════════════════════════════ */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "test/quantro.test.js",
  "test/_lib.test.js",
  "test/api-handlers.test.js",
  "test/localize.test.js",
];
const THRESHOLDS = {
  line: 80,
  branch: 75,
  funcs: 85,
};

const res = spawnSync(process.execPath, ["--test", "--experimental-test-coverage", ...FILES], {
  cwd: root,
  encoding: "utf8",
});

const out = (res.stdout || "") + (res.stderr || "");

// "# all files | 86.06 | 82.61 | 90.24 |"
const m = out.match(/^# all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/m);
if (!m) {
  console.error("Kapsam raporu bulunamadı (toplam test durumu):");
  console.error(
    out
      .split("\n")
      .filter((l) => /^# (tests|pass|fail|ok|not ok)/.test(l))
      .join("\n"),
  );
  process.exit(res.status === 0 ? 1 : res.status || 1);
}

const [line, branch, funcs] = m.slice(1).map(Number);
const rows = { line, branch, funcs };
console.log(
  `▸ Kapsam: satır %${line} · dal %${branch} · fonksiyon %${funcs} (eşikler: satır ${THRESHOLDS.line}% · dal ${THRESHOLDS.branch}% · fonksiyon ${THRESHOLDS.funcs}%)`,
);

let bad = false;
for (const [k, v] of Object.entries(rows)) {
  if (v < THRESHOLDS[k]) {
    bad = true;
    console.error(`✗ ${k}: %${v} < eşik %${THRESHOLDS[k]}`);
  }
}
process.exit(bad ? 1 : 0);
