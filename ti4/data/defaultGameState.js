const defaultGameState = {
    stage: 'setup', // setup, speaker-selection, strategy-selection, active
    round: 1,
    prospectivePlayerCount: 6, // Default for the initial setup screen
    activePlayer: 0, // Index in players array for strategy selection, speaker selection
    phase: 'Strategy', // Strategy, Action, Status, Agenda
    players: [],
    speaker: null,
    turnOrder: [], // Array of player IDs in initiative order for Action Phase
    actionPhasePlayerIndex: 0, // Index in turnOrder for current player in Action Phase
    passedPlayerCount: 0, // Count of players who have passed in the current action phase round
    extendedMode: false,
    gameLength: 10, // 10 for normal, 14 for long
    redTapeVariant: false, // Added for Red Tape Variant
    strategyCards: [], // Strategy cards will be loaded dynamically
    selectedCards: {}, // Tracks which player has which strategy card by card name
    revealedStageIObjectives: [], // Store IDs of revealed Stage I objectives
    revealedStageIIObjectives: [], // Store IDs of revealed Stage II objectives
    stagedPlayerAction: null,
    publicObjectiveScores: {},
    objectiveUIVisibility: {}, // Tracks UI visibility (true for visible, false for hidden) for revealed objectives // { playerId: string, type: 'playStrategyCard' | 'componentAction' | 'pass', details?: any }
    factions: [
        // Base Game Factions
        { name: 'The Emirates of Hacan', id: 'Hacan', color: '#FFD700' },
        { name: 'The Federation of Sol', id: 'Sol', color: '#4169E1' },
        { name: 'The Barony of Letnev', id: 'Barony', color: '#FF0000' },
        { name: 'The Universities of Jol-Nar', id: 'Jol-Nar', color: '#9370DB' },
        { name: "The Sardakk N'orr", id: 'Sardakk', color: '#8B0000' },
        { name: 'The Xxcha Kingdom', id: 'Xxcha', color: '#006400' },
        { name: 'The L1Z1X Mindnet', id: 'L1Z1X', color: '#1A1A1A' },
        { name: 'The Mentak Coalition', id: 'Mentak', color: '#FFA500' },
        { name: 'The Naalu Collective', id: 'Naalu', color: '#FFE4B5' },
        { name: 'The Yin Brotherhood', id: 'Yin', color: '#F0F8FF' },
        { name: 'The Embers of Muaat', id: 'Muaat', color: '#FF4500' },
        { name: 'The Arborec', id: 'Arborec', color: '#228B22' },
        { name: 'The Clan of Saar', id: 'Saar', color: '#8B4513' },
        { name: 'The Ghosts of Creuss', id: 'Ghosts', color: '#4B0082' },
        { name: 'The Nekro Virus', id: 'Nekro', color: '#363636' },
        { name: 'The Winnu', id: 'Winnu', color: '#BA55D3' },
        { name: 'The Yssaril Tribes', id: 'Yssaril', color: '#556B2F' },
        // Prophecy of Kings Factions
        { name: 'The Nomad', id: 'NomadFactionSheet', color: '#C0C0C0' },
        { name: "The Vuil'Raith Cabal", id: 'CabalFactionSymbol', color: '#800000' },
        { name: 'The Titans of Ul', id: 'UlFactionSymbol', color: '#B8860B' },
        { name: 'The Empyrean', id: 'EmpyreanFactionSymbol', color: '#87CEEB' },
        { name: 'The Mahact Gene-Sorcerers', id: 'MahactFactionSymbol', color: '#9932CC' },
        { name: 'The Naaz-Rokha Alliance', id: 'NaazRokhaFactionSymbol', color: '#20B2AA' },
        { name: 'The Argent Flight', id: 'ArgentFactionSymbol', color: '#F5F5F5' }
    ],
    availableFactions: [], // Will be populated with unused factions
    availableColors: [
        '#FF1493', // Pink
        '#00FF00', // Green
        '#FFD700', // Yellow (brighter, more distinct)
        '#800080', // Purple
        '#FF4500', // Orange (more red-orange, distinct from gold)
        '#FF0000', // Red
        '#0000FF', // Blue
        '#000000', // Black
        '#DAA520', // Gold (more metallic gold)
        '#ACACAC'  // Pewter
    ]
};
