// Ice Breaker: Arctic Survival - Narrative & Decision System

const Narrative = {
    // Story events database
    events: {
        // === PHASE 1: SNOW DRAGON (Sept-Nov) ===
        opening: {
            id: 'opening',
            phase: 'snow_dragon',
            day: 1,
            title: 'The Northwest Passage',
            perspective: 'zhao',
            text: `The briefing said three weeks. A routine transit through the Northwest Passage, then home to Qingdao.

Lieutenant Zhao Jianfeng watches the grey Arctic water slide past the Type 075's hull. His Marines lounge on deck in their tropical uniforms, enjoying what they think is their last taste of cold weather before returning to China's warm coast.

They don't know that the international tribunal's 2043 ruling opened these waters to all nations. They don't know that Canada still seethes at losing its sovereign claim. They don't know that the Xuelong 3's reactor has been showing warning signs for months.

They just want to go home.`,
            choices: null, // No choice - narrative only
            effects: {
                log: 'The Chinese task force enters Victoria Strait.'
            }
        },

        ice_forming: {
            id: 'ice_forming',
            phase: 'snow_dragon',
            triggerDay: 15,
            title: 'First Ice',
            perspective: 'zhao',
            text: `Private Liu comes running from the observation deck.

"Sir! Ice on the water. Thin sheets, breaking apart on the bow."

Zhao walks to the rail. The grey water is giving way to white patches - new ice forming on the surface. Beautiful in its way. The Xuelong 3 ahead cuts through it easily, leaving a wake of dark water.

"Nothing to worry about," Zhao tells his men. "The icebreaker handles it."

But something in Commander Liu's expression when they pass the bridge... something there makes Zhao uneasy.`,
            choices: null,
            effects: {
                setFlag: 'ice_noticed',
                environment: { iceCondition: 'thin' },
                log: 'First ice forms in the strait. The task force continues.'
            }
        },

        reactor_warning_signs: {
            id: 'reactor_warning_signs',
            phase: 'snow_dragon',
            triggerDay: 20,
            perspective: 'chen',
            title: 'Warning Signs',
            text: `Admiral Chen reads Commander Liu's report for the third time.

"Cooling system anomaly. Efficiency down 3%. Recommend reducing speed."

Three percent. It sounds like nothing. But Liu's face tells a different story when Chen summons him.

"How serious?"

"Admiral, if we maintain current operational tempo..." Liu hesitates. "The system is degrading. I've filed three reports to Naval Command. All dismissed."

Chen stares at the bulkhead. Beijing wants this transit completed on schedule. The diplomatic message is more important than operational concerns.

"Continue monitoring. Report any changes directly to me."

It's all he can do. For now.`,
            choices: [
                {
                    id: 'reduce_speed',
                    text: 'Reduce speed despite orders',
                    effects: {
                        setFlag: 'reactor_slowed',
                        modifyResource: { heatingFuel: 5 },
                        log: 'Admiral Chen quietly orders reduced speed. Beijing won\'t notice for days.',
                        delayEvent: 'reactor_failure'
                    }
                },
                {
                    id: 'maintain_speed',
                    text: 'Maintain speed as ordered',
                    effects: {
                        log: 'The task force maintains speed. The schedule is paramount.',
                        accelerateEvent: 'reactor_failure'
                    }
                }
            ],
            effects: {
                setFlag: 'reactor_warning',
                triggerEvent: 'chen_knows'
            }
        },

        canadian_detection: {
            id: 'canadian_detection',
            phase: 'snow_dragon',
            triggerDay: 25,
            perspective: 'obrien',
            title: 'Eyes on Target',
            text: `Sergeant O'Brien adjusts her binoculars from the observation post on King William Island.

"Three ships. Nuclear icebreaker leading, big amphib in the middle, support vessel trailing."

The encrypted radio crackles. "Firebase, this is Yellowknife Actual. Confirm visual on Chinese task force."

"Confirmed. Three vessels, bearing north-northeast, approximately fifteen nautical miles."

"Roger. Maintain observation. Rules of engagement remain: observe only. Do not approach, do not communicate. Acknowledge."

O'Brien grits her teeth. "Acknowledged. Observe only."

She watches the distant ships through her scope. The Type 075 is huge - forty thousand tons of amphibious assault ship. And somewhere on it, a thousand Marines.

In tropical uniforms.

In the Arctic.

The temperature today is minus fifteen. In six weeks, it will be minus forty. In eight weeks, the polar night begins.

She already knows how this ends.`,
            choices: null,
            effects: {
                setFlag: 'canadian_contact',
                log: 'Canadian forces establish observation of the Chinese task force.'
            }
        },

        ice_thickens: {
            id: 'ice_thickens',
            phase: 'snow_dragon',
            triggerDay: 35,
            title: 'Trapped',
            perspective: 'zhao',
            text: `The scraping sound woke Zhao from uneasy sleep.

Metal against ice. Not the usual crunch of the bow breaking through. Something different. Something wrong.

He reaches the deck to find his Marines already there, staring at the horizon. Or rather - at where the horizon used to be.

Ice. Solid ice in every direction. White and grey and endless.

"When did we stop?"

"Three hours ago, sir." Private Chen's voice is small. "They say we're... stuck."

The Xuelong 3 ahead is motionless. Its reactor - the only thing that can break them free - sits silent. Whatever was wrong with the cooling system, it's worse now.

Much worse.

The temperature is minus twenty-two. Zhao's Marines are wearing tropical field jackets.

"Get everyone inside," Zhao orders. "Now."`,
            choices: null,
            effects: {
                setFlag: 'ships_trapped',
                environment: { iceCondition: 'solid' },
                log: 'The task force becomes trapped in pack ice. Ships cannot move.',
                morale: { chinese: -15 }
            }
        },

        first_frostbite: {
            id: 'first_frostbite',
            phase: 'snow_dragon',
            triggerDay: 40,
            perspective: 'zhao',
            title: 'The Cold Claims Its First',
            text: `Private Wang can't feel his fingers.

"How long were you on deck?" Zhao's voice is calm, but his hands are shaking as he examines the soldier's hands.

"Fifteen minutes, sir. I was just... watching the ice."

Fifteen minutes. At minus twenty-five with wind chill, fifteen minutes of exposed skin.

The ship's medic pulls Zhao aside. "Second-degree frostbite. Both hands. If we had proper facilities..." He trails off. They don't have proper facilities. They have a sick bay designed for transit injuries, not Arctic survival medicine.

"Will he lose the fingers?"

"Maybe. Probably not all of them. But he won't hold a rifle again."

Zhao looks at his forty-man platoon. Tropical uniforms. Tropical training. One man down already, and the real cold hasn't even begun.

In two months, the sun won't rise at all.`,
            choices: [
                {
                    id: 'restrict_deck',
                    text: 'Restrict all deck access',
                    effects: {
                        setFlag: 'deck_restricted',
                        morale: { chinese: -5 },
                        log: 'Lt. Zhao restricts deck access. Marines are confined below.'
                    }
                },
                {
                    id: 'mandatory_pairs',
                    text: 'Implement mandatory buddy system',
                    effects: {
                        setFlag: 'buddy_system',
                        log: 'Lt. Zhao implements a buddy system. No one goes outside alone.'
                    }
                }
            ],
            effects: {
                personnel: { chinese: { earlyFrostbite: 1 } },
                log: 'First frostbite casualty among the Marines.'
            }
        },

        // === PHASE 2: POLAR NIGHT (Dec-Jan) ===
        polar_night_begins: {
            id: 'polar_night_begins',
            phase: 'polar_night',
            triggerDay: 92, // Dec 1
            title: 'The Sun Sets',
            perspective: 'zhao',
            text: `The sun touched the horizon at noon.

Not rose. Touched. A sliver of orange light that painted the ice for twenty minutes, then sank below the world and did not return.

It won't rise again until February.

Zhao's Marines stand at the portholes, watching the last light fade. Some are crying. Others simply stare. The darkness that follows is absolute - no moon, no stars through the overcast sky. Just black.

The temperature outside is minus forty-two.

"Lights," someone whispers. "We need more lights."

But the generators are rationed now. The reactor on the Xuelong 3 is... nobody talks about the reactor. The heating system draws what power they have. Lights are a luxury.

In the darkness, men begin to scream.`,
            choices: null,
            effects: {
                environment: { daylight: 0 },
                morale: { chinese: -20 },
                setFlag: 'polar_night',
                log: 'Polar night begins. The sun will not rise for two months.'
            }
        },

        hull_groans: {
            id: 'hull_groans',
            phase: 'polar_night',
            triggerDay: 100,
            perspective: 'zhao',
            title: 'The Ice Speaks',
            text: `The sound comes at 0300 - a groan from deep in the ship's bones.

Men who were sleeping bolt upright. Others freeze in place. The sound comes again, longer this time. Metal bending. Steel protesting.

"The ice," Liu whispers to Zhao in the corridor. "It's pressing. The hull is holding, but..."

"But?"

"The Type 075 wasn't built for this. Ice class rating too low. If the pressure continues..."

Another groan, louder. Somewhere in the darkness, a Marine starts praying.

"What do we do?"

Liu has no answer. There is no answer. They are frozen in place, trapped in darkness, and the ice is slowly crushing them.

All they can do is listen.`,
            choices: null,
            effects: {
                setFlag: 'hull_pressure',
                ships: { type075: { hullIntegrity: -10 } },
                morale: { chinese: -10 },
                log: 'Ice pressure builds against the ships. Hull stress detected on Type 075.'
            }
        },

        // === DECISION EVENTS ===
        ask_for_help: {
            id: 'ask_for_help',
            phase: 'snow_dragon',
            triggerDay: 50,
            perspective: 'chen',
            title: 'The Call',
            text: `Admiral Chen holds the encrypted satellite phone.

One call to Beijing. "We need assistance." Four words that would end his career. Four words that would make China lose face before the world. Four words that might save a thousand lives.

His finger hovers over the button.

The Xuelong 3's reactor is failing. He knows it. Liu knows it. Beijing probably knows it but won't acknowledge it. Soon, they'll lose power. Then heat. Then...

He thinks of the Marines below deck. Boys, really. Wearing tropical uniforms in the Arctic because someone in logistics decided transit speed was more important than contingency planning.

The button waits.`,
            choices: [
                {
                    id: 'call_beijing',
                    text: 'Make the call. Ask for help.',
                    whatIf: 'call_for_help',
                    effects: {
                        activateWhatIf: 'call_for_help',
                        setFlag: 'asked_for_help',
                        log: 'Admiral Chen breaks protocol and requests assistance from Beijing.',
                        triggerEvent: 'help_requested'
                    }
                },
                {
                    id: 'stay_silent',
                    text: 'Maintain silence. Obey orders.',
                    effects: {
                        setFlag: 'stayed_silent',
                        log: 'Admiral Chen maintains radio silence. The standoff continues.',
                        morale: { chinese: -5 }
                    }
                }
            ]
        }
    },

    // Current event queue
    eventQueue: [],

    // Initialize narrative system
    init: () => {
        Narrative.eventQueue = [];
    },

    // Check for triggerable events
    checkEvents: () => {
        const state = GameState.current;
        const triggeredEvents = [];

        for (const [key, event] of Object.entries(Narrative.events)) {
            // Skip already triggered events
            if (GameState.eventTriggered(event.id)) continue;

            // Check trigger conditions
            let shouldTrigger = false;

            // Day-based trigger
            if (event.day && state.day >= event.day) {
                shouldTrigger = true;
            }

            // TriggerDay (later in phase)
            if (event.triggerDay && state.day >= event.triggerDay) {
                shouldTrigger = true;
            }

            // Phase-based trigger
            if (event.phase && state.phase !== event.phase) {
                shouldTrigger = false;
            }

            // Flag requirements
            if (event.requiresFlag && !GameState.hasFlag(event.requiresFlag)) {
                shouldTrigger = false;
            }

            if (shouldTrigger) {
                triggeredEvents.push(event);
                GameState.triggerEvent(event.id);
            }
        }

        // Sort by priority/day
        triggeredEvents.sort((a, b) => (a.day || a.triggerDay || 0) - (b.day || b.triggerDay || 0));

        // Add to queue
        Narrative.eventQueue.push(...triggeredEvents);

        return triggeredEvents;
    },

    // Get next event from queue
    getNextEvent: () => {
        return Narrative.eventQueue.shift() || null;
    },

    // Process event effects
    processEffects: (effects) => {
        const state = GameState.current;

        if (effects.setFlag) {
            GameState.setFlag(effects.setFlag);
        }

        if (effects.log) {
            GameState.addLog(effects.log, 'important');
        }

        if (effects.morale) {
            for (const [faction, change] of Object.entries(effects.morale)) {
                state.personnel[faction].morale += change;
            }
        }

        if (effects.personnel) {
            for (const [faction, changes] of Object.entries(effects.personnel)) {
                for (const [stat, value] of Object.entries(changes)) {
                    state.personnel[faction][stat] = (state.personnel[faction][stat] || 0) + value;
                }
            }
        }

        if (effects.modifyResource) {
            for (const [resource, amount] of Object.entries(effects.modifyResource)) {
                state.resources[resource] = Utils.clamp(state.resources[resource] + amount, 0, 100);
            }
        }

        if (effects.environment) {
            Object.assign(state.environment, effects.environment);
        }

        if (effects.ships) {
            for (const [shipId, changes] of Object.entries(effects.ships)) {
                if (state.ships[shipId]) {
                    for (const [prop, value] of Object.entries(changes)) {
                        if (typeof value === 'number' && typeof state.ships[shipId][prop] === 'number') {
                            state.ships[shipId][prop] += value;
                        } else {
                            state.ships[shipId][prop] = value;
                        }
                    }
                }
            }
        }

        if (effects.activateWhatIf) {
            GameState.activateWhatIf(effects.activateWhatIf);
        }

        if (effects.triggerEvent) {
            // Queue another event
            const event = Narrative.events[effects.triggerEvent];
            if (event) {
                Narrative.eventQueue.push(event);
            }
        }
    },

    // Process a choice
    processChoice: (event, choiceId) => {
        const choice = event.choices?.find(c => c.id === choiceId);
        if (!choice) return;

        GameState.recordDecision(event.id, choiceId);

        if (choice.effects) {
            Narrative.processEffects(choice.effects);
        }

        // Emit event
        if (GameState.events) {
            GameState.events.emit('choiceMade', { event, choice });
        }
    },

    // Generate procedural event based on conditions
    generateProceduralEvent: () => {
        const state = GameState.current;
        const events = [];

        // Low food event
        if (state.resources.food < 30 && !GameState.hasFlag('food_crisis_mentioned')) {
            events.push({
                id: 'food_crisis_' + state.day,
                title: 'Rations Running Low',
                text: 'The quartermaster reports that food supplies are critically low. At current consumption, stores will last only ' +
                      Math.floor(state.resources.food / Resources.calculateConsumption('food')) + ' more days.',
                choices: null,
                effects: { setFlag: 'food_crisis_mentioned', log: 'Food supplies running critically low.' }
            });
        }

        // Morale crisis
        if (state.personnel.chinese.morale < 30 && !GameState.hasFlag('morale_crisis')) {
            events.push({
                id: 'morale_crisis_' + state.day,
                title: 'Breaking Point',
                text: 'A fight breaks out in the mess hall. Men are snapping - the cold, the darkness, the fear. ' +
                      'If something doesn\'t change, discipline will collapse entirely.',
                choices: [
                    { id: 'crack_down', text: 'Crack down harshly', effects: { morale: { chinese: 5 }, log: 'Order restored through discipline.' }},
                    { id: 'address_men', text: 'Address the men directly', effects: { setFlag: 'leadership_speech', morale: { chinese: 10 }, log: 'The officers speak to the men. Hope, however fragile, is restored.' }}
                ],
                effects: { setFlag: 'morale_crisis' }
            });
        }

        return events.length > 0 ? events[0] : null;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Narrative;
}
