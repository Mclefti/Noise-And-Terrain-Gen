"""
Graph execution engine + API routes.

POST /generate_terrain
  Body: GenerateTerrainRequest (graph JSON + width/height)
  Response: GenerateTerrainResponse (base64 float32 array)

GET /health
"""

from __future__ import annotations

import numpy as np
from collections import defaultdict, deque
from typing import Any

from fastapi import APIRouter, HTTPException

from models.schemas import (
    GenerateTerrainRequest, GenerateTerrainResponse,
    ComputeMapsRequest, ComputeMapsResponse,
    PreviewNodeRequest, PreviewNodeResponse,
    ExperimentRequest, ExperimentResponse,
)
from utils.image_io import array_to_b64, b64_to_array, compute_normal_map, compute_splat_map
from core.generators import GENERATORS
from core.filters import FILTERS
from core.transforms import TRANSFORMS
from core.math_ops import MATH_OPS

router = APIRouter()

# All known node executors merged
ALL_NODES = {**GENERATORS, **FILTERS, **TRANSFORMS, **MATH_OPS}

# ---------------------------------------------------------------------------
# Topological sort
# ---------------------------------------------------------------------------

def _topo_sort(nodes: list[dict], links: list[list[int]]) -> list[dict]:
    """
    Kahn's algorithm over LiteGraph node/link topology.
    links format: [link_id, src_node_id, src_slot, dst_node_id, dst_slot]
    """
    node_map = {n["id"]: n for n in nodes}
    in_degree: dict[int, int] = defaultdict(int)
    adj: dict[int, list[int]] = defaultdict(list)  # src_id → [dst_id, ...]

    for n in nodes:
        in_degree[n["id"]] = in_degree[n["id"]]  # ensure key exists

    for link in links:
        _, src_id, _ss, dst_id, _ds = link[:5]
        adj[src_id].append(dst_id)
        in_degree[dst_id] += 1

    queue = deque(nid for nid, deg in in_degree.items() if deg == 0)
    order: list[dict] = []

    while queue:
        nid = queue.popleft()
        order.append(node_map[nid])
        for child in adj[nid]:
            in_degree[child] -= 1
            if in_degree[child] == 0:
                queue.append(child)

    if len(order) != len(nodes):
        raise ValueError("Graph contains a cycle")

    return order


# ---------------------------------------------------------------------------
# Graph executor
# ---------------------------------------------------------------------------

def _execute_graph(request: GenerateTerrainRequest) -> tuple[np.ndarray, str]:
    """
    Walk the graph in topological order and return (output_array, node_type).
    Each node's output is stored by node id and fed to downstream nodes.
    """
    W, H = request.width, request.height
    nodes = [n.model_dump() for n in request.graph.nodes]
    links = request.graph.links

    # Map: (dst_node_id, dst_slot) → src_node_id
    input_map: dict[tuple[int, int], int] = {}
    for link in links:
        _, src_id, _ss, dst_id, dst_slot = link[:5]
        input_map[(dst_id, dst_slot)] = src_id

    order = _topo_sort(nodes, links)
    outputs: dict[int, np.ndarray] = {}  # node_id → float32 array

    last_node = order[-1]

    for node in order:
        nid   = node["id"]
        ntype = node["type"]
        props = node.get("properties", {})

        fn = ALL_NODES.get(ntype)

        if fn is None:
            # Unknown node — pass zero array forward
            outputs[nid] = np.zeros((H, W), dtype=np.float32)
            continue

        # ---- Collect inputs as positional array arguments ----------------
        # Slot 0 is always the first input, slot 1 the second, etc.
        # We resolve up to 3 input slots.
        inputs: list[np.ndarray | None] = []
        for slot in range(3):
            src_id = input_map.get((nid, slot))
            if src_id is not None and src_id in outputs:
                inputs.append(outputs[src_id])
            else:
                inputs.append(None)

        # ---- Call the right executor signature --------------------------
        try:
            result = _dispatch(fn, ntype, inputs, W, H, props)
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Node {ntype} (id={nid}) execution failed: {e}"
            )

        outputs[nid] = result

    # Determine output node
    if request.output_node_id is not None:
        if request.output_node_id not in outputs:
            raise HTTPException(status_code=422,
                                detail=f"Output node {request.output_node_id} not found")
        result_arr = outputs[request.output_node_id]
        out_type = next(n["type"] for n in nodes if n["id"] == request.output_node_id)
    else:
        result_arr = outputs[last_node["id"]]
        out_type = last_node["type"]

    return result_arr, out_type


