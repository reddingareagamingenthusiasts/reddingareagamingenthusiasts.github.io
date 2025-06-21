// Load or initialize game state
const savedState = localStorage.getItem('ti4GameState');
const savedHistory = localStorage.getItem('ti4GameStateHistory');

if (savedState) {
    gameState = JSON.parse(savedState);
    if (savedHistory) {
        gameStateHistory = JSON.parse(savedHistory);
    } else {
        gameStateHistory = []; // Initialize if history is not found but state is
    }
    let migrationApplied = false; // Declare migrationApplied at the start of the block

    // MIGRATION: Ensure new objective arrays exist if loading from older state
    if (typeof gameState.revealedStageIObjectives === 'undefined') {
        gameState.revealedStageIObjectives = [];
        migrationApplied = true; // Indicate a change was made that might need saving
    }
    if (typeof gameState.revealedStageIIObjectives === 'undefined') {
        gameState.revealedStageIIObjectives = [];
        migrationApplied = true; // Indicate a change was made that might need saving
    }

    // MIGRATION: Ensure faction IDs are up-to-date from defaultGameState
    // let migrationApplied = false; // Removed from here
    if (gameState.factions && defaultGameState.factions) {
        gameState.factions.forEach(loadedFaction => {
            const referenceFaction = defaultGameState.factions.find(df => df.name === loadedFaction.name);
            if (referenceFaction && referenceFaction.id && loadedFaction.id !== referenceFaction.id) {
                loadedFaction.id = referenceFaction.id;
                migrationApplied = true;
            } else if (referenceFaction && referenceFaction.id && !loadedFaction.id) {
                // Case where ID was missing entirely in loaded state
                loadedFaction.id = referenceFaction.id;
                migrationApplied = true;
            }
        });
    }
    if (migrationApplied) {
        // Persist the migrated gameState so this runs only once per outdated localStorage state
        localStorage.setItem('ti4GameState', JSON.stringify(gameState));
    }

} else {
    gameState = initializeGameState(); // This will have factions with correct IDs from defaultGameState
}

// Reset available factions if not already set (should be handled by loading or init)
if (gameState && gameState.factions && !gameState.availableFactions.length) {
    gameState.availableFactions = [...FACTIONS];
}

function setExtendedMode(enabled) {
    // Forward to new-game-phase module
    if (window.newGamePhase && typeof window.newGamePhase.setExtendedMode === 'function') {
        return window.newGamePhase.setExtendedMode(enabled);
    } else {
        // Fallback to original implementation for backward compatibility
        let isMandatory = false;
        if (gameState.players.length > 0) { // Game created, actual player count matters
            if (gameState.players.length > 8) {
                isMandatory = true;
            }
        } else { // Setup screen, prospective player count matters
            if (gameState.prospectivePlayerCount > 8) {
                isMandatory = true;
            }
        }

        const finalEnabledState = isMandatory ? true : enabled;

        // Update only if the state changes or if it's mandatory (to ensure save/UI update)
        // or if the call implies a UI refresh is needed for enabled/disabled state of the toggle.
        if (gameState.extendedMode !== finalEnabledState || isMandatory || enabled !== gameState.extendedMode) {
            gameState.extendedMode = finalEnabledState;

            const newStrategyCards = gameState.extendedMode
                ? [...BASE_STRATEGY_CARDS, ...EXTENDED_STRATEGY_CARDS]
                : [...BASE_STRATEGY_CARDS];
            gameState.strategyCards = newStrategyCards.sort((a, b) => a.initiative - b.initiative);

            if (!gameState.extendedMode) {
                // If extended mode is turned off, remove any selected extended strategy cards
                for (const [playerId, cardName] of Object.entries(gameState.selectedCards)) {
                    if (EXTENDED_STRATEGY_CARDS.some(card => card.name === cardName)) {
                        delete gameState.selectedCards[playerId];
                    }
                }
            }
            saveGameState(); // This will trigger updateUI
        } else {
            // Even if gameState.extendedMode doesn't change, the context (like prospectivePlayerCount) might have,
            // requiring a UI refresh for the toggle's disabled state.
            saveGameState(); // Ensures UI refresh
        }
    }
}

function setGameLength(points) {
    // Forward to new-game-phase module
    if (window.newGamePhase && typeof window.newGamePhase.setGameLength === 'function') {
        return window.newGamePhase.setGameLength(points);
    } else {
        // Fallback to original implementation for backward compatibility
        if (gameState.gameLength !== points) {
            recordHistory(); // Record state before changing game length
            gameState.gameLength = points;
            saveGameState(); // This will trigger UI update through the existing state management
        }
    }
}

