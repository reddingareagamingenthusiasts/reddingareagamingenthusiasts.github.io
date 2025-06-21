// Status Phase UI Components for TI4 Scoreboard

function renderStatusPhaseUI(container) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    
    const state = window.stateCore.getGameState();
    
    if (state.phase !== 'Status') {
        container.innerHTML = '<p class="phase-message">Waiting for Status Phase to begin.</p>';
        return;
    }
    
    // Create main wrapper
    const statusPhaseWrapper = document.createElement('div');
    statusPhaseWrapper.className = 'status-phase-wrapper';
    
    // Add player score bar at the top
    const playerBarContainer = document.createElement('div');
    playerBarContainer.className = 'status-player-bar-container';
    window.playerScoreBar.renderPlayerScoreBar(playerBarContainer, {
        currentPlayerId: null, // No current player in status phase
        showStrategyCards: true,
        showScoreControls: true,
        showPassedState: false
    });
    statusPhaseWrapper.appendChild(playerBarContainer);
    
    // Add status phase steps
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'status-steps-container';
    
    const stepsHeader = document.createElement('h3');
    stepsHeader.textContent = 'Status Phase Steps';
    stepsContainer.appendChild(stepsHeader);
    
    // Create cards wrapper
    const cardsWrapper = document.createElement('div');
    cardsWrapper.className = 'cards-wrapper';
    
    const steps = [
        'In initiative order, score 1 public and/or 1 secret objective',
        'Flip next public objective',
        'Draw 1 action card',
        'Return Command Tokens',
        'Gain 2 Command Tokens and redistribute',
        'Ready all cards',
        'Repair units',
        'Return Strategies'
    ];
      steps.forEach((step, index) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'status-step-card';
        stepCard.dataset.stepIndex = index;
        
        // Highlight current step if it's set in state
        if (state.currentStatusStep === index) {
            stepCard.classList.add('current-step');
        }
        
        const stepNumber = document.createElement('div');
        stepNumber.className = 'step-number';
        stepNumber.textContent = index + 1;
        
        const stepText = document.createElement('div');
        stepText.className = 'step-text';
        stepText.textContent = step;
        
        stepCard.appendChild(stepNumber);
        stepCard.appendChild(stepText);
        
        // Add click handler to toggle highlighting
        stepCard.addEventListener('click', (e) => {
            // Toggle current step in UI
            const wasActive = stepCard.classList.contains('current-step');
            
            // Remove current-step class from all cards
            document.querySelectorAll('.status-step-card').forEach(card => {
                card.classList.remove('current-step');
            });
            
            // If this card wasn't active, make it active and update state
            if (!wasActive) {
                stepCard.classList.add('current-step');
                
                // Update state with current step
                const state = window.stateCore.getGameState();
                window.stateCore.recordHistory();
                state.currentStatusStep = index;
                window.stateCore.saveGameState();
            } else {
                // If it was active and we clicked it again, clear the current step
                const state = window.stateCore.getGameState();
                window.stateCore.recordHistory();
                state.currentStatusStep = undefined;
                window.stateCore.saveGameState();
            }
        });
        
        cardsWrapper.appendChild(stepCard);
    });
    
    stepsContainer.appendChild(cardsWrapper);
    statusPhaseWrapper.appendChild(stepsContainer);
    
    // Add next button
    if (state.statusStep < steps.length) {
        const nextButton = document.createElement('button');
        nextButton.className = 'next-btn';
        nextButton.textContent = 'Next Step';
        nextButton.addEventListener('click', () => {
            window.stateCore.advanceStatusPhaseStep();
        });
        statusPhaseWrapper.appendChild(nextButton);
    } else {
        const endPhaseButton = document.createElement('button');
        endPhaseButton.className = 'next-btn';
        endPhaseButton.textContent = 'End Status Phase';
        endPhaseButton.addEventListener('click', () => {
            window.statusPhase.proceedToNextRound();
        });
        statusPhaseWrapper.appendChild(endPhaseButton);
    }
    
    container.appendChild(statusPhaseWrapper);
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

/**
 * Render the objective scoring UI for a specific player
 * @param {Object} container - The container element to render into
 * @param {Object} player - The player who is scoring objectives
 */
