class WarpNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addInput("warp", "array");
        this.addOutput("out", "array");
        this.properties = { intensity: 5 };
        this.addWidget("slider", "Intensity", this.properties.intensity, { min: 0, max: 50, property: "intensity" });
        this.title = "Warp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform sampler2D tex1; // warp map
        uniform float intensity;

        void main() {
            float w = texture(tex1, vUv).r;
            vec2 uv = vUv + intensity / float(${WIDTH}) * vec2(w, w);
            uv = clamp(uv, vec2(0.0), vec2(1.0));
            float v = texture(tex0, uv).r;
            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader("warpGPU", frag, 2, { intensity: this.properties.intensity });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Transform/Warp", WarpNode);

class RotateNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { angle: 0 };
        this.addWidget("slider", "Angle", this.properties.angle, { min: 0, max: 360, property: "angle" });
        this.title = "Rotate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float angle;

        void main() {
            vec2 uv = vUv - 0.5;
            float c = cos(-angle);
            float s = sin(-angle);
            uv = mat2(c, -s, s, c) * uv;
            uv += 0.5;
            uv = clamp(uv, vec2(0.0), vec2(1.0));
            float v = texture(tex0, uv).r;
            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader("rotateGPU", frag, 1, { angle: this.properties.angle * 3.141592 / 180 });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Transform/Rotate", RotateNode);

class OffsetNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { offsetX: 0, offsetY: 0 }; // normalized offsets
        this.addWidget("slider", "Offset X", this.properties.offsetX, { min: -1, max: 1, property: "offsetX" });
        this.addWidget("slider", "Offset Y", this.properties.offsetY, { min: -1, max: 1, property: "offsetY" });
        this.title = "Offset";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float offsetX;
        uniform float offsetY;

        void main() {
            vec2 uv = vUv + vec2(offsetX, offsetY);
            uv = clamp(uv, vec2(0.0), vec2(1.0));
            float v = texture(tex0, uv).r;
            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader("offsetGPU", frag, 1, { offsetX: this.properties.offsetX, offsetY: this.properties.offsetY });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/Offset", OffsetNode);

class MirrorNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("value", "array");
        this.addOutput("out", "array");
        this.properties = { horizontal: true, vertical: false };
        this.addWidget("toggle", "Horizontal", this.properties.horizontal, { property: "horizontal" });
        this.addWidget("toggle", "Vertical", this.properties.vertical, { property: "vertical" });
        this.title = "Mirror";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform bool horizontal;
        uniform bool vertical;
        void main() {
            vec2 uv = vUv;
            if(horizontal) uv.x = 1.0 - uv.x;
            if(vertical) uv.y = 1.0 - uv.y;
            fragColor = vec4(vec3(texture(tex0, uv).r), 1.0);
        }`;
        this.runShader("mirrorGPU", frag, 1, { horizontal: this.properties.horizontal, vertical: this.properties.vertical });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType("Transform/Mirror", MirrorNode);

class StretchNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { scaleX: 1, scaleY: 1 };
        this.addWidget("slider", "Scale X", this.properties.scaleX, { min: 0.1, max: 5, property: "scaleX" });
        this.addWidget("slider", "Scale Y", this.properties.scaleY, { min: 0.1, max: 5, property: "scaleY" });
        this.title = "Stretch";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform float scaleX;
        uniform float scaleY;
        void main() {
            vec2 uv = vUv - 0.5;
            uv.x /= scaleX;
            uv.y /= scaleY;
            uv += 0.5;
            uv = clamp(uv, vec2(0.0), vec2(1.0));
            fragColor = vec4(vec3(texture(tex0, uv).r), 1.0);
        }`;
        this.runShader("stretchGPU", frag, 1, { scaleX: this.properties.scaleX, scaleY: this.properties.scaleY });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/Stretch", StretchNode);

class CartesianToPolar extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { scale: 1 };
        this.addWidget("slider", "Scale", this.properties.scale, { min: 0.1, max: 5, property: "scale" });
        this.title = "Cartesian to Polar";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform float scale;
        void main() {
            vec2 uv = vUv;
            vec2 center = vec2(0.5);
            vec2 d = uv - center;
            float r = length(d) / 0.5 * scale;
            float a = atan(d.y, d.x);
            vec2 newUV = vec2((a + 3.141592)/6.283185, r);
            newUV = clamp(newUV, vec2(0.0), vec2(1.0));
            fragColor = vec4(vec3(texture(tex0, newUV).r), 1.0);
        }`;
        this.runShader("cartesianToPolarGPU", frag, 1, { scale: this.properties.scale });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/Cartesian to Polar", CartesianToPolar);


class PolarToCartesian extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");
        this.properties = { scale: 1 };
        this.addWidget("slider", "Scale", this.properties.scale, { min: 0.1, max: 5, property: "scale" });
        this.title = "Polar to Cartesian";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform float scale;
        void main() {
            vec2 center = vec2(0.5);
            float angle = vUv.x * 6.283185;
            float radius = vUv.y * scale;
            vec2 uv = center + vec2(cos(angle), sin(angle)) * radius;
            uv = clamp(uv, vec2(0.0), vec2(1.0));
            fragColor = vec4(vec3(texture(tex0, uv).r), 1.0);
        }`;
        this.runShader("polarToCartesianGPU", frag, 1, { scale: this.properties.scale });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/Polar to Cartesian", PolarToCartesian);

class RadialWarpNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addInput("warp", "array"); // optional warp map
        this.addOutput("out", "array");

        this.properties = { angleStrength: 2, radiusStrength: 0 };
        this.addWidget("slider", "Angle Warp", this.properties.angleStrength, { min: -10, max: 10, property: "angleStrength" });
        this.addWidget("slider", "Radius Warp", this.properties.radiusStrength, { min: -2, max: 2, property: "radiusStrength" });

        this.title = "Radial Warp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        uniform float angleStrength;
        uniform float radiusStrength;
        void main() {
            vec2 center = vec2(0.5);
            vec2 d = vUv - center;
            float radius = length(d);
            float angle = atan(d.y, d.x);
            float w = texture(tex1, vUv).r;
            angle += (w - 0.5) * angleStrength;
            radius += (w - 0.5) * radiusStrength;
            vec2 uv = center + vec2(cos(angle), sin(angle)) * radius;
            uv = clamp(uv, vec2(0.0), vec2(1.0));
            fragColor = vec4(vec3(texture(tex0, uv).r), 1.0);
        }`;

        this.runShader("radialWarpGPU", frag, 2, { angleStrength: this.properties.angleStrength, radiusStrength: this.properties.radiusStrength });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/Radial Warp", RadialWarpNode);

class TileNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addOutput("out", "array");

        this.properties = {
            repeatX: 2,
            repeatY: 2,
            seamless: true
        };

        this.addWidget("slider", "Repeat X", this.properties.repeatX, { min: 1, max: 10, step: 1, precision: 0, property: "repeatX" });
        this.addWidget("slider", "Repeat Y", this.properties.repeatY, { min: 1, max: 10, step: 1, precision: 0, property: "repeatY" });
        this.addWidget("toggle", "Seamless", this.properties.seamless, { property: "seamless" });

        this.title = "Tile";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform float repeatX;
        uniform float repeatY;
        uniform bool seamless;
        void main() {
            vec2 uv = vUv * vec2(repeatX, repeatY);
            if(seamless) {
                uv = mod(uv, 2.0);
                uv = vec2(uv.x > 1.0 ? 2.0 - uv.x : uv.x, uv.y > 1.0 ? 2.0 - uv.y : uv.y);
            } else {
                uv = mod(uv, 1.0);
                uv = max(uv, 0.0);
            }
            fragColor = vec4(vec3(texture(tex0, uv).r), 1.0);
        }`;
        this.runShader("tileGPU", frag, 1, { 
            repeatX: Math.round(this.properties.repeatX), 
            repeatY: Math.round(this.properties.repeatY),
            seamless: this.properties.seamless });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/Tile", TileNode);

class TileSamplerNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("pattern", "array");
        this.addOutput("out", "array");

        this.properties = {
            tilesX: 5,
            tilesY: 5,
            scale: 0.8,
            randomPos: 0.3,
            randomScale: 0.2,
            randomRot: 1.0,
            density: 1.0,
            mode: 0,
            seed: 1
        };

        this.addWidget("slider", "Tiles X", this.properties.tilesX, { min: 1, max: 20, step: 1, property: "tilesX" });
        this.addWidget("slider", "Tiles Y", this.properties.tilesY, { min: 1, max: 20, step: 1, property: "tilesY" });
        this.addWidget("slider", "Scale", this.properties.scale, { min: 0.1, max: 2.0, step: 0.01, property: "scale" });
        this.addWidget("slider", "Rnd Pos", this.properties.randomPos, { min: 0.0, max: 1.0, step: 0.01, property: "randomPos" });
        this.addWidget("slider", "Rnd Scale", this.properties.randomScale, { min: 0.0, max: 1.0, step: 0.01, property: "randomScale" });
        this.addWidget("slider", "Rnd Rot", this.properties.randomRot, { min: 0.0, max: 1.0, step: 0.01, property: "randomRot" });
        this.addWidget("slider", "Density", this.properties.density, { min: 0.0, max: 1.0, step: 0.01, property: "density" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });

        this.title = "Tile Sampler";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;

        uniform float tilesX;
        uniform float tilesY;
        uniform float scale;
        uniform float randomPos;
        uniform float randomScale;
        uniform float randomRot;
        uniform float density;
        uniform float seed;

        float hash(vec2 p) {
            return fract(sin(dot(p + seed, vec2(127.1,311.7))) * 43758.5453123);
        }

        mat2 rot(float a){
            float s = sin(a), c = cos(a);
            return mat2(c,-s,s,c);
        }

        void main() {
            vec2 grid = vec2(tilesX, tilesY);
            vec2 cellUV = vUv * grid;
            vec2 baseCell = floor(cellUV);

            int mode = 0; // TODO: Expose as property
            float result = 0.0;

            for(int y = -1; y <= 1; y++) {
                for(int x = -1; x <= 1; x++) {

                    vec2 cell = baseCell + vec2(float(x), float(y));

                    // Density check
                    float keep = hash(cell + 100.0);
                    if(keep > density) continue;

                    float r1 = hash(cell);
                    float r2 = hash(cell + 10.0);
                    float r3 = hash(cell + 20.0);
                    float r4 = hash(cell + 30.0);

                    vec2 jitter = (vec2(r1, r2) - 0.5) * randomPos;
                    float s = scale * mix(1.0, r3, randomScale);
                    float angle = (r4 - 0.5) * 6.28318 * randomRot;

                    vec2 localUV = fract(cellUV) - vec2(float(x), float(y));
                    localUV -= 0.5;
                    localUV -= jitter;

                    localUV = rot(angle) * localUV;
                    localUV /= s;
                    localUV += 0.5;

                    if(localUV.x >= 0.0 && localUV.y >= 0.0 &&
                       localUV.x <= 1.0 && localUV.y <= 1.0) {

                        float v = texture(tex0, localUV).r;

                        if(mode == 0)
                            result = max(result, v);
                        else
                            result += v;
                    }
                }
            }

            if(mode == 1)
                result = clamp(result, 0.0, 1.0);

            fragColor = vec4(vec3(result), 1.0);
        }`;

        this.runShader(
            "tile_sampler",
            frag,
            1,
            this.properties,
            this.framebuffer,
            [this._inputTextures[0]]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/TileSampler", TileSamplerNode);

class PoissonSamplerNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("pattern", "array");
        this.addOutput("out", "array");

        this.properties = {
            scale: 8.0,
            radius: 0.15,
            randomScale: 0.3,
            randomRot: 1.0,
            seed: 1,
        };

        this.addWidget("slider", "Scale", this.properties.scale, { min: 1, max: 20, step: 1, property: "scale" });
        this.addWidget("slider", "Radius", this.properties.radius, { min: 0.01, max: 0.5, step: 0.01, property: "radius" });
        this.addWidget("slider", "Rnd Scale", this.properties.randomScale, { min: 0, max: 1, step: 0.01, property: "randomScale" });
        this.addWidget("slider", "Rnd Rot", this.properties.randomRot, { min: 0, max: 1, step: 0.01, property: "randomRot" });
        this.addWidget("slider", "Seed", this.properties.seed, { min: 1, max: 1000, step: 1, property: "seed" });

        this.title = "Poisson Sampler";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float scale;
        uniform float radius;
        uniform float randomScale;
        uniform float randomRot;
        uniform float seed;

        float hash(vec2 p){
            return fract(sin(dot(p + seed, vec2(127.1,311.7))) * 43758.5453123);
        }

        vec2 hash2(vec2 p){
            return vec2(hash(p), hash(p+1.3));
        }

        mat2 rot(float a){
            float s = sin(a), c = cos(a);
            return mat2(c,-s,s,c);
        }

        void main() {
            vec2 gridUV = vUv * scale;
            vec2 baseCell = floor(gridUV);

            float result = 0.0;

            for(int y=-1;y<=1;y++){
                for(int x=-1;x<=1;x++){

                    vec2 cell = baseCell + vec2(float(x), float(y));

                    vec2 rnd = hash2(cell);
                    vec2 point = cell + rnd;

                    // distance check (Poisson-ish)
                    vec2 diff = gridUV - point;
                    float dist = length(diff);

                    if(dist > radius) continue;

                    float rScale = mix(1.0, hash(cell+5.0), randomScale);
                    float angle = (hash(cell+10.0)-0.5)*6.28318*randomRot;

                    vec2 localUV = diff / radius;
                    localUV = rot(angle) * localUV;
                    localUV /= rScale;
                    localUV = localUV * 0.5 + 0.5;

                    if(localUV.x>=0.0 && localUV.y>=0.0 &&
                       localUV.x<=1.0 && localUV.y<=1.0){

                        float v = texture(tex0, localUV).r;
                        result = max(result, v);
                    }
                }
            }

            fragColor = vec4(vec3(result),1.0);
        }`;

        this.runShader(
            "poisson_sampler",
            frag,
            1,
            this.properties,
            this.framebuffer,
            [this._inputTextures[0]]
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Generator/PoissonSampler", PoissonSamplerNode);


class DisplaceNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input", "array");
        this.addInput("dx", "array");
        this.addInput("dy", "array");
        this.addOutput("out", "array");

        this.properties = { strength: 20 };

        this.addWidget("slider", "Strength", this.properties.strength, { min: 0, max: 100, property: "strength" });

        this.title = "Displace";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));
        this.updateInputTexture(2, this.getInputData(2));

        const frag = `#version 300 es
        precision highp float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        uniform sampler2D tex2;
        uniform float strength;
        void main() {
            float dx = (texture(tex1, vUv).r - 0.5) * strength / float(${WIDTH});
            float dy = (texture(tex2, vUv).r - 0.5) * strength / float(${HEIGHT});
            vec2 uv = clamp(vUv + vec2(dx, dy), vec2(0.0), vec2(1.0));
            fragColor = vec4(vec3(texture(tex0, uv).r), 1.0);
        }`;

        this.runShader("displaceGPU", frag, 3, { strength: this.properties.strength });
        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Transform/Displace", DisplaceNode);