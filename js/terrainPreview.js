/**
 * terrainPreview.js — Three.js 3D terrain preview
 *
 * Creates a displaced plane mesh from a float32 heightmap array.
 * Provides orbit controls for rotate/zoom/pan.
 */

class TerrainPreview {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.mesh = null;
        this.waterMesh = null;
        this.animationId = null;
        this.hasData = false;

        this._init();
    }

    _init() {
        const w = this.container.clientWidth || 380;
        const h = this.container.clientHeight || 280;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1e2e);

        // Camera — near-top-down with a slight tilt to match 2D preview
        this.camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 100);
        this.camera.position.set(0, 1.1, 0.35);
        this.camera.lookAt(0, 0, 0);

        // Renderer — no tone mapping so vertex colors stay true
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const hemiLight = new THREE.HemisphereLight(0x88bbff, 0x443322, 0.4);
        this.scene.add(hemiLight);

        // Sun
        const sunLight = new THREE.DirectionalLight(0xfff0dd, 0.9);
        sunLight.position.set(3, 4, 2);
        this.scene.add(sunLight);

        // Fill
        const fillLight = new THREE.DirectionalLight(0xaabbdd, 0.25);
        fillLight.position.set(-2, 1, -1);
        this.scene.add(fillLight);

        // OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.target.set(0, 0.02, 0);
        this.controls.minDistance = 0.3;
        this.controls.maxDistance = 3;
        this.controls.maxPolarAngle = Math.PI * 0.48; // prevent looking from below

        // Start render loop
        this._animate();

        // Resize observer
        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(this.container);
    }

    _onResize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w <= 0 || h <= 0) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    _animate() {
        this.animationId = requestAnimationFrame(() => this._animate());
        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Update the terrain mesh with a float32 heightmap.
     */
    update(floatArray, mapWidth, mapHeight, showWater = true) {
        // Remove old meshes
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        if (this.waterMesh) {
            this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh.material.dispose();
            this.waterMesh = null;
        }

        // Down-sample for performance: max 256 segments
        const maxSeg = 256;
        const segX = Math.min(mapWidth - 1, maxSeg);
        const segY = Math.min(mapHeight - 1, maxSeg);

        const geo = new THREE.PlaneGeometry(1, 1, segX, segY);
        geo.rotateX(-Math.PI / 2);

        const pos = geo.attributes.position;
        const colors = new Float32Array(pos.count * 3);

        const heightScale = 0.12;
        // Water level: height value below which is "sea"
        const seaLevel = 0.15;
        const waterY = seaLevel * heightScale;

        for (let i = 0; i < pos.count; i++) {
            const gx = pos.getX(i) + 0.5; // [0, 1]
            const gz = pos.getZ(i) + 0.5; // [0, 1]

            // Sample heightmap (nearest)
            const px = Math.min(Math.floor(gx * mapWidth), mapWidth - 1);
            const py = Math.min(Math.floor(gz * mapHeight), mapHeight - 1);
            const h = floatArray[py * mapWidth + px];

            // Clamp underwater vertices to sea floor (prevents ugly underside)
            const displayH = Math.max(h, seaLevel * 0.8);
            pos.setY(i, displayH * heightScale);

            // Color from the splat-map-matching ramp
            const c = this._terrainColor(h);
            colors[i * 3 + 0] = c[0];
            colors[i * 3 + 1] = c[1];
            colors[i * 3 + 2] = c[2];
        }

        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.85,
            metalness: 0.0,
            flatShading: false,
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(0, 0, 0);
        this.scene.add(this.mesh);

        // --- Water Plane (conditional) ---
        if (showWater) {
            const waterGeo = new THREE.PlaneGeometry(1, 1);
            waterGeo.rotateX(-Math.PI / 2);

            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x2288cc,
                transparent: true,
                opacity: 0.6,
                roughness: 0.15,
                metalness: 0.1,
                side: THREE.DoubleSide,
            });

            this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
            this.waterMesh.position.set(0, waterY, 0);
            this.scene.add(this.waterMesh);
        }

        this.hasData = true;

        // Hide placeholder text
        const ph = this.container.querySelector(".terrain-placeholder");
        if (ph) ph.style.display = "none";
    }

    /**
     * Terrain color ramp — matches server-side splat map exactly.
     * Same bands as image_io.py _terrain_color().
     */
    _terrainColor(h) {
        const mix = (a, b, t) => [
            a[0] * (1 - t) + b[0] * t,
            a[1] * (1 - t) + b[1] * t,
            a[2] * (1 - t) + b[2] * t,
        ];

        if (h < 0.1) {
            return mix([0, 0, 200/255], [0, 100/255, 1], h / 0.1);
        }
        if (h < 0.2) {
            return mix([0, 100/255, 1], [238/255, 214/255, 175/255], (h - 0.1) / 0.1);
        }
        if (h < 0.4) {
            return mix([238/255, 214/255, 175/255], [34/255, 139/255, 34/255], (h - 0.2) / 0.2);
        }
        if (h < 0.6) {
            return mix([34/255, 139/255, 34/255], [0, 100/255, 0], (h - 0.4) / 0.2);
        }
        if (h < 0.8) {
            return mix([0, 100/255, 0], [139/255, 69/255, 19/255], (h - 0.6) / 0.2);
        }
        return mix([139/255, 69/255, 19/255], [1, 1, 1], Math.min((h - 0.8) / 0.2, 1));
    }

    fullscreen() {
        if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
        }
    }

    /**
     * Export the terrain mesh as OBJ + MTL + baked color texture,
     * packaged into a single ZIP download.
     */
    exportOBJ() {
        if (!this.mesh) {
            alert("No terrain mesh to export. Generate terrain first.");
            return;
        }

        if (typeof JSZip === "undefined") {
            alert("JSZip library not loaded. Cannot create ZIP package.");
            return;
        }

        const geo = this.mesh.geometry;
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;
        const uv  = geo.attributes.uv;
        const col  = geo.attributes.color;
        const idx = geo.index;

        // --- 1. Bake vertex colors into a texture PNG ---
        const texSize = 512;
        const texCanvas = document.createElement("canvas");
        texCanvas.width = texSize;
        texCanvas.height = texSize;
        const tCtx = texCanvas.getContext("2d");

        if (col && uv) {
            // Build a pixel buffer from vertex colors mapped via UVs
            const imgData = tCtx.createImageData(texSize, texSize);

            // For a PlaneGeometry grid, vertices are laid out in rows.
            // Determine grid dimensions from UV coords:
            // segX+1 columns, segY+1 rows
            const segX = Math.round(Math.sqrt(pos.count * (1)) - 1) || 1;
            const segY = Math.round(pos.count / (segX + 1)) - 1 || 1;
            const cols = segX + 1;
            const rows = segY + 1;

            for (let iy = 0; iy < rows; iy++) {
                for (let ix = 0; ix < cols; ix++) {
                    const vi = iy * cols + ix;
                    if (vi >= pos.count) continue;

                    const r = Math.round(col.getX(vi) * 255);
                    const g = Math.round(col.getY(vi) * 255);
                    const b = Math.round(col.getZ(vi) * 255);

                    // Map grid position to pixel region
                    const px0 = Math.floor((ix / (cols - 1)) * (texSize - 1));
                    const py0 = Math.floor((iy / (rows - 1)) * (texSize - 1));
                    const px1 = ix < cols - 1 ? Math.floor(((ix + 1) / (cols - 1)) * (texSize - 1)) : texSize;
                    const py1 = iy < rows - 1 ? Math.floor(((iy + 1) / (rows - 1)) * (texSize - 1)) : texSize;

                    for (let py = py0; py < py1; py++) {
                        for (let px = px0; px < px1; px++) {
                            const pi = (py * texSize + px) * 4;
                            imgData.data[pi + 0] = r;
                            imgData.data[pi + 1] = g;
                            imgData.data[pi + 2] = b;
                            imgData.data[pi + 3] = 255;
                        }
                    }
                }
            }
            tCtx.putImageData(imgData, 0, 0);
        } else {
            // Fallback: solid grey
            tCtx.fillStyle = "#888";
            tCtx.fillRect(0, 0, texSize, texSize);
        }

        // --- 2. Build MTL content ---
        const mtlName = "terrain_material";
        const texFilename = "terrain_texture.png";
        let mtl = "# Terrain material exported from Noise & TerrainGen\n";
        mtl += `newmtl ${mtlName}\n`;
        mtl += "Ka 0.2 0.2 0.2\n";
        mtl += "Kd 1.0 1.0 1.0\n";
        mtl += "Ks 0.0 0.0 0.0\n";
        mtl += "Ns 10.0\n";
        mtl += "illum 2\n";
        mtl += `map_Kd ${texFilename}\n`;

        // --- 3. Build OBJ content ---
        let obj = "# Terrain mesh exported from Noise & TerrainGen\n";
        obj += "# https://github.com/Mclefti/NoiseAndTerrainGen\n";
        obj += "mtllib terrain.mtl\n";
        obj += "o Terrain\n";

        // Vertices
        for (let i = 0; i < pos.count; i++) {
            obj += `v ${pos.getX(i).toFixed(6)} ${pos.getY(i).toFixed(6)} ${pos.getZ(i).toFixed(6)}\n`;
        }

        // Texture coordinates
        if (uv) {
            for (let i = 0; i < uv.count; i++) {
                obj += `vt ${uv.getX(i).toFixed(6)} ${uv.getY(i).toFixed(6)}\n`;
            }
        }

        // Normals
        if (norm) {
            for (let i = 0; i < norm.count; i++) {
                obj += `vn ${norm.getX(i).toFixed(6)} ${norm.getY(i).toFixed(6)} ${norm.getZ(i).toFixed(6)}\n`;
            }
        }

        // Use material
        obj += `usemtl ${mtlName}\n`;

        // Faces (1-indexed) — format: f v/vt/vn
        const hasUV = !!uv;
        const hasNorm = !!norm;

        if (idx) {
            for (let i = 0; i < idx.count; i += 3) {
                const a = idx.getX(i) + 1;
                const b = idx.getX(i + 1) + 1;
                const c = idx.getX(i + 2) + 1;
                if (hasUV && hasNorm) {
                    obj += `f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}\n`;
                } else if (hasNorm) {
                    obj += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
                } else {
                    obj += `f ${a} ${b} ${c}\n`;
                }
            }
        } else {
            for (let i = 0; i < pos.count; i += 3) {
                const a = i + 1, b = i + 2, c = i + 3;
                if (hasUV && hasNorm) {
                    obj += `f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}\n`;
                } else if (hasNorm) {
                    obj += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
                } else {
                    obj += `f ${a} ${b} ${c}\n`;
                }
            }
        }

        // --- 4. Package into ZIP and download ---
        texCanvas.toBlob((pngBlob) => {
            const zip = new JSZip();
            zip.file("terrain.obj", obj);
            zip.file("terrain.mtl", mtl);
            zip.file(texFilename, pngBlob);

            zip.generateAsync({ type: "blob" }).then((content) => {
                const url = URL.createObjectURL(content);
                const link = document.createElement("a");
                link.href = url;
                link.download = "terrain_export.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            });
        }, "image/png");
    }

    dispose() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (this.renderer) this.renderer.dispose();
    }
}
