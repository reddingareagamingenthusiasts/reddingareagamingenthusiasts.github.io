// Action Phase logic for TI4 Scoreboard

function advanceActionPhaseTurn() {
    console.log('advanceActionPhaseTurn called');
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();

    // End the current player's turn timer before advancing
    if (window.gameTimer && typeof window.gameTimer.endCurrentPlayerTurn === 'function') {
        window.gameTimer.endCurrentPlayerTurn();
    }

    // Find the next unPassed player
    let nextPlayerFound = false;
    let currentIndex = state.actionPhasePlayerIndex;
    
    console.log('Current action phase player index:', currentIndex);
    
    // Start by incrementing the index once to move from current player
    currentIndex = (currentIndex + 1) % state.turnOrder.length;
    const startingIndex = currentIndex; // Remember where we started
    
    console.log('Looking for next player starting at index:', currentIndex);
    
    // Loop until we find an unPassed player or come back to where we started
    do {
        // Get the player ID from the turn order
        const playerId = state.turnOrder[currentIndex];
        // Find the actual player object
        const player = state.players.find(p => p.id === playerId);
        
        console.log(`Checking player at index ${currentIndex}: ${player ? player.name : 'not found'}, passed: ${player ? player.passed : 'N/A'}`);
        
        if (player && !player.passed) {
            nextPlayerFound = true;
            state.actionPhasePlayerIndex = currentIndex;
            console.log(`Next player found: ${player.name} at index ${currentIndex}`);
            break;
        }
        
        // Move to the next player in the turn order
        currentIndex = (currentIndex + 1) % state.turnOrder.length;
    } while (currentIndex !== startingIndex);

    if (!nextPlayerFound) {
        // If we couldn't find an unPassed player, the round is over
        console.log('No unpassed players found, proceeding to status phase');
        proceedToStatusPhase();
        return;
    }

    // Update the active player index
    state.activePlayer = state.actionPhasePlayerIndex;
    
    // Start the new player's turn timer
    const newCurrentPlayerId = state.turnOrder[state.actionPhasePlayerIndex];
    console.log('Starting timer for new current player:', newCurrentPlayerId);
    if (window.gameTimer && typeof window.gameTimer.startPlayerTurn === 'function') {
        window.gameTimer.startPlayerTurn(newCurrentPlayerId);
    }
    
    console.log('Calling saveGameState to update UI');
    window.stateCore.saveGameState();

    // Clear any staged action when advancing turns (moved to end)
    clearStagedAction();
}

function playerPlaysStrategyCard(playerId, cardName = null) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();

    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    const needsDualCards = state.players.length <= 4;
    
    if (needsDualCards) {
        // For dual cards, specify which card to play
        if (!cardName) {
            console.warn('Card name required for dual strategy card play');
            return;
        }
        
        if (!player.strategyCards || !player.strategyCards.includes(cardName)) {
            console.warn('Player does not have the specified strategy card');
            return;
        }
        
        if (player.strategyCardsUsed && player.strategyCardsUsed.includes(cardName)) {
            console.warn('Strategy card already used');
            return;
        }
        
        // Record the action
        stageAction(playerId, {
            type: 'strategy',
            card: cardName
        });
    } else {
        // Standard single card logic
        if (!player.strategyCard) {
            console.warn('Player has no strategy card');
            return;
        }
        
        if (player.strategyCardUsed) {
            console.warn('Strategy card already used');
            return;
        }
        
        // Record the action
        stageAction(playerId, {
            type: 'strategy',
            card: player.strategyCard
        });
    }

    window.stateCore.saveGameState();
}

function playerPerformsComponentAction(playerId, actionDetails = "Generic Component Action") {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();

    const player = state.players.find(p => p.id === playerId);
    if (!player || player.passed) return;

    // Record the action
    stageAction(playerId, {
        type: 'component',
        details: actionDetails
    });

    window.stateCore.saveGameState();
}

function playerPassesActionPhase(playerId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();

    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    // Record the action
    stageAction(playerId, {
        type: 'pass'
    });

    window.stateCore.saveGameState();
}

function stageAction(playerId, actionType) {
    const state = window.stateCore.getGameState();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return;

    // Clear any previously staged action
    clearStagedAction();

    // Stage the new action
    state.stagedPlayerAction = {
        playerId: playerId,
        playerName: player.name,
        actionType: actionType,
        confirmed: false
    };

    window.stateCore.saveGameState();
}

