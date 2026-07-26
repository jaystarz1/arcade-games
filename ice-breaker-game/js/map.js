// Ice Breaker: Arctic Survival - Hex Map System

const GameMap = {
    // Map configuration
    config: {
        hexSize: 30,          // Pixels
        mapWidth: 40,         // Hex columns
        mapHeight: 30,        // Hex rows
        offsetX: 50,
        offsetY: 50
    },

    // Terrain types
    TERRAIN: {
        OCEAN: { id: 'ocean', name: 'Open Ocean', color: '#1a3a5c', passable: false },
        ICE: { id: 'ice', name: 'Sea Ice', color: '#a8d4ff', passable: true },
        THICK_ICE: { id: 'thick_ice', name: 'Thick Pack Ice', color: '#d0e8ff', passable: true },
        PRESSURE_RIDGE: { id: 'pressure_ridge', name: 'Pressure Ridge', color: '#88b4d4', passable: true, difficult: true },
        LEAD: { id: 'lead', name: 'Lead (Open Water)', color: '#2a4a6c', passable: false },
        LAND: { id: 'land', name: 'Land', color: '#3a4a5a', passable: true },
        COAST: { id: 'coast', name: 'Coastline', color: '#4a5a6a', passable: true }
    },

    // Canvas and context
    canvas: null,
    ctx: null,

    // Map data
    hexes: [],
    camera: { x: 0, y: 0, zoom: 1 },
    selectedHex: null,
    hoveredHex: null,

    // Initialize map
    init: () => {
        GameMap.canvas = document.getElementById('game-map');
        if (!GameMap.canvas) {
            console.error('Map canvas not found');
            return;
        }

        GameMap.ctx = GameMap.canvas.getContext('2d');
        GameMap.generateMap();
        GameMap.setupEventListeners();
        GameMap.resize();

        // Center on ships
        GameMap.centerOnShips();
    },

    // Generate the Victoria Strait map
    generateMap: () => {
        const { mapWidth, mapHeight } = GameMap.config;
        GameMap.hexes = [];

        for (let row = 0; row < mapHeight; row++) {
            for (let col = 0; col < mapWidth; col++) {
                const hex = GameMap.generateHex(col, row);
                GameMap.hexes.push(hex);
            }
        }

        // Place key locations
        GameMap.placeLocations();
    },

    // Generate individual hex
    generateHex: (col, row) => {
        // Victoria Strait region: mostly ice with some land features
        let terrain = GameMap.TERRAIN.ICE;

        // Land masses (simplified Canadian Arctic Archipelago)
        // King William Island (west side of strait)
        if (col < 8 && row < 15) {
            terrain = GameMap.TERRAIN.LAND;
        }
        // Victoria Island (north)
        if (row < 5 && col > 10 && col < 35) {
            terrain = GameMap.TERRAIN.LAND;
        }
        // Adelaide Peninsula (south)
        if (row > 25 && col < 20) {
            terrain = GameMap.TERRAIN.LAND;
        }

        // Coastlines
        if (terrain === GameMap.TERRAIN.LAND) {
            const neighbors = Utils.hex.neighbors(col, row);
            const hasIceNeighbor = neighbors.some(n => {
                if (n.col < 0 || n.col >= GameMap.config.mapWidth) return false;
                if (n.row < 0 || n.row >= GameMap.config.mapHeight) return false;
                // Check if neighbor would be ice
                return !(n.col < 8 && n.row < 15) &&
                       !(n.row < 5 && n.col > 10 && n.col < 35) &&
                       !(n.row > 25 && n.col < 20);
            });
            if (hasIceNeighbor) {
                terrain = GameMap.TERRAIN.COAST;
            }
        }

        // Random pressure ridges in ice
        if (terrain === GameMap.TERRAIN.ICE && Math.random() < 0.1) {
            terrain = GameMap.TERRAIN.PRESSURE_RIDGE;
        }

        // Random thick ice patches
        if (terrain === GameMap.TERRAIN.ICE && Math.random() < 0.15) {
            terrain = GameMap.TERRAIN.THICK_ICE;
        }

        // Random leads (open water cracks) - rare in early game
        if (terrain === GameMap.TERRAIN.ICE && Math.random() < 0.02) {
            terrain = GameMap.TERRAIN.LEAD;
        }

        return {
            col,
            row,
            terrain,
            features: [],
            unit: null,
            ship: null,
            visible: true,
            explored: true
        };
    },

    // Place key locations on map
    placeLocations: () => {
        // Cambridge Bay marker (destination - 400nm away)
        // Would be off-map to the west, but we mark the direction
        const cambridgeBayDirection = GameMap.getHex(0, 12);
        if (cambridgeBayDirection) {
            cambridgeBayDirection.features.push({
                type: 'marker',
                name: 'To Cambridge Bay',
                description: '~400nm west'
            });
        }

        // Ship positions (center of map - where they're trapped)
        const shipPositions = [
            { col: 15, row: 10, ship: 'xuelong3' },
            { col: 16, row: 10, ship: 'type075' },
            { col: 14, row: 11, ship: 'support1' }
        ];

        shipPositions.forEach(pos => {
            const hex = GameMap.getHex(pos.col, pos.row);
            if (hex) {
                hex.ship = pos.ship;
                hex.terrain = GameMap.TERRAIN.THICK_ICE; // Ships frozen in thick ice
            }
        });
    },

    // Get hex at coordinates
    getHex: (col, row) => {
        return GameMap.hexes.find(h => h.col === col && h.row === row);
    },

    // Setup canvas event listeners
    setupEventListeners: () => {
        GameMap.canvas.addEventListener('mousemove', GameMap.handleMouseMove);
        GameMap.canvas.addEventListener('click', GameMap.handleClick);
        GameMap.canvas.addEventListener('wheel', GameMap.handleWheel);

        // Map control buttons
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
            GameMap.camera.zoom = Math.min(2, GameMap.camera.zoom + 0.2);
            GameMap.render();
        });

        document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
            GameMap.camera.zoom = Math.max(0.5, GameMap.camera.zoom - 0.2);
            GameMap.render();
        });

        document.getElementById('btn-center')?.addEventListener('click', () => {
            GameMap.centerOnShips();
        });

        window.addEventListener('resize', Utils.debounce(GameMap.resize, 200));
    },

    // Handle mouse move
    handleMouseMove: (e) => {
        const rect = GameMap.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - GameMap.camera.x) / GameMap.camera.zoom;
        const y = (e.clientY - rect.top - GameMap.camera.y) / GameMap.camera.zoom;

        const hexCoords = GameMap.pixelToHex(x, y);
        const hex = GameMap.getHex(hexCoords.col, hexCoords.row);

        if (hex !== GameMap.hoveredHex) {
            GameMap.hoveredHex = hex;
            GameMap.render();

            if (hex) {
                GameMap.canvas.style.cursor = 'pointer';
            } else {
                GameMap.canvas.style.cursor = 'default';
            }
        }
    },

    // Handle click
    handleClick: (e) => {
        const rect = GameMap.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - GameMap.camera.x) / GameMap.camera.zoom;
        const y = (e.clientY - rect.top - GameMap.camera.y) / GameMap.camera.zoom;

        const hexCoords = GameMap.pixelToHex(x, y);
        const hex = GameMap.getHex(hexCoords.col, hexCoords.row);

        if (hex) {
            GameMap.selectedHex = hex;
            GameMap.render();

            // Emit selection event
            if (GameState.events) {
                GameState.events.emit('hexSelected', hex);
            }
        }
    },

    // Handle mouse wheel (zoom)
    handleWheel: (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        GameMap.camera.zoom = Utils.clamp(GameMap.camera.zoom + delta, 0.5, 2);
        GameMap.render();
    },

    // Resize canvas
    resize: () => {
        const container = GameMap.canvas.parentElement;
        GameMap.canvas.width = container.clientWidth;
        GameMap.canvas.height = container.clientHeight;
        GameMap.render();
    },

    // Center camera on ships
    centerOnShips: () => {
        const state = GameState.current;
        if (!state) return;

        // Find ship positions
        const ships = Object.values(state.ships);
        if (ships.length === 0) return;

        const avgCol = ships.reduce((sum, s) => sum + s.position.col, 0) / ships.length;
        const avgRow = ships.reduce((sum, s) => sum + s.position.row, 0) / ships.length;

        const pixel = GameMap.hexToPixel(avgCol, avgRow);

        GameMap.camera.x = GameMap.canvas.width / 2 - pixel.x * GameMap.camera.zoom;
        GameMap.camera.y = GameMap.canvas.height / 2 - pixel.y * GameMap.camera.zoom;

        GameMap.render();
    },

    // Convert hex to pixel coordinates
    hexToPixel: (col, row) => {
        const size = GameMap.config.hexSize;
        const x = size * Math.sqrt(3) * (col + 0.5 * (row & 1)) + GameMap.config.offsetX;
        const y = size * 1.5 * row + GameMap.config.offsetY;
        return { x, y };
    },

    // Convert pixel to hex coordinates
    pixelToHex: (x, y) => {
        const size = GameMap.config.hexSize;
        x -= GameMap.config.offsetX;
        y -= GameMap.config.offsetY;

        const q = (Math.sqrt(3)/3 * x - 1/3 * y) / size;
        const r = (2/3 * y) / size;

        // Round to nearest hex
        let rx = Math.round(q);
        let ry = Math.round(-q - r);
        let rz = Math.round(r);

        const xDiff = Math.abs(rx - q);
        const yDiff = Math.abs(ry - (-q - r));
        const zDiff = Math.abs(rz - r);

        if (xDiff > yDiff && xDiff > zDiff) {
            rx = -ry - rz;
        } else if (yDiff > zDiff) {
            ry = -rx - rz;
        }

        const col = rx + (rz - (rz & 1)) / 2;
        const row = rz;

        return { col: Math.round(col), row: Math.round(row) };
    },

    // Render the map
    render: () => {
        const ctx = GameMap.ctx;
        if (!ctx) return;

        const { width, height } = GameMap.canvas;

        // Clear canvas
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, width, height);

        // Save context and apply camera transform
        ctx.save();
        ctx.translate(GameMap.camera.x, GameMap.camera.y);
        ctx.scale(GameMap.camera.zoom, GameMap.camera.zoom);

        // Render hexes
        GameMap.hexes.forEach(hex => {
            GameMap.renderHex(hex);
        });

        // Render ships
        GameMap.renderShips();

        // Render units
        GameMap.renderUnits();

        // Render selected/hovered highlights
        if (GameMap.hoveredHex) {
            GameMap.renderHexHighlight(GameMap.hoveredHex, 'rgba(255, 255, 255, 0.2)');
        }
        if (GameMap.selectedHex) {
            GameMap.renderHexHighlight(GameMap.selectedHex, 'rgba(74, 158, 255, 0.4)');
        }

        ctx.restore();

        // Render UI overlay
        GameMap.renderOverlay();
    },

    // Render single hex
    renderHex: (hex) => {
        const ctx = GameMap.ctx;
        const pixel = GameMap.hexToPixel(hex.col, hex.row);
        const size = GameMap.config.hexSize;

        // Draw hex shape
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i - 30);
            const x = pixel.x + size * Math.cos(angle);
            const y = pixel.y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Fill with terrain color
        ctx.fillStyle = hex.terrain.color;
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw features
        hex.features.forEach(feature => {
            if (feature.type === 'marker') {
                ctx.fillStyle = '#ffaa00';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('◄', pixel.x, pixel.y + 4);
            }
        });
    },

    // Render hex highlight
    renderHexHighlight: (hex, color) => {
        const ctx = GameMap.ctx;
        const pixel = GameMap.hexToPixel(hex.col, hex.row);
        const size = GameMap.config.hexSize;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i - 30);
            const x = pixel.x + size * Math.cos(angle);
            const y = pixel.y + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.stroke();
    },

    // Render ships on map
    renderShips: () => {
        const state = GameState.current;
        if (!state) return;

        const ctx = GameMap.ctx;

        Object.values(state.ships).forEach(ship => {
            const pixel = GameMap.hexToPixel(ship.position.col, ship.position.row);

            // Ship icon
            ctx.fillStyle = '#ff6644';
            ctx.beginPath();
            ctx.arc(pixel.x, pixel.y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Ship name
            ctx.fillStyle = '#ffffff';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(ship.name, pixel.x, pixel.y + 18);

            // Status indicator
            if (ship.status !== 'operational') {
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(pixel.x + 6, pixel.y - 6, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    },

    // Render units on map
    renderUnits: () => {
        const state = GameState.current;
        if (!state || !state.units) return;

        const ctx = GameMap.ctx;

        state.units.forEach(unit => {
            const pixel = GameMap.hexToPixel(unit.position.col, unit.position.row);

            // Unit icon
            ctx.fillStyle = unit.faction === 'chinese' ? '#44ff88' : '#4488ff';
            ctx.beginPath();
            ctx.moveTo(pixel.x, pixel.y - 6);
            ctx.lineTo(pixel.x + 5, pixel.y + 4);
            ctx.lineTo(pixel.x - 5, pixel.y + 4);
            ctx.closePath();
            ctx.fill();
        });
    },

    // Render overlay information
    renderOverlay: () => {
        const ctx = GameMap.ctx;

        // Selected hex info
        if (GameMap.selectedHex) {
            const hex = GameMap.selectedHex;
            const info = [
                `Terrain: ${hex.terrain.name}`,
                `Position: ${hex.col}, ${hex.row}`
            ];

            if (hex.ship) {
                const ship = GameState.current?.ships[hex.ship];
                if (ship) {
                    info.push(`Ship: ${ship.name}`);
                    info.push(`Status: ${ship.status}`);
                }
            }

            // Draw info box
            ctx.fillStyle = 'rgba(20, 26, 36, 0.9)';
            ctx.fillRect(10, GameMap.canvas.height - 80, 180, 70);
            ctx.strokeStyle = '#2a3444';
            ctx.strokeRect(10, GameMap.canvas.height - 80, 180, 70);

            ctx.fillStyle = '#e0e6ed';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            info.forEach((line, i) => {
                ctx.fillText(line, 20, GameMap.canvas.height - 60 + i * 16);
            });
        }
    },

    // Update ice conditions on map (called when ice changes)
    updateIceConditions: () => {
        const state = GameState.current;
        if (!state) return;

        const iceCondition = state.environment.iceCondition;

        GameMap.hexes.forEach(hex => {
            if (hex.terrain.id === 'ice' || hex.terrain.id === 'thick_ice' ||
                hex.terrain.id === 'lead' || hex.terrain.id === 'pressure_ridge') {

                // Update based on season
                if (iceCondition === 'thawing' || iceCondition === 'breakup') {
                    // More leads appear
                    if (Math.random() < 0.05) {
                        hex.terrain = GameMap.TERRAIN.LEAD;
                    }
                } else if (iceCondition === 'pressure') {
                    // More pressure ridges
                    if (hex.terrain.id === 'ice' && Math.random() < 0.1) {
                        hex.terrain = GameMap.TERRAIN.PRESSURE_RIDGE;
                    }
                }
            }
        });

        GameMap.render();
    },

    // Calculate path between two hexes (A* pathfinding)
    findPath: (startCol, startRow, endCol, endRow) => {
        const start = GameMap.getHex(startCol, startRow);
        const end = GameMap.getHex(endCol, endRow);

        if (!start || !end || !end.terrain.passable) return null;

        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(start, 0);
        fScore.set(start, GameMap.heuristic(start, end));

        while (openSet.length > 0) {
            // Get node with lowest fScore
            openSet.sort((a, b) => (fScore.get(a) || Infinity) - (fScore.get(b) || Infinity));
            const current = openSet.shift();

            if (current === end) {
                return GameMap.reconstructPath(cameFrom, current);
            }

            const neighbors = Utils.hex.neighbors(current.col, current.row);
            for (const n of neighbors) {
                const neighbor = GameMap.getHex(n.col, n.row);
                if (!neighbor || !neighbor.terrain.passable) continue;

                const moveCost = neighbor.terrain.difficult ? 2 : 1;
                const tentativeG = (gScore.get(current) || Infinity) + moveCost;

                if (tentativeG < (gScore.get(neighbor) || Infinity)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeG);
                    fScore.set(neighbor, tentativeG + GameMap.heuristic(neighbor, end));

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return null; // No path found
    },

    // Heuristic for A* (hex distance)
    heuristic: (a, b) => {
        const ac = Utils.hex.offsetToCube(a.col, a.row);
        const bc = Utils.hex.offsetToCube(b.col, b.row);
        return Utils.hex.distance(ac, bc);
    },

    // Reconstruct path from A* result
    reconstructPath: (cameFrom, current) => {
        const path = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }
        return path;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameMap;
}
