// ═══════════════════════════════════════════════════════════
// Quantro · /api/stats — topluluk & güvenilirlik göstergeleri
// GitHub yıldız/fork, npm indirme, blog yazısı sayısı.
// Dış API'ler 10 dk önbelleklenir (Vercel sunucusuz yeniden ısınmayı azaltır).
// ═══════════════════════════════════════════════════════════
const GITHUB = 'Lennebraha38/quantro';
const NPM = 'quantro-js';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
let cache = { at: 0, data: null };

async function fetchJson(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function collect() {
  const out = {
    github: null,
    npm: null,
    blogPosts: 0,
    anu: 'ok',
    collectedAt: new Date().toISOString()
  };
  try {
    const g = await fetchJson(`https://api.github.com/repos/${GITHUB}`, {
      headers: { 'User-Agent': 'quantro-health', ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}) },
      signal: AbortSignal.timeout(5000)
    });
    out.github = { stars: g.stargazers_count || 0, forks: g.forks_count || 0, openIssues: g.open_issues_count || 0 };
  } catch (e) { out.github = null; }
  try {
    const n = await fetchJson(`https://api.npmjs.org/downloads/point/last-month/${NPM}`, {
      signal: AbortSignal.timeout(5000)
    });
    out.npm = { downloadsLastMonth: n.downloads || 0 };
  } catch (e) { out.npm = null; }
  try {
    const fs = require('node:fs');
    const path = require('node:path');
    const dir = path.join(__dirname, '..', 'blog-articles');
    if (fs.existsSync(dir)) {
      out.blogPosts = fs.readdirSync(dir).filter((f) => f.endsWith('.tr.md')).length;
    }
  } catch (e) { out.blogPosts = 0; }
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  const now = Date.now();
  if (!cache.data || now - cache.at > 10 * 60 * 1000) {
    cache.data = await collect();
    cache.at = now;
  }
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(cache.data);
};