// Ice Breaker: Arctic Survival - Personnel & Frostbite System

const Personnel = {
    // Frostbite progression times based on temperature (in hours of exposure)
    FROSTBITE_TIMES: {
        above_minus10: { early: Infinity, severe: Infinity, death: Infinity },
        minus10_to_minus20: { early: 4, severe: 8, death: 24 },
        minus20_to_minus30: { early: 1, severe: 4, death: 12 },
        minus30_to_minus40: { early: 0.5, severe: 2, death: 6 },
        minus40_to_minus50: { early: 0.25, severe: 1, death: 3 },
        below_minus50: { early: 0.15, severe: 0.5, death: 1.5 }
    },

    // Equipment quality factors (Chinese Marines have tropical gear)
    EQUIPMENT_FACTORS: {
        tropical: 0.2,      // Almost no protection
        inadequate: 0.4,    // Some winter gear, insufficient
        standard: 0.7,      // Standard Arctic gear
        excellent: 0.9      // Full Arctic operations kit
    },

    // Morale states
    MORALE_STATES: {
        excellent: { min: 80, name: 'Excellent', modifier: 1.2 },
        good: { min: 60, name: 'Good', modifier: 1.0 },
        shaky: { min: 40, name: 'Shaky', modifier: 0.8 },
        poor: { min: 20, name: 'Poor', modifier: 0.6 },
        broken: { min: 0, name: 'Broken', modifier: 0.3 }
    },

    // Initialize personnel system
    init: () => {
        // Personnel data is in GameState
    },

    // Get temperature category
    getTempCategory: (temp) => {
        if (temp > -10) return 'above_minus10';
        if (temp > -20) return 'minus10_to_minus20';
        if (temp > -30) return 'minus20_to_minus30';
        if (temp > -40) return 'minus30_to_minus40';
        if (temp > -50) return 'minus40_to_minus50';
        return 'below_minus50';
    },

    // Calculate exposure risk for personnel outside
    calculateExposureRisk: (faction, hoursExposed) => {
        const state = GameState.current;
        const temp = state.environment.windChill;
        const tempCategory = Personnel.getTempCategory(temp);
        const times = Personnel.FROSTBITE_TIMES[tempCategory];

        // Equipment factor (Chinese Marines have tropical gear!)
        const equipFactor = faction === 'chinese'
            ? Personnel.EQUIPMENT_FACTORS.tropical
            : Personnel.EQUIPMENT_FACTORS.standard;

        // Effective protection reduces exposure time needed
        const effectiveHours = hoursExposed / equipFactor;

        // Calculate casualties at each severity level
        let newEarlyFrostbite = 0;
        let newSevereFrostbite = 0;
        let newCritical = 0;
        let deaths = 0;

        if (effectiveHours >= times.early && times.early !== Infinity) {
            // Some people get early frostbite
            newEarlyFrostbite = Math.floor((effectiveHours / times.early) * 5);
        }
        if (effectiveHours >= times.severe && times.severe !== Infinity) {
            newSevereFrostbite = Math.floor((effectiveHours / times.severe) * 3);
        }
        if (effectiveHours >= times.death && times.death !== Infinity) {
            newCritical = Math.floor((effectiveHours / times.death) * 2);
            deaths = Math.floor((effectiveHours / times.death) * 0.5);
        }

        return {
            earlyFrostbite: newEarlyFrostbite,
            severeFrostbite: newSevereFrostbite,
            critical: newCritical,
            deaths: deaths
        };
    },

    // Process daily personnel updates
    processDailyUpdate: (faction = 'chinese') => {
        const state = GameState.current;
        const personnel = state.personnel[faction];
        const events = [];

        // Calculate exposure (assuming some personnel must work outside)
        const outsideHours = Personnel.calculateRequiredExposure(state);
        const casualties = Personnel.calculateExposureRisk(faction, outsideHours);

        // Apply casualties from exposure
        if (casualties.earlyFrostbite > 0) {
            const actual = Math.min(casualties.earlyFrostbite, personnel.fit);
            personnel.fit -= actual;
            personnel.earlyFrostbite += actual;
            if (actual > 0) {
                events.push({ type: 'frostbite_early', count: actual, faction });
            }
        }

        // Progress existing frostbite cases
        const progressEvents = Personnel.progressFrostbiteCases(faction);
        events.push(...progressEvents);

        // Natural deaths from critical cases
        if (personnel.critical > 0) {
            const deathRate = state.resources.medical > 20 ? 0.05 : 0.15;
            const naturalDeaths = Math.floor(personnel.critical * deathRate);
            if (naturalDeaths > 0) {
                personnel.critical -= naturalDeaths;
                personnel.dead += naturalDeaths;
                events.push({ type: 'death_medical', count: naturalDeaths, faction });
            }
        }

        // Recovery (with medical supplies)
        if (state.resources.medical > 10) {
            const recoveryRate = state.resources.medical > 50 ? 0.1 : 0.05;
            const recovered = Math.floor(personnel.earlyFrostbite * recoveryRate);
            if (recovered > 0) {
                personnel.earlyFrostbite -= recovered;
                personnel.fit += recovered;
                events.push({ type: 'recovery', count: recovered, faction });
            }
        }

        // Update morale
        Personnel.updateMorale(faction, events);

        // Emit events
        events.forEach(event => {
            if (GameState.events) {
                GameState.events.emit('personnelEvent', event);
            }
        });

        return events;
    },

    // Calculate required outside exposure (maintenance, operations, etc.)
    calculateRequiredExposure: (state) => {
        let hours = 0.5; // Minimum maintenance

        // Weather affects how much outside work is needed
        const weather = state.environment.weather;
        if (weather === 'blizzard' || weather === 'whiteout') {
            hours = 0; // No one goes outside in blizzard
        } else if (weather === 'heavy_snow') {
            hours = 0.25;
        }

        // More exposure needed during certain phases
        if (state.phase === 'death_march') {
            hours = 8; // Full day of travel
        }

        // Heating system maintenance
        if (state.resources.heatingFuel < 30) {
            hours += 0.5; // Extra work to maintain heat
        }

        return hours;
    },

    // Progress frostbite cases to worse states
    progressFrostbiteCases: (faction) => {
        const state = GameState.current;
        const personnel = state.personnel[faction];
        const events = [];

        // Early -> Severe (without treatment)
        if (personnel.earlyFrostbite > 0 && state.resources.medical < 30) {
            const progress = Math.floor(personnel.earlyFrostbite * 0.1);
            if (progress > 0) {
                personnel.earlyFrostbite -= progress;
                personnel.severeFrostbite += progress;
                events.push({ type: 'frostbite_worsened', from: 'early', to: 'severe', count: progress, faction });
            }
        }

        // Severe -> Critical
        if (personnel.severeFrostbite > 0) {
            const progressRate = state.resources.medical > 20 ? 0.05 : 0.15;
            const progress = Math.floor(personnel.severeFrostbite * progressRate);
            if (progress > 0) {
                personnel.severeFrostbite -= progress;
                personnel.critical += progress;
                events.push({ type: 'frostbite_worsened', from: 'severe', to: 'critical', count: progress, faction });
            }
        }

        return events;
    },

    // Update morale based on conditions
    updateMorale: (faction, dailyEvents) => {
        const state = GameState.current;
        const personnel = state.personnel[faction];
        let moraleChange = 0;

        // Deaths severely impact morale
        const deaths = dailyEvents.filter(e => e.type.includes('death')).reduce((sum, e) => sum + e.count, 0);
        moraleChange -= deaths * 2;

        // Casualties impact morale
        const injuries = dailyEvents.filter(e => e.type.includes('frostbite')).reduce((sum, e) => sum + e.count, 0);
        moraleChange -= injuries * 0.5;

        // Resource impacts
        moraleChange += Resources.getMoraleImpact() * 0.1;

        // Polar night impacts morale
        if (state.environment.daylight === 0) {
            moraleChange -= 1;
        }

        // Leadership events can boost morale (to be implemented in narrative)
        if (GameState.hasFlag('leadership_speech')) {
            moraleChange += 5;
            GameState.setFlag('leadership_speech', false); // One-time bonus
        }

        // Apply change with bounds
        personnel.morale = Utils.clamp(personnel.morale + moraleChange, 0, 100);

        // Emit morale change event if significant
        if (Math.abs(moraleChange) >= 5) {
            if (GameState.events) {
                GameState.events.emit('moraleChange', {
                    faction,
                    change: moraleChange,
                    newMorale: personnel.morale
                });
            }
        }
    },

    // Get morale state
    getMoraleState: (faction = 'chinese') => {
        const morale = GameState.current.personnel[faction].morale;
        for (const [key, state] of Object.entries(Personnel.MORALE_STATES)) {
            if (morale >= state.min) {
                return { id: key, ...state, value: morale };
            }
        }
        return { id: 'broken', ...Personnel.MORALE_STATES.broken, value: morale };
    },

    // Get personnel summary for UI
    getSummary: (faction = 'chinese') => {
        const state = GameState.current;
        const p = state.personnel[faction];
        const moraleState = Personnel.getMoraleState(faction);

        return {
            total: p.total,
            fit: p.fit,
            earlyFrostbite: p.earlyFrostbite,
            severeFrostbite: p.severeFrostbite,
            critical: p.critical,
            dead: p.dead,
            effectiveStrength: p.fit + Math.floor(p.earlyFrostbite * 0.5),
            casualties: p.earlyFrostbite + p.severeFrostbite + p.critical + p.dead,
            casualtyRate: Math.round(((p.total - p.fit) / p.total) * 100),
            morale: moraleState,
            frostbiteRisk: Personnel.getCurrentFrostbiteRisk(faction)
        };
    },

    // Get current frostbite risk level
    getCurrentFrostbiteRisk: (faction) => {
        const state = GameState.current;
        const temp = state.environment.windChill;
        const equipFactor = faction === 'chinese'
            ? Personnel.EQUIPMENT_FACTORS.tropical
            : Personnel.EQUIPMENT_FACTORS.standard;

        const effectiveTemp = temp / equipFactor; // How cold it "feels" with their gear

        if (effectiveTemp > -20) return { level: 'low', color: 'green' };
        if (effectiveTemp > -40) return { level: 'moderate', color: 'yellow' };
        if (effectiveTemp > -80) return { level: 'high', color: 'orange' };
        return { level: 'extreme', color: 'red' };
    },

    // Calculate survival probability for evacuation/march
    calculateSurvivalProbability: (distance, conditions) => {
        const state = GameState.current;
        const personnel = state.personnel.chinese;

        // Base survival rate
        let survival = 1.0;

        // Distance factor (400nm is brutal)
        survival *= Math.exp(-distance / 500);

        // Temperature factor
        const temp = state.environment.windChill;
        if (temp < -30) survival *= 0.9;
        if (temp < -40) survival *= 0.7;
        if (temp < -50) survival *= 0.5;

        // Equipment factor (tropical gear is deadly)
        survival *= Personnel.EQUIPMENT_FACTORS.tropical + 0.2;

        // Resource factor
        const avgResources = (state.resources.food + state.resources.heatingFuel) / 2;
        survival *= (avgResources / 100) * 0.5 + 0.5;

        // Morale factor
        survival *= personnel.morale / 100 * 0.3 + 0.7;

        return Math.max(0.1, Math.min(0.95, survival));
    },

    // Get death march projection
    getDeathMarchProjection: () => {
        const state = GameState.current;
        const personnel = state.personnel.chinese;
        const survival = Personnel.calculateSurvivalProbability(740, state); // 400nm = 740km

        const projected = {
            startingStrength: personnel.fit + personnel.earlyFrostbite,
            expectedSurvivors: Math.floor((personnel.fit + personnel.earlyFrostbite) * survival),
            expectedDeaths: Math.floor((personnel.fit + personnel.earlyFrostbite) * (1 - survival)),
            daysRequired: Math.ceil(740 / 12), // ~12km per day realistic pace
            survivalRate: Math.round(survival * 100)
        };

        return projected;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Personnel;
}
