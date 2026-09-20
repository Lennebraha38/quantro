const { supabaseFetch, rateLimiter, clientIp, readJson } = require("./_lib");

const limiter = rateLimiter(20, 60 * 60 * 1000);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "POST") {
    if (!limiter(clientIp(req))) {
      return res
        .status(429)
        .json({ error: "rate", message: "Cok fazla istek. Lutfen sonra tekrar deneyin." });
    }
    const b = readJson(req);
    if (!b) return res.status(400).json({ error: "bad-request" });
    const id = String(b.comment_id || "").trim();
    if (!UUID_RE.test(id)) return res.status(400).json({ error: "id-required" });

    const action = String(b.action || "like") === "unlike" ? "unlike" : "like";
    const ck = "qcl_" + id.replace(/[^a-z0-9_\-]/gi, "_");
    const cookie = String(req.headers.cookie || "");
    const already = new RegExp("(^|;)\\s*" + ck.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=").test(
      cookie,
    );

    let likes = 0;
    if (action === "unlike") {
      // Beğenmemiş biri unlike yapamaz — beğenme çerezi zorunlu.
      if (already) {
        const r = await supabaseFetch("/rest/v1/rpc/decrement_comment_like", {
          method: "POST",
          body: JSON.stringify({ p_id: id }),
        });
        if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status });
        res.setHeader("Set-Cookie", `${ck}=; Path=/; Max-Age=0; SameSite=Lax`);
      }
    } else {
      if (!already) {
        const r = await supabaseFetch("/rest/v1/rpc/increment_comment_like", {
          method: "POST",
          body: JSON.stringify({ p_id: id }),
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
        `/rest/v1/blog_comments?id=eq.${encodeURIComponent(id)}&select=likes`,
      );
      try {
        const arr = await rr.json();
        likes = (arr && arr[0] && arr[0].likes) || 0;
      } catch (e) {
        likes = 0;
      }
    }
    return res.json({ id, likes, liked: action !== "unlike" });
  }

  res.status(405).json({ error: "method" });
};
