const { supabaseFetch, requireAuth, readJson } = require("./_lib");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === "GET") {
      const r = await supabaseFetch("/rest/v1/contact_messages?order=created_at.desc");
      if (!r.ok) return res.status(502).json({ error: "supabase", status: r.status });
      return res.json(await r.json());
    }

    if (req.method === "PATCH") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id-required" });
      const b = readJson(req) || {};
      const allowed = {};
      ["is_read", "archived"].forEach((k) => {
        if (k in b) allowed[k] = b[k];
      });
      if (!Object.keys(allowed).length) return res.status(400).json({ error: "no-fields" });
      const r = await supabaseFetch(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(allowed),
      });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id-required" });
      const r = await supabaseFetch(`/rest/v1/contact_messages?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }

    res.status(405).json({ error: "method" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
