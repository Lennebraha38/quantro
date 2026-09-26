const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const zenai = require("../apifns/zenai.js");
const { __injectFetch } = require("../apifns/zenai.js");

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

// Upstream'in belirli bir yanıt dizisini taklit ettiği sahte fetch.
// Gerçek ZENAI kararsız olduğu için (ara sıra HTTP 500) testler ağa
// bağlanmaz; bu sayede Node 18/20/22'de aynı sonucu verir.
function fakeFetch(dizi) {
  let i = 0;
  const cagrilar = [];
  const fn = async () => {
    cagrilar.push(cagrilar.length);
    const adim = dizi[Math.min(i, dizi.length - 1)];
    i++;
    if (adim instanceof Error) throw adim;
    return {
      status: adim.status ?? 200,
      ok: (adim.status ?? 200) < 400,
      json: async () => adim.json ?? {},
    };
  };
  fn.cagriSayisi = () => i;
  fn.cagrilar = cagrilar;
  return fn;
}

const OK = {
  json: { content: "Bell çifti nedir? Kısaca: iki kübitin dolanık süperpozisyon hali." },
};
const BOS = { json: { content: "" } };

async function calistir(soru, fetchFn, ipAdres) {
  const geriAl = __injectFetch(fetchFn);
  try {
    const res = mkRes();
    await zenai(mkReq(JSON.stringify({ soru }), ipAdres), res);
    return { res, durum: res.statusCode, govde: res.body ? JSON.parse(res.body) : null };
  } finally {
    geriAl();
  }
}

/* ═══ Girdi doğrulama (ağa çıkmaz) ═══════════════════════════ */

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

test("istemci model/sistem alanı yok sayılır", async () => {
  const sahte = fakeFetch([OK]);
  const { durum, govde } = await calistir(
    "kısa",
    async (url, opt) => {
      const g = JSON.parse(opt.body);
      assert.equal(g.model, "zenai", "istemci modeli ezmemeli");
      assert.ok(!/sahte/.test(JSON.stringify(g)), "istemci sistemi sızmamalı");
      return sahte(url, opt);
    },
    ip(),
  );
  assert.equal(durum, 200);
  assert.ok(govde.cevap.length > 0);
});

/* ═══ Retry davranışı (belirlenimci) ═════════════════════════ */

test("ilk deneme 500 → yeniden denemede başarılı yanıt döner", async () => {
  const sahte = fakeFetch([{ status: 500 }, OK]);
  const { durum, govde } = await calistir("Bell çifti nedir? Tek cümle.", sahte, ip());
  assert.equal(durum, 200);
  assert.equal(sahte.cagriSayisi(), 2, "500 sonrası yeniden denenmeli");
  assert.ok(govde.cevap.length > 0);
});

test("ilk deneme 429 → yeniden denemede başarılı yanıt döner", async () => {
  const sahte = fakeFetch([{ status: 429 }, OK]);
  const { durum } = await calistir("Bell çifti nedir? Tek cümle.", sahte, ip());
  assert.equal(durum, 200);
  assert.equal(sahte.cagriSayisi(), 2);
});

test("ilk deneme boş gövde → yeniden denemede başarılı yanıt döner", async () => {
  const sahte = fakeFetch([BOS, OK]);
  const { durum } = await calistir("Bell çifti nedir? Tek cümle.", sahte, ip());
  assert.equal(durum, 200);
  assert.equal(sahte.cagriSayisi(), 2);
});

test("yanıt alanı content dışındaysa da kabul edilir (message/reply)", async () => {
  for (const alan of ["message", "reply", "text", "answer"]) {
    const { durum, govde } = await calistir(
      "Bell nedir?",
      fakeFetch([{ json: { [alan]: "yanıt var" } }]),
      ip(),
    );
    assert.equal(durum, 200, `${alan} alanı okunmalı`);
    assert.equal(govde.cevap, "yanıt var");
  }
});

