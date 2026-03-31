"""
Benchmarking & Analysis Module — Evaluation Metrics (Sections 3.6–3.8)

Implements:
- Structural metrics: PSD (spectral analysis), spectral slope, roughness index
- Performance metrics: latency/throughput measurement, memory profiling
- Statistical validation: paired t-tests, Wilcoxon, regression comparison
"""

from __future__ import annotations

import time
import tracemalloc
from dataclasses import dataclass, field
from typing import Any, Callable

import numpy as np
from scipy import stats as sp_stats
from scipy.ndimage import laplace


# ═══════════════════════════════════════════════════════════════════════════
# Structural Metrics
# ═══════════════════════════════════════════════════════════════════════════

def compute_psd(heightmap: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Compute the radially-averaged Power Spectral Density (PSD) of a heightmap.

    Applies a 2D FFT, computes the power spectrum, then averages over
    concentric frequency rings to produce a 1-D PSD curve.

    Returns
    -------
    freqs : np.ndarray   — spatial frequency bins (cycles / pixel)
    psd   : np.ndarray   — mean power in each frequency bin
    """
    N = heightmap.shape[0]
    assert heightmap.shape == (N, N), "Heightmap must be square"

    # 2D FFT → power spectrum
    ft = np.fft.fft2(heightmap)
    ft_shift = np.fft.fftshift(ft)
    power = np.abs(ft_shift) ** 2

    # Build radial frequency map
    centre = N // 2
    y, x = np.ogrid[-centre:N - centre, -centre:N - centre]
    r = np.sqrt(x * x + y * y).astype(int)

    max_r = centre
    freqs = np.arange(1, max_r)
    psd = np.zeros(len(freqs), dtype=np.float64)

    for i, radius in enumerate(freqs):
        ring = power[r == radius]
        if len(ring) > 0:
            psd[i] = ring.mean()
        else:
            psd[i] = 0.0

    # Convert bin indices to spatial frequency (cycles/pixel)
    freq_vals = freqs.astype(np.float64) / N

    # Filter out zero-power bins for log-safety
    mask = psd > 0
    return freq_vals[mask], psd[mask]


def compute_spectral_slope(freqs: np.ndarray, psd: np.ndarray) -> dict[str, float]:
    """
    Fit a linear regression to the log-log PSD plot.

    Returns
    -------
    dict with keys: slope (β), intercept, r_squared, p_value, std_err
    """
    log_f = np.log10(freqs)
    log_p = np.log10(psd)

    slope, intercept, r_value, p_value, std_err = sp_stats.linregress(log_f, log_p)
    return {
        "slope": float(slope),
        "intercept": float(intercept),
        "r_squared": float(r_value ** 2),
        "p_value": float(p_value),
        "std_err": float(std_err),
    }


def compute_roughness_index(heightmap: np.ndarray) -> float:
    """
    Compute mean absolute Laplacian as a roughness index.

    The Laplacian measures the rate of change in gradient — a high value
    indicates rapid slope changes (rough terrain).
    """
    lap = laplace(heightmap.astype(np.float64))
    return float(np.mean(np.abs(lap)))


def compute_regional_roughness(
    heightmap: np.ndarray,
    threshold: float = 0.5,
) -> dict[str, float]:
    """
    Compute roughness index separately for high-elevation (≥ threshold) and
    low-elevation (< threshold) regions.

    Validates the multiplicative masking P·ψ — high regions should be rougher.
    """
    lap = np.abs(laplace(heightmap.astype(np.float64)))
    high_mask = heightmap >= threshold
    low_mask = heightmap < threshold

    high_roughness = float(np.mean(lap[high_mask])) if np.any(high_mask) else 0.0
    low_roughness = float(np.mean(lap[low_mask])) if np.any(low_mask) else 0.0

    return {
        "high_elevation_roughness": high_roughness,
        "low_elevation_roughness": low_roughness,
        "differential": high_roughness - low_roughness,
        "ratio": high_roughness / low_roughness if low_roughness > 0 else float("inf"),
    }


def compute_high_freq_energy_deviation(
    freqs_baseline: np.ndarray, psd_baseline: np.ndarray,
    freqs_enhanced: np.ndarray, psd_enhanced: np.ndarray,
    cutoff_fraction: float = 0.5,
) -> float:
    """
    Compute the % deviation in high-frequency energy between two PSD curves.

    High-frequency is defined as the upper `cutoff_fraction` of the frequency range.
    Returns the percentage difference: (enhanced - baseline) / baseline * 100.
    """
    # Use the shorter frequency range
    max_len = min(len(freqs_baseline), len(freqs_enhanced))
    cutoff_idx = int(max_len * cutoff_fraction)

    energy_base = np.sum(psd_baseline[cutoff_idx:max_len])
    energy_enh = np.sum(psd_enhanced[cutoff_idx:max_len])

    if energy_base > 0:
        return float((energy_enh - energy_base) / energy_base * 100.0)
    return 0.0


# ═══════════════════════════════════════════════════════════════════════════
# Performance Metrics
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class PerformanceResult:
    """Container for timing and memory measurements."""
    latencies_ms: list[float] = field(default_factory=list)
    peak_memory_mb: float = 0.0

    @property
    def mean_latency_ms(self) -> float:
        return float(np.mean(self.latencies_ms)) if self.latencies_ms else 0.0

    @property
    def std_latency_ms(self) -> float:
        return float(np.std(self.latencies_ms, ddof=1)) if len(self.latencies_ms) > 1 else 0.0

    @property
    def n_samples(self) -> int:
        return len(self.latencies_ms)

    def to_dict(self) -> dict[str, Any]:
        return {
            "mean_latency_ms": self.mean_latency_ms,
            "std_latency_ms": self.std_latency_ms,
            "peak_memory_mb": self.peak_memory_mb,
            "n_samples": self.n_samples,
        }


def measure_generation(
    pipeline_fn: Callable,
    N: int,
    seed: float,
    params: Any,
    n_samples: int = 50,
) -> PerformanceResult:
    """
    Time `n_samples` executions of `pipeline_fn(N, seed, params)` using
    high-resolution performance counters.

    Also measures peak memory allocation via tracemalloc.
    """
    result = PerformanceResult()

    # Warm-up run (excluded from measurements)
    pipeline_fn(N, seed, params)

    # Memory profiling on a single representative run
    tracemalloc.start()
    pipeline_fn(N, seed, params)
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    result.peak_memory_mb = peak / (1024 * 1024)

    # Timed runs
    for _ in range(n_samples):
        t0 = time.perf_counter()
        pipeline_fn(N, seed, params)
        t1 = time.perf_counter()
        result.latencies_ms.append((t1 - t0) * 1000.0)

    return result


def compute_throughput(N: int, latency_ms: float) -> float:
    """
    Throughput in Megapixels/sec.

    Th = (N × N) / latency_seconds  → converted to MP/s.
    """
    if latency_ms <= 0:
        return 0.0
    pixels = N * N
    seconds = latency_ms / 1000.0
    return pixels / seconds / 1_000_000


# ═══════════════════════════════════════════════════════════════════════════
# Statistical Validation (Section 3.8)
# ═══════════════════════════════════════════════════════════════════════════

def paired_t_test(
    baseline: list[float] | np.ndarray,
    enhanced: list[float] | np.ndarray,
) -> dict[str, float]:
    """
    Paired t-test for comparing two sets of measurements.
    Returns t-statistic, p-value, and whether the difference is significant
    at α = 0.05.
    """
    t_stat, p_value = sp_stats.ttest_rel(baseline, enhanced)
    return {
        "t_statistic": float(t_stat),
        "p_value": float(p_value),
        "significant": bool(p_value < 0.05),
    }


def wilcoxon_test(
    baseline: list[float] | np.ndarray,
    enhanced: list[float] | np.ndarray,
) -> dict[str, float]:
    """
    Wilcoxon signed-rank test (non-parametric alternative to paired t-test).
    Used when data may not be normally distributed.
    """
    try:
        stat, p_value = sp_stats.wilcoxon(
            np.array(baseline) - np.array(enhanced),
            alternative="two-sided",
        )
        return {
            "w_statistic": float(stat),
            "p_value": float(p_value),
            "significant": bool(p_value < 0.05),
        }
    except ValueError:
        # All differences are zero
        return {"w_statistic": 0.0, "p_value": 1.0, "significant": False}


def normality_test(data: list[float] | np.ndarray) -> dict[str, float]:
    """Shapiro-Wilk normality test. p < 0.05 → reject normality."""
    if len(data) < 3:
        return {"w_statistic": 0.0, "p_value": 1.0, "normal": True}
    stat, p = sp_stats.shapiro(data)
    return {"w_statistic": float(stat), "p_value": float(p), "normal": bool(p >= 0.05)}


def regression_comparison(
    slopes_baseline: list[float] | np.ndarray,
    slopes_enhanced: list[float] | np.ndarray,
) -> dict[str, Any]:
    """
    Compare two sets of spectral slopes using a paired t-test.
    Reports mean slopes for each group and the statistical comparison.
    """
    base_arr = np.array(slopes_baseline)
    enh_arr = np.array(slopes_enhanced)
    comparison = paired_t_test(base_arr, enh_arr)

    # Check normality — fall back to Wilcoxon if non-normal
    norm_check = normality_test(base_arr - enh_arr)
    if not norm_check["normal"]:
        comparison = wilcoxon_test(base_arr, enh_arr)
        comparison["test_used"] = "wilcoxon"
    else:
        comparison["test_used"] = "paired_t_test"

    return {
        "baseline_mean_slope": float(np.mean(base_arr)),
        "baseline_std_slope": float(np.std(base_arr, ddof=1)),
        "enhanced_mean_slope": float(np.mean(enh_arr)),
        "enhanced_std_slope": float(np.std(enh_arr, ddof=1)),
        **comparison,
    }
