// Agenda Phase Module for TI4 Scoreboard
// Handles the Agenda Phase logic including voting on agendas

// Function to proceed to Agenda Phase
function proceedToAgendaPhase() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    state.phase = 'Agenda';
    console.log("Proceeding to Agenda Phase");
    
    // Initialize agenda phase state if needed
    if (!state.agendaPhase) {
        state.agendaPhase = {
            currentAgenda: null,
            votesPerPlayer: {},
            outcome: null
        };
    }
    
    // Initialize agenda tracking
    state.currentAgendaStep = 0; // First step
    state.currentAgendaNumber = 1; // First agenda
      // Initialize influence counters if they don't exist
    if (!state.influenceCounters) {
        state.influenceCounters = {};
        state.players.forEach(player => {
            // Default influence is 0, would be calculated based on planets in a full implementation
            state.influenceCounters[player.id] = 0;
        });
    }

    // Ensure the speaker is properly marked with isCurrentSpeaker
    if (state.speaker) {
        state.players.forEach(player => {
            player.isCurrentSpeaker = (player.id === state.speaker);
        });
    }

    // Set up turn order for Agenda Phase based on speaker position
    initializeAgendaPhaseTurnOrder(state);
    
    window.stateCore.saveGameState();
    window.ui.updateUI();
}

// Function to complete Agenda Phase and proceed to next round
function completeAgendaPhase() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Reset agenda phase data
    state.agendaPhase = null;
    
    // Reset agenda tracking
    state.currentAgendaStep = undefined;
    state.currentAgendaNumber = undefined;
    
    // Proceed to next round in Strategy Phase
    state.round++;
    state.phase = 'Strategy';
    state.stage = 'strategy-selection'; // Set the game stage to strategy-selection
    state.selectedCards = {};
    state.turnOrder = [];
    state.actionPhasePlayerIndex = 0;
    state.passedPlayerCount = 0;
      // Reset player states for new round
    state.players.forEach(player => {
        player.strategyCard = null;
        player.strategyCardUsed = false;
        player.passed = false;
    });

    // Ensure the speaker is properly marked with isCurrentSpeaker
    if (state.speaker) {
        state.players.forEach(player => {
            player.isCurrentSpeaker = (player.id === state.speaker);
        });
    }

    console.log(`Agenda Phase complete. Starting Round ${state.round} in Strategy Phase.`);
    window.stateCore.saveGameState();
    window.ui.updateUI();
}

/**
 * Initialize the turn order for the Agenda Phase based on speaker position
 * @param {Object} state - The current game state
 */
function initializeAgendaPhaseTurnOrder(state) {
    // Find the speaker
    const speakerIndex = state.players.findIndex(player => player.isCurrentSpeaker);
    
    if (speakerIndex === -1) {
        console.warn('No speaker found, using first player as default');
        // If no speaker is found, use the first player as default
        state.agendaTurnOrder = state.players.map(player => player.id);
    } else {
        // Create turn order starting with speaker and going clockwise
        state.agendaTurnOrder = [];
        for (let i = 0; i < state.players.length; i++) {
            const playerIndex = (speakerIndex + i) % state.players.length;
            state.agendaTurnOrder.push(state.players[playerIndex].id);
        }
    }
    
    console.log('Initialized agenda phase turn order:', state.agendaTurnOrder);
}

// Export all functions that will be used by other modules
window.agendaPhase = {
    proceedToAgendaPhase,
    completeAgendaPhase,
    initializeAgendaPhaseTurnOrder
};
