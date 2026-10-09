/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · /api/grid/*  (Hobby plan fonksiyon sinirini asmamak
   icin api/[...path].js catch-all'undan yonlendirilir)

   Uclar:
     GET  /api/grid/experiment  → deney tanimi (acik, surumlenmis)
     GET  /api/grid/stats       → canli istatistik + binned veri
     GET  /api/grid/data        → acik veri seti (indirilebilir JSON)
     POST /api/grid/unit        → is birimi ver (unitId, seed, theta)
     POST /api/grid/result      → sonucu DOGRULA ve kaydet

   Dogrulama: her is birimi (theta, seed) ciftinden quantro.js ile
   birebir yeniden uretilir. Istemcinin sayilari yeniden hesaplanan
   histogramla birebir eslesmezse katki reddedilir. Bu yuzden bir
   tarayici gercekten hesaplamadan katki veremez.
   ═══════════════════════════════════════════════════════════════ */
const crypto = require("crypto");
const {
  clientIp,
  rateLimiter,
  readJson,
  supabaseFetch,
  supabaseAvailable,
} = require("../api/_lib.js");
const Quantro = require("../quantro.js");
const EXPERIMENT = require("../data/grid/experiment.json");

const unitLimiter = rateLimiter(240, 60 * 1000);
const resultLimiter = rateLimiter(240, 60 * 1000);

const TAU = Math.PI * 2;

/* ── Bellek ici yedek toplama (Supabase yoksa) ─────────────────── */
const mem = {
  shots: 0,
  units: 0,
  nodes: new Set(),
  bins: new Map(), // binIndex -> {n, p00, p11, shots}
  startedAt: Date.now(),
};
const BINS = 48;

/* ── Deterministik yeniden uretim ──────────────────────────────── */
function expectedCounts(theta, seed, shots) {
  const qc = new Quantro.QuantumCircuit(2);
  qc.h(0);
  qc.ry(theta, 0);
  qc.cx(0, 1);
  return Quantro.sampleDistribution(qc, shots, seed);
}

function normaliseCounts(c) {
  return [c[0] | 0, c[1] | 0, c[2] | 0, c[3] | 0];
}

function countsMatch(a, b) {
  const A = normaliseCounts(a);
  const B = normaliseCounts(b);
  for (let i = 0; i < 4; i++) if (A[i] !== B[i]) return false;
  return true;
}

function binOf(theta) {
  let t = theta % TAU;
  if (t < 0) t += TAU;
  return Math.min(BINS - 1, Math.floor((t / TAU) * BINS));
}

function hashIp(ip) {
  const salt = process.env.AUTH_SECRET || "quantro-grid";
  return crypto
    .createHash("sha256")
    .update(salt + "|" + ip)
    .digest("hex")
    .slice(0, 24);
}

/* ── Supabase yardimcilari ─────────────────────────────────────── */
async function dbInsert(row) {
  const r = await supabaseFetch("/rest/v1/grid_results", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(row),
  });
  return r.ok || r.status === 409; // 409 = ayni unitId (idempotent)
}

async function dbStats() {
  const sumRes = await supabaseFetch("/rest/v1/grid_results?select=shots.sum()");
  if (!sumRes.ok) throw new Error("sum " + sumRes.status);
  const sumJson = await sumRes.json();
  const shots = (sumJson && sumJson[0] && sumJson[0].sum) || 0;

  const cntRes = await supabaseFetch("/rest/v1/grid_results?select=id", {
    headers: { Prefer: "count=exact", Range: "0-0" },
  });
  const cr = cntRes.headers.get("content-range") || "";
  const units = parseInt(cr.split("/")[1] || "0", 10) || 0;

  const nodeRes = await supabaseFetch("/rest/v1/grid_results?select=ip_hash&limit=20000");
  let nodes = 0;
  try {
    const arr = await nodeRes.json();
    nodes = new Set((arr || []).map((r) => r.ip_hash).filter(Boolean)).size;
  } catch (e) {
    nodes = 0;
  }

  const rowsRes = await supabaseFetch(
    `/rest/v1/grid_results?select=theta,counts,shots&order=created_at.desc&limit=20000`,
  );
  const rows = rowsRes.ok ? await rowsRes.json() : [];
  return { shots, units, nodes, rows };
}

/* ── Binned girisim egrisi (acik veri + grafik) ────────────────── */
function binnedFromRows(rows) {
  const bins = Array.from({ length: BINS }, (_, i) => ({
    theta: (i + 0.5) * (TAU / BINS),
    shots: 0,
    p00: 0,
    p11: 0,
  }));
  for (const r of rows) {
    const b = bins[binOf(Number(r.theta) || 0)];
    const c = r.counts || {};
    const n = Number(r.shots) || 0;
    if (n <= 0) continue;
    b.shots += n;
    b.p00 += (Number(c[0]) || 0) / n;
    b.p11 += (Number(c[3]) || 0) / n;
    b._k = (b._k || 0) + 1;
  }
  for (const b of bins)
    if (b._k) {
      b.p00 /= b._k;
      b.p11 /= b._k;
      delete b._k;
    }
  return bins;
}

