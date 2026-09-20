/* ══ T10: SCHRODINGER CAT ══ */
let catP = 0.5,
  catState = "super",
  catRaf = null,
  catT = 0,
  catLog = [];
function catSetP() {
  catP = +document.getElementById("cat-ps").value / 100;
  document.getElementById("cat-pv").textContent = Math.round(catP * 100) + "%";
  catT = 0;
  catDraw();
}
function catStart() {
  if (!document.getElementById("cat-canvas")._inited) {
    document.getElementById("cat-canvas")._inited = true;
    catDraw();
  }
}
function catReset() {
  catState = "super";
  catT = 0;
  document.getElementById("cat-go").disabled = false;
  document.getElementById("cat-go").innerHTML = t("t10.open");
  catDraw();
}
async function catOpen() {
  if (catState !== "super") {
    catReset();
    return;
  }
  document.getElementById("cat-go").disabled = true;
  const go = document.getElementById("cat-go");
  const settle = (rnd, label) => {
    const decayed = rnd < catP;
    catState = decayed ? "dead" : "alive";
    catLog.unshift({ alive: !decayed });
    if (catLog.length > 12) catLog.pop();
    go.innerHTML = decayed ? "💀 " + t("t10.open") : "🐱 " + t("t10.open");
    go.disabled = false;
    const el = document.getElementById("cat-src");
    if (el) el.textContent = label;
    catDraw();
    updateCatLog();
  };
  try {
    const rnd = await Qrng.prob();
    settle(rnd, t(Qrng.label()));
  } catch (e) {
    const j = await fetch("/api/anu?length=1")
      .then((r) => r.json())
      .catch(() => null);
    if (j && j.success && j.data && j.data[0] !== undefined)
      settle(j.data[0] / 255, t("stat.proxy"));
    else settle(Math.random(), t("stat.none"));
  }
}
function updateCatLog() {
  const alive = catLog.filter((x) => x.alive).length;
  const el = document.getElementById("cat-log2");
  el.innerHTML = `<div>${t("t10.log.ready")}</div><div style="margin-top:8px"><span>●</span> ${t("t10.canvas.stats.alive")}: ${alive} &nbsp; <span>●</span> ${t("t10.canvas.stats.dead")}: ${catLog.length - alive} &nbsp; <span>●</span> ${t("t10.canvas.stats.total")}: ${catLog.length}</div>`;
}
function catDraw() {
  const c = document.getElementById("cat-canvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  const W = (c.width = Math.max(280, c.clientWidth) * window.devicePixelRatio),
    dpr = window.devicePixelRatio || 1;
  const H = (c.height = 380 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = W / dpr,
    h = 380;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#040a14";
  ctx.fillRect(0, 0, w, h);
  catT += 0.03;
  const t = catT;
  const bx = w * 0.18,
    by = h * 0.12,
    bw = w * 0.64,
    bh = h * 0.62;

  /* radiation icon top-right */
  ctx.font = "16px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(0,200,240,.6)";
  ctx.fillText("☢ ¹³⁷Cs", bx + bw - 10, by + 10);

  /* box body */
  ctx.fillStyle = "rgba(9,20,38,.9)";
  ctx.strokeStyle = "rgba(0,200,240,.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();
  /* lid */
  roundRect(ctx, bx, by - 6, bw, 10, 4);
  ctx.fillStyle = "#0d1f35";
  ctx.fill();
  ctx.stroke();

  /* inside */
  const ix = bx + 18,
    iy = by + 22,
    iw = bw - 36,
    ih = bh - 42;
  ctx.strokeStyle = "rgba(0,200,240,.15)";
  roundRect(ctx, ix, iy, iw, ih, 4);
  ctx.stroke();

  /* atom */
  const ax = ix + 40,
    ay = iy + ih - 70;
  const pul = 0.6 + 0.4 * Math.sin(t * 3);
  ctx.globalAlpha = 0.25 + 0.35 * pul;
  ctx.fillStyle = "#00c8f0";
  ctx.beginPath();
  ctx.arc(ax, ay, 26, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#0d1f35";
  ctx.strokeStyle = "#00c8f0";
  ctx.beginPath();
  ctx.arc(ax, ay, 16, 0, 7);
  ctx.fill();
  ctx.stroke();
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#00c8f0";
  ctx.fillText(catState === "super" ? "?" : "✓", ax, ay + 4);

  /* flask */
  const fx = ix + iw / 2,
    fy = iy + ih - 40;
  ctx.fillStyle = "rgba(120,255,160,.15)";
  ctx.strokeStyle = "rgba(120,255,160,.5)";
  ctx.beginPath();
  ctx.moveTo(fx - 12, fy - 58);
  ctx.lineTo(fx + 12, fy - 58);
  ctx.lineTo(fx + 14, fy - 22);
  ctx.quadraticCurveTo(fx + 22, fy + 4, fx, fy + 12);
  ctx.quadraticCurveTo(fx - 22, fy + 4, fx - 14, fy - 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = catState === "dead" ? "rgba(255,90,90,.6)" : "rgba(120,255,160,.5)";
  ctx.beginPath();
  ctx.ellipse(fx, fy - 8, 9, 4, 0, 0, 7);
  ctx.fill();

  /* cat */
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cxm = ix + iw - 78,
    cym = iy + ih - 44;
  if (catState === "super") {
    ctx.save();
    ctx.filter = "blur(2px)";
    ctx.globalAlpha = 0.55;
    ctx.font = "64px serif";
    ctx.fillText("🐱", cxm - 8 + 4 * Math.sin(t * 2), cym - 4);
    ctx.globalAlpha = 0.55;
    ctx.fillText("😿", cxm + 8 - 4 * Math.sin(t * 2), cym + 2);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.font = "bold 30px monospace";
    ctx.fillStyle = "rgba(0,200,240,.8)";
    ctx.fillText("|ψ⟩ = ?", ix + iw / 2, iy + 30);
  } else {
    ctx.font = "68px serif";
    if (catState === "alive") {
      ctx.fillText("🐱", cxm, cym);
    } else {
      ctx.save();
      ctx.translate(cxm, cym);
      ctx.rotate(0.02);
      ctx.fillText("😿", 0, 0);
      ctx.restore();
    }
    ctx.font = "bold 22px monospace";
    ctx.fillStyle = catState === "alive" ? "#7dffb0" : "#ff6b6b";
    ctx.fillText(
      catState === "alive" ? t("t10.canvas.alive.label") : t("t10.canvas.dead.label"),
      ix + iw / 2,
      iy + 30,
    );
  }

  /* status footer */
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(232,237,245,.45)";
  ctx.fillText(
    catState === "super" ? t("t10.canvas.detector.paused") : t("t10.canvas.detector.collapsed"),
    w / 2,
    h - 18,
  );

  if (catState === "super") {
    catRaf = requestAnimationFrame(catDraw);
  }
}
