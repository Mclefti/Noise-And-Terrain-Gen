LiteGraph.clearRegisteredTypes()

// --- Base node with preview canvas ---
class NoiseNode extends LGraphNode {
    constructor() {
        super();
        this.previewCanvas = document.createElement("canvas");
        this.previewCanvas.width = WIDTH;
        this.previewCanvas.height = HEIGHT;
        this.previewCtx = this.previewCanvas.getContext("2d");
    }

    onConnectionsChange()
    {
        if (isLoadingGraph) return;

        this.onExecute();
        if (this.drawPreviewTexture) this.drawPreviewTexture();
    }

    onPropertyChanged()
    { 
        if (isLoadingGraph) return;

        this.onExecute();
        if (this.drawPreviewTexture) this.drawPreviewTexture();
        renderNode(this)

        // Needed to save changes of props
        autoSaveGraph();
    }

    onDrawBackground(ctx) {
        if (this.flags.collapsed)
            return;

        const h = this.size[1];
        const w = this.size[0];
        
        if (this.previewCanvas) {
            ctx.drawImage(this.previewCanvas, 
            0, 0, this.previewCanvas.width, this.previewCanvas.height, 
            (w - PREVIEW_W) * 0.5, h - PREVIEW_H - PREVIEW_PADDING * 0.5, PREVIEW_W, PREVIEW_H);
        }
    }
}