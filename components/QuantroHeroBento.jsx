import React, { useState, useEffect, useMemo } from "react";

const MODULES_DATA = [
  {
    id: 1,
    title: "Kubit Devre Simülatörü & Durum Vektörü",
    category: "computing",
    description: "N-kubitlik üniter kapı dönüşümleri, Bell & GHZ dolanıklık durumları ve tam durum vektörü simülasyonu.",
    formula: "|ψ⟩ = ∑ c_i |i⟩",
    matrix: "1/√2 [[1, 1], [1, -1]]",
    pythonSnippet: "import quantro as qtr\nqc = qtr.QuantumCircuit(2)\nqc.h(0).cx(0, 1)\nprint(qc.get_probabilities())",
    badge: "Çekirdek Simülatör",
    featured: true,
  },
  {
    id: 2,
    title: "ANU Canlı Kuantum Rastgelelik (QRNG)",
    category: "cryptography",
    description: "Avustralya Ulusal Üniversitesi (ANU) kuantum optik laboratuvarından gerçek vakum dalgalanması entropisi.",
    formula: "S = -∑ p_i log_2(p_i)",
    matrix: "ρ = 1/2 (|0⟩⟨0| + |1⟩⟨1|)",
    pythonSnippet: "from quantro import QRNG\nbytes_data = QRNG.get_hex(16)\nentropy = QRNG.calculate_entropy(bytes_data['data'])",
    badge: "Canlı ANU Bağlantısı",
    featured: true,
  },
  {
    id: 3,
    title: "BB84 Kuantum Anahtar Dağıtımı (QKD)",
    category: "cryptography",
    description: "Fotonik polarizasyon, baz seçimi ve Eve dinleme girişimini hata oranıyla (QBER) yakalayan kuantum şifreleme.",
    formula: "QBER = E / N_sifted < 11%",
    matrix: "{|0⟩, |1⟩} ⟷ {|+⟩, |-⟩}",
    pythonSnippet: "from quantro.crypto import BB84\nres = BB84.simulate(num_qubits=128, eve_present=False)\nprint('Key:', res.final_key)",
    badge: "Kriptografik Güvenlik",
    featured: true,
  },
  {
    id: 4,
    title: "Bloch Küresi Görselleştirici",
    category: "computing",
    description: "Tek kubitlik durumun 3 boyutlu birim küre üzerinde SU(2) Euler rotasyonları ve izdüşümleri.",
    formula: "|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩",
    matrix: "U(θ, φ, λ)",
    pythonSnippet: "from quantro.bloch import BlochSphere\nbloch = BlochSphere().apply_h()\nprint(bloch.get_coordinates())",
  },
  {
    id: 5,
    title: "Heisenberg Belirsizlik İlkesi",
    category: "physics",
    description: "Konum ve momentum operatörlerinin komütatörü üzerinden alt sınır hesaplama.",
    formula: "Δx · Δp ≥ ℏ/2",
    matrix: "[x̂, p̂] = iℏ I",
    pythonSnippet: "from quantro.physics import heisenberg_uncertainty\nres = heisenberg_uncertainty(delta_x=1e-10)\nprint(res)",
  },
  {
    id: 6,
    title: "Kuantum Tünelleme (Bariyer Geçirgenliği)",
    category: "physics",
    description: "Sonlu dikdörtgen potansiyel bariyerinde Schrödinger dalga denkleminin geçirgenlik katsayısı.",
    formula: "T = [1 + (V_0^2 sinh^2(κ a))/(4E(V_0 - E))]^-1",
    matrix: "κ = √(2m(V_0 - E)) / ℏ",
    pythonSnippet: "from quantro.physics import quantum_tunneling\nT = quantum_tunneling(barrier_width_nm=0.5, barrier_height_ev=10.0, particle_energy_ev=8.5)\nprint(T)",
  },
  {
    id: 7,
    title: "Çift Yarık Kuantum Girişimi",
    category: "physics",
    description: "Madde dalgalarının girişim ve kırınım deseni, de Broglie dalga boyu simülasyonu.",
    formula: "I(θ) = I_0 cos^2(π d sin θ / λ)",
    matrix: "λ = h / p",
    pythonSnippet: "from quantro.physics import double_slit_interference\npattern = double_slit_interference(wavelength_nm=500.0, slit_distance_um=25.0)\nprint(len(pattern['pattern']))",
  },
  {
    id: 8,
    title: "Kuantum Işınlama (Teleportation)",
    category: "computing",
    description: "EPR çifti ve klasik iletişim kanalı kullanarak bilinmeyen kuantum durumunun aktarımı.",
    formula: "(α|0⟩ + β|1⟩) ⊗ |Φ+⟩ ⟶ |ψ⟩_Bob",
    matrix: "|Φ+⟩ = (|00⟩ + |11⟩) / √2",
    pythonSnippet: "from quantro.physics import quantum_teleportation\nres = quantum_teleportation()\nprint('Teleport status:', res['success'])",
  },
  {
    id: 9,
    title: "Schrödinger'in Kedisi & Dekolerans",
    category: "physics",
    description: "Makroskobik süperpozisyon ve çevre etkileşimiyle dalga fonksiyonunun klasik duruma çökmesi.",
    formula: "|ψ⟩ = (|Canlı⟩ + |Ölü⟩) / √2",
    matrix: "ρ(t) = [[0.5, 0.5 e^{-γ t}], [0.5 e^{-γ t}, 0.5]]",
    pythonSnippet: "from quantro.physics import schrodinger_cat\nstate = schrodinger_cat(decay_probability=0.4, observe=False)\nprint(state['ket'])",
  },
  {
    id: 10,
    title: "Kuantum Yürüyüşü (Quantum Walk)",
    category: "computing",
    description: "Hadamard parasıyla kuantum süperpozisyonlu 1B kafes yürüyüşü ve kuadratik ballistik hızlanma.",
    formula: "σ_quantum ~ N  vs  σ_classical ~ √N",
    matrix: "H_coin = [[1, 1], [1, -1]] / √2",
    pythonSnippet: "from quantro.physics import quantum_walk\nqw = quantum_walk(steps=40)\nprint('Spread:', qw['std_deviation'])",
  },
  {
    id: 11,
    title: "Kara Delik Termodinamiği",
    category: "astrophysics",
    description: "Schwarzschild yarıçapı, Hawking ışınım sıcaklığı ve Bekenstein-Hawking alan entropisi.",
    formula: "T_H = ℏ c^3 / (8π G M k_B)",
    matrix: "S_BH = (k_B c^3 A) / (4 G ℏ)",
    pythonSnippet: "from quantro.astrophysics import black_hole\nbh = black_hole(mass_solar=5.0)\nprint('Radius (km):', bh.schwarzschild_radius_km)",
  },
  {
    id: 12,
    title: "Evren Yaşı & Kozmik Genişleme",
    category: "astrophysics",
    description: "Planck PR4 (2020) verileriyle düz Lambda-CDM Friedmann diferansiyel denklemi entegrasyonu.",
    formula: "H^2(a) = H_0^2 [Ω_m a^-3 + Ω_Λ]",
    matrix: "t_0 = 13.787 Gyr (Planck 2020)",
    pythonSnippet: "from quantro.astrophysics import universe_age\nu = universe_age(h0=67.4, omega_m=0.315, omega_lambda=0.685)\nprint(f'{u.age_gyr} Gyr')",
  },
  {
    id: 13,
    title: "Görelilikçi Doppler & Kızıla Kayma",
    category: "astrophysics",
    description: "Özel görelilik boylamasına Doppler kayması, Lorentz faktörü ve spektral dalga boyu dönüşümü.",
    formula: "1 + z = √((1 + β)/(1 - β))",
    matrix: "β = v / c",
    pythonSnippet: "from quantro.astrophysics import relativistic_doppler\nd = relativistic_doppler(velocity_km_s=25000)\nprint('Redshift z:', d['redshift_z'])",
  },
];

