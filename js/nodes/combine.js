class MaskBlendNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("A","array");
        this.addInput("B","array");
        this.addInput("Mask","array");
        this.addOutput("out","array");
        this.properties = {};
        this.title="Mask Blend";
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
        uniform sampler2D tex2; // Mask

        void main() {
            float A = texture(tex0, vUv).r;
            float B = texture(tex1, vUv).r;
            float M = texture(tex2, vUv).r;

            float v = mix(B, A, M); // same as mask*A + (1-mask)*B

            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "maskBlendGPU",
            frag,
            3
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Combine/Mask Blend",MaskBlendNode);

class MixNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("A", "array");
        this.addInput("B", "array");
        this.addOutput("out", "array");
        this.properties = { t: 0.5 };
        this.addWidget("slider", "Factor", this.properties.t, { min: 0, max: 1, property: "t" });
        this.title = "Mix / Lerp";
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
        uniform float t;

        void main() {
            float A = texture(tex0, vUv).r;
            float B = texture(tex1, vUv).r;

            float v = mix(A, B, t);

            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader(
            "mixGPU",
            frag,
            2,
            {
                t: this.properties.t
            }
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Combine/Mix", MixNode);

class ContextualScaleNode extends GPUNodeBase {
    constructor() {
        super();
        this.addInput("Base (P)", "array");
        this.addInput("Wave (ψ)", "array");
        this.addOutput("out", "array");
        this.properties = {};
        this.title = "Contextual Scale";
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

        void main() {
            float P = texture(tex0, vUv).r;
            float W = texture(tex1, vUv).r;

            // Hfinal = P + (P * ψ)
            float v = P + (P * W);

            fragColor = vec4(vec3(v), 1.0);
        }`;

        this.runShader("contextualScaleGPU", frag, 2);

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}

LiteGraph.registerNodeType("Combine/Contextual Scale", ContextualScaleNode);