function setProspectivePlayerCount(count) {
    if (gameState.stage === 'setup' && gameState.players.length === 0) {
        gameState.prospectivePlayerCount = count;
        // Call setExtendedMode with the current extendedMode value.
        // setExtendedMode will then use the new prospectivePlayerCount
        // to determine if extended mode should be forced and to update the UI.
        setExtendedMode(gameState.extendedMode);
        // No direct saveGameState() here, as setExtendedMode calls it.
    }
}

function startGame() {
    // Forward to faction-selection-phase module for proceeding to speaker selection
    if (window.factionSelectionPhase && typeof window.factionSelectionPhase.proceedToSpeakerSelection === 'function') {
        return window.factionSelectionPhase.proceedToSpeakerSelection();
    } else {
        // Fallback to original implementation for backward compatibility
        const conditionsMet = gameState.players.length >= 2 &&
                              gameState.players.length <= (gameState.extendedMode ? MAX_PLAYERS : 8) &&
                              gameState.players.every(p => p.faction && p.color);

        if (conditionsMet) {
            // CRITICAL: If we are in 'setup' and all conditions are met to start,
            // this is the point to save the current 'setup' state to history.
            if (gameState.stage === 'setup') {
                try {
                    const finalSetupState = JSON.parse(JSON.stringify(gameState));
                    gameStateHistory.push(finalSetupState);
                } catch (error) {
                    console.error("Error recording final setup state for undo:", error);
                }
            }
            // Now, transition the stage.
            gameState.stage = 'speaker-selection';
            setTurnOrder(); 
            saveGameState();
        }
        // No general recordHistory() call here; it's handled by the manual push for the setup->speaker transition.
    }
}

function selectSpeaker(playerId) {
    // Forward to speaker-phase module
    if (window.speakerPhase && typeof window.speakerPhase.selectSpeaker === 'function') {
        return window.speakerPhase.selectSpeaker(playerId);
    } else {
        // Fallback to original implementation for backward compatibility
        const previousSpeaker = gameState.speaker;
        if (previousSpeaker !== playerId) {
            recordHistory(); // Record if the speaker actually changes
            gameState.speaker = playerId;
            // Do not change stage here, wait for confirmation
            saveGameState(); // Save speaker selection immediately for UI update
        } else if (!previousSpeaker && playerId) {
            recordHistory(); // Record if a speaker is selected for the first time
            gameState.speaker = playerId;
            saveGameState();
        }
        // If playerId is the same as current speaker, do nothing, no history, no save.
    }
}

function confirmSpeakerAndProceed() {
    // Forward to speaker-phase module
    if (window.speakerPhase && typeof window.speakerPhase.confirmSpeakerAndProceed === 'function') {
        return window.speakerPhase.confirmSpeakerAndProceed();
    } else {
        // Fallback to original implementation for backward compatibility
        if (gameState.speaker) {
            recordHistory(); // Record state before proceeding to strategy selection
            gameState.stage = 'strategy-selection';
            setTurnOrder();
            saveGameState();
        } else {
            console.warn("No speaker selected. Cannot proceed.");
            // Optionally, provide user feedback here if this function is called without a speaker
        }
    }
}

function selectRandomSpeaker() {
    // Forward to speaker-phase module
    if (window.speakerPhase && typeof window.speakerPhase.selectRandomSpeaker === 'function') {
        return window.speakerPhase.selectRandomSpeaker();
    } else {
        // Fallback to original implementation for backward compatibility
        if (gameState.players.length > 0) {
            recordHistory(); // Record state before random selection
            const randomIndex = Math.floor(Math.random() * gameState.players.length);
            const randomPlayerId = gameState.players[randomIndex].id;
            // Call the modified selectSpeaker which only sets the speaker
            // selectSpeaker(randomPlayerId);
            // To ensure UI updates correctly and history is managed if it's a new selection:
            const previousSpeaker = gameState.speaker;
            gameState.speaker = randomPlayerId;
            if (previousSpeaker !== randomPlayerId) {
                saveGameState(); // Save if speaker changed
            } else if (!previousSpeaker) {
                saveGameState(); // Save if it's the first selection
            }
            // No need to call saveGameState() again if selectSpeaker already does it
        }
    }
}