function memBinned() {
  return Array.from({ length: BINS }, (_, i) => {
    const e = mem.bins.get(i);
    return {
      theta: (i + 0.5) * (TAU / BINS),
      shots: e ? e.shots : 0,
      p00: e && e.shots ? e.p00 / e.shots : 0,
      p11: e && e.shots ? e.p11 / e.shots : 0,
    };
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  /* Vercel bu projede api/[...path].js catch-all'unu YALNIZCA tek yol
     segmenti icin calistiriyor (cok segmentli /api/grid/x platform 404
     donduruyor). Bu yuzden op'u once ?op= sorgusundan, yoksa yolun
     3. parcasindan (yerel test) okuyoruz. */
  const parts = (req.url.split("?")[0] || "").split("/").filter(Boolean);
  let op = "";
  try {
    op = new URLSearchParams(req.url.split("?")[1] || "").get("op") || "";
  } catch (e) {
    op = "";
  }
  if (!op) op = parts[2] || "stats";

  /* ── Deney tanimi ────────────────────────────────────────────── */
  if (op === "experiment") {
    if (req.method !== "GET") return res.status(405).json({ error: "method" });
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.json(EXPERIMENT);
  }

  /* ── Is birimi ver ───────────────────────────────────────────── */
  if (op === "unit") {
    if (req.method !== "POST") return res.status(405).json({ error: "method" });
    if (!unitLimiter(clientIp(req))) return res.status(429).json({ error: "rate" });
    const seed = crypto.randomInt(1, 2147483646);
    const theta = (crypto.randomInt(0, 65536) / 65536) * TAU;
    return res.json({
      unitId: crypto.randomUUID(),
      experiment: EXPERIMENT.id,
      version: EXPERIMENT.version,
      seed,
      theta,
      shots: EXPERIMENT.shotsPerUnit,
    });
  }

  /* ── Sonucu dogrula ve kaydet ────────────────────────────────── */
  if (op === "result") {
    if (req.method !== "POST") return res.status(405).json({ error: "method" });
    if (!resultLimiter(clientIp(req))) return res.status(429).json({ error: "rate" });
    const b = readJson(req);
    if (!b) return res.status(400).json({ error: "bad-request" });

    const unitId = String(b.unitId || "").slice(0, 64);
    const seed = Number(b.seed) | 0;
    const theta = Number(b.theta);
    const shots = EXPERIMENT.shotsPerUnit; // istemciye guvenilmez
    if (!unitId || !Number.isFinite(theta) || theta < 0 || theta > TAU) {
      return res.status(400).json({ error: "bad-unit" });
    }

    const expected = expectedCounts(theta, seed, shots);
    if (!countsMatch(b.counts, expected)) {
      return res.status(409).json({ error: "verify-failed" });
    }

    const ipHash = hashIp(clientIp(req));
    let stored = false;
    if (await supabaseAvailable()) {
      try {
        stored = await dbInsert({
          unit_id: unitId,
          experiment: EXPERIMENT.id,
          theta,
          seed,
          shots,
          counts: normaliseCounts(expected),
          ip_hash: ipHash,
        });
      } catch (e) {
        stored = false;
      }
    }
    if (!stored) {
      /* Yedek: bellek ici toplama (Supabase yoksa veya yazim hatasinda) */
      const bi = binOf(theta);
      const e = mem.bins.get(bi) || { shots: 0, p00: 0, p11: 0 };
      const c = normaliseCounts(expected);
      e.shots += shots;
      e.p00 += c[0];
      e.p11 += c[3];
      mem.bins.set(bi, e);
      mem.shots += shots;
      mem.units += 1;
      mem.nodes.add(ipHash);
    }
    return res.json({ ok: true, stored, verified: true });
  }

  /* ── Istatistik / acik veri ──────────────────────────────────── */
  if (op === "stats" || op === "data") {
    if (req.method !== "GET") return res.status(405).json({ error: "method" });
    let shots = 0,
      units = 0,
      nodes = 0,
      bins = null;
    let source = "memory";
    if (await supabaseAvailable()) {
      try {
        const s = await dbStats();
        shots = s.shots;
        units = s.units;
        nodes = s.nodes;
        bins = binnedFromRows(s.rows);
        source = "supabase";
      } catch (e) {
        bins = null;
      }
    }
    if (!bins) {
      bins = memBinned();
      shots = mem.shots;
      units = mem.units;
      nodes = mem.nodes.size;
    }
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.json({
      experiment: EXPERIMENT.id,
      shots,
      units,
      nodes,
      bins,
      startedAt: source === "supabase" ? null : new Date(mem.startedAt).toISOString(),
      source,
      collectedAt: new Date().toISOString(),
    });
  }

  return res.status(404).json({ error: "not found" });
};
