import urllib.request, json, base64, struct, numpy as np

# Generate a test heightmap
x = np.linspace(0, 1, 128)
y = np.linspace(0, 1, 128)
xx, yy = np.meshgrid(x, y)
heightmap = (np.sin(xx * 8 * np.pi) * np.cos(yy * 6 * np.pi) * 0.5 + 0.5).astype(np.float32)

# Encode to base64
b64_data = base64.b64encode(heightmap.tobytes()).decode("ascii")

body = json.dumps({
    "data": b64_data,
    "width": 128,
    "height": 128
}).encode()

req = urllib.request.Request(
    "http://localhost:8080/compute_maps",
    data=body, headers={"Content-Type": "application/json"}
)

with urllib.request.urlopen(req) as r:
    resp = json.loads(r.read())

print("Response keys:", list(resp.keys()))
print(f"normal_map: {len(resp['normal_map'])} chars")
print(f"splat_map:  {len(resp['splat_map'])} chars")

# Verify PNGs
for name in ("normal_map", "splat_map"):
    png = base64.b64decode(resp[name])
    ok = png[:4] == b'\x89PNG'
    print(f"{name} valid PNG: {ok} ({len(png)} bytes)")

print("\n=== /compute_maps OK ===")
