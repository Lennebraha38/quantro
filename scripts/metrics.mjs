/* ═════════════════════════════════════════════════════════
   QUANTRO · PERFORMANS METRİKLERİ (PageSpeed Insights API)
   Hem "field" (gerçek kullanıcı / CrUX) hem "lab" (Lighthouse)
   verilerini alır. Kullanım:
     PSI_API_KEY=... node scripts/metrics.mjs [url] [mobile|desktop]
   Çıkış: alan ölçümü POOR ise exit 1; key yoksa uyarıyla devam.
   ═════════════════════════════════════════════════════════ */
const url = process.argv[2] || "https://quantro-1.vercel.app";
const strategy = process.argv[3] || "mobile";
const KEY = process.env.PSI_API_KEY || "";

const FIELD = {
  INTERACTIVE_TO_NEXT_PAINT: { key: "INP", unit: "ms", good: 200, poor: 500 },
  LARGEST_CONTENTFUL_PAINT_MS: { key: "LCP", unit: "ms", good: 2500, poor: 4000 },
  CUMULATIVE_LAYOUT_SHIFT_SCORE: { key: "CLS", unit: "", good: 0.1, poor: 0.25 },
  FIRST_CONTENTFUL_PAINT_MS: { key: "FCP", unit: "ms", good: 1800, poor: 3000 },
  EXPERIENCE: { key: "GENEL" },
};

async function main() {
  const qs = new URLSearchParams({ url, strategy, category: "performance" });
  if (KEY) qs.set("key", KEY);
  const res = await fetch("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + qs);
  const j = await res.json().catch(() => null);
  if (!res.ok || !j) {
    console.error(
      `✗ PSI hatası ${res.status}: ${(j && j.error && j.error.message) || "yanıt yok"}`,
    );
    console.error(
      "İpucu: PSI_API_KEY ortam değişkenini ayarlayın (Google Cloud → PageSpeed Insights API).",
    );
    process.exit(1);
  }

  console.log(`▸ PageSpeed · ${url} (${strategy})`);
  console.log("  ── ALAN (gerçek kullanıcı/CrUX) ──");
  const fe = (j.loadingExperience && j.loadingExperience.metrics) || {};
  let fieldPoor = false;
  if (Object.keys(fe).length) {
    console.log(`  Genel kategori: ${(j.loadingExperience.overall_category || "?").padEnd(18)}`);
    for (const [name, cfg] of Object.entries(FIELD)) {
      const m = fe[name];
      if (!m) continue;
      const p99 = m.percentile;
      const cat =
        name === "EXPERIENCE"
          ? String(m.category || "")
          : p99 <= cfg.good
            ? "GOOD"
            : p99 <= cfg.poor
              ? "NEEDS_IMPROVEMENT"
              : "POOR";
      if (cat === "POOR" && name !== "EXPERIENCE") fieldPoor = true;
      console.log(`  ${cfg.key.padEnd(6)} ${String(p99).padStart(10)}${cfg.unit}  ${cat}`);
    }
  } else {
    console.log("  (alan verisi henüz yok — yeterli gerçek kullanıcı trafiği gerekir)");
  }

  console.log("  ── LAB (Lighthouse) ──");
  const lh = j.lighthouseResult || {};
  const score =
    lh.categories && lh.categories.performance && Math.round(lh.categories.performance.score * 100);
  console.log(`  Performans: ${score == null ? "—" : score + "/100"}`);
  const audits = lh.audits || {};
  for (const a of [
    "first-contentful-paint",
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "speed-index",
    "total-blocking-time",
    "interactive",
  ]) {
    const x = audits[a];
    if (x && x.displayValue)
      console.log(
        `  ${a
          .split("-")
          .map((w) => w.toUpperCase())
          .join(" ")
          .padEnd(26)} ${x.displayValue}`,
      );
  }

  if (fieldPoor) {
    console.error("\n✗ Alan metriği POOR — performans iyileştirmesi gerekli.");
    process.exit(1);
  }
  console.log("\n✓ Alan metrikleri iyi/kabul edilebilir.");
}

main().catch((e) => {
  console.error(String((e && e.stack) || e));
  process.exit(1);
});