def _dispatch(fn: callable, ntype: str,
              inputs: list[np.ndarray | None],
              width: int, height: int,
              props: dict[str, Any]) -> np.ndarray:
    """
    Route each node type to its function with the correct signature.
    Generators: fn(width, height, **props)
    Filters:    fn(arr, width, height, **props)
    Transforms (1-input): fn(arr, width, height, **props)
    Transforms (2-input): fn(arr, width, height, aux, **props)
    Math binary: fn(a, b, **props)
    Math unary:  fn(a, **props)
    Combine/3:   fn(a, b, mask, **props)
    """
    a0 = inputs[0]  # primary input or None
    a1 = inputs[1]  # secondary (warp / B) or None
    a2 = inputs[2]  # tertiary (mask / dy) or None

    zero = np.zeros((height, width), dtype=np.float32)
    half = np.full((height, width), 0.5, dtype=np.float32)

    # --- Generator nodes (no array input) ---
    if ntype in GENERATORS:
        return fn(width, height, **props)

    # --- Filter nodes (single input) ---
    if ntype in FILTERS:
        return fn(a0 if a0 is not None else zero, width, height, **props)

    # --- Math binary ---
    if ntype in ("Math/Add", "Math/Subtract", "Math/Multiply",
                 "Math/Max", "Math/Min", "Combine/Mix"):
        return fn(a0 if a0 is not None else zero,
                  a1 if a1 is not None else zero, **props)

    # --- Combine/Mask Blend ---
    if ntype == "Combine/Mask Blend":
        return fn(a0 if a0 is not None else zero,
                  a1 if a1 is not None else zero,
                  a2 if a2 is not None else half, **props)

    # --- Math unary ---
    if ntype in ("Math/Abs", "Math/Invert", "Math/Saturate",
                 "Math/Normalize", "Math/Scale", "Math/Clamp"):
        return fn(a0 if a0 is not None else zero, **props)

    # --- Expression ---
    if ntype == "Expression/Formula1":
        return fn(a0 if a0 is not None else zero, **props)
    if ntype == "Expression/Formula2":
        return fn(a0 if a0 is not None else zero,
                  a1 if a1 is not None else zero, **props)

    # --- Transform nodes (need special arg routing) ---
    if ntype == "Transform/Warp":
        return fn(a0 if a0 is not None else zero, width, height,
                  warp_map=a1, **props)

    if ntype == "Transform/Radial Warp":
        return fn(a0 if a0 is not None else zero, width, height,
                  warp_map=a1, **props)

    if ntype == "Transform/Displace":
        return fn(a0 if a0 is not None else zero, width, height,
                  dx_map=a1, dy_map=a2, **props)

    if ntype in ("Transform/TileSampler", "Generator/PoissonSampler"):
        return fn(a0 if a0 is not None else zero, width, height, **props)

    # Generic single-input transforms
    return fn(a0 if a0 is not None else zero, width, height, **props)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/health")
def health():
    return {"status": "ok", "service": "Noise & TerrainGen API"}


@router.post("/generate_terrain", response_model=GenerateTerrainResponse)
def generate_terrain(request: GenerateTerrainRequest) -> GenerateTerrainResponse:
    """
    Execute a Noise & TerrainGen node graph and return the result as a base64 float32 array.
    """
    if not request.graph.nodes:
        raise HTTPException(status_code=422, detail="Graph has no nodes")

    result_arr, out_type = _execute_graph(request)

    # Compute derived maps
    normal_b64 = compute_normal_map(result_arr)
    splat_b64 = compute_splat_map(result_arr)

    return GenerateTerrainResponse(
        data=array_to_b64(result_arr),
        width=request.width,
        height=request.height,
        node_type=out_type,
        normal_map=normal_b64,
        splat_map=splat_b64,
    )


