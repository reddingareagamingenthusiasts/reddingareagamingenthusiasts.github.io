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
    
    // Render player score bar directly in the main container
    window.playerScoreBar.renderPlayerScoreBar(container, {
        currentPlayerId: null, // No current player in agenda phase
        showStrategyCards: true,
        showScoreControls: true,
        showPassedState: false
    });
    
    // Create content wrapper for the rest of the agenda phase UI
    const agendaContentWrapper = document.createElement('div');
    agendaContentWrapper.className = 'agenda-content-wrapper';
    
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
        // Check if Argent Flight is present - they always vote first
        const argentPlayer = state.players.find(player => player.faction === 'Argent Flight');
        
        if (argentPlayer) {
            // Argent Flight votes first
            orderedPlayers.push(argentPlayer);
            
            // Then add all other players in normal order (starting with player after speaker)
            for (let i = 1; i < state.players.length; i++) {
                const playerIndex = (speakerIndex + i) % state.players.length;
                const player = state.players[playerIndex];
                // Skip Argent Flight since they're already first
                if (player.faction !== 'Argent Flight') {
                    orderedPlayers.push(player);
                }
            }
            // Add the speaker at the end (unless they are Argent Flight)
            if (state.players[speakerIndex].faction !== 'Argent Flight') {
                orderedPlayers.push(state.players[speakerIndex]);
            }
        } else {
            // Normal order: start with the player AFTER the speaker
            // Speaker votes last, so we start with the next player
            for (let i = 1; i < state.players.length; i++) {
                const playerIndex = (speakerIndex + i) % state.players.length;
                orderedPlayers.push(state.players[playerIndex]);
            }
            // Add the speaker at the end
            orderedPlayers.push(state.players[speakerIndex]);
        }
    }
    
    // Create compact pill-shaped influence counters in speaker order
    orderedPlayers.forEach(player => {
        // Create pill-shaped container
        const pillCounter = document.createElement('div');
        pillCounter.className = 'influence-pill-counter';
        pillCounter.style.borderColor = player.color;
        pillCounter.style.backgroundColor = `${player.color}22`; // Add transparency to player color
        
        // Player name at the top
        const playerName = document.createElement('div');
        playerName.className = 'influence-pill-name';
        playerName.style.color = player.color;
        playerName.textContent = player.name;
        
        // Add faction icon next to player name if available
        if (player.faction) {
            const factionDetails = state.factions.find(f => f.name.replace(/^The /, '') === player.faction);
            if (factionDetails && factionDetails.id) {
                const factionIcon = document.createElement('img');
                factionIcon.src = `images/factions/${factionDetails.id}.webp`;
                factionIcon.alt = player.faction;
                factionIcon.className = 'influence-pill-faction-icon';
                playerName.appendChild(factionIcon);
            }
        }
        
        // Add speaker icon if applicable
        if (player.isCurrentSpeaker) {
            const speakerIcon = document.createElement('i');
            speakerIcon.className = 'fas fa-gavel speaker-icon';
            speakerIcon.title = 'Current Speaker';
            playerName.appendChild(speakerIcon);
        }
        
        pillCounter.appendChild(playerName);
        
        // Create content wrapper for counter
        const pillContent = document.createElement('div');
        pillContent.className = 'influence-pill-content';
        
        // Influence counter with +/- buttons
        const counterControls = document.createElement('div');
        counterControls.className = 'influence-pill-controls';
        
        // Decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'influence-btn decrease';
        decreaseBtn.innerHTML = '<i class="fas fa-minus"></i>';
        decreaseBtn.onclick = () => updateInfluence(player.id, -1);
        counterControls.appendChild(decreaseBtn);
        
        // Influence value
        const influenceValue = document.createElement('div');
        influenceValue.className = 'influence-pill-value';
        influenceValue.textContent = state.influenceCounters[player.id] || 0;
        counterControls.appendChild(influenceValue);
        
        // Increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'influence-btn increase';
        increaseBtn.innerHTML = '<i class="fas fa-plus"></i>';
        increaseBtn.onclick = () => updateInfluence(player.id, 1);
        counterControls.appendChild(increaseBtn);
        
        pillContent.appendChild(counterControls);
        pillCounter.appendChild(pillContent);

        // Add voting controls below the counter controls
        const votingControls = document.createElement('div');
        votingControls.className = 'voting-controls';

        const voteForBtn = document.createElement('button');
        voteForBtn.className = `vote-btn for ${state.agendaVotes?.[player.id] === 'for' ? 'active' : ''}`;
        voteForBtn.title = 'Vote For';
        voteForBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
        voteForBtn.onclick = () => window.agendaPhase.setPlayerVote(player.id, 'for');
        votingControls.appendChild(voteForBtn);

        const voteAgainstBtn = document.createElement('button');
        voteAgainstBtn.className = `vote-btn against ${state.agendaVotes?.[player.id] === 'against' ? 'active' : ''}`;
        voteAgainstBtn.title = 'Vote Against';
        voteAgainstBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
        voteAgainstBtn.onclick = () => window.agendaPhase.setPlayerVote(player.id, 'against');
        votingControls.appendChild(voteAgainstBtn);

        const voteAbstainBtn = document.createElement('button');
        voteAbstainBtn.className = `vote-btn abstain ${state.agendaVotes?.[player.id] === 'abstain' ? 'active' : ''}`;
        voteAbstainBtn.title = 'Abstain';
        voteAbstainBtn.innerHTML = '<i class="fas fa-minus-circle"></i>';
        voteAbstainBtn.onclick = () => window.agendaPhase.setPlayerVote(player.id, 'abstain');
        votingControls.appendChild(voteAbstainBtn);

        pillCounter.appendChild(votingControls);
        
        influenceContainer.appendChild(pillCounter);
    });
    
    // Add agenda phase title
    const agendaTitle = document.createElement('h2');
    agendaTitle.className = 'phase-header agenda-phase-title';
    agendaTitle.textContent = `Resolve Agenda ${state.currentAgendaNumber || 1} of 2`;
    agendaContentWrapper.appendChild(agendaTitle);
    
    // Add agenda steps
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'agenda-steps-container';
    
    const agendaSteps = [
        'Reveal and read the Agenda',
        'Apply "When an agenda is revealed"',
        'Apply "After an agenda is revealed"',
        'Open discussion',
        'Voting',
        'Result & resolve'
    ];
    
    // We don't need a separate header here as we already have one at the top of the page
    
    // Create cards wrapper similar to status phase
    const cardsWrapper = document.createElement('div');
    cardsWrapper.className = 'cards-wrapper';
    
    // Create steps as cards
    agendaSteps.forEach((step, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'status-step-card agenda-step-card';
        stepCard.dataset.stepIndex = index;
        
        const stepNumber = document.createElement('div');
        stepNumber.className = 'step-number';
        stepNumber.textContent = index + 1;
        
        const stepText = document.createElement('div');
        stepText.className = 'step-text';
        stepText.textContent = step;
        
        stepCard.appendChild(stepNumber);
        stepCard.appendChild(stepText);
        
        // Add vote results to step 6 (Result & resolve)
        if (index === 5) { // Step 6 (0-indexed)
            const voteTotals = calculateVoteTotals(state);
            const voteResultsDiv = document.createElement('div');
            voteResultsDiv.className = 'step-vote-results';
            
            // Create compact vote display
            const voteDisplay = document.createElement('div');
            voteDisplay.className = 'vote-display-compact';
            voteDisplay.innerHTML = `
                <div class="vote-count-compact for-votes">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${voteTotals.forVotes}</span>
                </div>
                <div class="vote-count-compact against-votes">
                    <i class="fas fa-thumbs-down"></i>
                    <span>${voteTotals.againstVotes}</span>
                </div>
            `;
            
            voteResultsDiv.appendChild(voteDisplay);
            
            // Add result message
            let resultMessage = '';
            let resultClass = '';
            
            if (voteTotals.forVotes === voteTotals.againstVotes && voteTotals.forVotes > 0) {
                // Tie situation
                const speakerPlayer = state.players.find(p => p.isCurrentSpeaker);
                const speakerName = speakerPlayer ? speakerPlayer.name : 'Speaker';
                resultMessage = `Tied! ${speakerName} decides`;
                resultClass = 'tie-result';
            } else if (voteTotals.forVotes > voteTotals.againstVotes) {
                resultMessage = 'Agenda passes';
                resultClass = 'for-result';
            } else if (voteTotals.againstVotes > voteTotals.forVotes) {
                resultMessage = 'Agenda fails';
                resultClass = 'against-result';
            } else {
                resultMessage = 'Waiting for votes...';
                resultClass = 'waiting-result';
            }
            
            if (resultMessage) {
                const resultDiv = document.createElement('div');
                resultDiv.className = `step-result-message ${resultClass}`;
                resultDiv.textContent = resultMessage;
                voteResultsDiv.appendChild(resultDiv);
            }
            
            stepCard.appendChild(voteResultsDiv);
        }
        
        // Highlight current step if it's set in state
        if (state.currentAgendaStep === index) {
            stepCard.classList.add('current-step');
        }
        
        // Add click handler to toggle highlighting
        stepCard.addEventListener('click', (e) => {
            // Toggle current step in UI
            const wasActive = stepCard.classList.contains('current-step');
            
            // Remove current-step class from all cards
            document.querySelectorAll('.agenda-step-card').forEach(card => {
                card.classList.remove('current-step');
            });
            
            // If this card wasn't active, make it active and update state
            if (!wasActive) {
                stepCard.classList.add('current-step');
                
                // Update state with current step
                const state = window.stateCore.getGameState();
                window.stateCore.recordHistory();
                state.currentAgendaStep = index;
                window.stateCore.saveGameState();
            } else {
                // If it was active and we clicked it again, clear the current step
                const state = window.stateCore.getGameState();
                window.stateCore.recordHistory();
                state.currentAgendaStep = undefined;
                window.stateCore.saveGameState();
            }
        });
        
        cardsWrapper.appendChild(stepCard);
    });
    
    stepsContainer.appendChild(cardsWrapper);
    
    agendaContentWrapper.appendChild(stepsContainer);
    
    // Add influence counters container
    agendaContentWrapper.appendChild(influenceContainer);
    
    // Add Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn-primary next-btn';
    
    // Change button text based on current agenda
    if (state.currentAgendaNumber === 1) {
        nextButton.textContent = 'Next Agenda';
        nextButton.onclick = () => advanceAgendaStep();
    } else {
        nextButton.textContent = 'Complete Agenda Phase';
        nextButton.onclick = () => window.agendaPhase.completeAgendaPhase();
    }
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container';
    btnContainer.appendChild(nextButton);
    agendaContentWrapper.appendChild(btnContainer);
    
    // Add the content wrapper to the main container
    container.appendChild(agendaContentWrapper);
    
    // Container is already populated
}