test("ağ hatası (fetch throw) → yeniden denenir", async () => {
  const sahte = fakeFetch([new Error("ECONNRESET"), OK]);
  const { durum } = await calistir("Bell çifti nedir? Tek cümle.", sahte, ip());
  assert.equal(durum, 200);
});

test("3 deneme de boş → hazır cevap yoksa 502 ve sebep", async () => {
  const sahte = fakeFetch([BOS]);
  const { durum, govde } = await calistir("çok bilinmeyen bir soru soruyorum", sahte, ip());
  assert.equal(durum, 502);
  assert.ok(govde.error.includes("yanıt veremedi"));
  assert.ok(govde.sebep, "sebep bildirilmeli");
  assert.equal(sahte.cagriSayisi(), 3, "tam 3 deneme yapılmalı");
});

test("3 deneme de boş → site bilgisinden hazır cevap devreye girer", async () => {
  const sahte = fakeFetch([BOS]);
  const { durum, govde } = await calistir("kaç araç var?", sahte, ip());
  assert.equal(durum, 200);
  assert.equal(govde.kaynak, "hazir");
  assert.ok(govde.not.includes("ZENAI"), "kullanıcıya durum dürüstçe bildirilmeli");
});

test("uzun/niyetli soru hazır cevaba düşmez (gerçek soru kesilmez)", async () => {
  const uzun =
    "bu sitede türkiyede ilklerimiz bölümü var bunların doğruluğu nedir gerçekten doğru mu";
  const sahte = fakeFetch([BOS]);
  const { durum, govde } = await calistir(uzun, sahte, ip());
  assert.equal(durum, 502, "uzun soru hazır cevapla karşılanmamalı");
  assert.notEqual(govde.kaynak, "hazir");
});

/* ═══ Hız sınırı (ağa çıkmaz — mock fetch) ═══════════════════ */

test("IP başına hız sınırı (15/dk → sonraki 429)", async () => {
  const sahte = fakeFetch([OK]);
  const geriAl = __injectFetch(sahte);
  try {
    let son;
    for (let i = 0; i < 16; i++) {
      const res = mkRes();
      await zenai(mkReq(JSON.stringify({ soru: "kısa soru" }), "10.9.9.9"), res);
      son = res;
    }
    assert.equal(son.statusCode, 429);
    assert.match(son.body, /Çok hızlı/);
    assert.equal(sahte.cagriSayisi(), 15, "sınır aşıldıktan sonra ağa çıkılmamalı");
  } finally {
    geriAl();
  }
});

/* ═══ Canlı duman testi (varsayılan suite'te YOK) ══════════════
   Bu test GERÇEK ZENAI'ye gider. ZENAI kendi sağlayıcısından ara sıra
   HTTP 500 döndürdüğü için kararsızdır; bu da Node 20 CI job'ını
   düşürüyordu. Üretim kalitesi bir üçüncü taraf servisin çalışma
   saatine bağlı olmamalı: canlı test artık yalnızca açıkça istenince
   (QUANTRO_LIVE_TEST=1) veya gece CI'da çalışır. */

const CANLI = process.env.QUANTRO_LIVE_TEST === "1";

test(
  "canlı: uç nokta yanıt verir (içerik doğrulanmaz)",
  { skip: CANLI ? false : "canlı ağ testi — QUANTRO_LIVE_TEST=1 ile çalışır" },
  async () => {
    const res = mkRes();
    await zenai(mkReq(JSON.stringify({ soru: "Bell çifti nedir? Tek cümle." }), ip()), res);
    assert.ok([200, 429, 502, 504].includes(res.statusCode), `beklenmeyen kod: ${res.statusCode}`);
    assert.match(res.headers["Content-Type"], /application\/json/);
    const d = JSON.parse(res.body);
    assert.ok(d.cevap || d.error, "ya cevap ya hata dönmeli");
    if (res.statusCode === 200) {
      assert.equal(typeof d.cevap, "string");
      assert.ok(d.cevap.length > 0, "cevap boş olmamalı");
      assert.equal(res.headers["Cache-Control"], "no-store");
    }
  },
);
