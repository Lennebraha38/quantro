const ANU = 'https://qrng.anu.edu.au/API/jsonI.php';

const WINDOW = 45000;
let block = null;
let blockAt = 0;
let off = 0;

module.exports = async function handler(req, res) {
  const len = Math.min(1024, Math.max(1, parseInt(req.query.length, 10) || 8));
  const now = Date.now();
  try {
    if (!block || now - blockAt > WINDOW) {
      const r = await fetch(ANU + '?length=1024&type=uint8');
      if (!r.ok) throw new Error('ANU HTTP ' + r.status);
      const j = await r.json();
      if (!j.success || !Array.isArray(j.data) || j.data.length < 1024) throw new Error('ANU gecersiz yanit');
      block = j.data.slice();
      blockAt = now;
      off = 0;
    }
    if (off + len > 1024) off = 0;
    const data = block.slice(off, off + len);
    off = (off + len) % 1024;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.json({ type: 'uint8', length: len, data: data, success: true, source: 'quantro-proxy' });
  } catch (e) {
    res.status(502).json({ success: false, error: String((e && e.message) || e) });
  }
};