function setTurnOrder() {
    // Forward to speaker-phase module
    if (window.speakerPhase && typeof window.speakerPhase.reorderTurnOrderFromSpeaker === 'function') {
        return window.speakerPhase.reorderTurnOrderFromSpeaker();
    } else {
        // Fallback to original implementation for backward compatibility
        const players = [...gameState.players];
        const speakerIndex = players.findIndex(p => p.id === gameState.speaker);
        gameState.turnOrder = [
            ...players.slice(speakerIndex),
            ...players.slice(0, speakerIndex)
        ].map(p => p.id);
    }
}

// Function to get the next player in turn order for strategy selection
function getNextPlayerInOrder() {
    // Forward to strategy-phase module
    if (window.strategyPhase && typeof window.strategyPhase.getNextPlayerInOrder === 'function') {
        return window.strategyPhase.getNextPlayerInOrder();
    }
    return null;
}

// Function to update turn order based on strategy card initiative values
function updateTurnOrderByInitiative() {
    // Forward to strategy-phase module
    if (window.strategyPhase && typeof window.strategyPhase.updateTurnOrderByInitiative === 'function') {
        return window.strategyPhase.updateTurnOrderByInitiative();
    }
}

// Function to select a strategy card for a player
function selectStrategyCard(playerId, cardName) {
    // Forward to strategy-phase module
    if (window.strategyPhase && typeof window.strategyPhase.selectStrategyCard === 'function') {
        return window.strategyPhase.selectStrategyCard(playerId, cardName);
    }
    return false;
}

// Function to proceed to active phase after strategy card selection
function proceedToActivePhase() {
    if (window.strategyPhase && typeof window.strategyPhase.proceedToActivePhase === 'function') {
        return window.strategyPhase.proceedToActivePhase();
    }
    // Fallback implementation
    console.log("Strategy Phase module not loaded, using fallback implementation.");
    return false;
}

// Action Phase functions have been moved to action-phase.js
// Access them via window.actionPhase.functionName()

// Action Phase functions have been moved to action-phase.js and are accessible via window.actionPhase

function nextRound() {
    recordHistory();
    gameState.round++;
    gameState.phase = 'Strategy'; // Start the new round in the Strategy phase
    gameState.selectedCards = {}; // Clear selected strategy cards
    gameState.turnOrder = []; // Clear turn order, will be re-established
    gameState.actionPhasePlayerIndex = 0; // Reset for the new action phase
    gameState.passedPlayerCount = 0; // Reset passed player count

    gameState.players.forEach(player => {
        player.strategyCard = null; // Strategy card is returned
        player.strategyCardUsed = false;
        player.passed = false;
        
        // Note: We don't reset otherVPs here since they represent permanent VPs
        // from various sources like Relics, Agendas, etc.
    });

    // Speaker selection might happen here or as part of Strategy phase UI
    // For now, let's assume speaker remains until explicitly changed by Politics or a new game.
    // If Mecatol Rex was captured, agenda phase might trigger. This is complex.

    console.log(`Starting Round ${gameState.round}. Proceed to Strategy Phase.`);
    saveGameState();
}

function updateScore(playerId, change) {
    recordHistory();
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.score = Math.max(0, player.score + change);
        saveGameState();
    }
}

// Update secret objectives count for a player (max 3)
function updateSecretObjectives(playerId, change) {
    recordHistory();
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        // Initialize to 0 if undefined or null
        if (player.secretObjectives === undefined || player.secretObjectives === null) {
            player.secretObjectives = 0;
        }
        
        // Calculate new value with limits
        const MAX_SECRETS = 3;
        const newValue = Math.max(0, Math.min(MAX_SECRETS, player.secretObjectives + change));
        
        // Only update if there's an actual change
        if (newValue !== player.secretObjectives) {
            // Calculate actual change (might be less than requested if at limit)
            const actualChange = newValue - player.secretObjectives;
            player.secretObjectives = newValue;
            // Update total score with actual change
            updateScore(playerId, actualChange);
            console.log(`${player.name} ${actualChange > 0 ? 'scored' : 'unscored'} a secret objective. (${player.secretObjectives}/${MAX_SECRETS})`);
            
            // Update score menu display if it's open
            if (window.playerScoreBar && typeof window.playerScoreBar.updateScoreMenuDisplay === 'function') {
                window.playerScoreBar.updateScoreMenuDisplay(playerId);
            }
        }
    }
}

