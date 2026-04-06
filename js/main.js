// --- Canvas setup ---
const noiseCanvas = document.getElementById("noiseCanvas");
const ctx = noiseCanvas.getContext("2d");
let WIDTH = 1024;
let HEIGHT = 1024;

let maximized = false;
noiseCanvas.onclick = () => {
    if (maximized)
    {
        noiseCanvas.style.width = "256px";
        noiseCanvas.style.height = "256px";
    }
    else
    {
        noiseCanvas.style.width = "calc(100vh - 70px)";
        noiseCanvas.style.height = "calc(100vh - 70px)";
    }

    maximized = !maximized;
}

noiseCanvas.scale = 4;

const PREVIEW_W = 128;
const PREVIEW_H = 128;
const PREVIEW_PADDING = 10;

GPU.init(WIDTH, HEIGHT);

// --- Dynamic resolution change ---
function setResolution(n) {
    n = parseInt(n);
    if (n === WIDTH && n === HEIGHT) return;
    WIDTH = n;
    HEIGHT = n;

    // Resize GPU canvas & clear shader cache
    GPU.resize(n, n);

    // Update the main preview canvas
    noiseCanvas.width = n;
    noiseCanvas.height = n;

    // Rebuild textures for every GPU node & resize preview canvases
    if (graph && graph._nodes) {
        graph._nodes.forEach(node => {
            if (node.rebuildTextures) node.rebuildTextures();
            if (node.previewCanvas) {
                node.previewCanvas.width = n;
                node.previewCanvas.height = n;
            }
        });
    }

    // Re-execute & render
    if (typeof activeNode !== "undefined" && activeNode) {
        renderNode(activeNode);
    }
}


// --- Node evaluation ---
let activeNode = null;

const terrainModeCheck = document.getElementById("terrain-mode")
terrainModeCheck.checked = localStorage.getItem("noiseLabTerrainMode") == "true";

terrainModeCheck.onchange = () => { 

    localStorage.setItem("noiseLabTerrainMode", terrainModeCheck.checked);
    renderNode(graph.activeNode);
    graphCanvas.draw(true)
}

// --- Graph setup ---
const graphCanvasEl = document.getElementById("graph");
const graph = new LGraph();
const graphCanvas = new LGraphCanvas(graphCanvasEl, graph);
graph.start();

// --- Responsive resizing ---
function resizeGraph() {
    const rect = graphCanvasEl.parentElement.getBoundingClientRect();
    graphCanvasEl.width = rect.width;
    graphCanvasEl.height = rect.height;
    graphCanvas.resize();
}
window.addEventListener("resize", resizeGraph);
resizeGraph();


// --- Click node to preview full canvas ---
function renderNode(node, select = true){
    
    // execute all nodes
    graph._nodes_in_order.forEach(n => { if (n.onExecute) n.onExecute() });

    // render clicked node output
    const output = node?.getOutputData(0);
    if(output && select)
    {
        if (node.gl)
            node.drawPreviewTexture(ctx);
        else
            renderNoise(output);
    }
}

graphCanvas.onNodeSelected = node=>{
    activeNode=node;
    renderNode(activeNode);
};

initGraphManager(graphCanvasEl)

// Welcome modal
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("welcomeModal");
  const closeBtn = document.getElementById("closeWelcomeBtn");

  // Show modal only if user hasn't visited before
  if (!localStorage.getItem("noiseLabVisited")) {
    modal.classList.add("show");
  }

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    localStorage.setItem("noiseLabVisited", "true");
  });
});

// --- Server Generation Client Logic ---

// Initialize 3D terrain preview
let terrainPreview = null;
try {
    terrainPreview = new TerrainPreview("terrain-3d-container");
} catch(e) {
    console.warn("Three.js terrain preview failed to init:", e);
}

// Toggle output panel (entire sidebar)
document.getElementById("toggleOutputPanel").addEventListener("change", (e) => {
    const panel = document.getElementById("output-panel");
    if (e.target.checked) {
        panel.classList.remove("collapsed");
    } else {
        panel.classList.add("collapsed");
    }
    setTimeout(resizeGraph, 350);
});

// Fullscreen
document.getElementById("terrain3dFullscreen").addEventListener("click", () => {
    if (terrainPreview) terrainPreview.fullscreen();
});

// Export OBJ
document.getElementById("terrain3dExportOBJ").addEventListener("click", () => {
    if (terrainPreview) terrainPreview.exportOBJ();
});

// Map download buttons
document.querySelectorAll(".map-download-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const mapType = btn.dataset.map;
        let canvasId;
        if (mapType === "heightmap") canvasId = "mapHeightmap";
        else if (mapType === "normal") canvasId = "mapNormalMap";
        else canvasId = "mapSplatMap";

        const canvas = document.getElementById(canvasId);
        const link = document.createElement("a");
        link.download = mapType + "_map.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
});

