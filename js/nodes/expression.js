class Formula1Node extends GPUNodeBase {
    constructor(){
        super();
        this.properties = { formula: "a*a" };
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        initUnaryOp(this, "Formula1")
    }
    onExecute(){
        const formula = this.properties.formula;

        this.updateInputTexture(0, this.getInputData(0));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;

        void main(){
            float x = vUv.x;
            float y = vUv.y;
            float a = texture(tex0, vUv).r;

            float val = ${formula};

            fragColor = vec4(vec3(val), 1.0);
        }`;

        this.runShader(
            "formula1_" + formula,
            frag,
            1
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Expression/Formula1`, Formula1Node);

class Formula2Node extends GPUNodeBase {
    constructor(){
        super();
        this.properties = { formula: "a+b" };
        this.addWidget("text", "Formula", this.properties.formula, { property: "formula" });
        initBinaryOp(this, "Formula2")
    }
    onExecute(){
        const formula = this.properties.formula;

        this.updateInputTexture(0, this.getInputData(0));
        this.updateInputTexture(1, this.getInputData(1));

        const frag = `#version 300 es
        precision highp float;

        in vec2 vUv;
        out vec4 fragColor;

        uniform sampler2D tex0;
        uniform sampler2D tex1;

        void main(){
            float x = vUv.x;
            float y = vUv.y;

            float a = texture(tex0, vUv).r;
            float b = texture(tex1, vUv).r;

            float val = ${formula};

            fragColor = vec4(vec3(val), 1.0);
        }`;

        this.runShader(
            "formula2_" + formula,
            frag,
            2
        );

        this.setOutputTexture();
        this.drawPreviewTexture();
    }
}
LiteGraph.registerNodeType(`Expression/Formula2`, Formula2Node);