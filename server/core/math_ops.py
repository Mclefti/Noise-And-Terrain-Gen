"""
Core Generation Layer — Math / Combine Nodes
All element-wise operations on float32 numpy arrays.
"""

from __future__ import annotations
import numpy as np


def add(a: np.ndarray, b: np.ndarray, **_) -> np.ndarray:
    return (a + b).astype(np.float32)

def subtract(a: np.ndarray, b: np.ndarray, **_) -> np.ndarray:
    return (a - b).astype(np.float32)

def multiply(a: np.ndarray, b: np.ndarray, **_) -> np.ndarray:
    return (a * b).astype(np.float32)

def op_max(a: np.ndarray, b: np.ndarray, **_) -> np.ndarray:
    return np.maximum(a, b).astype(np.float32)

def op_min(a: np.ndarray, b: np.ndarray, **_) -> np.ndarray:
    return np.minimum(a, b).astype(np.float32)

def op_abs(a: np.ndarray, **_) -> np.ndarray:
    return np.abs(a).astype(np.float32)

def invert(a: np.ndarray, **_) -> np.ndarray:
    return (1.0 - a).astype(np.float32)

def scale(a: np.ndarray, *, amount: float = 2, **_) -> np.ndarray:
    return (a * amount).astype(np.float32)

def saturate(a: np.ndarray, **_) -> np.ndarray:
    return np.clip(a, 0.0, 1.0).astype(np.float32)

def clamp(a: np.ndarray, *, min: float = -1, max: float = 1, **_) -> np.ndarray:   # noqa: A002
    return np.clip(a, min, max).astype(np.float32)

def normalize(a: np.ndarray, **_) -> np.ndarray:
    lo, hi = a.min(), a.max()
    if hi == lo:
        return np.zeros_like(a, dtype=np.float32)
    return ((a - lo) / (hi - lo)).astype(np.float32)

def mix(a: np.ndarray, b: np.ndarray, *, t: float = 0.5, **_) -> np.ndarray:
    return (a * (1 - t) + b * t).astype(np.float32)

def mask_blend(a: np.ndarray, b: np.ndarray, mask: np.ndarray, **_) -> np.ndarray:
    """mix(B, A, Mask)  — same as mask*A + (1-mask)*B"""
    return (mask * a + (1 - mask) * b).astype(np.float32)

def covariant_curvature(a: np.ndarray, b: np.ndarray, **_) -> np.ndarray:
    """
    Covariant Curvature Blend
    Uses a phase-shifted cosine to flip the wave's influence 
    based on the base terrain's altitude.
    """
    # 1. P * W is the base interaction
    # 2. cos(P * PI) creates an oscillating "push-pull" force
    # If P is low, it adds height. If P is high, it carves height.
    interaction = a * b * np.cos(a * np.pi)
    
    # We use a 0.4 multiplier to keep it subtle and natural
    result = a + (interaction * 0.4)
    
    return np.clip(result, 0.0, 1.0).astype(np.float32)


# ---------------------------------------------------------------------------
# Expression / formula nodes
# ---------------------------------------------------------------------------

_SAFE_BUILTINS = {
    "sin": np.sin, "cos": np.cos, "abs": np.abs, "sqrt": np.sqrt,
    "pow": np.power, "pi": np.pi, "min": np.minimum, "max": np.maximum,
    "mod": np.mod, "floor": np.floor, "ceil": np.ceil,
    "clamp": np.clip, "fract": lambda x: np.mod(x, 1.0),
    "mix": lambda a, b, t: a * (1 - t) + b * t,
    "__builtins__": {},
}

def formula1(a: np.ndarray, *, formula: str = "a*a", **_) -> np.ndarray:
    """Expression/Formula1 — f(a, x, y)."""
    h, w = a.shape
    u = (np.arange(w, dtype=np.float32) + 0.5) / w
    v = (np.arange(h, dtype=np.float32) + 0.5) / h
    x, y = np.meshgrid(u, v)
    try:
        val = eval(formula, {**_SAFE_BUILTINS}, {"a": a, "x": x, "y": y})  # noqa: S307
        val = np.broadcast_to(val, (h, w))
    except Exception:
        val = np.zeros((h, w), dtype=np.float32)
    return np.clip(val, 0.0, 1.0).astype(np.float32)

def formula2(a: np.ndarray, b: np.ndarray, *, formula: str = "a+b", **_) -> np.ndarray:
    """Expression/Formula2 — f(a, b, x, y)."""
    h, w = a.shape
    u = (np.arange(w, dtype=np.float32) + 0.5) / w
    v = (np.arange(h, dtype=np.float32) + 0.5) / h
    x, y = np.meshgrid(u, v)
    try:
        val = eval(formula, {**_SAFE_BUILTINS}, {"a": a, "b": b, "x": x, "y": y})  # noqa: S307
        val = np.broadcast_to(val, (h, w))
    except Exception:
        val = np.zeros((h, w), dtype=np.float32)
    return np.clip(val, 0.0, 1.0).astype(np.float32)


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

MATH_OPS: dict[str, callable] = {
    "Math/Add":         add,
    "Math/Subtract":    subtract,
    "Math/Multiply":    multiply,
    "Math/Max":         op_max,
    "Math/Min":         op_min,
    "Math/Abs":         op_abs,
    "Math/Invert":      invert,
    "Math/Scale":       scale,
    "Math/Saturate":    saturate,
    "Math/Clamp":       clamp,
    "Math/Normalize":   normalize,
    "Combine/Mix":      mix,
    "Combine/Mask Blend": mask_blend,
    "Combine/Covariant Curvature": covariant_curvature,
    "Expression/Formula1": formula1,
    "Expression/Formula2": formula2,
}
