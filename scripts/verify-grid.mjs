/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · dogrulama testi (v2)

   GRID'in temel iddiasi sunudur: "katki veren tarayici gercekten
   hesaplamak zorundadir; sonuclar tohumdan birebir yeniden uretilebilir
   ve acik veri olarak dogrulanabilir." Bu test o iddiayi sunucu
   tarafinda kanitlar:

     1. sampleDistribution tohumdan deterministik mi? (her iki deney)
     2. Devre fizigi dogru mu? (ry: (1±sin)/2 ; rx: cos²/sin²)
     3. /experiment, /unit, /stats, /leaderboard, /export uclari
     4. /result DOGRU histogramla 200 {verified:true}
     5. /result YANLIS histogramla / bilinmeyen deneyle reddediyor mu?
     6. Basarili katki deneye ozel istatistige yansiyor mu?

   Supabase kapatilir: test ag cagrisi yapmadan bellek ici yedege duser.
   ═══════════════════════════════════════════════════════════════ */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const Quantro = require("../quantro.js");
const handler = require("../apifns/grid.js");
const DATA = require("../data/grid/experiments.json");

let fail = 0;
const ozel = (ok, ad, detay) => {
  if (!ok) fail++;
  console.log(`   ${ok ? "OK  " : "FAIL"} ${ad}${detay ? " — " + detay : ""}`);
};

