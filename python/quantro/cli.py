"""
Quantro Command Line Interface (CLI)
Provides terminal access to quantum circuit simulation, ANU live randomness,
BB84 QKD, and astrophysics calculations.
"""

from __future__ import annotations
import argparse
import sys
from quantro import __version__
from quantro.circuit import QuantumCircuit, bell_state, ghz_state
from quantro.qrng import QRNG
from quantro.crypto import BB84
from quantro.astrophysics import black_hole, universe_age


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="quantro",
        description=f"Quantro Quantum Computing & Astrophysics CLI (v{__version__})",
    )
    parser.add_argument("--version", "-v", action="version", version=f"quantro {__version__}")

    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: circuit
    sub_circuit = subparsers.add_parser("circuit", help="Simulate a quantum circuit")
    sub_circuit.add_argument("preset", choices=["bell", "ghz", "superposition"], help="Preset circuit to run")
    sub_circuit.add_argument("--shots", "-s", type=int, default=1024, help="Number of measurement shots")

    # Command: qrng
    sub_qrng = subparsers.add_parser("qrng", help="Fetch ANU quantum random numbers")
    sub_qrng.add_argument("length", type=int, nargs="?", default=16, help="Hex byte length")
    sub_qrng.add_argument("--integers", "-i", type=int, default=0, help="Generate N random integers [1-100]")

    # Command: bb84
    sub_bb84 = subparsers.add_parser("bb84", help="Simulate BB84 Quantum Key Distribution")
    sub_bb84.add_argument("--qubits", "-q", type=int, default=64, help="Number of transmitted qubits")
    sub_bb84.add_argument("--eve", action="store_true", help="Simulate active eavesdropper (Eve)")

    # Command: info
    subparsers.add_parser("info", help="Display Quantro system and engine metrics")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "circuit":
        if args.preset == "bell":
            qc = bell_state()
            print("=== Bell State |Phi+> = (|00> + |11>) / sqrt(2) ===")
        elif args.preset == "ghz":
            qc = ghz_state(3)
            print("=== 3-Qubit GHZ State (|000> + |111>) / sqrt(2) ===")
        else:
            qc = QuantumCircuit(1)
            qc.h(0)
            print("=== 1-Qubit Superposition (|0> + |1>) / sqrt(2) ===")

        print("State Probabilities:", qc.get_probabilities())
        print(f"Sampling ({args.shots} shots):", qc.sample(shots=args.shots))
        print("\nOpenQASM 2.0 Output:\n" + qc.to_qasm())

    elif args.command == "qrng":
        if args.integers > 0:
            nums = QRNG.get_integers(count=args.integers, min_val=1, max_val=100)
            print(f"Quantum Integers (1-100): {nums}")
        else:
            res = QRNG.get_hex(length=args.length)
            print(f"Source: {res['source']}")
            print(f"Entropy: {res['entropy']} bits/hex-char")
            print(f"Latency: {res['latency_ms']} ms")
            print(f"Quantum Hex: {res['data']}")

    elif args.command == "bb84":
        res = BB84.simulate(num_qubits=args.qubits, eve_present=args.eve)
        print(f"BB84 Simulation ({args.qubits} raw qubits):")
        print(f"  Eve present: {args.eve}")
        print(f"  Matching bases: {len(res.matching_bases_indices)}")
        print(f"  QBER (Error Rate): {res.qber * 100:.2f}%")
        print(f"  Eve detected: {res.eve_detected}")
        print(f"  Secure: {res.secure}")
        if res.secure:
            print(f"  Shared Key ({len(res.final_key)} bits): {res.final_key}")
        else:
            print("  [!] Channel compromised! Key discarded due to detected eavesdropping.")

    elif args.command == "info":
        u = universe_age()
        bh = black_hole(1.0)
        print(f"Quantro Platform Engine v{__version__}")
        print("Author: Faruk Hilmi AKPINAR · Quantro ARGE")
        print(f"Universe Age (Planck PR4): {u.age_gyr} Gyr")
        print(f"Solar Mass Black Hole Radius: {bh.schwarzschild_radius_km} km")
        print("Docs & Lab: https://quantro-1.vercel.app")


if __name__ == "__main__":
    main()