// Function to calculate vote totals including influence
function calculateVoteTotals(state) {
    let forVotes = 0;
    let againstVotes = 0;
    let abstainVotes = 0;
    
    if (state.agendaVotes) {
        state.players.forEach(player => {
            const vote = state.agendaVotes[player.id];
            const influence = state.influenceCounters[player.id] || 0;
            
            if (vote === 'for') {
                forVotes += influence;
            } else if (vote === 'against') {
                againstVotes += influence;
            } else if (vote === 'abstain') {
                abstainVotes += influence;
            }
        });
    }
    
    return { forVotes, againstVotes, abstainVotes };
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
    
    // Re-render the UI to update vote tallies
    const container = document.getElementById('agenda-phase-container');
    if (container) renderAgendaPhaseUI(container);
}

// Function to advance to the next agenda or complete the phase
function advanceAgendaStep() {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();

    // Clear votes before advancing to the next agenda
    if (window.agendaPhase && typeof window.agendaPhase.clearAllVotes === 'function') {
        window.agendaPhase.clearAllVotes();
    }
    
    // Initialize if needed
    if (state.currentAgendaNumber === undefined) {
        state.currentAgendaNumber = 1;
    }
    
    // Instead of advancing steps individually, just move to the next agenda
    if (state.currentAgendaNumber === 1) {
        // Move from Agenda 1 to Agenda 2
        state.currentAgendaNumber = 2;
        state.currentAgendaStep = 0; // Reset step for new agenda
        
        // Reset all influence counters to 0 for the new agenda
        if (state.influenceCounters) {
            Object.keys(state.influenceCounters).forEach(playerId => {
                state.influenceCounters[playerId] = 0;
            });
        }
    } else {
        // We've completed both agendas, complete the phase
        window.agendaPhase.completeAgendaPhase();
        return;
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
