// Faction Selection Phase logic for TI4 Scoreboard

function selectFaction(playerId, factionName) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // if (state.stage !== 'faction-selection') {
    //     console.warn('Cannot select factions in current game stage');
    //     return false;
    // }
    
    // Check if faction is already selected by another player
    const factionAlreadySelected = state.players.some(p => 
        p.id !== playerId && p.faction === factionName
    );
    
    if (factionAlreadySelected) {
        console.warn('Faction already selected by another player');
        return false;
    }
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    player.faction = factionName;
    
    // If we have faction data available, set faction-specific properties
    if (typeof FACTIONS !== 'undefined') {
        const factionData = FACTIONS.find(f => f.name === factionName);
        if (factionData) {
            // Set default color if available
            if (factionData.color && !player.color) {
                player.color = factionData.color;
            }
            
            // Set any faction-specific abilities or starting resources here
        }
    }
    
    window.stateCore.saveGameState();
    return true;
}

function selectColor(playerId, colorCode) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Check if color is already selected by another player
    const colorAlreadySelected = state.players.some(p => 
        p.id !== playerId && p.color === colorCode
    );
    
    if (colorAlreadySelected) {
        console.warn('Color already selected by another player');
        return false;
    }
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    player.color = colorCode;
    window.stateCore.saveGameState();
    return true;
}

function setPlayerReady(playerId, isReady) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;
    
    player.isReady = isReady;
    window.stateCore.saveGameState();
    return true;
}

function proceedToSpeakerSelection() {
    const state = window.stateCore.getGameState();
    
    // Use the same conditions as the original startGame function
    const conditionsMet = state.players.length >= 2 &&
                          state.players.length <= (state.extendedMode ? 10 : 8) &&
                          state.players.every(p => p.faction && p.color);
    
    if (conditionsMet) {
        // CRITICAL: If we are in 'setup' and all conditions are met to start,
        // this is the point to save the current 'setup' state to history.
        if (state.stage === 'setup') {
            try {
                // Create a deep copy of the current state for history
                const finalSetupState = JSON.parse(JSON.stringify(state));
                window.gameStateHistory.push(finalSetupState);
            } catch (error) {
                console.error("Error recording final setup state for undo:", error);
            }
        }
        
        // Now, transition the stage
        state.stage = 'speaker-selection';
        
        // Set initial turn order based on player order
        // This will be updated later when a speaker is selected
        state.turnOrder = state.players.map(p => p.id);
        
        window.stateCore.saveGameState();
        return true;
    } else {
        console.warn("Not all players have selected factions and colors.");
        return false;
    }
}

// Export all functions that will be used by other modules
window.factionSelectionPhase = {
    selectFaction,
    selectColor,
    setPlayerReady,
    proceedToSpeakerSelection
};