// Update support for the throne count for a player (max = player count - 1)
function updateSupportForThrone(playerId, change) {
    recordHistory();
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        // Initialize to 0 if undefined or null
        if (player.supportForThrone === undefined || player.supportForThrone === null) {
            player.supportForThrone = 0;
        }
        
        // Calculate max support (player count - 1)
        const MAX_SUPPORT = Math.max(0, gameState.players.length - 1);
        const newValue = Math.max(0, Math.min(MAX_SUPPORT, player.supportForThrone + change));
        
        // Only update if there's an actual change
        if (newValue !== player.supportForThrone) {
            // Calculate actual change (might be less than requested if at limit)
            const actualChange = newValue - player.supportForThrone;
            player.supportForThrone = newValue;
            // Update total score with actual change
            updateScore(playerId, actualChange);
            console.log(`${player.name} ${actualChange > 0 ? 'received' : 'lost'} support for the throne. (${player.supportForThrone}/${MAX_SUPPORT})`);
            
            // Update score menu display if it's open
            if (window.playerScoreBar && typeof window.playerScoreBar.updateScoreMenuDisplay === 'function') {
                window.playerScoreBar.updateScoreMenuDisplay(playerId);
            }
        }
    }
}

// Update other victory points for a player (Relics, Agendas, Action Cards, Hero Abilities, Imperial Strategy Card)
function updateOtherVPs(playerId, change) {
    recordHistory();
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        if (player.otherVPs === undefined || player.otherVPs === null) {
            player.otherVPs = 0;
        }
        
        // Calculate new value with a reasonable max limit
        const MAX_OTHER_VPS = 10; // Adjust as needed based on game rules
        const newValue = Math.max(0, Math.min(MAX_OTHER_VPS, player.otherVPs + change));
        
        // Only update if there's an actual change
        if (newValue !== player.otherVPs) {
            const actualChange = newValue - player.otherVPs;
            player.otherVPs = newValue;
            updateScore(playerId, actualChange);
            console.log(`${player.name} ${actualChange > 0 ? 'gained' : 'lost'} an "Other VP". (${player.otherVPs}/${MAX_OTHER_VPS})`);
            
            // Update score menu display if it's open
            if (window.playerScoreBar && typeof window.playerScoreBar.updateScoreMenuDisplay === 'function') {
                window.playerScoreBar.updateScoreMenuDisplay(playerId);
            }
        }
    }
}

// Toggle custodians token for a player
function toggleCustodians(playerId) {
    recordHistory();
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        // Initialize custodians if undefined or null
        if (player.custodians === undefined || player.custodians === null) {
            player.custodians = false;
        }
        
        // First, remove custodians from any player who might have it
        const previousHolder = gameState.players.find(p => p.custodians === true);
        if (previousHolder) {
            previousHolder.custodians = false;
            // Remove the point if it's a different player
            if (previousHolder.id !== playerId) {
                updateScore(previousHolder.id, -1);
                console.log(`${previousHolder.name} lost the Custodians token.`);
            }
        }
        
        // Toggle for the current player
        player.custodians = !player.custodians;
        // Update score based on new state
        updateScore(playerId, player.custodians ? 1 : -1);
        console.log(`${player.name} ${player.custodians ? 'claimed' : 'lost'} the Custodians token.`);
    }
}

// Set the UI visibility for a revealed objective
function setObjectiveUIVisibility(objectiveId, isVisible) {
    window.stateCore.recordHistory();

    if (!gameState.objectiveUIVisibility) {
        gameState.objectiveUIVisibility = {}; // Should be initialized by state-core
    }

    // Ensure the objective exists in revealed objectives (though this function is about UI state of already revealed ones)
    const isStageI = gameState.revealedStageIObjectives.includes(objectiveId);
    const isStageII = gameState.revealedStageIIObjectives.includes(objectiveId);

    if (!isStageI && !isStageII) {
        console.warn(`Attempted to set UI visibility for an objective (ID: ${objectiveId}) not currently revealed.`);
        // We might still allow setting it, in case it's revealed later and we want to pre-set its hidden state.
        // Or, we could return false here if strictness is desired.
    }

    gameState.objectiveUIVisibility[objectiveId] = !!isVisible; // Coerce to boolean

    window.stateCore.saveGameState();
    // updateUI() is called by saveGameState via stateCore
    console.log(`Objective ${objectiveId} UI visibility set to ${isVisible}`);
    return true;
}

