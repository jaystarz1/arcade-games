// Ice Breaker: Arctic Survival - Resource Management System

const Resources = {
    // Resource consumption rates (% per day under normal conditions)
    BASE_CONSUMPTION: {
        food: 1.0,           // ~100 days of supplies
        fuel: 0.8,           // Ship fuel
        medical: 0.2,        // Base medical consumption
        batteries: 1.5,      // High consumption in cold
        freshWater: 0.5,     // Melted from ice
        heatingFuel: 2.0     // Critical - high consumption
    },

    // Temperature modifiers for consumption
    TEMP_MODIFIERS: {
        food: {      // Colder = more calories needed
            above_minus10: 1.0,
            minus10_to_minus20: 1.2,
            minus20_to_minus30: 1.4,
            minus30_to_minus40: 1.6,
            below_minus40: 2.0
        },
        heatingFuel: {  // Colder = more fuel to maintain temp
            above_minus10: 0.5,
            minus10_to_minus20: 1.0,
            minus20_to_minus30: 1.5,
            minus30_to_minus40: 2.5,
            below_minus40: 4.0
        },
        batteries: {  // Colder = faster drain
            above_minus10: 1.0,
            minus10_to_minus20: 1.3,
            minus20_to_minus30: 1.8,
            minus30_to_minus40: 2.5,
            below_minus40: 3.5
        }
    },

    // Resource thresholds for warnings
    THRESHOLDS: {
        low: 30,
        critical: 15,
        depleted: 0
    },

    // Initialize resources
    init: () => {
        // Resources are initialized in GameState.createNew()
    },

    // Get temperature modifier category
    getTempCategory: (temp) => {
        if (temp > -10) return 'above_minus10';
        if (temp > -20) return 'minus10_to_minus20';
        if (temp > -30) return 'minus20_to_minus30';
        if (temp > -40) return 'minus30_to_minus40';
        return 'below_minus40';
    },

    // Calculate daily consumption for a resource
    calculateConsumption: (resourceType) => {
        const state = GameState.current;
        const baseRate = Resources.BASE_CONSUMPTION[resourceType] || 1.0;
        const temp = state.environment.temperature;
        const tempCategory = Resources.getTempCategory(temp);

        // Get temperature modifier if applicable
        const tempMods = Resources.TEMP_MODIFIERS[resourceType];
        const tempModifier = tempMods ? (tempMods[tempCategory] || 1.0) : 1.0;

        // Personnel modifier (more people = more consumption)
        const personnel = state.personnel.chinese;
        const activePersonnel = personnel.fit + personnel.earlyFrostbite;
        const personnelModifier = activePersonnel / 1000; // Normalized to full complement

        // Calculate final consumption
        let consumption = baseRate * tempModifier * personnelModifier;

        // Medical consumption increases with casualties
        if (resourceType === 'medical') {
            const casualties = personnel.earlyFrostbite + personnel.severeFrostbite + personnel.critical;
            consumption += (casualties / 100) * 0.5; // Extra 0.5% per 100 casualties
        }

        return consumption;
    },

    // Consume resources for one day
    consumeDaily: () => {
        const state = GameState.current;
        const resources = state.resources;
        const events = [];

        for (const [resource, currentLevel] of Object.entries(resources)) {
            const consumption = Resources.calculateConsumption(resource);
            const newLevel = Math.max(0, currentLevel - consumption);

            // Check for threshold crossings
            if (currentLevel > Resources.THRESHOLDS.low && newLevel <= Resources.THRESHOLDS.low) {
                events.push({
                    type: 'resource_low',
                    resource: resource,
                    level: newLevel
                });
            }
            if (currentLevel > Resources.THRESHOLDS.critical && newLevel <= Resources.THRESHOLDS.critical) {
                events.push({
                    type: 'resource_critical',
                    resource: resource,
                    level: newLevel
                });
            }
            if (currentLevel > 0 && newLevel <= 0) {
                events.push({
                    type: 'resource_depleted',
                    resource: resource
                });
            }

            resources[resource] = newLevel;
        }

        // Emit events
        events.forEach(event => {
            if (GameState.events) {
                GameState.events.emit('resourceEvent', event);
            }
        });

        return events;
    },

    // Add resources (from supply drops, scavenging, etc.)
    addResource: (resourceType, amount) => {
        const state = GameState.current;
        if (state.resources.hasOwnProperty(resourceType)) {
            state.resources[resourceType] = Math.min(100, state.resources[resourceType] + amount);
            return true;
        }
        return false;
    },

    // Get resource status for display
    getStatus: (resourceType) => {
        const state = GameState.current;
        const level = state.resources[resourceType];

        let status = 'normal';
        if (level <= Resources.THRESHOLDS.depleted) status = 'depleted';
        else if (level <= Resources.THRESHOLDS.critical) status = 'critical';
        else if (level <= Resources.THRESHOLDS.low) status = 'low';

        return {
            level: Math.round(level),
            status: status,
            consumption: Resources.calculateConsumption(resourceType),
            daysRemaining: level / Resources.calculateConsumption(resourceType)
        };
    },

    // Get all resources summary
    getAllStatus: () => {
        const state = GameState.current;
        const summary = {};

        for (const resource of Object.keys(state.resources)) {
            summary[resource] = Resources.getStatus(resource);
        }

        return summary;
    },

    // Check if heating is possible
    canHeat: () => {
        const state = GameState.current;
        return state.resources.heatingFuel > 0 || state.resources.fuel > 5;
    },

    // Calculate morale impact from resource levels
    getMoraleImpact: () => {
        const state = GameState.current;
        const resources = state.resources;
        let impact = 0;

        // Food impacts morale significantly
        if (resources.food < 50) impact -= (50 - resources.food) * 0.2;
        if (resources.food < 20) impact -= 10; // Additional penalty for starvation

        // Heating fuel is critical for morale
        if (resources.heatingFuel < 30) impact -= (30 - resources.heatingFuel) * 0.3;

        // Medical supplies affect confidence
        if (resources.medical < 40) impact -= (40 - resources.medical) * 0.1;

        return Math.round(impact);
    },

    // Estimate days until crisis
    getDaysUntilCrisis: () => {
        const state = GameState.current;
        let minDays = Infinity;
        let criticalResource = null;

        for (const [resource, level] of Object.entries(state.resources)) {
            const consumption = Resources.calculateConsumption(resource);
            const daysLeft = level / consumption;

            if (daysLeft < minDays) {
                minDays = daysLeft;
                criticalResource = resource;
            }
        }

        return {
            days: Math.floor(minDays),
            resource: criticalResource
        };
    },

    // Resource-related decisions
    getConservationOptions: () => {
        const state = GameState.current;
        const options = [];

        // Ration food
        if (state.resources.food < 50) {
            options.push({
                id: 'ration_food',
                name: 'Ration Food',
                effect: 'Reduces food consumption by 30%, morale drops 10%',
                resourceSaved: 'food',
                savingsRate: 0.3,
                moraleCost: 10
            });
        }

        // Reduce heating
        if (state.resources.heatingFuel < 40) {
            options.push({
                id: 'reduce_heating',
                name: 'Reduce Heating',
                effect: 'Reduces heating fuel by 40%, increases frostbite risk',
                resourceSaved: 'heatingFuel',
                savingsRate: 0.4,
                healthCost: 'frostbite_risk'
            });
        }

        // Power conservation
        if (state.resources.batteries < 30) {
            options.push({
                id: 'power_conservation',
                name: 'Power Conservation',
                effect: 'Reduces battery drain by 50%, limits communications',
                resourceSaved: 'batteries',
                savingsRate: 0.5,
                operationalCost: 'limited_comms'
            });
        }

        return options;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Resources;
}
