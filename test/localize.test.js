const test = require('node:test');
const assert = require('node:assert');
const { pickLang, localizePost, buildIndex, formatDate, readTime } = require('../blog-localize.js');

test('pickLang geçersizse tr varsayılır', () => {
  assert.equal(pickLang('tr'), 'tr');
  assert.equal(pickLang('en'), 'en');
  assert.equal(pickLang('fr'), 'fr');
  assert.equal(pickLang(null), 'tr');
  assert.equal(pickLang('xx'), 'tr');
});

test('localizePost çeviri varsa onu, yoksa tabanı kullanır', () => {
  const post = { slug: 'kuantum-dolaniklik', title: 'TR Başlık', summary: 'TR özet', content: 'TR içerik', cover_emoji: '🔗', tags: ['quantum'] };
  const map = buildIndex([
    { slug: 'kuantum-dolaniklik', lang: 'en', title: 'EN Title', summary: 'EN summary', content: 'EN content' }
  ]);
  const en = localizePost(post, map, 'en');
  assert.equal(en.title, 'EN Title');
  assert.equal(en.summary, 'EN summary');
  assert.equal(en.content, 'EN content');
  assert.equal(en.cover_emoji, '🔗', 'meta alanları korunmalı');
  assert.equal(en.tags[0], 'quantum');
  const tr = localizePost(post, map, 'tr');
  assert.equal(tr.title, 'TR Başlık', 'çeviri yoksa taban kalır');
});

test('localizePost çevirisi eksikse fallback taban', () => {
  const post = { slug: 'x', title: 'T' };
  const map = buildIndex([{ slug: 'y', lang: 'en', title: 'Nope' }]);
  assert.equal(localizePost(post, map, 'en').title, 'T');
  assert.equal(localizePost(null, map, 'en'), null);
});

test('formatDate dile göre biçimlendirir', () => {
  const iso = '2026-01-05T00:00:00.000Z';
  const tr = formatDate(iso, 'tr');
  assert.match(tr, /5/);
  assert.match(tr, /2026/);
  assert.ok(tr.indexOf('Ocak') > -1, 'tr-TR ay adı');
  const en = formatDate(iso, 'en');
  assert.ok(en.indexOf('January') > -1, 'en-US ay adı');
  assert.equal(formatDate('bozuk', 'tr'), 'bozuk');
});

test('readTime dile göre çevrilir ve pozitiftir', () => {
  const content = Array.from({ length: 410 }, (_, i) => 'kelime' + i).join(' ');
  assert.equal(readTime(content, 'tr'), '3 dk okuma');
  assert.equal(readTime(content, 'en'), '3 min read');
  assert.equal(readTime('kısa', 'tr'), '1 dk okuma', 'en az 1 dk');
});