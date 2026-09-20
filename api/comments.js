const { supabaseFetch, requireAuth, rateLimiter, clientIp, readJson } = require("./_lib");

const limiter = rateLimiter(6, 15 * 60 * 1000);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // ── PUBLİK: onaylı yorumları listele (slug ile) ──
  if (req.method === "GET" && !req.headers.authorization) {
    const slug = String(req.query.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug-required" });
    const r = await supabaseFetch(
      `/rest/v1/blog_comments?post_slug=eq.${encodeURIComponent(slug)}&is_approved=eq.true&order=created_at.asc`,
    );
    if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status });
    return res.json(await r.json());
  }

  // ── PUBLİK: yorum ekle (honeypot + rate limit + doğrulama) ──
  if (req.method === "POST") {
    if (!limiter(clientIp(req))) {
      return res
        .status(429)
        .json({ error: "rate", message: "Cok fazla yorum. Lutfen 15 dk sonra tekrar deneyin." });
    }
    const b = readJson(req);
    if (!b) return res.status(400).json({ error: "bad-request" });

    // Honeypot: doldurulduysa bot, sessizce başarılı say
    if (b.website && String(b.website).length > 0) return res.json({ ok: true });

    const post_slug = String(b.post_slug || "")
      .trim()
      .slice(0, 120);
    const name = String(b.name || "")
      .trim()
      .slice(0, 80);
    const email = String(b.email || "")
      .trim()
      .slice(0, 254);
    const content = String(b.content || "")
      .trim()
      .slice(0, 1200);
    let parent_id = String(b.parent_id || "").trim() || null;
    if (
      parent_id &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parent_id)
    )
      parent_id = null;

    if (!post_slug || !name || content.length < 3 || content.length > 1200) {
      return res.status(400).json({ error: "validation" });
    }

    // Tüm yorumlar (yanıtlar dahil) önce admin onayından geçer — spam vektörü kapalı.
    const is_approved = false;

    const r = await supabaseFetch("/rest/v1/blog_comments", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        post_slug,
        name,
        email: email || null,
        content,
        parent_id,
        is_approved,
      }),
    });
    return res.status(r.ok ? 201 : 502).json({ ok: r.ok });
  }

  // ── ADMIN: aşağısı yetki ister ──
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const r = await supabaseFetch("/rest/v1/blog_comments?order=created_at.desc&limit=300");
    if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status });
    return res.json(await r.json());
  }

  if (req.method === "PATCH") {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "id-required" });
    const b = readJson(req) || {};
    const allowed = {};
    if ("is_approved" in b) allowed.is_approved = !!b.is_approved;
    if (!Object.keys(allowed).length) return res.status(400).json({ error: "no-fields" });
    const r = await supabaseFetch(`/rest/v1/blog_comments?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(allowed),
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  }

  if (req.method === "DELETE") {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "id-required" });
    const r = await supabaseFetch(`/rest/v1/blog_comments?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  }

  res.status(405).json({ error: "method" });
};
