"""
Core Generation Layer — Transform Nodes
Implements every Transform/* node from Noise & TerrainGen using NumPy / SciPy.
Each function takes (arr, width, height, **properties) and returns float32 (height, width).
Nodes that take two inputs (warp map, dx/dy) take them as extra positional args.
"""

from __future__ import annotations
import numpy as np
from scipy.ndimage import map_coordinates


def _make_uv(width: int, height: int):
    u = (np.arange(width,  dtype=np.float32) + 0.5) / width
    v = (np.arange(height, dtype=np.float32) + 0.5) / height
    return np.meshgrid(u, v)   # (height, width)


def _sample(arr: np.ndarray, u: np.ndarray, v: np.ndarray,
            width: int, height: int) -> np.ndarray:
    """Bilinear sample arr at normalised UV coordinates with clamp."""
    u = np.clip(u, 0.0, 1.0)
    v = np.clip(v, 0.0, 1.0)
    coords_x = u * (width  - 1)
    coords_y = v * (height - 1)
    return map_coordinates(arr, [coords_y, coords_x],
                           order=1, mode="nearest").astype(np.float32)


# ---------------------------------------------------------------------------
# Warp
# ---------------------------------------------------------------------------

def warp(arr: np.ndarray, width: int, height: int,
         warp_map: np.ndarray | None = None, *, intensity: float = 5) -> np.ndarray:
    """Transform/Warp."""
    U, V = _make_uv(width, height)
    if warp_map is not None:
        w = warp_map
    else:
        w = np.zeros((height, width), dtype=np.float32)
    u2 = np.clip(U + intensity / width * w, 0.0, 1.0)
    v2 = np.clip(V + intensity / width * w, 0.0, 1.0)
    return _sample(arr, u2, v2, width, height)


# ---------------------------------------------------------------------------
# Rotate
# ---------------------------------------------------------------------------

def rotate(arr: np.ndarray, width: int, height: int,
           *, angle: float = 0) -> np.ndarray:
    """Transform/Rotate."""
    U, V = _make_uv(width, height)
    a = angle * np.pi / 180.0
    cu, su = np.cos(-a), np.sin(-a)
    ux = U - 0.5
    vx = V - 0.5
    ru = cu * ux - su * vx + 0.5
    rv = su * ux + cu * vx + 0.5
    return _sample(arr, ru, rv, width, height)


# ---------------------------------------------------------------------------
# Offset
# ---------------------------------------------------------------------------

def offset(arr: np.ndarray, width: int, height: int,
           *, offsetX: float = 0, offsetY: float = 0) -> np.ndarray:
    """Transform/Offset."""
    U, V = _make_uv(width, height)
    return _sample(arr, U + offsetX, V + offsetY, width, height)


# ---------------------------------------------------------------------------
# Mirror
# ---------------------------------------------------------------------------

def mirror(arr: np.ndarray, width: int, height: int,
           *, horizontal: bool = True, vertical: bool = False) -> np.ndarray:
    """Transform/Mirror."""
    U, V = _make_uv(width, height)
    if horizontal:
        U = 1.0 - U
    if vertical:
        V = 1.0 - V
    return _sample(arr, U, V, width, height)


# ---------------------------------------------------------------------------
# Stretch
# ---------------------------------------------------------------------------

def stretch(arr: np.ndarray, width: int, height: int,
            *, scaleX: float = 1, scaleY: float = 1) -> np.ndarray:
    """Transform/Stretch."""
    U, V = _make_uv(width, height)
    ux = (U - 0.5) / scaleX + 0.5
    vx = (V - 0.5) / scaleY + 0.5
    return _sample(arr, ux, vx, width, height)


# ---------------------------------------------------------------------------
# Cartesian to Polar
# ---------------------------------------------------------------------------

def cartesian_to_polar(arr: np.ndarray, width: int, height: int,
                        *, scale: float = 1) -> np.ndarray:
    """Transform/Cartesian to Polar."""
    U, V = _make_uv(width, height)
    dx = U - 0.5
    dy = V - 0.5
    r = np.sqrt(dx**2 + dy**2) / 0.5 * scale
    a = np.arctan2(dy, dx)
    nu = (a + np.pi) / (2.0 * np.pi)
    nv = r
    return _sample(arr, nu, nv, width, height)