// Score a public objective for a player
function scorePublicObjective(objectiveId, playerId) {
    window.stateCore.recordHistory();

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
        console.error(`Player with ID ${playerId} not found.`);
        alert(`Error: Player not found.`);
        return false;
    }

    // Find the objective in either Stage I or Stage II objectives
    let objective = ALL_STAGE_I_OBJECTIVES.find(obj => obj.id === objectiveId);
    if (!objective) {
        objective = ALL_STAGE_II_OBJECTIVES.find(obj => obj.id === objectiveId);
    }

    if (!objective) {
        console.error(`Objective with ID ${objectiveId} not found.`);
        alert(`Error: Objective not found.`);
        return false;
    }

    // Initialize publicObjectiveScores for the objective if it doesn't exist
    if (!gameState.publicObjectiveScores) {
        gameState.publicObjectiveScores = {}; // Should have been initialized by state-core
    }
    if (!gameState.publicObjectiveScores[objectiveId]) {
        gameState.publicObjectiveScores[objectiveId] = [];
    }

    // Check if player has already scored this objective
    if (gameState.publicObjectiveScores[objectiveId].includes(playerId)) {
        alert(`${player.name} has already scored ${objective.name}.`);
        return false;
    }

    // Add player to the list of scorers for this objective
    gameState.publicObjectiveScores[objectiveId].push(playerId);

    // Update player's score
    updateScore(playerId, objective.points);

    // Save game state (updateScore might call it, but explicit call here ensures it)
    window.stateCore.saveGameState();
    
    console.log(`${player.name} scored ${objective.name} for ${objective.points} points.`);
    // updateUI() is called by saveGameState via stateCore
    return true;
}

// Unscore a public objective for a player
function unscorePublicObjective(objectiveId, playerId) {
    window.stateCore.recordHistory();

    const player = gameState.players.find(p => p.id === playerId);
    if (!player) {
        console.error(`Player with ID ${playerId} not found for unscoring.`);
        // alert(`Error: Player not found.`); // Optional: user feedback
        return false;
    }

    // Find the objective in either Stage I or Stage II objectives
    let objective = ALL_STAGE_I_OBJECTIVES.find(obj => obj.id === objectiveId);
    if (!objective) {
        objective = ALL_STAGE_II_OBJECTIVES.find(obj => obj.id === objectiveId);
    }

    if (!objective) {
        console.error(`Objective with ID ${objectiveId} not found for unscoring.`);
        // alert(`Error: Objective not found.`); // Optional: user feedback
        return false;
    }

    // Check if publicObjectiveScores and the specific objective entry exist
    if (!gameState.publicObjectiveScores || !gameState.publicObjectiveScores[objectiveId]) {
        console.warn(`Objective ${objective.name} (${objectiveId}) has not been scored by anyone. Cannot unscore.`);
        return false;
    }

    const scorerIndex = gameState.publicObjectiveScores[objectiveId].indexOf(playerId);
    // Check if player has actually scored this objective
    if (scorerIndex === -1) {
        // console.warn(`${player.name} has not scored ${objective.name}. Cannot unscore.`);
        // alert(`${player.name} has not scored ${objective.name}.`); // Optional: user feedback
        return false;
    }

    // Remove player from the list of scorers for this objective
    gameState.publicObjectiveScores[objectiveId].splice(scorerIndex, 1);

    // Update player's score by subtracting points
    updateScore(playerId, -objective.points);

    // Save game state
    window.stateCore.saveGameState();
    
    console.log(`${player.name} un-scored ${objective.name}. ${objective.points} points removed.`);
    // updateUI() is called by saveGameState via stateCore
    return true;
}

// Reset game
function resetGame(showConfirmation = true) {
    if (!showConfirmation || confirm("Are you sure you want to start a new game? All current game progress will be lost.")) {
        gameState = initializeGameState(); // This also resets gameStateHistory to []
        localStorage.removeItem('ti4GameState'); 
        localStorage.removeItem('ti4GameStateHistory'); 
        
        const setupInitial = document.getElementById('setup-initial');
        const setupControls = document.getElementById('setup-controls');
        const createGameBtn = document.getElementById('create-game');
        const playerControls = document.querySelector('.player-controls');
        const addPlayerForm = document.getElementById('add-player-form');
        const startGameBtn = document.getElementById('start-game');
        
        if (setupInitial) setupInitial.style.display = 'flex';
        if (setupControls) setupControls.style.display = 'none';
        if (createGameBtn) createGameBtn.style.display = 'block';
        if (playerControls) playerControls.style.display = 'flex';
        if (addPlayerForm) addPlayerForm.style.display = 'none';
        if (startGameBtn) startGameBtn.style.display = 'none';
        
        const extendedModeToggle = document.getElementById('extended-mode-toggle');
        const playerCountDisplay = document.getElementById('player-count');
        if (extendedModeToggle && playerCountDisplay) {
            const currentCount = parseInt(playerCountDisplay.textContent || '6');
            extendedModeToggle.checked = currentCount > 8;
            extendedModeToggle.disabled = currentCount > 8;
            gameState.extendedMode = currentCount > 8;
        }
        
        if (playerCountDisplay && (!playerCountDisplay.textContent || playerCountDisplay.textContent.trim() === '')) {
            playerCountDisplay.textContent = '6';
        }
        
        updateUI();
    }
}