// Helper: draw a base64 PNG string onto a canvas element
function drawPngB64OnCanvas(canvasId, b64Png) {
    const canvas = document.getElementById(canvasId);
    const ctx2 = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx2.drawImage(img, 0, 0);
    };
    img.src = "data:image/png;base64," + b64Png;
}

// Helper: render float32 array as greyscale into a canvas
function drawHeightmapOnCanvas(canvasId, floatArray, w, h) {
    const canvas = document.getElementById(canvasId);
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext("2d");
    const imgData = new ImageData(w, h);
    for (let i = 0; i < floatArray.length; i++) {
        const v = Math.max(0, Math.min(1, floatArray[i]));
        const val = Math.round(v * 255);
        imgData.data[i * 4 + 0] = val;
        imgData.data[i * 4 + 1] = val;
        imgData.data[i * 4 + 2] = val;
        imgData.data[i * 4 + 3] = 255;
    }
    ctx2.putImageData(imgData, 0, 0);
}

function renderServerOutput(floatArray, width, height) {
    const canvas = document.getElementById("noiseCanvas");
    const ctxNoise = canvas.getContext("2d");
    
    const imgData = new ImageData(width, height);
    const isTerrainMode = document.getElementById("terrain-mode").checked;

    for (let i = 0; i < floatArray.length; i++) {
        let v = Math.max(0, Math.min(1, floatArray[i]));
        if (isTerrainMode) {
            let c = terrainColorJS(v);
            imgData.data[i * 4 + 0] = c[0];
            imgData.data[i * 4 + 1] = c[1];
            imgData.data[i * 4 + 2] = c[2];
            imgData.data[i * 4 + 3] = 255;
        } else {
            let val = Math.round(v * 255);
            imgData.data[i * 4 + 0] = val;
            imgData.data[i * 4 + 1] = val;
            imgData.data[i * 4 + 2] = val;
            imgData.data[i * 4 + 3] = 255;
        }
    }

    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    tmpCanvas.getContext("2d").putImageData(imgData, 0, 0);

    ctxNoise.clearRect(0, 0, canvas.width, canvas.height);
    ctxNoise.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
}

function terrainColorJS(h) {
    const mix = (a, b, t) => [
        a[0] * (1 - t) + b[0] * t,
        a[1] * (1 - t) + b[1] * t,
        a[2] * (1 - t) + b[2] * t,
    ];
    if (h < 0.1) return mix([0, 0, 200], [0, 100, 255], h / 0.1);
    if (h < 0.2) return mix([0, 100, 255], [238, 214, 175], (h - 0.1) / 0.1);
    if (h < 0.4) return mix([238, 214, 175], [34, 139, 34], (h - 0.2) / 0.2);
    if (h < 0.6) return mix([34, 139, 34], [0, 100, 0], (h - 0.4) / 0.2);
    if (h < 0.8) return mix([0, 100, 0], [139, 69, 19], (h - 0.6) / 0.2);
    return mix([139, 69, 19], [255, 255, 255], Math.min((h - 0.8) / 0.2, 1));
}

// --- Parameter Tooltips ---
const tooltipDiv = document.createElement('div');
tooltipDiv.style.position = 'fixed';
tooltipDiv.style.background = 'rgba(0, 0, 0, 0.85)';
tooltipDiv.style.color = '#fff';
tooltipDiv.style.padding = '8px 12px';
tooltipDiv.style.borderRadius = '5px';
tooltipDiv.style.pointerEvents = 'none';
tooltipDiv.style.fontSize = '12px';
tooltipDiv.style.maxWidth = '250px';
tooltipDiv.style.display = 'none';
tooltipDiv.style.zIndex = '99999';
tooltipDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
document.body.appendChild(tooltipDiv);

