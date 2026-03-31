"""
Core Generation Layer — Filter Nodes
Implements every Filter/* node from Noise & TerrainGen using NumPy / SciPy.
Each function takes (arr, width, height, **properties) and returns float32 (height, width).
"""

from __future__ import annotations
import numpy as np
from scipy.ndimage import (
    uniform_filter,
    maximum_filter,
    minimum_filter,
    sobel as _scipy_sobel,
)


# ---------------------------------------------------------------------------
# Blur  (separable box blur, multiple passes)
# ---------------------------------------------------------------------------

def blur(arr: np.ndarray, width: int, height: int,
         *, amount: float = 2, passes: int = 3) -> np.ndarray:
    """Filter/Blur — separable Gaussian-approx box blur."""
    result = arr.astype(np.float32)
    # JS: amount * 0.001 * max(w,h) ≈ pixel radius; we use scipy.uniform_filter
    radius_px = max(1, int(amount * max(width, height) * 0.001 * 5))
    size = radius_px * 2 + 1
    for _ in range(int(passes)):
        result = uniform_filter(result, size=size, mode="nearest").astype(np.float32)
    return result


# ---------------------------------------------------------------------------
# Sobel Edge Detection
# ---------------------------------------------------------------------------

def sobel(arr: np.ndarray, width: int, height: int) -> np.ndarray:
    """Filter/Sobel."""
    gx = _scipy_sobel(arr, axis=1)
    gy = _scipy_sobel(arr, axis=0)
    return np.sqrt(gx**2 + gy**2).astype(np.float32)


# ---------------------------------------------------------------------------
# Posterize
# ---------------------------------------------------------------------------

def posterize(arr: np.ndarray, width: int, height: int,
              *, levels: int = 4) -> np.ndarray:
    """Filter/Posterize."""
    levels = max(2, int(levels))
    step = np.floor(arr * levels)
    return (step / (levels - 1)).astype(np.float32)


# ---------------------------------------------------------------------------
# Threshold / Mask
# ---------------------------------------------------------------------------

def threshold(arr: np.ndarray, width: int, height: int,
              *, threshold: float = 0.5, soft: float = 0) -> np.ndarray:
    """Filter/Threshold."""
    if soft <= 0.0001:
        return np.where(arr >= threshold, 1.0, 0.0).astype(np.float32)
    e0 = threshold - soft
    e1 = threshold + soft
    t = np.clip((arr - e0) / (e1 - e0), 0.0, 1.0)
    return (t * t * (3.0 - 2.0 * t)).astype(np.float32)


# ---------------------------------------------------------------------------
# Pixelate
# ---------------------------------------------------------------------------

