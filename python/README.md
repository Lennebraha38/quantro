# Quantro (Python SDK)

[![PyPI version](https://img.shields.io/badge/pypi-v1.0.0-blue.svg)](https://pypi.org/project/quantro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-brightgreen.svg)](https://www.python.org/)

**Quantro** is an open-source, dependency-free Python toolkit for quantum computing simulations, live ANU quantum randomness, quantum cryptographic protocols, and astrophysics calculations.

Developed by **Faruk Hilmi AKPINAR** at Quantro ARGE.

## ⚡ Quickstart

```bash
pip install quantro
```

### 1. Quantum Circuit Simulation (Bell State)

```python
import quantro as qtr

# Create a 2-qubit circuit
qc = qtr.QuantumCircuit(2)

# Create Bell State (|00> + |11>) / sqrt(2)
qc.h(0)
qc.cx(0, 1)

# Inspect statevector & probabilities
print("Probabilities:", qc.get_probabilities())
# Output: {'00': 0.5, '11': 0.5}

# Sample measurement counts (1024 shots)
counts = qc.sample(shots=1024)
print("Sample counts:", counts)

# Export to OpenQASM or Qiskit
print(qc.to_qasm())
```

### 2. Live ANU Quantum Randomness (QRNG)

Fetch true quantum vacuum fluctuation entropy from the Australian National University (ANU) Quantum Optics lab:

```python
from quantro import QRNG

# Fetch quantum random bytes
raw_hex = QRNG.get_hex(length=16)
print("Quantum Hex:", raw_hex)

# Generate uniform random integers [1, 100]
random_numbers = QRNG.get_integers(count=5, min_val=1, max_val=100)
print("Quantum Integers:", random_numbers)

# Calculate Shannon Entropy
entropy = QRNG.calculate_entropy(raw_hex)
print(f"Entropy: {entropy:.4f} bits/symbol")
```

### 3. BB84 Quantum Key Distribution (QKD)

Simulate quantum key exchange with eavesdropper detection:

```python
from quantro.crypto import BB84

# Run protocol with 128 raw qubits
result = BB84.simulate(num_qubits=128, eve_present=False)
print("Shared Secret Key:", result.final_key)
print("QBER (Quantum Bit Error Rate):", result.qber)

# Simulate Eve intercepting
attack_result = BB84.simulate(num_qubits=128, eve_present=True)
print("Eve Detected:", attack_result.eve_detected) # True
```

### 4. Interactive Bloch Sphere Coordinates

```python
from quantro.bloch import BlochSphere

bloch = BlochSphere()
bloch.apply_h() # Rotate |0> to (|0> + |1>)/sqrt(2)
coords = bloch.get_coordinates()
print(f"x={coords.x:.2f}, y={coords.y:.2f}, z={coords.z:.2f}")
# Output: x=1.00, y=0.00, z=0.00
```

### 5. Astrophysics & Quantum Physics Calculators

```python
import quantro.astrophysics as astro
import quantro.physics as physics

# Black Hole Thermodynamics (10 Solar Masses)
bh = astro.black_hole(mass_solar=10)
print(f"Schwarzschild Radius: {bh.schwarzschild_radius_km:.2f} km")
print(f"Hawking Temperature: {bh.hawking_temperature_k:.2e} K")

# Cosmic Age Calculator (Planck 2020 Parameters)
universe = astro.universe_age(h0=67.4, omega_m=0.315, omega_lambda=0.685)
print(f"Age of Universe: {universe.age_gyr:.3f} Gyr")

# Quantum Tunneling Probability
trans = physics.quantum_tunneling(barrier_width_nm=0.5, barrier_height_ev=10.0, particle_energy_ev=9.0)
print(f"Transmission Coefficient T: {trans:.4e}")
```

## 🛠 Features

- **Zero heavy dependencies**: Pure Python standard library implementation.
- **13 Specialized Interactive Modules**: Circuits, QRNG, BB84, Bloch Sphere, Quantum Teleportation, Heisenberg, Quantum Tunneling, Double Slit, Schrödinger's Cat, Quantum Walk, Black Hole, Universe Age, Relativistic Doppler.
- **Export directly to Qiskit and OpenQASM**: Prototype in Quantro, run on IBM Quantum hardware.
- **CLI Utility**: Test circuits or generate quantum entropy directly in your terminal with `quantro`.

## 📄 License

MIT License · Copyright (c) 2025-2026 Faruk Hilmi AKPINAR / Quantro ARGE Merkezi.
