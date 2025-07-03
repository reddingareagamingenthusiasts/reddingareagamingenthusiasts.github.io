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
    
    // Check if we need dual strategy cards (4 or fewer players)
    const needsDualCards = state.players.length <= 4;
    
    if (needsDualCards) {
        // For dual cards, we need to go through the selection process twice
        // First, check if any player hasn't selected their first card
        let playersWithoutFirstCard = state.turnOrder.filter(playerId => {
            const player = state.players.find(p => p.id === playerId);
            return !player.strategyCards || player.strategyCards.length === 0;
        });
        
        if (playersWithoutFirstCard.length > 0) {
            console.log('First round - players without first card:', playersWithoutFirstCard);
            return playersWithoutFirstCard[0];
        }
        
        // If all players have their first card, proceed with second round
        let playersWithoutSecondCard = state.turnOrder.filter(playerId => {
            const player = state.players.find(p => p.id === playerId);
            return player.strategyCards.length < 2;
        });
        
        if (playersWithoutSecondCard.length > 0) {
            console.log('Second round - players without second card:', playersWithoutSecondCard);
            return playersWithoutSecondCard[0];
        }
        
        // All players have both cards
        return null;
    } else {
        // Standard single card selection
        const unselectedPlayers = state.turnOrder.filter(
            playerId => !state.selectedCards[playerId]
        );
        console.log('Unselected players:', unselectedPlayers);
        return unselectedPlayers[0] || null;
    }
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
        
        let initiative = Infinity;
        if (state.selectedCards[p.id]) {
            const cardData = state.strategyCards.find(c => c.name === state.selectedCards[p.id]);
            if (cardData) {
                // Check if Gift of Prescience is active (takes precedence over Naalu token)
                if (p.giftOfPrescience) {
                    initiative = 0; // Gift of Prescience makes initiative 0
                } else if (p.naaluToken && (state.phase === 'Action' || state.phase === 'Status')) {
                    initiative = 0; // Naalu token makes initiative 0
                } else {
                    initiative = cardData.initiative;
                }
            }
        }
        
        return {
            id: p.id,
            initiative: initiative,
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
    
    // Check if card is already selected by another player
    const needsDualCards = state.players.length <= 4;
    const isCardTaken = state.players.some(player => 
        player.id !== playerId && // Don't check the current player
        player.strategyCards && player.strategyCards.includes(cardName)
    );
    
    if (isCardTaken) {
        console.warn('Card already selected by another player');
        return false;
    }
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) {
        console.warn('Player not found');
        return false;
    }
    
    // Check if player already has this card (prevent duplicates)
    if (player.strategyCards && player.strategyCards.includes(cardName)) {
        console.warn('Player already has this strategy card');
        return false;
    }
    
    if (cardName) {
        // Initialize strategy cards array if it doesn't exist
        if (!player.strategyCards) {
            player.strategyCards = [];
        }
        
        if (needsDualCards) {
            // For dual cards, add to the array (max 2 cards)
            if (player.strategyCards.length < 2) {
                player.strategyCards.push(cardName);
                console.log(`Player ${player.name} selected ${cardName} (${player.strategyCards.length}/2)`);
            }
        } else {
            // For standard play, replace the single card
            player.strategyCards = [cardName];
            // Keep backwards compatibility
            state.selectedCards[playerId] = cardName;
        }
        
        // For dual cards, also maintain backwards compatibility by setting the primary strategy card
        // Use the lower initiative card as the primary for turn order
        if (player.strategyCards.length > 0) {
            const cardInitiatives = player.strategyCards.map(card => {
                const cardData = state.strategyCards.find(c => c.name === card);
                return { name: card, initiative: cardData ? cardData.initiative : Infinity };
            });
            
            const primaryCard = cardInitiatives.sort((a, b) => a.initiative - b.initiative)[0];
            player.strategyCard = primaryCard.name;
            state.selectedCards[playerId] = primaryCard.name;
        }
        
        // Auto-place Naalu token after strategy card selection
        autoPlaceNaaluTokenAfterSelection(playerId);
    } else {
        // Remove card selection
        if (needsDualCards && player.strategyCards) {
            player.strategyCards = [];
        }
        player.strategyCard = null;
        delete state.selectedCards[playerId];
        
        // Remove Naalu token if card is deselected
        if (player.naaluToken) {
            removeNaaluToken(playerId);
        }
    }
    
    // End current player's turn timer and start next player's turn timer
    if (state.stage === 'strategy-selection') {
        if (window.gameTimer && typeof window.gameTimer.endCurrentPlayerTurn === 'function') {
            window.gameTimer.endCurrentPlayerTurn();
        }
        
        // Get the next player before saving state (don't update turn order during selection)
        const nextPlayerAfterSelection = getNextPlayerInOrder();
        
        // Save state without updating turn order during strategy selection
        window.stateCore.saveGameState();
        
        // Start timer for next player if there is one
        if (nextPlayerAfterSelection && window.gameTimer && typeof window.gameTimer.startPlayerTurn === 'function') {
            window.gameTimer.startPlayerTurn(nextPlayerAfterSelection);
        }
    } else {
        // If not in strategy selection phase, update turn order by initiative
        updateTurnOrderByInitiative(); // This will call saveGameState()
    }
    
    return true;
}

