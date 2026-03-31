// --- Binary Function Nodes ---
function initBinaryOp(node, name)
{
    node.addInput("A","array");
    node.addInput("B","array");
    node.addOutput("out","array");
    node.title = name;
    node.size[1] += PREVIEW_H + PREVIEW_PADDING;
}

function executeBinaryOp(node, op, key=node.title, uniformValues = {}, uniformDeclarations = []) {
    node.updateInputTexture(0, node.getInputData(0));
    node.updateInputTexture(1, node.getInputData(1));

    const uniformsCode = uniformDeclarations.join("\n");

    const fs = `#version 300 es
    precision highp float;
    ${uniformsCode}
    uniform sampler2D tex0;
    uniform sampler2D tex1;
    in vec2 vUv;
    out vec4 fragColor;
    void main(){
        float a = texture(tex0, vUv).r;
        float b = texture(tex1, vUv).r;
        fragColor = vec4(${op}, 0.0, 0.0, 1.0);
    }`;

    node.runShader(key, fs, 2, uniformValues);
    node.setOutputTexture();
    node.drawPreviewTexture();
}

class AddNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Add")
    }
    onExecute(){
        executeBinaryOp(this, 'a+b')
    }
}
LiteGraph.registerNodeType(`Math/Add`, AddNode);

class MultiplyNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Multiply")
    }
    onExecute(){
        executeBinaryOp(this, 'a*b')
    }
}
LiteGraph.registerNodeType(`Math/Multiply`, MultiplyNode);

class SubtractNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Subtract")
    }
    onExecute(){
        executeBinaryOp(this, 'a-b')
    }
}
LiteGraph.registerNodeType(`Math/Subtract`, SubtractNode);

class MaxNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Max")
    }
    onExecute(){
        executeBinaryOp(this, 'max(a,b)')
    }
}
LiteGraph.registerNodeType(`Math/Max`, MaxNode);

class MinNode extends GPUNodeBase {
    constructor(){
        super();
        initBinaryOp(this, "Min")
    }
    onExecute(){
        executeBinaryOp(this, 'min(a,b)')
    }
}
LiteGraph.registerNodeType(`Math/Min`, MinNode);

// --- Unary Function Nodes ---
function initUnaryOp(node, name)
{
    node.addInput("A","array");
    node.addOutput("out","array");
    node.title = name;
    node.size[1] += PREVIEW_H + PREVIEW_PADDING;
}

function executeUnaryOp(node, op, key=node.title, uniformValues = {}, uniformDeclarations = []) {
    node.updateInputTexture(0, node.getInputData(0));

    const uniformsCode = uniformDeclarations.join("\n");

    const fs = `#version 300 es
    precision highp float;
    ${uniformsCode}
    uniform sampler2D tex0;
    in vec2 vUv;
    out vec4 fragColor;
    void main(){
        float a = texture(tex0, vUv).r;
        fragColor = vec4(${op}, 0.0, 0.0, 1.0);
    }`;

    node.runShader(key, fs, 1, uniformValues);
    node.setOutputTexture();
    node.drawPreviewTexture();
}

class AbsNode extends GPUNodeBase {
    constructor(){
        super();
        initUnaryOp(this, "Abs")
    }
    onExecute(){
        executeUnaryOp(this, 'abs(a)')
    }
}
LiteGraph.registerNodeType(`Math/Abs`, AbsNode);

class ScaleNode extends GPUNodeBase {
    constructor(){
        super();
        this.addInput("value","array");
        this.addOutput("out","array");
        this.properties = { amount : 2 };
        this.addWidget("slider","Amount", this.properties.amount,{min:-10,max: 10, property:"amount"});
        this.title="Scale";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }
    
    onExecute(){
        executeUnaryOp(
            this,
            'a*amount',
            'scale_uniform',
            { amount: this.properties.amount },
            ['uniform float amount;']
        );
    }
}
LiteGraph.registerNodeType("Math/Scale",ScaleNode);

