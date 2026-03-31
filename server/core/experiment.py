"""
Core Experiment Module — Wave-Harmonic Terrain Generation Pipeline

Implements the exact 4-phase generation pipeline from the research paper
(Section 3.5) and all 5 comparison pipelines for the benchmarking framework
(Section 3.7).

Pipelines
---------
A  raw_noise_baseline        — single-octave noise (no fBm, no waves, no erosion)
B  fbm_baseline              — fBm only (Equation 1)
C  fbm_eroded_baseline       — fBm + Thermal Erosion (Equations 1 + 4)
D  wave_harmonic_no_erosion  — fBm + Wave Enhancement + Contextual Scale (Eq. 1-3)
E  wave_harmonic_pipeline    — Full 4-phase (Equations 1-4)

All pipelines share the same `generate_base_noise()` for Phase I to guarantee
paired-comparison validity (Section 3.7).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

import numpy as np

from core.generators import _make_uv, _perlin2d, _simplex2d
from core.filters import thermal_erosion


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass
class PipelineParams:
    """All tuneable parameters for the Wave-Harmonic pipeline."""

    # Phase I — Base noise
    noise_type: Literal["perlin", "simplex"] = "perlin"
    frequency: float = 5.0
    octaves: int = 6
    persistence: float = 0.5   # amplitude decay per octave (a in Eq. 1)
    lacunarity: float = 2.0    # frequency multiplier per octave (f in Eq. 1)

    # Phase II — Wave enhancement
    wave_intensity: float = 0.3   # α in Eq. 2
    wave_count: int = 8           # N in Eq. 2

    # Phase IV — Thermal erosion
    erosion_iterations: int = 10
    talus_angle: float = 0.05     # T in Eq. 4
    thermal_rate: float = 0.5     # Kr in Eq. 4

    def copy(self, **overrides) -> "PipelineParams":
        """Return a shallow copy with optional field overrides."""
        d = {f: getattr(self, f) for f in self.__dataclass_fields__}
        d.update(overrides)
        return PipelineParams(**d)


DEFAULT_PARAMS = PipelineParams()


# ---------------------------------------------------------------------------
# Phase I — Base Noise Map Generation (Equation 1)
# ---------------------------------------------------------------------------

def generate_base_noise(
    N: int,
    seed: float,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """
    Fractal Brownian Motion (fBm) over Perlin or Simplex noise.

    P(x, y) = Σ_{i=0}^{k-1}  a^i · noise(f^i · x,  f^i · y)

    Returns an (N, N) float32 array normalised to approximately [0, 1].
    """
    p = params or DEFAULT_PARAMS
    U, V = _make_uv(N, N)
    freq_scaled = p.frequency * 0.5
    U = U * freq_scaled
    V = V * freq_scaled

    noise_fn = _perlin2d if p.noise_type == "perlin" else _simplex2d

    value = np.zeros((N, N), dtype=np.float32)
    amp = 1.0
    freq = 1.0

    for _ in range(p.octaves):
        value += noise_fn(U * freq, V * freq, seed) * amp
        amp *= p.persistence
        freq *= p.lacunarity

    # Normalise to [0, 1]
    return (value * 0.5 + 0.5).astype(np.float32)


# ---------------------------------------------------------------------------
# Phase II — Wave Enhancement Algorithm (Equation 2)
# ---------------------------------------------------------------------------

def generate_wave_offset(
    N: int,
    seed: float,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """
    Wave-interference structural offset field.

    ψ(x, y) = α · Σ_{j=1}^{N}  sin(k_j · p + δ_j)

    where k_j (wave vector) and δ_j (phase shift) are deterministically
    derived from `seed`.

    Returns an (N, N) float32 array centred around 0.
    """
    p = params or DEFAULT_PARAMS
    U, V = _make_uv(N, N)  # [0, 1)

    rng = np.random.default_rng(int(seed) + 9999)  # offset from Phase I seed

    accum = np.zeros((N, N), dtype=np.float64)

    for _j in range(p.wave_count):
        # Deterministic wave vector: random direction and spatial frequency
        angle = rng.random() * 2.0 * np.pi
        freq_mag = rng.random() * 4.0 + 1.0        # frequency in [1, 5]
        kx = np.cos(angle) * freq_mag
        ky = np.sin(angle) * freq_mag

        # Phase shift δ_j
        delta = rng.random() * 2.0 * np.pi

        # k_j · p + δ_j
        dot = U * kx + V * ky
        accum += np.sin(2.0 * np.pi * dot + delta)

    # Scale by wave intensity α
    psi = (p.wave_intensity * accum).astype(np.float32)
    return psi


# ---------------------------------------------------------------------------
# Phase III — Combination Logic / Contextual Scaling (Equation 3)
# ---------------------------------------------------------------------------

def combine_contextual(
    P: np.ndarray,
    psi: np.ndarray,
) -> np.ndarray:
    """
    H_final(x,y) = P(x,y) + P(x,y) · ψ(x,y)

    The multiplicative term P·ψ ensures that wave distortions scale with
    elevation: maximising jagged peaks (P≈1) while preserving smooth
    valleys (P≈0).
    """
    return (P + P * psi).astype(np.float32)


# ---------------------------------------------------------------------------
# Phase IV — Thermal Erosion (delegates to filters.py)
# ---------------------------------------------------------------------------

def apply_thermal_erosion(
    H: np.ndarray,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """Thin wrapper around the 8-neighbour thermal erosion from filters.py."""
    p = params or DEFAULT_PARAMS
    N = H.shape[0]
    return thermal_erosion(
        H, N, N,
        iterations=p.erosion_iterations,
        repose_angle=p.talus_angle,
        rate=p.thermal_rate,
    )


# ═══════════════════════════════════════════════════════════════════════════
# Pipeline Functions (A – E)
# ═══════════════════════════════════════════════════════════════════════════

def raw_noise_baseline(
    N: int,
    seed: float,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """
    Pipeline A — Raw Noise Baseline.
    Single-octave noise, no fBm, no wave enhancement, no erosion.
    """
    p = (params or DEFAULT_PARAMS).copy(octaves=1)
    return generate_base_noise(N, seed, p)


def fbm_baseline(
    N: int,
    seed: float,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """
    Pipeline B — Standard Enhancement Baseline (fBm only).
    Multi-octave fractal Brownian motion. No wave enhancement, no erosion.
    """
    return generate_base_noise(N, seed, params or DEFAULT_PARAMS)


def fbm_eroded_baseline(
    N: int,
    seed: float,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """
    Pipeline C — Standard Enhancement + Erosion.
    fBm (Phase I) → Thermal Erosion (Phase IV). No wave enhancement.
    Isolates the contribution of erosion on standard fBm terrain.
    """
    p = params or DEFAULT_PARAMS
    base = generate_base_noise(N, seed, p)
    return apply_thermal_erosion(base, p)


def wave_harmonic_no_erosion(
    N: int,
    seed: float,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """
    Pipeline D — Wave-Harmonic without Erosion (Phases I–III).
    fBm → Wave Enhancement → Contextual Scale. No thermal erosion.
    Isolates the contribution of wave enhancement + contextual scaling.
    """
    p = params or DEFAULT_PARAMS
    base = generate_base_noise(N, seed, p)
    psi = generate_wave_offset(N, seed, p)
    return combine_contextual(base, psi)


def wave_harmonic_pipeline(
    N: int,
    seed: float,
    params: PipelineParams | None = None,
) -> np.ndarray:
    """
    Pipeline E — Full Wave-Harmonic Pipeline (all 4 phases).
    fBm → Wave Enhancement → Contextual Scale → Thermal Erosion.
    This is the complete proposed method.
    """
    p = params or DEFAULT_PARAMS
    base = generate_base_noise(N, seed, p)
    psi = generate_wave_offset(N, seed, p)
    combined = combine_contextual(base, psi)
    return apply_thermal_erosion(combined, p)


# ---------------------------------------------------------------------------
# Registry for programmatic access
# ---------------------------------------------------------------------------

PIPELINES = {
    "A_raw_noise":              raw_noise_baseline,
    "B_fbm":                    fbm_baseline,
    "C_fbm_eroded":             fbm_eroded_baseline,
    "D_wave_harmonic_no_erode": wave_harmonic_no_erosion,
    "E_wave_harmonic_full":     wave_harmonic_pipeline,
}
"""Ordered dict of all pipeline functions keyed by short label."""
