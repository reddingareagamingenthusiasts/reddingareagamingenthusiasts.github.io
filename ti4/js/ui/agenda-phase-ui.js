// Agenda Phase UI Components for TI4 Scoreboard

function renderAgendaPhaseUI(container) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    
    const state = window.stateCore.getGameState();
    
    if (state.phase !== 'Agenda') {
        container.innerHTML = '<p class="phase-message">Waiting for Agenda Phase to begin.</p>';
        return;
    }
    
    // Initialize influence counters if they don't exist
    if (!state.influenceCounters) {
        state.influenceCounters = {};
        state.players.forEach(player => {
            state.influenceCounters[player.id] = player.influence || 0;
        });
        window.stateCore.saveGameState();
    }
    
    // Create main wrapper
    const agendaPhaseWrapper = document.createElement('div');
    agendaPhaseWrapper.className = 'agenda-phase-wrapper';
    
    // Add player score bar at the top
    const playerBarContainer = document.createElement('div');
    playerBarContainer.className = 'agenda-player-bar-container';
    window.playerScoreBar.renderPlayerScoreBar(playerBarContainer, {
        currentPlayerId: null, // No current player in agenda phase
        showStrategyCards: true,
        showScoreControls: true,
        showPassedState: false
    });
    agendaPhaseWrapper.appendChild(playerBarContainer);
    
    // Add header
    const header = document.createElement('h2');
    header.className = 'phase-header';
    header.textContent = 'Influence counters';
    agendaPhaseWrapper.appendChild(header);
    
    // Create influence counters container
    const influenceContainer = document.createElement('div');
    influenceContainer.className = 'influence-counters-container';
    
    // Get players in speaker order (clockwise from speaker)
    let orderedPlayers = [];
    
    // Find the speaker
    const speakerIndex = state.players.findIndex(player => player.isCurrentSpeaker);
    
    if (speakerIndex === -1) {
        // If no speaker found, use default player order
        orderedPlayers = [...state.players];
    } else {
        // Create player order starting with speaker and going clockwise
        for (let i = 0; i < state.players.length; i++) {
            const playerIndex = (speakerIndex + i) % state.players.length;
            orderedPlayers.push(state.players[playerIndex]);
        }
    }
    
    // Create player boxes with influence counters in speaker order
    orderedPlayers.forEach(player => {
        const playerBox = document.createElement('div');
        playerBox.className = 'agenda-player-box';
        playerBox.style.borderColor = player.color;
        
        // Player info section (left side)
        const playerInfo = document.createElement('div');
        playerInfo.className = 'agenda-player-info';
        
        // Player name with speaker icon if applicable
        const playerName = document.createElement('div');
        playerName.className = 'agenda-player-name';
        playerName.style.color = player.color;
        playerName.textContent = player.name;
        
        if (player.isCurrentSpeaker) {
            const speakerIcon = document.createElement('img');
            speakerIcon.src = 'images/icons/gavel.svg';
            speakerIcon.className = 'speaker-icon';
            speakerIcon.title = 'Current Speaker';
            speakerIcon.alt = 'Speaker';
            playerName.appendChild(speakerIcon);
        }
        
        playerInfo.appendChild(playerName);
        
        // Player faction
        const playerFaction = document.createElement('div');
        playerFaction.className = 'agenda-player-faction';
        
        // Add faction icon if available
        if (player.faction) {
            const factionDetails = state.factions.find(f => f.name.replace(/^The /, '') === player.faction);
            if (factionDetails && factionDetails.id) {
                const factionIcon = document.createElement('img');
                factionIcon.src = `images/factions/${factionDetails.id}.webp`;
                factionIcon.alt = player.faction;
                factionIcon.className = 'agenda-faction-icon';
                playerFaction.appendChild(factionIcon);
            }
            
            const factionName = document.createElement('span');
            factionName.textContent = player.faction;
            playerFaction.appendChild(factionName);
        } else {
            playerFaction.textContent = 'No Faction';
        }
        
        // Add speaker icon if this player is the current speaker
        if (player.isCurrentSpeaker) {
            const speakerIcon = document.createElement('img');
            speakerIcon.src = 'images/icons/gavel.svg';
            speakerIcon.className = 'speaker-icon speaker-badge';
            speakerIcon.title = 'Current Speaker';
            speakerIcon.alt = 'Speaker';
            playerName.appendChild(speakerIcon);
        }

        // Declare and initialize playerIndicator and counterBox before use
        const playerIndicator = document.createElement('div');
        playerIndicator.className = 'agenda-player-indicator';
        playerIndicator.appendChild(playerName);
        playerIndicator.appendChild(playerFaction);

        const counterBox = document.createElement('div');
        counterBox.className = 'agenda-counter-box';
        counterBox.appendChild(playerIndicator);
        
        // Influence counter section (right side)
        const influenceSection = document.createElement('div');
        influenceSection.className = 'agenda-influence-section';
        
        // Influence label
        const influenceLabel = document.createElement('div');
        influenceLabel.className = 'agenda-influence-label';
        influenceLabel.textContent = 'Influence:';
        influenceSection.appendChild(influenceLabel);
        
        // Influence counter with controls
        const influenceCounter = document.createElement('div');
        influenceCounter.className = 'agenda-influence-counter';
        
        // Decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'influence-btn decrease';
        decreaseBtn.innerHTML = '<i class="fas fa-minus"></i>';
        decreaseBtn.onclick = () => updateInfluence(player.id, -1);
        influenceCounter.appendChild(decreaseBtn);
        
        // Influence value
        const influenceValue = document.createElement('div');
        influenceValue.className = 'influence-value';
        influenceValue.textContent = state.influenceCounters[player.id] || 0;
        influenceCounter.appendChild(influenceValue);
        
        // Increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'influence-btn increase';
        increaseBtn.innerHTML = '<i class="fas fa-plus"></i>';
        increaseBtn.onclick = () => updateInfluence(player.id, 1);
        influenceCounter.appendChild(increaseBtn);
        
        influenceSection.appendChild(influenceCounter);
        playerBox.appendChild(influenceSection);
        
        influenceContainer.appendChild(playerBox);
    });
    
    agendaPhaseWrapper.appendChild(influenceContainer);
    
    // Add agenda steps section
    const stepsHeader = document.createElement('h2');
    stepsHeader.className = 'phase-header agenda-steps-header';
    stepsHeader.textContent = `Resolve Agenda ${state.currentAgendaNumber || 1} of 2`;
    agendaPhaseWrapper.appendChild(stepsHeader);
    
    // Create steps container
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'agenda-steps-container';
    
    // Define the agenda steps
    const agendaSteps = [
        '1. Reveal and read the Agenda',
        '2. Apply "When an agenda is revealed"',
        '3. Apply "After an agenda is revealed"',
        '4. Open discussion',
        '5. Voting',
        '6. Result & resolve'
    ];
    
    // Add each step
    agendaSteps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'agenda-step';
        stepEl.textContent = step;
        
        // Highlight current step if it exists in state
        // Default to step 0 (first step) if not set
        if ((state.currentAgendaStep === undefined && index === 0) || state.currentAgendaStep === index) {
            stepEl.classList.add('current-step');
        }
        
        stepsContainer.appendChild(stepEl);
    });
    
    agendaPhaseWrapper.appendChild(stepsContainer);
    
    // Add Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn-primary next-btn';
    nextButton.textContent = 'Next';
    
    // If we're on the last step of the second agenda, show Complete button
    if (state.currentAgendaStep === agendaSteps.length - 1 && state.currentAgendaNumber === 2) {
        nextButton.textContent = 'Complete Agenda Phase';
        nextButton.onclick = () => window.agendaPhase.completeAgendaPhase();
    } else {
        // Otherwise, advance to next step or next agenda
        nextButton.onclick = () => advanceAgendaStep();
    }
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container';
    btnContainer.appendChild(nextButton);
    agendaPhaseWrapper.appendChild(btnContainer);
    
    container.appendChild(agendaPhaseWrapper);
}

