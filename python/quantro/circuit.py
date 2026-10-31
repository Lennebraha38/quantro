"""
Quantro Quantum Circuit Simulator
Pure Python state-vector simulator supporting n-qubits, standard unitary gates,
Bell & GHZ states, sampling, OpenQASM 2.0 and Qiskit code generation.
"""

from __future__ import annotations
import cmath
import math
import random
from typing import Dict, List, Tuple, Any

# Standard 1-qubit unitary matrices
SQRT2_INV = 1.0 / math.sqrt(2)

GATE_MATRICES = {
    "I": [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(1, 0)]],
    "X": [[complex(0, 0), complex(1, 0)], [complex(1, 0), complex(0, 0)]],
    "Y": [[complex(0, 0), complex(0, -1)], [complex(0, 1), complex(0, 0)]],
    "Z": [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(-1, 0)]],
    "H": [
        [complex(SQRT2_INV, 0), complex(SQRT2_INV, 0)],
        [complex(SQRT2_INV, 0), complex(-SQRT2_INV, 0)],
    ],
    "S": [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(0, 1)]],
    "T": [
        [complex(1, 0), complex(0, 0)],
        [complex(0, 0), cmath.exp(complex(0, math.pi / 4))],
    ],
}


def _apply_single_qubit_gate(
    state: List[complex], target: int, num_qubits: int, matrix: List[List[complex]]
) -> List[complex]:
    """Applies a 2x2 unitary matrix to qubit `target` in an n-qubit statevector."""
    dim = 1 << num_qubits
    bit = 1 << (num_qubits - 1 - target)
    new_state = [complex(0, 0)] * dim

    m00, m01 = matrix[0][0], matrix[0][1]
    m10, m11 = matrix[1][0], matrix[1][1]

    for i in range(dim):
        if (i & bit) == 0:
            i0 = i
            i1 = i | bit
            v0 = state[i0]
            v1 = state[i1]
            new_state[i0] = m00 * v0 + m01 * v1
            new_state[i1] = m10 * v0 + m11 * v1

    return new_state


def _apply_two_qubit_gate(
    state: List[complex],
    control: int,
    target: int,
    num_qubits: int,
    target_matrix: List[List[complex]],
) -> List[complex]:
    """Applies a controlled 2x2 matrix to `target` when `control` is 1."""
    dim = 1 << num_qubits
    ctrl_bit = 1 << (num_qubits - 1 - control)
    tgt_bit = 1 << (num_qubits - 1 - target)
    new_state = list(state)

    m00, m01 = target_matrix[0][0], target_matrix[0][1]
    m10, m11 = target_matrix[1][0], target_matrix[1][1]

    for i in range(dim):
        if (i & ctrl_bit) != 0 and (i & tgt_bit) == 0:
            i0 = i
            i1 = i | tgt_bit
            v0 = state[i0]
            v1 = state[i1]
            new_state[i0] = m00 * v0 + m01 * v1
            new_state[i1] = m10 * v0 + m11 * v1

    return new_state


