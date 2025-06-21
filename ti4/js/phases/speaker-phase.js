// Speaker Selection Phase logic for TI4 Scoreboard

function selectSpeaker(playerId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    if (state.stage !== 'speaker-selection') {
        console.warn('Cannot select speaker in current game stage');
        return false;
    }
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    // Clear any previous speaker
    state.players.forEach(p => {
        p.isCurrentSpeaker = false;
    });
    
    state.speaker = playerId;
    
    // Set the new speaker
    player.isCurrentSpeaker = true;
    
    // Update turn order to start with the speaker
    reorderTurnOrderFromSpeaker();
    
    window.stateCore.saveGameState();
    return true;
}

function selectRandomSpeaker() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    if (state.stage !== 'speaker-selection') {
        console.warn('Cannot select speaker in current game stage');
        return false;
    }
    
    // Select a random player as speaker
    const randomIndex = Math.floor(Math.random() * state.players.length);
    const randomPlayerId = state.players[randomIndex].id;
    
    return selectSpeaker(randomPlayerId);
}

function reorderTurnOrderFromSpeaker() {
    const state = window.stateCore.getGameState();
    
    if (!state.speaker) return false;
    
    // Find the index of the speaker in the players array
    const speakerIndex = state.players.findIndex(p => p.id === state.speaker);
    if (speakerIndex === -1) return false;
    
    // Create a new turn order starting with the speaker and going clockwise
    const newTurnOrder = [];
    for (let i = 0; i < state.players.length; i++) {
        const playerIndex = (speakerIndex + i) % state.players.length;
        newTurnOrder.push(state.players[playerIndex].id);
    }
    
    state.turnOrder = newTurnOrder;
    return true;
}

function confirmSpeakerAndProceed() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    if (state.stage !== 'speaker-selection') {
        console.warn('Not in speaker selection stage');
        return false;
    }
    
    if (!state.speaker) {
        console.warn('No speaker selected');
        return false;
    }
    
    // Set the first player as active
    state.activePlayer = 0;
    
    // Proceed to strategy selection
    state.stage = 'strategy-selection';
    state.phase = 'Strategy';
    
    // Auto-start the timer when transitioning to strategy selection (game officially begins)
    if (window.gameTimer && typeof window.gameTimer.startTimer === 'function') {
        window.gameTimer.startTimer();
        console.log('Timer auto-started on transition to strategy selection');
    }
    
    // Start the turn timer for the first player in strategy selection
    if (state.turnOrder && state.turnOrder.length > 0) {
        const firstPlayerId = state.turnOrder[0];
        if (window.gameTimer && typeof window.gameTimer.startPlayerTurn === 'function') {
            window.gameTimer.startPlayerTurn(firstPlayerId);
            console.log('Started turn timer for first player in strategy selection:', firstPlayerId);
        }
    }
    
    window.stateCore.saveGameState();
    return true;
}

// Export all functions that will be used by other modules
window.speakerPhase = {
    selectSpeaker,
    selectRandomSpeaker,
    reorderTurnOrderFromSpeaker,
    confirmSpeakerAndProceed
};
