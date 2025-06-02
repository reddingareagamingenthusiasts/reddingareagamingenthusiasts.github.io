// Strategy Phase logic for TI4 Scoreboard

// Ensure strategy cards are properly initialized
function ensureStrategyCardsInitialized() {
    const state = window.stateCore.getGameState();
    console.log('Checking strategy cards initialization...');
    if (!state.strategyCards || state.strategyCards.length === 0) {
        console.log('Strategy cards were not initialized, adding them now');
        // Initialize from BASE_STRATEGY_CARDS which should be defined in data/strategyCards.js
        if (typeof BASE_STRATEGY_CARDS !== 'undefined' && BASE_STRATEGY_CARDS.length > 0) {
            state.strategyCards = [...BASE_STRATEGY_CARDS];
            console.log('Strategy cards initialized from BASE_STRATEGY_CARDS:', state.strategyCards.length);
            window.stateCore.saveGameState();
        } else {
            console.error('BASE_STRATEGY_CARDS is not available!');
        }
    } else {
        console.log('Strategy cards already initialized:', state.strategyCards.length);
    }
}

function initializeStrategyPhaseTurnOrder() {
    const state = window.stateCore.getGameState();
    
    // If turnOrder is empty, initialize it based on speaker and player order
    if (!state.turnOrder || state.turnOrder.length === 0) {
        // Find the speaker
        const speakerIndex = state.players.findIndex(player => player.isCurrentSpeaker);
        
        if (speakerIndex === -1) {
            console.warn('No speaker found, using first player as default');
            // If no speaker is found, use the first player as default
            state.turnOrder = state.players.map(player => player.id);
        } else {
            // Create turn order starting with speaker and going clockwise
            state.turnOrder = [];
            for (let i = 0; i < state.players.length; i++) {
                const playerIndex = (speakerIndex + i) % state.players.length;
                state.turnOrder.push(state.players[playerIndex].id);
            }
        }
        
        window.stateCore.saveGameState();
        console.log('Initialized strategy phase turn order:', state.turnOrder);
    }
}

function getNextPlayerInOrder() {
    ensureStrategyCardsInitialized(); // Make sure cards are available
    initializeStrategyPhaseTurnOrder(); // Make sure turn order is initialized
    
    const state = window.stateCore.getGameState();
    const unselectedPlayers = state.turnOrder.filter(
        playerId => !state.selectedCards[playerId]
    );
    console.log('Unselected players:', unselectedPlayers);
    return unselectedPlayers[0] || null;
}

function updateTurnOrderByInitiative() {
    const state = window.stateCore.getGameState();
    
    // Find the speaker to handle initiative ties
    const speakerIndex = state.players.findIndex(p => p.isCurrentSpeaker);
    
    // Create an array of players with their initiative values and original positions
    const playersWithInitiative = state.players.map((p, index) => {
        // Calculate clockwise distance from speaker (used for tiebreaking)
        const distanceFromSpeaker = speakerIndex !== -1 ? 
            (index - speakerIndex + state.players.length) % state.players.length : 
            index;
        
        return {
            id: p.id,
            initiative: state.selectedCards[p.id] ? 
                state.strategyCards.find(c => c.name === state.selectedCards[p.id]).initiative : 
                Infinity,
            distanceFromSpeaker: distanceFromSpeaker
        };
    });
    
    // Sort by initiative first, then by distance from speaker if initiative is tied
    state.turnOrder = playersWithInitiative
        .sort((a, b) => {
            // First sort by initiative
            const initiativeDiff = a.initiative - b.initiative;
            if (initiativeDiff !== 0) return initiativeDiff;
            
            // If initiative is tied, sort by distance from speaker (clockwise)
            return a.distanceFromSpeaker - b.distanceFromSpeaker;
        })
        .map(p => p.id);
    
    console.log('Updated turn order by initiative:', state.turnOrder);
    window.stateCore.saveGameState();
}

function selectStrategyCard(playerId, cardName) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    if (state.stage !== 'strategy-selection' && state.stage !== 'active') {
        console.warn('Cannot select strategy cards in current game stage');
        return false;
    }
    
    if (state.stage === 'strategy-selection') {
        // Use the local function directly to avoid any global scope issues
        const nextPlayer = getNextPlayerInOrder();
        if (nextPlayer !== playerId) {
            console.warn('Not this player\'s turn to select');
            return false;
        }
    }
    
    if (Object.values(state.selectedCards).includes(cardName)) {
        console.warn('Card already selected by another player');
        return false;
    }
    
    if (cardName) {
        state.selectedCards[playerId] = cardName;
    } else {
        delete state.selectedCards[playerId];
    }
    
    updateTurnOrderByInitiative(); // This will call saveGameState()
    return true;
}

function proceedToActivePhase() {
    const state = window.stateCore.getGameState();
    
    if (state.stage === 'strategy-selection') {
        const allPlayersSelected = state.players.every(
            p => state.selectedCards[p.id]
        );
        
        if (allPlayersSelected) {
            window.stateCore.recordHistory();

            // Use selectedCards to store strategy card names
            state.players.forEach(player => {
                player.strategyCard = state.selectedCards[player.id] || null;
                player.strategyCardUsed = false;
            });

            // Ensure the speaker is properly marked with isCurrentSpeaker
            if (state.speaker) {
                state.players.forEach(player => {
                    player.isCurrentSpeaker = (player.id === state.speaker);
                });
            }

            state.stage = 'active';
            state.phase = 'Action';
            window.stateCore.saveGameState();
        } else {
            console.warn("Not all players have selected strategy cards.");
        }
    }
}

// Export all functions that will be used by other modules
window.strategyPhase = {
    initializeStrategyPhaseTurnOrder,
    getNextPlayerInOrder,
    updateTurnOrderByInitiative,
    selectStrategyCard,
    proceedToActivePhase
};
