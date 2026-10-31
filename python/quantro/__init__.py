"""
Quantro: Open-source quantum computing simulation and astrophysics toolkit.
Developed by Faruk Hilmi AKPINAR · Quantro ARGE.
"""

from __future__ import annotations

__version__ = "1.0.0"
__author__ = "Faruk Hilmi AKPINAR"
__license__ = "MIT"

from quantro.circuit import QuantumCircuit, bell_state, ghz_state
from quantro.qrng import QRNG
from quantro.crypto import BB84, BB84Result
from quantro.bloch import BlochSphere, BlochPoint
from quantro.physics import (
    heisenberg_uncertainty,
    quantum_tunneling,
    double_slit_interference,
    schrodinger_cat,
    quantum_walk,
    quantum_teleportation,
)
from quantro.astrophysics import (
    black_hole,
    universe_age,
    relativistic_doppler,
    BlackHoleMetrics,
    CosmicAgeResult,
)
from quantro.export import export_to_python, export_to_json

__all__ = [
    "__version__",
    "__author__",
    "__license__",
    "QuantumCircuit",
    "bell_state",
    "ghz_state",
    "QRNG",
    "BB84",
    "BB84Result",
    "BlochSphere",
    "BlochPoint",
    "heisenberg_uncertainty",
    "quantum_tunneling",
    "double_slit_interference",
    "schrodinger_cat",
    "quantum_walk",
    "quantum_teleportation",
    "black_hole",
    "universe_age",
    "relativistic_doppler",
    "BlackHoleMetrics",
    "CosmicAgeResult",
    "export_to_python",
    "export_to_json",
]
