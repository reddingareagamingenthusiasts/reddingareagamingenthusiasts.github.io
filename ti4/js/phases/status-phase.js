// Status Phase Module for TI4 Scoreboard
// Handles the Status Phase logic including scoring objectives, revealing objectives, etc.

// Function to transition to Status Phase
function proceedToStatusPhase() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    state.phase = 'Status';
    console.log("Proceeding to Status Phase. Players will score objectives, reveal objectives, etc.");

    // --- Status Phase Steps ---
    // 1. Score public/secret objectives
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

// Function to score an objective for a player
function scoreObjective(playerId, objectiveId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    const player = state.players.find(p => p.id === playerId);
    const objective = findObjectiveById(objectiveId, state);
    
    if (!player || !objective) {
        console.log("Player or objective not found");
        return false;
    }
    
    // Check if player has already scored this objective
    const alreadyScored = state.scoredObjectives && 
                          state.scoredObjectives[playerId] && 
                          state.scoredObjectives[playerId].includes(objectiveId);
    
    if (alreadyScored) {
        console.log(`${player.name} has already scored this objective`);
        return false;
    }
    
    // Initialize scored objectives structure if needed
    if (!state.scoredObjectives) {
        state.scoredObjectives = {};
    }
    if (!state.scoredObjectives[playerId]) {
        state.scoredObjectives[playerId] = [];
    }
    
    // Add objective to player's scored objectives
    state.scoredObjectives[playerId].push(objectiveId);
    
    // Update player's score
    player.score += objective.points;
    
    console.log(`${player.name} scored the objective "${objective.name}" for ${objective.points} points. New score: ${player.score}`);
    
    window.stateCore.saveGameState();
    return true;
}

// Function to reveal a new objective
function revealObjective(stageType, objectiveId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    if (stageType !== 'Stage I' && stageType !== 'Stage II') {
        console.log("Invalid stage type");
        return false;
    }
    
    const objective = findObjectiveById(objectiveId, state);
    if (!objective) {
        console.log("Objective not found");
        return false;
    }
    
    // Add objective to revealed objectives
    if (stageType === 'Stage I') {
        if (!state.revealedStageIObjectives) {
            state.revealedStageIObjectives = [];
        }
        state.revealedStageIObjectives.push(objectiveId);
    } else {
        if (!state.revealedStageIIObjectives) {
            state.revealedStageIIObjectives = [];
        }
        state.revealedStageIIObjectives.push(objectiveId);
    }
    
    console.log(`Revealed ${stageType} objective: ${objective.name}`);
    
    window.stateCore.saveGameState();
    return true;
}

// Function to proceed to the next round
function proceedToNextRound() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Reset the status phase step counter
    state.statusPhaseStep = 0;
    
    // Automatically determine if Custodians Token has been taken by checking if any player has it
    const custodianTokenTaken = state.players.some(player => player.custodians);
    
    // Determine the next phase based on the Custodians Token status
    if (custodianTokenTaken) {
        // If Custodians Token is taken, proceed to Agenda Phase
        console.log("Custodians Token has been taken. Proceeding to Agenda Phase.");
        proceedToAgendaPhase();
    } else {
        // If Custodians Token is not taken, proceed to Strategy Phase for the next round
        console.log("Custodians Token has not been taken. Proceeding to next round.");
        state.round++;
        state.phase = 'Strategy'; // Start the new round in the Strategy phase
        state.stage = 'strategy-selection'; // Ensure UI shows the strategy selection phase
        state.selectedCards = {}; // Clear selected strategy cards
        
        // Use the nextRoundTurnOrder if it exists (set when a new speaker is selected)
        if (state.nextRoundTurnOrder && state.nextRoundTurnOrder.length > 0) {
            state.turnOrder = [...state.nextRoundTurnOrder];
            console.log('Using pre-determined turn order for next round:', state.turnOrder);
            // Clear the nextRoundTurnOrder after using it
            delete state.nextRoundTurnOrder;
        } else {
            // Otherwise, clear the turn order to be re-established based on current speaker
            state.turnOrder = [];
            console.log('No pre-determined turn order, will initialize based on current speaker');
        }
          state.actionPhasePlayerIndex = 0; // Reset for the new action phase
        state.passedPlayerCount = 0; // Reset passed player count

        // Ensure the speaker is properly marked with isCurrentSpeaker
        if (state.speaker) {
            state.players.forEach(player => {
                player.isCurrentSpeaker = (player.id === state.speaker);
            });
        }

        state.players.forEach(player => {
            player.strategyCard = null; // Strategy card is returned
            player.strategyCards = []; // Reset multiple strategy cards
            player.strategyCardUsed = false;
            player.strategyCardsUsed = []; // Reset used cards tracking
            player.passed = false;
            player.naaluToken = false; // Reset Naalu "0" token for new strategy phase
            player.giftOfPrescience = false; // Return Gift of Prescience at end of status phase
        });

        // Start the turn timer for the first player in strategy selection
        // Need to ensure turn order is initialized first
        if (state.turnOrder && state.turnOrder.length > 0) {
            const firstPlayerId = state.turnOrder[0];
            if (window.gameTimer && typeof window.gameTimer.startPlayerTurn === 'function') {
                window.gameTimer.startPlayerTurn(firstPlayerId);
                console.log('Started turn timer for first player in new round strategy selection:', firstPlayerId);
            }
        } else {
            // If turn order is empty, initialize it and then start timer
            if (window.strategyPhase && typeof window.strategyPhase.initializeStrategyPhaseTurnOrder === 'function') {
                window.strategyPhase.initializeStrategyPhaseTurnOrder();
                if (state.turnOrder && state.turnOrder.length > 0) {
                    const firstPlayerId = state.turnOrder[0];
                    if (window.gameTimer && typeof window.gameTimer.startPlayerTurn === 'function') {
                        window.gameTimer.startPlayerTurn(firstPlayerId);
                        console.log('Initialized turn order and started turn timer for first player:', firstPlayerId);
                    }
                }
            }
        }

        console.log(`Starting Round ${state.round}. Proceed to Strategy Phase.`);
    }
    
    window.stateCore.saveGameState();
    return true;
}

// Helper function to find an objective by ID
function findObjectiveById(objectiveId, state) {
    // Check Stage I objectives
    const stageIObj = state.stageIObjectives && state.stageIObjectives.find(obj => obj.id === objectiveId);
    if (stageIObj) return stageIObj;
    
    // Check Stage II objectives
    const stageIIObj = state.stageIIObjectives && state.stageIIObjectives.find(obj => obj.id === objectiveId);
    if (stageIIObj) return stageIIObj;
    
    // Check Secret objectives
    const secretObj = state.secretObjectives && state.secretObjectives.find(obj => obj.id === objectiveId);
    if (secretObj) return secretObj;
    
    return null;
}

// Function to proceed to the Agenda Phase
function proceedToAgendaPhase() {
    const state = window.stateCore.getGameState();
    
    state.phase = 'Agenda';
    console.log("Proceeding to Agenda Phase");
    
    // Additional Agenda Phase setup would go here
    // For now, we'll just set the phase
}

// Export all functions that will be used by other modules
window.statusPhase = {
    proceedToStatusPhase,
    checkWinCondition,
    scoreObjective,
    revealObjective,
    proceedToNextRound,
    findObjectiveById,
    proceedToAgendaPhase
};
