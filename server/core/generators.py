"""
Core Generation Layer — Generator Nodes
Implements every Generator/* node from the Noise & TerrainGen JS frontend as a
vectorised NumPy function.

All functions accept (width, height, **properties) and return a float32
ndarray of shape (height, width) with values in approximately [0, 1].

Hash / gradient implementations are ported GLSL-for-GLSL from generator.js
so that outputs match the browser preview.
"""

from __future__ import annotations
import numpy as np

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _make_uv(width: int, height: int):
    """Return (U, V) meshgrids in [0,1)^2, shape (height, width)."""
    u = (np.arange(width, dtype=np.float32) + 0.5) / width
    v = (np.arange(height, dtype=np.float32) + 0.5) / height
    U, V = np.meshgrid(u, v)
    return U, V


def _hash22(px: np.ndarray, py: np.ndarray, seed: float) -> tuple[np.ndarray, np.ndarray]:
    """
    Port of the GLSL hash(vec2 p) used throughout generator.js:
        vec3 p3 = fract(vec3(p.xyx) * 0.1031 + seed * 0.13);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    Returns two independent hash values (h_x, h_y) by calling hash on (px,py) and (py,px).
    """
    def _h(ax, ay):
        # p3 = fract(vec3(ax, ay, ax) * 0.1031 + seed*0.13)
        p3x = np.mod(ax * 0.1031 + seed * 0.13, 1.0)
        p3y = np.mod(ay * 0.1031 + seed * 0.13, 1.0)
        p3z = np.mod(ax * 0.1031 + seed * 0.13, 1.0)
        # p3 += dot(p3, p3.yzx + 33.33)
        d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33)
        p3x = np.mod(p3x + d, 1.0)
        p3y = np.mod(p3y + d, 1.0)
        p3z = np.mod(p3z + d, 1.0)
        return np.mod((p3x + p3y) * p3z, 1.0)
    return _h(px, py), _h(py, px)


def _hash_single(px: np.ndarray, py: np.ndarray, seed: float) -> np.ndarray:
    """Single hash value per pixel, matching the GLSL hash(vec2 p)."""
    p3x = np.mod(px * 0.1031 + seed * 0.13, 1.0)
    p3y = np.mod(py * 0.1031 + seed * 0.13, 1.0)
    p3z = np.mod(px * 0.1031 + seed * 0.13, 1.0)
    d = p3x * (p3y + 33.33) + p3y * (p3z + 33.33) + p3z * (p3x + 33.33)
    p3x = np.mod(p3x + d, 1.0)
    p3y = np.mod(p3y + d, 1.0)
    p3z = np.mod(p3z + d, 1.0)
    return np.mod((p3x + p3y) * p3z, 1.0)


def _grad(px: np.ndarray, py: np.ndarray, seed: float):
    """
    GLSL:  float h = hash(p) * 6.2831853;  return vec2(cos(h), sin(h));
    Returns (gx, gy).
    """
    h = _hash_single(px, py, seed) * 6.2831853
    return np.cos(h), np.sin(h)


def _fade(t: np.ndarray) -> np.ndarray:
    """Quintic fade: t*t*t*(t*(t*6-15)+10)."""
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)


# ---------------------------------------------------------------------------
# 2D Perlin (gradient noise)
# ---------------------------------------------------------------------------

def _perlin2d(u: np.ndarray, v: np.ndarray, seed: float) -> np.ndarray:
    """Single octave Perlin noise, matching generator.js PerlinNode GLSL."""
    i = np.floor(u).astype(np.float32)
    j = np.floor(v).astype(np.float32)
    fu = u - i
    fv = v - j

    g00x, g00y = _grad(i,       j,       seed)
    g10x, g10y = _grad(i + 1.0, j,       seed)
    g01x, g01y = _grad(i,       j + 1.0, seed)
    g11x, g11y = _grad(i + 1.0, j + 1.0, seed)

    n00 = g00x * fu        + g00y * fv
    n10 = g10x * (fu-1.0)  + g10y * fv
    n01 = g01x * fu        + g01y * (fv-1.0)
    n11 = g11x * (fu-1.0)  + g11y * (fv-1.0)

    uf = _fade(fu)
    vf = _fade(fv)

    return (1-vf) * ((1-uf)*n00 + uf*n10) + vf * ((1-uf)*n01 + uf*n11)