// Function to update a player's influence count
function updateInfluence(playerId, amount) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Initialize if needed
    if (!state.influenceCounters) {
        state.influenceCounters = {};
    }
    
    // Initialize player's influence if needed
    if (state.influenceCounters[playerId] === undefined) {
        state.influenceCounters[playerId] = 0;
    }
    
    // Update the influence (don't allow negative values)
    state.influenceCounters[playerId] = Math.max(0, state.influenceCounters[playerId] + amount);
    
    window.stateCore.saveGameState();
    
    // Re-render the UI
    const container = document.getElementById('agenda-phase-container');
    if (container) renderAgendaPhaseUI(container);
}

// Function to advance to the next agenda step or next agenda
function advanceAgendaStep() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    // Initialize if needed
    if (state.currentAgendaStep === undefined) {
        state.currentAgendaStep = 0;
    }
    
    if (state.currentAgendaNumber === undefined) {
        state.currentAgendaNumber = 1;
    }
    
    // Advance to next step
    state.currentAgendaStep++;
    
    // If we've completed all steps for this agenda, move to the next agenda
    if (state.currentAgendaStep >= 6) { // 6 steps per agenda
        state.currentAgendaStep = 0;
        state.currentAgendaNumber++;
    }
    
    window.stateCore.saveGameState();
    
    // Re-render the UI
    const container = document.getElementById('agenda-phase-container');
    if (container) renderAgendaPhaseUI(container);
}

// Helper function to get contrast text color based on background color
function getContrastTextColor(hexColor) {
    // Default to white text if no color or invalid format
    if (!hexColor || typeof hexColor !== 'string') return '#FFFFFF';
    
    // Remove # if present
    const color = hexColor.replace('#', '');
    
    // Convert hex to RGB
    let r, g, b;
    if (color.length === 6) {
        r = parseInt(color.substr(0, 2), 16);
        g = parseInt(color.substr(2, 2), 16);
        b = parseInt(color.substr(4, 2), 16);
    } else if (color.length === 3) {
        r = parseInt(color.charAt(0) + color.charAt(0), 16);
        g = parseInt(color.charAt(1) + color.charAt(1), 16);
        b = parseInt(color.charAt(2) + color.charAt(2), 16);
    } else {
        return '#FFFFFF'; // Default to white for invalid format
    }
    
    // Calculate perceived brightness (YIQ formula)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Return black or white based on brightness
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

// Export all UI functions
window.agendaPhaseUI = {
    renderAgendaPhaseUI,
    updateInfluence,
    advanceAgendaStep,
    getContrastTextColor
};
