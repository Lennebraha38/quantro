"""
Quantro Physics Simulation Engine
Mathematical models for Heisenberg uncertainty, Quantum Tunneling,
Double Slit interference, Schrödinger's Cat decoherence, Quantum Walk, and Quantum Teleportation.
"""

from __future__ import annotations
import math
import random
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

# Physical constants (SI units)
H_BAR = 1.054571817e-34  # J*s (Planck constant / 2pi)
M_ELECTRON = 9.1093837e-31  # kg
EV_TO_JOULE = 1.602176634e-19  # J / eV


def heisenberg_uncertainty(
    delta_x: float | None = None, delta_p: float | None = None
) -> Dict[str, Any]:
    """
    Computes minimum quantum uncertainty based on Kennard-Weyl:
    Delta x * Delta p >= hbar / 2
    """
    min_product = H_BAR / 2.0
    if delta_x is not None and delta_x > 0:
        calculated_dp = min_product / delta_x
        return {
            "input_delta_x_m": delta_x,
            "min_delta_p_kg_m_s": calculated_dp,
            "min_product_J_s": min_product,
            "formula": "Δx · Δp ≥ ℏ/2",
        }
    elif delta_p is not None and delta_p > 0:
        calculated_dx = min_product / delta_p
        return {
            "input_delta_p_kg_m_s": delta_p,
            "min_delta_x_m": calculated_dx,
            "min_product_J_s": min_product,
            "formula": "Δx · Δp ≥ ℏ/2",
        }
    else:
        return {"min_product_J_s": min_product, "formula": "Δx · Δp ≥ ℏ/2"}


def quantum_tunneling(
    barrier_width_nm: float = 0.5,
    barrier_height_ev: float = 10.0,
    particle_energy_ev: float = 8.0,
    particle_mass_kg: float = M_ELECTRON,
) -> Dict[str, Any]:
    """
    Computes transmission coefficient T through a finite rectangular barrier:
    When E < V0: T = 1 / [1 + (V0^2 sinh^2(k2 * a)) / (4 * E * (V0 - E))]
    """
    width_m = barrier_width_nm * 1e-9
    e_j = particle_energy_ev * EV_TO_JOULE
    v0_j = barrier_height_ev * EV_TO_JOULE

    if particle_energy_ev >= barrier_height_ev:
        # Classical pass-through regime
        k2 = math.sqrt(2 * particle_mass_kg * (e_j - v0_j)) / H_BAR
        arg = k2 * width_m
        sin_sq = (math.sin(arg)) ** 2
        denom = 1.0 + (v0_j ** 2 * sin_sq) / (4.0 * e_j * (e_j - v0_j))
        t = 1.0 / denom if denom != 0 else 1.0
    else:
        # Tunneling regime
        kappa = math.sqrt(2 * particle_mass_kg * (v0_j - e_j)) / H_BAR
        arg = kappa * width_m
        try:
            sinh_sq = (math.sinh(arg)) ** 2
        except OverflowError:
            sinh_sq = float("inf")

        if sinh_sq == float("inf"):
            t = 0.0
        else:
            denom = 1.0 + (v0_j ** 2 * sinh_sq) / (4.0 * e_j * (v0_j - e_j))
            t = 1.0 / denom

    t_clamped = max(0.0, min(1.0, t))
    r_clamped = 1.0 - t_clamped

    return {
        "barrier_width_nm": barrier_width_nm,
        "barrier_height_ev": barrier_height_ev,
        "particle_energy_ev": particle_energy_ev,
        "transmission_coefficient_T": t_clamped,
        "reflection_coefficient_R": r_clamped,
        "regime": "tunneling" if particle_energy_ev < barrier_height_ev else "over_barrier",
        "formula": "T = 1 / [1 + (V₀² sinh²(κa)) / (4E(V₀ - E))]",
    }


def double_slit_interference(
    wavelength_nm: float = 500.0,
    slit_distance_um: float = 20.0,
    screen_distance_m: float = 1.0,
    num_points: int = 100,
) -> Dict[str, Any]:
    """
    Computes Fraunhofer double-slit wave interference pattern.
    Intensity I(theta) = I0 * cos^2(pi * d * sin(theta) / lambda)
    """
    lam = wavelength_nm * 1e-9
    d = slit_distance_um * 1e-6
    l_dist = screen_distance_m

    # Width of view on screen: +/- 0.05m
    x_range = 0.05
    curve = []
    for i in range(num_points):
        x = -x_range + (2.0 * x_range * i / (num_points - 1))
        theta = math.atan2(x, l_dist)
        sin_theta = math.sin(theta)
        phase = (math.pi * d * sin_theta) / lam
        intensity = (math.cos(phase)) ** 2
        curve.append({"x_mm": round(x * 1000, 2), "intensity": round(intensity, 4)})

    return {
        "wavelength_nm": wavelength_nm,
        "slit_distance_um": slit_distance_um,
        "screen_distance_m": screen_distance_m,
        "pattern": curve,
        "formula": "I = I₀ cos²(π d sin θ / λ)",
    }


