const test = require('node:test');
const assert = require('node:assert/strict');

const Q = require('../quantro.js');

test('QuantumCircuit — boyutlar', () => {
  assert.equal(new Q.QuantumCircuit(1)._size, 2);
  assert.equal(new Q.QuantumCircuit(2)._size, 4);
  assert.equal(new Q.QuantumCircuit(3)._size, 8);
});

test('QuantumCircuit — başlangıç |00..0> durumu', () => {
  const c = new Q.QuantumCircuit(2);
  assert.deepEqual(c.probabilities(), [1, 0, 0, 0]);
});

test('X kapısı — qubit 0 çevrilir (n=2 → |10> indeks 2)', () => {
  const c = new Q.QuantumCircuit(2);
  c.x(0);
  assert.deepEqual(c.probabilities(), [0, 0, 1, 0]);
});

test('CX kapısı — kontrol 1 hedef 0: |10> → |11> indeks 3', () => {
  const c = new Q.QuantumCircuit(2);
  c.x(1).cx(1, 0);
  assert.deepEqual(c.probabilities(), [0, 0, 0, 1]);
});

test('H kapısı — ~50/50 süperpozisyon (seeded örnekleme, deterministik)', () => {
  const c = new Q.QuantumCircuit(1);
  c.h(0);
  const counts = Q.sampleDistribution(c, 20000, 123);
  assert.equal(counts[0] + counts[1], 20000);
  const r = counts[1] / 20000;
  assert.ok(r > 0.47 && r < 0.53, `oran ${r} beklenen aralık [0.47, 0.53] dışında`);
});

test('Bell durumu — yalnızca |00> ve |11>', () => {
  const c = Q.bellState(new Q.QuantumCircuit(2), 0, 1);
  const counts = Q.sampleDistribution(c, 8000, 7);
  assert.equal((counts[1] || 0) + (counts[2] || 0), 0, '|01>/|10> asla gelmemeli');
  assert.equal(counts[0] + counts[3], 8000);
  const r = counts[3] / 8000;
  assert.ok(r > 0.47 && r < 0.53, `oran ${r} aralık dışında`);
});

test('GHZ durumu — yalnızca |000> ve |111>', () => {
  const c = Q.ghzState(new Q.QuantumCircuit(3), [0, 1, 2]);
  const counts = Q.sampleDistribution(c, 4000, 5);
  const keys = Object.keys(counts).map(Number).sort((a, b) => a - b);
  assert.deepEqual(keys, [0, 7]);
  assert.equal((counts[0] || 0) + (counts[7] || 0), 4000);
});

test('mulberry32 — aynı tohum aynı diziyi üretir', () => {
  const a = Q.mulberry32(42);
  const b = Q.mulberry32(42);
  const c = Q.mulberry32(43);
  const seq = [];
  for (let i = 0; i < 10; i++) seq.push([a(), b(), c()]);
  for (const [x, y] of seq) assert.equal(x, y);
  assert.notEqual(seq[0][0], seq[0][2]);
  seq.forEach(([x]) => assert.ok(x >= 0 && x < 1));
});

test('sampleDistribution — aynı tohum birebir aynı sonuç üretir', () => {
  const c = new Q.QuantumCircuit(2);
  c.h(0);
  const k1 = Q.sampleDistribution(c, 5000, 99);
  const k2 = Q.sampleDistribution(c, 5000, 99);
  assert.deepEqual(k1, k2);
});