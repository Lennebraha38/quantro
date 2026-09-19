// ═════════════════════════════════════════════════════════
// QUANTRO · İSTEMCİ HATA RAPORLAMA (bağımlılıksız)
//   Tarayıcıdaki global error/unhandledrejection olaylarını toplar
//   ve istersen Supabase `errors` tablosuna yazar. Her şey fail-safe:
//   env yoksa veya tablo yoksa sessizce 200 döner — siteyi etkilemez.
//   Tablo şeması: supabase-errors.sql
// ═════════════════════════════════════════════════════════
const { supabaseFetch, clientIp } = require('./_lib');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  try {
    const b = (typeof req.body === 'string') ? JSON.parse(req.body) : (req.body || {});
    const row = {
      message: String(b.message || '').slice(0, 2000),
      stack: String(b.stack || '').slice(0, 8000),
      page: String(b.page || '').slice(0, 300),
      lang: String(b.lang || '').slice(0, 8),
      ua: String(req.headers['user-agent'] || '').slice(0, 300),
      ip: clientIp(req)
    };
    if (!row.message) return res.status(400).json({ error: 'bad-request' });
    try {
      await supabaseFetch('/rest/v1/errors', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(row)
      });
    } catch (e) { /* arka plan: yok sayılır */ }
    return res.json({ ok: true });
  } catch (e) {
    return res.json({ ok: true });
  }
};