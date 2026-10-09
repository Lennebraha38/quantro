/* ═══════════════════════════════════════════════════════════════
   Quantro GRID · isci (Web Worker)
   Tarayicidan bir is birimini alir, kuantum devresi Monte Carlo
   orneklemesini deterministik olarak calistirir ve histogrami dondurur.

   Onemli: sonuc tohumdan (seed) birebir yeniden uretilebilir. Sunucu
   ayni motoru (quantro.js) ve ayni tohumu kullanarak bu histogrami
   yeniden hesaplar; tutmazsa katki reddedilir. Yani her tarayici
   gercekten hesaplamak zorundadir.
   ═══════════════════════════════════════════════════════════════ */
importScripts("/quantro.js");

self.onmessage = function (e) {
  var d = e.data || {};
  try {
    var shots = Math.max(1, Math.min(65536, d.shots | 0));
    var theta = Number(d.theta) || 0;
    var seed = (d.seed | 0) >>> 0;
    var kind = d.kind || d.experiment || "ry-cx";

    var qc = new Quantro.QuantumCircuit(2);
    if (kind === "bell-ry") {
      qc.h(0);
      qc.cx(0, 1);
      qc.ry(theta, 1);
    } else {
      qc.h(0);
      qc.ry(theta, 0);
      qc.cx(0, 1);
    }

    var t0 = Date.now();
    var counts = Quantro.sampleDistribution(qc, shots, seed);
    var ms = Date.now() - t0;

    /* counts: { "0": n, "11": n ... } anahtarlari tam sayi indeksidir */
    var out = { 0: 0, 1: 0, 2: 0, 3: 0 };
    var total = 0;
    for (var k in counts) {
      if (Object.prototype.hasOwnProperty.call(counts, k)) {
        out[k] = counts[k];
        total += counts[k];
      }
    }
    self.postMessage({
      ok: true,
      unitId: d.unitId,
      theta: theta,
      seed: seed,
      shots: shots,
      counts: out,
      total: total,
      ms: ms,
    });
  } catch (err) {
    self.postMessage({ ok: false, unitId: d.unitId, error: String((err && err.message) || err) });
  }
};
