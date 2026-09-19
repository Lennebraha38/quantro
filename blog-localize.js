/* ═══════════════════════════════════════════════════════════
   Quantro Blog · içerik yerelleştirme yardımcıları (UMD)
   Hem tarayıcıda hem Node test ortamında çalışır.
   - LANGS/LOCALES : blog dil haritası
   - pickLang       : kayıtlı dili güvenli okur
   - localizePost   : yayının çeviri satırını tabana birleştirir
   - formatDate     : tarihi dile göre biçimlendirir
   - readTime       : okuma süresini dile göre çevirir
   ═══════════════════════════════════════════════════════════ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.blogLocalize = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LANGS = ['tr', 'en', 'fr', 'es', 'it', 'ru', 'ko', 'ar'];
  var LOCALES = { tr: 'tr-TR', en: 'en-US', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', ru: 'ru-RU', ko: 'ko-KR', ar: 'ar-SA' };

  function pickLang(saved) {
    return (LANGS.indexOf(saved) > -1) ? saved : 'tr';
  }

  function localizePost(post, map, lang) {
    if (!post) return post;
    var row = map && map[post.slug] && map[post.slug][lang];
    return {
      title: (row && row.title) || post.title,
      summary: (row && row.summary) || post.summary,
      content: (row && row.content) || post.content,
      slug: post.slug,
      tags: post.tags,
      cover_emoji: post.cover_emoji,
      created_at: post.created_at,
      published: post.published,
      likes: post.likes
    };
  }

  function buildIndex(rows) {
    var map = {};
    (rows || []).forEach(function (r) {
      if (!r || !r.slug) return;
      (map[r.slug] = map[r.slug] || {})[r.lang || 'tr'] = r;
    });
    return map;
  }

  function formatDate(iso, lang) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso || '');
      return d.toLocaleDateString(LOCALES[lang] || 'tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) { return String(iso || ''); }
  }

  function readTime(content, lang) {
    var words = (content || '').trim().split(/\s+/).filter(Boolean).length;
    var min = Math.max(1, Math.ceil(words / 200));
    return (lang === 'tr') ? (min + ' dk okuma') : (min + ' min read');
  }

  return { LANGS: LANGS, LOCALES: LOCALES, pickLang: pickLang, localizePost: localizePost, buildIndex: buildIndex, formatDate: formatDate, readTime: readTime };
});