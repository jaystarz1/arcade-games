// Ice Breaker: Arctic Survival - Game State Management

const GameState = {
    // Current game state
    current: null,

    // Game phases
    PHASES: {
        SNOW_DRAGON: {
            id: 'snow_dragon',
            name: 'SNOW DRAGON',
            startDay: 1,      // Sept 1
            endDay: 91,       // Nov 30
            description: 'Detection, mobilization, standoff begins'
        },
        POLAR_NIGHT: {
            id: 'polar_night',
            name: 'POLAR NIGHT',
            startDay: 92,     // Dec 1
            endDay: 153,      // Jan 31
            description: '24hr darkness, helicopters grounded, desperation'
        },
        DEAD_RECKONING: {
            id: 'dead_reckoning',
            name: 'DEAD RECKONING',
            startDay: 154,    // Feb 1
            endDay: 181,      // Feb 28
            description: 'Reactor failure, radiation, evacuation decision'
        },
        DEATH_MARCH: {
            id: 'death_march',
            name: 'DEATH MARCH',
            startDay: 182,    // Mar 1
            endDay: 243,      // Apr 30
            description: '400nm trek across breaking ice'
        }
    },

    // Game speed settings
    SPEEDS: {
        PAUSED: 0,
        NORMAL: 1,
        FAST: 3
    },

    // Create new game state
    createNew: (scenario = 'canon') => {
        return {
            // Meta
            id: Utils.generateId(),
            scenario: scenario,
            created: Date.now(),
            lastSaved: null,

            // Time
            day: 1,
            hour: 8, // Start at 08:00
            speed: GameState.SPEEDS.PAUSED,
            phase: 'snow_dragon',

            // Current perspective
            perspective: 'zhao', // Starting perspective

            // Environment
            environment: {
                temperature: -10,
                windSpeed: 15,
                windChill: -22,
                weather: 'clear',
                daylight: 14,
                iceCondition: 'forming',
                visibility: 'good'
            },

            // Resources (fleet-wide for Chinese forces)
            resources: {
                food: 100,           // Percentage
                fuel: 100,
                medical: 100,
                batteries: 100,
                freshWater: 100,
                heatingFuel: 100
            },

            // Personnel tracking
            personnel: {
                chinese: {
                    total: 1000,
                    fit: 1000,
                    earlyFrostbite: 0,
                    severeFrostbite: 0,
                    critical: 0,
                    dead: 0,
                    morale: 85          // 0-100
                },
                canadian: {
                    total: 150,
                    fit: 150,
                    earlyFrostbite: 0,
                    severeFrostbite: 0,
                    critical: 0,
                    dead: 0,
                    morale: 90
                }
            },

            // Ships
            ships: {
                xuelong3: {
                    id: 'xuelong3',
                    name: 'Xuelong 3',
                    type: 'icebreaker',
                    status: 'operational',
                    reactorStatus: 'nominal',
                    hullIntegrity: 100,
                    position: { col: 15, row: 10 },
                    heating: true,
                    crew: 150
                },
                type075: {
                    id: 'type075',
                    name: 'Type 075 LHD',
                    type: 'amphibious',
                    status: 'operational',
                    hullIntegrity: 100,
                    position: { col: 16, row: 10 },
                    heating: true,
                    crew: 850,
                    iceClass: 'low' // Critical weakness
                },
                support1: {
                    id: 'support1',
                    name: 'Qingdao',
                    type: 'support',
                    status: 'operational',
                    hullIntegrity: 100,
                    position: { col: 14, row: 11 },
                    heating: true,
                    crew: 100
                }
            },

            // Equipment status (degrades with cold)
            equipment: {
                electronics: { status: 'operational', condition: 100 },
                vehicles: { status: 'operational', condition: 100 },
                weapons: { status: 'operational', condition: 100 },
                communications: { status: 'operational', condition: 100 },
                medicalEquip: { status: 'operational', condition: 100 },
                heaters: { status: 'operational', condition: 100 }
            },

            // Units on map (for tactical movement)
            units: [],

            // Story progress
            story: {
                chapter: 1,
                eventsTriggered: [],
                decisionsAdmitted: {},
                whatIfActive: null,
                flags: {}
            },

            // Narrative log
            log: []
        };
    },

    // Initialize game state
    init: (scenario = 'canon') => {
        GameState.current = GameState.createNew(scenario);
        GameState.events = Utils.createEventEmitter();
        return GameState.current;
    },

    // Get current phase based on day
    getCurrentPhase: () => {
        const day = GameState.current.day;
        for (const [key, phase] of Object.entries(GameState.PHASES)) {
            if (day >= phase.startDay && day <= phase.endDay) {
                return phase;
            }
        }
        return GameState.PHASES.DEATH_MARCH; // Default to last phase
    },

    // Advance time
    advanceTime: (hours = 1) => {
        const state = GameState.current;
        state.hour += hours;

        while (state.hour >= 24) {
            state.hour -= 24;
            state.day += 1;

            // Update phase
            const newPhase = GameState.getCurrentPhase();
            if (newPhase.id !== state.phase) {
                state.phase = newPhase.id;
                GameState.events.emit('phaseChange', newPhase);
            }

            // Daily updates
            GameState.events.emit('dayChange', state.day);
        }

        GameState.events.emit('timeAdvance', { day: state.day, hour: state.hour });
    },

    // Save game to localStorage
    save: () => {
        const state = GameState.current;
        if (!state) return false;

        state.lastSaved = Date.now();
        try {
            localStorage.setItem('icebreaker_save', JSON.stringify(state));
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    },

    // Load game from localStorage
    load: () => {
        try {
            const saved = localStorage.getItem('icebreaker_save');
            if (saved) {
                GameState.current = JSON.parse(saved);
                GameState.events = Utils.createEventEmitter();
                return true;
            }
        } catch (e) {
            console.error('Failed to load game:', e);
        }
        return false;
    },

    // Check if save exists
    hasSave: () => {
        return localStorage.getItem('icebreaker_save') !== null;
    },

    // Delete save
    deleteSave: () => {
        localStorage.removeItem('icebreaker_save');
    },

    // Add to narrative log
    addLog: (text, type = 'normal') => {
        const state = GameState.current;
        const entry = {
            id: Utils.generateId(),
            day: state.day,
            hour: state.hour,
            text: text,
            type: type, // normal, important, danger, decision
            timestamp: Date.now()
        };
        state.log.push(entry);

        // Keep log manageable
        if (state.log.length > 200) {
            state.log = state.log.slice(-150);
        }

        GameState.events.emit('logEntry', entry);
        return entry;
    },

    // Record a decision
    recordDecision: (decisionId, choice) => {
        const state = GameState.current;
        state.story.decisionsAdmitted[decisionId] = {
            choice: choice,
            day: state.day,
            hour: state.hour,
            timestamp: Date.now()
        };
        GameState.events.emit('decisionMade', { decisionId, choice });
    },

    // Set story flag
    setFlag: (flag, value = true) => {
        GameState.current.story.flags[flag] = value;
    },

    // Check story flag
    hasFlag: (flag) => {
        return GameState.current.story.flags[flag] === true;
    },

    // Mark event as triggered
    triggerEvent: (eventId) => {
        if (!GameState.current.story.eventsTriggered.includes(eventId)) {
            GameState.current.story.eventsTriggered.push(eventId);
        }
    },

    // Check if event was triggered
    eventTriggered: (eventId) => {
        return GameState.current.story.eventsTriggered.includes(eventId);
    },

    // Switch perspective
    switchPerspective: (characterId) => {
        const oldPerspective = GameState.current.perspective;
        GameState.current.perspective = characterId;
        GameState.events.emit('perspectiveChange', {
            from: oldPerspective,
            to: characterId
        });
    },

    // Activate what-if scenario
    activateWhatIf: (scenarioId) => {
        GameState.current.story.whatIfActive = scenarioId;
        GameState.events.emit('whatIfActivated', scenarioId);
    },

    // Get game statistics
    getStats: () => {
        const state = GameState.current;
        const chinese = state.personnel.chinese;

        return {
            daysSurvived: state.day,
            totalDeaths: chinese.dead,
            casualtyRate: Math.round((chinese.dead / chinese.total) * 100),
            resourcesRemaining: Math.round(
                (state.resources.food + state.resources.fuel +
                 state.resources.medical + state.resources.batteries) / 4
            ),
            decisionsThe: Object.keys(state.story.decisionsAdmitted).length,
            currentMorale: chinese.morale
        };
    }
};

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
