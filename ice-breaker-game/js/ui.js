// Ice Breaker: Arctic Survival - UI System

const UI = {
    // Screen management
    screens: {
        title: document.getElementById('title-screen'),
        scenario: document.getElementById('scenario-screen'),
        game: document.getElementById('game-screen')
    },

    // UI elements cache
    elements: {},

    // Initialize UI
    init: () => {
        UI.cacheElements();
        UI.setupEventListeners();
        UI.showScreen('title');
    },

    // Cache DOM elements for performance
    cacheElements: () => {
        UI.elements = {
            // Top bar
            phaseName: document.querySelector('.phase-name'),
            phaseDate: document.querySelector('.phase-date'),
            currentDate: document.getElementById('current-date'),
            currentPerspective: document.getElementById('current-perspective'),

            // Time controls
            btnPause: document.getElementById('btn-pause'),
            btnPlay: document.getElementById('btn-play'),
            btnFast: document.getElementById('btn-fast'),

            // Environment
            statTemp: document.getElementById('stat-temp'),
            statWindchill: document.getElementById('stat-windchill'),
            statWeather: document.getElementById('stat-weather'),
            statDaylight: document.getElementById('stat-daylight'),
            statIce: document.getElementById('stat-ice'),

            // Resources
            barFood: document.getElementById('bar-food'),
            barFuel: document.getElementById('bar-fuel'),
            barMedical: document.getElementById('bar-medical'),
            barBatteries: document.getElementById('bar-batteries'),
            valFood: document.getElementById('val-food'),
            valFuel: document.getElementById('val-fuel'),
            valMedical: document.getElementById('val-medical'),
            valBatteries: document.getElementById('val-batteries'),

            // Personnel
            personnelFit: document.getElementById('personnel-fit'),
            personnelFrostbite: document.getElementById('personnel-frostbite'),
            personnelCritical: document.getElementById('personnel-critical'),
            personnelDead: document.getElementById('personnel-dead'),
            statMorale: document.getElementById('stat-morale'),

            // Equipment
            equipmentList: document.getElementById('equipment-list'),

            // Narrative
            narrativeLog: document.getElementById('narrative-log'),
            decisionArea: document.getElementById('decision-area'),
            decisionPrompt: document.getElementById('decision-prompt'),
            decisionOptions: document.getElementById('decision-options'),

            // Modals
            eventModal: document.getElementById('event-modal'),
            eventTitle: document.getElementById('event-title'),
            eventBody: document.getElementById('event-body'),
            eventChoices: document.getElementById('event-choices'),
            perspectiveModal: document.getElementById('perspective-modal'),
            perspectiveInfo: document.getElementById('perspective-info'),

            // Scenario screen
            scenarioList: document.getElementById('scenario-list')
        };
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Title screen buttons
        document.getElementById('btn-new-game')?.addEventListener('click', () => {
            Game.newGame('canon');
        });

        document.getElementById('btn-continue')?.addEventListener('click', () => {
            if (GameState.load()) {
                UI.showScreen('game');
                Game.resume();
            }
        });

        document.getElementById('btn-scenarios')?.addEventListener('click', () => {
            UI.showScenarioScreen();
        });

        document.getElementById('btn-back-title')?.addEventListener('click', () => {
            UI.showScreen('title');
        });

        // Time controls
        UI.elements.btnPause?.addEventListener('click', () => {
            Game.setSpeed(GameState.SPEEDS.PAUSED);
            UI.updateTimeControls();
        });

        UI.elements.btnPlay?.addEventListener('click', () => {
            Game.setSpeed(GameState.SPEEDS.NORMAL);
            UI.updateTimeControls();
        });

        UI.elements.btnFast?.addEventListener('click', () => {
            Game.setSpeed(GameState.SPEEDS.FAST);
            UI.updateTimeControls();
        });

        // Perspective accept button
        document.getElementById('btn-accept-perspective')?.addEventListener('click', () => {
            UI.hideModal('perspective');
        });

        // Subscribe to game events
        if (GameState.events) {
            GameState.events.on('timeAdvance', UI.updateTime);
            GameState.events.on('phaseChange', UI.updatePhase);
            GameState.events.on('logEntry', UI.addLogEntry);
            GameState.events.on('perspectiveChange', UI.onPerspectiveChange);
            GameState.events.on('resourceEvent', UI.onResourceEvent);
            GameState.events.on('weatherChange', UI.onWeatherChange);
        }
    },

    // Show a screen
    showScreen: (screenName) => {
        Object.values(UI.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });

        const screen = UI.screens[screenName];
        if (screen) screen.classList.add('active');

        // Update continue button state
        const btnContinue = document.getElementById('btn-continue');
        if (btnContinue) {
            btnContinue.disabled = !GameState.hasSave();
        }
    },

    // Show scenario selection screen
    showScenarioScreen: () => {
        const list = UI.elements.scenarioList;
        if (!list) return;

        list.innerHTML = '';

        const scenarios = Scenarios.getAvailable();
        scenarios.forEach(scenario => {
            const card = document.createElement('div');
            card.className = 'scenario-card';
            card.innerHTML = `
                <h3>${scenario.name}</h3>
                <p>${scenario.description}</p>
            `;
            card.addEventListener('click', () => {
                Game.newGame(scenario.id);
            });
            list.appendChild(card);
        });

        UI.showScreen('scenario');
    },

    // Update all UI elements
    updateAll: () => {
        UI.updateTime();
        UI.updateEnvironment();
        UI.updateResources();
        UI.updatePersonnel();
        UI.updateEquipment();
        UI.updatePerspective();
    },

    // Update time display
    updateTime: () => {
        const state = GameState.current;
        if (!state) return;

        const dateStr = Utils.formatDate(state.day);
        if (UI.elements.currentDate) {
            UI.elements.currentDate.textContent = `Day ${state.day} - ${dateStr}`;
        }

        // Update phase display
        const phase = GameState.getCurrentPhase();
        if (UI.elements.phaseName) {
            UI.elements.phaseName.textContent = phase.name;
        }
        if (UI.elements.phaseDate) {
            UI.elements.phaseDate.textContent = dateStr;
        }
    },

    // Update phase display
    updatePhase: (phase) => {
        if (UI.elements.phaseName) {
            UI.elements.phaseName.textContent = phase.name;
        }

        // Log phase change
        GameState.addLog(`Phase Change: ${phase.name} - ${phase.description}`, 'important');
    },

    // Update environment display
    updateEnvironment: () => {
        const state = GameState.current;
        if (!state) return;

        const env = state.environment;
        const danger = Environment.getExposureDanger();

        // Temperature
        if (UI.elements.statTemp) {
            UI.elements.statTemp.textContent = Utils.formatTemp(env.temperature);
            UI.elements.statTemp.className = 'stat-value' +
                (env.temperature < -30 ? ' danger' : env.temperature < -20 ? ' warning' : ' cold');
        }

        // Wind chill
        if (UI.elements.statWindchill) {
            UI.elements.statWindchill.textContent = Utils.formatTemp(env.windChill);
            UI.elements.statWindchill.className = 'stat-value' +
                (env.windChill < -40 ? ' danger' : env.windChill < -25 ? ' warning' : ' cold');
        }

        // Weather
        if (UI.elements.statWeather) {
            const weather = Environment.WEATHER[env.weather.toUpperCase()];
            UI.elements.statWeather.textContent = weather?.name || env.weather;
        }

        // Daylight
        if (UI.elements.statDaylight) {
            UI.elements.statDaylight.textContent = env.daylight === 0 ? 'Polar Night' : `${env.daylight} hours`;
            UI.elements.statDaylight.className = 'stat-value' + (env.daylight === 0 ? ' danger' : '');
        }

        // Ice condition
        if (UI.elements.statIce) {
            const ice = Environment.ICE_CONDITIONS[env.iceCondition.toUpperCase()];
            UI.elements.statIce.textContent = ice?.name || env.iceCondition;
        }
    },

    // Update resources display
    updateResources: () => {
        const state = GameState.current;
        if (!state) return;

        const resources = state.resources;

        // Update each resource bar
        UI.updateResourceBar('food', resources.food);
        UI.updateResourceBar('fuel', resources.fuel);
        UI.updateResourceBar('medical', resources.medical);
        UI.updateResourceBar('batteries', resources.batteries);
    },

    // Update single resource bar
    updateResourceBar: (resource, value) => {
        const bar = UI.elements[`bar${resource.charAt(0).toUpperCase() + resource.slice(1)}`];
        const val = UI.elements[`val${resource.charAt(0).toUpperCase() + resource.slice(1)}`];

        if (bar) {
            bar.style.width = `${value}%`;
            bar.className = 'bar-fill' +
                (value <= 15 ? ' critical' : value <= 30 ? ' low' : '');
        }

        if (val) {
            val.textContent = `${Math.round(value)}%`;
        }
    },

    // Update personnel display
    updatePersonnel: () => {
        const state = GameState.current;
        if (!state) return;

        const personnel = state.personnel.chinese;

        if (UI.elements.personnelFit) {
            UI.elements.personnelFit.textContent = personnel.fit;
        }
        if (UI.elements.personnelFrostbite) {
            UI.elements.personnelFrostbite.textContent =
                personnel.earlyFrostbite + personnel.severeFrostbite;
        }
        if (UI.elements.personnelCritical) {
            UI.elements.personnelCritical.textContent = personnel.critical;
        }
        if (UI.elements.personnelDead) {
            UI.elements.personnelDead.textContent = personnel.dead;
        }

        // Morale
        if (UI.elements.statMorale) {
            const moraleState = Personnel.getMoraleState('chinese');
            UI.elements.statMorale.textContent = moraleState.name;
            UI.elements.statMorale.className = 'stat-value' +
                (moraleState.value < 30 ? ' danger' : moraleState.value < 50 ? ' warning' : '');
        }
    },

    // Update equipment display
    updateEquipment: () => {
        const state = GameState.current;
        if (!state) return;

        const list = UI.elements.equipmentList;
        if (!list) return;

        list.innerHTML = '';

        for (const [name, equipment] of Object.entries(state.equipment)) {
            const item = document.createElement('div');
            item.className = 'equipment-item';
            item.innerHTML = `
                <span class="equipment-name">${name.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span class="equipment-status ${equipment.status}">${equipment.status}</span>
            `;
            list.appendChild(item);
        }
    },

    // Update perspective display
    updatePerspective: () => {
        const character = Characters.getCurrentPerspective();
        if (UI.elements.currentPerspective && character) {
            UI.elements.currentPerspective.textContent = character.name;
        }
    },

    // Update time control buttons
    updateTimeControls: () => {
        const state = GameState.current;
        if (!state) return;

        const speed = state.speed;

        UI.elements.btnPause?.classList.toggle('active', speed === GameState.SPEEDS.PAUSED);
        UI.elements.btnPlay?.classList.toggle('active', speed === GameState.SPEEDS.NORMAL);
        UI.elements.btnFast?.classList.toggle('active', speed === GameState.SPEEDS.FAST);
    },

    // Add entry to narrative log
    addLogEntry: (entry) => {
        const log = UI.elements.narrativeLog;
        if (!log) return;

        const div = document.createElement('div');
        div.className = `log-entry ${entry.type}`;
        div.innerHTML = `
            <span class="log-timestamp">Day ${entry.day}</span>
            <span class="log-text">${entry.text}</span>
        `;

        log.appendChild(div);
        log.scrollTop = log.scrollHeight;

        // Limit log entries
        while (log.children.length > 50) {
            log.removeChild(log.firstChild);
        }
    },

    // Show event modal
    showEvent: (event) => {
        if (!UI.elements.eventModal) return;

        UI.elements.eventTitle.textContent = event.title;
        UI.elements.eventBody.innerHTML = event.text.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>');

        // Clear and populate choices
        UI.elements.eventChoices.innerHTML = '';

        if (event.choices && event.choices.length > 0) {
            event.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.innerHTML = `
                    <span class="choice-label">${choice.text}</span>
                `;
                btn.addEventListener('click', () => {
                    Narrative.processChoice(event, choice.id);
                    UI.hideModal('event');
                    Game.resume();
                });
                UI.elements.eventChoices.appendChild(btn);
            });
        } else {
            // Continue button for narrative-only events
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = '<span class="choice-label">Continue</span>';
            btn.addEventListener('click', () => {
                if (event.effects) {
                    Narrative.processEffects(event.effects);
                }
                UI.hideModal('event');
                Game.resume();
            });
            UI.elements.eventChoices.appendChild(btn);
        }

        UI.elements.eventModal.classList.remove('hidden');
        Game.pause();
    },

    // Show perspective change modal
    showPerspectiveChange: (data) => {
        const newChar = Characters.get(data.to);
        if (!newChar || !UI.elements.perspectiveModal) return;

        UI.elements.perspectiveInfo.innerHTML = `
            <div class="char-name">${newChar.name}</div>
            <div class="char-role">${newChar.role}</div>
            <div class="char-desc">${newChar.description}</div>
        `;

        UI.elements.perspectiveModal.classList.remove('hidden');
    },

    // Hide modal
    hideModal: (type) => {
        const modal = type === 'event' ? UI.elements.eventModal : UI.elements.perspectiveModal;
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Handle perspective change event
    onPerspectiveChange: (data) => {
        UI.updatePerspective();
        UI.showPerspectiveChange(data);
    },

    // Handle resource event
    onResourceEvent: (event) => {
        let message = '';
        switch (event.type) {
            case 'resource_low':
                message = `Warning: ${event.resource} supplies running low (${Math.round(event.level)}%)`;
                break;
            case 'resource_critical':
                message = `CRITICAL: ${event.resource} supplies critically low!`;
                break;
            case 'resource_depleted':
                message = `EMERGENCY: ${event.resource} supplies depleted!`;
                break;
        }

        if (message) {
            GameState.addLog(message, event.type === 'resource_depleted' ? 'danger' : 'important');
        }

        UI.updateResources();
    },

    // Handle weather change
    onWeatherChange: (weather) => {
        GameState.addLog(`Weather changing to ${weather.name}. ${weather.description}`,
            weather.id === 'blizzard' || weather.id === 'whiteout' ? 'danger' : 'normal');
        UI.updateEnvironment();
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
