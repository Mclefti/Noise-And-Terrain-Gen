let currentGraphId = null;
let isLoadingGraph = false;
let saveInternal;

const GRAPH_STORAGE_KEY = "noiselab_graphs";
const LAST_GRAPH_STORAGE_KEY = "noiselab_lastgraph";

// Has graphs
function hasGraphs()
{
    return localStorage.getItem(GRAPH_STORAGE_KEY) != undefined;
}

// Load graphs from local storage
function loadAllGraphs()
{
    const stored = localStorage.getItem(GRAPH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

// Save all graphs back
function saveAllGraphs(graphs)
{
    localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(graphs));
}

function exportGraph(graph, name)
{
    if(!graph) return;

    const dataStr = JSON.stringify(graph,null,2);
    const blob = new Blob([dataStr], {type:"application/json"});

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name+".noiselab";

    a.click();
}

function importGraphFromJSON(json, name, idLabel, display = false)
{
    const graphs = loadAllGraphs();
    const id = "example_" + idLabel;
    graphs[id] = {name, data: json, pinned:false};
    saveAllGraphs(graphs);
    
    if (display)
    {
        renderGraphList();
        loadGraphById(id);
    }
}

function importGraph(file)
{
    if(!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
        try{
            const data = JSON.parse(evt.target.result);
            const name = `${file.name}`;
            const graphs = loadAllGraphs();
            const id = "graph_" + Date.now();
            graphs[id] = {name, data, pinned:false};
            saveAllGraphs(graphs);
            renderGraphList();
            loadGraphById(id);
        }catch(err){
            alert("Failed to import: "+err.message);
        }
    };
    reader.readAsText(file);
}

function createNewGraph() {
    const graphs = loadAllGraphs();
    const name = `Untitled (${graphs ? Object.entries(graphs).length : 0})`;
    const id = "graph_" + Date.now();
    graphs[id] = { name: name, data: {}, pinned: false };
    saveAllGraphs(graphs);
    renderGraphList();
    document.getElementById("currentGraphName").innerText = graphs[id].name;
    return id;
}


function loadGraphById(id)
{
    clearTimeout(saveInternal);

    const graphs = loadAllGraphs();
    const g = graphs[id];
    if(!g) return false;

    currentGraphId = id;
    document.getElementById("currentGraphName").innerText = g.name;
    graph.clear();
    isLoadingGraph = true;
    graph.configure(g.data || {});
    isLoadingGraph = false;
    renderNode(graph._nodes_in_order[0]);
    renderGraphList();
    localStorage.setItem(LAST_GRAPH_STORAGE_KEY, id);

    return true;
}

// Auto-save on changes
function autoSaveGraph()
{
    // Prevent instant saving, which can cause slowdowns in large graphs
    clearTimeout(saveInternal)
    saveInternal = setTimeout(() => {
        if (isLoadingGraph) return;
        if(!currentGraphId)
        {
            // Editing a graph that does not exist. Register it as one
            const id = createNewGraph();
            currentGraphId = id;
        }

        const graphs = loadAllGraphs();
        graphs[currentGraphId].data = graph.serialize();

        saveAllGraphs(graphs);
    }, 100)
    
}

// Render sidebar lists
function renderGraphList() {
    const graphs = loadAllGraphs();
    const yourList = document.getElementById("yourGraphsList");
    yourList.innerHTML = "";

    // Sort: pinned first, then newest/other
    const entries = Object.entries(graphs)
        .sort(([idA, a],[idB,b]) => b.pinned - a.pinned); 

    entries.forEach(([id, g]) => {
        const li = document.createElement("li");
        li.dataset.id = id;
        if (id == currentGraphId)
            li.classList.add("selected")
        li.title = g.name;
        li.innerHTML = `<div class="graph-title"">${g.pinned ? '<i class="fas fa-thumbtack pinned-icon"></i>':''}${g.name}</div>
            <div class="graph-actions">
                <button class="exportGraphBtn" title="Export"><i class="fas fa-file-export"></i></button>
                <button class="pinGraphBtn" title="Pin/Unpin"><i class="fas fa-thumbtack"></i></button>
                <button class="deleteGraphBtn" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        li.addEventListener("click", e => {
            if(e.target.closest(".graph-actions")) return; // clicking actions should not load
            loadGraphById(id);
        });

        li.querySelector('.exportGraphBtn').onclick = () => {
            const id = li.dataset.id;
            const graphs = loadAllGraphs();
            exportGraph(graphs[id].data, graphs[id].name);
        }
        li.querySelector('.pinGraphBtn').onclick = () => {
            const id = li.dataset.id;
            const graphs = loadAllGraphs();
            graphs[id].pinned = !graphs[id].pinned;
            saveAllGraphs(graphs);
            renderGraphList();
        }
        li.querySelector('.deleteGraphBtn').onclick = () => {
            const id = li.dataset.id;
            if(!confirm("Delete this graph?")) return;

            const graphs = loadAllGraphs();
            delete graphs[id];
            saveAllGraphs(graphs);
            renderGraphList();
            if(currentGraphId === id)
            {
                graph.clear();
                document.getElementById("currentGraphName").innerText = "Untitled";
                currentGraphId = null;
            }
        }

        yourList.appendChild(li);
    });
}

async function initGraphManager(graphCanvasEl)
{
    // Create new graph
    document.getElementById("createGraphBtn").addEventListener("click", () => {
        const id = createNewGraph();
        loadGraphById(id);
    });

    // Rename current graph
    document.getElementById("currentGraphName").addEventListener("blur", (e)=>{
        if(!currentGraphId) return;
        const graphs = loadAllGraphs();
        graphs[currentGraphId].name = e.target.innerText.trim() || "Untitled";
        saveAllGraphs(graphs);
        renderGraphList();
    });

    // Export current graph
    document.getElementById("exportBtn").addEventListener("click", ()=>{
        if(!currentGraphId) return;
        const graphs = loadAllGraphs();
        exportGraph(graphs[currentGraphId].data, graphs[currentGraphId].name);
    });

    // Import graph
    document.getElementById("importBtn").addEventListener("click", ()=>{
        document.getElementById("fileInput").click();
    });

    document.getElementById("fileInput").addEventListener("change",(e)=>{
        const file = e.target.files[0];
        importGraph(file);
    });

    // Auto-save on graph changes (LiteGraph)
    graph.onNodeAdded = (node) => { renderNode(node, false); autoSaveGraph(); };
    graph.onNodeRemoved = autoSaveGraph;
    graph.onNodeConnectionChange = autoSaveGraph;
    graphCanvas.onNodeMoved = autoSaveGraph;

    // Drag & drop import
    graphCanvasEl.addEventListener("dragover", e=>{
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    });

    graphCanvasEl.addEventListener("drop", e=>{
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        importGraph(file);
    });

    // Filter/search
    document.getElementById("graphSearch").addEventListener("input", (e)=>{
        const filter = e.target.value.toLowerCase();
        document.querySelectorAll("#yourGraphsList li").forEach(li=>{
            li.style.display = li.innerText.toLowerCase().includes(filter) ? "" : "none";
        });
    });

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    await sleep(0)

    if (!hasGraphs())
    {
        // Load example graphs
        importGraphFromJSON(exampleIsland, "Island", "island");
        importGraphFromJSON(examplePixelRock, "Pixel Art Rocks", "pixelArtRocks");
        importGraphFromJSON(exampleWoodPlank, "Wood Planks", "wookPlanks");
        importGraphFromJSON(exampleEye, "Eye", "eye");
        importGraphFromJSON(usingCovariantCurvature, "Covariant Curvature", "covariant_curvature", true);
    }
    else
    {
        const lastId = localStorage.getItem(LAST_GRAPH_STORAGE_KEY);
        if (lastId)
        {
            if (!loadGraphById(lastId))
                renderGraphList();
        }
        else
            renderGraphList();

        // Migration: Force import of new Covariant Curvature example if missing
        const graphs = loadAllGraphs();
        if (!graphs["example_covariant_curvature"]) {
            importGraphFromJSON(usingCovariantCurvature, "Covariant Curvature", "covariant_curvature");
            renderGraphList();
        }
    }
    
}