def pixelate(arr: np.ndarray, width: int, height: int,
             *, pixelSize: float = 8) -> np.ndarray:
    """Filter/Pixelate."""
    size = max(1, int(pixelSize))
    result = arr.copy()
    # Average within each block by using nearest-neighbour downscale + upscale
    small_h = max(1, height // size)
    small_w = max(1, width  // size)
    # down
    small = arr[:small_h * size:size, :small_w * size:size]
    # up (repeat)
    result = np.repeat(np.repeat(small, size, axis=0), size, axis=1)
    # crop/pad back to original size
    result = result[:height, :width]
    if result.shape != (height, width):
        pad_h = height - result.shape[0]
        pad_w = width  - result.shape[1]
        result = np.pad(result, ((0, pad_h), (0, pad_w)), mode="edge")
    return result.astype(np.float32)


# ---------------------------------------------------------------------------
# Dilate
# ---------------------------------------------------------------------------

def dilate(arr: np.ndarray, width: int, height: int,
           *, amount: float = 1, passes: int = 1) -> np.ndarray:
    """Filter/Dilate — morphological dilation."""
    result = arr.astype(np.float32)
    radius_px = max(1, int(amount * max(width, height) * 0.001))
    size = radius_px * 2 + 1
    for _ in range(int(passes)):
        result = maximum_filter(result, size=size, mode="nearest").astype(np.float32)
    return result


# ---------------------------------------------------------------------------
# Erode
# ---------------------------------------------------------------------------

def erode(arr: np.ndarray, width: int, height: int,
          *, amount: float = 1, passes: int = 1) -> np.ndarray:
    """Filter/Erode — morphological erosion."""
    result = arr.astype(np.float32)
    radius_px = max(1, int(amount * max(width, height) * 0.001))
    size = radius_px * 2 + 1
    for _ in range(int(passes)):
        result = minimum_filter(result, size=size, mode="nearest").astype(np.float32)
    return result


# ---------------------------------------------------------------------------
# Thermal Erosion
# ---------------------------------------------------------------------------

def thermal_erosion(arr: np.ndarray, width: int, height: int,
                    *, iterations: float = 10, repose_angle: float = 0.05, rate: float = 0.5) -> np.ndarray:
    """
    Filter/Thermal Erosion — 8-neighbour angle-of-repose simulation (Eq. 4).

    For each cell i and its 8 neighbours j:
        slope_ij = Δh_ij / d_ij
    where d_ij = 1 for cardinal, √2 for diagonal.
    If slope_ij > T (talus/repose_angle), material is transferred:
        transfer = Kr * (slope_ij - T)
    Material is sent to the single steepest-slope neighbour.
    """
    h = arr.copy().astype(np.float32)
    iters = max(1, int(iterations))
    T = float(repose_angle)
    Kr = float(rate)
    SQRT2 = np.float32(1.4142135623730951)

    # 8 neighbour offsets: (row_shift, col_shift, distance)
    #   0=up, 1=down, 2=left, 3=right, 4=up-left, 5=up-right, 6=down-left, 7=down-right
    for _ in range(iters):
        # Height differences h[neighbour] - h[cell] for all 8 directions
        # Cardinal (distance = 1)
        d_up  = np.empty_like(h); d_up[:-1, :] = h[1:, :]  - h[:-1, :]; d_up[-1, :] = 0
        d_dn  = np.empty_like(h); d_dn[1:, :]  = h[:-1, :] - h[1:, :];  d_dn[0, :]  = 0
        d_lt  = np.empty_like(h); d_lt[:, :-1]  = h[:, 1:]  - h[:, :-1]; d_lt[:, -1] = 0
        d_rt  = np.empty_like(h); d_rt[:, 1:]   = h[:, :-1] - h[:, 1:];  d_rt[:, 0]  = 0
        # Diagonal (distance = √2)
        d_ul = np.empty_like(h); d_ul[:-1, :-1] = h[1:, 1:]   - h[:-1, :-1]; d_ul[-1, :] = 0; d_ul[:, -1] = 0
        d_ur = np.empty_like(h); d_ur[:-1, 1:]  = h[1:, :-1]  - h[:-1, 1:];  d_ur[-1, :] = 0; d_ur[:, 0]  = 0
        d_dl = np.empty_like(h); d_dl[1:, :-1]  = h[:-1, 1:]  - h[1:, :-1];  d_dl[0, :]  = 0; d_dl[:, -1] = 0
        d_dr = np.empty_like(h); d_dr[1:, 1:]   = h[:-1, :-1] - h[1:, 1:];   d_dr[0, :]  = 0; d_dr[:, 0]  = 0

        # Compute slope = Δh / distance for each direction
        slopes = np.stack([
            d_up,       d_dn,       d_lt,       d_rt,        # cardinal / 1
            d_ul/SQRT2, d_ur/SQRT2, d_dl/SQRT2, d_dr/SQRT2,  # diagonal / √2
        ])  # shape (8, H, W)

        # Find the steepest downhill slope (most negative Δh → most positive slope magnitude)
        # slopes are h[nbr] - h[cell], so negative = cell is higher = downhill
        min_slope = np.min(slopes, axis=0)          # most negative slope value
        min_idx   = np.argmin(slopes, axis=0)        # which neighbour

        # Only transfer where slope exceeds talus threshold
        # slope < -T  means  |slope| > T  (downhill)
        mask = min_slope < -T
        excess = np.where(mask, -min_slope - T, 0.0)
        transfer = Kr * excess

        h -= transfer

        # Distribute transferred material to the steepest neighbour
        for idx, (r_shift, c_shift) in enumerate([
            (1, 0), (-1, 0), (0, 1), (0, -1),        # cardinal
            (1, 1), (1, -1), (-1, 1), (-1, -1),       # diagonal
        ]):
            t_dir = np.where(min_idx == idx, transfer, 0.0)
            if r_shift == 1 and c_shift == 0:
                h[1:, :]    += t_dir[:-1, :]
            elif r_shift == -1 and c_shift == 0:
                h[:-1, :]   += t_dir[1:, :]
            elif r_shift == 0 and c_shift == 1:
                h[:, 1:]    += t_dir[:, :-1]
            elif r_shift == 0 and c_shift == -1:
                h[:, :-1]   += t_dir[:, 1:]
            elif r_shift == 1 and c_shift == 1:
                h[1:, 1:]   += t_dir[:-1, :-1]
            elif r_shift == 1 and c_shift == -1:
                h[1:, :-1]  += t_dir[:-1, 1:]
            elif r_shift == -1 and c_shift == 1:
                h[:-1, 1:]  += t_dir[1:, :-1]
            elif r_shift == -1 and c_shift == -1:
                h[:-1, :-1] += t_dir[1:, 1:]

    return h


# ---------------------------------------------------------------------------
# Hydraulic Erosion
# ---------------------------------------------------------------------------

def hydraulic_erosion(arr: np.ndarray, width: int, height: int,
                      *, iterations: float = 10, rain: float = 0.01, 
                      capacity: float = 0.05, erosion: float = 0.1, deposition: float = 0.1) -> np.ndarray:
    """Filter/Hydraulic Erosion — grid-based water and sediment transport."""
    h = arr.copy().astype(np.float32)
    water = np.zeros_like(h)
    sediment = np.zeros_like(h)
    iters = max(1, int(iterations))
    
    for _ in range(iters):
        water += rain
        
        dup = np.pad(h[1:, :], ((0, 1), (0, 0)), mode='edge') - h
        ddn = np.pad(h[:-1, :], ((1, 0), (0, 0)), mode='edge') - h
        dlft = np.pad(h[:, 1:], ((0, 0), (0, 1)), mode='edge') - h
        drgt = np.pad(h[:, :-1], ((0, 0), (1, 0)), mode='edge') - h
        
        diffs = np.stack([dup, ddn, dlft, drgt])
        min_diff = np.min(diffs, axis=0) # steepest slope (negative)
        
        slope = np.abs(np.clip(min_diff, a_min=None, a_max=0))
        c = capacity * water * slope
        
        diff_seq = sediment - c
        deposit_amt = np.clip(diff_seq, 0, None) * deposition
        erde = np.clip(-diff_seq, 0, None) * erosion
        
        # Only erode what we have as water to prevent insane channeling
        erde = np.minimum(erde, water)
        
        h += deposit_amt
        sediment -= deposit_amt
        h -= erde
        sediment += erde
        
        transfer = water * 0.5
        min_idx = np.argmin(diffs, axis=0)
        mask = min_diff < 0
        transfer[~mask] = 0
        
        sediment_transfer = sediment * 0.5
        sediment_transfer[~mask] = 0
        
        water -= transfer
        sediment -= sediment_transfer
        
        t_up = transfer.copy(); s_up = sediment_transfer.copy()
        t_up[min_idx != 0] = 0; s_up[min_idx != 0] = 0
        water[1:, :] += t_up[:-1, :]; sediment[1:, :] += s_up[:-1, :]
        
        t_dn = transfer.copy(); s_dn = sediment_transfer.copy()
        t_dn[min_idx != 1] = 0; s_dn[min_idx != 1] = 0
        water[:-1, :] += t_dn[1:, :]; sediment[:-1, :] += s_dn[1:, :]
        
        t_lt = transfer.copy(); s_lt = sediment_transfer.copy()
        t_lt[min_idx != 2] = 0; s_lt[min_idx != 2] = 0
        water[:, 1:] += t_lt[:, :-1]; sediment[:, 1:] += s_lt[:, :-1]
        
        t_rt = transfer.copy(); s_rt = sediment_transfer.copy()
        t_rt[min_idx != 3] = 0; s_rt[min_idx != 3] = 0
        water[:, :-1] += t_rt[:, 1:]; sediment[:, :-1] += s_rt[:, 1:]

        water *= 0.9 # evaporate
        
    return h

# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

FILTERS: dict[str, callable] = {
    "Filter/Blur":       blur,
    "Filter/Sobel":      sobel,
    "Filter/Posterize":  posterize,
    "Filter/Threshold":  threshold,
    "Filter/Pixelate":   pixelate,
    "Filter/Dilate":     dilate,
    "Filter/Erode":      erode,
    "Filter/Thermal Erosion": thermal_erosion,
    "Filter/Hydraulic Erosion": hydraulic_erosion,
}

