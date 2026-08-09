const { supabaseFetch, requireAuth, readJson } = require('./_lib');

const POST_FIELDS = ['title', 'slug', 'summary', 'content', 'cover_emoji', 'tags', 'published'];

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const r = await supabaseFetch('/rest/v1/blog_posts?order=created_at.desc');
      if (!r.ok) return res.status(502).json({ error: 'supabase', status: r.status });
      return res.json(await r.json());
    }

    if (req.method === 'POST') {
      const b = readJson(req);
      if (!b || !b.title || !b.content) return res.status(400).json({ error: 'title-content-required' });
      const body = {};
      POST_FIELDS.forEach((k) => { if (k in b) body[k] = b[k]; });
      body.published = !!body.published;
      const r = await supabaseFetch('/rest/v1/blog_posts', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      return res.status(r.ok ? 201 : 502).json(r.ok ? data : { error: 'supabase', status: r.status, detail: data });
    }

    if (req.method === 'PATCH') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id-required' });
      const b = readJson(req) || {};
      const allowed = {};
      POST_FIELDS.forEach((k) => { if (k in b) allowed[k] = b[k]; });
      if (!Object.keys(allowed).length) return res.status(400).json({ error: 'no-fields' });
      const r = await supabaseFetch(`/rest/v1/blog_posts?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(allowed)
      });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id-required' });
      const r = await supabaseFetch(`/rest/v1/blog_posts?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }

    res.status(405).json({ error: 'method' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