function confirmCurrentPlayerAction() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();

    if (!state.stagedPlayerAction || state.stagedPlayerAction.confirmed) return;

    const player = state.players.find(p => p.id === state.stagedPlayerAction.playerId);
    if (!player) return;

    const needsDualCards = state.players.length <= 4;

    // Process the action based on its type
    switch (state.stagedPlayerAction.actionType.type) {
        case 'strategy':
            // Show strategy card modal instead of immediately confirming
            if (window.strategyCardModal && window.strategyCardModal.showStrategyCardModal) {
                window.strategyCardModal.showStrategyCardModal(
                    state.stagedPlayerAction.actionType.card,
                    player,
                    'primary'
                );
                return; // Modal will handle the rest of the flow
            } else {
                // Fallback to old behavior if modal not available
                state.stagedPlayerAction.confirmed = true;
                if (needsDualCards) {
                    // For dual cards, mark the specific card as used
                    if (!player.strategyCardsUsed) {
                        player.strategyCardsUsed = [];
                    }
                    player.strategyCardsUsed.push(state.stagedPlayerAction.actionType.card);
                    console.log(`Player ${player.name} used strategy card: ${state.stagedPlayerAction.actionType.card}`);
                } else {
                    // Standard single card logic
                    player.strategyCardUsed = true;
                }
                
                // Check if this is the Politics strategy card
                if (state.stagedPlayerAction.actionType.card === 'Politics') {
                    // Prompt to select a new speaker
                    promptForNewSpeaker(player.id);
                    return; // Don't advance turn yet, wait for speaker selection
                }
                
                // Strategy card played, advance to next player
                advanceActionPhaseTurn();
                return;
            }
            break;
        case 'pass':
            // Check if player can pass (for dual cards, both must be used)
            if (needsDualCards) {
                const usedCards = player.strategyCardsUsed ? player.strategyCardsUsed.length : 0;
                const totalCards = player.strategyCards ? player.strategyCards.length : 0;
                
                if (usedCards < totalCards) {
                    console.warn(`Player ${player.name} cannot pass - must use all strategy cards first (${usedCards}/${totalCards} used)`);
                    // Don't allow passing, clear the staged action
                    clearStagedAction();
                    return;
                }
            } else {
                // For standard play, check if strategy card was used (if they have one)
                if (player.strategyCard && !player.strategyCardUsed) {
                    console.warn(`Player ${player.name} cannot pass - must use strategy card first`);
                    // Don't allow passing, clear the staged action
                    clearStagedAction();
                    return;
                }
            }
            
            // Mark the player as passed
            player.passed = true;
            state.passedPlayerCount++;
            state.stagedPlayerAction.confirmed = true;
            break;
        case 'component':
            // Component actions are simple, just confirm them.
            state.stagedPlayerAction.confirmed = true;
            break;
    }

    // Advance turn for pass actions and component actions
    // Strategy card actions are handled by the modal or fallback logic above
    if (state.stagedPlayerAction.actionType.type === 'pass' || state.stagedPlayerAction.actionType.type === 'component') {
        advanceActionPhaseTurn();
    }

    window.stateCore.saveGameState();
}

function clearStagedAction() {
    console.log('clearStagedAction called');
    const state = window.stateCore.getGameState();
    console.log('Current staged action:', state.stagedPlayerAction);
    state.stagedPlayerAction = null;
    window.stateCore.saveGameState();
}

// Function to transition to Status Phase
function proceedToStatusPhase() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // End the current player's turn timer when moving to Status Phase
    if (window.gameTimer && typeof window.gameTimer.endCurrentPlayerTurn === 'function') {
        window.gameTimer.endCurrentPlayerTurn();
    }
    
    state.phase = 'Status';
    console.log("Proceeding to Status Phase. Players will score objectives, reveal objectives, etc.");

    // --- Actual Status Phase Steps (simplified for now, would involve UI interaction) ---
    // 1. Score public/secret objectives (players check if they meet criteria)
    // 2. Reveal next public objective (if applicable based on round/rules)
    // 3. Return strategy cards (this is handled in nextRound())
    // 4. Ready cards (planets, technologies, etc.)
    // 5. Repair units
    // 6. Gain and redistribute command tokens
    // --- End Status Phase Steps ---

    // After all status phase activities, check for game end.
    const winner = checkWinCondition(state);
    if (winner) {
        state.stage = 'gameover';
        state.winnerInfo = { id: winner.id, name: winner.name, score: winner.score }; // Store winner details
        console.log(`Game Over! ${winner.name} has won with ${winner.score} points!`);
        // The UI should update to show a game over screen.
    } else {
        // If no winner, the game typically proceeds to the Agenda Phase if applicable,
        // or directly to preparing for the next game round.
        console.log("Status Phase complete. Next would be Agenda Phase (if conditions met) or start of a new round.");
        // For now, nextRound() would need to be triggered (e.g., by a UI button "Start Next Round")
        // to reset states for the Strategy Phase of the next game round.
    }
    window.stateCore.saveGameState(); // Save changes including new phase and potential game over state
}

// Helper function to check win condition
function checkWinCondition(state) {
    // Check if any player has reached or exceeded the game length score
    return state.players.find(p => p.score >= state.gameLength);
}

