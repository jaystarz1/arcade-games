// Ice Breaker: Arctic Survival - Environment System

const Environment = {
    // Weather types
    WEATHER: {
        CLEAR: {
            id: 'clear',
            name: 'Clear',
            visibility: 'good',
            tempModifier: 0,
            windModifier: 0,
            travelModifier: 1.0,
            description: 'Clear skies, good visibility'
        },
        OVERCAST: {
            id: 'overcast',
            name: 'Overcast',
            visibility: 'moderate',
            tempModifier: 2,     // Slightly warmer
            windModifier: 0,
            travelModifier: 0.9,
            description: 'Heavy cloud cover, reduced visibility'
        },
        LIGHT_SNOW: {
            id: 'light_snow',
            name: 'Light Snow',
            visibility: 'moderate',
            tempModifier: 0,
            windModifier: 5,
            travelModifier: 0.7,
            description: 'Light snowfall, visibility reduced'
        },
        HEAVY_SNOW: {
            id: 'heavy_snow',
            name: 'Heavy Snow',
            visibility: 'poor',
            tempModifier: -2,
            windModifier: 10,
            travelModifier: 0.4,
            description: 'Heavy snowfall, dangerous conditions'
        },
        BLIZZARD: {
            id: 'blizzard',
            name: 'Blizzard',
            visibility: 'zero',
            tempModifier: -5,
            windModifier: 30,
            travelModifier: 0,    // No travel possible
            description: 'Whiteout conditions, extreme danger'
        },
        WHITEOUT: {
            id: 'whiteout',
            name: 'Whiteout',
            visibility: 'zero',
            tempModifier: -3,
            windModifier: 20,
            travelModifier: 0,
            description: 'Complete loss of visual reference'
        },
        FOG: {
            id: 'fog',
            name: 'Ice Fog',
            visibility: 'poor',
            tempModifier: 0,
            windModifier: -10,   // Less wind
            travelModifier: 0.5,
            description: 'Thick ice fog, very low visibility'
        }
    },

    // Ice conditions
    ICE_CONDITIONS: {
        FORMING: {
            id: 'forming',
            name: 'Forming',
            thickness: 'thin',
            travelSafe: false,
            shipMovement: 'restricted',
            description: 'New ice forming, unstable'
        },
        THIN: {
            id: 'thin',
            name: 'Thin Ice',
            thickness: 'thin',
            travelSafe: false,
            shipMovement: 'possible',
            description: 'First-year ice, unreliable for foot travel'
        },
        CONSOLIDATING: {
            id: 'consolidating',
            name: 'Consolidating',
            thickness: 'medium',
            travelSafe: true,
            shipMovement: 'difficult',
            description: 'Ice thickening, becoming stable'
        },
        SOLID: {
            id: 'solid',
            name: 'Solid Pack',
            thickness: 'thick',
            travelSafe: true,
            shipMovement: 'trapped',
            description: 'Multi-year ice, ships frozen in place'
        },
        PRESSURE: {
            id: 'pressure',
            name: 'Pressure Building',
            thickness: 'thick',
            travelSafe: true,
            shipMovement: 'trapped',
            description: 'Ice under pressure, hull damage risk'
        },
        THAWING: {
            id: 'thawing',
            name: 'Thawing',
            thickness: 'variable',
            travelSafe: false,
            shipMovement: 'dangerous',
            description: 'Ice breaking up, extreme danger'
        },
        BREAKUP: {
            id: 'breakup',
            name: 'Breaking Up',
            thickness: 'variable',
            travelSafe: false,
            shipMovement: 'deadly',
            description: 'Ice floes separating, travel impossible'
        }
    },

    // Base temperatures by month (°C at 69°N)
    BASE_TEMPS: {
        9: { min: -5, max: 0 },      // September
        10: { min: -15, max: -5 },   // October
        11: { min: -25, max: -15 },  // November
        12: { min: -35, max: -25 },  // December
        1: { min: -40, max: -30 },   // January (coldest)
        2: { min: -35, max: -25 },   // February
        3: { min: -25, max: -15 },   // March
        4: { min: -15, max: -5 }     // April
    },

    // Initialize environment
    init: () => {
        Environment.updateAll();
    },

    // Update all environment factors
    updateAll: () => {
        const state = GameState.current;
        if (!state) return;

        Environment.updateTemperature();
        Environment.updateWeather();
        Environment.updateDaylight();
        Environment.updateIceCondition();
    },

    // Update temperature based on date and conditions
    updateTemperature: () => {
        const state = GameState.current;
        const month = Utils.getMonth(state.day);
        const baseTemps = Environment.BASE_TEMPS[month] || { min: -20, max: -10 };

        // Base temperature with daily variation
        const hourFactor = Math.sin((state.hour - 6) * Math.PI / 12);
        const tempRange = baseTemps.max - baseTemps.min;
        let temp = baseTemps.min + (tempRange * (hourFactor + 1) / 2);

        // Add random daily variation
        temp += Utils.randomFloat(-3, 3);

        // Weather modifier
        const weather = Environment.WEATHER[state.environment.weather.toUpperCase()] ||
                       Environment.WEATHER.CLEAR;
        temp += weather.tempModifier;

        // Round and clamp
        state.environment.temperature = Math.round(Utils.clamp(temp, -60, 5));

        // Update wind chill
        const windChill = Utils.calculateWindChill(
            state.environment.temperature,
            state.environment.windSpeed
        );
        state.environment.windChill = windChill;
    },

    // Update weather (stochastic based on conditions)
    updateWeather: () => {
        const state = GameState.current;
        const currentWeather = state.environment.weather;
        const month = Utils.getMonth(state.day);

        // Weather transition probabilities (simplified)
        const transitions = {
            clear: [
                { value: 'clear', weight: 60 },
                { value: 'overcast', weight: 25 },
                { value: 'light_snow', weight: 10 },
                { value: 'fog', weight: 5 }
            ],
            overcast: [
                { value: 'overcast', weight: 40 },
                { value: 'clear', weight: 20 },
                { value: 'light_snow', weight: 25 },
                { value: 'heavy_snow', weight: 10 },
                { value: 'fog', weight: 5 }
            ],
            light_snow: [
                { value: 'light_snow', weight: 40 },
                { value: 'overcast', weight: 25 },
                { value: 'heavy_snow', weight: 20 },
                { value: 'clear', weight: 10 },
                { value: 'blizzard', weight: 5 }
            ],
            heavy_snow: [
                { value: 'heavy_snow', weight: 35 },
                { value: 'light_snow', weight: 25 },
                { value: 'blizzard', weight: 25 },
                { value: 'overcast', weight: 10 },
                { value: 'whiteout', weight: 5 }
            ],
            blizzard: [
                { value: 'blizzard', weight: 30 },
                { value: 'heavy_snow', weight: 35 },
                { value: 'whiteout', weight: 20 },
                { value: 'light_snow', weight: 15 }
            ],
            whiteout: [
                { value: 'whiteout', weight: 25 },
                { value: 'blizzard', weight: 30 },
                { value: 'heavy_snow', weight: 30 },
                { value: 'overcast', weight: 15 }
            ],
            fog: [
                { value: 'fog', weight: 40 },
                { value: 'clear', weight: 30 },
                { value: 'overcast', weight: 20 },
                { value: 'light_snow', weight: 10 }
            ]
        };

        // Only update weather periodically (every 6 hours or so)
        if (state.hour % 6 !== 0) return;

        // Increase storm chances in winter
        let options = transitions[currentWeather] || transitions.clear;
        if (month >= 11 || month <= 2) {
            // Winter - boost severe weather
            options = options.map(opt => {
                if (['blizzard', 'heavy_snow', 'whiteout'].includes(opt.value)) {
                    return { ...opt, weight: opt.weight * 1.5 };
                }
                return opt;
            });
        }

        const newWeather = Utils.weightedRandom(options);
        if (newWeather !== currentWeather) {
            state.environment.weather = newWeather;
            const weatherData = Environment.WEATHER[newWeather.toUpperCase()];
            state.environment.visibility = weatherData.visibility;

            // Update wind
            state.environment.windSpeed = Utils.clamp(
                state.environment.windSpeed + weatherData.windModifier + Utils.random(-5, 5),
                0, 80
            );

            // Emit event for UI
            if (GameState.events) {
                GameState.events.emit('weatherChange', weatherData);
            }
        }
    },

    // Update daylight hours
    updateDaylight: () => {
        const state = GameState.current;
        state.environment.daylight = Utils.calculateDaylight(state.day);
    },

    // Update ice conditions based on season
    updateIceCondition: () => {
        const state = GameState.current;
        const month = Utils.getMonth(state.day);
        const day = state.day;

        let iceCondition;

        if (month === 9) {
            iceCondition = day < 20 ? 'forming' : 'thin';
        } else if (month === 10) {
            iceCondition = 'consolidating';
        } else if (month === 11) {
            iceCondition = day < 75 ? 'consolidating' : 'solid';
        } else if (month >= 12 || month <= 1) {
            // Check for pressure events
            if (Utils.random(1, 100) <= 15) {
                iceCondition = 'pressure';
            } else {
                iceCondition = 'solid';
            }
        } else if (month === 2) {
            iceCondition = 'solid';
        } else if (month === 3) {
            iceCondition = day > 200 ? 'thawing' : 'solid';
        } else if (month === 4) {
            iceCondition = day > 220 ? 'breakup' : 'thawing';
        } else {
            iceCondition = 'solid';
        }

        if (iceCondition !== state.environment.iceCondition) {
            state.environment.iceCondition = iceCondition;
            if (GameState.events) {
                GameState.events.emit('iceChange', Environment.ICE_CONDITIONS[iceCondition.toUpperCase()]);
            }
        }
    },

    // Calculate exposure danger level
    getExposureDanger: () => {
        const state = GameState.current;
        const temp = state.environment.windChill;

        if (temp > -10) return { level: 'low', time: 240, desc: 'Low danger, prolonged exposure safe' };
        if (temp > -20) return { level: 'moderate', time: 60, desc: 'Frostbite possible in 30-60 minutes' };
        if (temp > -30) return { level: 'high', time: 30, desc: 'Frostbite likely in 10-30 minutes' };
        if (temp > -40) return { level: 'severe', time: 10, desc: 'Frostbite in under 10 minutes' };
        if (temp > -50) return { level: 'extreme', time: 5, desc: 'Frostbite in under 5 minutes' };
        return { level: 'deadly', time: 2, desc: 'Exposed flesh freezes in minutes' };
    },

    // Check if outdoor operations are possible
    canOperateOutdoors: () => {
        const state = GameState.current;
        const weather = Environment.WEATHER[state.environment.weather.toUpperCase()];
        const danger = Environment.getExposureDanger();

        return {
            possible: weather.travelModifier > 0 && danger.level !== 'deadly',
            efficiency: weather.travelModifier,
            visibility: weather.visibility,
            danger: danger.level,
            reason: weather.travelModifier === 0
                ? `${weather.name} prevents outdoor operations`
                : danger.level === 'deadly'
                    ? 'Temperature too dangerous for exposure'
                    : null
        };
    },

    // Get environment summary for UI
    getSummary: () => {
        const state = GameState.current;
        const env = state.environment;
        const danger = Environment.getExposureDanger();
        const outdoor = Environment.canOperateOutdoors();

        return {
            temperature: env.temperature,
            windChill: env.windChill,
            weather: Environment.WEATHER[env.weather.toUpperCase()],
            daylight: env.daylight,
            ice: Environment.ICE_CONDITIONS[env.iceCondition.toUpperCase()],
            exposure: danger,
            operations: outdoor,
            polarNight: env.daylight === 0
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Environment;
}
