const crypto = require('crypto');

const SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const AUTH_SECRET = process.env.AUTH_SECRET || '';

const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 saat

function supabaseFetch(path, opts = {}) {
  return fetch(`${SB}${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
}

function signToken(role) {
  const payload = Buffer.from(JSON.stringify({ role, exp: Date.now() + SESSION_TTL })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(parts[0]).digest('base64url');
    if (!safeEqual(parts[1], expected)) return null;
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return function (key) {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= limit) {
      hits.set(key, arr);
      return false;
    }
    arr.push(now);
    hits.set(key, arr);
    return true;
  };
}

function requireAuth(req, res) {
  if (!AUTH_SECRET) {
    res.status(503).json({ error: 'AUTH_SECRET env tanimli degil' });
    return null;
  }
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const sess = verifyToken(token);
  if (!sess || sess.role !== 'admin') {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return sess;
}

function clientIp(req) {
  const f = req.headers['x-forwarded-for'];
  if (f) return String(f).split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || 'unknown';
}

function readJson(req) {
  try {
    return JSON.parse(req.body || '{}');
  } catch (e) {
    return null;
  }
}

module.exports = {
  SB, SERVICE, ADMIN_PASSWORD, AUTH_SECRET, SESSION_TTL,
  supabaseFetch, signToken, verifyToken, safeEqual, rateLimiter,
  requireAuth, clientIp, readJson
};
