/* ══ T8: TELEPORTATION ══ */
function teleReset() {
  const log = document.getElementById("tele-log");
  log.innerHTML = `<div class="tele-line" style="color:var(--muted)">${t("t8.ready")}</div>`;
}
async function teleRun() {
  const log = document.getElementById("tele-log");
  log.innerHTML = "";
  const L = [];
  L.push(`<div>${t("t8.log.bell")}</div>`);
  L.push(`<div>${t("t8.log.qubit")}</div>`);
  L.push(`<div>${t("t8.log.step3")}</div>`);
  let bits = null;
  try {
    const o = await qBytes(2);
    bits = [o.bytes[0] & 1, o.bytes[1] & 1];
  } catch (e) {
    bits = [qRNG(0, 1), qRNG(0, 1)];
  }
  const m0 = bits[0],
    m1 = bits[1];
  L.push(`<div>${t("t8.log.measure").replace("{0}", m0).replace("{1}", m1)}</div>`);
  const corr = m0 && m1 ? "ZX" : m1 ? "X" : m0 ? "Z" : "I";
  L.push(
    `<div>${t("t8.log.corr").replace("{0}", corr === "I" ? t("t8.log.corr.none") : corr)}</div>`,
  );
  const qc = new Quantro.QuantumCircuit(3);
  qc.ry(2 * Math.acos(Math.sqrt(0.7)), 0);
  qc.h(1);
  qc.cx(1, 2);
  qc.cx(0, 1);
  qc.h(0);
  qc.cx(1, 2);
  qc.cz(0, 2);
  const counts = await Quantro.sampleDistributionQ(qc, 400);
  let one = 0,
    tot = 0;
  for (const k in counts) {
    tot += counts[k];
    if ((parseInt(k, 10) & 1) === 1) one += counts[k];
  }
  const obs = (one / tot).toFixed(3);
  L.push(`<div>${t("t8.log.step6").replace("{0}", obs)}</div>`);
  const ok = parseFloat(obs) >= 0.25 && parseFloat(obs) <= 0.35;
  L.push(`<span class="${ok ? "ok" : ""}">${ok ? t("t8.log.ok") : t("t8.log.no")}</span>`);
  let i = 0;
  const iv = setInterval(() => {
    if (i >= L.length) {
      clearInterval(iv);
      return;
    }
    const d = document.createElement("div");
    d.className = "tele-line";
    d.innerHTML = L[i++];
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }, 300);
}
