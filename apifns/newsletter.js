// ═══════════════════════════════════════════════════════════
// Quantro · /api/newsletter — bülten aboneliği (KVKK 6698)
// Backend (Supabase `newsletters` tablosu) çevrimdışıysa kayıt bellekte
// tutulur ve `persisted:false` işaretlenir; backend kurulunca tabloya
// geçer. SQL şema: sql/supabase-newsletter.sql
// ═══════════════════════════════════════════════════════════
const {
  supabaseAvailable,
  supabaseFetch,
  clientIp,
  rateLimiter,
  readJson,
} = require("../api/_lib");

const perIp = rateLimiter(5, 15 * 60 * 1000);
const pending = new Map();

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const ip = clientIp(req);
  if (!perIp(ip)) return res.status(429).json({ ok: false, error: "rate" });

  const body = readJson(req) || {};
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const lang = String(body.lang || "tr").slice(0, 5);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return res.status(400).json({ ok: false, error: "invalid-email" });
  }

  let persisted = false;
  const up = await supabaseAvailable().catch(() => false);
  if (up) {
    try {
      const r = await supabaseFetch("/rest/v1/newsletters", {
        method: "POST",
        body: JSON.stringify({ email, lang, source: "site" }),
      });
      persisted = r.ok;
    } catch (e) {
      persisted = false;
    }
  }

  if (!persisted) {
    pending.set(email.toLowerCase(), { lang, at: Date.now() });
    if (pending.size > 5000) pending.clear(); // bellek sınırı (geçici önbellek)
  }

  res.status(200).json({ ok: true, persisted });
};