function proceedToActivePhase() {
    const state = window.stateCore.getGameState();
    
    if (state.stage === 'strategy-selection') {
        const needsDualCards = state.players.length <= 4;
        
        let allPlayersSelected = false;
        if (needsDualCards) {
            // For dual cards, all players need exactly 2 strategy cards
            allPlayersSelected = state.players.every(p => 
                p.strategyCards && p.strategyCards.length === 2
            );
        } else {
            // For standard play, all players need 1 strategy card
            allPlayersSelected = state.players.every(
                p => state.selectedCards[p.id]
            );
        }
        
        if (allPlayersSelected) {
            window.stateCore.recordHistory();

            // Set up strategy cards for action phase
            state.players.forEach(player => {
                if (needsDualCards) {
                    // Keep the array of cards and initialize usage tracking
                    if (!player.strategyCardsUsed) {
                        player.strategyCardsUsed = [];
                    }
                    // Also maintain backwards compatibility
                    player.strategyCard = player.strategyCards[0]; // Primary card for display
                } else {
                    // Standard single card setup
                    player.strategyCard = state.selectedCards[player.id] || null;
                }
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
            
            // Update turn order to account for Naalu tokens in action phase
            updateTurnOrderByInitiative();
            
            // Start the turn timer for the first player in the action phase
            if (state.turnOrder && state.turnOrder.length > 0) {
                const firstPlayerId = state.turnOrder[0];
                if (window.gameTimer && typeof window.gameTimer.startPlayerTurn === 'function') {
                    window.gameTimer.startPlayerTurn(firstPlayerId);
                }
            }
            
            window.stateCore.saveGameState();
        } else {
            if (needsDualCards) {
                console.warn("Not all players have selected both strategy cards.");
            } else {
                console.warn("Not all players have selected strategy cards.");
            }
        }
    }
}

// Naalu Faction Special Ability: "0" Token
function placeNaaluToken(playerId) {
    const state = window.stateCore.getGameState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) {
        console.warn('Player not found for Naalu token placement');
        return false;
    }
    
    // Check if player is Naalu faction
    if (!player.faction || !player.faction.includes('Naalu')) {
        console.warn('Only Naalu Collective can place the "0" token');
        return false;
    }
    
    // Check if player has a strategy card
    if (!player.strategyCard && (!player.strategyCards || player.strategyCards.length === 0)) {
        console.warn('Player must have a strategy card to place Naalu token');
        return false;
    }
    
    player.naaluToken = true;
    window.stateCore.saveGameState();
    console.log(`Naalu token placed for player ${player.name}`);
    return true;
}

function removeNaaluToken(playerId) {
    const state = window.stateCore.getGameState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) {
        console.warn('Player not found for Naalu token removal');
        return false;
    }
    
    player.naaluToken = false;
    window.stateCore.saveGameState();
    console.log(`Naalu token removed for player ${player.name}`);
    return true;
}