# ---------------------------------------------------------------------------
# Polar to Cartesian
# ---------------------------------------------------------------------------

def polar_to_cartesian(arr: np.ndarray, width: int, height: int,
                        *, scale: float = 1) -> np.ndarray:
    """Transform/Polar to Cartesian."""
    U, V = _make_uv(width, height)
    angle  = U * 2.0 * np.pi
    radius = V * scale
    nu = 0.5 + np.cos(angle) * radius
    nv = 0.5 + np.sin(angle) * radius
    return _sample(arr, nu, nv, width, height)


# ---------------------------------------------------------------------------
# Radial Warp
# ---------------------------------------------------------------------------

def radial_warp(arr: np.ndarray, width: int, height: int,
                warp_map: np.ndarray | None = None,
                *, angleStrength: float = 2, radiusStrength: float = 0) -> np.ndarray:
    """Transform/Radial Warp."""
    U, V = _make_uv(width, height)
    dx = U - 0.5
    dy = V - 0.5
    radius = np.sqrt(dx**2 + dy**2)
    angle  = np.arctan2(dy, dx)
    if warp_map is not None:
        w = warp_map - 0.5
    else:
        w = np.zeros_like(arr)
    angle  = angle  + w * angleStrength
    radius = radius + w * radiusStrength
    nu = 0.5 + np.cos(angle) * radius
    nv = 0.5 + np.sin(angle) * radius
    return _sample(arr, nu, nv, width, height)


# ---------------------------------------------------------------------------
# Tile
# ---------------------------------------------------------------------------

def tile(arr: np.ndarray, width: int, height: int,
         *, repeatX: int = 2, repeatY: int = 2, seamless: bool = True) -> np.ndarray:
    """Transform/Tile."""
    U, V = _make_uv(width, height)
    u2 = U * repeatX
    v2 = V * repeatY
    if seamless:
        u2 = np.mod(u2, 2.0)
        v2 = np.mod(v2, 2.0)
        u2 = np.where(u2 > 1.0, 2.0 - u2, u2)
        v2 = np.where(v2 > 1.0, 2.0 - v2, v2)
    else:
        u2 = np.mod(u2, 1.0)
        v2 = np.mod(v2, 1.0)
    return _sample(arr, u2, v2, width, height)


# ---------------------------------------------------------------------------
# Tile Sampler
# ---------------------------------------------------------------------------

def _hash_ts(ax, ay, seed):
    return np.mod(np.sin(ax * 127.1 + ay * 311.7 + seed) * 43758.5453123, 1.0)


def tile_sampler(pattern: np.ndarray, width: int, height: int,
                 *, tilesX: float = 5, tilesY: float = 5, scale: float = 0.8,
                 randomPos: float = 0.3, randomScale: float = 0.2,
                 randomRot: float = 1.0, density: float = 1.0,
                 seed: float = 1) -> np.ndarray:
    """Transform/TileSampler."""
    U, V = _make_uv(width, height)
    cell_u = U * tilesX
    cell_v = V * tilesY
    base_u = np.floor(cell_u)
    base_v = np.floor(cell_v)
    frac_u = cell_u - base_u
    frac_v = cell_v - base_v

    result = np.zeros((height, width), dtype=np.float32)

    for dy in range(-1, 2):
        for dx in range(-1, 2):
            c_u = base_u + dx
            c_v = base_v + dy

            keep = _hash_ts(c_u + 100, c_v + 100, seed)
            mask = keep <= density

            r1 = _hash_ts(c_u,      c_v,      seed)
            r2 = _hash_ts(c_u + 10, c_v + 10, seed)
            r3 = _hash_ts(c_u + 20, c_v + 20, seed)
            r4 = _hash_ts(c_u + 30, c_v + 30, seed)

            jx = (r1 - 0.5) * randomPos
            jy = (r2 - 0.5) * randomPos
            s  = scale * (1.0 + (r3 - 1.0) * randomScale)
            a  = (r4 - 0.5) * 6.28318 * randomRot

            lu = frac_u - dx - 0.5 - jx
            lv = frac_v - dy - 0.5 - jy

            # rotate
            ca, sa = np.cos(a), np.sin(a)
            lu2 = ca * lu - sa * lv
            lv2 = sa * lu + ca * lv
            lu2 /= s
            lv2 /= s
            lu2 += 0.5
            lv2 += 0.5

            in_bounds = (lu2 >= 0.0) & (lu2 <= 1.0) & (lv2 >= 0.0) & (lv2 <= 1.0)
            v = _sample(pattern, lu2, lv2, width, height)
            result = np.where(mask & in_bounds, np.maximum(result, v), result)

    return result.astype(np.float32)


