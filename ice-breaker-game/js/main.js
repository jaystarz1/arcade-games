// Ice Breaker: Arctic Survival - Main Game Controller

const Game = {
    // Game loop interval
    loopInterval: null,
    tickRate: 1000, // ms per game tick at normal speed

    // Initialize game
    init: () => {
        console.log('Ice Breaker: Arctic Survival - Initializing...');

        // Initialize UI first
        UI.init();

        console.log('Game initialized. Ready to play.');
    },

    // Start new game
    newGame: (scenarioId = 'canon') => {
        console.log(`Starting new game with scenario: ${scenarioId}`);

        // Initialize game state
        GameState.init(scenarioId);

        // Apply scenario if not canon
        if (scenarioId !== 'canon') {
            Scenarios.applyScenario(scenarioId);
        }

        // Initialize systems
        Environment.init();
        Resources.init();
        Personnel.init();
        GameMap.init();
        Narrative.init();

        // Setup event subscriptions
        Game.setupEventSubscriptions();

        // Show game screen
        UI.showScreen('game');

        // Update UI
        UI.updateAll();
        GameMap.render();

        // Add opening log entry
        const character = Characters.getCurrentPerspective();
        if (character) {
            GameState.addLog(`Perspective: ${character.name} - ${character.role}`, 'important');
        }

        // Check for opening events
        const events = Narrative.checkEvents();
        if (events.length > 0) {
            Game.processEventQueue();
        }

        // Start paused
        Game.setSpeed(GameState.SPEEDS.PAUSED);
        UI.updateTimeControls();

        console.log('New game started.');
    },

    // Resume existing game
    resume: () => {
        console.log('Resuming game...');

        // Reinitialize systems with existing state
        Game.setupEventSubscriptions();

        // Update UI
        UI.updateAll();

        // Reinitialize map
        GameMap.init();
    },

    // Setup event subscriptions
    setupEventSubscriptions: () => {
        // Day change handler
        GameState.events.on('dayChange', (day) => {
            Game.onDayChange(day);
        });

        // Phase change handler
        GameState.events.on('phaseChange', (phase) => {
            console.log(`Phase changed to: ${phase.name}`);
        });
    },

    // Set game speed
    setSpeed: (speed) => {
        GameState.current.speed = speed;

        // Clear existing loop
        if (Game.loopInterval) {
            clearInterval(Game.loopInterval);
            Game.loopInterval = null;
        }

        // Start new loop if not paused
        if (speed !== GameState.SPEEDS.PAUSED) {
            const interval = Game.tickRate / speed;
            Game.loopInterval = setInterval(Game.tick, interval);
        }
    },

    // Pause game
    pause: () => {
        Game.setSpeed(GameState.SPEEDS.PAUSED);
        UI.updateTimeControls();
    },

    // Game tick (called by interval)
    tick: () => {
        const state = GameState.current;
        if (!state || state.speed === GameState.SPEEDS.PAUSED) return;

        // Advance time by 1 hour
        GameState.advanceTime(1);

        // Update environment
        Environment.updateAll();

        // Update UI
        UI.updateTime();
        UI.updateEnvironment();
    },

    // Called when a new day begins
    onDayChange: (day) => {
        console.log(`Day ${day} begins.`);

        // Daily resource consumption
        Resources.consumeDaily();

        // Personnel updates (frostbite, morale, etc.)
        Personnel.processDailyUpdate('chinese');

        // Update ice conditions
        GameMap.updateIceConditions();

        // Check for narrative events
        const events = Narrative.checkEvents();

        // Add scenario-specific events
        const scenarioEvents = Scenarios.getScenarioEvents();
        scenarioEvents.forEach(e => {
            if (!GameState.eventTriggered(e.id)) {
                Narrative.eventQueue.push(e);
                GameState.triggerEvent(e.id);
            }
        });

        // Check for procedural events
        const proceduralEvent = Narrative.generateProceduralEvent();
        if (proceduralEvent) {
            Narrative.eventQueue.push(proceduralEvent);
        }

        // Process event queue
        if (Narrative.eventQueue.length > 0) {
            Game.processEventQueue();
        }

        // Update UI
        UI.updateAll();

        // Auto-save every 10 days
        if (day % 10 === 0) {
            GameState.save();
            console.log('Auto-saved.');
        }
    },

    // Process narrative event queue
    processEventQueue: () => {
        const event = Narrative.getNextEvent();
        if (event) {
            // Check if event matches current perspective
            const perspective = GameState.current.perspective;

            // If event has a different perspective, switch to it
            if (event.perspective && event.perspective !== perspective) {
                GameState.switchPerspective(event.perspective);
            }

            // Show the event
            UI.showEvent(event);
        }
    },

    // Check for game over conditions
    checkGameOver: () => {
        const state = GameState.current;
        const personnel = state.personnel.chinese;

        // All personnel dead
        if (personnel.fit + personnel.earlyFrostbite + personnel.severeFrostbite + personnel.critical === 0) {
            return {
                type: 'defeat',
                reason: 'All personnel have perished.',
                stats: GameState.getStats()
            };
        }

        // Successful evacuation (in what-if scenarios)
        if (GameState.hasFlag('evacuation_complete')) {
            return {
                type: 'victory',
                reason: 'Evacuation completed successfully.',
                stats: GameState.getStats()
            };
        }

        // Reached end of timeline (April 30)
        if (state.day >= 243) {
            const survivors = personnel.fit + personnel.earlyFrostbite;
            return {
                type: survivors > 0 ? 'survival' : 'defeat',
                reason: survivors > 0
                    ? `${survivors} survivors reached safety.`
                    : 'The ice claimed them all.',
                stats: GameState.getStats()
            };
        }

        return null;
    },

    // Handle game over
    handleGameOver: (result) => {
        Game.pause();

        const message = result.type === 'victory'
            ? `SURVIVAL\n\n${result.reason}\n\nDays Survived: ${result.stats.daysSurvived}\nCasualties: ${result.stats.totalDeaths}`
            : `DEFEAT\n\n${result.reason}\n\nDays Survived: ${result.stats.daysSurvived}\nTotal Deaths: ${result.stats.totalDeaths}`;

        // Show game over modal (simplified - could be enhanced)
        alert(message);

        // Return to title
        UI.showScreen('title');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.OUT_OF_ORDER) return; // lockout — see FIX-PLAN.md
    Game.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
}
