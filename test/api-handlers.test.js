// ═════════════════════════════════════════════════════════
// API HANDLER ENTEGRASYON TESTLERİ (Supabase mock'lu)
//   Gerçek sunucu işleyicileri (auth/comments/blog) Node'da çalıştırılır,
//   global.fetch yama ile app-suppabase çağrıları denetlenir.
// ═════════════════════════════════════════════════════════
process.env.SUPABASE_URL = "https://q.test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
process.env.AUTH_SECRET = "test-secret-ajans";
process.env.ADMIN_PASSWORD = "sifre";

const test = require("node:test");
const assert = require("node:assert/strict");
const { signToken } = require("../api/_lib.js");
const auth = require("../api/auth.js");
const comments = require("../api/comments.js");
const blog = require("../api/blog.js");

function mockRes() {
  let code = 200,
    data = null;
  return {
    setHeader() {
      return this;
    },
    status(c) {
      code = c;
      return this;
    },
    json(d) {
      data = d;
      return this;
    },
    get statusCode() {
      return code;
    },
    get body() {
      return data;
    },
  };
}

function makeReq(method = "GET", { body, query, bearer, ip } = {}) {
  const headers = {};
  if (ip) headers["x-forwarded-for"] = ip;
  if (bearer) headers["authorization"] = `Bearer ${bearer}`;
  return { method, query: query || {}, body, headers, socket: { remoteAddress: "5.5.5.5" } };
}

let calls = []; // global.fetch çağrıları (url, init)
async function withFetch(impl, fn) {
  const orig = global.fetch;
  calls = [];
  global.fetch = (url, init) => {
    calls.push({ url: String(url), init });
    return impl
      ? impl(url, init)
      : Promise.resolve({ ok: true, status: 200, json: async () => [] });
  };
  try {
    return await fn();
  } finally {
    global.fetch = orig;
  }
}

test("auth — doğru şifre token üretir", async () => {
  const res = mockRes();
  await auth(makeReq("POST", { body: { password: "sifre" }, ip: "A" }), res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.token && res.body.expires_in === 7200);
});
test("auth — yanlış şifre 401", async () => {
  const res = mockRes();
  await auth(makeReq("POST", { body: { password: "yanlis" }, ip: "B" }), res);
  assert.equal(res.statusCode, 401);
});
test("auth — GET metodu 405", async () => {
  const res = mockRes();
  await auth(makeReq("GET", { ip: "C" }), res);
  assert.equal(res.statusCode, 405);
});
test("auth — brute-force rate limit (10 deneme / 10 dk)", async () => {
  const res = mockRes();
  for (let i = 0; i < 10; i++) {
    const r = mockRes();
    await auth(makeReq("POST", { body: { password: "x" }, ip: "2.2.2.2" }), r);
    assert.notEqual(r.statusCode, 429, `deneme ${i + 1}`);
  }
  await auth(makeReq("POST", { body: { password: "x" }, ip: "2.2.2.2" }), res);
  assert.equal(res.statusCode, 429);
});

test("comments — halka açık liste (slug) supabase URL ile çağrılır", async () => {
  const rows = [{ id: 1, name: "X" }];
  const res = mockRes();
  await withFetch(
    () => Promise.resolve({ ok: true, status: 200, json: async () => rows }),
    () => comments(makeReq("GET", { query: { slug: "kuantum" }, ip: "D" }), res),
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, rows);
  assert.match(calls[0].url, /blog_comments\?post_slug=eq\.kuantum/);
});
test("comments — slug yoksa 400", async () => {
  const res = mockRes();
  await withFetch(null, () => comments(makeReq("GET", { ip: "E" }), res));
  assert.equal(res.statusCode, 400);
});
test("comments — honeypot doluysa fetch çağrılmaz", async () => {
  const res = mockRes();
  await withFetch(null, () =>
    comments(makeReq("POST", { body: { name: "B", website: "http://spam" }, ip: "F" }), res),
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(calls.length, 0);
});
test("comments — yorum ekleme doğrulama (kısa içerik) 400", async () => {
  const res = mockRes();
  await withFetch(null, () =>
    comments(makeReq("POST", { body: { post_slug: "x", name: "N", content: "ab" }, ip: "G" }), res),
  );
  assert.equal(res.statusCode, 400);
});
test("comments — geçerli yorum eklenir (is_approved=false)", async () => {
  const res = mockRes();
  let posted;
  await withFetch(
    () => Promise.resolve({ ok: true, status: 201, json: async () => [] }),
    () =>
      comments(
        makeReq("POST", {
          body: { post_slug: "x", name: "N", content: "abcd", email: "a@b.co" },
          ip: "H",
        }),
        res,
      ),
  ).then(() => {
    posted = calls[0].init.body;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(JSON.parse(posted).is_approved, false);
});
test("comments — admin yönetim dalı geçersiz token ile 401", async () => {
  const res = mockRes();
  await withFetch(null, () => comments(makeReq("GET", { bearer: "bos.deger", ip: "I" }), res));
  assert.equal(res.statusCode, 401);
});

test("blog — token yoksa tüm uçlar 401 ve fetch çalışmaz", async () => {
  const res = mockRes();
  await withFetch(null, () => blog(makeReq("GET", { ip: "J" }), res));
  assert.equal(res.statusCode, 401);
  assert.equal(calls.length, 0);
});
test("blog — admin token ile liste çekilir", async () => {
  const rows = [{ title: "T1" }];
  const res = mockRes();
  const token = signToken("admin");
  await withFetch(
    () => Promise.resolve({ ok: true, status: 200, json: async () => rows }),
    () => blog(makeReq("GET", { bearer: token, ip: "K" }), res),
  );
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, rows);
});
test("blog — POST title/content eksikse 400", async () => {
  const res = mockRes();
  const token = signToken("admin");
  await blog(makeReq("POST", { body: { title: "y" }, bearer: token, ip: "L" }), res);
  assert.equal(res.statusCode, 400);
});
test("blog — geçerli POST 201 ile yeni kaydı döner", async () => {
  const created = { id: 9, title: "Yeni" };
  const res = mockRes();
  const token = signToken("admin");
  await withFetch(
    () => Promise.resolve({ ok: true, status: 201, json: async () => created }),
    () =>
      blog(
        makeReq("POST", {
          body: { title: "Yeni", content: "içerik", published: 1 },
          bearer: token,
          ip: "M",
        }),
        res,
      ),
  );
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, created);
  assert.equal(JSON.parse(calls[0].init.body).published, true);
});
test("blog — PATCH id değeri yoksa 400", async () => {
  const res = mockRes();
  const token = signToken("admin");
  await blog(makeReq("PATCH", { body: { title: "x" }, bearer: token, ip: "N" }), res);
  assert.equal(res.statusCode, 400);
});