def perlin(width: int, height: int, *, frequency: float = 5, octaves: int = 1,
           amplitude: float = 1, offset: float = 0, seed: float = 1) -> np.ndarray:
    """Generator/Perlin — FBM over hash-based gradient noise."""
    U, V = _make_uv(width, height)
    freq_scaled = frequency * 0.5
    U = U * freq_scaled
    V = V * freq_scaled

    value = np.zeros((height, width), dtype=np.float32)
    amp = float(amplitude)
    freq = 1.0

    for _ in range(int(octaves)):
        value += _perlin2d(U * freq + offset, V * freq + offset, seed) * amp
        amp  *= 0.5
        freq *= 2.0

    return (value * 0.5 + 0.5).astype(np.float32)


# ---------------------------------------------------------------------------
# 2D Simplex
# ---------------------------------------------------------------------------

def _simplex2d(u: np.ndarray, v: np.ndarray, seed: float) -> np.ndarray:
    """Single octave 2D Simplex, ported from generator.js SimplexNode GLSL."""
    F2 = 0.36602540378
    G2 = 0.2113248654

    s = (u + v) * F2
    ix = np.floor(u + s)
    jx = np.floor(v + s)

    t = (ix + jx) * G2
    X0 = ix - t
    Y0 = jx - t
    x0 = u - X0
    y0 = v - Y0

    # Simplex corner
    i1 = np.where(x0 > y0, 1.0, 0.0).astype(np.float32)
    j1 = 1.0 - i1

    x1 = x0 - i1 + G2
    y1 = y0 - j1 + G2
    x2 = x0 - 1.0 + 2.0 * G2
    y2 = y0 - 1.0 + 2.0 * G2

    g0x, g0y = _grad(ix,       jx,       seed)
    g1x, g1y = _grad(ix + i1,  jx + j1,  seed)
    g2x, g2y = _grad(ix + 1.0, jx + 1.0, seed)

    def contrib(gx, gy, dx, dy):
        t = 0.5 - dx*dx - dy*dy
        n = np.where(t < 0.0, 0.0, t**4 * (gx*dx + gy*dy))
        return n.astype(np.float32)

    n0 = contrib(g0x, g0y, x0, y0)
    n1 = contrib(g1x, g1y, x1, y1)
    n2 = contrib(g2x, g2y, x2, y2)
    return (70.0 * (n0 + n1 + n2)).astype(np.float32)


def simplex(width: int, height: int, *, frequency: float = 5, octaves: int = 1,
            amplitude: float = 1, offset: float = 0, seed: float = 1) -> np.ndarray:
    """Generator/Simplex — FBM over 2D Simplex noise."""
    U, V = _make_uv(width, height)
    freq_scaled = frequency * 0.5
    U = U * freq_scaled
    V = V * freq_scaled

    value = np.zeros((height, width), dtype=np.float32)
    amp = float(amplitude)
    freq = 1.0

    for _ in range(int(octaves)):
        value += _simplex2d(U * freq + offset, V * freq + offset, seed) * amp
        amp  *= 0.5
        freq *= 2.0

    return (value * 0.5 + 0.5).astype(np.float32)


# ---------------------------------------------------------------------------
# Directional Noise
# ---------------------------------------------------------------------------

def directional_noise(width: int, height: int, *, frequency: float = 5,
                      stretch: float = 20, amplitude: float = 1,
                      angle: float = 0, seed: float = 1) -> np.ndarray:
    """Generator/DirectionalNoise."""
    U, V = _make_uv(width, height)
    a = angle / 360.0 * np.pi * 2.0

    # rotate
    xr =  U * np.cos(a) + V * np.sin(a)
    yr = -U * np.sin(a) + V * np.cos(a)

    # stretch along rotated X
    xr *= stretch

    v = _simplex2d(xr * frequency, yr * frequency, seed) * amplitude
    return (v * 0.5 + 0.5).astype(np.float32)


# ---------------------------------------------------------------------------
# Ridged Noise
# ---------------------------------------------------------------------------