function renderObjectiveScoringUI(container, player) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    
    const state = window.stateCore.getGameState();
    
    // Create scoring container
    const scoringContainer = document.createElement('div');
    scoringContainer.className = 'objective-scoring-container';
    
    // Add header
    const header = document.createElement('h2');
    header.className = 'phase-header';
    header.textContent = `${player.name} - Score Objectives`;
    header.style.color = player.color;
    scoringContainer.appendChild(header);
    
    // Add description
    const description = document.createElement('p');
    description.className = 'scoring-description';
    description.textContent = 'Select one public objective and/or one secret objective to score.';
    scoringContainer.appendChild(description);
    
    // Create sections container
    const sectionsContainer = document.createElement('div');
    sectionsContainer.className = 'scoring-sections';
    
    // Public Objectives Section
    const publicSection = document.createElement('div');
    publicSection.className = 'scoring-section public-objectives';
    
    const publicHeader = document.createElement('h3');
    publicHeader.textContent = 'Public Objectives';
    publicSection.appendChild(publicHeader);
    
    // Get all revealed public objectives
    const publicObjectives = [
        ...(state.revealedStageIObjectives || []).map(id => findObjectiveById(id, state)),
        ...(state.revealedStageIIObjectives || []).map(id => findObjectiveById(id, state))
    ].filter(obj => obj !== null);
    
    if (publicObjectives.length === 0) {
        const noObjectives = document.createElement('p');
        noObjectives.className = 'no-objectives';
        noObjectives.textContent = 'No public objectives revealed yet.';
        publicSection.appendChild(noObjectives);
    } else {
        // Create list of public objectives
        const objectivesList = document.createElement('div');
        objectivesList.className = 'objectives-list';
        
        publicObjectives.forEach(objective => {
            // Check if player has already scored this objective
            const alreadyScored = state.scoredObjectives && 
                                 state.scoredObjectives[player.id] && 
                                 state.scoredObjectives[player.id].includes(objective.id);
            
            const objectiveCard = createObjectiveCard(objective, player, alreadyScored);
            objectivesList.appendChild(objectiveCard);
        });
        
        publicSection.appendChild(objectivesList);
    }
    
    sectionsContainer.appendChild(publicSection);
    
    // Secret Objectives Section
    const secretSection = document.createElement('div');
    secretSection.className = 'scoring-section secret-objectives';
    
    const secretHeader = document.createElement('h3');
    secretHeader.textContent = 'Secret Objectives';
    secretSection.appendChild(secretHeader);
    
    // Count how many secret objectives the player has already scored
    const scoredSecrets = countScoredSecretObjectives(player.id, state);
    const maxSecrets = 3; // Maximum number of secret objectives a player can score
    
    if (scoredSecrets >= maxSecrets) {
        const maxReached = document.createElement('p');
        maxReached.className = 'max-secrets';
        maxReached.textContent = `${player.name} has already scored the maximum of ${maxSecrets} secret objectives.`;
        secretSection.appendChild(maxReached);
    } else {
        // Create generic secret objective button
        const secretButton = document.createElement('button');
        secretButton.className = 'btn secret-objective-btn';
        secretButton.textContent = 'Score Secret Objective';
        secretButton.onclick = () => scoreSecretObjective(player.id);
        secretSection.appendChild(secretButton);
        
        // Show how many secret objectives have been scored
        const secretCount = document.createElement('p');
        secretCount.className = 'secret-count';
        secretCount.textContent = `${scoredSecrets}/${maxSecrets} secret objectives scored`;
        secretSection.appendChild(secretCount);
    }
    
    sectionsContainer.appendChild(secretSection);
    scoringContainer.appendChild(sectionsContainer);
    
    // Add navigation buttons
    const navContainer = document.createElement('div');
    navContainer.className = 'nav-container';
    
    // Skip button
    const skipButton = document.createElement('button');
    skipButton.className = 'btn btn-secondary';
    skipButton.textContent = 'Skip (No Objectives)';
    skipButton.onclick = () => nextPlayerOrStep();
    navContainer.appendChild(skipButton);
    
    scoringContainer.appendChild(navContainer);
    container.appendChild(scoringContainer);
}