/**
 * Prompt the user to select a new speaker after playing the Politics strategy card
 * @param {string} currentPlayerId - The ID of the player who played Politics
 */
function promptForNewSpeaker(currentPlayerId) {
    const state = window.stateCore.getGameState();
    
    // Create a modal for speaker selection
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'speaker-selection-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = 'Select New Speaker';
    modalContent.appendChild(title);
    
    const description = document.createElement('p');
    description.textContent = 'Choose a player other than the current speaker to become the new speaker.';
    modalContent.appendChild(description);
    
    const playerList = document.createElement('div');
    playerList.className = 'speaker-selection-list';
    
    // Add all players except the current speaker (Politics card allows selecting anyone other than the current speaker)
    state.players.forEach(player => {
        if (!player.isCurrentSpeaker) {
            const playerOption = document.createElement('div');
            playerOption.className = 'speaker-option';
            playerOption.style.borderColor = player.color;
            
            const playerName = document.createElement('span');
            playerName.textContent = player.name;
            playerName.style.color = player.color;
            playerOption.appendChild(playerName);
            
            playerOption.onclick = () => {
                selectNewSpeaker(player.id);
                modal.remove();
            };
            
            playerList.appendChild(playerOption);
        }
    });
    
    modalContent.appendChild(playerList);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

/**
 * Set a new speaker and update the game state
 * @param {string} newSpeakerId - The ID of the new speaker
 */
function selectNewSpeaker(newSpeakerId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Remove current speaker
    state.players.forEach(player => {
        player.isCurrentSpeaker = false;
    });
      // Set new speaker
    const newSpeaker = state.players.find(player => player.id === newSpeakerId);
    if (newSpeaker) {
        newSpeaker.isCurrentSpeaker = true;
        state.speaker = newSpeakerId; // Update the main speaker state property
        console.log(`New speaker selected: ${newSpeaker.name}`);
        
        // Reorder the turn order based on the new speaker for the next round
        // Find the index of the new speaker in the players array
        const speakerIndex = state.players.findIndex(player => player.id === newSpeakerId);
        
        if (speakerIndex !== -1) {
            // Create a new turn order starting with the new speaker and going clockwise
            const newTurnOrder = [];
            for (let i = 0; i < state.players.length; i++) {
                const playerIndex = (speakerIndex + i) % state.players.length;
                newTurnOrder.push(state.players[playerIndex].id);
            }
            
            // Store this as the next round's turn order
            state.nextRoundTurnOrder = newTurnOrder;
            console.log('Updated next round turn order:', newTurnOrder);
        }
    }
    
    window.stateCore.saveGameState();
    
    // Now continue with the turn (this will handle timer transitions)
    advanceActionPhaseTurn();
}

/**
 * Add a Support for the Throne token from one player to another
 * @param {string} fromPlayerId - The ID of the player giving support
 * @param {string} toPlayerId - The ID of the player receiving support
 */
function addSupportForTheThrone(fromPlayerId, toPlayerId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Don't allow players to support themselves
    if (fromPlayerId === toPlayerId) {
        console.log("Players cannot support themselves");
        return false;
    }
    
    // Initialize support structure if it doesn't exist
    if (!state.supportForTheThrone) {
        state.supportForTheThrone = {};
    }
    
    // Initialize the receiving player's support list if it doesn't exist
    if (!state.supportForTheThrone[toPlayerId]) {
        state.supportForTheThrone[toPlayerId] = [];
    }
    
    // Check if this player has already given support to the target
    if (state.supportForTheThrone[toPlayerId].includes(fromPlayerId)) {
        console.log("This player has already given support to the target");
        return false;
    }
    
    // Add the support
    state.supportForTheThrone[toPlayerId].push(fromPlayerId);
    
    // Update the receiving player's score
    const toPlayer = state.players.find(p => p.id === toPlayerId);
    if (toPlayer) {
        toPlayer.score += 1;
        console.log(`${toPlayer.name} received Support for the Throne and gained 1 VP`);
    }
    
    window.stateCore.saveGameState();
    return true;
}

/**
 * Remove a Support for the Throne token
 * @param {string} fromPlayerId - The ID of the player who gave support
 * @param {string} toPlayerId - The ID of the player who received support
 */
function removeSupportForTheThrone(fromPlayerId, toPlayerId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Check if the support structure exists
    if (!state.supportForTheThrone || !state.supportForTheThrone[toPlayerId]) {
        return false;
    }
    
    // Find the support in the array
    const supportIndex = state.supportForTheThrone[toPlayerId].indexOf(fromPlayerId);
    if (supportIndex === -1) {
        return false;
    }
    
    // Remove the support
    state.supportForTheThrone[toPlayerId].splice(supportIndex, 1);
    
    // Update the receiving player's score
    const toPlayer = state.players.find(p => p.id === toPlayerId);
    if (toPlayer) {
        toPlayer.score -= 1;
        console.log(`${toPlayer.name} lost Support for the Throne and lost 1 VP`);
    }
    
    window.stateCore.saveGameState();
    return true;
}

/**
 * Show the Support for the Throne modal for a player
 * @param {string} playerId - The ID of the player who will receive support
 */
function showSupportForTheThroneModal(playerId) {
    const state = window.stateCore.getGameState();
    
    // Create a modal for support selection
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'support-throne-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const title = document.createElement('h3');
    title.textContent = 'Support for the Throne';
    modalContent.appendChild(title);
    
    const targetPlayer = state.players.find(p => p.id === playerId);
    if (!targetPlayer) {
        modal.remove();
        return;
    }
    
    const description = document.createElement('p');
    description.textContent = `Select a player to give Support for the Throne to ${targetPlayer.name}:`;
    modalContent.appendChild(description);
    
    const playerList = document.createElement('div');
    playerList.className = 'support-selection-list';
    
    // Get list of players who have already given support to this player
    const existingSupport = state.supportForTheThrone && state.supportForTheThrone[playerId] 
        ? state.supportForTheThrone[playerId] 
        : [];
    
    // Add all players except the target player
    state.players.forEach(player => {
        if (player.id !== playerId) {
            const playerOption = document.createElement('div');
            playerOption.className = 'support-option';
            playerOption.style.borderColor = player.color;
            
            const playerName = document.createElement('span');
            playerName.textContent = player.name;
            playerName.style.color = player.color;
            playerOption.appendChild(playerName);
            
            // Check if this player has already given support
            const alreadySupporting = existingSupport.includes(player.id);
            if (alreadySupporting) {
                playerOption.classList.add('already-supporting');
                playerOption.title = 'Already supporting';
                
                // Add remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'support-remove-btn';
                removeBtn.textContent = 'Remove Support';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeSupportForTheThrone(player.id, playerId);
                    modal.remove();
                };
                playerOption.appendChild(removeBtn);
            } else {
                playerOption.onclick = () => {
                    addSupportForTheThrone(player.id, playerId);
                    modal.remove();
                };
            }
            
            playerList.appendChild(playerOption);
        }
    });
    
    modalContent.appendChild(playerList);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => modal.remove();
    modalContent.appendChild(closeBtn);
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

/**
 * Complete strategy card action from the modal
 * This function is called when the strategy card modal is completed
 */
function completeStrategyCardAction() {
    console.log('completeStrategyCardAction called');
    const state = window.stateCore.getGameState();
    
    if (!state.stagedPlayerAction) {
        console.log('No staged action found');
        return;
    }
    
    if (state.stagedPlayerAction.confirmed) {
        console.log('Action already confirmed');
        return;
    }
    
    const player = state.players.find(p => p.id === state.stagedPlayerAction.playerId);
    if (!player) {
        console.log('Player not found');
        return;
    }
    
    console.log('Processing strategy card completion for player:', player.name);
    
    // Mark the action as confirmed
    state.stagedPlayerAction.confirmed = true;
    
    const needsDualCards = state.players.length <= 4;
    
    // Mark the strategy card as used
    if (needsDualCards) {
        // For dual cards, mark the specific card as used
        if (!player.strategyCardsUsed) {
            player.strategyCardsUsed = [];
        }
        if (!player.strategyCardsUsed.includes(state.stagedPlayerAction.actionType.card)) {
            player.strategyCardsUsed.push(state.stagedPlayerAction.actionType.card);
        }
        console.log(`Player ${player.name} used strategy card: ${state.stagedPlayerAction.actionType.card}`);
    } else {
        // Standard single card logic
        player.strategyCardUsed = true;
        console.log(`Player ${player.name} used strategy card (single card mode)`);
    }
    
    // Check if this is the Politics strategy card
    if (state.stagedPlayerAction.actionType.card === 'Politics') {
        // Prompt to select a new speaker
        promptForNewSpeaker(player.id);
        return; // Don't advance turn yet, wait for speaker selection
    }
    
    // After playing a strategy card, the turn advances to the next player
    console.log('Strategy card played, advancing to next player');
    
    // Advance the turn (this will also clear the staged action)
    advanceActionPhaseTurn();
}

// Export all functions that will be used by other modules
window.actionPhase = {
    advanceActionPhaseTurn,
    playerPlaysStrategyCard,
    playerPerformsComponentAction,
    playerPassesActionPhase,
    stageAction,
    confirmCurrentPlayerAction,
    clearStagedAction,
    proceedToStatusPhase,
    checkWinCondition,
    promptForNewSpeaker,
    selectNewSpeaker,
    addSupportForTheThrone,
    removeSupportForTheThrone,
    showSupportForTheThroneModal,
    completeStrategyCardAction
};
