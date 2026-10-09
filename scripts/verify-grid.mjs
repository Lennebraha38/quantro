/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · dogrulama testi

   GRID'in temel iddiasi sunudur: "katki veren tarayici gercekten
   hesaplamak zorundadir; sonuclar tohumdan birebir yeniden uretilebilir
   ve acik veri olarak dogrulanabilir." Bu test o iddiayi sunucu
   tarafinda kanitlar:

     1. sampleDistribution tohumdan deterministik mi? (ayni tohum →
        ayni histogram, farkli tohum → farkli)
     2. Devre fizigi dogru mu? (P(01)=P(10)=0; P(00)+P(11)=shots)
     3. /experiment, /unit, /stats, /data uclari calisiyor mu?
     4. /result DOGRU histogramla 200 {verified:true} donuyor mu?
     5. /result YANLIS histogramla 409 verify-failed ile reddediyor mu?
     6. Basarili katki istatistige yansiyor mu?
   ═══════════════════════════════════════════════════════════════ */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

/* Supabase'i kapat: test ag cagrisi yapmadan bellek ici yedege duser. */
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const Quantro = require("../quantro.js");
const handler = require("../apifns/grid.js");
const EXPERIMENT = require("../data/grid/experiment.json");

let fail = 0;
const ozel = (ok, ad, detay) => {
  if (!ok) fail++;
  console.log(`   ${ok ? "OK  " : "FAIL"} ${ad}${detay ? " — " + detay : ""}`);
};

function build(qc, theta) {
  qc.h(0);
  qc.ry(theta, 0);
  qc.cx(0, 1);
}
function countsFor(theta, seed, shots) {
  const qc = new Quantro.QuantumCircuit(2);
  build(qc, theta);
  return Quantro.sampleDistribution(qc, shots, seed);
}
function mockReq(method, url, body) {
  return {
    method,
    url,
    headers: { "x-forwarded-for": "127.0.0.1" },
    socket: { remoteAddress: "127.0.0.1" },
    body,
  };
}
function mockRes() {
  const r = { statusCode: 200, headers: {}, payload: null };
  r.setHeader = (k, v) => (r.headers[k] = v);
  r.status = (c) => ((r.statusCode = c), r);
  r.json = (o) => ((r.payload = o), r);
  r.end = (s) => ((r.payload = s), r);
  return r;
}

console.log("\n── 1. Determinizm ──");
{
  const theta = 0.9876543;
  const seed = 123456789;
  const a = countsFor(theta, seed, 4096);
  const b = countsFor(theta, seed, 4096);
  ozel(JSON.stringify(a) === JSON.stringify(b), "ayni (theta,seed) → ayni histogram");
  const c = countsFor(theta, seed + 1, 4096);
  ozel(JSON.stringify(a) !== JSON.stringify(c), "farkli tohum → farkli histogram");
}

console.log("\n── 2. Devre fizigi ──");
{
  const shots = 20000;
  const theta = Math.PI / 2;
  const c = countsFor(theta, 42, shots);
  const total = (c[0] || 0) + (c[1] || 0) + (c[2] || 0) + (c[3] || 0);
  ozel(total === shots, "toplam orneklem = shots", `${total}/${shots}`);
  ozel((c[1] || 0) === 0 && (c[2] || 0) === 0, "P(01)=P(10)=0 (dolaniklik)");
  /* theta = pi/2 → P(00)=(1-sin)/2=0, P(11)=1 */
  ozel(Math.abs((c[0] || 0) / shots) < 0.02, "theta=pi/2 → P(00)≈0", `${c[0]}/${shots}`);
  ozel(Math.abs((c[3] || 0) / shots - 1) < 0.02, "theta=pi/2 → P(11)≈1", `${c[3]}/${shots}`);
  /* Genel teori kontrolu: P(11)-P(00) ≈ sin(theta) */
  for (const th of [0.3, 1.1, 2.4, 4.9]) {
    const cc = countsFor(th, 777, 40000);
    const p00 = cc[0] / 40000;
    const p11 = cc[3] / 40000;
    const deneysel = p11 - p00;
    const teorik = Math.sin(th);
    ozel(
      Math.abs(deneysel - teorik) < 0.02,
      `sin(${th.toFixed(2)}) uyumu`,
      `${deneysel.toFixed(3)} vs ${teorik.toFixed(3)}`,
    );
  }
}

