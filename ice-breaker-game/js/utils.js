// Ice Breaker: Arctic Survival - Utility Functions

const Utils = {
    // Random number between min and max (inclusive)
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    // Random float between min and max
    randomFloat: (min, max) => Math.random() * (max - min) + min,

    // Clamp value between min and max
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),

    // Linear interpolation
    lerp: (a, b, t) => a + (b - a) * t,

    // Format date from day number
    formatDate: (day, startMonth = 9, startYear = 2045) => {
        const date = new Date(startYear, startMonth - 1, day);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    },

    // Get month from day number (starting Sept 1)
    getMonth: (day) => {
        const date = new Date(2045, 8, day); // Sept 1, 2045
        return date.getMonth() + 1; // 1-12
    },

    // Calculate daylight hours based on date and latitude
    // Victoria Strait is approximately 69°N
    calculateDaylight: (day) => {
        const month = Utils.getMonth(day);
        const dayOfMonth = new Date(2045, 8, day).getDate();

        // Approximate daylight hours at 69°N latitude
        const daylightByMonth = {
            9: { start: 14, end: 10 },    // Sept: 14h -> 10h
            10: { start: 10, end: 4 },    // Oct: 10h -> 4h
            11: { start: 4, end: 0 },     // Nov: 4h -> 0h (polar night begins)
            12: { start: 0, end: 0 },     // Dec: 0h (polar night)
            1: { start: 0, end: 0 },      // Jan: 0h (polar night)
            2: { start: 0, end: 6 },      // Feb: 0h -> 6h (light returns)
            3: { start: 6, end: 12 },     // Mar: 6h -> 12h
            4: { start: 12, end: 18 },    // Apr: 12h -> 18h
        };

        const monthData = daylightByMonth[month] || { start: 12, end: 12 };
        const progress = dayOfMonth / 30;
        return Math.round(Utils.lerp(monthData.start, monthData.end, progress));
    },

    // Deep clone an object
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

    // Shuffle array (Fisher-Yates)
    shuffle: (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // Weighted random selection
    weightedRandom: (options) => {
        // options = [{ value: x, weight: n }, ...]
        const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
        let random = Math.random() * totalWeight;

        for (const option of options) {
            random -= option.weight;
            if (random <= 0) return option.value;
        }
        return options[options.length - 1].value;
    },

    // Format temperature
    formatTemp: (celsius) => `${celsius}°C`,

    // Calculate wind chill (simplified formula)
    calculateWindChill: (temp, windSpeed) => {
        if (temp > 10 || windSpeed < 5) return temp;
        // Simplified wind chill formula
        const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16)
                         + 0.3965 * temp * Math.pow(windSpeed, 0.16);
        return Math.round(windChill);
    },

    // Generate unique ID
    generateId: () => '_' + Math.random().toString(36).substr(2, 9),

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Event emitter mixin
    createEventEmitter: () => {
        const listeners = {};
        return {
            on: (event, callback) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(callback);
            },
            off: (event, callback) => {
                if (!listeners[event]) return;
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            },
            emit: (event, data) => {
                if (!listeners[event]) return;
                listeners[event].forEach(cb => cb(data));
            }
        };
    },

    // Hex grid utilities
    hex: {
        // Offset coordinates to cube coordinates
        offsetToCube: (col, row) => {
            const x = col - (row - (row & 1)) / 2;
            const z = row;
            const y = -x - z;
            return { x, y, z };
        },

        // Cube coordinates to offset coordinates
        cubeToOffset: (x, y, z) => {
            const col = x + (z - (z & 1)) / 2;
            const row = z;
            return { col, row };
        },

        // Distance between two hex cells (cube coordinates)
        distance: (a, b) => {
            return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
        },

        // Get neighbors of a hex cell
        neighbors: (col, row) => {
            const directions = row & 1
                ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]
                : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
            return directions.map(([dc, dr]) => ({ col: col + dc, row: row + dr }));
        },

        // Pixel position for hex center (pointy-top hexes)
        hexToPixel: (col, row, size) => {
            const x = size * Math.sqrt(3) * (col + 0.5 * (row & 1));
            const y = size * 3/2 * row;
            return { x, y };
        },

        // Hex from pixel position
        pixelToHex: (x, y, size) => {
            const q = (Math.sqrt(3)/3 * x - 1/3 * y) / size;
            const r = (2/3 * y) / size;
            return Utils.hex.cubeRound(q, -q-r, r);
        },

        // Round cube coordinates
        cubeRound: (x, y, z) => {
            let rx = Math.round(x);
            let ry = Math.round(y);
            let rz = Math.round(z);

            const xDiff = Math.abs(rx - x);
            const yDiff = Math.abs(ry - y);
            const zDiff = Math.abs(rz - z);

            if (xDiff > yDiff && xDiff > zDiff) {
                rx = -ry - rz;
            } else if (yDiff > zDiff) {
                ry = -rx - rz;
            } else {
                rz = -rx - ry;
            }

            return Utils.hex.cubeToOffset(rx, ry, rz);
        }
    }
};

// Freeze utility object
Object.freeze(Utils);
