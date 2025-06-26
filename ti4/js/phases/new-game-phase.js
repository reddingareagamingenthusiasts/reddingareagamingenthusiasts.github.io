// New Game Phase logic for TI4 Scoreboard

function createGame(playerCount, options = {}) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Initialize a new game state
    state.players = [];
    state.stage = 'setup';
    state.phase = 'Setup';
    state.activePlayer = 0;
    state.round = 1;
    state.speaker = null;
    state.turnOrder = [];
    state.selectedCards = {};
    state.passedPlayerCount = 0;
    state.stagedPlayerAction = null;
    
    // Ensure backward compatibility with both gameOptions and direct properties
    state.gameOptions = {
        playerCount: playerCount,
        extendedMode: options.extendedMode || state.extendedMode || false,
        gameLength: options.gameLength || state.gameLength || 10,
        ...options
    };
    
    // Set direct properties for backward compatibility
    state.extendedMode = state.gameOptions.extendedMode;
    state.gameLength = state.gameOptions.gameLength;
    
    // Ensure availableFactions is initialized
    if (typeof FACTIONS !== 'undefined') {
        state.availableFactions = [...FACTIONS];
    }
    
    // Ensure availableColors is initialized
    if (typeof defaultGameState !== 'undefined' && defaultGameState.availableColors) {
        state.availableColors = [...defaultGameState.availableColors];
    }
    
    // Create empty player slots
    for (let i = 0; i < playerCount; i++) {
        addPlayer(i);
    }
    
    window.stateCore.saveGameState();
    return state;
}

function addPlayer(index, name = '') {
    const state = window.stateCore.getGameState();
    
    const playerId = Date.now() + '-' + index;
    const defaultName = `Player ${index + 1}`;
    
    state.players.push({
        id: playerId,
        index: index,
        name: name || defaultName,
        faction: null,
        color: null,
        score: 0,
        strategyCard: null,
        strategyCards: [], // Support multiple strategy cards for 4 or fewer players
        strategyCardUsed: false,
        strategyCardsUsed: [], // Track which cards have been used
        passed: false,
        isReady: false,
        naaluToken: false, // Track if Naalu "0" token is placed on strategy card
        giftOfPrescience: false // Track if Gift of Prescience promissory note is active
    });
    
    // Add to turn order by default
    if (!state.turnOrder.includes(playerId)) {
        state.turnOrder.push(playerId);
    }
    
    window.stateCore.saveGameState();
    return playerId;
}

function setPlayerName(playerId, name) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    player.name = name;
    window.stateCore.saveGameState();
    return true;
}

function setExtendedMode(enabled) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Handle mandatory extended mode for 9+ players
    let isMandatory = false;
    if (state.players.length > 0) { // Game created, actual player count matters
        if (state.players.length > 8) {
            isMandatory = true;
        }
    } else { // Setup screen, prospective player count matters
        if (state.prospectivePlayerCount > 8) {
            isMandatory = true;
        }
    }

    const finalEnabledState = isMandatory ? true : enabled;

    // Update only if the state changes or if it's mandatory (to ensure save/UI update)
    // or if the call implies a UI refresh is needed for enabled/disabled state of the toggle.
    if (state.extendedMode !== finalEnabledState || isMandatory || enabled !== state.extendedMode) {
        state.extendedMode = finalEnabledState;

        // Update strategy cards based on extended mode
        if (typeof BASE_STRATEGY_CARDS !== 'undefined' && typeof EXTENDED_STRATEGY_CARDS !== 'undefined') {
            const newStrategyCards = state.extendedMode
                ? [...BASE_STRATEGY_CARDS, ...EXTENDED_STRATEGY_CARDS]
                : [...BASE_STRATEGY_CARDS];
            state.strategyCards = newStrategyCards.sort((a, b) => a.initiative - b.initiative);

            if (!state.extendedMode) {
                // If extended mode is turned off, remove any selected extended strategy cards
                for (const [playerId, cardName] of Object.entries(state.selectedCards)) {
                    if (EXTENDED_STRATEGY_CARDS.some(card => card.name === cardName)) {
                        delete state.selectedCards[playerId];
                    }
                }
            }
        }
        window.stateCore.saveGameState(); // This will trigger updateUI
    } else {
        // Even if state.extendedMode doesn't change, the context (like prospectivePlayerCount) might have,
        // requiring a UI refresh for the toggle's disabled state.
        window.stateCore.saveGameState(); // Ensures UI refresh
    }
    
    return state.extendedMode;
}

function setGameLength(points) {
    const state = window.stateCore.getGameState();
    
    // Only proceed if the value is actually changing
    if (state.gameLength === points) {
        return state.gameLength;
    }
    
    window.stateCore.recordHistory();
    
    // Update the game length in both places for backward compatibility
    state.gameOptions.gameLength = points;
    state.gameLength = points;
    
    // Force a UI update by dispatching a custom event
    window.dispatchEvent(new CustomEvent('gameStateUpdated'));
    
    // Save the state (which will also trigger a UI update)
    window.stateCore.saveGameState();
    return state.gameLength;
}

function setRedTapeVariant(enabled) {
    const state = window.stateCore.getGameState();
    if (state.redTapeVariant !== enabled) {
        state.redTapeVariant = enabled;
        window.stateCore.saveGameState();
    }
}

function proceedToFactionSelection() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Check if all players have names
    const allPlayersHaveNames = state.players.every(p => p.name && p.name.trim() !== '');
    
    if (allPlayersHaveNames) {
        state.stage = 'faction-selection';
        window.stateCore.saveGameState();
        return true;
    } else {
        console.warn("Not all players have names.");
        return false;
    }
}

// Export all functions that will be used by other modules
window.newGamePhase = {
    createGame,
    addPlayer,
    setPlayerName,
    setExtendedMode,
    setGameLength,
    setRedTapeVariant,
    proceedToFactionSelection
};
