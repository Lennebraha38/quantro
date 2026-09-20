// ═════════════════════════════════════════════════════════
// API YARDIMCI UÇLARI — health/stats/newsletter (degrade yolları)
//   Bu dosyada SUPABASE env'i KASITLI olarak tanımlanmaz:
//   her üç uç da backend yokken davranışını sergilemek zorundadır
//   (newsletter → bellek kuyruğu, health → degraded, stats → null yedekleri).
// ═════════════════════════════════════════════════════════
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const test = require('node:test');
const assert = require('node:assert/strict');
const health = require('../apifns/health.js');
const stats = require('../apifns/stats.js');
const newsletter = require('../apifns/newsletter.js');

function mockRes() {
  let code = 200, data = null, headers = {};
  return {
    setHeader(k, v) { headers[k] = v; return this; },
    status(c) { code = c; return this; },
    json(d) { data = d; return this; },
    get statusCode() { return code; },
    get body() { return data; },
    get headers() { return headers; }
  };
}

function makeReq(method = 'GET', { body, ip } = {}) {
  const headers = {};
  if (ip) headers['x-forwarded-for'] = ip;
  return { method, body, headers, socket: { remoteAddress: '10.0.0.1' } };
}

test('health — GET 200, site ok, supabase degraded (env yok)', async () => {
  const res = mockRes();
  await health(makeReq('GET'), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.body.status, 'degraded');
  assert.equal(res.body.services.site, 'ok');
  assert.equal(res.body.services.supabase, 'degraded');
  assert.equal(typeof res.body.uptime, 'number');
  assert.equal(typeof res.body.timeMs, 'number');
});
test('health — POST 405', async () => {
  const res = mockRes();
  await health(makeReq('POST'), res);
  assert.equal(res.statusCode, 405);
});

test('stats — GET 200 ve gerekli şekil', async () => {
  const res = mockRes();
  await stats(makeReq('GET'), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Cache-Control'], 'public, max-age=600');
  const b = res.body;
  assert.ok(b.collectedAt && !Number.isNaN(Date.parse(b.collectedAt)));
  assert.equal(b.anu, 'ok');
  // dış API yanıtı null olabilir (ağ kapalı) — her iki durumda şekil geçerli:
  if (b.github) {
    for (const k of ['stars', 'forks', 'openIssues']) assert.equal(typeof b.github[k], 'number');
  }
  if (b.npm) {
    assert.equal(typeof b.npm.downloadsLastMonth, 'number');
    assert.equal(typeof b.npm.version, 'string');
    assert.ok(b.npm.version.length > 0, 'npm sürümü asla boş değil (registry yedeği)');
  }
  assert.ok(b.blogPosts >= 3, 'blog-articles yedeğinden en az 3 yazı');
});
test('stats — ardışık GET önbellekten beslenir (collectedAt değişmez)', async () => {
  const r1 = mockRes();
  const r2 = mockRes();
  await stats(makeReq('GET'), r1);
  await stats(makeReq('GET'), r2);
  assert.equal(r1.body.collectedAt, r2.body.collectedAt);
});
test('stats — POST 405', async () => {
  const res = mockRes();
  await stats(makeReq('POST'), res);
  assert.equal(res.statusCode, 405);
});

test('newsletter — geçerli e-posta, backend yok: persisted:false', async () => {
  const res = mockRes();
  await newsletter(makeReq('POST', { body: { email: 'merhaba@ornek.com', lang: 'tr' }, ip: 'A' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.persisted, false);
});
test('newsletter — geçersiz e-posta 400', async () => {
  const rl = ['', 'abc', 'a@b', 'x@y.z', 'a b@c.com', '@d.com'];
  for (let i = 0; i < rl.length; i++) {
    const res = mockRes();
    await newsletter(makeReq('POST', { body: { email: rl[i] }, ip: `B${i}` }), res);
    assert.equal(res.statusCode, 400, `beklendi: 400, gelen: ${res.statusCode} (${rl[i]})`);
  }
});
test('newsletter — aynı IP 5. istekten sonra 429 (rate limit)', async () => {
  const results = [];
  for (let i = 0; i <= 5; i++) {
    const res = mockRes();
    await newsletter(makeReq('POST', { body: { email: `isim${i}@ornek.com` }, ip: 'BLOCK' }), res);
    results.push(res.statusCode);
  }
  assert.deepEqual(results.slice(0, 5), [200, 200, 200, 200, 200]);
  assert.equal(results[5], 429);
});
test('newsletter — GET 405', async () => {
  const res = mockRes();
  await newsletter(makeReq('GET'), res);
  assert.equal(res.statusCode, 405);
});
test('newsletter — gövde yok → 400 (invalid-email)', async () => {
  const res = mockRes();
  await newsletter(makeReq('POST', { ip: 'C' }), res);
  assert.equal(res.statusCode, 400);
});