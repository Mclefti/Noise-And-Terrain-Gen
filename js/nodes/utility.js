class MinMaxDisplayNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");

        this.title = "Min/Max";

        this._min = 0;
        this._max = 0;

        this.size = [160, 80];
    }

    onExecute() {
        this._min = 0;
        this._max = 0;

        let input = this.getInputData(0);
        if (!input) return;

        // if GPU texture, read pixels synchronously
        if (input instanceof WebGLTexture) {
            input = readTexture(input); // returns Float32Array
        }

        if (!input || input.length === 0) return;

        let min = Infinity;
        let max = -Infinity;

        // fast loop (no for..of)
        for (let i = 0; i < input.length; i++) {
            const v = input[i];
            if (v < min) min = v;
            if (v > max) max = v;
        }

        this._min = min;
        this._max = max;
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) return;

        ctx.fillStyle = "#AAA";
        ctx.font = "12px monospace";

        ctx.fillText(`min: ${this._min.toFixed(3)}`, 10, 45);
        ctx.fillText(`max: ${this._max.toFixed(3)}`, 10, 65);
    }
}

LiteGraph.registerNodeType("Utility/MinMax Display", MinMaxDisplayNode);

class HistogramDisplayNode extends NoiseNode {
    constructor() {
        super();
        this.addInput("input", "array");

        this.properties = {
            bins: 32,
            min: 0,
            max: 1
        };

        this.addWidget("slider", "Bins", this.properties.bins, {
            min: 4, max: 128, step: 1, property: "bins"
        });

        this.addWidget("number", "Min", this.properties.min, {
            property: "min"
        });

        this.addWidget("number", "Max", this.properties.max, {
            property: "max"
        });

        this.title = "Histogram";

        this._hist = new Array(128).fill(0);
        this._maxCount = 1;

        // debug info
        this._underflow = 0;
        this._overflow = 0;

        this.size = [220, 200];
    }

    onExecute() {
        let input = this.getInputData(0);
        if (!input) return;

        // if GPU texture, read pixels synchronously
        if (input instanceof WebGLTexture) {
            input = readTexture(input); // returns Float32Array
        }

        const bins = Math.floor(this.properties.bins);
        const hist = this._hist;

        const min = this.properties.min;
        const max = this.properties.max;
        const range = max - min || 1e-6;

        // reset
        for (let i = 0; i < bins; i++) hist[i] = 0;

        let under = 0;
        let over = 0;

        // build histogram
        for (let i = 0; i < input.length; i++) {
            const v = input[i];

            if (v < min) {
                under++;
                continue;
            }
            if (v > max) {
                over++;
                continue;
            }

            let t = (v - min) / range;
            let idx = (t * bins) | 0;
            if (idx >= bins) idx = bins - 1;

            hist[idx]++;
        }

        this._underflow = under;
        this._overflow = over;

        // normalize
        let maxCount = 1;
        for (let i = 0; i < bins; i++) {
            if (hist[i] > maxCount) maxCount = hist[i];
        }

        this._maxCount = maxCount;
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) return;

        const bins = Math.floor(this.properties.bins);
        const hist = this._hist;
        const maxCount = this._maxCount;

        const w = this.size[0] - 20;
        const h = this.size[1] - 130;

        const x0 = 10;
        const y0 = this.size[1] - 20;

        const barW = w / bins;

        // background
        ctx.fillStyle = "#111";
        ctx.fillRect(x0, y0 - h, w, h);

        // bars
        ctx.fillStyle = "#6CF";

        for (let i = 0; i < bins; i++) {
            const v = hist[i] / maxCount;
            const bh = v * h;

            ctx.fillRect(
                x0 + i * barW,
                y0 - bh,
                Math.max(1, barW - 1),
                bh
            );
        }

        // border
        ctx.strokeStyle = "#555";
        ctx.strokeRect(x0, y0 - h, w, h);

        // labels
        ctx.fillStyle = "#AAA";
        ctx.font = "10px monospace";

        const minStr = this.properties.min.toFixed(2);
        const maxStr = this.properties.max.toFixed(2);

        ctx.fillText(minStr, x0, y0 + 10);
        ctx.fillText(maxStr, x0 + w - 30, y0 + 10);

        // under/overflow indicators
        if (this._underflow > 0 || this._overflow > 0) {
            ctx.fillStyle = "#F66";
            ctx.fillText(
                `under: ${this._underflow}  over: ${this._overflow}`,
                x0,
                y0 - h - 2
            );
        }
    }
}

LiteGraph.registerNodeType("Utility/Histogram Display", HistogramDisplayNode);


