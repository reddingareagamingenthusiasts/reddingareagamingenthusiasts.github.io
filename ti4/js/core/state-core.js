// Core state management functionality for TI4 Scoreboard
let gameState = null;
let gameStateHistory = [];

// Initial game state
const MAX_PLAYERS = 10;
const MAX_HISTORY_SIZE = 50; // Limit undo history to last 50 actions

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
        
        // Limit history size to prevent memory issues
        if (gameStateHistory.length > MAX_HISTORY_SIZE) {
            gameStateHistory.shift(); // Remove oldest entry
        }
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

// Export game state as JSON file
function exportGameState() {
    if (!gameState) {
        console.error('No game state to export');
        return;
    }
    
    const exportData = {
        gameState: gameState,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ti4-game-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Game state exported successfully (current state only)');
}

// Import game state from JSON file
function importGameState(file) {
    if (!file) {
        console.error('No file provided for import');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Validate the imported data structure
            if (!importData.gameState) {
                throw new Error('Invalid file format: missing gameState');
            }
            
            // Backup current state before importing (just in case)
            const currentStateBackup = {
                gameState: gameState ? JSON.parse(JSON.stringify(gameState)) : null,
                gameStateHistory: [...gameStateHistory]
            };
            
            // Import the new state
            gameState = importData.gameState;
            gameStateHistory = importData.gameStateHistory || [];
            
            // Run migration to ensure compatibility
            migrateGameState();
            
            // Save the imported state
            saveGameState();
            
            const historySize = gameStateHistory.length;
            console.log('Game state imported successfully');
            console.log('Import date:', importData.exportDate);
            console.log('Import version:', importData.version);
            console.log(`History entries: ${historySize}`);
            
            // Show success message to user
            if (typeof showThemedAlert === 'function') {
                showThemedAlert(`Game imported successfully!${historySize > 0 ? ` (${historySize} undo steps available)` : ' (no history)'}`);
            } else {
                alert(`Game imported successfully!${historySize > 0 ? ` (${historySize} undo steps available)` : ' (no history)'}`);
            }
            
        } catch (error) {
            console.error('Error importing game state:', error);
            
            // Show error message to user
            if (typeof showThemedAlert === 'function') {
                showThemedAlert(`Error importing game: ${error.message}`);
            } else {
                alert(`Error importing game: ${error.message}`);
            }
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        if (typeof showThemedAlert === 'function') {
            showThemedAlert('Error reading file');
        } else {
            alert('Error reading file');
        }
    };
    
    reader.readAsText(file);
}

// Prompt user to select a file for import
function promptImportGameState() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            importGameState(file);
        }
        document.body.removeChild(input);
    };
    
    document.body.appendChild(input);
    input.click();
}

// Export all functions that will be used by other modules
window.stateCore = {
    generateId,
    initializeGameState,
    loadGameState,
    saveGameState,
    recordHistory,
    undoAction,
    getGameState,
    exportGameState,
    importGameState,
    promptImportGameState
};
