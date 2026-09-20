/* ══ T6: BLACK HOLE ══ */
window.bhInit = false;
let bhRenderer,
  bhScene,
  bhCamera,
  bhMeshes = [];
function uBH() {
  const M = parseFloat(document.getElementById("bh-mass").value) || 10;
  const Ms = 1.989e30;
  const G = 6.674e-11;
  const c = 3e8;
  const hbar = 1.055e-34;
  const kB = 1.38e-23;
  const rs = (2 * G * M * Ms) / (c * c);
  const T = (hbar * c * c * c) / (8 * Math.PI * G * M * Ms * kB);
  const S = (4 * Math.PI * G * M * Ms * M * Ms) / (hbar * c);
  const fmt = (v, u) => {
    if (Math.abs(v) > 1e12) return (v / 1e12).toFixed(2) + " T" + u;
    if (Math.abs(v) > 1e9) return (v / 1e9).toFixed(2) + " G" + u;
    if (Math.abs(v) > 1e6) return (v / 1e6).toFixed(2) + " M" + u;
    if (Math.abs(v) > 1e3) return (v / 1e3).toFixed(2) + " k" + u;
    return v.toExponential(2) + " " + u;
  };
  document.getElementById("bh-rs").textContent = fmt(rs, "m");
  document.getElementById("bh-temp").textContent =
    T < 1e-10 ? T.toExponential(2) + " K" : fmt(T, "K");
  document.getElementById("bh-ent").textContent = S.toExponential(2) + " J/K";
  if (window.bhInit) animateBH();
}
function initBHInner() {
  window.bhInit = true;
  const canvas = document.getElementById("bh-canvas");
  if (!canvas || !window.THREE) return;
  const S = window.bh || {};
  if (S.raf) {
    cancelAnimationFrame(S.raf);
    try {
      S.r.dispose();
    } catch (e) {}
  }
  if (S.cleanup)
    try {
      S.cleanup();
    } catch (e) {}
  window.bhLost = false;
  bhRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  bhRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  bhRenderer.setSize(canvas.clientWidth, 320);
  bhRenderer.setClearColor(0x020810, 1);
  bhScene = new THREE.Scene();
  bhCamera = new THREE.PerspectiveCamera(50, canvas.clientWidth / 320, 0.1, 1000);
  bhCamera.position.set(0, 8, 20);
  bhCamera.lookAt(0, 0, 0);
  bhScene.fog = new THREE.FogExp2(0x020810, 0.02);

  // Black hole sphere
  const bhSph = new THREE.Mesh(
    new THREE.SphereGeometry(2, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  bhScene.add(bhSph);

  // Event horizon glow ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.1, 2.6, 64),
    new THREE.MeshBasicMaterial({
      color: 0x00c8f0,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  bhScene.add(ring);

  // Accretion disk
  for (let i = 0; i < 3; i++) {
    const r1 = 3 + i * 1.5,
      r2 = r1 + 1.2;
    const disk = new THREE.Mesh(
      new THREE.RingGeometry(r1, r2, 64),
      new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x00c8f0 : i === 1 ? 0x4060ff : 0xff8800,
        transparent: true,
        opacity: 0.3 - i * 0.07,
        side: THREE.DoubleSide,
      }),
    );
    disk.rotation.x = Math.PI / 2 + i * 0.05;
    bhScene.add(disk);
    bhMeshes.push(disk);
  }

  // Particles
  const pN = 800,
    pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pN * 3),
    pCol = new Float32Array(pN * 3);
  for (let i = 0; i < pN; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 8;
    const h = (Math.random() - 0.5) * 0.5;
    pPos[i * 3] = Math.cos(a) * r;
    pPos[i * 3 + 1] = h;
    pPos[i * 3 + 2] = Math.sin(a) * r;
    const b = Math.random();
    if (b > 0.6) {
      pCol[i * 3] = 0;
      pCol[i * 3 + 1] = 0.78;
      pCol[i * 3 + 2] = 0.94;
    } else {
      pCol[i * 3] = 1;
      pCol[i * 3 + 1] = 0.5 + b * 0.5;
      pCol[i * 3 + 2] = b * 0.3;
    }
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const bhPts = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.7 }),
  );
  bhScene.add(bhPts);
  bhMeshes.push(bhPts);
  bhMeshes.push(ring);

  let drag = false,
    ox = 0,
    oy = 0,
    rY = 0;
  const h = {
    md: (e) => {
      drag = true;
      ox = e.clientX;
    },
    ts: (e) => {
      drag = true;
      ox = e.touches[0].clientX;
    },
    mu: () => {
      drag = false;
    },
    tu: () => {
      drag = false;
    },
    mm: (e) => {
      if (drag) ((rY += (e.clientX - ox) * 0.01), (ox = e.clientX));
    },
    tm: (e) => {
      if (drag) ((rY += (e.touches[0].clientX - ox) * 0.01), (ox = e.touches[0].clientX));
    },
  };
  h.lost = () => {
    window.bhLost = true;
  };
  h.restore = () => {
    window.bhLost = false;
    setTimeout(() => {
      try {
        initBH();
      } catch (e) {}
    }, 20);
  };
  h.vis = () => {
    if (!document.hidden)
      setTimeout(() => {
        if (window.bhLost)
          try {
            initBH();
          } catch (e) {}
        else if (window.bh) {
          try {
            window.bh.r.render(window.bh.scene, window.bh.cam);
          } catch (e) {}
        }
      }, 30);
  };
  h.cleanup = () => {
    canvas.removeEventListener("mousedown", h.md);
    canvas.removeEventListener("touchstart", h.ts);
    window.removeEventListener("mouseup", h.mu);
    window.removeEventListener("touchend", h.tu);
    window.removeEventListener("mousemove", h.mm);
    window.removeEventListener("touchmove", h.tm);
    canvas.removeEventListener("webglcontextlost", h.lost);
    canvas.removeEventListener("webglcontextrestored", h.restore);
    document.removeEventListener("visibilitychange", h.vis);
  };
  canvas.addEventListener("mousedown", h.md);
  canvas.addEventListener("touchstart", h.ts, { passive: true });
  window.addEventListener("mouseup", h.mu);
  window.addEventListener("touchend", h.tu);
  window.addEventListener("mousemove", h.mm);
  window.addEventListener("touchmove", h.tm, { passive: true });
  canvas.addEventListener("webglcontextlost", h.lost, false);
  canvas.addEventListener("webglcontextrestored", h.restore, false);
  document.addEventListener("visibilitychange", h.vis, { passive: true });

  function anim() {
    state.raf = requestAnimationFrame(anim);
    if (window.bhLost) return;
    if (mq.matches) return;
    bhMeshes[0].rotation.y += 0.01;
    bhMeshes[1].rotation.y += 0.008;
    bhMeshes[2].rotation.y += 0.006;
    bhMeshes[3].rotation.y += 0.004;
    bhScene.rotation.y += 0.003 + rY * 0.05;
    rY *= 0.95;
    try {
      bhRenderer.render(bhScene, bhCamera);
    } catch (e) {
      window.bhLost = true;
    }
  }
  const state = { r: bhRenderer, scene: bhScene, cam: bhCamera };
  state.raf = requestAnimationFrame(anim);
  state.cleanup = h.cleanup;
  window.bh = state;
  if (mq.matches)
    try {
      bhRenderer.render(bhScene, bhCamera);
    } catch (e) {}
  uBH();
}
function initBH() {
  try {
    initBHInner();
  } catch (e) {
    window.bhLost = true;
  }
}
function bhFail(on) {
  const c = document.getElementById("bh-canvas");
  if (!c) return;
  if (on)
    c.style.background =
      "radial-gradient(100% 100% at 50% 30%,#0a1a3a 0%,#04101f 60%,#01060c 100%)";
  else c.style.background = "";
}
function bhWatch() {
  const canvas = document.getElementById("bh-canvas");
  if (!canvas) return;
  if (!window.THREE) {
    window.bhFails = (window.bhFails || 0) + 1;
    if (window.bhFails > 2) bhFail(true);
    return;
  }
  const S = window.bh;
  if (!S) {
    if (window.bhInit && !window.bhBusy) {
      window.bhBusy = true;
      initBH();
      if (!window.bh) {
        window.bhFails = (window.bhFails || 0) + 1;
        if (window.bhFails > 2) bhFail(true);
      } else {
        window.bhFails = 0;
        bhFail(false);
      }
      window.bhBusy = false;
    }
    return;
  }
  let gl = null;
  try {
    gl = S.r && S.r.getContext ? S.r.getContext() : null;
  } catch (e) {}
  const lost = !!(gl && typeof gl.isContextLost === "function" && gl.isContextLost());
  if (lost) {
    if (!window.bhBusy) {
      window.bhBusy = true;
      window.bhLost = true;
      initBH();
      if (!window.bh) {
        window.bhFails = (window.bhFails || 0) + 1;
        if (window.bhFails > 2) bhFail(true);
      } else {
        window.bhFails = 0;
        bhFail(false);
      }
      setTimeout(() => {
        window.bhBusy = false;
      }, 2000);
    }
  } else {
    window.bhBusy = false;
    if (window.bhFails) {
      window.bhFails = 0;
      bhFail(false);
    }
    if (window.bhLost) window.bhLost = false;
  }
}
if (!window.bhWatch) {
  window.bhWatch = setInterval(bhWatch, 2500);
}
function animateBH() {}