function getTurnOrderDisplay() {
    return gameState.turnOrder
        .map(playerId => {
            const player = gameState.players.find(p => p.id === playerId);
            const card = gameState.selectedCards[player.id];
            const initiative = card ? 
                gameState.strategyCards.find(c => c.name === card).initiative :
                Infinity;
            return {
                name: player.name,
                color: player.color,
                card,
                initiative
            };
        })
        .sort((a, b) => a.initiative - b.initiative);
}

function updateStrategySelectionUI() {
    // Forward to strategy-phase-ui module
    if (window.strategyPhaseUI && typeof window.strategyPhaseUI.updateStrategySelectionUI === 'function') {
        return window.strategyPhaseUI.updateStrategySelectionUI();
    }
}

function renderSelectedCard(player, cardName) {
    // Forward to strategy-phase-ui module
    if (window.strategyPhaseUI && typeof window.strategyPhaseUI.renderSelectedCard === 'function') {
        return window.strategyPhaseUI.renderSelectedCard(player, cardName);
    }
}

function renderAvailableCards(player, isActive) {
    // Forward to strategy-phase-ui module
    if (window.strategyPhaseUI && typeof window.strategyPhaseUI.renderAvailableCards === 'function') {
        return window.strategyPhaseUI.renderAvailableCards(player, isActive);
    }
}

function handleStrategyCardClick(playerId, cardName) {
    // Forward to strategy-phase-ui module
    if (window.strategyPhaseUI && typeof window.strategyPhaseUI.handleStrategyCardClick === 'function') {
        return window.strategyPhaseUI.handleStrategyCardClick(playerId, cardName);
    }
}

function getStrategyCardIcon(cardName) {
    // Forward to strategy-phase-ui module
    if (window.strategyPhaseUI && typeof window.strategyPhaseUI.getStrategyCardIcon === 'function') {
        return window.strategyPhaseUI.getStrategyCardIcon(cardName);
    }
}

function getStrategyCardColor(cardName) {
    const colors = {
        'Leadership': '#8B0000', // Dark red
        'Diplomacy': '#FFA500', // Orange
        'Politics': '#FFD700', // Yellow/Gold
        'Construction': '#006400', // Dark green
        'Trade': '#20B2AA', // Light sea green / blue-green
        'Warfare': '#00008B', // Dark blue
        'Technology': '#4B0082', // Indigo/Dark purple
        'Imperial': '#9370DB', // Medium purple
        'Industry': '#32CD32', // Lime green
        'Logistics': '#87CEEB'  // Sky blue
    };
    return colors[cardName] || '#CCCCCC'; // Default grey
}


function startNameEdit(playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.isEditing = true;
        updateUI();
    }
}

function saveNameEdit(playerId, newName) {
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
        player.name = newName.trim() || `Player ${gameState.players.indexOf(player) + 1}`;
        player.isEditing = false;
        saveGameState(); // This will call updateUI
    }
}

function handleNameEdit(event, playerId) {
    if (event.key === 'Enter') {
        saveNameEdit(playerId, event.target.value);
    } else if (event.key === 'Escape') {
        const player = gameState.players.find(p => p.id === playerId);
        if (player) {
            player.isEditing = false;
            updateUI(); // Just re-render without saving
        }
    }
}


