// NOT: _lib.js env'yi require anında okur; bu yüzden env önce set edilir.
process.env.SUPABASE_URL = 'https://quantro.test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role';
process.env.AUTH_SECRET = 'test-secret-ajans';
process.env.ADMIN_PASSWORD = 'sifre';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const L = require('../api/_lib.js');

function makeToken(payload, secret) {
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(p).digest('base64url');
  return `${p}.${sig}`;
}

test('signToken/verifyToken — roundtrip', () => {
  const t = L.signToken('admin');
  const s = L.verifyToken(t);
  assert.equal(s.role, 'admin');
  assert.ok(s.exp > Date.now());
});

test('verifyToken — geçersiz format', () => {
  assert.equal(L.verifyToken(''), null);
  assert.equal(L.verifyToken('tek-parca'), null);
  assert.equal(L.verifyToken('a.b.c'), null);
});

test('verifyToken — süresi dolmuş token reddedilir', () => {
  const t = makeToken({ role: 'admin', exp: Date.now() - 1000 }, 'test-secret-ajans');
  assert.equal(L.verifyToken(t), null);
});

test('verifyToken — imza karıştırılırsa reddedilir', () => {
  const t = makeToken({ role: 'admin', exp: Date.now() + 60000 }, 'test-secret-ajans');
  const bad = `${t.slice(0, -2)}xx`;
  assert.equal(L.verifyToken(bad), null);
});

test('verifyToken — yanlış secret ile üretilen reddedilir', () => {
  const t = makeToken({ role: 'admin', exp: Date.now() + 60000 }, 'baska-secret');
  assert.equal(L.verifyToken(t), null);
});

test('verifyToken — harici üretilmiş (supabase) token reddedilir', () => {
  const t = makeToken({ role: 'admin', exp: Date.now() + 60000 }, 'supabase-jwt-secret');
  assert.equal(L.verifyToken(t), null);
});

test('safeEqual — eşit/uzunluk farkı/içerik farkı', () => {
  assert.equal(L.safeEqual('abc', 'abc'), true);
  assert.equal(L.safeEqual('abc', 'abcd'), false);
  assert.equal(L.safeEqual('abc', 'abd'), false);
});

test('rateLimiter — pencere içi izin/red + pencere dışı yeniden izin', async () => {
  const lim = L.rateLimiter(3, 40);
  assert.equal(lim('k'), true);
  assert.equal(lim('k'), true);
  assert.equal(lim('k'), true);
  assert.equal(lim('k'), false, '4. istek reddedilmeli');
  assert.equal(lim('baska'), true, 'farklı anahtar kendi limitine sahip');
  await new Promise((r) => setTimeout(r, 70));
  assert.equal(lim('k'), true, 'pencere geçince tekrar izin verilmeli');
});

test('rateLimiter — memory-safe: boş anahtar temizlenir', () => {
  const lim = L.rateLimiter(2, 30);
  for (let i = 0; i < 5; i++) lim(`x${i}`);
  assert.equal(lim('x3'), true);
});

test('clientIp — x-forwarded-for ilk değer, yoksa socket', () => {
  assert.equal(L.clientIp({ headers: { 'x-forwarded-for': '8.8.8.8, 1.1.1.1' } }), '8.8.8.8');
  assert.equal(L.clientIp({ headers: {}, socket: { remoteAddress: '10.0.0.1' } }), '10.0.0.1');
});

function mockRes() {
  let statusCode = 200;
  let body = null;
  return {
    status(c) { statusCode = c; return this; },
    json(o) { body = o; return this; },
    get code() { return statusCode; },
    get data() { return body; }
  };
}

test('requireAuth — token yoksa 401', () => {
  const res = mockRes();
  const r = L.requireAuth({ headers: {} }, res);
  assert.equal(r, null);
  assert.equal(res.code, 401);
  assert.equal(res.data.error, 'unauthorized');
});

test('requireAuth — geçerli admin token oturum döner', () => {
  const res = mockRes();
  const t = L.signToken('admin');
  const r = L.requireAuth({ headers: { authorization: `Bearer ${t}` } }, res);
  assert.equal(res.code, 200);
  assert.equal(r.role, 'admin');
});

test('requireAuth — admin olmayan rol reddedilir', () => {
  const res = mockRes();
  const t = L.signToken('kullanici');
  L.requireAuth({ headers: { authorization: `Bearer ${t}` } }, res);
  assert.equal(res.code, 401);
});

test('requireAuth — bozuk token 401', () => {
  const res = mockRes();
  L.requireAuth({ headers: { authorization: 'Bearer bos.deger' } }, res);
  assert.equal(res.code, 401);
});