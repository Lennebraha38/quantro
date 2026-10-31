"""
Quantro Astrophysics & Cosmology Engine
Physical models for Black Hole thermodynamics, Cosmic Age (Friedmann integration),
and Relativistic Doppler redshift.
"""

from __future__ import annotations
import math
from dataclasses import dataclass
from typing import Dict, Any

# Fundamental physical constants
G = 6.67430e-11  # m^3 kg^-1 s^-2
C = 299792458.0  # m s^-1
H_BAR = 1.054571817e-34  # J s
K_B = 1.380649e-23  # J K^-1
M_SOLAR = 1.98847e30  # kg
MPC_TO_M = 3.085677581e22  # meters per Megaparsec
SEC_PER_YEAR = 31557600.0  # seconds per year (Julian)


@dataclass
class BlackHoleMetrics:
    mass_solar: float
    mass_kg: float
    schwarzschild_radius_m: float
    schwarzschild_radius_km: float
    hawking_temperature_k: float
    bekenstein_hawking_entropy_j_k: float
    evaporation_time_years: float


def black_hole(mass_solar: float = 1.0) -> BlackHoleMetrics:
    """
    Computes Schwarzschild radius, Hawking temperature, Bekenstein-Hawking entropy,
    and evaporation lifetime for an uncharged, non-rotating Schwarzschild black hole.
    """
    m = mass_solar * M_SOLAR
    r_s = (2.0 * G * m) / (C ** 2)
    area = 4.0 * math.pi * (r_s ** 2)

    # Hawking temperature: T_H = (hbar * c^3) / (8 * pi * G * M * k_B)
    t_h = (H_BAR * (C ** 3)) / (8.0 * math.pi * G * m * K_B)

    # Bekenstein-Hawking entropy: S = (k_B * c^3 * A) / (4 * G * hbar)
    entropy = (K_B * (C ** 3) * area) / (4.0 * G * H_BAR)

    # Evaporation lifetime: t = (5120 * pi * G^2 * M^3) / (hbar * c^4)
    t_evap_sec = (5120.0 * math.pi * (G ** 2) * (m ** 3)) / (H_BAR * (C ** 4))
    t_evap_yr = t_evap_sec / SEC_PER_YEAR

    return BlackHoleMetrics(
        mass_solar=mass_solar,
        mass_kg=m,
        schwarzschild_radius_m=round(r_s, 2),
        schwarzschild_radius_km=round(r_s / 1000.0, 3),
        hawking_temperature_k=t_h,
        bekenstein_hawking_entropy_j_k=entropy,
        evaporation_time_years=t_evap_yr,
    )


@dataclass
class CosmicAgeResult:
    h0: float
    omega_m: float
    omega_lambda: float
    age_gyr: float
    hubble_time_gyr: float
    critical_density_kg_m3: float


def universe_age(
    h0: float = 67.4, omega_m: float = 0.315, omega_lambda: float = 0.685
) -> CosmicAgeResult:
    """
    Integrates the Friedmann equation for a flat Lambda-CDM model:
    t_0 = (1/H0) * integral_0^1 [a / sqrt(Omega_m * a + Omega_Lambda * a^4)] da
    Analytical solution for flat universe: t0 = (2 / (3 * H0 * sqrt(Omega_Lambda))) * asinh(sqrt(Omega_Lambda / Omega_m))
    """
    h0_si = (h0 * 1000.0) / MPC_TO_M  # s^-1
    hubble_time_sec = 1.0 / h0_si
    hubble_time_gyr = hubble_time_sec / (SEC_PER_YEAR * 1e9)

    # Analytical flat-universe integral
    if omega_lambda > 0 and omega_m > 0:
        factor = 2.0 / (3.0 * math.sqrt(omega_lambda))
        arg = math.sqrt(omega_lambda / omega_m)
        integral_val = factor * math.asinh(arg)
        t0_sec = hubble_time_sec * integral_val
        age_gyr = t0_sec / (SEC_PER_YEAR * 1e9)
    else:
        # Simple matter-dominated approximation 2 / (3 * H0)
        age_gyr = (2.0 / 3.0) * hubble_time_gyr

    # Critical density rho_crit = (3 * H0^2) / (8 * pi * G)
    rho_crit = (3.0 * (h0_si ** 2)) / (8.0 * math.pi * G)

    return CosmicAgeResult(
        h0=h0,
        omega_m=omega_m,
        omega_lambda=omega_lambda,
        age_gyr=round(age_gyr, 3),
        hubble_time_gyr=round(hubble_time_gyr, 3),
        critical_density_kg_m3=rho_crit,
    )


def relativistic_doppler(velocity_km_s: float, rest_wavelength_nm: float = 656.28) -> Dict[str, Any]:
    """
    Computes Relativistic Doppler shift (redshift/blueshift) for line of sight motion.
    beta = v / c
    1 + z = sqrt((1 + beta) / (1 - beta))
    lambda_obs = lambda_0 * (1 + z)
    """
    v_ms = velocity_km_s * 1000.0
    beta = max(-0.999999, min(0.999999, v_ms / C))
    ratio = (1.0 + beta) / (1.0 - beta)
    factor = math.sqrt(ratio)
    z = factor - 1.0
    obs_wavelength = rest_wavelength_nm * factor

    regime = "redshift" if z > 0 else ("blueshift" if z < 0 else "neutral")

    return {
        "velocity_km_s": velocity_km_s,
        "beta": round(beta, 6),
        "rest_wavelength_nm": rest_wavelength_nm,
        "observed_wavelength_nm": round(obs_wavelength, 3),
        "redshift_z": round(z, 6),
        "regime": regime,
        "formula": "1 + z = √((1 + β)/(1 - β))",
    }
