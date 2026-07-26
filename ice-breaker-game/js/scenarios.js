// Ice Breaker: Arctic Survival - What-If Scenarios

const Scenarios = {
    // Scenario definitions
    data: {
        canon: {
            id: 'canon',
            name: 'Historical Timeline',
            description: 'Experience events as they unfold in the novel. No intervention, no rescue. The full tragedy.',
            startingConditions: {},
            modifiers: {},
            available: true
        },

        call_for_help: {
            id: 'call_for_help',
            name: 'The Call for Help',
            description: 'What if Admiral Chen broke protocol and requested assistance before polar night? China loses face, but rescue becomes possible.',
            divergencePoint: 'Admiral Chen contacts Beijing requesting emergency assistance',
            consequences: [
                'International rescue mission mobilizes',
                'China\'s diplomatic position weakened',
                'Many lives potentially saved',
                'Chen\'s career destroyed'
            ],
            startingConditions: {
                day: 50,
                flags: ['asked_for_help']
            },
            modifiers: {
                rescuePossible: true,
                diplomaticCrisis: true,
                survivalBonus: 0.4
            },
            available: false, // Unlocked by making the choice in-game
            unlockCondition: 'choice:ask_for_help:call_beijing'
        },

        intelligence_leak: {
            id: 'intelligence_leak',
            name: 'The Intelligence Leak',
            description: 'What if Major Webb shared US SIGINT with allies? The truth becomes known, but at what cost?',
            divergencePoint: 'US intelligence is shared through unofficial channels',
            consequences: [
                'Canada can act on complete information',
                'US intelligence sources potentially compromised',
                'Diplomatic back-channel opens',
                'Webb faces court martial'
            ],
            startingConditions: {
                day: 40,
                flags: ['intel_shared']
            },
            modifiers: {
                canadaKnowsTruth: true,
                usSourcesBurned: true,
                diplomaticChannel: true
            },
            available: true
        },

        early_evacuation: {
            id: 'early_evacuation',
            name: 'Early Evacuation',
            description: 'What if evacuation was ordered before polar night, while helicopters could still fly?',
            divergencePoint: 'Evacuation begins in November instead of February',
            consequences: [
                'Air evacuation possible',
                '400nm death march avoided',
                'Ships abandoned to the ice',
                'Significantly fewer casualties'
            ],
            startingConditions: {
                day: 75,
                phase: 'snow_dragon',
                flags: ['early_evac_ordered']
            },
            modifiers: {
                helicoptersAvailable: true,
                deathMarchAvoided: true,
                survivalBonus: 0.6
            },
            available: true
        },

        unofficial_channel: {
            id: 'unofficial_channel',
            name: 'The Unofficial Channel',
            description: 'What if Ranger Joe Iqaluk made contact with Chinese scouts? Ground-level cooperation despite the political standoff.',
            divergencePoint: 'First contact between Canadian Rangers and Chinese scouts on the ice',
            consequences: [
                'Human connection transcends politics',
                'Supply sharing begins covertly',
                'Both sides risk court martial',
                'A different kind of hope'
            ],
            startingConditions: {
                day: 60,
                flags: ['ranger_contact']
            },
            modifiers: {
                covertCooperation: true,
                supplySharingPossible: true,
                politicalRisk: true
            },
            available: true
        },

        reactor_shutdown: {
            id: 'reactor_shutdown',
            name: 'Early Reactor Shutdown',
            description: 'What if Commander Liu\'s warnings were heeded and the reactor was safely shut down before failure?',
            divergencePoint: 'Reactor shut down under controlled conditions in October',
            consequences: [
                'No radiation emergency',
                'Power loss still occurs but controlled',
                'More time to prepare for winter',
                'Admiral Chen\'s sacrifice unnecessary'
            ],
            startingConditions: {
                day: 30,
                flags: ['reactor_controlled_shutdown']
            },
            modifiers: {
                noRadiation: true,
                controlledPowerdown: true,
                chenSurvives: true
            },
            available: true
        }
    },

    // Get scenario by ID
    get: (id) => {
        return Scenarios.data[id] || null;
    },

    // Get all available scenarios
    getAvailable: () => {
        return Object.values(Scenarios.data).filter(s => s.available);
    },

    // Check if scenario is unlocked
    isUnlocked: (scenarioId) => {
        const scenario = Scenarios.get(scenarioId);
        if (!scenario) return false;
        if (scenario.available) return true;

        // Check unlock condition
        if (scenario.unlockCondition) {
            const [type, ...params] = scenario.unlockCondition.split(':');
            if (type === 'choice') {
                const [eventId, choiceId] = params;
                const state = GameState.current;
                if (state?.story.decisionsAdmitted[eventId]?.choice === choiceId) {
                    return true;
                }
            }
        }

        return false;
    },

    // Apply scenario modifiers to game state
    applyScenario: (scenarioId) => {
        const scenario = Scenarios.get(scenarioId);
        if (!scenario) return;

        const state = GameState.current;

        // Apply starting conditions
        if (scenario.startingConditions.day) {
            state.day = scenario.startingConditions.day;
        }

        if (scenario.startingConditions.phase) {
            state.phase = scenario.startingConditions.phase;
        }

        if (scenario.startingConditions.flags) {
            scenario.startingConditions.flags.forEach(flag => {
                GameState.setFlag(flag);
            });
        }

        // Store active modifiers
        state.story.whatIfActive = scenarioId;
        state.story.scenarioModifiers = scenario.modifiers;

        // Log scenario activation
        GameState.addLog(`What-If Scenario Active: ${scenario.name}`, 'important');
    },

    // Check if modifier is active
    hasModifier: (modifierName) => {
        const state = GameState.current;
        return state?.story.scenarioModifiers?.[modifierName] || false;
    },

    // Get survival modifier from active scenario
    getSurvivalModifier: () => {
        const state = GameState.current;
        return state?.story.scenarioModifiers?.survivalBonus || 0;
    },

    // Generate scenario-specific events
    getScenarioEvents: () => {
        const state = GameState.current;
        const scenarioId = state?.story.whatIfActive;
        if (!scenarioId || scenarioId === 'canon') return [];

        const events = [];

        // Scenario-specific narrative events
        if (scenarioId === 'call_for_help' && !GameState.eventTriggered('help_response')) {
            if (state.day >= 55) {
                events.push({
                    id: 'help_response',
                    title: 'Beijing Responds',
                    text: `The response comes not from Naval Command, but from the Ministry of Foreign Affairs.

"Your request has been... noted. A diplomatic solution is being explored."

Chen reads between the lines. They won't send ships - that would admit weakness. But they're talking to someone. Canada, perhaps. Or through back channels.

For the first time in weeks, he allows himself to hope.`,
                    effects: {
                        setFlag: 'diplomatic_channel_open',
                        morale: { chinese: 15 },
                        log: 'Beijing acknowledges the situation. Diplomatic channels opening.'
                    }
                });
            }
        }

        if (scenarioId === 'unofficial_channel' && !GameState.eventTriggered('first_contact')) {
            if (state.day >= 65) {
                events.push({
                    id: 'first_contact',
                    title: 'Contact on the Ice',
                    perspective: 'obrien',
                    text: `Joe Iqaluk returns from his patrol with news that makes O'Brien's blood run cold.

"I found one of theirs. Scout. Young kid, lost. He was crying."

"You made contact?"

"I gave him my emergency rations. Showed him the way back." Joe's face is unreadable. "He's someone's son."

O'Brien should report this. Protocol demands it. But she thinks of her own soldiers, of the men freezing on those ships.

"Did he say anything?"

"He said 'thank you.' In English. And then he said they're running out of food."`,
                    choices: [
                        {
                            id: 'report_contact',
                            text: 'Report the contact to command',
                            effects: {
                                setFlag: 'contact_reported',
                                log: 'Contact reported. Joe Iqaluk faces disciplinary action.'
                            }
                        },
                        {
                            id: 'keep_quiet',
                            text: 'Keep it quiet. See what develops.',
                            effects: {
                                setFlag: 'covert_contact',
                                log: 'The contact remains unofficial. A fragile connection forms.',
                                triggerEvent: 'supply_sharing'
                            }
                        }
                    ],
                    effects: { setFlag: 'first_contact' }
                });
            }
        }

        if (scenarioId === 'early_evacuation' && !GameState.eventTriggered('evac_begins')) {
            if (state.day >= 80) {
                events.push({
                    id: 'evac_begins',
                    title: 'Evacuation Begins',
                    perspective: 'chen',
                    text: `The first helicopter lifts off at dawn - what passes for dawn in late November, a grey twilight that lasts two hours.

Twenty men per flight. Fifty flights minimum. The window before polar night: perhaps three weeks.

It will be close. Very close.

Chen watches the helicopter disappear into the grey sky. On board: the first of his wounded. The men with the worst frostbite. The ones who won't survive a march.

"Admiral," Liu says quietly. "There's still the question of the ships."

"We abandon them." Chen's voice is flat. "The ice can have them. I will not sacrifice men for steel."

For the first time since this began, he feels like a commander instead of a witness to disaster.`,
                    effects: {
                        setFlag: 'evacuation_begun',
                        morale: { chinese: 20 },
                        log: 'Helicopter evacuation begins. Hope returns to the task force.'
                    }
                });
            }
        }

        return events;
    },

    // Get scenario description for UI
    getScenarioDescription: (scenarioId) => {
        const scenario = Scenarios.get(scenarioId);
        if (!scenario) return null;

        return {
            name: scenario.name,
            description: scenario.description,
            divergence: scenario.divergencePoint,
            consequences: scenario.consequences,
            unlocked: Scenarios.isUnlocked(scenarioId)
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scenarios;
}