console.log("\n── 3. Deney tanimi (/experiment) ──");
{
  const res = mockRes();
  const req = mockReq("GET", "/api/grid/experiment");
  await handler(req, res);
  ozel(res.statusCode === 200, "GET /experiment → 200", String(res.statusCode));
  ozel(res.payload.id === EXPERIMENT.id, "deney kimligi eslesiyor", res.payload.id);
  ozel(res.payload.qubits === 2 && res.payload.shotsPerUnit === 4096, "parametreler tutarli");
  const res2 = mockRes();
  await handler(mockReq("POST", "/api/grid/experiment"), res2);
  ozel(res2.statusCode === 405, "POST /experiment → 405");
}

console.log("\n── 4. Is birimi (/unit) ──");
let unit;
{
  const res = mockRes();
  await handler(mockReq("POST", "/api/grid/unit"), res);
  ozel(res.statusCode === 200, "POST /unit → 200", String(res.statusCode));
  unit = res.payload;
  ozel(typeof unit.unitId === "string" && unit.unitId.length > 8, "unitId uretildi");
  ozel(
    Number.isFinite(unit.theta) && unit.theta >= 0 && unit.theta <= Math.PI * 2,
    "theta aralikta",
    String(unit.theta),
  );
  ozel(Number.isInteger(unit.seed) && unit.seed > 0, "tohum pozitif tam sayi", String(unit.seed));
  ozel(unit.shots === 4096, "shots = shotsPerUnit");
}

console.log("\n── 5. Dogru sonuc kabul (/result) ──");
{
  const counts = countsFor(unit.theta, unit.seed, unit.shots);
  const res = mockRes();
  await handler(
    mockReq("POST", "/api/grid/result", {
      unitId: unit.unitId,
      theta: unit.theta,
      seed: unit.seed,
      counts,
    }),
    res,
  );
  ozel(res.statusCode === 200, "dogru histogram → 200", String(res.statusCode));
  ozel(
    res.payload && res.payload.ok === true && res.payload.verified === true,
    "verified:true dondu",
  );
}

console.log("\n── 6. Yanlis sonuc reddi (/result) ──");
{
  const res = mockRes();
  await handler(
    mockReq("POST", "/api/grid/result", {
      unitId: "sahte-unit",
      theta: unit.theta,
      seed: unit.seed,
      counts: { 0: 1, 1: 1, 2: 1, 3: 4093 },
    }),
    res,
  );
  ozel(res.statusCode === 409, "yanlis histogram → 409", String(res.statusCode));
  ozel(res.payload && res.payload.error === "verify-failed", "verify-failed hatasi");
  const res2 = mockRes();
  await handler(
    mockReq("POST", "/api/grid/result", { unitId: "", theta: 1, seed: 1, counts: {} }),
    res2,
  );
  ozel(res2.statusCode === 400, "bos unitId → 400", String(res2.statusCode));
}

console.log("\n── 7. Istatistik ve acik veri ──");
{
  const res = mockRes();
  await handler(mockReq("GET", "/api/grid/stats"), res);
  ozel(res.statusCode === 200, "GET /stats → 200", String(res.statusCode));
  ozel(
    Array.isArray(res.payload.bins) && res.payload.bins.length === 48,
    "48 bin uretildi",
    String(res.payload.bins.length),
  );
  ozel(
    res.payload.units >= 1 && res.payload.shots >= 4096,
    "onceki katki sayildi",
    `units=${res.payload.units} shots=${res.payload.shots}`,
  );

  const res2 = mockRes();
  await handler(mockReq("GET", "/api/grid/data"), res2);
  ozel(res2.statusCode === 200 && Array.isArray(res2.payload.bins), "GET /data → 200 acik veri");

  const res3 = mockRes();
  await handler(mockReq("GET", "/api/grid/yok"), res3);
  ozel(res3.statusCode === 404, "bilinmeyen op → 404", String(res3.statusCode));
}

console.log(
  `\n${fail === 0 ? "GRID TEST TEMIZ: tum kontroller gecti" : `GRID TEST: ${fail} KONTROL BASARISIZ`}\n`,
);
process.exit(fail === 0 ? 0 : 1);
