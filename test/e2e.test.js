// ═════════════════════════════════════════════════════════
// QUANTRO · E2E SMOKE + CSP DOĞRULAMASI (Playwright)
//   - Tüm sayfalar 200 döner ve boş gelmez
//   - Lab: 13 araç kartı, QRNG sim akışı, browser'da QuantumCircuit API
//   - Admin: giriş ekranı render
//   - CSP: vercel.json'daki politika "unsafe-eval" olmadan da
//     hiçbir sayfada ihlal üretmiyor (kaldırılabilirliği kanıtlanır)
//   Kurulum: devDependency playwright + `npx playwright install chromium`
// ═════════════════════════════════════════════════════════
const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['/', '/index.html', '/hakkimizda.html', '/arastirma.html', '/simulasyon.html', '/blog.html', '/quantro-lab.html', '/qtr-admin.html'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml'
};

// vercel.json'daki CSP'yi okur; script-src'ten 'unsafe-eval'i çıkarır
function tightenedCsp() {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const header = cfg.headers.find((h) => h.source === '/(.*)');
  const csp = header.headers.find((h) => h.key === 'Content-Security-Policy');
  const source = header.headers.find((h) => h.key === 'Content-Security-Policy').value;
  if (source.includes("'unsafe-eval'")) {
    csp.value = source.replace("'unsafe-eval' ", '').replace(" 'unsafe-eval'", '');
  }
  return csp.value;
}

function startServer(csp) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      let fp = decodeURIComponent(url.pathname) === '/'
        ? path.join(ROOT, 'index.html')
        : path.join(ROOT, decodeURIComponent(url.pathname).replace(/^\//, ''));
      fs.stat(fp, (err, st) => {
        if (err || !st.isFile()) { res.statusCode = 404; res.end('not found'); return; }
        if (csp) res.setHeader('Content-Security-Policy', csp);
        res.setHeader('Content-Type', MIME[path.extname(fp)] || 'application/octet-stream');
        fs.createReadStream(fp).pipe(res);
      });
    });
    server.listen(0, () => resolve(server));
  });
}

let server, base, browser;

test.before(async () => {
  server = await startServer(tightenedCsp());
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});

test.after(async () => {
  await browser.close();
  server.close();
});

async function open(pathname, context) {
  const page = await context.newPage();
  const violations = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) violations.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(base + pathname, { waitUntil: 'domcontentloaded' });
  return { page, violations, pageErrors, close: () => page.close() };
}

test('tüm sayfalar 200 döner ve başlık içerir', async () => {
  for (const p of PAGES) {
    const c = await browser.newContext();
    const r = await open(p, c);
    assert.equal(r.pageErrors.length, 0, `${p} sayfasında JS hatası: ${r.pageErrors.join('|')}`);
    const title = await r.page.title();
    assert.ok(title && title.length > 0, `${p} sayfası boş başlık`);
    assert.equal(r.violations.length, 0, `${p} → CSP ihlali (unsafe-eval olmadan): ${r.violations.join('|')}`);
    await r.close();
    await c.close();
  }
});

test('CSP: hiçbir sayfa unsafe-eval ihlali üretmez', async () => {
  const c = await browser.newContext();
  for (const p of PAGES) {
    const r = await open(p, c);
    assert.equal(r.violations.length, 0, `${p} unsafe-eval'siz CSP ihlali: ${r.violations.join('|')}`);
    await r.close();
  }
  await c.close();
});

test('ansayfa: hero + foot bölümleri render', async () => {
  const c = await browser.newContext();
  const r = await open('/', c);
  const hero = (await r.page.textContent('h1') || '').trim();
  assert.ok(hero.length > 3, `h1 boş/beklenmedik: "${hero}"`);
  const foot = await r.page.$('footer');
  assert.ok(foot, 'footer yok');
  await r.close();
  await c.close();
});

test('lab: 13 araç kartı render', async () => {
  const c = await browser.newContext();
  const r = await open('/quantro-lab.html', c);
  const n = await r.page.$$eval('.tool-card', (el) => el.length);
  assert.equal(n, 13, 'tool-card sayısı 13 olmalı');
  await r.close();
  await c.close();
});

