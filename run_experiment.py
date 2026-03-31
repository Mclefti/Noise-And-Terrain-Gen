#!/usr/bin/env python3
"""
Wave-Harmonic Terrain Generation — Experiment Runner (CLI)

Executes the full experimental protocol from Sections 3.5 and 3.7:
  Step 1  Deterministic benchmark demonstration (seed=42)
  Step 2  Systematic paired-sample validation (seeds 1–50)
  Step 3  Performance benchmarking across 4 resolutions
  Step 4  Structural analysis (PSD, roughness)
  Step 5  Statistical validation (t-tests, regression)
  Step 6  Output artifacts (JSON report, matplotlib figures, .npy arrays)

Usage:
    python run_experiment.py                   # full run
    python run_experiment.py --quick           # smoke-test (256×256, 5 samples)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time

import numpy as np
from scipy import stats as sp_stats

# Ensure `server/` is on sys.path so `core.*` imports work
server_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server")
sys.path.insert(0, server_dir)

from core.experiment import (
    PipelineParams,
    PIPELINES,
    raw_noise_baseline,
    fbm_baseline,
    fbm_eroded_baseline,
    wave_harmonic_no_erosion,
    wave_harmonic_pipeline,
)
from core.benchmark import (
    compute_psd,
    compute_spectral_slope,
    compute_roughness_index,
    compute_regional_roughness,
    compute_high_freq_energy_deviation,
    compute_throughput,
    measure_generation,
    paired_t_test,
    wilcoxon_test,
    normality_test,
    regression_comparison,
)

# Try importing matplotlib — gracefully degrade if unavailable
try:
    import matplotlib
    matplotlib.use("Agg")  # non-interactive backend
    import matplotlib.pyplot as plt
    HAS_MPL = True
except ImportError:
    HAS_MPL = False

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PIPELINE_LABELS = {
    "A_raw_noise":              "A — Raw Noise",
    "B_fbm":                    "B — fBm Standard",
    "C_fbm_eroded":             "C — fBm + Erosion",
    "D_wave_harmonic_no_erode": "D — Wave-Harmonic (no erosion)",
    "E_wave_harmonic_full":     "E — Wave-Harmonic (full)",
}

PIPELINE_COLORS = {
    "A_raw_noise":              "#888888",
    "B_fbm":                    "#4A90D9",
    "C_fbm_eroded":             "#7B68EE",
    "D_wave_harmonic_no_erode": "#FF8C00",
    "E_wave_harmonic_full":     "#DC143C",
}


def ensure_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


# ═══════════════════════════════════════════════════════════════════════════
# Step 1 — Deterministic Benchmark Demonstration (seed=42)
# ═══════════════════════════════════════════════════════════════════════════

def step1_demonstration(out_dir: str, N: int, params: PipelineParams):
    """Generate and export one heightmap per pipeline at seed=42."""
    print("\n" + "=" * 60)
    print("STEP 1 — Deterministic Benchmark Demonstration (seed=42)")
    print("=" * 60)

    hmap_dir = ensure_dir(os.path.join(out_dir, "heightmaps", "demo"))
    seed = 42

    demo_maps = {}
    for key, fn in PIPELINES.items():
        t0 = time.perf_counter()
        hmap = fn(N, seed, params)
        dt = (time.perf_counter() - t0) * 1000
        np.save(os.path.join(hmap_dir, f"{key}_seed42.npy"), hmap)
        demo_maps[key] = hmap
        print(f"  {PIPELINE_LABELS[key]:42s}  {N}×{N}  {dt:8.1f} ms  "
              f"range=[{hmap.min():.4f}, {hmap.max():.4f}]")

    # Save as greyscale PNG visualisations
    if HAS_MPL:
        fig_dir = ensure_dir(os.path.join(out_dir, "figures"))
        fig, axes = plt.subplots(1, 5, figsize=(25, 5))
        for ax, (key, hmap) in zip(axes, demo_maps.items()):
            ax.imshow(hmap, cmap="terrain", vmin=0, vmax=1)
            ax.set_title(PIPELINE_LABELS[key], fontsize=10)
            ax.axis("off")
        fig.suptitle(f"Seed=42 Demonstration @ {N}×{N}", fontsize=14, fontweight="bold")
        fig.tight_layout()
        fig.savefig(os.path.join(fig_dir, "step1_demo_comparison.png"), dpi=150)
        plt.close(fig)
        print(f"  → Saved comparison figure to figures/step1_demo_comparison.png")

    return demo_maps


# ═══════════════════════════════════════════════════════════════════════════
# Step 2 — Systematic Paired-Sample Validation (seeds 1–50)
# ═══════════════════════════════════════════════════════════════════════════

def step2_paired_samples(out_dir: str, N: int, n_seeds: int, params: PipelineParams):
    """Generate paired heightmaps from all 5 pipelines for seeds 1..n_seeds."""
    print("\n" + "=" * 60)
    print(f"STEP 2 — Paired-Sample Validation (seeds 1–{n_seeds})")
    print("=" * 60)

    hmap_dir = ensure_dir(os.path.join(out_dir, "heightmaps", "paired"))
    all_maps: dict[str, list[np.ndarray]] = {k: [] for k in PIPELINES}

    for seed in range(1, n_seeds + 1):
        for key, fn in PIPELINES.items():
            hmap = fn(N, seed, params)
            all_maps[key].append(hmap)
            np.save(os.path.join(hmap_dir, f"{key}_seed{seed:03d}.npy"), hmap)

        if seed % 10 == 0 or seed == n_seeds:
            print(f"  Completed seed {seed}/{n_seeds}")

    return all_maps


# ═══════════════════════════════════════════════════════════════════════════
# Step 3 — Performance Benchmarking
# ═══════════════════════════════════════════════════════════════════════════

def step3_performance(out_dir: str, resolutions: list[int], n_samples: int,
                      params: PipelineParams):
    """Benchmark all pipelines across multiple resolutions."""
    print("\n" + "=" * 60)
    print(f"STEP 3 — Performance Benchmarking ({n_samples} runs × "
          f"{len(resolutions)} resolutions × {len(PIPELINES)} pipelines)")
    print("=" * 60)

    perf_data = {}
    seed = 42

    for N in resolutions:
        perf_data[N] = {}
        print(f"\n  Resolution {N}×{N}:")
        for key, fn in PIPELINES.items():
            result = measure_generation(fn, N, seed, params, n_samples=n_samples)
            throughput = compute_throughput(N, result.mean_latency_ms)
            perf_data[N][key] = {
                **result.to_dict(),
                "throughput_mpps": throughput,
                "latencies_ms": result.latencies_ms,
            }
            print(f"    {PIPELINE_LABELS[key]:42s}  "
                  f"μ={result.mean_latency_ms:8.2f} ms  "
                  f"σ={result.std_latency_ms:6.2f} ms  "
                  f"mem={result.peak_memory_mb:6.1f} MB  "
                  f"Th={throughput:6.2f} MP/s")

    return perf_data


# ═══════════════════════════════════════════════════════════════════════════
# Step 4 — Structural Analysis (PSD + Roughness)
# ═══════════════════════════════════════════════════════════════════════════

def step4_structural(out_dir: str, all_maps: dict[str, list[np.ndarray]]):
    """Compute PSD, spectral slope, and roughness for all paired samples."""
    print("\n" + "=" * 60)
    print("STEP 4 — Structural Analysis")
    print("=" * 60)

    structural_data: dict[str, dict] = {}

    for key in PIPELINES:
        slopes = []
        roughness_vals = []
        regional_diffs = []

        for hmap in all_maps[key]:
            freqs, psd = compute_psd(hmap)
            if len(freqs) > 2:
                sl = compute_spectral_slope(freqs, psd)
                slopes.append(sl["slope"])

            roughness_vals.append(compute_roughness_index(hmap))
            rr = compute_regional_roughness(hmap, threshold=0.5)
            regional_diffs.append(rr["differential"])

        structural_data[key] = {
            "spectral_slopes": slopes,
            "mean_spectral_slope": float(np.mean(slopes)) if slopes else 0.0,
            "std_spectral_slope": float(np.std(slopes, ddof=1)) if len(slopes) > 1 else 0.0,
            "roughness_values": roughness_vals,
            "mean_roughness": float(np.mean(roughness_vals)),
            "std_roughness": float(np.std(roughness_vals, ddof=1)) if len(roughness_vals) > 1 else 0.0,
            "regional_differentials": regional_diffs,
            "mean_regional_diff": float(np.mean(regional_diffs)),
        }
        print(f"  {PIPELINE_LABELS[key]:42s}  "
              f"β={structural_data[key]['mean_spectral_slope']:+.3f} ± "
              f"{structural_data[key]['std_spectral_slope']:.3f}  "
              f"roughness={structural_data[key]['mean_roughness']:.5f}  "
              f"Δrough={structural_data[key]['mean_regional_diff']:+.5f}")

    # PSD comparison plot (one representative sample seed=1)
    if HAS_MPL and all_maps:
        fig_dir = ensure_dir(os.path.join(out_dir, "figures"))

        # PSD overlay
        fig, ax = plt.subplots(figsize=(10, 6))
        for key in PIPELINES:
            if all_maps[key]:
                freqs, psd = compute_psd(all_maps[key][0])
                if len(freqs) > 0:
                    ax.loglog(freqs, psd, label=PIPELINE_LABELS[key],
                              color=PIPELINE_COLORS[key], linewidth=1.5)
        ax.set_xlabel("Spatial Frequency (cycles/pixel)", fontsize=12)
        ax.set_ylabel("Power Spectral Density", fontsize=12)
        ax.set_title("Power Spectrum Density — Log-Log Comparison (seed=1)", fontsize=13)
        ax.legend(fontsize=9)
        ax.grid(True, alpha=0.3)
        fig.tight_layout()
        fig.savefig(os.path.join(fig_dir, "step4_psd_comparison.png"), dpi=150)
        plt.close(fig)

        # Spectral slope scatter
        fig, ax = plt.subplots(figsize=(8, 5))
        positions = np.arange(len(PIPELINES))
        for i, key in enumerate(PIPELINES):
            slopes = structural_data[key]["spectral_slopes"]
            if slopes:
                ax.scatter([i] * len(slopes), slopes, alpha=0.4, s=12,
                           color=PIPELINE_COLORS[key])
                ax.errorbar(i, np.mean(slopes), yerr=np.std(slopes, ddof=1) if len(slopes) > 1 else 0,
                            fmt="o", color=PIPELINE_COLORS[key], capsize=5, markersize=8)
        ax.set_xticks(positions)
        ax.set_xticklabels([PIPELINE_LABELS[k] for k in PIPELINES], rotation=20, ha="right", fontsize=9)
        ax.set_ylabel("Spectral Slope (β)", fontsize=12)
        ax.set_title("Spectral Slope Distribution Across Pipelines", fontsize=13)
        ax.grid(True, axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(os.path.join(fig_dir, "step4_spectral_slopes.png"), dpi=150)
        plt.close(fig)

        # Regional roughness comparison
        fig, ax = plt.subplots(figsize=(8, 5))
        keys_list = list(PIPELINES.keys())
        means = [structural_data[k]["mean_regional_diff"] for k in keys_list]
        bars = ax.bar(positions, means,
                      color=[PIPELINE_COLORS[k] for k in keys_list], alpha=0.85)
        ax.set_xticks(positions)
        ax.set_xticklabels([PIPELINE_LABELS[k] for k in keys_list], rotation=20, ha="right", fontsize=9)
        ax.set_ylabel("Roughness Differential (high − low elevation)", fontsize=11)
        ax.set_title("Regional Roughness: High vs. Low Elevation", fontsize=13)
        ax.axhline(0, color="black", linewidth=0.5)
        ax.grid(True, axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(os.path.join(fig_dir, "step4_roughness_differential.png"), dpi=150)
        plt.close(fig)

        print(f"  → Saved PSD, slope, and roughness figures to figures/")

    #  High-frequency energy deviation (B baseline vs each)
    if all_maps.get("B_fbm"):
        freqs_b, psd_b = compute_psd(all_maps["B_fbm"][0])
        for key in ["D_wave_harmonic_no_erode", "E_wave_harmonic_full"]:
            if all_maps.get(key):
                freqs_e, psd_e = compute_psd(all_maps[key][0])
                dev = compute_high_freq_energy_deviation(freqs_b, psd_b, freqs_e, psd_e)
                print(f"  High-freq energy deviation (B vs {key}): {dev:+.1f}%")

    return structural_data


# ═══════════════════════════════════════════════════════════════════════════
# Step 5 — Statistical Tests
# ═══════════════════════════════════════════════════════════════════════════

def step5_statistics(perf_data: dict, structural_data: dict):
    """Run paired t-tests, Wilcoxon, and regression comparisons."""
    print("\n" + "=" * 60)
    print("STEP 5 — Statistical Validation")
    print("=" * 60)

    stats_report: dict = {"performance": {}, "structural": {}}

    # --- Performance comparisons (B vs E) ---
    for N, data in perf_data.items():
        if "B_fbm" in data and "E_wave_harmonic_full" in data:
            b_lats = data["B_fbm"]["latencies_ms"]
            e_lats = data["E_wave_harmonic_full"]["latencies_ms"]

            # Check normality of differences
            diffs = np.array(b_lats) - np.array(e_lats)
            norm = normality_test(diffs)

            if norm["normal"]:
                test = paired_t_test(b_lats, e_lats)
                test["test_used"] = "paired_t_test"
            else:
                test = wilcoxon_test(b_lats, e_lats)
                test["test_used"] = "wilcoxon"

            stats_report["performance"][f"latency_BvsE_{N}x{N}"] = test
            sig = "✓ significant" if test["significant"] else "✗ not significant"
            print(f"  Latency B vs E @ {N}×{N}: p={test['p_value']:.4f} ({sig}) "
                  f"[{test['test_used']}]")

    # --- Structural comparisons ---
    comparisons = [
        ("B_fbm", "D_wave_harmonic_no_erode", "Wave enhancement introduces novelty"),
        ("B_fbm", "E_wave_harmonic_full",     "Full method introduces novelty"),
        ("C_fbm_eroded", "E_wave_harmonic_full", "Waves add novelty beyond erosion alone"),
    ]

    for base_key, enh_key, description in comparisons:
        base_slopes = structural_data.get(base_key, {}).get("spectral_slopes", [])
        enh_slopes = structural_data.get(enh_key, {}).get("spectral_slopes", [])
        if base_slopes and enh_slopes:
            min_len = min(len(base_slopes), len(enh_slopes))
            result = regression_comparison(base_slopes[:min_len], enh_slopes[:min_len])
            label = f"slope_{base_key}_vs_{enh_key}"
            stats_report["structural"][label] = result
            sig = "✓" if result.get("significant", False) else "✗"
            print(f"  {description}:")
            print(f"    {PIPELINE_LABELS[base_key]} β={result['baseline_mean_slope']:+.3f} vs "
                  f"{PIPELINE_LABELS[enh_key]} β={result['enhanced_mean_slope']:+.3f}  "
                  f"p={result.get('p_value', 1.0):.4f} {sig}")

    # --- Regional roughness test (high vs low for D and E) ---
    for key in ["D_wave_harmonic_no_erode", "E_wave_harmonic_full"]:
        diffs = structural_data.get(key, {}).get("regional_differentials", [])
        if diffs:
            t_stat, p_val = sp_stats.ttest_1samp(diffs, 0.0)
            sig = "✓" if p_val < 0.05 else "✗"
            stats_report["structural"][f"roughness_differential_{key}"] = {
                "t_statistic": float(t_stat), "p_value": float(p_val),
                "significant": bool(p_val < 0.05), "mean_diff": float(np.mean(diffs)),
            }
            print(f"  Regional roughness differential ({PIPELINE_LABELS[key]}): "
                  f"mean={np.mean(diffs):+.5f}  p={p_val:.4f} {sig}")

    # Need scipy.stats imported at module level for ttest_1samp
    return stats_report


# ═══════════════════════════════════════════════════════════════════════════
# Step 6 — Output Artifacts
# ═══════════════════════════════════════════════════════════════════════════

def step6_save_report(out_dir: str, perf_data: dict, structural_data: dict,
                      stats_report: dict, params: PipelineParams):
    """Save the full JSON metrics report."""
    print("\n" + "=" * 60)
    print("STEP 6 — Saving Report")
    print("=" * 60)

    # Strip non-serialisable numpy arrays from structural_data
    clean_structural = {}
    for key, data in structural_data.items():
        clean_structural[key] = {
            k: v for k, v in data.items()
            if k not in ("spectral_slopes", "roughness_values", "regional_differentials")
        }
        # Store summary stats only
        clean_structural[key]["n_samples"] = len(data.get("spectral_slopes", []))

    # Strip raw latency arrays from perf_data
    clean_perf = {}
    for N, res_data in perf_data.items():
        clean_perf[str(N)] = {}
        for key, metrics in res_data.items():
            clean_perf[str(N)][key] = {
                k: v for k, v in metrics.items() if k != "latencies_ms"
            }

    report = {
        "experiment": "Wave-Harmonic Terrain Generation — Experimental Validation",
        "parameters": {
            "noise_type": params.noise_type,
            "frequency": params.frequency,
            "octaves": params.octaves,
            "persistence": params.persistence,
            "lacunarity": params.lacunarity,
            "wave_intensity": params.wave_intensity,
            "wave_count": params.wave_count,
            "erosion_iterations": params.erosion_iterations,
            "talus_angle": params.talus_angle,
            "thermal_rate": params.thermal_rate,
        },
        "performance": clean_perf,
        "structural": clean_structural,
        "statistics": stats_report,
    }

    report_path = os.path.join(out_dir, "metrics.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"  → Saved metrics report to metrics.json")

    # Map pipeline parameters to UI node parameters
    node_params = {
        "Phase I (Base Noise Node)": {
            "type": f"{params.noise_type}_noise",
            "properties": {
                "octaves": params.octaves,
                "persistence": params.persistence,
                "lacunarity": params.lacunarity,
                "frequency": params.frequency,
                "seed": "42 (example)"
            }
        },
        "Phase II (Wave Node Equivalent)": {
            "type": "wave_interference",
            "properties": {
                "wave_count": params.wave_count,
                "wave_intensity (alpha)": params.wave_intensity,
                "note": "Directions and phases are deterministically pseudo-randomized from the base seed."
            }
        },
        "Phase III (Combination Logic)": {
            "type": "math_ops / contextual_scale",
            "formula": "H = P + P * psi"
        },
        "Phase IV (Thermal Erosion Node)": {
            "type": "thermal_erosion",
            "properties": {
                "iterations": params.erosion_iterations,
                "repose_angle (T)": params.talus_angle,
                "rate (Kr)": params.thermal_rate
            }
        }
    }
    
    node_path = os.path.join(out_dir, "node_parameters.json")
    with open(node_path, "w") as f:
        json.dump(node_params, f, indent=2)
    print(f"  → Saved UI node mapping to node_parameters.json")

    # Performance bar chart (latency by resolution)
    if HAS_MPL and perf_data:
        fig_dir = ensure_dir(os.path.join(out_dir, "figures"))
        resolutions = sorted(perf_data.keys())
        n_pipes = len(PIPELINES)
        x = np.arange(len(resolutions))
        width = 0.15

        fig, ax = plt.subplots(figsize=(12, 6))
        for i, key in enumerate(PIPELINES):
            means = [perf_data[N].get(key, {}).get("mean_latency_ms", 0) for N in resolutions]
            stds = [perf_data[N].get(key, {}).get("std_latency_ms", 0) for N in resolutions]
            ax.bar(x + i * width, means, width, yerr=stds, label=PIPELINE_LABELS[key],
                   color=PIPELINE_COLORS[key], alpha=0.85, capsize=3)

        ax.set_xlabel("Resolution", fontsize=12)
        ax.set_ylabel("Mean Latency (ms)", fontsize=12)
        ax.set_title("Generation Latency by Resolution and Pipeline", fontsize=13)
        ax.set_xticks(x + width * (n_pipes - 1) / 2)
        ax.set_xticklabels([f"{N}×{N}" for N in resolutions])
        ax.legend(fontsize=9)
        ax.grid(True, axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(os.path.join(fig_dir, "step6_latency_comparison.png"), dpi=150)
        plt.close(fig)

        # Throughput chart
        fig, ax = plt.subplots(figsize=(12, 6))
        for i, key in enumerate(PIPELINES):
            tputs = [perf_data[N].get(key, {}).get("throughput_mpps", 0) for N in resolutions]
            ax.bar(x + i * width, tputs, width, label=PIPELINE_LABELS[key],
                   color=PIPELINE_COLORS[key], alpha=0.85)

        ax.set_xlabel("Resolution", fontsize=12)
        ax.set_ylabel("Throughput (MP/s)", fontsize=12)
        ax.set_title("Generation Throughput by Resolution and Pipeline", fontsize=13)
        ax.set_xticks(x + width * (n_pipes - 1) / 2)
        ax.set_xticklabels([f"{N}×{N}" for N in resolutions])
        ax.legend(fontsize=9)
        ax.grid(True, axis="y", alpha=0.3)
        fig.tight_layout()
        fig.savefig(os.path.join(fig_dir, "step6_throughput_comparison.png"), dpi=150)
        plt.close(fig)

        print(f"  → Saved performance charts to figures/")

    # ---- Generate .txt text report ----
    _write_text_report(out_dir, report, perf_data, structural_data, stats_report, params)


def _write_text_report(out_dir: str, json_report: dict,
                       perf_data: dict, structural_data: dict,
                       stats_report: dict, params: PipelineParams):
    """Write a comprehensive human-readable .txt report."""
    lines: list[str] = []
    w = lines.append  # shorthand

    def hr(ch="=", n=72):
        w(ch * n)

    def table_row(cols: list[str], widths: list[int]):
        row = "  "
        for col, wid in zip(cols, widths):
            row += str(col).ljust(wid)
        w(row)

    def table_sep(widths: list[int], ch="-"):
        row = "  "
        for wid in widths:
            row += ch * wid
        w(row)

    hr("=")
    w("  WAVE-HARMONIC TERRAIN GENERATION")
    w("  Experimental Validation Report")
    hr("=")
    w("")
    w(f"  Generated:  {time.strftime('%Y-%m-%d %H:%M:%S')}")
    w("")

    # ---- Section 1: Parameters ----
    hr("-")
    w("  1.  PIPELINE PARAMETERS")
    hr("-")
    w("")
    w(f"  Noise Algorithm    : {params.noise_type.capitalize()}")
    w(f"  Base Frequency     : {params.frequency}")
    w(f"  Octaves (k)        : {params.octaves}")
    w(f"  Persistence (a)    : {params.persistence}")
    w(f"  Lacunarity (f)     : {params.lacunarity}")
    w(f"  Wave Intensity (α) : {params.wave_intensity}")
    w(f"  Wave Count (N)     : {params.wave_count}")
    w(f"  Erosion Iterations : {params.erosion_iterations}")
    w(f"  Talus Angle (T)    : {params.talus_angle}")
    w(f"  Thermal Rate (Kr)  : {params.thermal_rate}")
    w("")

    # ---- Section 2: Pipeline Descriptions ----
    hr("-")
    w("  2.  PIPELINE DESCRIPTIONS")
    hr("-")
    w("")
    pipe_descs = [
        ("A", "Raw Noise Baseline",          "Single-octave noise (no fBm, no waves, no erosion)"),
        ("B", "Standard Enhancement (fBm)",  "Fractal Brownian Motion only (Phase I)"),
        ("C", "Standard Enhancement + Erosion", "fBm + Thermal Erosion (Phases I + IV)"),
        ("D", "Wave-Harmonic (no erosion)",   "fBm + Wave Enhancement + Contextual Scale (Phases I-III)"),
        ("E", "Wave-Harmonic (full)",         "Full 4-phase method (Phases I-IV)"),
    ]
    cw = [6, 36, 52]
    table_row(["#", "Pipeline", "Description"], cw)
    table_sep(cw)
    for letter, name, desc in pipe_descs:
        table_row([letter, name, desc], cw)
    w("")

    # ---- Section 3: Performance Benchmarking ----
    hr("-")
    w("  3.  PERFORMANCE BENCHMARKING")
    hr("-")
    w("")

    for N in sorted(perf_data.keys()):
        w(f"  Resolution: {N} x {N}")
        w("")
        cw = [42, 14, 14, 12, 12]
        table_row(["Pipeline", "μ (ms)", "σ (ms)", "Mem (MB)", "Th (MP/s)"], cw)
        table_sep(cw)
        for key in PIPELINES:
            d = perf_data[N].get(key, {})
            table_row([
                PIPELINE_LABELS[key],
                f"{d.get('mean_latency_ms', 0):>10.2f}",
                f"{d.get('std_latency_ms', 0):>10.2f}",
                f"{d.get('peak_memory_mb', 0):>8.1f}",
                f"{d.get('throughput_mpps', 0):>8.2f}",
            ], cw)
        w("")

    # ---- Section 4: Structural Analysis ----
    hr("-")
    w("  4.  STRUCTURAL ANALYSIS")
    hr("-")
    w("")
    w("  4.1  Spectral Slope (β) — Linear regression on log-log PSD")
    w("")
    cw = [42, 14, 14, 10]
    table_row(["Pipeline", "Mean β", "Std β", "N"], cw)
    table_sep(cw)
    for key in PIPELINES:
        d = structural_data.get(key, {})
        table_row([
            PIPELINE_LABELS[key],
            f"{d.get('mean_spectral_slope', 0):>+10.4f}",
            f"{d.get('std_spectral_slope', 0):>10.4f}",
            f"{len(d.get('spectral_slopes', [])):>6d}",
        ], cw)
    w("")

    w("  4.2  Roughness Index — Mean absolute Laplacian")
    w("")
    cw = [42, 14, 14]
    table_row(["Pipeline", "Mean", "Std"], cw)
    table_sep(cw)
    for key in PIPELINES:
        d = structural_data.get(key, {})
        table_row([
            PIPELINE_LABELS[key],
            f"{d.get('mean_roughness', 0):>10.6f}",
            f"{d.get('std_roughness', 0):>10.6f}",
        ], cw)
    w("")

    w("  4.3  Regional Roughness Differential (high − low elevation)")
    w("       Positive = rougher peaks, smoother valleys (validates P·ψ masking)")
    w("")
    cw = [42, 18]
    table_row(["Pipeline", "Mean Δ Roughness"], cw)
    table_sep(cw)
    for key in PIPELINES:
        d = structural_data.get(key, {})
        table_row([
            PIPELINE_LABELS[key],
            f"{d.get('mean_regional_diff', 0):>+14.6f}",
        ], cw)
    w("")

    # ---- Section 5: Statistical Validation ----
    hr("-")
    w("  5.  STATISTICAL VALIDATION")
    hr("-")
    w("")

    # 5.1 Performance tests
    perf_stats = stats_report.get("performance", {})
    if perf_stats:
        w("  5.1  Performance Comparisons (B vs E)")
        w("")
        cw = [30, 14, 12, 16]
        table_row(["Comparison", "p-value", "Signif.", "Test Used"], cw)
        table_sep(cw)
        for label, result in perf_stats.items():
            sig = "✓ YES" if result.get("significant", False) else "✗ NO"
            table_row([
                label,
                f"{result.get('p_value', 1.0):>10.4f}",
                f"{sig:>8s}",
                f"{result.get('test_used', 'n/a'):>12s}",
            ], cw)
        w("")

    # 5.2 Structural tests
    struct_stats = stats_report.get("structural", {})
    slope_tests = {k: v for k, v in struct_stats.items() if k.startswith("slope_")}
    rough_tests = {k: v for k, v in struct_stats.items() if k.startswith("roughness_")}

    if slope_tests:
        w("  5.2  Spectral Slope Comparisons")
        w("")
        for label, result in slope_tests.items():
            w(f"  {label}:")
            w(f"    Baseline  β = {result.get('baseline_mean_slope', 0):+.4f} "
              f"± {result.get('baseline_std_slope', 0):.4f}")
            w(f"    Enhanced  β = {result.get('enhanced_mean_slope', 0):+.4f} "
              f"± {result.get('enhanced_std_slope', 0):.4f}")
            p = result.get("p_value", 1.0)
            sig = "✓ Significant" if result.get("significant", False) else "✗ Not significant"
            w(f"    p-value     = {p:.4f}  ({sig})  [{result.get('test_used', 'n/a')}]")
            w("")

    if rough_tests:
        w("  5.3  Regional Roughness Differential Tests")
        w("       H₀: mean differential = 0  (no difference between high/low regions)")
        w("")
        cw = [50, 14, 12]
        table_row(["Pipeline", "p-value", "Signif."], cw)
        table_sep(cw)
        for label, result in rough_tests.items():
            pipeline_name = label.replace("roughness_differential_", "")
            sig = "✓ YES" if result.get("significant", False) else "✗ NO"
            table_row([
                PIPELINE_LABELS.get(pipeline_name, pipeline_name),
                f"{result.get('p_value', 1.0):>10.4f}",
                f"{sig:>8s}",
            ], cw)
        w("")

    # ---- Section 6: File Manifest ----
    hr("-")
    w("  6.  OUTPUT FILE MANIFEST")
    hr("-")
    w("")
    w(f"  Root: {os.path.abspath(out_dir)}")
    w("")

    for dirpath, dirnames, filenames in os.walk(out_dir):
        level = dirpath.replace(out_dir, "").count(os.sep)
        indent = "    " + "  " * level
        w(f"{indent}{os.path.basename(dirpath)}/")
        subindent = "    " + "  " * (level + 1)
        for fn in sorted(filenames):
            fpath = os.path.join(dirpath, fn)
            size_kb = os.path.getsize(fpath) / 1024
            w(f"{subindent}{fn}  ({size_kb:.1f} KB)")
    w("")

    # ---- Footer ----
    hr("=")
    w("  END OF REPORT")
    hr("=")

    # Write to file
    report_path = os.path.join(out_dir, "experiment_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  → Saved text report to {report_path}")


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Wave-Harmonic Terrain Generation — Experiment Runner"
    )
    parser.add_argument("--quick", action="store_true",
                        help="Quick smoke-test mode (256×256, 5 samples, 5 seeds)")
    default_out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "experiment_results")
    parser.add_argument("--out", default=default_out,
                        help="Output directory (default: experiment_results in project root)")
    parser.add_argument("--noise", choices=["perlin", "simplex"], default="perlin",
                        help="Noise algorithm for Phase I (default: perlin)")
    args = parser.parse_args()

    if args.quick:
        demo_N = 256
        paired_N = 256
        n_seeds = 5
        n_perf_samples = 5
        resolutions = [256]
    else:
        demo_N = 1024
        paired_N = 512
        n_seeds = 50
        n_perf_samples = 50
        resolutions = [256, 512, 1024, 2048]

    params = PipelineParams(noise_type=args.noise)
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    dir_name = f"run_{timestamp}_quick" if args.quick else f"run_{timestamp}"
    out_dir = ensure_dir(os.path.join(args.out, dir_name))

    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Wave-Harmonic Terrain Generation — Experiment Runner   ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"  Mode:       {'Quick (smoke-test)' if args.quick else 'Full experiment'}")
    print(f"  Noise:      {params.noise_type}")
    print(f"  Output:     {os.path.abspath(out_dir)}")
    print(f"  Pipelines:  {len(PIPELINES)} (A–E)")
    print(f"  Matplotlib: {'available' if HAS_MPL else 'NOT available (no figures)'}")

    t_start = time.perf_counter()

    # Step 1
    demo_maps = step1_demonstration(out_dir, demo_N, params)

    # Step 2
    all_maps = step2_paired_samples(out_dir, paired_N, n_seeds, params)

    # Step 3
    perf_data = step3_performance(out_dir, resolutions, n_perf_samples, params)

    # Step 4
    structural_data = step4_structural(out_dir, all_maps)

    # Step 5
    stats_report = step5_statistics(perf_data, structural_data)

    # Step 6
    step6_save_report(out_dir, perf_data, structural_data, stats_report, params)

    t_total = (time.perf_counter() - t_start)
    print(f"\n{'=' * 60}")
    print(f"  EXPERIMENT COMPLETE — Total time: {t_total:.1f}s")
    print(f"  Results saved to: {os.path.abspath(out_dir)}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
