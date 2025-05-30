// Core state management functionality for TI4 Scoreboard
let gameState = null;
let gameStateHistory = [];

// Initial game state
const MAX_PLAYERS = 10;

// Function to record current state to history before a change
function recordHistory() {
    // Do not record history if the game is currently in the 'setup' stage.
    // The specific 'setup' state that allows undoing *back to setup* is recorded manually by startGame().
    if (gameState.stage === 'setup') {
        return;
    }
    // For all other stages, record the history.
    try {
        gameStateHistory.push(JSON.parse(JSON.stringify(gameState)));
    } catch (error) {
        console.error("Error recording history:", error);
    }
}

// Undo the last action
function undoAction() {
    if (gameStateHistory.length > 0) {
        gameState = gameStateHistory.pop(); // Restore the last state
        saveGameState(); // Save the restored state (and updated history)
    } else {
        console.warn("No actions to undo.");
    }
}

// Save game state and its history
function saveGameState() {
    localStorage.setItem('ti4GameState', JSON.stringify(gameState));
    localStorage.setItem('ti4GameStateHistory', JSON.stringify(gameStateHistory));
    // Only call updateUI if it exists (it's defined in ui.js)
    if (typeof updateUI === 'function') {
        updateUI();
    }
}

// Generate a simple UUID for player IDs
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function initializeGameState() {
    // Create a deep copy of the default state
    gameState = JSON.parse(JSON.stringify(defaultGameState));
    
    // Initialize arrays that should be empty at start
    gameState.players = [];
    gameState.turnOrder = [];
    gameState.strategyCards = [];
    gameState.selectedCards = {};
    gameState.publicObjectiveScores = {};
    gameState.objectiveUIVisibility = {};
    gameState.objectiveRedTapeStatus = {};
    
    // Initialize objective arrays with nulls
    gameState.revealedStageIObjectives = Array(5).fill(null);
    gameState.revealedStageIIObjectives = Array(5).fill(null);
    
    // Set default values for new games
    gameState.stage = 'setup';
    gameState.round = 1;
    gameState.activePlayer = 0;
    gameState.phase = 'Strategy';
    gameState.speaker = null;
    gameState.actionPhasePlayerIndex = 0;
    gameState.passedPlayerCount = 0;
    gameState.extendedMode = false;
    gameState.redTapeVariant = false;

    // Initialize gameOptions for consistency before createGame is called
    gameState.gameOptions = {
        playerCount: gameState.prospectivePlayerCount, // Default for setup screen
        extendedMode: gameState.extendedMode,
        gameLength: gameState.gameLength
    };
    
    // Initialize available factions with all factions
    gameState.availableFactions = [...gameState.factions];
    
    // No history on fresh init
    gameStateHistory = [];
    return gameState;
}

function loadGameState() {
    const savedState = localStorage.getItem('ti4GameState');
    const savedHistory = localStorage.getItem('ti4GameStateHistory');

    if (savedState) {
        gameState = JSON.parse(savedState);
        if (savedHistory) {
            gameStateHistory = JSON.parse(savedHistory);
        } else {
            gameStateHistory = []; // Initialize if history is not found but state is
        }
        migrateGameState();
    } else {
        gameState = initializeGameState();
    }

    // Reset available factions if not already set
    if (gameState && gameState.factions && !gameState.availableFactions.length) {
        gameState.availableFactions = [...FACTIONS];
    }

    return gameState;
}

function migrateGameState() {
    let migrationApplied = false;

    // MIGRATION: Ensure new objective arrays exist if loading from older state
    if (typeof gameState.revealedStageIObjectives === 'undefined') {
        gameState.revealedStageIObjectives = [];
        migrationApplied = true;
    }
    if (typeof gameState.revealedStageIIObjectives === 'undefined') {
        gameState.revealedStageIIObjectives = [];
        migrationApplied = true;
    }

    // MIGRATION: Ensure faction IDs are up-to-date from defaultGameState
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

    // MIGRATION: Ensure publicObjectiveScores exists
    if (typeof gameState.publicObjectiveScores === 'undefined') {
        gameState.publicObjectiveScores = {};
        migrationApplied = true;
    }

    // MIGRATION: Ensure objectiveUIVisibility exists
    if (typeof gameState.objectiveUIVisibility === 'undefined') {
        gameState.objectiveUIVisibility = {};
        migrationApplied = true;
    }

    // MIGRATION: Ensure objectiveRedTapeStatus exists
    if (typeof gameState.objectiveRedTapeStatus === 'undefined') {
        gameState.objectiveRedTapeStatus = {};
        migrationApplied = true;
    }
    
    // MIGRATION: Ensure player score components exist
    if (gameState.players && gameState.players.length > 0) {
        gameState.players.forEach(player => {
            if (typeof player.secretObjectives === 'undefined') {
                player.secretObjectives = 0;
                migrationApplied = true;
            }
            if (typeof player.supportForThrone === 'undefined') {
                player.supportForThrone = 0;
                migrationApplied = true;
            }
            if (typeof player.custodians === 'undefined') {
                player.custodians = false;
                migrationApplied = true;
            }
        });
    }

    if (migrationApplied) {
        // Persist the migrated gameState
        saveGameState();
    }
}

function getGameState() {
    return gameState;
}

// Export all functions that will be used by other modules
window.stateCore = {
    generateId,
    initializeGameState,
    loadGameState,
    saveGameState,
    recordHistory,
    undoAction,
    getGameState
};
