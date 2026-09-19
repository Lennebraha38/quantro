/* ═════════════════════════════════════════════════════════
   QUANTRO · BLOG İÇERİK IMPORT (Node ≥ 18)
   ── blog-articles/<slug>.<lang>.md → Supabase'e yükler:
      • TR kaynak  → blog_posts (ana tablo, mevcut şema)
      • Tüm diller → blog_posts_i18n (supabase-blog-i18n.sql)
   Gereksinimler: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
   Örnek: node tools/import-blog.mjs
   ═════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'blog-articles');
const SB = process.env.SUPABASE_URL || '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SB || !SERVICE) {
  console.error('✗ SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekli.');
  process.exit(1);
}

function parse(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/);
  const title = (lines[0].trim().match(/^#\s+(.+)$/) || [])[1] || '';
  const meta = {};
  const bodyStart = lines.findIndex((l) => /^\s*##\s/.test(l));
  const body = lines.slice(bodyStart > 0 ? bodyStart : 1).join('\n').trim();
  for (const l of lines.slice(1, bodyStart > 0 ? bodyStart : lines.length)) {
    const m = l.match(/^\*\*([^*]+):\*\*\s*(.*)$/);
    if (m) {
      const key = m[1].trim().toLowerCase();
      const val = m[2].trim();
      if (key === 'emoji') meta.cover_emoji = val;
      else if (key === 'etiketler' || key === 'tags') meta.tags = val;
      else if (key === 'özet' || key === 'summary') meta.summary = val;
    }
  }
  return {
    title,
    cover_emoji: meta.cover_emoji || '',
    tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    summary: meta.summary || '',
    content: body
  };
}

async function supFetch(p, opts = {}) {
  const res = await fetch(SB + p, {
    ...opts,
    headers: {
      apikey: SERVICE,
      Authorization: 'Bearer ' + SERVICE,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${p}: ${await res.text()}`);
  return res.json();
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
const groups = {};
for (const f of files) {
  const m = f.match(/^(.+?)\.(tr|en|fr|es|it|ru|ko|ar)\.md$/);
  if (!m) continue;
  const slug = m[1];
  const lang = m[2];
  (groups[slug] = groups[slug] || {})[lang] = parse(path.join(dir, f));
}

let posts = 0, i18nRows = 0;
for (const [slug, langs] of Object.entries(groups)) {
  const tr = langs.tr || langs[Object.keys(langs)[0]];
  if (!tr) continue;
  const row = {
    slug,
    title: tr.title,
    summary: tr.summary,
    content: tr.content,
    cover_emoji: tr.cover_emoji,
    tags: tr.tags
  };
  try {
    await supFetch('/rest/v1/blog_posts?slug=eq.' + slug, {});
  } catch (e) {}
  const upsert = { upsert: 'on_conflict=slug' };
  try {
    await supFetch('/rest/v1/blog_posts', {
      method: 'POST',
      headers: { Prefer: 'return=minimal,' + upsert.upsert },
      body: JSON.stringify({ ...row, published: true })
    });
    posts++;
  } catch (e) { console.error(`blog_posts ${slug}: ${e.message}`); }
  for (const [lang, p] of Object.entries(langs)) {
    try {
      await supFetch('/rest/v1/blog_posts_i18n', {
        method: 'POST',
        headers: { Prefer: 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify({ slug, lang, title: p.title, summary: p.summary, content: p.content })
      });
      i18nRows++;
    } catch (e) { console.error(`blog_posts_i18n ${slug} ${lang}: ${e.message}`); }
  }
}

console.log(`▸ Import tamam: ${posts} ana kayıt (blog_posts) · ${i18nRows} çeviri satırı (blog_posts_i18n)`);