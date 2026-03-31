"""
Serialisation helpers for float32 numpy arrays,
plus normal-map and splat-map generation.
"""

import base64
import io
import numpy as np
from PIL import Image


def array_to_b64(arr: np.ndarray) -> str:
    """Encode a 2-D float32 numpy array as a base64 string (little-endian)."""
    raw = arr.astype(np.float32).flatten().tobytes()
    return base64.b64encode(raw).decode("ascii")


def b64_to_array(b64: str, height: int, width: int) -> np.ndarray:
    """Decode a base64 float32 blob back into a (height, width) numpy array."""
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, dtype=np.float32)
    return arr.reshape(height, width)


def rgb_array_to_png_b64(rgb: np.ndarray) -> str:
    """
    Encode a (H, W, 3) uint8 numpy array as a base64-encoded PNG string.
    """
    img = Image.fromarray(rgb.astype(np.uint8), "RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


# ---------------------------------------------------------------------------
# Normal Map — Sobel gradients → RGB
# ---------------------------------------------------------------------------

def compute_normal_map(heightmap: np.ndarray, strength: float = 2.0) -> str:
    """
    Compute a normal map from a float32 heightmap and return as base64 PNG.
    Uses Sobel-like central differences for dx, dy.
    Normal = normalize(-dx, -dy, 1/strength) mapped to [0,255] RGB.
    """
    h, w = heightmap.shape

    # Central differences (wrap edges)
    dx = np.zeros_like(heightmap)
    dy = np.zeros_like(heightmap)
    dx[:, 1:-1] = heightmap[:, 2:] - heightmap[:, :-2]
    dx[:, 0] = heightmap[:, 1] - heightmap[:, 0]
    dx[:, -1] = heightmap[:, -1] - heightmap[:, -2]
    dy[1:-1, :] = heightmap[2:, :] - heightmap[:-2, :]
    dy[0, :] = heightmap[1, :] - heightmap[0, :]
    dy[-1, :] = heightmap[-1, :] - heightmap[-2, :]

    dx *= strength
    dy *= strength

    # Normal vector: (-dx, -dy, 1), then normalize
    nz = np.ones_like(dx)
    length = np.sqrt(dx * dx + dy * dy + nz * nz)
    nx = -dx / length
    ny = -dy / length
    nz = nz / length

    # Map [-1, 1] → [0, 255]
    rgb = np.stack([
        ((nx * 0.5 + 0.5) * 255).astype(np.uint8),
        ((ny * 0.5 + 0.5) * 255).astype(np.uint8),
        ((nz * 0.5 + 0.5) * 255).astype(np.uint8),
    ], axis=-1)

    return rgb_array_to_png_b64(rgb)


# ---------------------------------------------------------------------------
# Splat Map — terrain color ramp → RGB
# ---------------------------------------------------------------------------

def _terrain_color(h: np.ndarray) -> np.ndarray:
    """
    Apply the Noise & TerrainGen terrain color ramp to a float32 heightmap.
    Returns (H, W, 3) uint8 array.
    Matches the GLSL terrainColor() function in shader.js.
    """
    r = np.zeros_like(h)
    g = np.zeros_like(h)
    b = np.zeros_like(h)

    def _mix(a, bv, t):
        return a * (1 - t) + bv * t

    # Deep water: h < 0.1
    m = h < 0.1
    t = h[m] / 0.1
    r[m] = _mix(0, 0, t)
    g[m] = _mix(0, 100 / 255, t)
    b[m] = _mix(200 / 255, 1.0, t)

    # Shallow water: 0.1 ≤ h < 0.2
    m = (h >= 0.1) & (h < 0.2)
    t = (h[m] - 0.1) / 0.1
    r[m] = _mix(0, 238 / 255, t)
    g[m] = _mix(100 / 255, 214 / 255, t)
    b[m] = _mix(1.0, 175 / 255, t)

    # Beach → grass: 0.2 ≤ h < 0.4
    m = (h >= 0.2) & (h < 0.4)
    t = (h[m] - 0.2) / 0.2
    r[m] = _mix(238 / 255, 34 / 255, t)
    g[m] = _mix(214 / 255, 139 / 255, t)
    b[m] = _mix(175 / 255, 34 / 255, t)

    # Grass → dark green: 0.4 ≤ h < 0.6
    m = (h >= 0.4) & (h < 0.6)
    t = (h[m] - 0.4) / 0.2
    r[m] = _mix(34 / 255, 0, t)
    g[m] = _mix(139 / 255, 100 / 255, t)
    b[m] = _mix(34 / 255, 0, t)

    # Dark green → brown: 0.6 ≤ h < 0.8
    m = (h >= 0.6) & (h < 0.8)
    t = (h[m] - 0.6) / 0.2
    r[m] = _mix(0, 139 / 255, t)
    g[m] = _mix(100 / 255, 69 / 255, t)
    b[m] = _mix(0, 19 / 255, t)

    # Brown → snow: h ≥ 0.8
    m = h >= 0.8
    t = np.clip((h[m] - 0.8) / 0.2, 0, 1)
    r[m] = _mix(139 / 255, 1.0, t)
    g[m] = _mix(69 / 255, 1.0, t)
    b[m] = _mix(19 / 255, 1.0, t)

    rgb = np.stack([
        (np.clip(r, 0, 1) * 255).astype(np.uint8),
        (np.clip(g, 0, 1) * 255).astype(np.uint8),
        (np.clip(b, 0, 1) * 255).astype(np.uint8),
    ], axis=-1)

    return rgb


def compute_splat_map(heightmap: np.ndarray) -> str:
    """
    Apply the terrain color ramp to a heightmap and return as base64 PNG.
    """
    rgb = _terrain_color(np.clip(heightmap, 0, 1))
    return rgb_array_to_png_b64(rgb)

