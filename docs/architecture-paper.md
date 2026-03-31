# System Architecture — Paper Figure

Compact Mermaid diagram suitable for academic paper inclusion.  
Render with [Mermaid Live Editor](https://mermaid.live) or `mmdc` CLI → export as SVG/PNG.

```mermaid
graph TD
    subgraph CL["<b>Client Layer</b> — Frontend Browser"]
        direction TB
        UI["Web Interface<br/><i>HTML / JS / CSS</i>"]
        V3["3-D Viewport<br/><i>Three.js</i>"]

        subgraph GPU["Real-time GPU Engine &ensp;(WebGL 2 / LiteGraph)"]
            direction LR
            P["Input<br/>Params"] --> N["Noise<br/>Nodes"]
            N --> C["Combiner /<br/>Transform"]
            C --> F["Filter<br/>Nodes"]
            F --> H["Raw<br/>Heightmap"]
        end

        UI --> GPU
        H --> V3
    end

    subgraph SL["<b>Server Layer</b> — Docker Compose"]
        direction TB
        LB["Nginx Load Balancer<br/><i>:8080 &ensp;round-robin</i>"]
        LB --> R1["Replica 1"] & R2["Replica 2"] & R3["Replica 3"]

        subgraph API["FastAPI &ensp;Service"]
            direction LR
            E1["/generate_terrain"]
            E2["/compute_maps"]
            E3["/preview_node"]
        end

        R1 & R2 & R3 --> API
    end

    subgraph KL["<b>Core Computation Layer</b> — NumPy"]
        direction TB
        TP["Graph Executor<br/><i>Topological Sort</i>"]
        TP --> G["generators"] & FL["filters"] & T["transforms"] & M["math_ops"]

        subgraph OUT["Outputs"]
            direction LR
            OH["Heightmap<br/><i>Float32</i>"]
            ON["Normal Map<br/><i>PNG</i>"]
            OS["Splat Map<br/><i>PNG</i>"]
        end

        G & FL & T & M --> OUT
    end

    H -. "POST &ensp;/compute_maps<br/><i>Base64 Float32</i>" .-> LB
    UI -. "POST &ensp;/generate_terrain<br/><i>Graph JSON</i>" .-> LB
    API --> TP
    OUT -. "Base64 Float32 / PNG" .-> UI
```

---

## Single-Instance Architecture (No Docker)

Simplified view without the load-balancer / replica layer — a single FastAPI process serves all requests directly.

```mermaid
graph TD
    subgraph CL["<b>Client Layer</b> — Frontend Browser"]
        direction TB
        UI["Web Interface<br/><i>HTML / JS / CSS</i>"]
        V3["3-D Viewport<br/><i>Three.js</i>"]

        subgraph GPU["Real-time GPU Engine &ensp;(WebGL 2 / LiteGraph)"]
            direction LR
            P["Input<br/>Params"] --> N["Noise<br/>Nodes"]
            N --> C["Combiner /<br/>Transform"]
            C --> F["Filter<br/>Nodes"]
            F --> H["Raw<br/>Heightmap"]
        end

        UI --> GPU
        H --> V3
    end

    subgraph SL["<b>Server Layer</b> — Single Instance"]
        direction TB

        subgraph API["FastAPI &ensp;(:8080)"]
            direction LR
            E1["/generate_terrain"]
            E2["/compute_maps"]
            E3["/preview_node"]
        end
    end

    subgraph KL["<b>Core Computation Layer</b> — NumPy"]
        direction TB
        TP["Graph Executor<br/><i>Topological Sort</i>"]
        TP --> G["generators"] & FL["filters"] & T["transforms"] & M["math_ops"]

        subgraph OUT["Outputs"]
            direction LR
            OH["Heightmap<br/><i>Float32</i>"]
            ON["Normal Map<br/><i>PNG</i>"]
            OS["Splat Map<br/><i>PNG</i>"]
        end

        G & FL & T & M --> OUT
    end

    H -. "POST &ensp;/compute_maps<br/><i>Base64 Float32</i>" .-> API
    UI -. "POST &ensp;/generate_terrain<br/><i>Graph JSON</i>" .-> API
    API --> TP
    OUT -. "Base64 Float32 / PNG" .-> UI
```

---

## Compact Architecture

Minimal version for tight paper layouts.

```mermaid
graph LR
    UI["Web Interface"] --> GPU["GPU Engine<br/>(WebGL 2)"]
    GPU --> V3D["3-D Viewport<br/>(Three.js)"]
    GPU -. "Base64 Float32" .-> API["FastAPI<br/>(:8080)"]
    UI -. "Graph JSON" .-> API
    API --> GE["Graph Executor<br/>(Topological Sort)"]
    GE --> Gen["generators"]
    GE --> Fil["filters"]
    GE --> Trn["transforms"]
    GE --> Math["math_ops"]
    Gen & Fil & Trn & Math --> Out["Heightmap / Normal Map / Splat Map"]
    Out -. "Base64 Response" .-> UI
```
