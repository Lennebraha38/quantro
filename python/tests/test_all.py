import unittest
from quantro.crypto import BB84
from quantro.bloch import BlochSphere
from quantro.qrng import QRNG
from quantro.physics import (
    heisenberg_uncertainty,
    quantum_tunneling,
    double_slit_interference,
    schrodinger_cat,
    quantum_walk,
    quantum_teleportation,
)
from quantro.astrophysics import black_hole, universe_age, relativistic_doppler


class TestQuantroModules(unittest.TestCase):
    def test_bb84_without_eve(self):
        res = BB84.simulate(num_qubits=64, eve_present=False, seed=42)
        self.assertFalse(res.eve_detected)
        self.assertTrue(res.secure)
        self.assertEqual(res.qber, 0.0)
        self.assertTrue(len(res.final_key) > 0)

    def test_bb84_with_eve(self):
        res = BB84.simulate(num_qubits=128, eve_present=True, seed=123)
        self.assertTrue(res.qber > 0.10)
        self.assertTrue(res.eve_detected)
        self.assertFalse(res.secure)
        self.assertEqual(res.final_key, "")

    def test_bloch_sphere(self):
        bloch = BlochSphere()
        bloch.apply_h()
        pt = bloch.get_coordinates()
        self.assertAlmostEqual(pt.x, 1.0, places=2)
        self.assertAlmostEqual(pt.y, 0.0, places=2)
        self.assertAlmostEqual(pt.z, 0.0, places=2)

    def test_heisenberg(self):
        res = heisenberg_uncertainty(delta_x=1e-10)
        self.assertIn("min_delta_p_kg_m_s", res)
        self.assertTrue(res["min_delta_p_kg_m_s"] > 0)

    def test_tunneling(self):
        res = quantum_tunneling(barrier_width_nm=0.5, barrier_height_ev=10.0, particle_energy_ev=8.0)
        t = res["transmission_coefficient_T"]
        self.assertTrue(0.0 <= t <= 1.0)
        self.assertAlmostEqual(t + res["reflection_coefficient_R"], 1.0)

    def test_double_slit(self):
        res = double_slit_interference(wavelength_nm=500, slit_distance_um=20)
        pattern = res["pattern"]
        self.assertEqual(len(pattern), 100)
        self.assertTrue(all(0.0 <= p["intensity"] <= 1.0 for p in pattern))

    def test_schrodinger_cat(self):
        cat_super = schrodinger_cat(decay_probability=0.3, observe=False)
        self.assertFalse(cat_super["collapsed"])
        self.assertEqual(cat_super["state"], "superposition")

        cat_obs = schrodinger_cat(decay_probability=0.3, observe=True)
        self.assertTrue(cat_obs["collapsed"])
        self.assertIn(cat_obs["outcome"], ("alive", "dead"))

    def test_quantum_walk(self):
        qw = quantum_walk(steps=20, observe_every_step=False)
        self.assertIn("std_deviation", qw)
        self.assertTrue(qw["std_deviation"] > 0)

    def test_teleportation(self):
        res = quantum_teleportation()
        self.assertTrue(res["success"])
        self.assertIn("circuit_qasm", res)

    def test_astrophysics_universe_age(self):
        res = universe_age()
        self.assertAlmostEqual(res.age_gyr, 13.787, delta=0.2)

    def test_astrophysics_black_hole(self):
        res = black_hole(mass_solar=1.0)
        self.assertAlmostEqual(res.schwarzschild_radius_km, 2.95, delta=0.1)

    def test_doppler(self):
        res = relativistic_doppler(velocity_km_s=30000.0)  # 0.1c
        self.assertEqual(res["regime"], "redshift")
        self.assertTrue(res["redshift_z"] > 0)

    def test_qrng_offline_or_online(self):
        res = QRNG.get_hex(length=8)
        self.assertTrue(res["success"])
        self.assertEqual(len(res["data"]), 16)
        self.assertTrue(res["entropy"] > 0)


if __name__ == "__main__":
    unittest.main()