def ridged_noise(width: int, height: int, *, scale: float = 50,
                 octaves: int = 4, seed: float = 1) -> np.ndarray:
    """Generator/Ridged Noise — ridged FBM."""
    U, V = _make_uv(width, height)
    scale_f = scale * 0.01
    U = U / scale_f
    V = V / scale_f

    value = np.zeros((height, width), dtype=np.float32)
    amp = 1.0
    freq = 1.0

    for _ in range(int(octaves)):
        n = _simplex2d(U * freq, V * freq, seed)
        n = np.abs(n)
        n = 1.0 - n
        n *= n
        value += n * amp
        freq *= 2.0
        amp  *= 0.5

    return np.clip(value, 0.0, 1.0).astype(np.float32)


# ---------------------------------------------------------------------------
# Voronoi
# ---------------------------------------------------------------------------

def _h1(px, py, seed):
    p = np.stack([px, py], axis=-1) + seed
    return np.mod(np.cos(p[..., 0]*89.42 - p[..., 1]*75.7) * 343.42, 1.0)


def _h2(px, py, seed):
    # fract(cos(p * mat2(89.4,-75.7,-81.9,79.6)) * 343.42)
    ox = np.mod(np.cos(px*89.4  - py*81.9) * 343.42, 1.0)
    oy = np.mod(np.cos(px*(-75.7) + py*79.6) * 343.42, 1.0)
    ox += seed; oy += seed
    ox = np.mod(ox, 1.0); oy = np.mod(oy, 1.0)
    return ox, oy


def voronoi(width: int, height: int, *, scale: float = 40, seed: float = 1,
            type: str = "Distance") -> np.ndarray:
    """Generator/Voronoi — Distance or FlatCell."""
    U, V = _make_uv(width, height)
    s = scale * 0.005

    n_u = U / s
    n_v = V / s

    cell_u = np.floor(n_u)
    cell_v = np.floor(n_v)
    f_u = n_u - cell_u
    f_v = n_v - cell_v

    dis = np.full((height, width), 1e20, dtype=np.float32)
    id_ = np.zeros((height, width), dtype=np.float32)

    for xi in range(-1, 2):
        for yi in range(-1, 2):
            p_u = cell_u + xi
            p_v = cell_v + yi
            ox, oy = _h2(p_u, p_v, seed)
            d = np.sqrt((ox + xi - f_u)**2 + (oy + yi - f_v)**2)
            mask = d < dis
            dis = np.where(mask, d, dis)
            id_ = np.where(mask, _h1(p_u, p_v, seed), id_)

    result = dis if type == "Distance" else id_
    return np.clip(result, 0.0, 1.0).astype(np.float32)


# ---------------------------------------------------------------------------
# WhiteNoise
# ---------------------------------------------------------------------------

def white_noise(width: int, height: int, *, seed: float = 1) -> np.ndarray:
    """Generator/WhiteNoise — hash per pixel."""
    U, V = _make_uv(width, height)
    Ux = U * width
    Vy = V * height
    val = np.mod(np.sin(Ux * 12.9898 + Vy * 78.233 + seed) * 43758.5453, 1.0)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# CellNoise
# ---------------------------------------------------------------------------

def cell_noise(width: int, height: int, *, points: int = 20,
               thickness: float = 3, seed: float = 1) -> np.ndarray:
    """Generator/CellNoise — Worley edge cells."""
    U, V = _make_uv(width, height)
    px = U * width
    py = V * height
    t = thickness * min(width, height) * 0.05 * 0.01  # matches JS scaling

    rng = np.random.default_rng(int(seed))
    pts = rng.random((int(points), 2), dtype=np.float32)
    pts[:, 0] *= width
    pts[:, 1] *= height

    d1 = np.full((height, width), 1e20, dtype=np.float32)
    d2 = np.full((height, width), 1e20, dtype=np.float32)

    for i in range(int(points)):
        d = np.sqrt((px - pts[i, 0])**2 + (py - pts[i, 1])**2)
        new_d1 = np.minimum(d1, d)
        new_d2 = np.where(d >= d1, np.minimum(d2, d), np.minimum(d2, d1))
        d1, d2 = new_d1, new_d2

    edge = np.sqrt(d2) - np.sqrt(d1)
    val = np.where(edge < t, 1.0, 0.0)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# Checkerboard
# ---------------------------------------------------------------------------

def checkerboard(width: int, height: int, *, squares: int = 32) -> np.ndarray:
    """Generator/Checkerboard."""
    U, V = _make_uv(width, height)
    size = width / squares
    px = U * width
    py = V * height
    val = np.mod(np.floor(px / size) + np.floor(py / size), 2.0)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# HexGrid
# ---------------------------------------------------------------------------

