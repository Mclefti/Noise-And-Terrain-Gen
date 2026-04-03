"""
Pydantic schemas for the Noise & TerrainGen API.

Graph format mirrors LiteGraph's serialisation:
  nodes: list of { id, type, properties }
  links: list of [link_id, src_node_id, src_slot, dst_node_id, dst_slot]
"""

from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field


class NodeDef(BaseModel):
    id: int
    type: str  # e.g. "Generator/Simplex"
    properties: dict[str, Any] = Field(default_factory=dict)


class GraphDef(BaseModel):
    nodes: list[NodeDef]
    # Each link: [link_id, src_node_id, src_slot, dst_node_id, dst_slot]
    links: list[list[int]] = Field(default_factory=list)


class GenerateTerrainRequest(BaseModel):
    width: int = Field(default=1024, ge=32, le=4096)
    height: int = Field(default=1024, ge=32, le=4096)
    graph: GraphDef
    # Optional: explicitly name the output node id; if absent, uses the last node in topo order
    output_node_id: int | None = None


class GenerateTerrainResponse(BaseModel):
    """
    data: base64-encoded little-endian float32 array, row-major, shape (height, width).
    width/height: dimensions for client to reconstruct the array.
    normal_map: base64 PNG of the computed normal map (RGB).
    splat_map: base64 PNG of the terrain-color-mapped splat map (RGB).
    """
    data: str          # base64 float32 binary (heightmap)
    width: int
    height: int
    node_type: str     # which node produced the output
    normal_map: str    # base64 PNG
    splat_map: str     # base64 PNG


class ComputeMapsRequest(BaseModel):
    """
    Takes a raw base64 float32 heightmap (already computed on the GPU)
    and returns derived maps (normal, splat).
    """
    data: str          # base64 float32 binary (heightmap)
    width: int = Field(ge=32, le=4096)
    height: int = Field(ge=32, le=4096)


class ComputeMapsResponse(BaseModel):
    normal_map: str    # base64 PNG
    splat_map: str     # base64 PNG


class PreviewNodeRequest(BaseModel):
    """
    Request offloading preview generation (e.g., erosion passes) to the server.
    """
    node_type: str
    data: str          # base64 float32 array
    width: int
    height: int
    properties: dict[str, Any] = Field(default_factory=dict)


class PreviewNodeResponse(BaseModel):
    data: str          # resulting base64 float32 array
    width: int
    height: int


class ExperimentRequest(BaseModel):
    """Request to run the Wave-Harmonic experimental pipeline."""
    resolution: int = Field(default=256, ge=32, le=2048)
    n_seeds: int = Field(default=5, ge=1, le=50)
    n_perf_samples: int = Field(default=5, ge=1, le=50)
    noise_type: str = Field(default="perlin")
    # Pipeline parameter overrides
    frequency: float = Field(default=5.0)
    octaves: int = Field(default=6, ge=1, le=12)
    persistence: float = Field(default=0.5)
    lacunarity: float = Field(default=2.0)
    wave_intensity: float = Field(default=0.3)
    wave_count: int = Field(default=8, ge=1, le=32)
    erosion_iterations: int = Field(default=10, ge=0, le=100)
    talus_angle: float = Field(default=0.05)
    thermal_rate: float = Field(default=0.5)


class ExperimentResponse(BaseModel):
    """Results from the experimental pipeline."""
    parameters: dict[str, Any]
    performance: dict[str, Any]
    structural: dict[str, Any]
    statistics: dict[str, Any]