// ============================================================
// Generate Terrain Node — sends heightmap to server,
// populates the output panel (3D preview + 2D maps)
// ============================================================
class GenerateTerrainNode extends NoiseNode {
    constructor() {
        super();
        // Must match exactly "array" to allow connection from math/generator nodes
        this.addInput("heightmap", "array");
        this.title = "Generate Terrain";

        // Push widgets below the input slot so they don't block connections
        this.widgets_start_y = 36;

        this.properties = { water: true, resolution: WIDTH, heightScale: 0.5 };
        this.addWidget("toggle", "Water", true, { property: "water" });
        this.addWidget("combo", "Resolution", String(WIDTH), (v) => {
            this.properties.resolution = parseInt(v);
            if (typeof setResolution === "function") setResolution(this.properties.resolution);
        }, { values: ["32", "64", "128", "256", "512", "1024"] });
        this.addWidget("slider", "Height Scale", this.properties.heightScale, { min: 0.1, max: 2.0, step: 0.1, precision: 1, property: "heightScale" });

        this.size = [220, 175];
        this._busy = false;
        this._status = "Ready";
        this._statusColor = "#888";
        // Don't draw preview canvas for this node
        this.previewCanvas = null;
    }

    computeSize() {
        return [220, 175];
    }

    onExecute() {
        // Node only triggers on explicit button click, not on graph eval
    }

    // Drawn inline — show a big "Generate" button + status
    onDrawForeground(ctx) {
        if (this.flags.collapsed) return;

        // Force minimum size (prevents truncated UI if loading old graph JSON)
        if (this.size[0] < 220) this.size[0] = 220;
        if (this.size[1] < 155) this.size[1] = 155;

        const w = this.size[0];

        // Status text
        ctx.fillStyle = this._statusColor;
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this._status, w / 2, 100);

        // "Generate" button
        const btnX = 15;
        const btnY = 110;
        const btnW = w - 30;
        const btnH = 26;

        ctx.fillStyle = this._busy ? "#333" : "#2a5a4a";
        ctx.strokeStyle = "#3b8f6f";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this._busy ? "#666" : "#a1dcdb";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this._busy ? "Generating..." : "⚡ Generate", w / 2, btnY + 16);

        ctx.textAlign = "left";
    }

    onMouseDown(e, localPos) {
        // Check if click was on the button area
        const btnX = 15;
        const btnY = 110;
        const btnW = this.size[0] - 30;
        const btnH = 26;

        if (localPos[0] >= btnX && localPos[0] <= btnX + btnW &&
            localPos[1] >= btnY && localPos[1] <= btnY + btnH) {
            this._generate();
            return true;
        }
    }

    async _generate() {
        if (this._busy) return;

        let input = this.getInputData(0);
        if (!input) {
            this._status = "No input connected";
            this._statusColor = "#f66";
            return;
        }

        // Read GPU texture to CPU
        if (input instanceof WebGLTexture) {
            input = readTexture(input);
        }

        if (!input || input.length === 0) {
            this._status = "Empty input";
            this._statusColor = "#f66";
            return;
        }

        this._busy = true;
        this._status = "Sending to server...";
        this._statusColor = "#a1dcdb";

        try {
            // Encode float32 array to base64
            const bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const b64 = btoa(binary);

            const payload = {
                data: b64,
                width: WIDTH,
                height: HEIGHT
            };

            const res = await fetch("http://localhost:8080/compute_maps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(res.statusText + " - " + errText);
            }

            const data = await res.json();

            // --- Populate the output panel ---

            // 1. Update 3D terrain preview
            if (typeof terrainPreview !== "undefined" && terrainPreview) {
                terrainPreview.update(input, WIDTH, HEIGHT, this.properties.water, this.properties.heightScale);
            }

            // 2. Heightmap greyscale card
            if (typeof drawHeightmapOnCanvas === "function") {
                drawHeightmapOnCanvas("mapHeightmap", input, WIDTH, HEIGHT);
            }

            // 3. Normal map card
            if (data.normal_map && typeof drawPngB64OnCanvas === "function") {
                drawPngB64OnCanvas("mapNormalMap", data.normal_map);
            }

            // 4. Splat map card
            if (data.splat_map && typeof drawPngB64OnCanvas === "function") {
                drawPngB64OnCanvas("mapSplatMap", data.splat_map);
            }

            // 5. Also update the main preview canvas
            if (typeof renderServerOutput === "function") {
                renderServerOutput(input, WIDTH, HEIGHT);
            }

            // 6. Show output panel if hidden
            const panel = document.getElementById("output-panel");
            if (panel && panel.classList.contains("collapsed")) {
                panel.classList.remove("collapsed");
                if (typeof resizeGraph === "function") {
                    setTimeout(resizeGraph, 350);
                }
            }

            this._status = "Done ✓";
            this._statusColor = "#6f6";

        } catch (e) {
            console.error("Generate Terrain error:", e);
            this._status = "Error: " + e.message.substring(0, 30);
            this._statusColor = "#f66";
        } finally {
            this._busy = false;
        }
    }
}

LiteGraph.registerNodeType("Output/Generate Terrain", GenerateTerrainNode);
