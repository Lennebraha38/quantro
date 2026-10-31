import unittest
import math
from quantro.circuit import QuantumCircuit, bell_state, ghz_state


class TestCircuit(unittest.TestCase):
    def test_initial_state(self):
        qc = QuantumCircuit(2)
        state = qc.get_statevector()
        self.assertEqual(len(state), 4)
        self.assertEqual(state[0], complex(1.0, 0))
        self.assertEqual(state[1], complex(0, 0))
        probs = qc.get_probabilities()
        self.assertEqual(probs, {"00": 1.0})

    def test_x_gate(self):
        qc = QuantumCircuit(2)
        qc.x(0)  # Flips first qubit: |00> -> |10>
        probs = qc.get_probabilities()
        self.assertIn("10", probs)
        self.assertAlmostEqual(probs["10"], 1.0)

    def test_h_gate(self):
        qc = QuantumCircuit(1)
        qc.h(0)
        probs = qc.get_probabilities()
        self.assertAlmostEqual(probs["0"], 0.5, places=4)
        self.assertAlmostEqual(probs["1"], 0.5, places=4)

    def test_bell_state(self):
        qc = bell_state()
        probs = qc.get_probabilities()
        self.assertAlmostEqual(probs.get("00", 0), 0.5, places=4)
        self.assertAlmostEqual(probs.get("11", 0), 0.5, places=4)
        self.assertNotIn("01", probs)
        self.assertNotIn("10", probs)

    def test_sampling_deterministic_seed(self):
        qc = bell_state()
        s1 = qc.sample(shots=500, seed=42)
        s2 = qc.sample(shots=500, seed=42)
        self.assertEqual(s1, s2)
        self.assertEqual(sum(s1.values()), 500)
        self.assertTrue("00" in s1 and "11" in s1)

    def test_qasm_export(self):
        qc = bell_state()
        qasm = qc.to_qasm()
        self.assertIn("OPENQASM 2.0;", qasm)
        self.assertIn("h q[0];", qasm)
        self.assertIn("cx q[0],q[1];", qasm)

    def test_qiskit_code_export(self):
        qc = bell_state()
        code = qc.to_qiskit_code()
        self.assertIn("from qiskit import QuantumCircuit", code)
        self.assertIn("qc.h(0)", code)
        self.assertIn("qc.cx(0, 1)", code)


if __name__ == "__main__":
    unittest.main()