function updateSpeakerSelectionUI(container) {
    container.innerHTML = ''; // Clear previous content
    const header = document.createElement('div');
    header.className = 'setup-header';
    header.innerHTML = `
        <h3>Select Speaker</h3>
        <p class="setup-instructions">Choose the player who will be the Speaker</p>
    `;
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'speaker-selection-grid';
    grid.id = 'speaker-selection-grid';
    gameState.players.forEach(player => {
        const candidateCard = document.createElement('div');
        candidateCard.className = `speaker-candidate ${gameState.speaker === player.id ? 'selected' : ''}`;
        candidateCard.style.borderColor = player.color;
        candidateCard.innerHTML = `
            <div class="speaker-token"><i class="fas fa-gavel fa-2x"></i></div>
            <div class="player-name" style="color: ${player.color}">${player.name}</div>
            <div class="faction-name">${player.faction}</div>
            <button class="select-speaker-btn" onclick="selectSpeaker('${player.id}')">
                <i class="fas fa-crown"></i> Select as Speaker
            </button>
        `;
        grid.appendChild(candidateCard);
    });
    container.appendChild(grid);
}

function updateActiveGameUI(container) {
    container.innerHTML = ''; // Clear previous content

    const gameInfo = document.createElement('div');
    gameInfo.className = 'game-info';
    gameInfo.innerHTML = `
        <div class="round-info">
            <span class="label">Round</span>
            <span id="round-number" class="value">${gameState.round}</span>
        </div>
        <div class="phase-info">
            <span class="label">Phase</span>
            <span id="game-phase" class="value">${gameState.phase}</span>
        </div>
        <button class="btn" id="next-round">
            <i class="fas fa-forward"></i> Next Round
        </button>
    `;
    container.appendChild(gameInfo);
    gameInfo.querySelector('#next-round').onclick = nextRound;

    const playersGrid = document.createElement('div');
    playersGrid.className = 'players-grid';
    playersGrid.id = 'players-grid';
    
    const row1 = document.createElement('div');
    row1.className = 'players-row';
    const row2 = document.createElement('div');
    row2.className = 'players-row';

    gameState.players.forEach((player, index) => {
        const playerCard = createPlayerCard(player); // Assumes createPlayerCard is defined elsewhere or inline it
        if (index < Math.ceil(gameState.players.length / 2)) {
            row1.appendChild(playerCard);
        } else {
            row2.appendChild(playerCard);
        }
    });
    playersGrid.appendChild(row1);
    if (row2.children.length > 0) playersGrid.appendChild(row2);
    container.appendChild(playersGrid);
}

// Helper to create player card for active game UI
function createPlayerCard(player) {
    const div = document.createElement('div');
    div.className = `player-card ${player.isActive ? 'active' : ''}`;
    if (player.color) {
        div.style.borderColor = player.color;
    }
    
    div.innerHTML = `
        <div class="player-header">
            <div class="player-info">
                <h3>
                    <i class="fas fa-user-astronaut" style="color: ${player.color}"></i>
                    ${player.name}
                </h3>
                <div class="faction-name">${player.faction || ''}</div>
            </div>
            <div class="score-controls">
                <button class="btn" onclick="updateScore('${player.id}', -1)"><i class="fas fa-minus"></i></button>
                <span>${player.score}</span>
                <button class="btn" onclick="updateScore('${player.id}', 1)"><i class="fas fa-plus"></i></button>
            </div>
        </div>
        <div class="strategy-cards">
            ${player.strategyCard ? `
                <div class="strategy-card selected" data-card="${player.strategyCard}">
                    <span class="initiative-number">${gameState.strategyCards.find(sc => sc.name === player.strategyCard)?.initiative}</span>
                    <i class="fas ${getStrategyCardIcon(player.strategyCard)}"></i>
                    ${player.strategyCard}
                </div>
            ` : ''}
        </div>
    `;
    return div;
}


// Helper to show themed alerts
function showThemedAlert(message) {
    if (typeof alert !== 'undefined') {
        alert(message);  // Basic alert for now; can be enhanced later
        // TODO: Implement a themed alert component
    } else {
        console.warn(message); // Fallback to console if alert not available
    }
}

// Expose score component functions to global scope for UI access
window.updateSecretObjectives = updateSecretObjectives;
window.updateSupportForThrone = updateSupportForThrone;
window.toggleCustodians = toggleCustodians;
window.updateOtherVPs = updateOtherVPs;

// Helper to check if a player can perform an action
function canPlayerPerformAction(playerId) {
    if (gameState.phase !== 'Action' || gameState.stage !== 'active') {
        return false;
    }
    
    const expectedPlayerId = gameState.turnOrder[gameState.actionPhasePlayerIndex];
    if (playerId !== expectedPlayerId) {
        return false;
    }

    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.passed) {
        return false;
    }

    return true;
}

