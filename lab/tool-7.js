/* ══ T7: DOPPLER ══ */
function uD() {
  const z = parseFloat(document.getElementById("zs").value);
  const l0 = parseFloat(document.getElementById("ls").value);
  document.getElementById("zv").textContent = z.toFixed(2);
  document.getElementById("lv").textContent = l0.toFixed(0) + " nm";
  const lobs = l0 * (1 + z);
  const vcRatio = ((z + 1) ** 2 - 1) / ((z + 1) ** 2 + 1);
  const H0 = 67.4;
  const dist = ((vcRatio * 3e5) / H0) * 1000;
  const lb = (z * 3e5) / H0;
  document.getElementById("dv").innerHTML = lobs.toFixed(1) + "<span> nm</span>";
  document.getElementById("dvc").textContent = (vcRatio * 100).toFixed(1) + "% c";
  document.getElementById("ddist").textContent =
    dist > 1000 ? (dist / 1000).toFixed(1) + " Gpc" : dist.toFixed(0) + " Mpc";
  document.getElementById("dlb").textContent = lb.toFixed(0) + " Mly";
  document.getElementById("ddir").textContent =
    z > 0 ? t("t7.dir.receding") : z < 0 ? t("t7.dir.approaching") : t("t7.dir.stationary");
  drawDop(l0, lobs, z);
}
function setZ(val) {
  document.getElementById("zs").value = val;
  uD();
}
function nmToRgb(nm) {
  let r, g, b;
  if (nm < 380) return [0.5, 0, 0.5];
  else if (nm < 440) {
    r = (440 - nm) / 60;
    g = 0;
    b = 1;
  } else if (nm < 490) {
    r = 0;
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    r = 0;
    g = 1;
    b = (510 - nm) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
    b = 0;
  } else if (nm < 645) {
    r = 1;
    g = (645 - nm) / 65;
    b = 0;
  } else if (nm <= 780) {
    r = 1;
    g = 0;
    b = 0;
  } else return [0.5, 0, 0];
  return [r, g, b];
}
function drawDop(l0, lobs, z) {
  const c = document.getElementById("dop-canvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  const W = c.width,
    H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#020810";
  ctx.fillRect(0, 0, W, H);
  function drawWave(lam, y, amp, label) {
    const [r, g, b] = nmToRgb(lam);
    ctx.beginPath();
    ctx.strokeStyle = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
    ctx.lineWidth = 2;
    const freq = 400 / lam;
    for (let x = 0; x <= W; x++) {
      ctx.lineTo(x, y + amp * Math.sin(((x * freq * Math.PI) / W) * 20));
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},.7)`;
    ctx.font = "10px JetBrains Mono,monospace";
    ctx.fillText(label, 6, y - amp - 4);
  }
  drawWave(l0, H * 0.35, 18, `λ₀ = ${l0.toFixed(0)}nm`);
  drawWave(
    Math.min(780, Math.max(380, lobs)),
    H * 0.7,
    18,
    `λ_obs = ${lobs.toFixed(0)}nm (z=${z.toFixed(2)})`,
  );
  ctx.strokeStyle = "rgba(0,200,240,.15)";
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(0, H * 0.5);
  ctx.lineTo(W, H * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
}
