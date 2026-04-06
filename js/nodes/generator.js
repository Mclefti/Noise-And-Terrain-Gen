class PerlinNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("noise", "array");
        this.properties = { frequency: 5, octaves: 1, amplitude: 1, offset: 0, seed: 1 };
        this.addWidget("slider", "Frequency", this.properties.frequency, { min: 0, max: 20, property: "frequency" });
        this.addWidget("slider", "Octaves", this.properties.octaves, { min: 1, max: 8, step: 1, precision: 0, property: "octaves" });
        this.addWidget("slider", "Amplitude", this.properties.amplitude, { min: 0, max: 5, property: "amplitude" });
        this.addWidget("slider", "Offset", this.properties.offset, { min: 0, max: 5, property: "offset" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });
        this.title = "Perlin";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform float frequency;
        uniform int octaves;
        uniform float amplitude;
        uniform float offset;
        uniform float seed;

        // -------------------------
        // Hash / random
        // -------------------------
        float hash(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031 + seed * 0.13);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        vec2 grad(vec2 p) {
            float h = hash(p) * 6.2831853;
            return vec2(cos(h), sin(h));
        }

        // -------------------------
        // Fade + lerp
        // -------------------------
        float fade(float t) {
            return t*t*t*(t*(t*6.0-15.0)+10.0);
        }

        float lerp(float a, float b, float t) {
            return mix(a, b, t);
        }

        // -------------------------
        // Perlin 2D
        // -------------------------
        float perlin(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);

            vec2 g00 = grad(i + vec2(0.0, 0.0));
            vec2 g10 = grad(i + vec2(1.0, 0.0));
            vec2 g01 = grad(i + vec2(0.0, 1.0));
            vec2 g11 = grad(i + vec2(1.0, 1.0));

            float n00 = dot(g00, f - vec2(0.0, 0.0));
            float n10 = dot(g10, f - vec2(1.0, 0.0));
            float n01 = dot(g01, f - vec2(0.0, 1.0));
            float n11 = dot(g11, f - vec2(1.0, 1.0));

            float u = fade(f.x);
            float v = fade(f.y);

            return lerp(
                lerp(n00, n10, u),
                lerp(n01, n11, u),
                v
            );
        }

        // -------------------------
        // FBM (octaves)
        // -------------------------
        float fbm(vec2 p) {
            float value = 0.0;
            float amp = amplitude;
            float freq = 1.0;

            for(int i = 0; i < 8; i++) {
                if(i >= octaves) break;

                value += perlin(p * freq + offset) * amp;

                amp *= 0.5;
                freq *= 2.0;
            }

            return value;
        }

        void main() {
            vec2 uv = vUv;

            float v = fbm(uv * frequency);

            // match CPU: (val + 1) * 0.5
            v = v * 0.5 + 0.5;

            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "perlinGPU",
            frag,
            0,
            {
                frequency: (this.properties.frequency * 0.5),
                octaves: { type: "int", value: Math.floor(this.properties.octaves) },
                amplitude: this.properties.amplitude,
                offset: this.properties.offset,
                seed: this.properties.seed
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Generator/Perlin", PerlinNode);

class SimplexNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("noise", "array");
        this.properties = { frequency: 5, octaves: 1, amplitude: 1, offset: 0, seed: 1 };
        this.addWidget("slider", "Frequency", this.properties.frequency, { min: 0, max: 20, property: "frequency" });
        this.addWidget("slider", "Octaves", this.properties.octaves, { min: 1, max: 5, step: 1, precision: 0, property: "octaves" });
        this.addWidget("slider", "Amplitude", this.properties.amplitude, { min: 0, max: 5, property: "amplitude" });
        this.addWidget("slider", "Offset", this.properties.offset, { min: 0, max: 5, property: "offset" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });

        this.title = "Simplex";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform float frequency;
        uniform int octaves;
        uniform float amplitude;
        uniform float offset;
        uniform float seed;

        float hash(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031 + seed * 0.13);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        vec2 grad(vec2 p) {
            float h = hash(p) * 6.2831853;
            return vec2(cos(h), sin(h));
        }

        // -------------------------
        // 2D Simplex
        // -------------------------
        float simplex(vec2 v) {
            const float F2 = 0.36602540378; // (sqrt(3)-1)/2
            const float G2 = 0.2113248654;  // (3-sqrt(3))/6

            // Skew
            float s = (v.x + v.y) * F2;
            vec2 i = floor(v + s);

            float t = (i.x + i.y) * G2;
            vec2 X0 = i - t;
            vec2 x0 = v - X0;

            // Determine simplex corner
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

            vec2 x1 = x0 - i1 + G2;
            vec2 x2 = x0 - 1.0 + 2.0 * G2;

            // Gradients
            vec2 g0 = grad(i);
            vec2 g1 = grad(i + i1);
            vec2 g2 = grad(i + 1.0);

            // Contributions
            float n0, n1, n2;

            float t0 = 0.5 - dot(x0, x0);
            n0 = (t0 < 0.0) ? 0.0 : pow(t0, 4.0) * dot(g0, x0);

            float t1 = 0.5 - dot(x1, x1);
            n1 = (t1 < 0.0) ? 0.0 : pow(t1, 4.0) * dot(g1, x1);

            float t2 = 0.5 - dot(x2, x2);
            n2 = (t2 < 0.0) ? 0.0 : pow(t2, 4.0) * dot(g2, x2);

            return 70.0 * (n0 + n1 + n2);
        }

        // -------------------------
        // FBM
        // -------------------------
        float fbm(vec2 p) {
            float value = 0.0;
            float amp = amplitude;
            float freq = 1.0;

            for(int i = 0; i < 8; i++) {
                if(i >= octaves) break;

                value += simplex(p * freq + vec2(offset)) * amp;

                amp *= 0.5;
                freq *= 2.0;
            }

            return value;
        }

        void main() {
            vec2 uv = vUv;

            float v = fbm(uv * frequency);

            v = v * 0.5 + 0.5;

            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "simplexGPU",
            frag,
            0,
            {
                frequency: this.properties.frequency * 0.5,
                octaves: { type: "int", value: this.properties.octaves },
                amplitude: this.properties.amplitude,
                offset: this.properties.offset,
                seed: this.properties.seed
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Generator/Simplex", SimplexNode);

class DirectionalNoiseNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("noise", "array");
        this.properties = { frequency: 5, stretch: 20, amplitude: 1, angle: 0, seed: 1 };
        this.addWidget("slider", "Frequency", this.properties.frequency, { min: 0.1, max: 20, property: "frequency" });
        this.addWidget("slider", "Stretch", this.properties.stretch, { min: 0, max: 50, property: "stretch" });
        this.addWidget("slider", "Amplitude", this.properties.amplitude, { min: 0, max: 5, property: "amplitude" });
        this.addWidget("slider", "Angle", this.properties.angle, { min: 0, max: 360, property: "angle" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });

        this.title = "DirectionalNoise";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform float frequency;
        uniform float stretch;
        uniform float amplitude;
        uniform float angle;
        uniform float seed;

        float hash(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031 + seed * 0.13);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        vec2 grad(vec2 p) {
            float h = hash(p) * 6.2831853;
            return vec2(cos(h), sin(h));
        }

        float simplex(vec2 v) {
            const float F2 = 0.36602540378;
            const float G2 = 0.2113248654;
            float s = (v.x + v.y) * F2;
            vec2 i = floor(v + s);
            float t = (i.x + i.y) * G2;
            vec2 X0 = i - t;
            vec2 x0 = v - X0;
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec2 x1 = x0 - i1 + G2;
            vec2 x2 = x0 - 1.0 + 2.0 * G2;
            vec2 g0 = grad(i);
            vec2 g1 = grad(i + i1);
            vec2 g2 = grad(i + 1.0);
            float t0 = 0.5 - dot(x0, x0);
            float t1 = 0.5 - dot(x1, x1);
            float t2 = 0.5 - dot(x2, x2);
            float n0 = (t0<0.0)?0.0:pow(t0,4.0)*dot(g0,x0);
            float n1 = (t1<0.0)?0.0:pow(t1,4.0)*dot(g1,x1);
            float n2 = (t2<0.0)?0.0:pow(t2,4.0)*dot(g2,x2);
            return 70.0 * (n0+n1+n2);
        }

        float directionalNoise(vec2 uv) {
            // rotate
            float xr = uv.x * cos(angle) + uv.y * sin(angle);
            float yr = -uv.x * sin(angle) + uv.y * cos(angle);

            // stretch along rotated X axis
            xr *= stretch;

            return simplex(vec2(xr, yr) * frequency);
        }

        void main() {
            vec2 uv = vUv;
            float v = directionalNoise(uv) * amplitude;
            v = v * 0.5 + 0.5; // normalize
            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "directionalNoiseGPU",
            frag,
            0,
            {
                frequency: this.properties.frequency,
                stretch: this.properties.stretch,
                amplitude: this.properties.amplitude,
                angle: this.properties.angle / 360.0 * Math.PI * 2,
                seed: this.properties.seed
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Generator/DirectionalNoise", DirectionalNoiseNode);

class FormulaXYNode extends GPUNodeBase {
    constructor() {
        super();
        this.properties = { formula: "x*y" };
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        this.addOutput("out", "array");
        this.title = "FormulaXY";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const formula = this.properties.formula;
        this.runShader("formulaXY_" + formula, `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            void main(){
                float x=vUv.x;
                float y=vUv.y;
                float val=${formula};
                fragColor=vec4(val,0.0,0.0,1.0);
            }`
        );
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Generator/FormulaXY", FormulaXYNode);

class CheckerboardNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { squares: 32 };
        this.addWidget("slider", "Squares", this.properties.squares, { min: 2, max: 128, step: 1, precision: 0, property: "squares" });
        this.title = "Checkerboard";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform float squares;
        in vec2 vUv;
        out vec4 fragColor;
        void main() {
            float size = ${WIDTH}.0 / squares;
            vec2 uv = vUv * vec2(${WIDTH}.0, ${HEIGHT}.0);
            float val = mod(floor(uv.x / size) + floor(uv.y / size), 2.0);
            fragColor = vec4(val, 0.0, 0.0, 1.0);
        }`;

        this.runShader(
            `checkerboard`,
            fs,
            0,
            { squares: Math.round(this.properties.squares) },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Generator/Checkerboard", CheckerboardNode);

class HexGridNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");

        this.properties = { scale: 40 };

        this.addWidget("slider", "Scale", this.properties.scale, { min: 5, max: 200, property: "scale" });

        this.title = "Hex Grid";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform float scale;
        in vec2 vUv;
        out vec4 fragColor;

        float hexDist(float x, float y){
            x = abs(x);
            y = abs(y);
            return max(x * 0.8660254 + y * 0.5, y);
        }

        void main() {
            vec2 uv = vUv * vec2(${WIDTH}.0, ${HEIGHT}.0) / scale;
            uv.x -= floor(uv.y) * 0.5;
            vec2 g = floor(uv);
            vec2 f = uv - g - 0.5;
            float val = hexDist(f.x, f.y) < 0.5 ? 1.0 : 0.0;
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        this.runShader(
            `hexgrid`,
            fs,
            0,
            { scale: this.properties.scale },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Hex Grid", HexGridNode);

class BrickNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");

        this.properties = {
            bricksX: 8,
            bricksY: 4,
            mortar: 4,   // in pixels
            bevel: 6     // in pixels
        };

        this.addWidget("slider", "Bricks X", this.properties.bricksX, { min: 1, max: 50, step: 1, precision: 0, property: "bricksX" });
        this.addWidget("slider", "Bricks Y", this.properties.bricksY, { min: 1, max: 50, step: 1, precision: 0, property: "bricksY" });
        this.addWidget("slider", "Mortar (px)", this.properties.mortar, { min: 0, max: 20, property: "mortar" });
        this.addWidget("slider", "Bevel (px)", this.properties.bevel, { min: 0, max: 50, property: "bevel" });

        this.title = "Bricks";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;

        uniform float bricksX;
        uniform float bricksY;
        uniform float mortar; // pixels
        uniform float bevel;  // pixels

        in vec2 vUv;
        out vec4 fragColor;

        void main() {
            vec2 resolution = vec2(${WIDTH}.0, ${HEIGHT}.0);

            vec2 uv = vUv * vec2(bricksX, bricksY);

            float row = floor(uv.y);

            uv.x += mod(row, 2.0) * 0.5;

            vec2 brick = fract(uv);

            vec2 tileSizePx = resolution / vec2(bricksX, bricksY);

            vec2 mortarTile = mortar / tileSizePx;
            vec2 bevelTile  = bevel  / tileSizePx;

            float mortarMask =
                step(brick.x, mortarTile.x) +
                step(brick.y, mortarTile.y) +
                step(1.0 - brick.x, mortarTile.x) +
                step(1.0 - brick.y, mortarTile.y);

            mortarMask = clamp(mortarMask, 0.0, 1.0);

            float distToEdge = min(
                min(brick.x, 1.0 - brick.x),
                min(brick.y, 1.0 - brick.y)
            );

            float bevelSize = min(bevelTile.x, bevelTile.y);

            // Prevent bevel from exceeding brick
            bevelSize = min(bevelSize, 0.5);

            float bevelMask = smoothstep(0.0, bevelSize, distToEdge);

            // Optional: sharper bevel (comment out if you want softer)
            bevelMask = pow(bevelMask, 1.5);

            float brickVal = (1.0 - mortarMask) * bevelMask;

            fragColor = vec4(vec3(brickVal), 1.0);
        }`;

        this.runShader(
            "bricks",
            fs,
            0,
            {
                bricksX: Math.round(this.properties.bricksX),
                bricksY: Math.round(this.properties.bricksY),
                mortar: this.properties.mortar,
                bevel: this.properties.bevel
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Bricks", BrickNode);

class TruchetNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");

        this.properties = { scale: 40, seed: 1, thickness: 0.08 };

        this.addWidget("slider", "Scale", this.properties.scale, { min: 10, max: 100, property: "scale" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });
        this.addWidget("slider", "Thickness", this.properties.thickness, { min: 0.01, max: 0.3, property: "thickness" });

        this.title = "Truchet Tiles";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform float scale;
        uniform float thickness;
        uniform float seed;
        in vec2 vUv;
        out vec4 fragColor;

        uint hash(uint x, uint y, uint s){
            uint h = x * 374761393u + y * 668265263u + s * 982451653u;
            h = (h ^ (h >> 13u)) * 1274126177u;
            return h ^ (h >> 16u);
        }

        void main() {
            vec2 uv = vUv * vec2(${WIDTH}.0, ${HEIGHT}.0);
            float tx = floor(uv.x / scale);
            float ty = floor(uv.y / scale);
            uint h = hash(uint(tx), uint(ty), uint(seed));
            bool flip = (h & 1u) == 0u;

            vec2 local = vec2(mod(uv.x, scale), mod(uv.y, scale)) / scale;

            float d;
            if(flip){
                float d1 = length(local);
                float d2 = length(local - vec2(1.0,1.0));
                d = min(d1,d2);
            } else {
                float d1 = length(local - vec2(1.0,0.0));
                float d2 = length(local - vec2(0.0,1.0));
                d = min(d1,d2);
            }

            float val = abs(d - 0.5) < thickness ? 1.0 : 0.0;
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        this.runShader(
            `truchet`,
            fs,
            0,
            {
                scale: this.properties.scale,
                thickness: this.properties.thickness,
                seed: this.properties.seed
            },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Truchet Tiles", TruchetNode);

class StripesNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = {
            frequency: 10,
            width: 0.5,
            softness: 0,
            vertical: true
        };

        this.addWidget("slider", "Frequency", this.properties.frequency, { min: 1, max: 50, property: "frequency" });
        this.addWidget("slider", "Width", this.properties.width, { min: 0.01, max: 1, property: "width" });
        this.addWidget("slider", "Softness", this.properties.softness, { min: 0, max: 0.5, property: "softness" });
        this.addWidget("toggle", "Vertical", this.properties.vertical, { property: "vertical" });

        this.title = "Stripes";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform float frequency;
        uniform float width;
        uniform float softness;
        uniform bool vertical;
        in vec2 vUv;
        out vec4 fragColor;

        float smoothstepCustom(float a, float b, float x){
            float t = clamp((x-a)/(b-a),0.0,1.0);
            return t*t*(3.0-2.0*t);
        }

        void main(){
            float coord = vertical ? vUv.x : vUv.y;
            float t = mod(coord*frequency, 1.0);
            float val;
            if(softness > 0.0){
                float inEdge = smoothstepCustom(0.0, softness, t);
                float outEdge = 1.0 - smoothstepCustom(width - softness, width, t);
                val = inEdge*outEdge;
            } else {
                val = t < width ? 1.0 : 0.0;
            }
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        this.runShader(
            `stripes`,
            fs,
            0,
            {
                frequency: this.properties.frequency,
                width: this.properties.width,
                softness: this.properties.softness,
                vertical: this.properties.vertical ? 1 : 0
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Stripes", StripesNode);

class GradientNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { type: "Horizontal", invert: false };

        this.addWidget("combo", "Type", this.properties.type, {
            values: ["Horizontal", "Vertical", "Radial"],
            property: "type"
        });
        this.addWidget("toggle", "Invert", this.properties.invert, { property: "invert" });

        this.title = "Gradient";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform int typeIdx;
        uniform bool invert;
        in vec2 vUv;
        out vec4 fragColor;
        void main(){
            float val;
            if(typeIdx==0) val = vUv.x;
            else if(typeIdx==1) val = vUv.y;
            else {
                vec2 c = vUv - vec2(0.5);
                val = length(c)/0.5;
            }
            if(invert) val = 1.0 - val;
            val = clamp(val,0.0,1.0);
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        const typeIdx = ["Horizontal", "Vertical", "Radial"].indexOf(this.properties.type);

        this.runShader(
            `gradient`,
            fs,
            0,
            { typeIdx: { type: "int", typeIdx }, invert: this.properties.invert ? 1 : 0 },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Gradient", GradientNode);

class WhiteNoiseNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { seed: 1 };
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, precision: 0, property: "seed" });
        this.title = "White Noise";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform float seed;
        in vec2 vUv;
        out vec4 fragColor;

        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233)) + seed)*43758.5453);
        }

        void main(){
            float val = rand(vUv * vec2(${WIDTH}.0,${HEIGHT}.0));
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        this.runShader(
            `whitenoise`,
            fs,
            0,
            { seed: this.properties.seed },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/WhiteNoise", WhiteNoiseNode);

class VoronoiNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { scale: 40, seed: 1, type: "Distance" };
        this.addWidget("slider", "Scale", this.properties.scale, { min: 1, max: 100, step: 1, precision: 0, property: "scale" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, precision: 0, property: "seed" });
        this.addWidget("combo", "Type", this.properties.type, {
            values: ["Distance", "FlatCell"],
            property: "type"
        });
        this.title = "Voronoi";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    rand2d(x, y, seed) {
        return `fract(sin(dot(vec2(${x},${y}), vec2(12.9898,78.233)) + ${seed}.0) * 43758.5453)`;
    }

    onExecute() {
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;

        uniform float seed;
        uniform float scale;
        uniform int typeIdx;

        float h1(vec2 p)
        {
            p += seed;
            return fract(cos(p.x*89.42 - p.y*75.7) * 343.42);
        }

        vec2 h2(vec2 p)
        {
            p += seed;
            return fract(cos(p * mat2(89.4,-75.7,-81.9,79.6)) * 343.42); 
        }

        float voronoi(vec2 n, float s)
        {
            float id = 0.0;
            float dis = 1e20;

            vec2 cell = floor(n / s);
            vec2 f = fract(n / s);

            for(int x = -1; x <= 1; x++)
            for(int y = -1; y <= 1; y++)
            {
                vec2 p = cell + vec2(float(x), float(y));
                vec2 offset = h2(p);

                float d = length(offset + vec2(float(x), float(y)) - f);

                if (d < dis)
                {
                    dis = d;
                    id = h1(p);
                }
            }

            if (typeIdx == 0)
                return dis;
            else
                return id;
        }

        void main()
        {
            vec2 uv = vUv.xy;

            // scale behaves like "points" / density
            float s = scale;

            float v = voronoi(uv, s);

            // grayscale output (node-friendly)
            fragColor = vec4(vec3(v), 1.0);
        }`;

        const typeIdx = ["Distance", "FlatCell"].indexOf(this.properties.type);

        this.runShader(
            "voronoiGPU",
            frag,
            0,
            { seed: this.properties.seed, scale: this.properties.scale * 0.005, typeIdx: { type: "int", value: typeIdx } }
        );
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Generator/Voronoi", VoronoiNode);

class CellNoiseNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { points: 20, thickness: 3, seed: 1 };

        this.addWidget("slider", "Points", this.properties.points, { min: 1, max: 100, property: "points" });
        this.addWidget("slider", "Thickness", this.properties.thickness, { min: 0.1, max: 20, property: "thickness" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, precision: 0, property: "seed" });

        this.title = "Cell Noise";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform int numPoints;
        uniform float thickness;
        uniform float seed;
        in vec2 vUv;
        out vec4 fragColor;

        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233)) + seed)*43758.5453);
        }

        void main(){
            vec2 uv = vUv * vec2(${WIDTH}.0,${HEIGHT}.0);
            float t = thickness*min(${WIDTH}.0,${HEIGHT}.0)*0.01;
            float d1 = 1.0e20;
            float d2 = 1.0e20;
            for(int i=0;i<100;i++){
                if(i>=numPoints) break;
                vec2 p = vec2(rand(vec2(float(i),0.0))*${WIDTH}.0, rand(vec2(float(i),1.0))*${HEIGHT}.0);
                float dist = distance(uv,p);
                if(dist < d1){
                    d2 = d1;
                    d1 = dist;
                } else if(dist < d2){
                    d2 = dist;
                }
            }
            float edge = sqrt(d2)-sqrt(d1);
            float val = edge < t ? 1.0 : 0.0;
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        this.runShader(
            `cellnoise`,
            fs,
            0,
            { numPoints: { type: "int", value: Math.floor(this.properties.points) }, thickness: this.properties.thickness * 0.05, seed: this.properties.seed },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/CellNoise", CellNoiseNode);

class CircleNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = { radius: 0.25, x: 0.5, y: 0.5 }; // normalized coords
        this.addWidget("slider", "Radius", this.properties.radius, { min: 0, max: 0.5, property: "radius" });
        this.addWidget("slider", "X", this.properties.x, { min: 0, max: 1, property: "x" });
        this.addWidget("slider", "Y", this.properties.y, { min: 0, max: 1, property: "y" });
        this.title = "Circle";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform float radius;
        uniform float cx;
        uniform float cy;
        in vec2 vUv;
        out vec4 fragColor;

        void main(){
            vec2 uv = vUv * vec2(${WIDTH}.0,${HEIGHT}.0);
            float dx = uv.x - cx*${WIDTH}.0;
            float dy = uv.y - cy*${HEIGHT}.0;
            float val = (dx*dx + dy*dy <= radius*radius*min(${WIDTH}.0,${HEIGHT}.0)*min(${WIDTH}.0,${HEIGHT}.0)) ? 1.0 : 0.0;
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        this.runShader(
            `circle`,
            fs,
            0,
            { radius: this.properties.radius, cx: this.properties.x, cy: this.properties.y },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Circle", CircleNode);

class DotsNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = {
            spacing: 0.1,   // 0..1 normalized spacing
            radius: 0.03,   // radius of dots
            softness: 0.01, // edge softness
            stagger: false
        };
        this.addWidget("slider", "Spacing", this.properties.spacing, { min: 0.01, max: 0.5, property: "spacing" });
        this.addWidget("slider", "Radius", this.properties.radius, { min: 0.005, max: 0.2, property: "radius" });
        this.addWidget("slider", "Softness", this.properties.softness, { min: 0, max: 0.1, property: "softness" });
        this.addWidget("toggle", "Stagger", this.properties.stagger, { property: "stagger" });
        this.title = "Dots";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const fs = `#version 300 es
        precision highp float;
        uniform float spacing;
        uniform float radius;
        uniform float softness;
        uniform bool stagger;
        in vec2 vUv;
        out vec4 fragColor;

        float smoothstepCustom(float a,float b,float x){
            float t = clamp((x-a)/(b-a),0.0,1.0);
            return t*t*(3.0-2.0*t);
        }

        void main(){
            vec2 uv = vUv;
            float cx = floor(uv.x/spacing);
            float cy = floor(uv.y/spacing);
            float offsetX = stagger && mod(cy,2.0)>0.5 ? spacing*0.5 : 0.0;
            vec2 local = uv - vec2(cx*spacing + offsetX, cy*spacing);
            float dist = length(local);
            float val = softness>0.0 ? 1.0-smoothstepCustom(radius-softness,radius+softness,dist) : (dist<radius ? 1.0:0.0);
            fragColor = vec4(val,0.0,0.0,1.0);
        }`;

        this.runShader(
            `dots`,
            fs,
            0,
            { spacing: this.properties.spacing, radius: this.properties.radius, softness: this.properties.softness, stagger: this.properties.stagger ? 1 : 0 },
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Dots", DotsNode);

class RidgedNoiseNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");

        this.properties = { scale: 50, octaves: 4, seed: 1 };

        this.addWidget("slider", "Scale", this.properties.scale, { min: 1, max: 200, property: "scale" });
        this.addWidget("slider", "Octaves", this.properties.octaves, { min: 1, max: 8, step: 1, precision: 0, property: "octaves" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });

        this.title = "Ridged Noise";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform float scale;
        uniform int octaves;
        uniform float seed;

        float hash(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031 + seed * 0.13);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        vec2 grad(vec2 p) {
            float h = hash(p) * 6.2831853;
            return vec2(cos(h), sin(h));
        }

        // -------------------------
        // Simplex 2D
        // -------------------------
        float simplex(vec2 v) {
            const float F2 = 0.36602540378;
            const float G2 = 0.2113248654;

            float s = (v.x + v.y) * F2;
            vec2 i = floor(v + s);

            float t = (i.x + i.y) * G2;
            vec2 X0 = i - t;
            vec2 x0 = v - X0;

            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

            vec2 x1 = x0 - i1 + G2;
            vec2 x2 = x0 - 1.0 + 2.0 * G2;

            vec2 g0 = grad(i);
            vec2 g1 = grad(i + i1);
            vec2 g2 = grad(i + 1.0);

            float n0, n1, n2;

            float t0 = 0.5 - dot(x0, x0);
            n0 = (t0 < 0.0) ? 0.0 : pow(t0, 4.0) * dot(g0, x0);

            float t1 = 0.5 - dot(x1, x1);
            n1 = (t1 < 0.0) ? 0.0 : pow(t1, 4.0) * dot(g1, x1);

            float t2 = 0.5 - dot(x2, x2);
            n2 = (t2 < 0.0) ? 0.0 : pow(t2, 4.0) * dot(g2, x2);

            return 70.0 * (n0 + n1 + n2);
        }

        // -------------------------
        // Ridged FBM
        // -------------------------
        float ridged(vec2 p) {
            float value = 0.0;
            float amp = 1.0;
            float freq = 1.0;

            for(int i = 0; i < 8; i++) {
                if(i >= octaves) break;

                float n = simplex(p * freq);

                n = abs(n);   // ridge base
                n = 1.0 - n; // invert
                n *= n;      // sharpen ridges

                value += n * amp;

                freq *= 2.0;
                amp *= 0.5;
            }

            return value;
        }

        void main() {
            vec2 uv = vUv;

            // match CPU: x/scale
            vec2 p = uv * (1.0 / scale);

            float v = ridged(p);

            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "ridgedNoiseGPU",
            frag,
            0,
            {
                scale: this.properties.scale * 0.01,
                octaves: { type: "int", value: this.properties.octaves },
                seed: this.properties.seed
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Ridged Noise", RidgedNoiseNode);

// ============================================================
// Wave Interference Node
// ============================================================
class WaveInterferenceNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = {
            frequency: 2.0,
            sources: 5,
            phase: 0,
            decay: 0,
            seed: 1
        };
        this.addWidget("slider", "Frequency", this.properties.frequency, { min: 0.001, max: 5.000, property: "frequency" });
        this.addWidget("slider", "Sources", this.properties.sources, { min: 1, max: 32, step: 1, precision: 0, property: "sources" });
        this.addWidget("slider", "Phase", this.properties.phase, { min: 0, max: 6.2832, property: "phase" });
        this.addWidget("slider", "Decay", this.properties.decay, { min: 0, max: 10, property: "decay" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });
        this.title = "Wave Interference";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform float frequency;
        uniform int   sources;
        uniform float phase;
        uniform float decay;
        uniform float seed;

        // ---- deterministic source positions via hash ----
        float hashf(float n) {
            return fract(sin(n * 127.1 + seed * 311.7) * 43758.5453123);
        }

        void main() {
            vec2 uv = vUv;
            float accum     = 0.0;
            float totalAmp  = 0.0;

            for (int i = 0; i < 32; i++) {
                if (i >= sources) break;

                float fi  = float(i);
                vec2  src = vec2(hashf(fi * 2.0), hashf(fi * 2.0 + 1.0));
                float d   = length(uv - src);

                float amp = decay > 0.0 ? exp(-decay * d) : 1.0;
                accum    += amp * cos(6.2831853 * frequency * d + phase);
                totalAmp += amp;
            }

            // Remap from [-totalAmp, +totalAmp] to [0, 1]
            float v = (accum / max(totalAmp, 0.0001)) * 0.5 + 0.5;
            v = clamp(v, 0.0, 1.0);
            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "waveInterferenceGPU",
            frag,
            0,
            {
                frequency: this.properties.frequency,
                sources: { type: "int", value: Math.round(this.properties.sources) },
                phase: this.properties.phase,
                decay: this.properties.decay,
                seed: this.properties.seed
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Wave Interference", WaveInterferenceNode);


// ============================================================
// Harmonic Node
// ============================================================
class HarmonicNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("out", "array");
        this.properties = {
            frequency: 2.0,
            harmonics: 6,
            falloff: 0.5,
            angle_spread: 1.0,
            seed: 1
        };
        this.addWidget("slider", "Frequency", this.properties.frequency, { min: 0.001, max: 5.000, property: "frequency" });
        this.addWidget("slider", "Harmonics", this.properties.harmonics, { min: 1, max: 16, step: 1, precision: 0, property: "harmonics" });
        this.addWidget("slider", "Falloff", this.properties.falloff, { min: 0.1, max: 1.0, property: "falloff" });
        this.addWidget("slider", "Angle Spread", this.properties.angle_spread, { min: 0.0, max: 1.0, property: "angle_spread" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });
        this.title = "Harmonic";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform float frequency;
        uniform int   harmonics;
        uniform float falloff;
        uniform float angle_spread;
        uniform float seed;

        // ---- deterministic angle / phase per harmonic ----
        float hashf(float n) {
            return fract(sin(n * 127.1 + seed * 311.7) * 43758.5453123);
        }

        void main() {
            vec2 uv = vUv;
            float accum     = 0.0;
            float totalAmp  = 0.0;
            float amp       = 1.0;

            for (int k = 1; k <= 16; k++) {
                if (k > harmonics) break;

                float fk    = float(k);
                float angle = hashf(fk * 2.0) * 6.2831853 * angle_spread;
                float ph    = hashf(fk * 2.0 + 1.0) * 6.2831853;
                vec2  dir   = vec2(cos(angle), sin(angle));

                accum    += amp * sin(6.2831853 * fk * frequency * dot(uv, dir) + ph);
                totalAmp += amp;
                amp      *= falloff;
            }

            // Normalize to [0, 1]
            float v = (accum / max(totalAmp, 0.0001)) * 0.5 + 0.5;
            v = clamp(v, 0.0, 1.0);
            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "harmonicGPU",
            frag,
            0,
            {
                frequency: this.properties.frequency,
                harmonics: { type: "int", value: Math.round(this.properties.harmonics) },
                falloff: this.properties.falloff,
                angle_spread: this.properties.angle_spread,
                seed: this.properties.seed
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Harmonic", HarmonicNode);

// ============================================================
// Image Source Node — Upload an image and use as noise data
// ============================================================
class ImageNode extends GPUNodeBase {
    constructor() {
        super();
        this.addOutput("noise", "array");
        this.properties = { fit: "Stretch", heightMode: "Luminance", contrast: 2.0, smooth: 0 };
        this.addWidget("combo", "Fit Mode", this.properties.fit, (v) => {
            this.properties.fit = v;
            if (this._img.src) this._processImage();
        }, { values: ["Stretch", "Fit"], property: "fit" });

        this.addWidget("combo", "Height Mode", this.properties.heightMode, (v) => {
            this.properties.heightMode = v;
            if (this._img.src) this._processImage();
        }, { values: ["Luminance", "Average", "Topographic"], property: "heightMode" });

        this.addWidget("slider", "Contrast", this.properties.contrast, (v) => {
            this.properties.contrast = v;
            if (this._img.src) this._processImage();
        }, { min: 0.5, max: 5, property: "contrast" });

        this.addWidget("slider", "Smooth", this.properties.smooth, (v) => {
            this.properties.smooth = v;
            if (this._img.src) this._processImage();
        }, { min: 0, max: 100, step: 1, precision: 0, property: "smooth" });

        this.title = "Image";

        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.accept = "image/*";
        this._fileInput.style.display = "none";
        this._fileInput.onchange = this._onFileSelected.bind(this);

        this._img = new Image();
        this._img.onload = this._onImageLoaded.bind(this);

        this._status = "No image";
        this._statusColor = "#888";
        this._needsUpload = false;
        this._pixelData = null;

        this.size = [180, 320];
    }

    rebuildTextures() {
        super.rebuildTextures();
        if (this._img.src) this._processImage();
    }

    onDrawForeground(ctx) {
        if (this.flags.collapsed) return;
        const w = this.size[0];

        // Status text
        ctx.fillStyle = this._statusColor;
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this._status, w / 2, 140);

        // "Load Image" button
        const btnX = 15;
        const btnY = 130;
        const btnW = w - 30;
        const btnH = 26;

        ctx.fillStyle = "#2a5a4a";
        ctx.strokeStyle = "#3b8f6f";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#a1dcdb";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("📂 Load Image", w / 2, btnY + 17);

        ctx.textAlign = "left";
    }

    onMouseDown(e, localPos) {
        const btnX = 15;
        const btnY = 140;
        const btnW = this.size[0] - 30;
        const btnH = 26;

        if (localPos[0] >= btnX && localPos[0] <= btnX + btnW &&
            localPos[1] >= btnY && localPos[1] <= btnY + btnH) {
            this._fileInput.click();
            return true;
        }
    }

    _onFileSelected(e) {
        const file = e.target.files[0];
        if (!file) return;

        this._status = "Loading...";
        this._statusColor = "#a1dcdb";

        const reader = new FileReader();
        reader.onload = (evt) => {
            this._img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }

    _onImageLoaded() {
        this._processImage();
    }

    /**
     * Convert RGB to HSL.
     * Returns [h, s, l] where h is in [0, 360), s and l are in [0, 1].
     */
    _rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const d = max - min; // Chroma

        if (max === min) return [0, 0, l, 0]; // achromatic

        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        let h;
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = ((b - r) / d + 2);
        else h = ((r - g) / d + 4);
        h *= 60;

        return [h, s, l, d];
    }

    /**
     * Map a topographic color-ramp pixel to a 0..1 height.
     * Uses hue as primary elevation indicator, with lightness for fine detail.
     * Color ramp: blue/cyan (low) → green → yellow → orange → red → pink → white (high)
     */
    _topoHeight(r, g, b) {
        const [h, s, l, chroma] = this._rgbToHsl(r, g, b);

        let height;

        // Map hue to a continuous elevation value.
        // The topographic color ramp goes around the hue wheel:
        if (h >= 200 && h < 260) {
            // Deep blue → lowest
            height = 0.0 + ((260 - h) / 60) * 0.05;
        } else if (h >= 180 && h < 200) {
            // Cyan → low
            height = 0.05 + ((200 - h) / 20) * 0.10;
        } else if (h >= 140 && h < 180) {
            // Cyan-green → low-mid
            height = 0.15 + ((180 - h) / 40) * 0.15;
        } else if (h >= 100 && h < 140) {
            // Green → mid
            height = 0.30 + ((140 - h) / 40) * 0.15;
        } else if (h >= 70 && h < 100) {
            // Yellow-green → mid-high
            height = 0.45 + ((100 - h) / 30) * 0.10;
        } else if (h >= 45 && h < 70) {
            // Yellow → high
            height = 0.55 + ((70 - h) / 25) * 0.10;
        } else if (h >= 25 && h < 45) {
            // Orange → higher
            height = 0.65 + ((45 - h) / 20) * 0.10;
        } else if (h >= 10 && h < 25) {
            // Red-orange → very high
            height = 0.75 + ((25 - h) / 15) * 0.05;
        } else if (h >= 0 && h < 10) {
            // Red → very high
            height = 0.80 + ((10 - h) / 10) * 0.05;
        } else if (h >= 340 && h < 360) {
            // Pink/red → very high
            height = 0.82 + ((360 - h) / 20) * 0.03;
        } else if (h >= 300 && h < 340) {
            // Pink/magenta → highest colored
            height = 0.90 + ((340 - h) / 40) * 0.05;
        } else if (h >= 260 && h < 300) {
            // Purple-blue → low
            height = 0.02 + ((h - 260) / 40) * 0.03;
        } else {
            height = l;
        }

        // Use lightness to add fine detail within each hue band
        // Lighter tones within the same hue = slightly higher elevation
        height += (l - 0.5) * 0.10;

        // When color vanishes (e.g. pure white snowcaps or dark shadows), Hue becomes mathematically meaningless.
        // We smoothly transition strictly to Lightness to form perfect peaks (1.0) and pits (0.0),
        // completely avoiding artificial manipulation or forced ramps on colored terrain.
        if (chroma < 0.2) {
            let fade = (0.2 - chroma) / 0.2; // 0.0 at c=0.2, 1.0 at c=0.0
            height = height * (1 - fade) + l * fade;
        }

        return Math.max(0, Math.min(1, height));
    }

    _processImage() {
        if (!this._img.complete) return;

        const canvas = document.createElement("canvas");
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx2 = canvas.getContext("2d");

        // Fill background black for fit letterboxing
        ctx2.fillStyle = "black";
        ctx2.fillRect(0, 0, WIDTH, HEIGHT);

        if (this.properties.fit === "Stretch") {
            ctx2.drawImage(this._img, 0, 0, WIDTH, HEIGHT);
        } else {
            const aspect = this._img.width / this._img.height;
            let w = WIDTH;
            let h = HEIGHT;

            if (aspect > 1) { // Wider than tall
                h = WIDTH / aspect;
            } else { // Taller than wide or square
                w = HEIGHT * aspect;
            }

            ctx2.drawImage(this._img, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
        }

        const imgData = ctx2.getImageData(0, 0, WIDTH, HEIGHT).data;
        this._pixelData = new Float32Array(WIDTH * HEIGHT);

        const mode = this.properties.heightMode;
        const contrast = this.properties.contrast;

        // First pass: compute raw height values
        for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
                const srcIdx = (y * WIDTH + x) * 4;
                const r = imgData[srcIdx + 0];
                const g = imgData[srcIdx + 1];
                const b = imgData[srcIdx + 2];

                let v;
                if (mode === "Topographic") {
                    v = this._topoHeight(r, g, b);
                } else if (mode === "Average") {
                    v = (r + g + b) / (3 * 255);
                } else {
                    // Luminance (default)
                    v = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                }
                
                // Canvas 'getImageData' maps 0,0 to the Top-Left. 
                // WebGL texture arrays map 0,0 to the Bottom-Left. Fliping Y here right-sides the map!
                const dstIdx = (HEIGHT - 1 - y) * WIDTH + x;
                this._pixelData[dstIdx] = v;
            }
        }

        // Second pass: auto-normalize to full 0..1 range, then apply contrast
        let minVal = Infinity, maxVal = -Infinity;
        for (let i = 0; i < this._pixelData.length; i++) {
            if (this._pixelData[i] < minVal) minVal = this._pixelData[i];
            if (this._pixelData[i] > maxVal) maxVal = this._pixelData[i];
        }

        const range = maxVal - minVal;
        if (range > 0.001) {
            for (let i = 0; i < this._pixelData.length; i++) {
                // Normalize to 0..1
                let v = (this._pixelData[i] - minVal) / range;
                // Apply power curve for contrast/steepness
                v = Math.pow(v, contrast);
                this._pixelData[i] = v;
            }
        }

        // Smoothing pass: Fast sliding-window box blur to melt flat plateaus & noise
        // A radius-based blur run 3 times deeply mimics a true continuous Gaussian slope.
        const radius = Math.round(this.properties.smooth);
        if (radius > 0) {
            const tmp = new Float32Array(WIDTH * HEIGHT);
            const passes = 3; 
            for (let pass = 0; pass < passes; pass++) {
                // Horizontal pass
                for (let y = 0; y < HEIGHT; y++) {
                    let sum = 0, count = 0;
                    for (let dx = -radius; dx <= radius; dx++) {
                        if (dx >= 0 && dx < WIDTH) {
                            sum += this._pixelData[y * WIDTH + dx];
                            count++;
                        }
                    }
                    tmp[y * WIDTH] = sum / count;
                    
                    for (let x = 1; x < WIDTH; x++) {
                        let leftIdx = x - radius - 1;
                        if (leftIdx >= 0) {
                            sum -= this._pixelData[y * WIDTH + leftIdx];
                            count--;
                        }
                        let rightIdx = x + radius;
                        if (rightIdx < WIDTH) {
                            sum += this._pixelData[y * WIDTH + rightIdx];
                            count++;
                        }
                        tmp[y * WIDTH + x] = sum / count;
                    }
                }
                // Vertical pass
                for (let x = 0; x < WIDTH; x++) {
                    let sum = 0, count = 0;
                    for (let dy = -radius; dy <= radius; dy++) {
                        if (dy >= 0 && dy < HEIGHT) {
                            sum += tmp[dy * WIDTH + x];
                            count++;
                        }
                    }
                    this._pixelData[x] = sum / count;
                    
                    for (let y = 1; y < HEIGHT; y++) {
                        let topIdx = y - radius - 1;
                        if (topIdx >= 0) {
                            sum -= tmp[topIdx * WIDTH + x];
                            count--;
                        }
                        let bottomIdx = y + radius;
                        if (bottomIdx < HEIGHT) {
                            sum += tmp[bottomIdx * WIDTH + x];
                            count++;
                        }
                        this._pixelData[y * WIDTH + x] = sum / count;
                    }
                }
            }
        }

        this._needsUpload = true;
        this._status = "Loaded";
        this._statusColor = "#6f6";
        this.setDirtyCanvas(true);
        // Trigger graph execution so onExecute() picks up the new data
        if (this.graph) {
            this.graph.runStep();
        }
    }

    onExecute() {
        if (this._needsUpload && this._pixelData) {
            this.updateInputTexture(0, this._pixelData);

            // Simple pass-through shader to store result in this.outputTexture
            this.runShader(
                "image_source_copy",
                `#version 300 es
                precision highp float;
                in vec2 vUv;
                out vec4 fragColor;
                uniform sampler2D tex0;
                void main() {
                    fragColor = texture(tex0, vUv);
                }`,
                1,
                {},
                this.framebuffer,
                [this._inputTextures[0]]
            );

            this._needsUpload = false;
        }

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/Image", ImageNode);