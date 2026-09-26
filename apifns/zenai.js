// ═══════════════════════════════════════════════════════════
// Quantro · /api/zenai — ZENAI sohbet proxy'si
// ── Ne yapar?
//   Sitenin sağ altındaki müşteri hizmeti penceresinden gelen
//   mesajı ZENAI'ye (/api/chat) iletir ve cevabı JSON olarak döner.
//   Böylece tarayıcı ZENAI'ye doğrudan bağlanmaz; CORS allowlist
//   sorunu, anahtar sızıntısı ve kötüye kullanım burada engellenir.
// Güvenlik:
//   · gövde 16 KB ile sınırlı, tek tur (geçmişi sunucu tutmaz — KVKK)
//   · IP başına kova tabanlı hız sınırı
//   · istemciden gelen model/sistem talimatı yok sayılır
// ═══════════════════════════════════════════════════════════
const ZENAI = process.env.ZENAI_URL || "https://zenai-two.vercel.app";
const MODEL = process.env.ZENAI_MODEL || "zenai";
const MAX_BYTES = 16 * 1024;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

const buckets = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const hits = (buckets.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) {
    buckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  buckets.set(ip, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (!v.some((t) => now - t < WINDOW_MS)) buckets.delete(k);
    }
  }
  return false;
}

function json(res, code, body) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BYTES) return null;
    chunks.push(c);
  }
  return Buffer.concat(chunks).toString("utf8");
}

module.exports = async function zenai(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Yalnızca POST" });
  }
  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "bilinmiyor";
  if (rateLimited(ip)) {
    return json(res, 429, { error: "Çok hızlı gidiyorsun — bir dakika bekle." });
  }

  const raw = await readBody(req);
  if (raw === null) return json(res, 413, { error: "Mesaj çok büyük (en fazla 16 KB)." });

  let soru;
  try {
    const b = JSON.parse(raw || "{}");
    soru = String(b.soru || b.message || "")
      .trim()
      .slice(0, 2000);
  } catch {
    return json(res, 400, { error: "Geçersiz JSON." });
  }
  if (!soru) return json(res, 400, { error: "Boş mesaj." });

  try {
    // Origin başlığı gönderilmiyor: ZENAI'nin CORS allowlist'i
    // tarayıcı kökenlerine açık, sunucudan çağrıya izin veriyor.
    const r = await fetch(`${ZENAI}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: soru,
          },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });
    const data = await r.json().catch(() => null);
    const cevap = data && typeof data.content === "string" ? data.content : "";
    if (!cevap) {
      return json(res, 502, { error: "ZENAI şu anda yanıt veremedi." });
    }
    return json(res, 200, { cevap, at: new Date().toISOString() });
  } catch (e) {
    return json(res, 504, { error: "ZENAI'ye ulaşılamadı (zaman aşımı)." });
  }
};