function circuitFor(kind, theta) {
  const qc = new Quantro.QuantumCircuit(2);
  if (kind === "bell-ry") {
    qc.h(0);
    qc.cx(0, 1);
    qc.ry(theta, 1);
  } else {
    qc.h(0);
    qc.ry(theta, 0);
    qc.cx(0, 1);
  }
  return qc;
}
function countsFor(kind, theta, seed, shots) {
  return Quantro.sampleDistribution(circuitFor(kind, theta), shots, seed);
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

console.log("\n── 1. Determinizm (her iki deney) ──");
for (const exp of DATA.items) {
  const theta = 0.9876543;
  const seed = 123456789;
  const a = countsFor(exp.kind, theta, seed, 4096);
  const b = countsFor(exp.kind, theta, seed, 4096);
  ozel(JSON.stringify(a) === JSON.stringify(b), `${exp.id}: ayni (theta,seed) → ayni histogram`);
  const c = countsFor(exp.kind, theta, seed + 1, 4096);
  ozel(JSON.stringify(a) !== JSON.stringify(c), `${exp.id}: farkli tohum → farkli histogram`);
}

console.log("\n── 2. Devre fizigi ──");
{
  const shots = 20000;
  /* ry: P(00)=(1-sin)/2, P(11)=(1+sin)/2, P(01)=P(10)=0 */
  const ry = countsFor("ry-cx", Math.PI / 2, 42, shots);
  const ryTotal = (ry[0] || 0) + (ry[1] || 0) + (ry[2] || 0) + (ry[3] || 0);
  ozel(ryTotal === shots, "ry: toplam orneklem = shots", `${ryTotal}/${shots}`);
  ozel((ry[1] || 0) === 0 && (ry[2] || 0) === 0, "ry: P(01)=P(10)=0");
  ozel(Math.abs((ry[3] || 0) / shots - 1) < 0.02, "ry: theta=pi/2 → P(11)≈1");
  for (const th of [0.3, 1.1, 2.4, 4.9]) {
    const cc = countsFor("ry-cx", th, 777, 40000);
    const deneysel = cc[3] / 40000 - cc[0] / 40000;
    ozel(Math.abs(deneysel - Math.sin(th)) < 0.02, `ry: sin(${th.toFixed(2)}) uyumu`);
  }
  /* bell-ry: P(00)=P(11)=cos²(theta/2)/2, P(01)=P(10)=sin²(theta/2)/2 */
  for (const th of [0.7, 1.9, 3.3, 5.5]) {
    const cc = countsFor("bell-ry", th, 31337, 40000);
    const total = cc[0] + cc[1] + cc[2] + cc[3];
    ozel(total === 40000, `bell-ry: toplam = shots (th=${th.toFixed(2)})`);
    const p00 = cc[0] / 40000;
    const p01 = cc[1] / 40000;
    const teorik00 = Math.pow(Math.cos(th / 2), 2) / 2;
    const teorik01 = Math.pow(Math.sin(th / 2), 2) / 2;
    ozel(Math.abs(p00 - teorik00) < 0.02, `bell-ry: cos²(th/2)/2 uyumu (th=${th.toFixed(2)})`);
    ozel(Math.abs(p01 - teorik01) < 0.02, `bell-ry: sin²(th/2)/2 uyumu (th=${th.toFixed(2)})`);
  }
}

console.log("\n── 3. Deney kayitlari (/experiment) ──");
{
  const res = mockRes();
  await handler(mockReq("GET", "/api/grid?op=experiment"), res);
  ozel(res.statusCode === 200, "GET /experiment → 200", String(res.statusCode));
  ozel(Array.isArray(res.payload.items) && res.payload.items.length >= 2, "en az 2 deney kayitli");
  ozel(!!res.payload.primary, "birincil deney tanimli", res.payload.primary);
  ozel(res.payload.shotsPerUnit === 4096, "shotsPerUnit = 4096");
  const res2 = mockRes();
  await handler(mockReq("POST", "/api/grid?op=experiment"), res2);
  ozel(res2.statusCode === 405, "POST /experiment → 405");
}

console.log("\n── 4. Is birimi (/unit) ──");
let unit;
{
  const res = mockRes();
  await handler(mockReq("POST", "/api/grid?op=unit"), res);
  ozel(res.statusCode === 200, "POST /unit → 200", String(res.statusCode));
  unit = res.payload;
  ozel(typeof unit.unitId === "string" && unit.unitId.length > 8, "unitId uretildi");
  const known = DATA.items.some((e) => e.id === unit.experiment);
  ozel(known, "bilinen deney kimligi", unit.experiment);
  const exp = DATA.items.find((e) => e.id === unit.experiment);
  ozel(exp && unit.kind === exp.kind, "kind deneyle tutarli", unit.kind);
  ozel(
    Number.isFinite(unit.theta) && unit.theta >= 0 && unit.theta <= Math.PI * 2,
    "theta aralikta",
  );
  ozel(Number.isInteger(unit.seed) && unit.seed > 0, "tohum pozitif tam sayi");
  ozel(unit.shots === 4096, "shots = shotsPerUnit");
}

console.log("\n── 5. Dogru sonuc kabul (/result) ──");
{
  const counts = countsFor(unit.kind, unit.theta, unit.seed, unit.shots);
  const res = mockRes();
  await handler(
    mockReq("POST", "/api/grid?op=result", {
      unitId: unit.unitId,
      experiment: unit.experiment,
      theta: unit.theta,
      seed: unit.seed,
      counts,
      nodeId: "testnode123",
    }),
    res,
  );
  ozel(res.statusCode === 200, "dogru histogram → 200", String(res.statusCode));
  ozel(res.payload && res.payload.ok === true && res.payload.verified === true, "verified:true");
  ozel(res.payload.experiment === unit.experiment, "deney kimligi geri dondu");
}

console.log("\n── 6. Reddedilen girdiler ──");
{
  const res = mockRes();
  await handler(
    mockReq("POST", "/api/grid?op=result", {
      unitId: "sahte-unit",
      experiment: unit.experiment,
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
    mockReq("POST", "/api/grid?op=result", { unitId: "", theta: 1, seed: 1, counts: {} }),
    res2,
  );
  ozel(res2.statusCode === 400, "bos unitId → 400", String(res2.statusCode));

  const res3 = mockRes();
  await handler(
    mockReq("POST", "/api/grid?op=result", {
      unitId: "u",
      experiment: "yok-deney",
      theta: unit.theta,
      seed: unit.seed,
      counts: {},
    }),
    res3,
  );
  ozel(res3.statusCode === 400, "bilinmeyen deney → 400", String(res3.statusCode));
}

console.log("\n── 7. Istatistik / liderlik / acik veri ──");
{
  const res = mockRes();
  await handler(mockReq("GET", "/api/grid?op=stats&experiment=" + unit.experiment), res);
  ozel(res.statusCode === 200, "GET /stats → 200");
  ozel(Array.isArray(res.payload.bins) && res.payload.bins.length === 48, "48 bin uretildi");
  ozel(
    res.payload.units >= 1 && res.payload.shots >= 4096,
    "deneye ozel katki sayildi",
    `units=${res.payload.units} shots=${res.payload.shots}`,
  );
  ozel(
    res.payload.totalUnits >= 1,
    "ag toplami (totalUnits) mevcut",
    String(res.payload.totalUnits),
  );

  const res2 = mockRes();
  await handler(mockReq("GET", "/api/grid?op=data"), res2);
  ozel(res2.statusCode === 200 && Array.isArray(res2.payload.bins), "GET /data → 200 acik veri");

  const res3 = mockRes();
  await handler(mockReq("GET", "/api/grid?op=leaderboard"), res3);
  ozel(
    res3.statusCode === 200 && Array.isArray(res3.payload.leaderboard),
    "GET /leaderboard → 200",
  );

  const res4 = mockRes();
  await handler(mockReq("GET", "/api/grid?op=export"), res4);
  ozel(res4.statusCode === 200 && Array.isArray(res4.payload.rows), "GET /export → 200 (JSON)");

  const res5 = mockRes();
  await handler(mockReq("GET", "/api/grid?op=export&format=csv"), res5);
  ozel(
    res5.statusCode === 200 && typeof res5.payload === "string" && res5.payload.includes("unit_id"),
    "GET /export&format=csv → CSV basligi",
  );

  const res6 = mockRes();
  await handler(mockReq("GET", "/api/grid?op=yok"), res6);
  ozel(res6.statusCode === 404, "bilinmeyen op → 404", String(res6.statusCode));
}

console.log(
  `\n${fail === 0 ? "GRID TEST TEMIZ: tum kontroller gecti" : `GRID TEST: ${fail} KONTROL BASARISIZ`}\n`,
);
process.exit(fail === 0 ? 0 : 1);
