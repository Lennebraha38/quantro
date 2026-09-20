/* quantro-js npm paketi senkronizasyonu:
   Kanonik kaynak kökteki quantro.js'tir; publish paketi (package/quantro/)
   her seferinde buradan kopyalanır ve bütünlük doğrulanır. */
import { statSync, copyFileSync, createReadStream, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "quantro.js");
const DST = path.join(ROOT, "package", "quantro", "quantro.js");

function sha(p) {
  const h = createHash("sha256");
  return new Promise((res) => {
    const s = createReadStream(p);
    s.on("data", (d) => h.update(d));
    s.on("end", () => res(h.digest("hex")));
  });
}

copyFileSync(SRC, DST);
const a = await sha(SRC);
const b = await sha(DST);
const ok = a === b;
console.log(
  `sync ${a === b ? "OK" : "FAIL"} — quantro.js → package/quantro/quantro.js (${statSync(DST).size}B)`,
);
writeFileSync(path.join(ROOT, "package", "quantro", ".quantro-sha"), a + "\n");
if (!ok) process.exit(1);