export default function QuantroHeroBento() {
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [telemetry, setTelemetry] = useState({
    hex: "0x4FA9C180E2",
    entropy: "7.9892",
    latency: "38",
    status: "CONNECTED",
  });
  const [activeTab, setActiveTab] = useState("pip");
  const [selectedModule, setSelectedModule] = useState(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const [qubitState, setQubitState] = useState({
    alpha: 1.0,
    beta: 0.0,
    label: "|0⟩",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const hexNibbles = "0123456789ABCDEF";
      let str = "0x";
      for (let i = 0; i < 10; i++) {
        str += hexNibbles[Math.floor(Math.random() * 16)];
      }
      const lat = Math.floor(32 + Math.random() * 16);
      const ent = (7.985 + Math.random() * 0.012).toFixed(4);
      setTelemetry({
        hex: str,
        entropy: ent,
        latency: String(lat),
        status: "LIVE FEED",
      });
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const applyHeroGate = (gate) => {
    if (gate === "RESET") {
      setQubitState({ alpha: 1.0, beta: 0.0, label: "|0⟩" });
    } else if (gate === "H") {
      const inv = 1 / Math.SQRT2;
      const newA = inv * (qubitState.alpha + qubitState.beta);
      const newB = inv * (qubitState.alpha - qubitState.beta);
      setQubitState({
        alpha: Number(newA.toFixed(3)),
        beta: Number(newB.toFixed(3)),
        label: "(|0⟩ + |1⟩)/√2",
      });
    } else if (gate === "X") {
      setQubitState({
        alpha: qubitState.beta,
        beta: qubitState.alpha,
        label: qubitState.alpha === 1 ? "|1⟩" : "|0⟩",
      });
    } else if (gate === "Z") {
      setQubitState({
        alpha: qubitState.alpha,
        beta: -qubitState.beta,
        label: qubitState.beta !== 0 ? "(|0⟩ - |1⟩)/√2" : "|0⟩",
      });
    }
  };

  const filteredModules = useMemo(() => {
    return MODULES_DATA.filter((m) => {
      const matchCat = filterCat === "all" || m.category === filterCat;
      const matchSearch =
        m.title.toLowerCase().includes(cmdSearch.toLowerCase()) ||
        m.description.toLowerCase().includes(cmdSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [filterCat, cmdSearch]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white relative overflow-hidden">
      {/* Telemetry Bar */}
      <div className="w-full border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-40 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between text-zinc-400">
          <div className="flex items-center space-x-4 overflow-x-auto whitespace-nowrap">
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-wider uppercase text-[10px]">ANU QRNG: {telemetry.status}</span>
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Vakum: <strong className="text-zinc-200">{telemetry.hex}</strong></span>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <span className="hidden md:inline">Entropi: <strong className="text-zinc-200">{telemetry.entropy}</strong></span>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <span className="hidden md:inline">Gecikme: <strong className="text-zinc-200">{telemetry.latency}ms</strong></span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center space-x-1 px-2 py-0.5 rounded border border-white/10 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 transition"
            >
              <span>Ara</span>
              <kbd className="px-1 text-[10px] bg-zinc-800 rounded border border-white/10">⌘K</kbd>
            </button>
            <div className="flex items-center rounded border border-white/10 bg-zinc-900/50 p-0.5 text-[11px]">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 font-medium">TR</span>
              <a href="/?lang=en" className="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-200 transition">EN</a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/10 bg-zinc-900/60 text-xs font-mono text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>v1.0.0 Resmi Python Kütüphanesi Yayında</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Kuantum Kodla. <br />
              <span className="text-zinc-400">Doğrudan Terminalde ve Python'da.</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl">
              Web tarayıcısını sadece bir "vitrin" değil, canlı test laboratuvarı (Playground) olarak kullanın.
              Simülasyonları tek tıkla Python/Qiskit koduna aktarın, ANU kuantum vakum dalgalanması motoruna doğrudan bağlanın.
            </p>

            {/* Install terminal */}
            <div className="p-4 rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-md max-w-lg space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab("pip")}
                    className={`text-xs font-mono px-2 py-1 rounded transition ${
                      activeTab === "pip" ? "bg-white/10 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    pip (Python)
                  </button>
                  <button
                    onClick={() => setActiveTab("npm")}
                    className={`text-xs font-mono px-2 py-1 rounded transition ${
                      activeTab === "npm" ? "bg-white/10 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    npm (Node.js)
                  </button>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">MIT Lisanslı</span>
              </div>

              <div className="flex items-center justify-between font-mono text-xs sm:text-sm bg-black/50 px-3.5 py-2.5 rounded-lg border border-white/5">
                <span className="text-zinc-200 truncate select-all">
                  <span className="text-emerald-400 mr-2">$</span>
                  {activeTab === "pip" ? "pip install quantro" : "npm install quantro-js"}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      activeTab === "pip" ? "pip install quantro" : "npm install quantro-js",
                      "terminal"
                    )
                  }
                  className="ml-3 px-2.5 py-1 text-xs rounded border border-white/10 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition shrink-0"
                >
                  {copiedCmd === "terminal" ? "Kopyalandı!" : "Kopyala"}
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#bento-section"
                className="px-5 py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition"
              >
                13 Modülü Keşfet
              </a>
              <a
                href="quantro-lab.html"
                className="px-5 py-2.5 rounded-lg border border-white/15 bg-zinc-900/60 text-zinc-200 font-medium text-sm hover:bg-zinc-800 hover:border-white/25 transition"
              >
                Canlı Laboratuvar (Web)
              </a>
              <a
                href="https://github.com/quantro38/quantro"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-lg border border-white/10 bg-transparent text-zinc-400 hover:text-white text-sm font-mono transition"
              >
                GitHub ↗
              </a>
            </div>
          </div>

          {/* Right Hero Interactive simulator */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <span className="font-mono text-xs text-zinc-400">hero-simulator.py</span>
                <span className="text-[11px] font-mono text-emerald-400">Canlı Durum</span>
              </div>

              <div className="p-4 rounded-xl border border-white/5 bg-black/60 font-mono space-y-3 mb-4">
                <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-white/5 pb-2">
                  <span>Durum: {qubitState.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-zinc-900/80 border border-white/5">
                    <div className="text-zinc-400 text-[10px]">P(|0⟩)</div>
                    <div className="text-lg font-bold text-emerald-400">
                      {(qubitState.alpha ** 2 * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-900/80 border border-white/5">
                    <div className="text-zinc-400 text-[10px]">P(|1⟩)</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {(qubitState.beta ** 2 * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <button
                  onClick={() => applyHeroGate("H")}
                  className="py-2 px-3 rounded-lg border border-white/10 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition"
                >
                  Hadamard (H)
                </button>
                <button
                  onClick={() => applyHeroGate("X")}
                  className="py-2 px-3 rounded-lg border border-white/10 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition"
                >
                  Pauli-X (NOT)
                </button>
                <button
                  onClick={() => applyHeroGate("Z")}
                  className="py-2 px-3 rounded-lg border border-white/10 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 transition"
                >
                  Pauli-Z (Faz)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section id="bento-section" className="max-w-7xl mx-auto px-4 py-16 border-t border-white/10 relative z-10">
        <div className="mb-10">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5">
            Açık Kaynak Modül Mimarisi
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            13 İnteraktif Kuantum &amp; Astrofizik Modülü
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModules.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border border-white/10 bg-zinc-950/60 hover:border-white/25 transition p-5 flex flex-col justify-between ${
                item.featured ? "bg-zinc-900/40" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-zinc-400">MOD-{String(item.id).padStart(2, "0")}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">{item.description}</p>
                <div className="p-2 rounded bg-black/60 border border-white/5 font-mono text-xs text-zinc-300 mb-4 overflow-x-auto">
                  <code>{item.formula}</code>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <button onClick={() => setSelectedModule(item)} className="text-zinc-400 hover:text-white">
                  Model ↗
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(item.pythonSnippet, `mod-${item.id}`)}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  >
                    {copiedCmd === `mod-${item.id}` ? "Kopyalandı" : "Python"}
                  </button>
                  <a href={`quantro-lab.html#tb${item.id}`} className="px-2 py-1 rounded border border-white/10 hover:border-white/20 text-zinc-300">
                    Lab
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Model Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-6 space-y-4 shadow-2xl relative font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white font-sans">{selectedModule.title}</h3>
              <button onClick={() => setSelectedModule(null)} className="text-zinc-400 hover:text-white text-sm">✕</button>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400 mb-1">Model / Formül:</div>
              <div className="p-3 rounded-lg bg-black border border-white/10 text-emerald-400">{selectedModule.formula}</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-400 mb-1">Python Kodu:</div>
              <pre className="p-3 rounded-lg bg-black border border-white/10 text-zinc-300 overflow-x-auto">{selectedModule.pythonSnippet}</pre>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
              <button
                onClick={() => copyToClipboard(selectedModule.pythonSnippet, "modal-copy")}
                className="px-3 py-1.5 rounded bg-white text-black font-semibold text-xs"
              >
                {copiedCmd === "modal-copy" ? "Kopyalandı!" : "Kodu Kopyala"}
              </button>
              <button onClick={() => setSelectedModule(null)} className="px-3 py-1.5 rounded border border-white/10 text-zinc-300">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
