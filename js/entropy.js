/* ══════════════════════════════════════════════════════════════
   ENTROPY — akış alanı (curl noise) arka planı
   "Düzen ve kaos dans ediyor": parçacıklar gürültü alanında
   akar, arkalarında iz bırakır. Saf canvas, bağımlılık yok.

   - prefers-reduced-motion: reduce  -> hiç başlamaz
   - sekme gizliyken durur
   - DPR 2'de sınırlı, parçacık sayısı ekran alanıyla ölçekli
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (document.getElementById("entropy-bg")) return;

  const cv = document.createElement("canvas");
  cv.id = "entropy-bg";
  cv.setAttribute("aria-hidden", "true");
  /* Konum satır içinde: CSS yükleme sırasından bağımsız çalışır */
  cv.style.cssText =
    "position:fixed;top:0;left:0;right:0;bottom:0;z-index:-1;pointer-events:none;display:block";
  window.__entropyInline = true;
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d", { alpha: false });

  const CYAN = [0, 200, 240];
  const VIOLET = [124, 108, 255];
  const ICE = [200, 236, 255];
  const BG = "#020810";
  const DPR_CAP = 2;

  /* ── permütasyon tabanlı değer gürültüsü ── */
  const PERM = new Uint8Array(512);
  (function seed() {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = 1337;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      const t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  })();
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  function grad(h, x, y) {
    switch (h & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      default:
        return -x - y;
    }
  }
  function noise(x, y) {
    const X = Math.floor(x) & 255,
      Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x),
      yf = y - Math.floor(y);
    const u = fade(xf),
      v = fade(yf);
    const aa = PERM[X + PERM[Y]],
      ab = PERM[X + PERM[Y + 1]];
    const ba = PERM[X + 1 + PERM[Y]],
      bb = PERM[X + 1 + PERM[Y + 1]];
    return lerp(
      lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
      lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
      v,
    );
  }
  /* curl: gürültünün rotasyonu → akış alanı */
  function curl(x, y, e) {
    const a = noise(x, y + e) - noise(x, y - e);
    const b = noise(x + e, y) - noise(x - e, y);
    return [(a / (2 * e)) * -1, (b / (2 * e)) * -1];
  }

  let W = 0,
    H = 0,
    dpr = 1,
    parts = [];
  const SCALE = 0.0022;
  const SPEED = 1.15;

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    /* yoğunluk: 26px başına 1 parçacık, en az 90, en fazla 260 */
    const n = Math.max(140, Math.min(380, Math.round((W * H) / 17000)));
    parts = new Array(n);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * W,
        y = Math.random() * H;
      const roll = Math.random();
      parts[i] = {
        x,
        y,
        px: x,
        py: y,
        col: roll > 0.9 ? VIOLET : roll > 0.72 ? ICE : CYAN,
        a: 0.1 + Math.random() * 0.22,
        w: 0.6 + Math.random() * 1.1,
      };
    }
  }

  let raf = 0,
    t0 = 0;
  function step(ts) {
    if (!t0) t0 = ts;
    const t = (ts - t0) * 0.00006;
    /* iz: siyahı yarı saydamla ört -> kuyruklar solar */
    ctx.fillStyle = "rgba(2, 8, 16, 0.07)";
    ctx.fillRect(0, 0, W, H);
    ctx.lineCap = "round";

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.px = p.x;
      p.py = p.y;
      const v = curl(p.x * SCALE, p.y * SCALE + t, 0.6);
      p.x += v[0] * SPEED;
      p.y += v[1] * SPEED;
      /* kenar geçişi: karşı taraftan sarmalayarak akışı sürdür */
      if (p.x < -20) {
        p.x = W + 20;
        p.px = p.x;
      } else if (p.x > W + 20) {
        p.x = -20;
        p.px = p.x;
      }
      if (p.y < -20) {
        p.y = H + 20;
        p.py = p.y;
      } else if (p.y > H + 20) {
        p.y = -20;
        p.py = p.y;
      }

      ctx.strokeStyle = "rgba(" + p.col[0] + "," + p.col[1] + "," + p.col[2] + "," + p.a + ")";
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (!raf) {
      t0 = 0;
      raf = requestAnimationFrame(step);
    }
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  let rt = 0;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      build();
      if (!raf) {
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, W, H);
      }
    }, 220);
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  build();
  start();

  /* erişilebilirlik: kullanıcı hareketi kapatırsa bir daha başlatma */
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onMQ = () => mq.matches && stop();
  mq.addEventListener ? mq.addEventListener("change", onMQ) : mq.addListener(onMQ);
})();
