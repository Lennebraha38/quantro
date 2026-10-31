"""
Quantro Bloch Sphere Model
Calculates 3D Cartesian coordinates (x, y, z), spherical angles (theta, phi),
and quantum state amplitude projections for a single qubit.
"""

from __future__ import annotations
import cmath
import math
from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class BlochPoint:
    x: float
    y: float
    z: float
    theta: float
    phi: float
    state_vector: tuple[complex, complex]
    latex: str


class BlochSphere:
    """Bloch Sphere state representation and transformation."""

    def __init__(self, alpha: complex = complex(1.0, 0.0), beta: complex = complex(0.0, 0.0)):
        # Normalize
        norm = math.sqrt(alpha.real ** 2 + alpha.imag ** 2 + beta.real ** 2 + beta.imag ** 2)
        if norm < 1e-12:
            norm = 1.0
        self.alpha = alpha / norm
        self.beta = beta / norm

    @classmethod
    def from_angles(cls, theta: float, phi: float) -> BlochSphere:
        """Construct from spherical angles theta [0, pi] and phi [0, 2pi]."""
        alpha = complex(math.cos(theta / 2.0), 0.0)
        beta = cmath.exp(complex(0, phi)) * math.sin(theta / 2.0)
        return cls(alpha, beta)

    def get_coordinates(self) -> BlochPoint:
        """Computes Cartesian coordinates x, y, z on the unit sphere."""
        # Density matrix rho = |psi><psi|
        # x = 2 * Re(alpha* * beta)
        # y = 2 * Im(alpha* * beta)
        # z = |alpha|^2 - |beta|^2
        conj_alpha = complex(self.alpha.real, -self.alpha.imag)
        prod = conj_alpha * self.beta

        x = round(2.0 * prod.real, 6)
        y = round(2.0 * prod.imag, 6)
        z = round((self.alpha.real ** 2 + self.alpha.imag ** 2) - (self.beta.real ** 2 + self.beta.imag ** 2), 6)

        theta = math.acos(max(-1.0, min(1.0, z)))
        phi = math.atan2(y, x) if (abs(x) > 1e-6 or abs(y) > 1e-6) else 0.0
        if phi < 0:
            phi += 2 * math.pi

        # Format LaTeX
        a_str = f"{self.alpha.real:.2f}" if abs(self.alpha.imag) < 1e-4 else f"({self.alpha.real:.2f}+{self.alpha.imag:.2f}i)"
        b_str = f"{self.beta.real:.2f}" if abs(self.beta.imag) < 1e-4 else f"({self.beta.real:.2f}+{self.beta.imag:.2f}i)"
        latex = f"|\\psi\\rangle = {a_str}|0\\rangle + {b_str}|1\\rangle"

        return BlochPoint(
            x=x,
            y=y,
            z=z,
            theta=round(theta, 4),
            phi=round(phi, 4),
            state_vector=(self.alpha, self.beta),
            latex=latex,
        )

    def apply_h(self) -> BlochSphere:
        """Applies Hadamard gate."""
        inv_sqrt2 = 1.0 / math.sqrt(2.0)
        new_a = inv_sqrt2 * (self.alpha + self.beta)
        new_b = inv_sqrt2 * (self.alpha - self.beta)
        self.alpha, self.beta = new_a, new_b
        return self

    def apply_x(self) -> BlochSphere:
        """Applies Pauli-X gate."""
        self.alpha, self.beta = self.beta, self.alpha
        return self

    def apply_y(self) -> BlochSphere:
        """Applies Pauli-Y gate."""
        new_a = complex(0, -1) * self.beta
        new_b = complex(0, 1) * self.alpha
        self.alpha, self.beta = new_a, new_b
        return self

    def apply_z(self) -> BlochSphere:
        """Applies Pauli-Z gate."""
        self.beta = -self.beta
        return self

    def to_dict(self) -> Dict[str, Any]:
        pt = self.get_coordinates()
        return {
            "x": pt.x,
            "y": pt.y,
            "z": pt.z,
            "theta": pt.theta,
            "phi": pt.phi,
            "latex": pt.latex,
            "probabilities": {
                "0": round(self.alpha.real ** 2 + self.alpha.imag ** 2, 4),
                "1": round(self.beta.real ** 2 + self.beta.imag ** 2, 4),
            },
        }
