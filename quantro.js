/* =====================================================================
   Quantro JS Motoru
   =====================================================================
   quantro/core.py Python çekirdeğinin JavaScript'e birebir çevirisidir.
   Bağımsız tek dosyadır: tarayıcıda <script> ile, Node'da require ile
   çalışır. Kullanım:

       <script src="quantro.js"></script>
       const qc = new Quantro.QuantumCircuit(2);
       Quantro.bellState(qc);
       console.log(Quantro.sampleDistribution(qc, 1024, 42));

   Kübit sıralaması: |q0 q1 ... q_{n-1}>, en soldaki kübit en anlamlı bit.
   ===================================================================== */

(function (global) {
  "use strict";

  /* ── Karmaşık sayı yardımcıları ─────────────────────────────────── */
  function c(re, im) {
    return { re: re, im: im || 0 };
  }
  function cZero() {
    return { re: 0, im: 0 };
  }
  function cAdd(a, b) {
    return { re: a.re + b.re, im: a.im + b.im };
  }
  function cMul(a, b) {
    return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
  }
  function cScale(s, a) {
    return { re: s * a.re, im: s * a.im };
  }
  function cAbsSq(a) {
    return a.re * a.re + a.im * a.im;
  }

  /* ── Matris yardımcıları (karmaşık) ────────────────────────────── */
  function matKron(A, B) {
    var m1 = A.length, n1 = A[0].length;
    var m2 = B.length, n2 = B[0].length;
    var R = [];
    for (var r1 = 0; r1 < m1 * m2; r1++) R.push(new Array(n1 * n2));
    for (var i = 0; i < m1; i++)
      for (var j = 0; j < n1; j++)
        for (var k = 0; k < m2; k++)
          for (var l = 0; l < n2; l++)
            R[i * m2 + k][j * n2 + l] = cMul(A[i][j], B[k][l]);
    return R;
  }

  function matVec(M, v) {
    var rows = M.length, cols = v.length;
    var out = [];
    for (var r = 0; r < rows; r++) {
      var acc = cZero();
      for (var col = 0; col < cols; col++) acc = cAdd(acc, cMul(M[r][col], v[col]));
      out.push(acc);
    }
    return out;
  }

  /* ── Kapılar ───────────────────────────────────────────────────── */
  var invSqrt2 = 1 / Math.sqrt(2);
  var H = [[c(invSqrt2), c(invSqrt2)], [c(invSqrt2), c(-invSqrt2)]];
  var X = [[c(0), c(1)], [c(1), c(0)]];
  var Y = [[c(0), c(0, -1)], [c(0, 1), c(0)]];
  var Z = [[c(1), c(0)], [c(0), c(-1)]];
  var I2 = [[c(1), c(0)], [c(0), c(1)]];

  /* ── Tek kübit ──────────────────────────────────────────────────── */
  function Qubit(a, b) {
    var aa = a === undefined ? c(1) : a;
    var bb = b === undefined ? c(0) : b;
    var norm = Math.sqrt(cAbsSq(aa) + cAbsSq(bb));
    if (norm === 0) throw new Error("Sıfır durumu geçerli bir kübit değildir");
    this.state = [cScale(1 / norm, aa), cScale(1 / norm, bb)];
  }
  Qubit.prototype.apply = function (M) {
    this.state = matVec(M, this.state);
    return this;
  };
  Qubit.prototype.prob = function (bit) {
    return cAbsSq(this.state[bit]);
  };

  /* ── n kübitlik devre ───────────────────────────────────────────── */
  function QuantumCircuit(n) {
    if (n < 1) throw new Error("En az 1 kübit gerekli");
    if (n > 12) throw new Error("12 kübitten büyük devreler tarayıcı için fazla ağır");
    this.n = n;
    this._size = Math.pow(2, n);
    this.state = [];
    for (var i = 0; i < this._size; i++) this.state.push(i === 0 ? c(1) : cZero());
  }
  QuantumCircuit.prototype.applySingle = function (gate, q) {
    var op = [[c(1)]];
    for (var p = 0; p < this.n; p++) op = matKron(op, p === q ? gate : I2);
    this.state = matVec(op, this.state);
    return this;
  };
  QuantumCircuit.prototype.h = function (q) { return this.applySingle(H, q); };
  QuantumCircuit.prototype.x = function (q) { return this.applySingle(X, q); };
  QuantumCircuit.prototype.y = function (q) { return this.applySingle(Y, q); };
  QuantumCircuit.prototype.z = function (q) { return this.applySingle(Z, q); };
  QuantumCircuit.prototype.ry = function (theta, q) {
    var c0 = Math.cos(theta / 2), s0 = Math.sin(theta / 2);
    return this.applySingle([[c(c0), c(-s0)], [c(s0), c(c0)]], q);
  };
  QuantumCircuit.prototype.cx = function (control, target) {
    if (control === target) throw new Error("Kontrol ve hedef aynı olamaz");
    var nxt = [];
    for (var j = 0; j < this._size; j++) nxt.push(cZero());
    for (var i = 0; i < this._size; i++) {
      var bits = this._toBits(i);
      if (bits[control] === 1) bits[target] ^= 1;
      nxt[this._fromBits(bits)] = this.state[i];
    }
    this.state = nxt;
    return this;
  };
  QuantumCircuit.prototype.cz = function (control, target) {
    if (control === target) throw new Error("Kontrol ve hedef aynı olamaz");
    var nxt = this.state.slice();
    for (var i = 0; i < this._size; i++) {
      var bits = this._toBits(i);
      if (bits[control] === 1 && bits[target] === 1) nxt[i] = cScale(-1, this.state[i]);
    }
    this.state = nxt;
    return this;
  };
  QuantumCircuit.prototype.probabilities = function () {
    return this.state.map(cAbsSq);
  };
  QuantumCircuit.prototype.measureAll = function (rng) {
    var probs = this.probabilities();
    var r = rng();
    var acc = 0;
    for (var i = 0; i < this._size; i++) {
      acc += probs[i];
      if (r < acc) return i;
    }
    return this._size - 1;
  };
  QuantumCircuit.prototype._toBits = function (i) {
    var bits = new Array(this.n);
    for (var p = 0; p < this.n; p++) bits[p] = (i >>> (this.n - 1 - p)) & 1;
    return bits;
  };
  QuantumCircuit.prototype._fromBits = function (bits) {
    var v = 0;
    for (var p = 0; p < bits.length; p++) v = (v << 1) | bits[p];
    return v;
  };

  /* ── Dolanıklık durumları ──────────────────────────────────────── */
  function bellState(circuit, a, b) {
    if (a === undefined) a = 0;
    if (b === undefined) b = 1;
    circuit.h(a);
    circuit.cx(a, b);
    return circuit;
  }
  function ghzState(circuit, qubits) {
    var q0 = qubits[0];
    circuit.h(q0);
    for (var i = 1; i < qubits.length; i++) circuit.cx(q0, qubits[i]);
    return circuit;
  }

  /* ── Tohumlanabilir PRNG (mulberry32) ──────────────────────────── */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ── Topluluk örneklemesi ──────────────────────────────────────── */
  function sampleDistribution(circuit, shots, seed) {
    shots = shots || 1024;
    var rng = mulberry32(seed === undefined ? 42 : seed);
    var counts = {};
    for (var s = 0; s < shots; s++) {
      var key = circuit.measureAll(rng);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  var Quantro = {
    c: c,
    H: H, X: X, Y: Y, Z: Z, I2: I2,
    Qubit: Qubit,
    QuantumCircuit: QuantumCircuit,
    bellState: bellState,
    ghzState: ghzState,
    mulberry32: mulberry32,
    sampleDistribution: sampleDistribution
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Quantro;
  else global.Quantro = Quantro;
})(typeof window !== "undefined" ? window : this);
