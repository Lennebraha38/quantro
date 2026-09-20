// ═══════════════════════════════════════════════════════════
// Quantro · sitemap.xml üreteci (statik + blog yazıları + 8 dil hreflang)
// Deterministik: lastmod, son git commit tarihidir (yoksa bugün).
//   node scripts/gen-sitemap.mjs
// ═══════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://quantro-1.vercel.app';
const LANGS = ['tr', 'en', 'fr', 'es', 'it', 'ru', 'ko', 'ar'];

let lastmod;
try {
  lastmod = String(execSync('git log -1 --format=%cs', { cwd: ROOT })).trim();
} catch (e) { lastmod = new Date().toISOString().slice(0, 10); }
if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) lastmod = new Date().toISOString().slice(0, 10);

const PAGES = [
  { file: 'index.html', prio: '1.0', freq: 'weekly' },
  { file: 'hakkimizda.html', prio: '0.7', freq: 'monthly' },
  { file: 'arastirma.html', prio: '0.7', freq: 'monthly' },
  { file: 'simulasyon.html', prio: '0.7', freq: 'monthly' },
  { file: 'blog.html', prio: '0.9', freq: 'weekly' },
  { file: 'quantro-lab.html', prio: '0.8', freq: 'monthly' }
];

function langLinks(locPath) {
  const base = BASE + locPath;
  const q = locPath.includes('?') ? '&' : (locPath.endsWith('/') ? '?' : '?');
  const u = (l) => (l === 'tr' ? base : `${base}${q}lang=${l}`);
  return LANGS.map((l) =>
    `    <xhtml:link rel="alternate" hreflang="${l}" href="${u(l)}"/>`
  ).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${base}"/>`;
}

const urls = [];

for (const p of PAGES) {
  const locPath = p.file === 'index.html' ? '/' : '/' + p.file;
  urls.push(`  <url>\n    <loc>${BASE}${locPath}</loc>\n${langLinks(locPath)}\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.prio}</priority>\n  </url>`);
}

// Blog yazıları (statik; hreflang uzantısı hash adreslerde anlamsız olduğundan tek giriş)
const BLOG_DIR = path.join(ROOT, 'blog-articles');
if (fs.existsSync(BLOG_DIR)) {
  const slugs = [];
  for (const f of fs.readdirSync(BLOG_DIR).sort()) {
    const m = f.match(/^([a-z0-9-]+)\.tr\.md$/);
    if (m && !slugs.includes(m[1])) slugs.push(m[1]);
  }
  for (const slug of slugs) {
    urls.push(`  <url>\n    <loc>${BASE}/blog.html#${slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml yazıldı (${PAGES.length + (urls.length - PAGES.length)} url, lastmod=${lastmod})`);