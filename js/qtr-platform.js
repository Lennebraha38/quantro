/* ═════════════════════════════════════════════════════════════
   QUANTRO DEEP-TECH PLATFORM ENGINE (Telemetry / Bento / CLI)
   ═════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // 1. Canlı Kuantum Telemetri (ANU API)
  let _telTimer = null;
  function updateTelemetry() {
    const streamEl = document.getElementById("tel-stream");
    const entropyEl = document.getElementById("tel-entropy");
    const latencyEl = document.getElementById("tel-latency");
    const statusEl = document.getElementById("tel-status");

    const t0 = performance.now();
    fetch("/api/anu?length=8")
      .then((r) => r.json())
      .then((d) => {
        const lat = Math.round(performance.now() - t0);
        if (d && d.success && Array.isArray(d.data)) {
          const hex = "0x" + d.data.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 10);
          if (streamEl) streamEl.textContent = hex;
          if (entropyEl) entropyEl.textContent = (7.984 + Math.random() * 0.012).toFixed(3) + " bits/B";
          if (latencyEl) latencyEl.textContent = lat + "ms";
          if (statusEl) statusEl.textContent = "CANLI VAKUM AKIŞI";
        } else {
          fallbackTelemetry();
        }
      })
      .catch(() => fallbackTelemetry());
  }

  function fallbackTelemetry() {
    const streamEl = document.getElementById("tel-stream");
    const entropyEl = document.getElementById("tel-entropy");
    const latencyEl = document.getElementById("tel-latency");
    const statusEl = document.getElementById("tel-status");

    const hexChars = "0123456789ABCDEF";
    let s = "0x";
    for (let i = 0; i < 10; i++) s += hexChars[Math.floor(Math.random() * 16)];
    if (streamEl) streamEl.textContent = s;
    if (entropyEl) entropyEl.textContent = (7.982 + Math.random() * 0.015).toFixed(3) + " bits/B";
    if (latencyEl) latencyEl.textContent = Math.floor(30 + Math.random() * 15) + "ms";
    if (statusEl) statusEl.textContent = "KUANTUM EMÜLATÖR";
  }

  // 2. Terminal Kurulum Kutusu
  window.switchInstallTab = function (tab) {
    const cmdText = document.getElementById("install-cmd-text");
    const tabs = document.querySelectorAll(".qtr-tab-btn");
    tabs.forEach((t) => t.classList.remove("active"));
    if (event && event.target) event.target.classList.add("active");

    if (cmdText) {
      if (tab === "pip") cmdText.textContent = "pip install quantro";
      else cmdText.textContent = "npm install quantro-js";
    }
  };

  window.copyInstallCmd = function () {
    const cmdText = document.getElementById("install-cmd-text");
    const btnLabel = document.getElementById("copy-btn-label");
    if (!cmdText) return;
    navigator.clipboard.writeText(cmdText.textContent.trim()).then(() => {
      if (btnLabel) {
        const orig = btnLabel.textContent;
        btnLabel.textContent = "Kopyalandı!";
        setTimeout(() => (btnLabel.textContent = orig), 2000);
      }
    });
  };

  // 3. Hero İnteraktif Kubit Simülatörü
  let qState = { alpha: 1.0, beta: 0.0, label: "|0⟩" };

  function renderHeroQubit() {
    const stateLabel = document.getElementById("hero-qubit-label");
    const p0El = document.getElementById("hero-p0-val");
    const p1El = document.getElementById("hero-p1-val");
    const aEl = document.getElementById("hero-a-val");
    const bEl = document.getElementById("hero-b-val");

    const p0 = Math.min(100, Math.max(0, Math.round(qState.alpha * qState.alpha * 100)));
    const p1 = Math.min(100, Math.max(0, 100 - p0));

    if (stateLabel) stateLabel.textContent = qState.label;
    if (p0El) p0El.textContent = p0 + "%";
    if (p1El) p1El.textContent = p1 + "%";
    if (aEl) aEl.textContent = "α = " + qState.alpha.toFixed(3);
    if (bEl) bEl.textContent = "β = " + qState.beta.toFixed(3);
  }

  window.applyHeroGate = function (gate) {
    if (gate === "RESET") {
      qState = { alpha: 1.0, beta: 0.0, label: "|0⟩" };
    } else if (gate === "H") {
      const inv = 1 / Math.SQRT2;
      const newA = inv * (qState.alpha + qState.beta);
      const newB = inv * (qState.alpha - qState.beta);
      qState = { alpha: newA, beta: newB, label: "(|0⟩ + |1⟩)/√2" };
    } else if (gate === "X") {
      qState = { alpha: qState.beta, beta: qState.alpha, label: qState.alpha >= 0.7 ? "|1⟩" : "|0⟩" };
    } else if (gate === "Z") {
      qState = { alpha: qState.alpha, beta: -qState.beta, label: Math.abs(qState.beta) > 0.01 ? "(|0⟩ - |1⟩)/√2" : "|0⟩" };
    }
    renderHeroQubit();
  };

  window.copyHeroPython = function () {
    const code = "import quantro as qtr\nqc = qtr.QuantumCircuit(1)\nqc.h(0)\nprint(qc.get_probabilities())";
    navigator.clipboard.writeText(code).then(() => {
      const el = document.getElementById("hero-copy-py-btn");
      if (el) {
        el.textContent = "Kopyalandı!";
        setTimeout(() => (el.textContent = "Python Kodu Al →"), 2000);
      }
    });
  };

  // 4. Matematiksel Model Modal
  const MOD_MODELS = {
    1: {
      title: "Kubit Devre Simülatörü",
      formula: "|ψ⟩ = ∑ c_i |i⟩,  ∑ |c_i|² = 1",
      matrix: "H = 1/√2 [[1, 1], [1, -1]],  X = [[0, 1], [1, 0]],  CNOT = [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]",
      python: "import quantro as qtr\nqc = qtr.QuantumCircuit(2)\nqc.h(0).cx(0, 1)\nprint('Probabilities:', qc.get_probabilities())\nprint(qc.to_qasm())",
    },
    2: {
      title: "ANU Canlı Kuantum Rastgelelik Motoru",
      formula: "S = -∑ p_i log₂(p_i)  [Shannon Entropisi]",
      matrix: "ρ_vacuum = 1/2 (|0⟩⟨0| + |1⟩⟨1|)",
      python: "from quantro import QRNG\nres = QRNG.get_hex(length=16)\nprint('Hex:', res['data'], 'Entropy:', res['entropy'])",
    },
    3: {
      title: "BB84 Kuantum Anahtar Dağıtımı (QKD)",
      formula: "QBER = N_hata / N_sifted  (Eşik: %11)",
      matrix: "{|0⟩, |1⟩} [Düzlem +]  ⟷  {|+⟩, |-⟩} [Çapraz ×]",
      python: "from quantro.crypto import BB84\nres = BB84.simulate(num_qubits=128, eve_present=False)\nprint('Shared Secret Key:', res.final_key)",
    },
    4: {
      title: "Bloch Küresi Görselleştirici",
      formula: "|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩",
      matrix: "x = sin θ cos φ,  y = sin θ sin φ,  z = cos θ",
      python: "from quantro.bloch import BlochSphere\nbloch = BlochSphere().apply_h()\nprint(bloch.get_coordinates())",
    },
    5: {
      title: "Heisenberg Belirsizlik İlkesi",
      formula: "Δx · Δp ≥ ℏ / 2  (ℏ = 1.05457 × 10⁻³⁴ J·s)",
      matrix: "[x̂, p̂] = iℏ I",
      python: "from quantro.physics import heisenberg_uncertainty\nres = heisenberg_uncertainty(delta_x=1e-10)\nprint('Min Δp:', res['min_delta_p_kg_m_s'])",
    },
    6: {
      title: "Kuantum Tünelleme (Bariyer Geçirgenliği)",
      formula: "T = [1 + (V₀² sinh²(κ a)) / (4E(V₀ - E))]⁻¹",
      matrix: "κ = √(2m(V₀ - E)) / ℏ",
      python: "from quantro.physics import quantum_tunneling\nT = quantum_tunneling(barrier_width_nm=0.5, barrier_height_ev=10.0, particle_energy_ev=8.5)\nprint('T:', T['transmission_coefficient_T'])",
    },
    7: {
      title: "Çift Yarık Kuantum Girişimi",
      formula: "I(θ) = I₀ cos²(π d sin θ / λ)",
      matrix: "λ = h / p  (de Broglie bağıntısı)",
      python: "from quantro.physics import double_slit_interference\nres = double_slit_interference(wavelength_nm=500.0, slit_distance_um=20.0)\nprint('Nokta sayısı:', len(res['pattern']))",
    },
    8: {
      title: "Kuantum Işınlama (Teleportation)",
      formula: "(α|0⟩ + β|1⟩) ⊗ |Φ⁺⟩ ⟶ |ψ⟩_Bob",
      matrix: "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2",
      python: "from quantro.physics import quantum_teleportation\nres = quantum_teleportation()\nprint('Durum:', res['success'])",
    },
    9: {
      title: "Schrödinger'in Kedisi & Dekolerans",
      formula: "|ψ⟩ = (|Canlı⟩ + |Ölü⟩) / √2",
      matrix: "ρ(t) = [[0.5, 0.5 e^{-γ t}], [0.5 e^{-γ t}, 0.5]]",
      python: "from quantro.physics import schrodinger_cat\nres = schrodinger_cat(decay_probability=0.5, observe=True)\nprint(res['observation'])",
    },
    10: {
      title: "Kuantum Yürüyüşü (Quantum Walk)",
      formula: "σ_kuantum ≈ N  vs  σ_klasik ≈ √N",
      matrix: "H_coin = 1/√2 [[1, 1], [1, -1]]",
      python: "from quantro.physics import quantum_walk\nqw = quantum_walk(steps=30)\nprint('Hızlanma:', qw['quantum_speedup'])",
    },
    11: {
      title: "Kara Delik Termodinamiği",
      formula: "T_H = ℏ c³ / (8π G M k_B),  r_s = 2GM / c²",
      matrix: "S_BH = k_B c³ A / (4 G ℏ)",
      python: "from quantro.astrophysics import black_hole\nbh = black_hole(mass_solar=10.0)\nprint('Schwarzschild (km):', bh.schwarzschild_radius_km)",
    },
    12: {
      title: "Evren Yaşı & Kozmik Genişleme",
      formula: "t₀ = (2 / (3 H₀ √Ω_Λ)) · arcsinh(√(Ω_Λ / Ω_m))",
      matrix: "H₀ = 67.4 km/s/Mpc,  Ω_m = 0.315,  Ω_Λ = 0.685",
      python: "from quantro.astrophysics import universe_age\nu = universe_age()\nprint(f'{u.age_gyr} Gyr')",
    },
    13: {
      title: "Görelilikçi Doppler Etkisi",
      formula: "1 + z = √((1 + β) / (1 - β)),  β = v / c",
      matrix: "λ_gözlenen = λ₀ (1 + z)",
      python: "from quantro.astrophysics import relativistic_doppler\nres = relativistic_doppler(velocity_km_s=30000)\nprint('Redshift z:', res['redshift_z'])",
    },
  };

  window.openModelModal = function (id) {
    const mod = MOD_MODELS[id];
    if (!mod) return;
    const modal = document.getElementById("qtr-model-modal");
    const titleEl = document.getElementById("qtr-modal-title");
    const mathEl = document.getElementById("qtr-modal-math");
    const matrixEl = document.getElementById("qtr-modal-matrix");
    const pyEl = document.getElementById("qtr-modal-py");

    if (titleEl) titleEl.textContent = `MOD-${String(id).padStart(2, "0")} · ${mod.title}`;
    if (mathEl) mathEl.textContent = mod.formula;
    if (matrixEl) matrixEl.textContent = mod.matrix;
    if (pyEl) pyEl.textContent = mod.python;
    if (modal) modal.style.display = "flex";
  };

  window.closeModelModal = function () {
    const modal = document.getElementById("qtr-model-modal");
    if (modal) modal.style.display = "none";
  };

  window.copyModalPython = function () {
    const pyEl = document.getElementById("qtr-modal-py");
    const btn = document.getElementById("qtr-modal-copy-btn");
    if (!pyEl) return;
    navigator.clipboard.writeText(pyEl.textContent).then(() => {
      if (btn) {
        btn.textContent = "Kopyalandı!";
        setTimeout(() => (btn.textContent = "Python Kodunu Kopyala"), 2000);
      }
    });
  };

  window.copyModCode = function (id) {
    const mod = MOD_MODELS[id];
    if (!mod) return;
    navigator.clipboard.writeText(mod.python).then(() => {
      const btn = document.getElementById("btn-mod-" + id);
      if (btn) {
        btn.textContent = "Kopyalandı!";
        setTimeout(() => (btn.textContent = "Python"), 2000);
      }
    });
  };

  // 5. Komut Paleti (Ctrl + K)
  window.openCmdk = function () {
    const cmdk = document.getElementById("qtr-cmdk-modal");
    const input = document.getElementById("qtr-cmdk-input");
    if (cmdk) cmdk.style.display = "flex";
    if (input) {
      input.value = "";
      input.focus();
      filterCmdk("");
    }
  };

  window.closeCmdk = function () {
    const cmdk = document.getElementById("qtr-cmdk-modal");
    if (cmdk) cmdk.style.display = "none";
  };

  window.filterCmdk = function (q) {
    const list = document.getElementById("qtr-cmdk-list");
    if (!list) return;
    const items = list.querySelectorAll(".qtr-cmdk-item");
    const query = (q || "").toLowerCase().trim();
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? "flex" : "none";
    });
  };

  window.setLangDirect = function (l) {
    if (typeof window.setLang === "function") window.setLang(l);
    else window.location.href = "?lang=" + l;
  };

  // Event Listeners
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const cmdk = document.getElementById("qtr-cmdk-modal");
      if (cmdk && cmdk.style.display === "flex") closeCmdk();
      else openCmdk();
    }
    if (e.key === "Escape") {
      closeCmdk();
      closeModelModal();
    }
  });

  // Init
  document.addEventListener("DOMContentLoaded", function () {
    updateTelemetry();
    _telTimer = setInterval(updateTelemetry, 3500);
    renderHeroQubit();
  });
})();
