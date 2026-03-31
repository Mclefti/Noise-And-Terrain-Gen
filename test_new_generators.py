import urllib.request, json, base64, struct, time

time.sleep(1)  # let uvicorn hot-reload

def test_gen(label, node_type, props):
    body = json.dumps({
        'width': 128, 'height': 128,
        'graph': {
            'nodes': [{'id': 1, 'type': node_type, 'properties': props}],
            'links': []
        }
    }).encode()
    req = urllib.request.Request(
        'http://localhost:8080/generate_terrain',
        data=body, headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read())
    raw  = base64.b64decode(resp['data'])
    vals = struct.unpack('<' + 'f'*(128*128), raw)
    lo, hi = min(vals), max(vals)
    mean = sum(vals)/len(vals)
    ok = (hi - lo) > 0.1
    status = "OK  " if ok else "FLAT"
    print(f"  [{status}] {label}: range=[{lo:.4f}, {hi:.4f}]  mean={mean:.4f}")
    return ok

print("=== New Generator Tests ===\n")

print("Wave Interference:")
test_gen("5 sources no decay",    "Generator/Wave Interference", {"frequency":8,  "sources":5,  "phase":0,    "decay":0,   "seed":1})
test_gen("3 sources with decay",  "Generator/Wave Interference", {"frequency":12, "sources":3,  "phase":1.57, "decay":3.0, "seed":42})
test_gen("16 sources high freq",  "Generator/Wave Interference", {"frequency":20, "sources":16, "phase":0,    "decay":0,   "seed":7})

print("\nHarmonic:")
test_gen("6 harmonics falloff=0.5",  "Generator/Harmonic", {"frequency":4, "harmonics":6,  "falloff":0.5, "angle_spread":1.0, "seed":1})
test_gen("12 harmonics falloff=0.8", "Generator/Harmonic", {"frequency":6, "harmonics":12, "falloff":0.8, "angle_spread":1.0, "seed":99})
test_gen("3 harmonics same dir",     "Generator/Harmonic", {"frequency":4, "harmonics":3,  "falloff":0.5, "angle_spread":0.0, "seed":5})

print("\n=== DONE ===")
