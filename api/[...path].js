/* ═════════════════════════════════════════════════════════
   Quantro · API catch-all yönlendirici
   Amaç: Hobby planın 12 serverless fonksiyon sınırını aşmamak.
   Yalnızca meta/yardımcı uçları (health, stats, newsletter) buradan
   çalışır; asıl handler'lar apifns/ altındadır. Diğer api/*.js fonksiyonları
   bağımsız kalır (ünite testleri onları doğrudan import eder).
   ═════════════════════════════════════════════════════════ */
const health = require('../apifns/health.js');
const stats = require('../apifns/stats.js');
const newsletter = require('../apifns/newsletter.js');

const ROUTES = { health, stats, newsletter };

module.exports = async function handler(req, res) {
  const seg = (req.url.split('?')[0].split('/')[2] || '').replace(/\.json$/, '').toLowerCase();
  const fn = ROUTES[seg];
  if (!fn) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'not found' }));
  }
  try {
    return await fn(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'internal' }));
  }
};