class ClampNode extends GPUNodeBase {
    constructor(){
        super();
        this.addInput("value","array");
        this.addOutput("out","array");
        this.properties={min:-1, max:1};
        this.addWidget("slider","Min", this.properties.min,{min:-5,max: 5, property:"min"});
        this.addWidget("slider","Max", this.properties.max,{min:-5,max: 5, property:"max"});
        this.title="Clamp";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }
    
    onExecute(){
        executeBinaryOp(
            this,
            'clamp(a, minValue, maxValue)',
            'clamp_uniforms',
            { minValue: this.properties.min, maxValue: this.properties.max },
            ['uniform float minValue;', 'uniform float maxValue;']
        );
    }
}
LiteGraph.registerNodeType("Math/Clamp",ClampNode);

class SaturateNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Saturate";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        executeUnaryOp(this, `clamp(a, 0.0, 1.0)`);
    }
}

LiteGraph.registerNodeType("Math/Saturate", SaturateNode);

class NormalizeNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Normalize";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    // --- Reduction pass (min OR max) ---
    runReductionPass(step, mode) {
        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float step;
        uniform int uMode; // 0=min, 1=max

        void main() {
            vec2 texel = 1.0 / vec2(textureSize(tex0,0));

            float v0 = texture(tex0, vUv).r;
            float v1 = texture(tex0, vUv + texel * vec2(step, 0.0)).r;
            float v2 = texture(tex0, vUv + texel * vec2(0.0, step)).r;
            float v3 = texture(tex0, vUv + texel * vec2(step, step)).r;

            float result;

            if (uMode == 0) {
                result = min(min(v0, v1), min(v2, v3));
            } else {
                result = max(max(v0, v1), max(v2, v3));
            }

            fragColor = vec4(result, 0.0, 0.0, 1.0);
        }`;

        this.runShader(
            "reduce_" + mode,
            frag,
            1,
            {
                step,
                uMode: { type: "int", value: mode === "min" ? 0 : 1 }
            },
            this.pingWrite(),
            [this.pingRead()]
        );

        this.swapPing();
    }

    computeExtreme(mode) {
        // copy input
        this.runShader(
            "copy_reduce_" + mode,
            `#version 300 es
            precision highp float;
            in vec2 vUv;
            out vec4 fragColor;
            uniform sampler2D tex0;
            void main() {
                float v = texture(tex0, vUv).r;
                fragColor = vec4(v,0,0,1);
            }`,
            1,
            {},
            this._pingFramebuffers[0],
            [this._inputTextures[0]]
        );

        this._pingCurrent = 0;

        let step = 1.0;

        // log2(512)=9 should be safe upper bound, might need increase for larger textures
        for (let i = 0; i < 9; i++) {
            this.runReductionPass(step, mode);
            step *= 2.0;
        }

        // read 1 pixel
        const gl = this.gl;
        const fbo = gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.pingRead(), 0);

        const px = new Float32Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, px);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(fbo);

        return px[0];
    }

    onExecute() {
        this.updateInputTexture(0, this.getInputData(0));

        const min = this.computeExtreme("min");
        const max = this.computeExtreme("max");

        const range = (max - min) || 1.0;

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform float uMin;
        uniform float uRange;

        void main() {
            float v = texture(tex0, vUv).r;
            float n = (v - uMin) / uRange;
            fragColor = vec4(n,0,0,1);
        }`;

        this.runShader(
            "normalize_final",
            frag,
            1,
            {
                uMin: min,
                uRange: range
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Math/Normalize", NormalizeNode);

class InvertNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("input","array");
        this.addOutput("out","array");
        this.title = "Invert";
        this.size[1] += PREVIEW_H + PREVIEW_PADDING;
    }

    onExecute() {
        executeUnaryOp(this, `1.0 - a`);
    }
}

LiteGraph.registerNodeType("Math/Invert", InvertNode);