# ---------------------------------------------------------------------------
# Poisson Sampler
# ---------------------------------------------------------------------------

def poisson_sampler(pattern: np.ndarray, width: int, height: int,
                    *, scale: float = 8, radius: float = 0.15,
                    randomScale: float = 0.3, randomRot: float = 1.0,
                    seed: float = 1) -> np.ndarray:
    """Generator/PoissonSampler."""
    U, V = _make_uv(width, height)
    gu = U * scale
    gv = V * scale
    base_u = np.floor(gu)
    base_v = np.floor(gv)

    result = np.zeros((height, width), dtype=np.float32)

    for dy in range(-1, 2):
        for dx in range(-1, 2):
            c_u = base_u + dx
            c_v = base_v + dy
            rnd_u = _hash_ts(c_u,       c_v,       seed)
            rnd_v = _hash_ts(c_u + 1.3, c_v + 1.3, seed)
            point_u = c_u + rnd_u
            point_v = c_v + rnd_v

            diff_u = gu - point_u
            diff_v = gv - point_v
            dist   = np.sqrt(diff_u**2 + diff_v**2)
            in_r   = dist <= radius

            rs = 1.0 + (_hash_ts(c_u + 5, c_v + 5, seed) - 1.0) * randomScale
            a  = (_hash_ts(c_u + 10, c_v + 10, seed) - 0.5) * 6.28318 * randomRot
            ca, sa = np.cos(a), np.sin(a)

            lu = diff_u / radius
            lv = diff_v / radius
            lu2 = ca * lu - sa * lv
            lv2 = sa * lu + ca * lv
            lu2 /= rs
            lv2 /= rs
            lu2 = lu2 * 0.5 + 0.5
            lv2 = lv2 * 0.5 + 0.5

            in_bounds = (lu2 >= 0.0) & (lu2 <= 1.0) & (lv2 >= 0.0) & (lv2 <= 1.0)
            v = _sample(pattern, lu2, lv2, width, height)
            result = np.where(in_r & in_bounds, np.maximum(result, v), result)

    return result.astype(np.float32)


# ---------------------------------------------------------------------------
# Displace
# ---------------------------------------------------------------------------

def displace(arr: np.ndarray, width: int, height: int,
             dx_map: np.ndarray | None, dy_map: np.ndarray | None,
             *, strength: float = 20) -> np.ndarray:
    """Transform/Displace."""
    U, V = _make_uv(width, height)
    dx_ = ((dx_map if dx_map is not None else np.full_like(arr, 0.5)) - 0.5) * strength / width
    dy_ = ((dy_map if dy_map is not None else np.full_like(arr, 0.5)) - 0.5) * strength / height
    return _sample(arr, U + dx_, V + dy_, width, height)


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

TRANSFORMS: dict[str, callable] = {
    "Transform/Warp":               warp,
    "Transform/Rotate":             rotate,
    "Transform/Offset":             offset,
    "Transform/Mirror":             mirror,
    "Transform/Stretch":            stretch,
    "Transform/Cartesian to Polar": cartesian_to_polar,
    "Transform/Polar to Cartesian": polar_to_cartesian,
    "Transform/Radial Warp":        radial_warp,
    "Transform/Tile":               tile,
    "Transform/TileSampler":        tile_sampler,
    "Generator/PoissonSampler":     poisson_sampler,  # registered under Generator in JS
    "Transform/Displace":           displace,
}
