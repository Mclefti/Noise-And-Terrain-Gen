import urllib.request, json, base64

body = json.dumps({
    'width': 128, 'height': 128,
    'graph': {
        'nodes': [{'id': 1, 'type': 'Generator/Wave Interference', 'properties': {'frequency': 8, 'sources': 5, 'phase': 0, 'decay': 0, 'seed': 1}}],
        'links': []
    }
}).encode()

req = urllib.request.Request(
    'http://localhost:8080/generate_terrain',
    data=body, headers={'Content-Type': 'application/json'}
)

with urllib.request.urlopen(req) as r:
    resp = json.loads(r.read())

print("Response keys:", list(resp.keys()))
print(f"data length: {len(resp['data'])} chars")
print(f"normal_map: {'present' if resp.get('normal_map') else 'MISSING'} ({len(resp.get('normal_map',''))} chars)")
print(f"splat_map:  {'present' if resp.get('splat_map') else 'MISSING'} ({len(resp.get('splat_map',''))} chars)")
print(f"width={resp['width']}, height={resp['height']}, node_type={resp['node_type']}")

# Verify normal_map is valid PNG
if resp.get('normal_map'):
    png_data = base64.b64decode(resp['normal_map'])
    is_png = png_data[:4] == b'\x89PNG'
    print(f"normal_map is valid PNG: {is_png} ({len(png_data)} bytes)")

if resp.get('splat_map'):
    png_data = base64.b64decode(resp['splat_map'])
    is_png = png_data[:4] == b'\x89PNG'
    print(f"splat_map is valid PNG: {is_png} ({len(png_data)} bytes)")

print("\n=== ALL OK ===")
