// Ice Breaker: Arctic Survival - Character System
// Based on characters from the Ice Breaker novel series

const Characters = {
    // All playable and major NPCs
    data: {
        // === CHINESE FORCES ===
        zhao: {
            id: 'zhao',
            name: 'Lt. Zhao Jianfeng',
            fullName: 'Lieutenant Zhao Jianfeng',
            faction: 'chinese',
            role: 'Marine Platoon Commander',
            age: 35,
            playable: true,
            portrait: 'zhao.png',

            description: 'Commander of 32 Marines returning from Cuba deployment. Idealistic and professional, trained for amphibious assault - not Arctic survival.',

            background: 'Joined the PLAN Marine Corps at 18. Rose through the ranks on merit. His platoon was attached to the task force for a routine transit home after exercises in Cuba. They have tropical gear only.',

            personality: ['idealistic', 'professional', 'protective', 'increasingly_desperate'],

            arc: 'Excited to go home → Realizing danger → Watching men freeze → Desperation',

            startingMorale: 85,
            leadership: 75,
            arcticSkill: 10, // Almost none

            perspective: {
                focus: 'Survival horror, keeping men alive',
                sees: 'His freezing Marines, inadequate equipment, helplessness',
                hidden: 'Command decisions, political situation, reactor status'
            },

            quotes: [
                "We trained for beaches, not ice fields.",
                "My men have tropical uniforms. This was supposed to be a three-week transit.",
                "I will not lose another soldier to this cold."
            ]
        },

        chen: {
            id: 'chen',
            name: 'Admiral Chen Weiming',
            fullName: 'Rear Admiral Chen Weiming',
            faction: 'chinese',
            role: 'Task Force Commander',
            age: 52,
            playable: true,
            portrait: 'chen.png',

            description: 'Experienced naval officer commanding the trapped task force. He opposed adding the Type 075 but was overruled. Now he cannot ask for help without admitting failure.',

            background: '30-year naval career. Rose to flag rank through competence, not politics. Privately opposed the NWP transit with the undermanned Type 075 but was overruled by Beijing.',

            personality: ['stoic', 'competent', 'trapped_by_duty', 'honorable'],

            arc: 'Confident → Aware of danger → Grim acceptance → Heroic sacrifice',

            startingMorale: 70,
            leadership: 90,
            arcticSkill: 40,

            perspective: {
                focus: 'High-stakes command decisions',
                sees: 'The full picture - reactor failing, Beijing pressure, impossible choices',
                hidden: 'Ground-level suffering, Canadian intentions, US intelligence'
            },

            quotes: [
                "I cannot ask for help. Beijing would rather lose a thousand men than lose face.",
                "The reactor is failing. I know this. They know I know. No one will say it.",
                "Every decision I make will kill someone. I can only choose who."
            ],

            fate: 'Dies from radiation exposure saving his men (Book 3)'
        },

        liu: {
            id: 'liu',
            name: 'Cdr Liu Xiaoming',
            fullName: 'Commander Liu Xiaoming',
            faction: 'chinese',
            role: 'Xuelong 3 Executive Officer',
            age: 45,
            playable: false,
            portrait: 'liu.png',

            description: 'Chief engineer of the nuclear icebreaker. He reported the warning signs about the reactor. He was ignored.',

            personality: ['technical', 'frustrated', 'loyal', 'haunted'],

            quotes: [
                "I filed three reports about the cooling system. Three. All dismissed for operational tempo.",
                "The reactor will fail. It is a matter of when, not if.",
                "I can only watch as the Admiral makes impossible decisions."
            ]
        },

        // === CANADIAN FORCES ===
        obrien: {
            id: 'obrien',
            name: "Sgt. Paddy O'Brien",
            fullName: "Sergeant Patricia 'Paddy' O'Brien",
            faction: 'canadian',
            role: 'Infantry Section Commander, 3 PPCLI',
            age: 29,
            playable: true,
            portrait: 'obrien.png',

            description: 'Newfoundlander, Advanced Arctic Operations qualified. Previously trained Rangers. Core motivation: bring her eight soldiers home alive.',

            background: 'From St. Johns, Newfoundland. Joined the Canadian Army at 19. One of the few women to complete the Arctic Operations Advisor course. Has trained with Rangers in the High Arctic.',

            personality: ['practical', 'protective', 'frustrated_by_politics', 'competent'],

            arc: 'Professional soldier → Conflicted witness → Potential bridge-builder',

            startingMorale: 85,
            leadership: 80,
            arcticSkill: 90,

            perspective: {
                focus: 'ROE constraints, moral dilemmas',
                sees: 'Chinese forces freezing, her soldiers wanting to help, orders preventing action',
                hidden: 'Command politics, intelligence picture, diplomatic negotiations'
            },

            quotes: [
                "I can see them freezing from here. My orders say observe only.",
                "We have the gear to help. We have the training. We have nothing but orders.",
                "I joined the Army to protect people. Not to watch them die."
            ]
        },

        fontaine: {
            id: 'fontaine',
            name: 'BGen Fontaine',
            fullName: 'Brigadier-General Marie-Claire Fontaine',
            faction: 'canadian',
            role: 'Task Force Commander, Op FROZEN RESOLVE',
            age: 52,
            playable: false,
            portrait: 'fontaine.png',

            description: 'Commands the Canadian response. Never served in the Arctic before. Trapped between professional judgment and political pressure from Ottawa.',

            personality: ['professional', 'politically_aware', 'conflicted', 'competent'],

            arc: 'Confident → Questioning mission sense → Grim acceptance',

            quotes: [
                "Ottawa wants me to watch them freeze. They call it maintaining sovereignty.",
                "I receive three contradictory orders before breakfast. Every day.",
                "If I offer help, China loses face. If I don't, people die. Politics."
            ]
        },

        iqaluk: {
            id: 'iqaluk',
            name: 'MCpl Joe Iqaluk',
            fullName: "Master Corporal Joseph 'Joe' Iqaluk",
            faction: 'canadian',
            role: 'Ranger Patrol NCO',
            age: 38,
            playable: false,
            portrait: 'iqaluk.png',

            description: 'Born and raised in Resolute Bay. Third-generation Ranger, hunter, father of two. Speaks Inuktitut as first language. His local knowledge is invaluable.',

            personality: ['quiet', 'observant', 'practical', 'bridge_between_worlds'],

            arc: 'Proud Ranger → Conflicted witness → Potential mediator',

            quotes: [
                "The ice doesn't care about flags or politics. It just kills.",
                "My grandfather survived on this ice. He knew its moods. These soldiers don't.",
                "Maybe if we stopped being enemies, we could start being people."
            ]
        },

        // === INTELLIGENCE / ALLIES ===
        whitmore: {
            id: 'whitmore',
            name: 'Maj. Alex Whitmore',
            fullName: 'Major Alex Whitmore',
            faction: 'allied',
            role: 'UK Intelligence Liaison, Five Eyes',
            age: 38,
            playable: true,
            portrait: 'whitmore.png',

            description: 'Cambridge-educated intelligence officer fluent in Mandarin and Russian. Figures out the truth through analysis. Suspects the US is holding back.',

            background: 'Oxford history, Cambridge linguistics. Recruited into MI6, then transferred to DIS. Attached to Canadian JTF(N) as Five Eyes liaison.',

            personality: ['analytical', 'curious', 'morally_troubled', 'diplomatic'],

            arc: 'Analyst → Would-be diplomat → Witness to preventable tragedy',

            startingMorale: 75,
            leadership: 60,
            arcticSkill: 30,

            perspective: {
                focus: 'Information puzzle, diplomacy',
                sees: 'Intelligence fragments, what people won\'t say, potential solutions',
                hidden: 'Ground-level conditions, US full intelligence picture'
            },

            quotes: [
                "The Americans know something. Webb won't say it, but I can read it in what he doesn't say.",
                "I've pieced together what's happening. Now I need someone to listen.",
                "This is a tragedy of communication. Everyone is too proud to speak."
            ]
        },

        webb: {
            id: 'webb',
            name: 'Maj. Marcus Webb',
            fullName: 'Major Marcus Webb',
            faction: 'allied',
            role: 'US Intelligence Liaison',
            age: 40,
            playable: false,
            portrait: 'webb.png',

            description: 'US intelligence officer who knows everything via SIGINT. Cannot share without burning sources. Lives with the weight of knowing the truth.',

            personality: ['conflicted', 'professional', 'haunted', 'careful'],

            arc: 'Silent witness → Living with complicity',

            quotes: [
                "I know exactly what's happening on those ships. I can tell no one.",
                "If I share what I know, we lose assets that took decades to place.",
                "Sometimes I leave hints. Hints that are not hints. It's all I can do."
            ]
        },

        makivik: {
            id: 'makivik',
            name: 'LCol Tommy Makivik',
            fullName: "Lieutenant-Colonel Thomas 'Tommy' Makivik",
            faction: 'canadian',
            role: 'Senior Logistics Officer',
            age: 46,
            playable: false,
            portrait: 'makivik.png',

            description: 'From Kuujjuaq, Nunavik. Knows that in the Arctic, logistics equals survival. Asked to perform miracles with insufficient resources.',

            personality: ['practical', 'blunt', 'resourceful', 'frustrated'],

            quotes: [
                "You want me to evacuate a thousand men across 400 nautical miles of sea ice? With what?",
                "In the Arctic, you don't fight the enemy. You fight the cold. The cold always wins.",
                "I can tell you exactly how many will die. No one wants to hear it."
            ]
        }
    },

    // Get character by ID
    get: (id) => {
        return Characters.data[id] || null;
    },

    // Get all playable characters
    getPlayable: () => {
        return Object.values(Characters.data).filter(c => c.playable);
    },

    // Get characters by faction
    getByFaction: (faction) => {
        return Object.values(Characters.data).filter(c => c.faction === faction);
    },

    // Get current perspective character
    getCurrentPerspective: () => {
        const state = GameState.current;
        if (!state) return null;
        return Characters.get(state.perspective);
    },

    // Get what current character can see/know
    getPerspectiveFilter: () => {
        const character = Characters.getCurrentPerspective();
        if (!character) return { sees: [], hidden: [] };
        return character.perspective;
    },

    // Get random quote from character
    getRandomQuote: (characterId) => {
        const character = Characters.get(characterId);
        if (!character || !character.quotes) return null;
        return character.quotes[Utils.random(0, character.quotes.length - 1)];
    },

    // Get character portrait path
    getPortraitPath: (characterId) => {
        const character = Characters.get(characterId);
        if (!character) return 'assets/ui/default-portrait.png';
        return `assets/ui/portraits/${character.portrait}`;
    },

    // Initialize character state in game
    initCharacterState: (characterId) => {
        const character = Characters.get(characterId);
        if (!character) return null;

        return {
            id: characterId,
            morale: character.startingMorale || 75,
            stress: 0,
            relationships: {},
            flags: {}
        };
    },

    // Character info for perspective switch modal
    getPerspectiveInfo: (characterId) => {
        const character = Characters.get(characterId);
        if (!character) return null;

        return {
            name: character.name,
            role: character.role,
            faction: character.faction,
            description: character.description,
            focus: character.perspective?.focus || 'Unknown',
            arc: character.arc
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Characters;
}
