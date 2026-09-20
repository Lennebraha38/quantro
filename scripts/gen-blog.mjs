// ═══════════════════════════════════════════════════════════
// Quantro · blog-articles/*.md → blog-static.js üreteci
// Blog içeriğinin tamamını statik olarak paketler: backend
// (Supabase) çevrimdışı olsa bile blog çalışır. Ayrıca yazar,
// yayın tarihi ve sitemap'e yazı URL'leri sağlar.
//   node scripts/gen-blog.mjs [--write-sitemap]
// ═══════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART_DIR = path.join(ROOT, 'blog-articles');
const OUT = path.join(ROOT, 'blog-static.js');
const LANGS = ['tr', 'en', 'fr', 'es', 'it', 'ru', 'ko', 'ar'];

const TITLES_DATE = {
  'gercek-rastgelelik': '2025-08-12',
  'kara-delikler': '2025-08-26',
  'kuantum-dolaniklik': '2025-09-09'
};

const AUTHOR = 'Quantro Araştırma Ekibi';
const AUTHOR_URL = 'https://github.com/quantro38';

function parseTokenize(md) {
  const lines = md.split('\n');
  const title = (lines[0] || '').replace(/^#\s+/, '').trim();
  const meta = {};
  const bodyStart = lines.findIndex((l, i) => i > 0 && l.match(/^##\s/));
  for (let i = 1; i < (bodyStart === -1 ? lines.length : bodyStart); i++) {
    const m = lines[i].match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (m) meta[m[1].toLowerCase()] = m[2].trim();
  }
  const body = (bodyStart === -1 ? '' : lines.slice(bodyStart).join('\n')).trim();
  return { title, meta, body };
}

const posts = [];   // slug → tr base row
const rows = [];    // slug+lang i18n rows (blog-localize.buildIndex formatı)
const slugs = [];

for (const file of fs.readdirSync(ART_DIR)) {
  const m = file.match(/^([a-z0-9-]+)\.(tr|en|fr|es|it|ru|ko|ar)\.md$/);
  if (!m) continue;
  const slug = m[1];
  const lang = m[2];
  const raw = fs.readFileSync(path.join(ART_DIR, file), 'utf8');
  const { title, meta, body } = parseTokenize(raw);
  if (lang === 'tr' && !posts.find((p) => p.slug === slug)) {
    posts.push({
      slug,
      title,
      summary: meta.ozet || meta['özet'] || '',
      content: body,
      tags: (meta.etiketler || '').split(',').map((s) => s.trim()).filter(Boolean),
      cover_emoji: meta.emoji || '⚛',
      created_at: TITLES_DATE[slug] || '2025-09-01',
      published: true,
      author: AUTHOR,
      author_url: AUTHOR_URL
    });
    slugs.push(slug);
  }
  rows.push({ slug, lang, title, summary: meta.ozet || meta['özet'] || '', content: body });
}

const DATA = { posts, rows };

const src = `/* ═══════════════════════════════════════════════════════
   QUANTRO · STATİK BLOG İÇERİĞİ (blog-articles/*.md'den üretildi)
   Not: Bu dosyayı elle düzenleme — scripts/gen-blog.mjs ile
   yeniden üretin:  npm run blog:static
   ═══════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.blogStatic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return ${JSON.stringify(DATA)};
});
`;
fs.writeFileSync(OUT, src);
console.log(`blog-static.js yazıldı: ${posts.length} yazı × ${LANGS.length} dil (${rows.length} satır)`);

export { posts, rows, slugs, LANGS };

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain && process.argv.includes('--write-sitemap')) {
  await import('./gen-sitemap.mjs');
}