// Utility function
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function populatePlayersByCount(count) {
    // Part of setup, not individually undoable.
    gameState.players = [];
    const availableFactionsCopy = shuffle([...gameState.factions.map(f => ({ ...f, name: f.name.replace(/^The /, '') }))]);
    const availableColorsCopy = shuffle([...defaultGameState.availableColors]);

    for (let i = 0; i < count; i++) {
        const faction = availableFactionsCopy.pop() || { name: 'N/A', color: '#CCCCCC' }; // Fallback
        const color = availableColorsCopy.pop() || '#808080'; // Fallback
        
        gameState.players.push({
            id: generateId(),
            name: `Player ${i + 1}`,
            faction: faction.name,
            color: color,
            score: 0,
            secretObjectives: 0,
            supportForThrone: 0,
            custodians: false,
            strategyCard: null,
            isActive: false,
            isEditing: false
        });
    }
    // Update available factions/colors based on what's left
    gameState.availableFactions = availableFactionsCopy;
    gameState.availableColors = availableColorsCopy;
    saveGameState();
}


function randomizeAll() {
    // Part of setup, not individually undoable.
    if (gameState.players.length === 0) return;

    const shuffledFactions = shuffle([...gameState.factions.map(f => ({ ...f, name: f.name.replace(/^The /, '') }))]);
    const shuffledColors = shuffle([...defaultGameState.availableColors]); // Use the full default list for shuffling

    gameState.players.forEach((player, index) => {
        player.faction = shuffledFactions[index % shuffledFactions.length].name;
        player.color = shuffledColors[index % shuffledColors.length];
    });

    // Update availableFactions and availableColors based on selections
    const selectedFactionNames = gameState.players.map(p => p.faction);
    const selectedColors = gameState.players.map(p => p.color);

    gameState.availableFactions = gameState.factions
        .map(f => ({ ...f, name: f.name.replace(/^The /, '') }))
        .filter(f => !selectedFactionNames.includes(f.name));
    
    gameState.availableColors = defaultGameState.availableColors
        .filter(c => !selectedColors.includes(c));

    saveGameState();
}

function updatePlayerCount(count) {
    // Part of setup, not individually undoable.
    const currentCount = gameState.players.length;
    if (count === currentCount) return;

    if (count > currentCount) {
        for (let i = 0; i < (count - currentCount); i++) {
            if (gameState.players.length < MAX_PLAYERS) {
                const index = gameState.players.length;
                window.newGamePhase.addPlayer(index, `Player ${index + 1}`);
            }
        }
    } else { // count < currentCount
        gameState.players.length = count;
        // This part is complex if factions/colors were manually assigned.
        // For simplicity, if reducing player count, we might just clear and re-add default players
        // or require manual re-assignment. For now, just truncating.
        // A more robust solution would track original available items.
    }
    // Force extended mode if player count is > 8
    if (count > 8) {
        setExtendedMode(true);
    }
    saveGameState();
}

function createGame(playerCount) {
    // This initializes the setup screen, not individually undoable.
    gameState.stage = 'setup'; // Explicitly set to setup
    gameState.players = []; // Clear any existing players from a previous incomplete setup
    gameState.availableFactions = [...FACTIONS]; // Reset available factions
    gameState.availableColors = [...defaultGameState.availableColors]; // Reset available colors
    
    // Generate a new unique game ID for timer tracking
    gameState.gameId = 'game-' + Date.now();
    gameState.createdAt = Date.now();
    
    // Reset the game timer if it exists
    if (window.gameTimer && typeof window.gameTimer.resetTimer === 'function') {
        console.log('[STATE] Resetting game timer for new game');
        window.gameTimer.resetTimer();
    }
    
    // Clear any existing timer state
    if (gameState.gameTimer) {
        delete gameState.gameTimer;
    }
    
    // Preserve existing extendedMode if playerCount doesn't force it.
    // setExtendedMode will handle the mandatory logic and strategy card updates.
    const currentExtendedModeUserChoice = gameState.extendedMode;
    setExtendedMode(playerCount > 8 ? true : currentExtendedModeUserChoice);

    for (let i = 0; i < playerCount; i++) {
        gameState.players.push({
            id: generateId(),
            name: `Player ${i + 1}`,
            faction: null,
            color: null,
            score: 0,
            secretObjectives: 0,
            supportForThrone: 0,
            custodians: false,
            otherVPs: 0,
            strategyCard: null,
            isActive: false,
            isEditing: false
        });
    }
    saveGameState(); // This will call updateUI
}
