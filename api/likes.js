const { supabaseFetch, rateLimiter, clientIp, readJson } = require("./_lib");

const limiter = rateLimiter(12, 60 * 60 * 1000);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const slug = String(req.query.slug || "").trim();
    if (!slug) return res.status(400).json({ error: "slug-required" });
    const r = await supabaseFetch(
      `/rest/v1/post_likes?post_slug=eq.${encodeURIComponent(slug)}&select=likes`,
    );
    if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status });
    const arr = await r.json();
    return res.json({ slug, likes: (arr && arr[0] && arr[0].likes) || 0 });
  }

  if (req.method === "POST") {
    if (!limiter(clientIp(req))) {
      return res
        .status(429)
        .json({ error: "rate", message: "Cok fazla istek. Lutfen sonra tekrar deneyin." });
    }
    const b = readJson(req);
    if (!b) return res.status(400).json({ error: "bad-request" });
    const slug = String(b.post_slug || "")
      .trim()
      .slice(0, 120);
    if (!slug) return res.status(400).json({ error: "slug-required" });

    const action = String(b.action || "like") === "unlike" ? "unlike" : "like";
    const ck = "qlk_" + slug.replace(/[^a-z0-9_\-]/gi, "_");
    const cookie = String(req.headers.cookie || "");
    const already = new RegExp("(^|;)\\s*" + ck.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=").test(
      cookie,
    );

    let likes = 0;
    if (action === "unlike") {
      // Beğenmemiş biri unlike yapamaz — beğenme çerezi zorunlu.
      if (already) {
        const r = await supabaseFetch("/rest/v1/rpc/decrement_post_like", {
          method: "POST",
          body: JSON.stringify({ p_slug: slug }),
        });
        if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status });
        res.setHeader("Set-Cookie", `${ck}=; Path=/; Max-Age=0; SameSite=Lax`);
      }
    } else {
      if (!already) {
        const r = await supabaseFetch("/rest/v1/rpc/increment_post_like", {
          method: "POST",
          body: JSON.stringify({ p_slug: slug }),
        });
        if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status });
        res.setHeader("Set-Cookie", `${ck}=1; Path=/; Max-Age=${365 * 24 * 3600}; SameSite=Lax`);
        try {
          const data = await r.json();
          likes = Array.isArray(data) ? data[0] || 0 : Number(data) || 0;
        } catch (e) {
          likes = 0;
        }
      }
    }
    if (likes <= 0) {
      const rr = await supabaseFetch(
        `/rest/v1/post_likes?post_slug=eq.${encodeURIComponent(slug)}&select=likes`,
      );
      try {
        const arr = await rr.json();
        likes = (arr && arr[0] && arr[0].likes) || 0;
      } catch (e) {
        likes = 0;
      }
    }
    return res.json({ slug, likes, liked: action !== "unlike" });
  }

  res.status(405).json({ error: "method" });
};