function autoPlaceNaaluTokenAfterSelection(playerId) {
    const state = window.stateCore.getGameState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return false;
    
    // Auto-place token if this is Naalu and they just selected a strategy card
    if (player.faction && player.faction.includes('Naalu') && 
        (player.strategyCard || (player.strategyCards && player.strategyCards.length > 0))) {
        return placeNaaluToken(playerId);
    }
    
    return false;
}

function removeAllNaaluTokens() {
    const state = window.stateCore.getGameState();
    
    state.players.forEach(player => {
        if (player.naaluToken) {
            player.naaluToken = false;
        }
    });
    
    window.stateCore.saveGameState();
    console.log('All Naalu tokens removed for new strategy phase');
}

// Toggle Naalu token
function toggleNaaluToken(playerId) {
    const state = window.stateCore.getGameState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) {
        console.warn('Player not found for Naalu token toggle');
        return false;
    }
    
    // Check if player is Naalu faction
    if (!player.faction || !player.faction.includes('Naalu')) {
        console.warn('Only Naalu Collective can use the "0" token');
        return false;
    }
    
    // Check if player has a strategy card
    if (!player.strategyCard && (!player.strategyCards || player.strategyCards.length === 0)) {
        console.warn('Player must have a strategy card to use Naalu token');
        return false;
    }
    
    player.naaluToken = !player.naaluToken;
    window.stateCore.saveGameState();
    
    // Update turn order if we're in action or status phase
    if (state.phase === 'Action' || state.phase === 'Status') {
        updateTurnOrderByInitiative();
    }
    
    console.log(`Naalu token ${player.naaluToken ? 'activated' : 'deactivated'} for player ${player.name}`);
    return true;
}

// Gift of Prescience Promissory Note Functions
function playGiftOfPrescience(playerId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) {
        console.warn('Player not found for Gift of Prescience');
        return false;
    }
    
    // Check if player has a strategy card
    if (!player.strategyCard && (!player.strategyCards || player.strategyCards.length === 0)) {
        console.warn('Player must have a strategy card to play Gift of Prescience');
        return false;
    }
    
    // Check if any player already has Gift of Prescience active
    const existingGiftPlayer = state.players.find(p => p.giftOfPrescience);
    if (existingGiftPlayer) {
        console.warn('Gift of Prescience is already active for another player');
        return false;
    }
    
    // Remove any existing Naalu tokens (Gift of Prescience takes precedence)
    state.players.forEach(p => {
        if (p.naaluToken) {
            p.naaluToken = false;
        }
    });
    
    // Activate Gift of Prescience for this player
    player.giftOfPrescience = true;
    
    // Update turn order to put this player first
    updateTurnOrderByInitiative();
    
    window.stateCore.saveGameState();
    console.log(`Gift of Prescience activated for player ${player.name}`);
    return true;
}

function removeGiftOfPrescience(playerId) {
    const state = window.stateCore.getGameState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) {
        console.warn('Player not found for Gift of Prescience removal');
        return false;
    }
    
    player.giftOfPrescience = false;
    window.stateCore.saveGameState();
    console.log(`Gift of Prescience removed for player ${player.name}`);
    return true;
}

function removeAllGiftOfPrescience() {
    const state = window.stateCore.getGameState();
    
    state.players.forEach(player => {
        if (player.giftOfPrescience) {
            player.giftOfPrescience = false;
        }
    });
    
    window.stateCore.saveGameState();
    console.log('All Gift of Prescience promissory notes removed for new round');
}

function checkIfNaaluInGame() {
    const state = window.stateCore.getGameState();
    return state.players.some(player => 
        player.faction && (
            player.faction === 'The Naalu Collective' || 
            player.faction === 'Naalu Collective' ||
            player.faction.includes('Naalu')
        )
    );
}

// Export all functions that will be used by other modules
window.strategyPhase = {
    initializeStrategyPhaseTurnOrder,
    getNextPlayerInOrder,
    updateTurnOrderByInitiative,
    selectStrategyCard,
    proceedToActivePhase,
    placeNaaluToken,
    removeNaaluToken,
    autoPlaceNaaluTokenAfterSelection,
    removeAllNaaluTokens,
    playGiftOfPrescience,
    removeGiftOfPrescience,
    removeAllGiftOfPrescience,
    checkIfNaaluInGame
};
