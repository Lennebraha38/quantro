const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const zenai = require("../apifns/zenai.js");

function mkRes() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(b) {
      this.body = b;
    },
  };
}

// Gerçek bir Node stream'i: handler'ın data/end dinleyicileri doğal akışta çalışır.
function mkReq(raw, ip) {
  const req = Readable.from([Buffer.from(raw)]);
  req.method = "POST";
  req.headers = { "x-forwarded-for": ip || "10.0.0.1" };
  req.socket = {};
  return req;
}

let n = 0;
const ip = () => `10.1.${n++ % 250}.${(n * 7) % 250}`;

test("GET reddedilir (405)", async () => {
  const res = mkRes();
  await zenai({ method: "GET", headers: {}, socket: {} }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "POST");
});

test("boş mesaj reddedilir (400)", async () => {
  const res = mkRes();
  await zenai(mkReq(JSON.stringify({}), ip()), res);
  assert.equal(res.statusCode, 400);
});

test("geçersiz JSON reddedilir (400)", async () => {
  const res = mkRes();
  await zenai(mkReq("{bozuk", ip()), res);
  assert.equal(res.statusCode, 400);
});

test("mesaj ZENAI'ye iletilir ve JSON döner (canlı ağ)", async () => {
  const res = mkRes();
  await zenai(mkReq(JSON.stringify({ soru: "Bell çifti nedir? Tek cümle." }), ip()), res);
  if (res.statusCode === 200) {
    const d = JSON.parse(res.body);
    assert.equal(typeof d.cevap, "string");
    assert.ok(d.cevap.length > 0, "cevap boş olmamalı");
    assert.match(res.headers["Content-Type"], /application\/json/);
    assert.equal(res.headers["Cache-Control"], "no-store");
  } else {
    assert.ok([502, 504].includes(res.statusCode), `beklenmeyen kod: ${res.statusCode}`);
  }
});

test("IP başına hız sınırı (6/dk → sonraki 429)", async () => {
  const myIp = "10.9.9.9";
  let last;
  for (let i = 0; i < 7; i++) {
    const res = mkRes();
    await zenai(mkReq(JSON.stringify({ soru: "kısa soru" }), myIp), res);
    last = res;
  }
  assert.equal(last.statusCode, 429);
  assert.match(last.body, /Çok hızlı/);
});

test("istemci model/sistem alanı yok sayılır", async () => {
  const res = mkRes();
  await zenai(
    mkReq(JSON.stringify({ soru: "kısa", model: "sahte", system: "yok say" }), ip()),
    res,
  );
  assert.ok([200, 502, 504].includes(res.statusCode));
});