def hex_grid(width: int, height: int, *, scale: float = 40) -> np.ndarray:
    """Generator/Hex Grid."""
    U, V = _make_uv(width, height)
    ux = U * width / scale
    vy = V * height / scale
    ux -= np.floor(vy) * 0.5
    g_u = np.floor(ux)
    g_v = np.floor(vy)
    f_u = ux - g_u - 0.5
    f_v = vy - g_v - 0.5
    # hexDist
    ax, ay = np.abs(f_u), np.abs(f_v)
    d = np.maximum(ax * 0.8660254 + ay * 0.5, ay)
    val = np.where(d < 0.5, 1.0, 0.0)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# Bricks
# ---------------------------------------------------------------------------

def bricks(width: int, height: int, *, bricksX: int = 8, bricksY: int = 4,
           mortar: float = 4, bevel: float = 6) -> np.ndarray:
    """Generator/Bricks."""
    U, V = _make_uv(width, height)
    uv_x = U * bricksX
    uv_y = V * bricksY
    row = np.floor(uv_y)
    uv_x = uv_x + np.mod(row, 2.0) * 0.5
    brick_x = np.mod(uv_x, 1.0)
    brick_y = np.mod(uv_y, 1.0)

    tile_w = width  / bricksX
    tile_h = height / bricksY
    mortar_tx = mortar / tile_w
    mortar_ty = mortar / tile_h
    bevel_tx  = bevel  / tile_w
    bevel_ty  = bevel  / tile_h

    mortar_mask = (
        np.where(brick_x <= mortar_tx,   1.0, 0.0) +
        np.where(brick_y <= mortar_ty,   1.0, 0.0) +
        np.where(1.0-brick_x <= mortar_tx, 1.0, 0.0) +
        np.where(1.0-brick_y <= mortar_ty, 1.0, 0.0)
    )
    mortar_mask = np.clip(mortar_mask, 0.0, 1.0)

    dist_edge = np.minimum(
        np.minimum(brick_x, 1.0 - brick_x),
        np.minimum(brick_y, 1.0 - brick_y)
    )
    bevel_size = np.minimum(min(bevel_tx, bevel_ty), 0.5)
    bevel_mask = np.clip(dist_edge / bevel_size, 0.0, 1.0)
    bevel_mask = bevel_mask ** 1.5

    val = (1.0 - mortar_mask) * bevel_mask
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# Truchet Tiles
# ---------------------------------------------------------------------------

def truchet_tiles(width: int, height: int, *, scale: float = 40,
                  seed: float = 1, thickness: float = 0.08) -> np.ndarray:
    """Generator/Truchet Tiles."""
    U, V = _make_uv(width, height)
    px = U * width
    py = V * height

    tx = np.floor(px / scale).astype(np.uint32)
    ty = np.floor(py / scale).astype(np.uint32)
    s  = np.uint32(int(seed))

    # uint hash
    h = tx * np.uint32(374761393) + ty * np.uint32(668265263) + s * np.uint32(982451653)
    h = (h ^ (h >> np.uint32(13))) * np.uint32(1274126177)
    h = h ^ (h >> np.uint32(16))
    flip = (h & np.uint32(1)) == np.uint32(0)

    lx = np.mod(px, scale) / scale
    ly = np.mod(py, scale) / scale

    d1a = np.sqrt(lx**2 + ly**2)
    d2a = np.sqrt((lx-1.0)**2 + (ly-1.0)**2)
    d1b = np.sqrt((lx-1.0)**2 + ly**2)
    d2b = np.sqrt(lx**2 + (ly-1.0)**2)

    d_flip = np.minimum(d1a, d2a)
    d_no   = np.minimum(d1b, d2b)
    d = np.where(flip, d_flip, d_no)

    val = np.where(np.abs(d - 0.5) < thickness, 1.0, 0.0)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# Stripes
# ---------------------------------------------------------------------------

def stripes(width: int, height: int, *, frequency: float = 10, width_: float = 0.5,
            softness: float = 0, vertical: bool = True) -> np.ndarray:
    """Generator/Stripes.  (width_ avoids shadowing built-in width)"""
    U, V = _make_uv(width, height)
    coord = U if vertical else V
    t = np.mod(coord * frequency, 1.0)
    if softness > 0:
        in_edge  = np.clip(t / softness, 0.0, 1.0)
        in_edge  = in_edge * in_edge * (3.0 - 2.0 * in_edge)
        out_edge = np.clip((width_ - t) / softness, 0.0, 1.0)
        out_edge = out_edge * out_edge * (3.0 - 2.0 * out_edge)
        val = in_edge * out_edge
    else:
        val = np.where(t < width_, 1.0, 0.0)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# Gradient