def schrodinger_cat(decay_probability: float = 0.5, observe: bool = False) -> Dict[str, Any]:
    """
    Schrödinger's Cat thought experiment:
    Superposition state |psi> = sqrt(1-p)|alive> + sqrt(p)|dead>
    Observation forces wavefunction collapse.
    """
    decay_p = max(0.0, min(1.0, decay_probability))
    alive_prob = 1.0 - decay_p
    dead_prob = decay_p

    if not observe:
        return {
            "state": "superposition",
            "alive_amplitude": round(math.sqrt(alive_prob), 4),
            "dead_amplitude": round(math.sqrt(dead_prob), 4),
            "alive_probability": round(alive_prob, 4),
            "dead_probability": round(dead_prob, 4),
            "ket": f"|ψ⟩ = {math.sqrt(alive_prob):.2f}|Alive⟩ + {math.sqrt(dead_prob):.2f}|Dead⟩",
            "collapsed": False,
        }
    else:
        roll = random.random()
        outcome = "dead" if roll < decay_p else "alive"
        return {
            "state": "collapsed",
            "outcome": outcome,
            "ket": f"|{outcome.capitalize()}⟩",
            "collapsed": True,
            "observation": f"Wavefunction collapsed into definite classical state: {outcome.upper()}",
        }


def quantum_walk(
    steps: int = 30, coin_type: str = "hadamard", observe_every_step: bool = False
) -> Dict[str, Any]:
    """
    1D Discrete-time Quantum Walk with a 2-state coin.
    Shows quadratic ballistic spreading (sigma ~ N) vs classical (sigma ~ sqrt(N)).
    """
    steps = max(1, min(steps, 100))
    # State mapping: position -> [amp_left, amp_right]
    state: Dict[int, List[complex]] = {0: [complex(1 / math.sqrt(2), 0), complex(0, 1 / math.sqrt(2))]}

    inv_sqrt2 = 1.0 / math.sqrt(2.0)

    for _ in range(steps):
        next_state: Dict[int, List[complex]] = {}

        if observe_every_step:
            # Collapse each position into classical choice
            # Sample one position
            all_probs = []
            pos_list = list(state.keys())
            for pos in pos_list:
                al, ar = state[pos]
                prob = al.real ** 2 + al.imag ** 2 + ar.real ** 2 + ar.imag ** 2
                all_probs.append(prob)
            total = sum(all_probs)
            r = random.random() * total
            cur = 0.0
            chosen = pos_list[0]
            for p, pos in zip(all_probs, pos_list):
                cur += p
                if r <= cur:
                    chosen = pos
                    break
            # Step classically
            step_dir = -1 if random.random() < 0.5 else 1
            state = {chosen + step_dir: [complex(inv_sqrt2, 0), complex(inv_sqrt2, 0)]}
            continue

        for pos, (a_left, a_right) in state.items():
            # Hadamard coin:
            # |L> -> (|L> + |R>)/sqrt(2)
            # |R> -> (|L> - |R>)/sqrt(2)
            new_l = inv_sqrt2 * (a_left + a_right)
            new_r = inv_sqrt2 * (a_left - a_right)

            # Shift operator: Left moves to pos-1, Right moves to pos+1
            left_pos = pos - 1
            right_pos = pos + 1

            if left_pos not in next_state:
                next_state[left_pos] = [complex(0, 0), complex(0, 0)]
            next_state[left_pos][0] += new_l

            if right_pos not in next_state:
                next_state[right_pos] = [complex(0, 0), complex(0, 0)]
            next_state[right_pos][1] += new_r

        state = next_state

    # Calculate distribution
    distribution = {}
    variance = 0.0
    for pos in sorted(state.keys()):
        al, ar = state[pos]
        prob = (al.real ** 2 + al.imag ** 2) + (ar.real ** 2 + ar.imag ** 2)
        if prob > 1e-6:
            distribution[pos] = round(prob, 5)
            variance += (pos ** 2) * prob

    std_dev = math.sqrt(variance)

    return {
        "steps": steps,
        "observe_every_step": observe_every_step,
        "std_deviation": round(std_dev, 3),
        "classical_expected_std": round(math.sqrt(steps), 3),
        "quantum_speedup": round(std_dev / (math.sqrt(steps) or 1), 2),
        "distribution": distribution,
    }


def quantum_teleportation(alpha: complex = complex(0.6, 0), beta: complex = complex(0.8, 0)) -> Dict[str, Any]:
    """
    Standard 3-qubit Quantum Teleportation Protocol:
    Teleports state |psi> = alpha|0> + beta|1> from Alice (q0) to Bob (q2)
    using Bell pair shared on (q1, q2).
    """
    from quantro.circuit import QuantumCircuit

    # Normalize state
    norm = math.sqrt(alpha.real ** 2 + alpha.imag ** 2 + beta.real ** 2 + beta.imag ** 2)
    alpha = alpha / norm
    beta = beta / norm

    qc = QuantumCircuit(3)
    # 1. Prepare initial state on q0: rotation around Y
    theta = 2.0 * math.acos(max(-1.0, min(1.0, alpha.real)))
    qc.ry(0, theta)

    # 2. Create EPR pair between Alice (q1) and Bob (q2)
    qc.h(1)
    qc.cx(1, 2)

    # 3. Alice applies CNOT(q0, q1) and H(q0)
    qc.cx(0, 1)
    qc.h(0)

    # 4. Bob applies correction based on Alice's measurement outcomes
    qc.cx(1, 2)
    qc.cz(0, 2)

    probs = qc.get_probabilities()
    return {
        "initial_alpha": round(alpha.real, 4),
        "initial_beta": round(beta.real, 4),
        "protocol": "Bennett et al. (1993)",
        "circuit_qasm": qc.to_qasm(),
        "final_probabilities": probs,
        "success": True,
    }
