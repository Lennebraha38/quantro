/* ══ T12: DOUBLE SLIT ══ */
var ds = {
  cv: null,
  cx: null,
  W: 900,
  H: 360,
  srcX: 70,
  barX: 310,
  scale: 0.0038,
  NB: 700,
  y0: 44,
  y1: 316,
  shots: 0,
  total: 200,
  which: false,
  a: 0.1,
  sep: 0.45,
  lam: 0.06,
  cd: 160,
  bins: null,
  raf: null,
  flying: false,
  t0: 0,
  fx: 0,
  fy: 0,
  tx: 0,
  ty: 0,
  spawnSlit: 0,
};
function dsGet(id) {
  return document.getElementById(id);
}
function dsStart() {
  ds.cv = dsGet("ds-canvas");
  if (!ds.cv) return;
  if (ds.cv.width !== ds.W) {
    ds.cv.width = ds.W;
    ds.cv.height = ds.H;
  }
  ds.cx = ds.cv.getContext("2d");
  if (!ds.bins) ds.bins = new Array(ds.NB).fill(0);
  dsRead();
  dsDraw();
  if (!ds.raf) ds.raf = requestAnimationFrame(dsTick);
}
function dsRead() {
  const s = dsGet("ds-slit"),
    d = dsGet("ds-sep"),
    w = dsGet("ds-wave"),
    n = dsGet("ds-n");
  if (!s || !d || !w || !n) return;
  ds.a = +s.value / 100;
  ds.sep = +d.value / 100;
  ds.lam = +w.value / 100;
  ds.which = dsGet("ds-which").checked;
  ds.cd = (+dsGet("ds-speed").value || 16) * 10;
  ds.total = Math.max(1, +n.value || 200);
  dsGet("ds-av").textContent = (+s.value / 100).toFixed(2);
  dsGet("ds-dv").textContent = (+d.value / 100).toFixed(2);
  dsGet("ds-lv").textContent = (+w.value / 100).toFixed(2);
  dsGet("ds-nv").textContent = ds.total;
  dsGet("ds-stat").textContent = ds.which ? t("t12.stat.classical") : t("t12.stat.coherent");
}
function dsIntensity(y, whichOnly) {
  const x = (y - ds.H / 2) * ds.scale;
  const beta = (Math.PI * ds.a) / ds.lam;
  const bx = x === 0 ? 1 : Math.sin(beta * x) / (beta * x);
  const E = bx * bx;
  if (whichOnly) return E;
  const phase = (Math.PI * ds.sep) / ds.lam;
  return E * Math.cos(phase * x) * Math.cos(phase * x);
}
function dsCDF(whichOnly) {
  const n = ds.NB,
    lo = ds.y0,
    hi = ds.y1;
  const cdf = new Float64Array(n + 1);
  let tot = 0;
  for (let i = 0; i < n; i++) {
    const y = lo + ((hi - lo) * (i + 0.5)) / n;
    tot += dsIntensity(y, whichOnly);
    cdf[i + 1] = tot;
  }
  for (let i = 1; i <= n; i++) cdf[i] /= tot || 1;
  return cdf;
}
function dsSample(cdf) {
  const n = ds.NB,
    lo = ds.y0,
    hi = ds.y1;
  let r;
  if (ds.pool && ds.pi < ds.pool.length) {
    r = ((ds.pool[ds.pi++] << 8) | (ds.pi < ds.pool.length ? ds.pool[ds.pi++] : 0)) / 65536;
  } else r = Math.random();
  if (r >= cdf[n]) r = cdf[n] - 1e-9;
  let loI = 0,
    hiI = n;
  while (loI < hiI) {
    const mid = (loI + hiI) >> 1;
    if (cdf[mid + 1] < r) loI = mid + 1;
    else hiI = mid;
  }
  return lo + ((hi - lo) * (loI + 0.5)) / n;
}
async function dsFire() {
  if (!ds.cv) dsStart();
  if (!ds.cv) return;
  dsRead();
  ds.shots = 0;
  ds.pi = 0;
  try {
    ds.pool = await Qrng.bytes(Math.min(ds.total * 4, 512));
  } catch (e) {
    ds.pool = null;
  }
  dsDraw();
  dsLaunch();
}
function dsReset() {
  if (!ds.cv) dsStart();
  ds.bins = new Array(ds.NB).fill(0);
  ds.shots = 0;
  if (dsGet("ds-cv")) dsGet("ds-cv").textContent = 0;
  dsRead();
  dsDraw();
}
function dsLaunch() {
  if (!ds.cv) return;
  if (ds.raf) cancelAnimationFrame(ds.raf);
  ds.flying = false;
  dsLaunchNext();
  ds.raf = requestAnimationFrame(dsTick);
}
function dsLaunchNext() {
  if (ds.shots >= ds.total) {
    ds.flying = false;
    return;
  }
  ds.shots++;
  const cdf = dsCDF(ds.which);
  const ty = dsSample(cdf);
  if (ds.which) {
    ds.spawnSlit =
      (ds.pool && ds.pi < ds.pool.length ? ds.pool[ds.pi++] & 1 : Math.random()) < 0.5 ? -1 : 1;
    ds.fx = ds.barX;
    ds.fy = ds.H / 2 + (ds.spawnSlit * ds.sep * 150) / 2;
  } else {
    ds.spawnSlit = 0;
    ds.fx = ds.srcX;
    ds.fy = ds.H / 2;
  }
  ds.tx = ds.W - 110;
  ds.ty = ty;
  ds.t0 = performance.now();
  ds.flying = true;
}
function dsTick(now) {
  if (!ds.cx) return;
  dsDrawBase();
  if (ds.flying) {
    const p = Math.min(1, (now - ds.t0) / 500);
    const e = 1 - Math.pow(1 - p, 2);
    let x, y;
    if (ds.spawnSlit === 0) {
      x = (1 - e) * (1 - e) * ds.fx + 2 * (1 - e) * e * ds.barX + e * e * ds.tx;
      y = (1 - e) * (1 - e) * ds.fy + 2 * (1 - e) * e * (ds.H / 2) + e * e * ds.ty;
    } else {
      x = ds.fx + (ds.tx - ds.fx) * e;
      y = ds.fy + (ds.ty - ds.fy) * e;
    }
    ds.cx.beginPath();
    ds.cx.arc(x, y, 2.4, 0, 6.2832);
    ds.cx.fillStyle = "rgba(0,220,255,.9)";
    ds.cx.shadowColor = "rgba(0,200,240,.9)";
    ds.cx.shadowBlur = 10;
    ds.cx.fill();
    ds.cx.shadowBlur = 0;
    ds.cx.fillStyle = "rgba(0,200,240,.18)";
    ds.cx.beginPath();
    ds.cx.arc(ds.tx, ds.ty, 3.6, 0, 6.2832);
    ds.cx.fill();
    if (p >= 1) {
      const bi = Math.max(
        0,
        Math.min(ds.NB - 1, Math.round((ds.ty - ds.y0) / ((ds.y1 - ds.y0) / ds.NB))),
      );
      ds.bins[bi]++;
      ds.cx.fillStyle = "#00e5ff";
      ds.cx.shadowColor = "rgba(0,200,240,.9)";
      ds.cx.shadowBlur = 8;
      ds.cx.beginPath();
      ds.cx.arc(ds.tx, ds.ty, 2.2, 0, 6.2832);
      ds.cx.fill();
      ds.cx.shadowBlur = 0;
      ds.flying = false;
      const el = dsGet("ds-cv");
      if (el) el.textContent = ds.shots;
      setTimeout(dsLaunchNext, ds.cd);
    }
  }
  dsDrawHist();
  ds.raf = requestAnimationFrame(dsTick);
}
function dsDraw() {
  if (!ds.cx) return;
  dsDrawBase();
  dsDrawHist();
}
function dsDrawBase() {
  const ctx = ds.cx,
    W = ds.W,
    H = ds.H;
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(4,13,26,1)");
  g.addColorStop(1, "rgba(2,8,18,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const aPx = ds.a * 260,
    sepPx = ds.sep * 150,
    cy = H / 2;
  const s1 = cy - sepPx / 2,
    s2 = cy + sepPx / 2;
  ctx.strokeStyle = "rgba(0,200,240,.25)";
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(ds.srcX, cy);
  ctx.lineTo(ds.barX, s1 - aPx / 2);
  ctx.moveTo(ds.srcX, cy);
  ctx.lineTo(ds.barX, s2 + aPx / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#00e5ff";
  ctx.shadowColor = "rgba(0,200,240,.9)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(ds.srcX, cy, 4, 0, 6.2832);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(0,200,240,.65)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(ds.barX, 0);
  ctx.lineTo(ds.barX, s1 - aPx / 2);
  ctx.moveTo(ds.barX, s1 + aPx / 2);
  ctx.lineTo(ds.barX, s2 - aPx / 2);
  ctx.moveTo(ds.barX, s2 + aPx / 2);
  ctx.lineTo(ds.barX, H);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,200,240,.15)";
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(ds.tx, 0);
  ctx.lineTo(ds.tx, H);
  ctx.stroke();
  ctx.setLineDash([]);
  const px = ctx.createLinearGradient(0, 0, ds.tx, 0);
  px.addColorStop(0, "rgba(0,0,0,0)");
  px.addColorStop(1, "rgba(0,200,240,.06)");
  ctx.fillStyle = px;
  ctx.fillRect(0, 0, ds.tx, H);
}
function dsDrawHist() {
  const ctx = ds.cx,
    W = ds.W,
    scx = ds.W - 110;
  let max = 1;
  for (let i = 0; i < ds.NB; i++) if (ds.bins[i] > max) max = ds.bins[i];
  const n = ds.NB,
    lo = ds.y0,
    hi = ds.y1;
  const env = dsCDF(ds.which);
  for (let i = 0; i < n; i++) {
    const y = lo + ((hi - lo) * (i + 0.5)) / n;
    const cnt = ds.bins[i];
    const bh = (cnt / max) * (ds.H - 80);
    if (cnt > 0) {
      ctx.fillStyle = "rgba(0,229,255,.22)";
      ctx.fillRect(scx + 2, y - bh / 2, 4, bh);
      ctx.fillStyle = "rgba(0,229,255,.95)";
      ctx.fillRect(scx + 2, y - 0.6, 4, 1.2);
    }
    const th = (env[i + 1] - env[i]) * (hi - lo);
    ctx.fillStyle = "rgba(0,200,240,.4)";
    ctx.fillRect(scx + 10, y - 0.5, Math.max(0, th * 80), 1);
  }
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(scx, lo - 1, 1, hi - lo);
}
function dsSet() {
  if (!ds.cv) dsStart();
  if (!ds.cv) return;
  dsRead();
  dsDraw();
}
