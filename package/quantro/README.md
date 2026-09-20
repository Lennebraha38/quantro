# quantro-js

**Tam JavaScript kuantum devre simülatörü** — sıfır bağımlılık, tek dosya.
Bell / GHZ dolanıklık durumları, H·X·Y·Z·RY kapıları, CX/CZ, tohumlanabilir
`mulberry32` PRNG ve deterministik örnekleme. Tarayıcıda `<script>`, Node'da
`require()` ile çalışır. MIT lisansı.

Canlı demo: <https://quantro-1.vercel.app/quantro-lab.html>

![MIT](https://img.shields.io/badge/license-MIT-00c8f0)
![Bağımlılık yok](https://img.shields.io/badge/dependencies-0-00c8f0)

## Kurulum

```bash
npm install quantro-js
```

## Kullanım (Node)

```js
const { QuantumCircuit, bellState, sampleDistribution } = require('quantro-js');

const qc = new QuantumCircuit(2);
bellState(qc);                       // |00> + |11>

const counts = sampleDistribution(qc, 1024, 42); // seed=42 → deterministik
console.log(counts);                 // { 0: ~512, 3: ~512 }  (Bell dolanıklık!)
```

Kapılar zincirleme çalışır:

```js
const qc = new QuantumCircuit(3);
qc.h(0).cx(0, 1).cx(0, 2);          // GHZ durumu
console.log(qc.probabilities());
```

## Kullanım (tarayıcı)

```html
<script src="https://unpkg.com/quantro-js"></script>
<script>
  const qc = new Quantro.QuantumCircuit(2);
  Quantro.bellState(qc);
  console.log(Quantro.sampleDistribution(qc, 1024, 42));
</script>
```

## API

| İşlev | Açıklama |
|---|---|
| `QuantumCircuit(n)` | n kübitlik devre (1 ≤ n ≤ 12) |
| `.h(q)` `.x(q)` `.y(q)` `.z(q)` `.ry(θ, q)` | tek kübit kapılar |
| `.cx(c, t)` `.cz(c, t)` | dolanıklık kapıları |
| `.probabilities()` | ölçüm olasılık dağılımı |
| `.measureAll(rng)` | tek ölçüm (rng: `() => [0,1)`) |
| `bellState(qc)` `ghzState(qc, qubits)` | Bell / GHZ hazırlama |
| `mulberry32(seed)` | tohumlanabilir PRNG |
| `sampleDistribution(qc, shots, seed)` | deterministik örnekleme (sync) |
| `sampleDistributionQ(qc, shots)` | gerçek kuantum kaynağıyla örnekleme (async, varsa) |

Kübit sıralaması: `|q0 q1 … q_{n-1}>`, en soldaki en anlamlı bit.

## Lisans

[MIT](./LICENSE) — © 2026 Quantro — Kuantum ve Astrofizik ARGE.