# ---------------------------------------------------------------------------

def gradient(width: int, height: int, *, type: str = "Horizontal",
             invert: bool = False) -> np.ndarray:
    """Generator/Gradient."""
    U, V = _make_uv(width, height)
    if type == "Horizontal":
        val = U
    elif type == "Vertical":
        val = V
    else:  # Radial
        cx = U - 0.5
        cy = V - 0.5
        val = np.sqrt(cx*cx + cy*cy) / 0.5
    if invert:
        val = 1.0 - val
    return np.clip(val, 0.0, 1.0).astype(np.float32)


# ---------------------------------------------------------------------------
# Dots
# ---------------------------------------------------------------------------

def dots(width: int, height: int, *, spacing: float = 0.1, radius: float = 0.03,
         softness: float = 0.01, stagger: bool = False) -> np.ndarray:
    """Generator/Dots."""
    U, V = _make_uv(width, height)
    cx = np.floor(U / spacing)
    cy = np.floor(V / spacing)
    offset_x = np.where(stagger & (np.mod(cy, 2.0) > 0.5), spacing * 0.5, 0.0)
    local_x = U - (cx * spacing + offset_x)
    local_y = V - cy * spacing
    dist = np.sqrt(local_x**2 + local_y**2)
    if softness > 0:
        t = np.clip((dist - (radius - softness)) / (2.0 * softness), 0.0, 1.0)
        val = 1.0 - (t * t * (3.0 - 2.0 * t))
    else:
        val = np.where(dist < radius, 1.0, 0.0)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# FormulaXY
# ---------------------------------------------------------------------------

def formula_xy(width: int, height: int, *, formula: str = "x*y") -> np.ndarray:
    """Generator/FormulaXY — safe eval of formula(x, y)."""
    U, V = _make_uv(width, height)
    x, y = U, V
    try:
        val = eval(formula, {"__builtins__": {}}, {  # noqa: S307
            "x": x, "y": y,
            "sin": np.sin, "cos": np.cos, "abs": np.abs,
            "sqrt": np.sqrt, "pow": np.power, "pi": np.pi,
            "min": np.minimum, "max": np.maximum, "mod": np.mod,
            "floor": np.floor, "ceil": np.ceil, "fract": lambda a: np.mod(a, 1.0),
            "clamp": np.clip, "mix": lambda a, b, t: a*(1-t)+b*t,
        })
        val = np.broadcast_to(val, (height, width))
    except Exception:
        val = np.zeros((height, width), dtype=np.float32)
    return np.clip(val, 0.0, 1.0).astype(np.float32)


# ---------------------------------------------------------------------------
# Wave Interference
# ---------------------------------------------------------------------------

def wave_interference(
    width: int, height: int, *,
    frequency: float = 8.0,
    sources: int = 5,
    phase: float = 0.0,
    decay: float = 0.0,
    seed: float = 1,
) -> np.ndarray:
    """
    Generator/Wave Interference

    Simulates the superposition of circular waves emitted from N randomly
    placed point sources.  Each source i contributes:

        amp_i * cos(2π * frequency * dist(uv, src_i) + phase)

    where amp_i = exp(-decay * dist) for physically-motivated amplitude fall-off
    (set decay=0 for equal-amplitude, infinite-plane-wave mode).

    Parameters
    ----------
    frequency : float  — spatial frequency of the waves (cycles per unit)
    sources   : int    — number of point sources  (1–32)
    phase     : float  — global phase shift in [0, 2π]
    decay     : float  — amplitude decay with distance (0 = no decay)
    seed      : float  — RNG seed for source positions
    """
    U, V = _make_uv(width, height)
    n = max(1, min(int(sources), 32))

    # Generate source positions deterministically from seed
    rng = np.random.default_rng(int(seed))
    src_x = rng.random(n).astype(np.float32)   # [0, 1]
    src_y = rng.random(n).astype(np.float32)

    TWO_PI = np.float32(2.0 * np.pi)
    freq   = np.float32(frequency)
    ph     = np.float32(phase)
    dec    = np.float32(decay)

    accum = np.zeros((width * height,), dtype=np.float64)
    U_flat = U.ravel()
    V_flat = V.ravel()

    for i in range(n):
        dx   = U_flat - src_x[i]
        dy   = V_flat - src_y[i]
        dist = np.sqrt(dx * dx + dy * dy, dtype=np.float64)
        amp  = np.exp(-float(dec) * dist) if dec > 0 else 1.0
        accum += amp * np.cos(TWO_PI * float(freq) * dist + float(ph))

    val = accum.reshape(height, width).astype(np.float32)
    # Normalize to [0, 1]
    lo, hi = val.min(), val.max()
    if hi > lo:
        val = (val - lo) / (hi - lo)
    else:
        val = np.full_like(val, 0.5)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# Harmonic
