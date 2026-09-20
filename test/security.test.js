const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8"));
const main = cfg.headers.find((h) => h.source === "/(.*)");
assert.ok(main, "köklü güvenlik başlık kuralı olmalı");
const h = Object.fromEntries(main.headers.map((x) => [x.key, x.value]));

test("çekirdek güvenlik başlıkları tanımlı", () => {
  for (const k of [
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) {
    assert.ok(h[k], `${k} başlığı vercel.json'da tanımlı olmalı`);
  }
});

test("CSP kısıtlayıcılar yerinde", () => {
  const csp = h["Content-Security-Policy"];
  assert.match(csp, /frame-ancestors 'none'/, "CSP frame-ancestors engellemeli");
  assert.match(csp, /object-src 'none'/, "CSP object-src engellemeli");
  assert.match(csp, /base-uri 'self'/, "CSP base-uri kısıtlamalı");
  assert.match(csp, /default-src 'self'/, "CSP varsayılanı kendi-orijin olmalı");
});

test("X-Frame-Options DENY + HSTS uzun ömürlü", () => {
  assert.equal(h["X-Frame-Options"], "DENY");
  assert.match(h["Strict-Transport-Security"], /max-age=63072000/, "HSTS en az 2 yıl");
  assert.match(h["Strict-Transport-Security"], /includeSubDomains/);
});

test("3P ölçüm alanları CSP connect-src listesinde", () => {
  const csp = h["Content-Security-Policy"];
  for (const host of [
    "qrng.anu.edu.au",
    "beacon.nist.gov",
    "analytics.google.com",
    "googletagmanager.com",
  ]) {
    assert.ok(csp.includes(host), `connect-src ${host} izinli olmalı`);
  }
});