const widgetTooltips = {
    "Amplitude": "Controls the maximum height (or intensity contrast) of the noise peaks and valleys, making the terrain appear either flat or deeply contrasted.",
    "Angle": "Rotates the underlying pattern to change the base orientation of the generated features.",
    "Angle Spread": "Determines the angular variance or scatter of geometric features, creating more chaotic or spread out formations.",
    "Bevel (px)": "The pixel width of the slope applied to the edges of generated blocks or bricks, giving them a 3D rounded or chiselled appearance.",
    "Bricks X": "The number of brick columns that fit horizontally across the generated pattern.",
    "Bricks Y": "The number of brick rows that fit vertically across the generated pattern.",
    "Contrast": "Enhances the difference between high and low values, pushing grays towards stark black and white.",
    "Decay": "Controls how quickly a generated feature (like ripples or falloffs) fades out as it moves away from its source.",
    "Falloff": "Adjusts the sharpness of the transition from the center of a feature to its edges.",
    "Fit Mode": "Determines how an external image maps onto the terrain canvas, either stretching, tiling, or clipping.",
    "Formula": "A custom mathematical expression used to shape or combine noise values directly.",
    "Frequency": "Determines how 'zoomed in' or 'zoomed out' the noise appears, with higher values creating smaller, more densely packed terrain features.",
    "Harmonics": "The number of layered frequency bands to combine, similar to octaves but often used for wave-based or localized functions.",
    "Height Mode": "Selects which image channel or property (like luminance or a specific color channel) drives the actual terrain elevation.",
    "Invert": "Flips the generator output so that previously high areas become valleys, and low areas become peaks.",
    "Mortar (px)": "The pixel thickness of the gaps between bricks or tiles.",
    "Octaves": "Controls the level of detail by layering multiple sub-layers of noise on top of each other to create rougher, more complex textures.",
    "Offset": "Physically shifts or pans the entire generated noise pattern across the canvas without changing its underlying shape.",
    "Phase": "Shifts the starting point of the wave or cyclic algorithm, offsetting the repeating pattern.",
    "Points": "The number of distinct, scattered control points used by cell-based nodes like Voronoi or Worley noise.",
    "Radius": "The size or extent of circular features or localized geometric shapes.",
    "Scale": "Multiplies the overall dimensions or spacing of the generated pattern to make it globally larger or smaller.",
    "Seed": "Provides a specific starting number for the random number generator, ensuring that the exact same random layout can be predictably recreated at any time.",
    "Smooth": "Applies a blur or softening filter that rounds out harsh edges and high-frequency noise.",
    "Softness": "Blends the edges of hard shapes seamlessly into their surroundings.",
    "Sources": "The number of origin emitters or wave epicenters.",
    "Spacing": "The distance padding kept between discrete generated shapes or points to prevent overlapping.",
    "Squares": "The grid density used when creating checkered or blocky outputs.",
    "Stagger": "Offsets alternating rows of patterns (like bricks) horizontally to create a traditional interlocking layout.",
    "Stretch": "Warps the generated pattern by pulling it along a specific axis.",
    "Thickness": "Defines the width of generated lines, borders, or cell walls in the texture.",
    "Type": "Changes the underlying formula variant used to calculate the noise or shape.",
    "Vertical": "A toggle or value to align features strictly along the Y-axis.",
    "Width": "The horizontal span of specific rectangular features.",
    "X": "The horizontal coordinate position of the feature's center.",
    "Y": "The vertical coordinate position of the feature's center."
};

graphCanvasEl.addEventListener('mousemove', function(e) {
    if (!graphCanvas) return;
    
    // Check if mouse is traversing any active node using litegraph's internal tracker
    let node = graphCanvas.node_over;
    if (!node || !node.widgets) {
        tooltipDiv.style.display = 'none';
        return;
    }

    // Native LiteGraph coordinates reliably account for pan/zoom
    const localX = graphCanvas.graph_mouse[0] - node.pos[0];
    const localY = graphCanvas.graph_mouse[1] - node.pos[1];
    
    let foundTooltip = false;

    // Check hit box for widgets inside this node
    for (let i = 0; i < node.widgets.length; i++) {
        let w = node.widgets[i];
        if (w.last_y !== undefined) {
            let widget_height = w.computeSize ? w.computeSize(node.size[0])[1] : 20; // 20 is LiteGraph.NODE_WIDGET_HEIGHT
            
            // Console log tracking to locate bounding box failures
            // console.log("Checking widget: " + w.name + ", localX: " + localX + ", localY: " + localY + ", last_y: " + w.last_y + ", hit: " + (localX > 6 && localX < node.size[0] - 12 && localY > w.last_y && localY < w.last_y + widget_height));

            // Hitbox boundary matching LiteGraph's internal widget checking
            if (localX > 6 && localX < node.size[0] - 12 && localY > w.last_y && localY < w.last_y + widget_height) {
                if (widgetTooltips[w.name]) {
                    tooltipDiv.innerHTML = "<strong>" + w.name + "</strong><br>" + widgetTooltips[w.name];
                    tooltipDiv.style.display = 'block';
                    // Position tooltip near the cursor
                    tooltipDiv.style.left = (e.clientX + 15) + 'px';
                    tooltipDiv.style.top = (e.clientY + 15) + 'px';
                    foundTooltip = true;
                    break;
                }
            }
        }
    }
    
    if (!foundTooltip) {
        tooltipDiv.style.display = 'none';
    }
});
