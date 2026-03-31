"""
Noise & TerrainGen — Terrain Generation Service API
Entry point. Run with: uvicorn main:app --host 0.0.0.0 --port 8080 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router

app = FastAPI(
    title="Noise & TerrainGen API",
    description=(
        "Server Layer for Noise & TerrainGen SOA. "
        "Receives a node graph (JSON), executes all generation / filter / "
        "transform / math nodes in topological order using NumPy, and "
        "returns the resulting heightmap as a base64-encoded float32 array."
    ),
    version="1.0.0",
)

# Allow the frontend (port 8000) and any other origin during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