class QuantumCircuit:
    """
    Quantum Circuit representing an n-qubit system.
    State convention: |q0 q1 ... q_{n-1}> where q0 is the most significant qubit.
    """

    def __init__(self, num_qubits: int):
        if num_qubits < 1 or num_qubits > 20:
            raise ValueError("Number of qubits must be between 1 and 20.")
        self.num_qubits = num_qubits
        self.dim = 1 << num_qubits
        # Initialize state to |00...0>
        self.state: List[complex] = [complex(0, 0)] * self.dim
        self.state[0] = complex(1.0, 0.0)
        self.operations: List[Dict[str, Any]] = []

    def reset(self) -> QuantumCircuit:
        """Resets the circuit state back to |00...0>."""
        self.state = [complex(0, 0)] * self.dim
        self.state[0] = complex(1.0, 0.0)
        self.operations.clear()
        return self

    def h(self, target: int) -> QuantumCircuit:
        """Hadamard gate."""
        self._validate_qubit(target)
        self.state = _apply_single_qubit_gate(
            self.state, target, self.num_qubits, GATE_MATRICES["H"]
        )
        self.operations.append({"gate": "H", "targets": [target]})
        return self

    def x(self, target: int) -> QuantumCircuit:
        """Pauli-X (NOT) gate."""
        self._validate_qubit(target)
        self.state = _apply_single_qubit_gate(
            self.state, target, self.num_qubits, GATE_MATRICES["X"]
        )
        self.operations.append({"gate": "X", "targets": [target]})
        return self

    def y(self, target: int) -> QuantumCircuit:
        """Pauli-Y gate."""
        self._validate_qubit(target)
        self.state = _apply_single_qubit_gate(
            self.state, target, self.num_qubits, GATE_MATRICES["Y"]
        )
        self.operations.append({"gate": "Y", "targets": [target]})
        return self

    def z(self, target: int) -> QuantumCircuit:
        """Pauli-Z gate."""
        self._validate_qubit(target)
        self.state = _apply_single_qubit_gate(
            self.state, target, self.num_qubits, GATE_MATRICES["Z"]
        )
        self.operations.append({"gate": "Z", "targets": [target]})
        return self

    def s(self, target: int) -> QuantumCircuit:
        """Phase S gate (sqrt(Z))."""
        self._validate_qubit(target)
        self.state = _apply_single_qubit_gate(
            self.state, target, self.num_qubits, GATE_MATRICES["S"]
        )
        self.operations.append({"gate": "S", "targets": [target]})
        return self

    def t(self, target: int) -> QuantumCircuit:
        """T gate (pi/8 gate)."""
        self._validate_qubit(target)
        self.state = _apply_single_qubit_gate(
            self.state, target, self.num_qubits, GATE_MATRICES["T"]
        )
        self.operations.append({"gate": "T", "targets": [target]})
        return self

    def rx(self, target: int, theta: float) -> QuantumCircuit:
        """Rotation around X axis."""
        self._validate_qubit(target)
        cos_val = math.cos(theta / 2.0)
        sin_val = math.sin(theta / 2.0)
        mat = [
            [complex(cos_val, 0), complex(0, -sin_val)],
            [complex(0, -sin_val), complex(cos_val, 0)],
        ]
        self.state = _apply_single_qubit_gate(self.state, target, self.num_qubits, mat)
        self.operations.append({"gate": "RX", "targets": [target], "theta": theta})
        return self

    def ry(self, target: int, theta: float) -> QuantumCircuit:
        """Rotation around Y axis."""
        self._validate_qubit(target)
        cos_val = math.cos(theta / 2.0)
        sin_val = math.sin(theta / 2.0)
        mat = [
            [complex(cos_val, 0), complex(-sin_val, 0)],
            [complex(sin_val, 0), complex(cos_val, 0)],
        ]
        self.state = _apply_single_qubit_gate(self.state, target, self.num_qubits, mat)
        self.operations.append({"gate": "RY", "targets": [target], "theta": theta})
        return self

    def rz(self, target: int, theta: float) -> QuantumCircuit:
        """Rotation around Z axis."""
        self._validate_qubit(target)
        mat = [
            [cmath.exp(complex(0, -theta / 2.0)), complex(0, 0)],
            [complex(0, 0), cmath.exp(complex(0, theta / 2.0))],
        ]
        self.state = _apply_single_qubit_gate(self.state, target, self.num_qubits, mat)
        self.operations.append({"gate": "RZ", "targets": [target], "theta": theta})
        return self

    def cx(self, control: int, target: int) -> QuantumCircuit:
        """Controlled-NOT (CNOT) gate."""
        self._validate_qubit(control)
        self._validate_qubit(target)
        if control == target:
            raise ValueError("Control and target must be distinct qubits.")
        self.state = _apply_two_qubit_gate(
            self.state, control, target, self.num_qubits, GATE_MATRICES["X"]
        )
        self.operations.append({"gate": "CX", "controls": [control], "targets": [target]})
        return self

    def cz(self, control: int, target: int) -> QuantumCircuit:
        """Controlled-Z gate."""
        self._validate_qubit(control)
        self._validate_qubit(target)
        if control == target:
            raise ValueError("Control and target must be distinct qubits.")
        self.state = _apply_two_qubit_gate(
            self.state, control, target, self.num_qubits, GATE_MATRICES["Z"]
        )
        self.operations.append({"gate": "CZ", "controls": [control], "targets": [target]})
        return self

    def swap(self, q1: int, q2: int) -> QuantumCircuit:
        """SWAP gate between two qubits."""
        self.cx(q1, q2)
        self.cx(q2, q1)
        self.cx(q1, q2)
        return self

    def toffoli(self, control1: int, control2: int, target: int) -> QuantumCircuit:
        """Toffoli (CCX) gate."""
        self._validate_qubit(control1)
        self._validate_qubit(control2)
        self._validate_qubit(target)
        if len({control1, control2, target}) < 3:
            raise ValueError("All three qubits in Toffoli must be distinct.")

        dim = self.dim
        c1_bit = 1 << (self.num_qubits - 1 - control1)
        c2_bit = 1 << (self.num_qubits - 1 - control2)
        tgt_bit = 1 << (self.num_qubits - 1 - target)
        both_ctrl = c1_bit | c2_bit

        for i in range(dim):
            if (i & both_ctrl) == both_ctrl and (i & tgt_bit) == 0:
                i1 = i | tgt_bit
                self.state[i], self.state[i1] = self.state[i1], self.state[i]

        self.operations.append(
            {"gate": "CCX", "controls": [control1, control2], "targets": [target]}
        )
        return self

    def get_statevector(self) -> List[complex]:
        """Returns the full complex statevector."""
        return list(self.state)

    def get_probabilities(self) -> Dict[str, float]:
        """Returns probability distribution mapped to bitstrings e.g. {'00': 0.5, '11': 0.5}."""
        res: Dict[str, float] = {}
        for i, amp in enumerate(self.state):
            prob = (amp.real ** 2) + (amp.imag ** 2)
            if prob > 1e-12:
                bitstring = format(i, f"0{self.num_qubits}b")
                res[bitstring] = round(prob, 8)
        return res

    def sample(self, shots: int = 1024, seed: int | None = None) -> Dict[str, int]:
        """Samples measurement outcomes based on statevector probabilities."""
        rng = random.Random(seed)
        probs = [(amp.real ** 2 + amp.imag ** 2) for amp in self.state]
        indices = list(range(self.dim))

        counts: Dict[str, int] = {}
        # Cumulative distribution for quick sampling
        cum_probs = []
        cur = 0.0
        for p in probs:
            cur += p
            cum_probs.append(cur)

        # Normalize to 1.0
        if cum_probs[-1] > 0:
            cum_probs = [c / cum_probs[-1] for c in cum_probs]

        for _ in range(shots):
            r = rng.random()
            # Binary search or linear scan
            idx = 0
            for i, cp in enumerate(cum_probs):
                if r <= cp:
                    idx = i
                    break
            bstr = format(idx, f"0{self.num_qubits}b")
            counts[bstr] = counts.get(bstr, 0) + 1

        return counts

    def to_qasm(self) -> str:
        """Exports the circuit to OpenQASM 2.0 format."""
        lines = [
            'OPENQASM 2.0;',
            'include "qelib1.inc";',
            f'qreg q[{self.num_qubits}];',
            f'creg c[{self.num_qubits}];',
        ]
        for op in self.operations:
            g = op["gate"].lower()
            if g in ("h", "x", "y", "z", "s", "t"):
                lines.append(f"{g} q[{op['targets'][0]}];")
            elif g in ("rx", "ry", "rz"):
                lines.append(f"{g}({op['theta']:.6f}) q[{op['targets'][0]}];")
            elif g == "cx":
                lines.append(f"cx q[{op['controls'][0]}],q[{op['targets'][0]}];")
            elif g == "cz":
                lines.append(f"cz q[{op['controls'][0]}],q[{op['targets'][0]}];")
            elif g == "ccx":
                lines.append(f"ccx q[{op['controls'][0]}],q[{op['controls'][1]}],q[{op['targets'][0]}];")

        lines.append(f"measure q -> c;")
        return "\n".join(lines)

    def to_qiskit_code(self) -> str:
        """Generates equivalent executable Python code for Qiskit."""
        lines = [
            "from qiskit import QuantumCircuit, transpile",
            "from qiskit_aer import AerSimulator",
            "",
            f"qc = QuantumCircuit({self.num_qubits}, {self.num_qubits})",
        ]
        for op in self.operations:
            g = op["gate"].lower()
            if g in ("h", "x", "y", "z", "s", "t"):
                lines.append(f"qc.{g}({op['targets'][0]})")
            elif g in ("rx", "ry", "rz"):
                lines.append(f"qc.{g}({op['theta']:.6f}, {op['targets'][0]})")
            elif g == "cx":
                lines.append(f"qc.cx({op['controls'][0]}, {op['targets'][0]})")
            elif g == "cz":
                lines.append(f"qc.cz({op['controls'][0]}, {op['targets'][0]})")
            elif g == "ccx":
                lines.append(f"qc.ccx({op['controls'][0]}, {op['controls'][1]}, {op['targets'][0]})")

        lines.extend([
            "qc.measure(range(self.num_qubits), range(self.num_qubits))" if "self" in lines[-1] else f"qc.measure(range({self.num_qubits}), range({self.num_qubits}))",
            "simulator = AerSimulator()",
            "compiled_circuit = transpile(qc, simulator)",
            "job = simulator.run(compiled_circuit, shots=1024)",
            "result = job.result()",
            "print(result.get_counts())"
        ])
        return "\n".join(lines)

    def _validate_qubit(self, q: int) -> None:
        if q < 0 or q >= self.num_qubits:
            raise IndexError(f"Qubit index {q} out of range [0, {self.num_qubits - 1}].")


# Canonical helper states
def bell_state() -> QuantumCircuit:
    """Returns a 2-qubit Bell state (|00> + |11>) / sqrt(2)."""
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    return qc


def ghz_state(n: int = 3) -> QuantumCircuit:
    """Returns an n-qubit GHZ state (|00...0> + |11...1>) / sqrt(2)."""
    qc = QuantumCircuit(n)
    qc.h(0)
    for i in range(1, n):
        qc.cx(0, i)
    return qc
