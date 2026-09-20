// ═══════════════════════════════════════════════════════════
// Quantro · /api/health — hizmet sağlık raporu (uptime robotu/kullanıcı)
// Supabase çevrimdışıyken 200 + degraded:true döner (site ayaktadır).
// ═══════════════════════════════════════════════════════════
const { supabaseAvailable } = require('../api/_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });

  const started = Date.now();
  const services = {
    site: 'ok',
    supabase: 'unknown'
  };

  services.supabase = (await supabaseAvailable()) ? 'ok' : 'degraded';
  services.anu = 'ok'; // ANU'ya bağlı değilse isteği sınamıyoruz (dış kaynak); proxy live ise ok

  const degraded = services.supabase !== 'ok';
  const body = {
    status: degraded ? 'degraded' : 'ok',
    uptime: process.uptime(),
    services,
    timeMs: Date.now() - started,
    now: new Date().toISOString()
  };
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(body);
};