# ---------------------------------------------------------------------------

def harmonic(
    width: int, height: int, *,
    frequency: float = 4.0,
    harmonics: int = 6,
    falloff: float = 0.5,
    angle_spread: float = 1.0,
    seed: float = 1,
) -> np.ndarray:
    """
    Generator/Harmonic

    Fourier-style synthesis: sums k harmonic plane waves where the k-th term
    is a sine wave at k * base_frequency, propagating in a direction that is
    deterministically rotated from the previous one.

        val = Σ_{k=1}^{harmonics}  falloff^(k-1) * sin(2π * k * f * dot(uv, dir_k) + φ_k)

    Each direction dir_k and phase offset φ_k are seeded from `seed`, giving
    a unique organic pattern per seed while remaining fully deterministic.

    Parameters
    ----------
    frequency    : float — base spatial frequency
    harmonics    : int   — number of harmonic terms (1–16)
    falloff      : float — amplitude multiplier per octave (0 < falloff < 1)
                           0.5 = standard 1/k decay; 1.0 = equal amplitudes
    angle_spread : float — how much the direction rotates between harmonics
                           (1.0 = full 2π spread; 0.0 = all same direction)
    seed         : float — RNG seed for directions and phases
    """
    U, V = _make_uv(width, height)
    n = max(1, min(int(harmonics), 16))

    rng   = np.random.default_rng(int(seed))
    # Pre-generate one angle and phase per harmonic
    angles = rng.random(n).astype(np.float64) * (2.0 * np.pi) * float(angle_spread)
    phases = rng.random(n).astype(np.float64) * (2.0 * np.pi)

    TWO_PI = 2.0 * np.pi
    f0     = float(frequency)
    fo     = float(falloff)

    U_flat = U.ravel().astype(np.float64)
    V_flat = V.ravel().astype(np.float64)

    accum     = np.zeros(width * height, dtype=np.float64)
    total_amp = 0.0
    amp       = 1.0

    for k in range(1, n + 1):
        dir_x = np.cos(angles[k - 1])
        dir_y = np.sin(angles[k - 1])
        ph    = phases[k - 1]
        proj  = U_flat * dir_x + V_flat * dir_y   # dot(uv, dir)
        accum    += amp * np.sin(TWO_PI * k * f0 * proj + ph)
        total_amp += amp
        amp       *= fo

    val = (accum / total_amp).reshape(height, width).astype(np.float32)
    # Normalize to [0, 1]
    lo, hi = val.min(), val.max()
    if hi > lo:
        val = (val - lo) / (hi - lo)
    else:
        val = np.full_like(val, 0.5)
    return val.astype(np.float32)


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

GENERATORS: dict[str, callable] = {
    "Generator/Perlin":           perlin,
    "Generator/Simplex":          simplex,
    "Generator/DirectionalNoise": directional_noise,
    "Generator/Voronoi":          voronoi,
    "Generator/CellNoise":        cell_noise,
    "Generator/Ridged Noise":     ridged_noise,
    "Generator/WhiteNoise":       white_noise,
    "Generator/Checkerboard":     checkerboard,
    "Generator/Hex Grid":         hex_grid,
    "Generator/Bricks":           bricks,
    "Generator/Truchet Tiles":    truchet_tiles,
    "Generator/Stripes":          stripes,
    "Generator/Gradient":         gradient,
    "Generator/Dots":               dots,
    "Generator/FormulaXY":          formula_xy,
    "Generator/Wave Interference":  wave_interference,
    "Generator/Harmonic":           harmonic,
}