@router.post("/compute_maps", response_model=ComputeMapsResponse)
def compute_maps(request: ComputeMapsRequest) -> ComputeMapsResponse:
    """
    Takes a raw float32 heightmap (already computed client-side on GPU)
    and returns derived normal map + splat map as base64 PNGs.
    """
    heightmap = b64_to_array(request.data, request.height, request.width)
    return ComputeMapsResponse(
        normal_map=compute_normal_map(heightmap),
        splat_map=compute_splat_map(heightmap),
        width=request.width,
        height=request.height,
    )


@router.post("/preview_node", response_model=PreviewNodeResponse)
def preview_node(request: PreviewNodeRequest) -> PreviewNodeResponse:
    """
    Process a single node over an input 2D array and return the generated 2D float32 array base64.
    Used by heavy frontend nodes (like Erosion) to offload preview generation.
    """
    fn = ALL_NODES.get(request.node_type)
    if not fn:
        raise HTTPException(status_code=400, detail=f"Unknown node type for preview: {request.node_type}")
    
    input_arr = b64_to_array(request.data, request.height, request.width)
    
    # Execute node function (single input assumption for filters like Erosion)
    try:
        result_arr = fn(input_arr, request.width, request.height, **request.properties)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {e}")
        
    return PreviewNodeResponse(data=array_to_b64(result_arr))


@router.post("/run_experiment", response_model=ExperimentResponse)
def run_experiment(request: ExperimentRequest) -> ExperimentResponse:
    """
    Execute the Wave-Harmonic experimental pipeline and return results.
    Runs all 5 pipelines (A–E) with paired-sample validation and
    performance benchmarking at the requested resolution.
    """
    from core.experiment import PipelineParams, PIPELINES
    from core.benchmark import (
        compute_psd, compute_spectral_slope, compute_roughness_index,
        compute_regional_roughness, compute_throughput, measure_generation,
        regression_comparison,
    )

    params = PipelineParams(
        noise_type=request.noise_type,
        frequency=request.frequency,
        octaves=request.octaves,
        persistence=request.persistence,
        lacunarity=request.lacunarity,
        wave_intensity=request.wave_intensity,
        wave_count=request.wave_count,
        erosion_iterations=request.erosion_iterations,
        talus_angle=request.talus_angle,
        thermal_rate=request.thermal_rate,
    )

    N = request.resolution

    # --- Paired samples ---
    all_slopes: dict[str, list[float]] = {k: [] for k in PIPELINES}
    all_roughness: dict[str, list[float]] = {k: [] for k in PIPELINES}

    for seed in range(1, request.n_seeds + 1):
        for key, fn in PIPELINES.items():
            hmap = fn(N, seed, params)
            freqs, psd = compute_psd(hmap)
            if len(freqs) > 2:
                sl = compute_spectral_slope(freqs, psd)
                all_slopes[key].append(sl["slope"])
            all_roughness[key].append(compute_roughness_index(hmap))

    structural = {
        key: {
            "mean_spectral_slope": float(np.mean(all_slopes[key])) if all_slopes[key] else 0,
            "std_spectral_slope": float(np.std(all_slopes[key], ddof=1)) if len(all_slopes[key]) > 1 else 0,
            "mean_roughness": float(np.mean(all_roughness[key])),
            "n_samples": len(all_slopes[key]),
        }
        for key in PIPELINES
    }

    # --- Performance ---
    performance = {}
    for key, fn in PIPELINES.items():
        result = measure_generation(fn, N, 42, params, n_samples=request.n_perf_samples)
        performance[key] = {
            **result.to_dict(),
            "throughput_mpps": compute_throughput(N, result.mean_latency_ms),
        }

    # --- Statistics ---
    statistics: dict = {}
    base_slopes = all_slopes.get("B_fbm", [])
    for enh_key in ["D_wave_harmonic_no_erode", "E_wave_harmonic_full"]:
        enh_slopes = all_slopes.get(enh_key, [])
        if base_slopes and enh_slopes:
            mn = min(len(base_slopes), len(enh_slopes))
            statistics[f"slope_B_vs_{enh_key}"] = regression_comparison(
                base_slopes[:mn], enh_slopes[:mn]
            )

    return ExperimentResponse(
        parameters={
            "noise_type": params.noise_type,
            "resolution": N,
            "n_seeds": request.n_seeds,
            "n_perf_samples": request.n_perf_samples,
        },
        performance=performance,
        structural=structural,
        statistics=statistics,
    )

