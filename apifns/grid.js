/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · /api/grid  (Hobby plan fonksiyon sinirini asmamak
   icin api/[...path].js catch-all'undan yonlendirilir)

   Uclar (?op=...):
     GET  ?op=experiment              → deney kayitlari (acik, surumlu)
     GET  ?op=stats[&experiment=id]   → canli ozet + 48 bin (RPC)
     GET  ?op=leaderboard[&limit=n]   → node_id bazli liderlik
     GET  ?op=export[&format=csv|json]→ ham acik veri (kimliksiz)
     GET  ?op=data                    → stats takma adi (geriye uyum)
     POST ?op=unit                    → is birimi ver (unitId, seed, theta)
     POST ?op=result                  → sonucu DOGRULA ve kaydet

   Dogrulama: her is birimi (deney, theta, seed) ucgeninden quantro.js
   ile birebir yeniden uretilir. Istemcinin sayilari yeniden hesaplanan
   histogramla birebir eslesmezse katki reddedilir; yani bir tarayici
   gercekten hesaplamadan katki veremez.

   Not: Bu projede PostgREST toplama fonksiyonlari kapali
   (PGRST123 "aggregate functions is not allowed"). Bu yuzden toplamlar
   grid_summary() / grid_leaderboard() SQL fonksiyonlariyla alinir.
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
const DATA = require("../data/grid/experiments.json");

const TAU = Math.PI * 2;
const BINS = 48;
const SHOTS = DATA.shotsPerUnit;
const DAILY_CAP = 4000; // is birimi / 24 saat / ip_hash (kotuye kullanim siniri)
const EXPERIMENTS = DATA.items;
const EXP_BY_ID = {};
EXPERIMENTS.forEach(function (e) {
  EXP_BY_ID[e.id] = e;
});
const PRIMARY =
  EXPERIMENTS.find(function (e) {
    return e.primary;
  }) || EXPERIMENTS[0];

const unitLimiter = rateLimiter(240, 60 * 1000);
const resultLimiter = rateLimiter(240, 60 * 1000);

/* ── Bellek ici yedek toplama (Supabase yoksa) ─────────────────── */
const mem = {
  shots: 0,
  units: 0,
  nodes: new Set(),
  byExperiment: new Map(), // expId -> {units, shots}
  bins: new Map(), // "expId:bin" -> {shots, p00, p11}
  nodeStats: new Map(), // nodeId -> {units, shots}
  ipHits: new Map(), // ipHash -> [ts,...] (gunluk limit)
  startedAt: Date.now(),
};

/* ── Deterministik yeniden uretim (worker ile ayni) ────────────── */
function buildCircuit(kind, theta) {
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
function expectedCounts(exp, theta, seed, shots) {
  return Quantro.sampleDistribution(buildCircuit(exp.kind, theta), shots, seed);
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
function cleanNodeId(v) {
  const s = String(v || "").trim();
  return /^[a-zA-Z0-9_-]{6,64}$/.test(s) ? s : null;
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

async function dbSummary(experimentId) {
  const r = await supabaseFetch("/rest/v1/rpc/grid_summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_experiment: experimentId || null }),
  });
  if (!r.ok) throw new Error("summary " + r.status);
  return await r.json();
}

async function dbLeaderboard(limit) {
  const r = await supabaseFetch("/rest/v1/rpc/grid_leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_limit: limit }),
  });
  if (!r.ok) throw new Error("leaderboard " + r.status);
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}

async function dbExport(experimentId, limit) {
  let url =
    "/rest/v1/grid_results?select=unit_id,experiment,theta,seed,shots,counts,created_at" +
    "&order=created_at.asc&limit=" +
    limit;
  if (experimentId) url += "&experiment=eq." + encodeURIComponent(experimentId);
  const r = await supabaseFetch(url);
  if (!r.ok) throw new Error("export " + r.status);
  return await r.json();
}

async function withinDailyCap(ipHash) {
  if (await supabaseAvailable()) {
    try {
      const since = new Date(Date.now() - 864e5).toISOString();
      const r = await supabaseFetch(
        "/rest/v1/grid_results?select=id&ip_hash=eq." +
          encodeURIComponent(ipHash) +
          "&created_at=gte." +
          encodeURIComponent(since),
        { headers: { Prefer: "count=exact", Range: "0-0" } },
      );
      const cr = r.headers.get("content-range") || "";
      const n = parseInt(cr.split("/")[1] || "0", 10) || 0;
      return n < DAILY_CAP;
    } catch (e) {
      /* dus, bellek yedegine gec */
    }
  }
  const arr = (mem.ipHits.get(ipHash) || []).filter(function (ts) {
    return Date.now() - ts < 864e5;
  });
  mem.ipHits.set(ipHash, arr);
  return arr.length < DAILY_CAP;
}

/* ── Binned girisim egrisi (bellek yedegi) ─────────────────────── */
function memBinned(expId) {
  return Array.from({ length: BINS }, function (_, i) {
    const e = mem.bins.get(expId + ":" + i);
    return {
      theta: (i + 0.5) * (TAU / BINS),
      shots: e ? e.shots : 0,
      p00: e && e.shots ? e.p00 / e.shots : 0,
      p11: e && e.shots ? e.p11 / e.shots : 0,
    };
  });
}

function toCsv(rows) {
  const head = "unit_id,experiment,theta,seed,shots,c00,c01,c10,c11,created_at";
  const lines = [head];
  for (const r of rows) {
    const c = normaliseCounts(r.counts || {});
    lines.push(
      [
        r.unit_id,
        r.experiment,
        r.theta,
        r.seed,
        r.shots,
        c[0],
        c[1],
        c[2],
        c[3],
        r.created_at,
      ].join(","),
    );
  }
  return lines.join("\n") + "\n";
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  /* Vercel bu projede api/[...path].js catch-all'unu YALNIZCA tek yol
     segmenti icin calistiriyor. Bu yuzden op'u once ?op= sorgusundan,
     yoksa yolun 3. parcasindan (yerel test) okuyoruz. */
  const parts = (req.url.split("?")[0] || "").split("/").filter(Boolean);
  const qs = new URLSearchParams(req.url.split("?")[1] || "");
  let op = qs.get("op") || "";
  if (!op) op = parts[2] || "stats";

  /* ── Deney kayitlari ─────────────────────────────────────────── */
  if (op === "experiment") {
    if (req.method !== "GET") return res.status(405).json({ error: "method" });
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.json(Object.assign({}, DATA, { primary: PRIMARY.id }));
  }

  /* ── Is birimi ver ───────────────────────────────────────────── */
  if (op === "unit") {
    if (req.method !== "POST") return res.status(405).json({ error: "method" });
    if (!unitLimiter(clientIp(req))) return res.status(429).json({ error: "rate" });
    const seed = crypto.randomInt(1, 2147483646);
    const theta = (crypto.randomInt(0, 65536) / 65536) * TAU;
    const exp = EXPERIMENTS[crypto.randomInt(0, EXPERIMENTS.length)];
    return res.json({
      unitId: crypto.randomUUID(),
      experiment: exp.id,
      kind: exp.kind,
      version: DATA.version,
      seed: seed,
      theta: theta,
      shots: SHOTS,
    });
  }

  /* ── Sonucu dogrula ve kaydet ────────────────────────────────── */
  if (op === "result") {
    if (req.method !== "POST") return res.status(405).json({ error: "method" });
    if (!resultLimiter(clientIp(req))) return res.status(429).json({ error: "rate" });
    const b = readJson(req);
    if (!b) return res.status(400).json({ error: "bad-request" });

    const unitId = String(b.unitId || "").slice(0, 64);
    const expId = String(b.experiment || b.experimentId || PRIMARY.id).slice(0, 64);
    const exp = EXP_BY_ID[expId];
    const seed = Number(b.seed) | 0;
    const theta = Number(b.theta);
    if (!exp || !unitId || !Number.isFinite(theta) || theta < 0 || theta > TAU) {
      return res.status(400).json({ error: "bad-unit" });
    }

    const expected = expectedCounts(exp, theta, seed, SHOTS);
    if (!countsMatch(b.counts, expected)) {
      return res.status(409).json({ error: "verify-failed" });
    }

    const ipHash = hashIp(clientIp(req));
    if (!(await withinDailyCap(ipHash))) {
      return res.status(429).json({ error: "daily-cap" });
    }
    const nodeId = cleanNodeId(b.nodeId);

    let stored = false;
    if (await supabaseAvailable()) {
      try {
        stored = await dbInsert({
          unit_id: unitId,
          experiment: exp.id,
          theta: theta,
          seed: seed,
          shots: SHOTS,
          counts: normaliseCounts(expected),
          ip_hash: ipHash,
          node_id: nodeId,
        });
      } catch (e) {
        stored = false;
      }
    }
    if (!stored) {
      /* Yedek: bellek ici toplama (Supabase yoksa veya yazim hatasinda) */
      const bi = binOf(theta);
      const e = mem.bins.get(exp.id + ":" + bi) || { shots: 0, p00: 0, p11: 0 };
      const c = normaliseCounts(expected);
      e.shots += SHOTS;
      e.p00 += c[0];
      e.p11 += c[3];
      mem.bins.set(exp.id + ":" + bi, e);
      mem.shots += SHOTS;
      mem.units += 1;
      mem.nodes.add(ipHash);
      const be = mem.byExperiment.get(exp.id) || { units: 0, shots: 0 };
      be.units += 1;
      be.shots += SHOTS;
      mem.byExperiment.set(exp.id, be);
      if (nodeId) {
        const ns = mem.nodeStats.get(nodeId) || { units: 0, shots: 0 };
        ns.units += 1;
        ns.shots += SHOTS;
        mem.nodeStats.set(nodeId, ns);
      }
      const hits = mem.ipHits.get(ipHash) || [];
      hits.push(Date.now());
      mem.ipHits.set(ipHash, hits);
    }
    return res.json({ ok: true, stored: stored, verified: true, experiment: exp.id });
  }

  /* ── Istatistik / canli ozet ─────────────────────────────────── */
  if (op === "stats" || op === "data") {
    if (req.method !== "GET") return res.status(405).json({ error: "method" });
    const expId =
      qs.get("experiment") && EXP_BY_ID[qs.get("experiment")] ? qs.get("experiment") : PRIMARY.id;
    let out = {
      shots: 0,
      units: 0,
      nodes: 0,
      bins: memBinned(expId),
      totalShots: 0,
      totalUnits: 0,
      totalNodes: 0,
    };
    let source = "memory";
    if (await supabaseAvailable()) {
      try {
        const s = await dbSummary(expId);
        out = {
          shots: Number(s.shots) || 0,
          units: Number(s.units) || 0,
          nodes: Number(s.nodes) || 0,
          bins: Array.isArray(s.bins) ? s.bins : [],
          totalShots: Number(s.totalShots) || 0,
          totalUnits: Number(s.totalUnits) || 0,
          totalNodes: Number(s.totalNodes) || 0,
        };
        source = "supabase";
      } catch (e) {
        /* bellek yedeginde kal */
      }
    }
    if (source === "memory") {
      const be = mem.byExperiment.get(expId) || { units: 0, shots: 0 };
      out.totalShots = mem.shots;
      out.totalUnits = mem.units;
      out.totalNodes = mem.nodes.size;
      out.shots = be.shots;
      out.units = be.units;
    }
    res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=25, max-age=0");
    return res.json({
      experiment: expId,
      shots: out.shots,
      units: out.units,
      nodes: out.nodes,
      totalShots: out.totalShots,
      totalUnits: out.totalUnits,
      totalNodes: out.totalNodes,
      bins: out.bins,
      startedAt: source === "supabase" ? null : new Date(mem.startedAt).toISOString(),
      source: source,
      collectedAt: new Date().toISOString(),
    });
  }

  /* ── Liderlik ────────────────────────────────────────────────── */
  if (op === "leaderboard") {
    if (req.method !== "GET") return res.status(405).json({ error: "method" });
    let limit = parseInt(qs.get("limit") || "10", 10);
    if (!Number.isFinite(limit)) limit = 10;
    limit = Math.max(1, Math.min(50, limit));
    let rows = [];
    let source = "memory";
    if (await supabaseAvailable()) {
      try {
        rows = await dbLeaderboard(limit);
        source = "supabase";
      } catch (e) {
        rows = [];
      }
    }
    if (source === "memory") {
      rows = Array.from(mem.nodeStats.entries())
        .map(function (kv) {
          return { node: kv[0].slice(0, 8), units: kv[1].units, shots: kv[1].shots };
        })
        .sort(function (a, b) {
          return b.units - a.units || b.shots - a.shots;
        })
        .slice(0, limit);
    }
    res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=45, max-age=0");
    return res.json({ leaderboard: rows, source: source });
  }

  /* ── Ham acik veri disa aktarma (kimliksiz) ──────────────────── */
  if (op === "export") {
    if (req.method !== "GET") return res.status(405).json({ error: "method" });
    const expId =
      qs.get("experiment") && EXP_BY_ID[qs.get("experiment")] ? qs.get("experiment") : "";
    let limit = parseInt(qs.get("limit") || "5000", 10);
    if (!Number.isFinite(limit)) limit = 5000;
    limit = Math.max(1, Math.min(50000, limit));
    const format = (qs.get("format") || "json").toLowerCase();
    let rows = [];
    if (await supabaseAvailable()) {
      try {
        rows = await dbExport(expId, limit);
      } catch (e) {
        rows = [];
      }
    }
    if (format === "csv") {
      res.status(200);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="quantro-grid-' + new Date().toISOString().slice(0, 10) + '.csv"',
      );
      return res.end(toCsv(rows));
    }
    res.setHeader("Cache-Control", "public, max-age=60");
    return res.json({
      version: DATA.version,
      license: DATA.license,
      experiment: expId || "all",
      count: rows.length,
      columns: ["unit_id", "experiment", "theta", "seed", "shots", "counts", "created_at"],
      note: "ip_hash ve node_id gizlilik icin disa aktarilmaz.",
      rows: rows,
      collectedAt: new Date().toISOString(),
    });
  }

  return res.status(404).json({ error: "not found" });
};
