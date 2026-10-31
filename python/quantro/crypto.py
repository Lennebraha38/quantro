"""
Quantro BB84 Quantum Key Distribution (QKD) Protocol
Simulates quantum key transmission, basis selection (rectilinear + / diagonal x),
eavesdropper (Eve) interception, quantum bit error rate (QBER) analysis, and final key sifting.
"""

from __future__ import annotations
import random
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple


@dataclass
class BB84Result:
    num_qubits: int
    alice_bits: List[int]
    alice_bases: List[str]
    eve_present: bool
    eve_bases: List[str]
    eve_measured_bits: List[int]
    bob_bases: List[str]
    bob_measured_bits: List[int]
    matching_bases_indices: List[int]
    sifted_key_alice: List[int]
    sifted_key_bob: List[int]
    sample_size: int
    sample_indices: List[int]
    errors_detected: int
    qber: float
    eve_detected: bool
    final_key: str
    secure: bool


class BB84:
    """BB84 Quantum Key Distribution Simulator."""

    BASIS_RECTILINEAR = "+"  # 0 -> |0>, 1 -> |1>
    BASIS_DIAGONAL = "x"  # 0 -> |+>, 1 -> |->

    @staticmethod
    def simulate(
        num_qubits: int = 128,
        eve_present: bool = False,
        eve_intercept_prob: float = 1.0,
        sample_ratio: float = 0.25,
        error_threshold: float = 0.11,
        seed: int | None = None,
    ) -> BB84Result:
        """
        Runs a complete end-to-end BB84 protocol simulation.
        """
        rng = random.Random(seed)

        # 1. Alice generates random bits and random bases
        alice_bits = [rng.randint(0, 1) for _ in range(num_qubits)]
        alice_bases = [rng.choice([BB84.BASIS_RECTILINEAR, BB84.BASIS_DIAGONAL]) for _ in range(num_qubits)]

        # 2. Photons travel over the quantum channel (with optional Eve)
        eve_bases = []
        eve_measured = []
        transmitted_states = []

        for bit, base in zip(alice_bits, alice_bases):
            cur_bit = bit
            cur_base = base

            if eve_present and rng.random() < eve_intercept_prob:
                e_base = rng.choice([BB84.BASIS_RECTILINEAR, BB84.BASIS_DIAGONAL])
                eve_bases.append(e_base)
                if e_base == cur_base:
                    e_bit = cur_bit
                else:
                    # Measurement collapses state to Eve's basis with 50/50 probability
                    e_bit = rng.randint(0, 1)
                eve_measured.append(e_bit)
                # Eve sends her measured photon onwards to Bob
                cur_bit = e_bit
                cur_base = e_base
            else:
                eve_bases.append("-")
                eve_measured.append(-1)

            transmitted_states.append((cur_bit, cur_base))

        # 3. Bob measures in randomly chosen bases
        bob_bases = [rng.choice([BB84.BASIS_RECTILINEAR, BB84.BASIS_DIAGONAL]) for _ in range(num_qubits)]
        bob_measured = []

        for i in range(num_qubits):
            tx_bit, tx_base = transmitted_states[i]
            b_base = bob_bases[i]
            if b_base == tx_base:
                bob_measured.append(tx_bit)
            else:
                # 50% chance of detecting 0 or 1
                bob_measured.append(rng.randint(0, 1))

        # 4. Sifting phase: Alice and Bob compare bases over classical public channel
        matching_indices = [i for i in range(num_qubits) if alice_bases[i] == bob_bases[i]]
        sifted_alice = [alice_bits[i] for i in matching_indices]
        sifted_bob = [bob_measured[i] for i in matching_indices]

        # 5. Error estimation (QBER check)
        sample_size = max(1, int(len(matching_indices) * sample_ratio))
        all_sifted_pos = list(range(len(matching_indices)))
        rng.shuffle(all_sifted_pos)
        sample_pos = sorted(all_sifted_pos[:sample_size])

        errors = 0
        for pos in sample_pos:
            if sifted_alice[pos] != sifted_bob[pos]:
                errors += 1

        qber = round(errors / sample_size, 4) if sample_size > 0 else 0.0
        eve_detected = qber > error_threshold

        # 6. Extract remaining key
        remaining_pos = [pos for pos in all_sifted_pos if pos not in sample_pos]
        final_bits = [sifted_bob[pos] for pos in sorted(remaining_pos)]
        final_key = "".join(str(b) for b in final_bits)

        return BB84Result(
            num_qubits=num_qubits,
            alice_bits=alice_bits,
            alice_bases=alice_bases,
            eve_present=eve_present,
            eve_bases=eve_bases,
            eve_measured_bits=eve_measured,
            bob_bases=bob_bases,
            bob_measured_bits=bob_measured,
            matching_bases_indices=matching_indices,
            sifted_key_alice=sifted_alice,
            sifted_key_bob=sifted_bob,
            sample_size=sample_size,
            sample_indices=[matching_indices[p] for p in sample_pos],
            errors_detected=errors,
            qber=qber,
            eve_detected=eve_detected,
            final_key=final_key if not eve_detected else "",
            secure=not eve_detected and len(final_bits) > 0,
        )
