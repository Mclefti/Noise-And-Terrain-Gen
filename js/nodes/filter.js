


// Other nodes
class BlurNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { amount: 2, passes: 3 };
        this.addWidget("slider", "Amount", this.properties.amount, { min: 1, max: 10, property: "amount" });
        this.addWidget("slider", "Passes", this.properties.passes, { min: 1, max: 5, step: 1, precision: 0, property: "passes" });
        this.title = "Blur";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    runPass(direction, normalizedRadius) {
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform vec2 direction;
        uniform float normalizedRadius;

        void main() {
            vec2 texSize = vec2(textureSize(tex0, 0));
            float radiusInPixels = normalizedRadius * max(texSize.x, texSize.y);
            vec2 texel = 1.0 / texSize * 5.0;
            float sum = 0.0;
            float count = 0.0;

            for(int i=-10; i<=10; i++){
                float fi = float(i);
                if(abs(fi) > radiusInPixels) continue;
                vec2 offset = direction * texel * fi;
                sum += texture(tex0, vUv + offset).r;
                count += 1.0;
            }

            fragColor = vec4(vec3(sum/count),1.0);
        }`;

        this.runShader(
            "blur_pass",
            frag,
            1,
            { direction, normalizedRadius },
            this.pingWrite(),
            [this.pingRead()]
        );

        this.swapPing();
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const amount = Math.max(0.001, this.properties.amount * 0.001);
        const passes = Math.max(1, Math.floor(this.properties.passes));

        // Copy input into ping-pong texture 0
        this.runShader(
            "copy_input",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main() { fragColor = texture(tex0, vUv); }`,
            1,
            {},
            this._pingFramebuffers[0],
            [this._inputTextures[0]]
        );
        this._pingCurrent = 0;

        for(let i=0; i<passes; i++){
            this.runPass([1,0], amount); // horizontal
            this.runPass([0,1], amount); // vertical
        }

        // Copy final result to main output
        this.runShader(
            "copy_to_main",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main(){ fragColor = texture(tex0,vUv); }`,
            1,
            {},
            this.framebuffer,
            [this.pingRead()]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Blur", BlurNode);

class SobelNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.title = "Sobel Edge";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;

        void main() {
            vec2 texel = 1.0 / vec2(textureSize(tex0, 0));

            float tl = texture(tex0, vUv + texel * vec2(-1,-1)).r;
            float tc = texture(tex0, vUv + texel * vec2( 0,-1)).r;
            float tr = texture(tex0, vUv + texel * vec2( 1,-1)).r;

            float ml = texture(tex0, vUv + texel * vec2(-1, 0)).r;
            float mr = texture(tex0, vUv + texel * vec2( 1, 0)).r;

            float bl = texture(tex0, vUv + texel * vec2(-1, 1)).r;
            float bc = texture(tex0, vUv + texel * vec2( 0, 1)).r;
            float br = texture(tex0, vUv + texel * vec2( 1, 1)).r;

            float gx = -tl -2.0*ml - bl + tr +2.0*mr + br;
            float gy = -tl -2.0*tc - tr + bl +2.0*bc + br;

            float g = sqrt(gx*gx + gy*gy);

            fragColor = vec4(vec3(g), 1.0);
        }`;

        this.runShader("sobel", frag, 1);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Sobel", SobelNode);

class PosterizeNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { levels: 4 }; // number of steps
        this.addWidget("slider", "Levels", this.properties.levels, { min: 2, max: 20, step: 1, precision: 0, property: "levels" });
        this.title = "Posterize";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float levels;

        void main() {
            float v = texture(tex0, vUv).r;
            float stepVal = floor(v * levels);
            float val = stepVal / (levels - 1.0);

            fragColor = vec4(vec3(val), 1.0);
        }`;

        this.runShader("posterize", frag, 1, {
            levels: this.properties.levels
        });

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Posterize", PosterizeNode);

class PixelateNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.properties = { pixelSize: 8 };
        this.addWidget("slider","Pixel Size",this.properties.pixelSize,{min:1,max:64,property:"pixelSize"});
        this.title="Pixelate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float pixelSize;

        void main() {
            vec2 size = vec2(textureSize(tex0, 0));
            vec2 uv = vUv * size;

            uv = floor(uv / pixelSize) * pixelSize;

            vec2 finalUv = uv / size;
            float val = texture(tex0, finalUv).r;

            fragColor = vec4(vec3(val), 1.0);
        }`;

        this.runShader("pixelate", frag, 1, {
            pixelSize: this.properties.pixelSize
        });

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Pixelate",PixelateNode);

class ThresholdNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.properties = { threshold: 0.5, soft: 0 };
        this.addWidget("slider","Threshold",this.properties.threshold,{min:0,max:1,property:"threshold"});
        this.addWidget("slider","Soft",this.properties.soft,{min:0,max:0.5,property:"soft"});
        this.title = "Threshold / Mask";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float threshold;
        uniform float soft;

        float smoothThreshold(float edge0, float edge1, float x) {
            float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
            return t * t * (3.0 - 2.0 * t);
        }

        void main() {
            float v = texture(tex0, vUv).r;

            float outVal;
            if (soft <= 0.0001) {
                outVal = v >= threshold ? 1.0 : 0.0;
            } else {
                float e0 = threshold - soft;
                float e1 = threshold + soft;
                outVal = smoothThreshold(e0, e1, v);
            }

            fragColor = vec4(vec3(outVal), 1.0);
        }`;

        this.runShader("threshold", frag, 1, {
            threshold: this.properties.threshold,
            soft: this.properties.soft
        });

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Threshold", ThresholdNode);

class DilateNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { amount: 0.01, passes: 1 };
        this.addWidget("slider", "Amount", this.properties.amount, { min: 1, max: 10, step: 1, property: "amount" });
        this.addWidget("slider", "Passes", this.properties.passes, { min: 1, max: 4, step: 1, property: "passes" });
        this.title = "Dilate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    runPass(direction, amount) {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform vec2 direction;
        uniform float amount;

        void main() {
            vec2 texSize = vec2(textureSize(tex0, 0));
            float radius = amount * max(texSize.x, texSize.y);
            vec2 texel = 1.0 / texSize;

            float maxVal = 0.0;

            for(int i = -20; i <= 20; i++) {
                float fi = float(i);
                if(abs(fi) > radius) continue;

                float v = texture(tex0, vUv + direction * texel * fi).r;
                maxVal = max(maxVal, v);
            }

            fragColor = vec4(vec3(maxVal), 1.0);
        }`;

        this.runShader(
            "dilate_pass",
            frag,
            1,
            { direction, amount },
            this.pingWrite(),
            [this.pingRead()]
        );

        this.swapPing();
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const amount = this.properties.amount * 0.001;
        const passes = Math.floor(this.properties.passes);

        // Copy input
        this.runShader(
            "copy",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main() { fragColor = texture(tex0, vUv); }`,
            1,
            {},
            this._pingFramebuffers[0],
            [this._inputTextures[0]]
        );

        this._pingCurrent = 0;

        for(let i = 0; i < passes; i++) {
            this.runPass([1, 0], amount);
            this.runPass([0, 1], amount);
        }

        // Output
        this.runShader(
            "copy_out",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main(){ fragColor = texture(tex0, vUv); }`,
            1,
            {},
            this.framebuffer,
            [this.pingRead()]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Dilate", DilateNode);

class ErodeNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { amount: 0.01, passes: 1 };
        this.addWidget("slider", "Amount", this.properties.amount, { min: 1, max: 10, step: 1, property: "amount" });
        this.addWidget("slider", "Passes", this.properties.passes, { min: 1, max: 4, step: 1, property: "passes" });
        this.title = "Erode";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    runPass(direction, amount) {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform vec2 direction;
        uniform float amount;

        void main() {
            vec2 texSize = vec2(textureSize(tex0, 0));
            float radius = amount * max(texSize.x, texSize.y);
            vec2 texel = 1.0 / texSize;

            float minVal = 1.0;

            for(int i = -20; i <= 20; i++) {
                float fi = float(i);
                if(abs(fi) > radius) continue;

                float v = texture(tex0, vUv + direction * texel * fi).r;
                minVal = min(minVal, v);
            }

            fragColor = vec4(vec3(minVal), 1.0);
        }`;

        this.runShader(
            "erode_pass",
            frag,
            1,
            { direction, amount },
            this.pingWrite(),
            [this.pingRead()]
        );

        this.swapPing();
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const amount = this.properties.amount * 0.001;
        const passes = Math.floor(this.properties.passes);

        this.runShader(
            "copy",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main() { fragColor = texture(tex0, vUv); }`,
            1,
            {},
            this._pingFramebuffers[0],
            [this._inputTextures[0]]
        );

        this._pingCurrent = 0;

        for(let i = 0; i < passes; i++) {
            this.runPass([1, 0], amount);
            this.runPass([0, 1], amount);
        }

        this.runShader(
            "copy_out",
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main(){ fragColor = texture(tex0, vUv); }`,
            1,
            {},
            this.framebuffer,
            [this.pingRead()]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Filter/Erode", ErodeNode);

// ---------------------------------------------------------------------------
// Real-time GPU Erosion Nodes (with dirty-checking for performance)
// ---------------------------------------------------------------------------

class ThermalErosionNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = {
            iterations: 15,
            rate: 0.5
        };
        this.addWidget("slider", "Iterations", this.properties.iterations, { min: 1, max: 100, step: 1, precision: 0, property: "iterations" });
        this.addWidget("slider", "Erosion Rate", this.properties.rate, { min: 0.01, max: 1.0, property: "rate" });
        this.title = "Thermal Erosion";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
        this._lastInput = null;
        this._lastHash = "";
    }

    onExecute() {
        const input = this.getInputData(0);
        const inputNode = this.getInputNode(0);
        const inputVersion = inputNode ? inputNode._shaderVersion : -1;
        const hash = "" + this.properties.iterations + "|" + this.properties.rate;

        if (input === this._lastInput && hash === this._lastHash && inputVersion === this._lastInputVersion) {
            this.setOutputTexture();
            this.drawPreviewTexture();
            return;
        }
        this._lastInput = input;
        this._lastHash = hash;
        this._lastInputVersion = inputVersion;

        this.updateInputTexture(0, input);

        const iters = Math.max(1, Math.floor(this.properties.iterations));
        const rate = this.properties.rate;

        const frag = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex0;
uniform float u_rate;

void main() {
    vec2 texel = 1.0 / vec2(textureSize(tex0, 0));
    float C = texture(tex0, vUv).r;
    float U = texture(tex0, vUv + vec2(0.0,  texel.y)).r;
    float D = texture(tex0, vUv + vec2(0.0, -texel.y)).r;
    float L = texture(tex0, vUv + vec2(-texel.x, 0.0)).r;
    float R = texture(tex0, vUv + vec2( texel.x, 0.0)).r;

    float dU = C - U;
    float dD = C - D;
    float dL = C - L;
    float dR = C - R;

    float totalDrop = max(dU, 0.0) + max(dD, 0.0) + max(dL, 0.0) + max(dR, 0.0);
    float moved = totalDrop * u_rate * 0.25;
    fragColor = vec4(C - moved, 0.0, 0.0, 1.0);
}`;

        this.runShader(
            "thermal_copy_in",
            `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex0;
void main() { fragColor = vec4(texture(tex0, vUv).r, 0.0, 0.0, 1.0); }`,
            1, {},
            this._pingFramebuffers[0],
            [this._inputTextures[0]]
        );
        this._pingCurrent = 0;

        for (let i = 0; i < iters; i++) {
            this.runShader(
                "thermal_erode",
                frag,
                1,
                { u_rate: rate },
                this._pingFramebuffers[1 - this._pingCurrent],
                [this._pingTextures[this._pingCurrent]]
            );
            this._pingCurrent = 1 - this._pingCurrent;
        }

        this.runShader(
            "thermal_copy_out",
            `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex0;
void main() { fragColor = vec4(texture(tex0, vUv).r, 0.0, 0.0, 1.0); }`,
            1, {},
            this.framebuffer,
            [this._pingTextures[this._pingCurrent]]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Filter/Thermal Erosion", ThermalErosionNode);


class HydraulicErosionNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = {
            iterations: 20,
            erosion: 0.3,
            smoothing: 0.5
        };
        this.addWidget("slider", "Iterations", this.properties.iterations, { min: 1, max: 100, step: 1, precision: 0, property: "iterations" });
        this.addWidget("slider", "Erosion Power", this.properties.erosion, { min: 0.01, max: 1.0, property: "erosion" });
        this.addWidget("slider", "Smoothing", this.properties.smoothing, { min: 0.0, max: 1.0, property: "smoothing" });
        this.title = "Hydraulic Erosion";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
        this._lastInput = null;
        this._lastHash = "";
    }

    onExecute() {
        const input = this.getInputData(0);
        const inputNode = this.getInputNode(0);
        const inputVersion = inputNode ? inputNode._shaderVersion : -1;
        const hash = "" + this.properties.iterations + "|" + this.properties.erosion + "|" + this.properties.smoothing;

        if (input === this._lastInput && hash === this._lastHash && inputVersion === this._lastInputVersion) {
            this.setOutputTexture();
            this.drawPreviewTexture();
            return;
        }
        this._lastInput = input;
        this._lastHash = hash;
        this._lastInputVersion = inputVersion;

        this.updateInputTexture(0, input);

        const iters = Math.max(1, Math.floor(this.properties.iterations));
        const erosion = this.properties.erosion;
        const smoothing = this.properties.smoothing;

        const frag = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex0;
uniform float u_erosion;
uniform float u_smoothing;

void main() {
    vec2 texel = 1.0 / vec2(textureSize(tex0, 0));
    float C = texture(tex0, vUv).r;
    float U = texture(tex0, vUv + vec2(0.0,  texel.y)).r;
    float D = texture(tex0, vUv + vec2(0.0, -texel.y)).r;
    float L = texture(tex0, vUv + vec2(-texel.x, 0.0)).r;
    float R = texture(tex0, vUv + vec2( texel.x, 0.0)).r;

    float avg = (U + D + L + R) * 0.25;
    float minN = min(min(U, D), min(L, R));

    float slope = C - minN;
    float eroded = C - slope * u_erosion * 0.5;
    float smoothed = mix(eroded, avg, u_smoothing * 0.3);

    fragColor = vec4(smoothed, 0.0, 0.0, 1.0);
}`;

        this.runShader(
            "hydro_copy_in",
            `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex0;
void main() { fragColor = vec4(texture(tex0, vUv).r, 0.0, 0.0, 1.0); }`,
            1, {},
            this._pingFramebuffers[0],
            [this._inputTextures[0]]
        );
        this._pingCurrent = 0;

        for (let i = 0; i < iters; i++) {
            this.runShader(
                "hydro_erode",
                frag,
                1,
                { u_erosion: erosion, u_smoothing: smoothing },
                this._pingFramebuffers[1 - this._pingCurrent],
                [this._pingTextures[this._pingCurrent]]
            );
            this._pingCurrent = 1 - this._pingCurrent;
        }

        this.runShader(
            "hydro_copy_out",
            `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tex0;
void main() { fragColor = vec4(texture(tex0, vUv).r, 0.0, 0.0, 1.0); }`,
            1, {},
            this.framebuffer,
            [this._pingTextures[this._pingCurrent]]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Filter/Hydraulic Erosion", HydraulicErosionNode);