/**
 * Create an objective card for display
 * @param {Object} objective - The objective data
 * @param {Object} player - The current player
 * @param {boolean} alreadyScored - Whether the player has already scored this objective
 * @returns {HTMLElement} - The objective card element
 */
function createObjectiveCard(objective, player, alreadyScored) {
    const card = document.createElement('div');
    card.className = 'objective-card';
    if (alreadyScored) {
        card.classList.add('already-scored');
    }
    
    // Objective title
    const title = document.createElement('h4');
    title.className = 'objective-title';
    title.textContent = objective.name;
    card.appendChild(title);
    
    // Objective description
    const description = document.createElement('p');
    description.className = 'objective-description';
    description.textContent = objective.description || 'No description available';
    card.appendChild(description);
    
    // Objective points
    const points = document.createElement('div');
    points.className = 'objective-points';
    points.textContent = `${objective.points} ${objective.points === 1 ? 'point' : 'points'}`;
    card.appendChild(points);
    
    // If already scored, show who scored it
    if (alreadyScored) {
        const scoredBy = document.createElement('div');
        scoredBy.className = 'scored-by';
        scoredBy.textContent = `Already scored by ${player.name}`;
        scoredBy.style.color = player.color;
        card.appendChild(scoredBy);
    } else {
        // Score button
        const scoreButton = document.createElement('button');
        scoreButton.className = 'btn score-btn';
        scoreButton.textContent = 'Score';
        scoreButton.onclick = () => {
            window.statusPhase.scoreObjective(player.id, objective.id);
            nextPlayerOrStep();
        };
        card.appendChild(scoreButton);
    }
    
    return card;
}

/**
 * Count how many secret objectives a player has scored
 * @param {string} playerId - The player's ID
 * @param {Object} state - The game state
 * @returns {number} - The number of secret objectives scored
 */
function countScoredSecretObjectives(playerId, state) {
    if (!state.scoredSecretObjectives || !state.scoredSecretObjectives[playerId]) {
        return 0;
    }
    return state.scoredSecretObjectives[playerId].length;
}

/**
 * Score a generic secret objective for a player
 * @param {string} playerId - The player's ID
 */
function scoreSecretObjective(playerId) {
    const state = window.stateCore.getGameState();
    window.stateCore.recordHistory();
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Initialize scored secret objectives if needed
    if (!state.scoredSecretObjectives) {
        state.scoredSecretObjectives = {};
    }
    if (!state.scoredSecretObjectives[playerId]) {
        state.scoredSecretObjectives[playerId] = [];
    }
    
    // Add a generic secret objective (using timestamp as ID)
    const secretId = `secret_${Date.now()}`;
    state.scoredSecretObjectives[playerId].push(secretId);
    
    // Add 1 point to player's score (standard for secret objectives)
    player.score += 1;
    
    console.log(`${player.name} scored a secret objective for 1 point. New score: ${player.score}`);
    
    window.stateCore.saveGameState();
    nextPlayerOrStep();
}

/**
 * Move to the next player or next step if all players have had a turn
 */
function nextPlayerOrStep() {
    const state = window.stateCore.getGameState();
    
    // If we're not tracking the current scoring player, initialize it
    if (state.currentScoringPlayerIndex === undefined) {
        state.currentScoringPlayerIndex = 0;
    } else {
        // Move to the next player
        state.currentScoringPlayerIndex++;
    }
    
    // If we've gone through all players, move to the next step
    if (state.currentScoringPlayerIndex >= state.players.length) {
        state.currentScoringPlayerIndex = undefined; // Reset for next time
        state.statusPhaseStep++; // Move to the next step
    }
    
    window.stateCore.saveGameState();
    
    // Re-render the UI
    const container = document.getElementById('status-phase-container');
    if (container) renderStatusPhaseUI(container);
}

/**
 * Helper function to find an objective by ID
 * @param {string} objectiveId - The objective ID
 * @param {Object} state - The game state
 * @returns {Object|null} - The objective or null if not found
 */
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

// Export all UI functions
window.statusPhaseUI = {
    renderStatusPhaseUI,
    renderObjectiveScoringUI,
    createObjectiveCard,
    countScoredSecretObjectives,
    scoreSecretObjective,
    nextPlayerOrStep,
    findObjectiveById,
    getContrastTextColor
};
