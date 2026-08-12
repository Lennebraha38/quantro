const { supabaseFetch } = require('./_lib');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method' });
    return;
  }

  const base = 'https://quantro-1.vercel.app';

  try {
    const r = await supabaseFetch('/rest/v1/blog_posts?published=eq.true&order=created_at.desc&limit=20');
    const posts = r.ok ? await r.json() : [];
    const list = Array.isArray(posts) ? posts : [];

    const items = list.map((p) => {
      const link = `${base}/blog.html#${encodeURIComponent(p.slug || '')}`;
      const desc = esc((p.summary || p.content || '').slice(0, 280));
      return [
        '  <item>',
        `    <title>${esc(p.title)}</title>`,
        `    <link>${link}</link>`,
        `    <guid isPermaLink="true">${link}</guid>`,
        `    <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>`,
        `    <description>${desc}</description>`,
        '  </item>'
      ].join('\n');
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Quantro Araştırma Blogu</title>
    <link>${base}/blog.html</link>
    <description>Kuantum mekaniği, astrofizik ve araştırma notları.</description>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>tr</language>
${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