test('lab: QRNG sim akışı çalışır (10x seri)', async () => {
  const c = await browser.newContext();
  const r = await open('/quantro-lab.html', c);
  await r.page.click('.tool-card:nth-child(2) .tool-header');
  await r.page.selectOption('#qsrc', 'sim');
  await r.page.click('button[onclick="genQS()"]');
  await r.page.waitForFunction(() => {
    const qn = document.getElementById('qn');
    return qn && qn.textContent.trim() !== '—';
  }, null, { timeout: 10000 });
  const val = await r.page.textContent('#qn');
  assert.ok(Number(val) >= 1 && Number(val) <= 1000000, `#qn beklenmedik: ${val}`);
  await r.close();
  await c.close();
});

test('lab: browser içinde QuantumCircuit API (Bell: sadece |00>+|11>)', async () => {
  const c = await browser.newContext();
  const r = await open('/quantro-lab.html', c);
  const result = await r.page.evaluate(() => new Promise((resolve) => {
    const run = () => {
      const Q = window.Quantro;
      const circ = Q.bellState(new Q.QuantumCircuit(2), 0, 1);
      const counts = Q.sampleDistribution(circ, 4000, 11);
      const keys = Object.keys(counts).map(Number).sort();
      return { ok: keys.join(',') === '0,3' && counts[0] + counts[3] === 4000, keys };
    };
    if (window.Quantro) return resolve(run());
    const s = document.createElement('script');
    s.src = '/quantro.js';
    s.onload = () => resolve(run());
    s.onerror = () => resolve({ ok: false, why: 'quantro.js yüklenemedi' });
    document.head.appendChild(s);
  }));
  assert.equal(result.ok, true, `Bell sonucu: ${JSON.stringify(result)}`);
  await r.close();
  await c.close();
});

test('admin: giriş ekranı render olur', async () => {
  const c = await browser.newContext();
  const r = await open('/qtr-admin.html', c);
  const visible = await r.page.$eval('#login-screen', (el) => getComputedStyle(el).display);
  assert.notEqual(visible, 'none', 'login ekranı kapalı');
  const hasPw = await r.page.$('input[type="password"]');
  assert.ok(hasPw, 'parola alanı yok');
  await r.close();
  await c.close();
});

test('PWA: service worker ve manifest erişilebilir', async () => {
  const c = await browser.newContext();
  await open('/index.html', c).then((r) => r.close());
  const respons = await fetch(base + '/sw.js');
  assert.equal(respons.status, 200);
  const mani = await fetch(base + '/manifest.webmanifest');
  assert.equal(mani.status, 200);
  await c.close();
});

test('i18n: dil değişimi çalışır ve kalıcıdır', async () => {
  const c = await browser.newContext();
  const r = await open('/index.html', c);
  const lang0 = await r.page.evaluate(() => document.documentElement.lang);
  assert.equal(lang0, 'tr', 'varsayılan dil TR olmalı');
  const about0 = (await r.page.textContent('[data-i18n="nav.about"]')).trim();
  await r.page.click('#langbtn');
  await r.page.waitForTimeout(100);
  const lang1 = await r.page.evaluate(() => document.documentElement.lang);
  const about1 = (await r.page.textContent('[data-i18n="nav.about"]')).trim();
  const lbl = await r.page.textContent('#langbtn');
  assert.equal(lang1, 'en', 'lang attr EN olmalı');
  assert.equal(about0, 'Hakkımızda');
  assert.equal(about1, 'About Us');
  assert.equal(lbl.trim(), 'EN');
  assert.equal(r.violations.length, 0, `i18n değişiminde CSP ihlali: ${r.violations.join('|')}`);
  await r.page.reload({ waitUntil: 'domcontentloaded' });
  const lang2 = await r.page.evaluate(() => document.documentElement.lang);
  assert.equal(lang2, 'en', 'seçim reload sonrası korunmalı (localStorage qlang)');
  await r.close();
  await c.close();
});