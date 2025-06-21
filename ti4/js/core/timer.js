// Game Timer Module
(function() {
    // Check if timer is already initialized
    if (window.gameTimerInitialized) {
        console.log('[TIMER] Timer already initialized, skipping...');
        return;
    }
    window.gameTimerInitialized = true;
    
    console.log('[TIMER] Initializing timer module...');

    // Single shared timer state for all timer displays
    const sharedTimerState = {
        isRunning: false,
        startTime: 0,
        elapsedTime: 0,
        updateInterval: null,
        displays: [], // All timer displays
        gameId: null, // Track the current game ID to detect new games
        initialized: false, // Track if timer has been initialized with game state
        lastSavedTime: 0, // Track when we last saved the timer state
        
        // Turn timer state
        turnTimer: {
            currentPlayer: null,
            currentTurnStart: 0,
            currentTurnElapsed: 0,
            isRunning: false,
            playerTotalTimes: {}, // Track cumulative time per player
            displays: [] // Turn timer display elements
        }
    };
    
    // Keep track of timer containers by ID for DOM updates
    const timerContainers = {};
    
    // TIMER PERSISTENCE - Load saved timer state from localStorage immediately
    // This is the key to ensuring timer state persists across browser refreshes
    const TIMER_STORAGE_KEY = 'ti4GameTimer';
    
    function loadSavedTimerState() {
        try {
            const savedTimerState = localStorage.getItem(TIMER_STORAGE_KEY);
            if (!savedTimerState) {
                console.log('[TIMER] No saved timer state found');
                return false;
            }
            
            const parsedState = JSON.parse(savedTimerState);
            console.log('[TIMER] Found saved timer state:', parsedState);
            
            // Get current game ID to check if we're in the same game
            const currentGameId = getGameId();
            console.log('[TIMER] Current game ID:', currentGameId, 'Saved game ID:', parsedState.gameId);
            
            // Always restore if we have saved state - be very permissive for now
            // We'll be more strict later once we confirm loading works
            const shouldRestore = !currentGameId || 
                                 !parsedState.gameId || 
                                 parsedState.gameId === currentGameId ||
                                 Math.abs(Date.now() - (parsedState.lastUpdated || 0)) < 24 * 60 * 60 * 1000; // Within 24 hours
            
            if (shouldRestore) {
                // Apply the saved state
                sharedTimerState.elapsedTime = parsedState.elapsedTime || 0;
                sharedTimerState.isRunning = parsedState.isRunning || false;
                sharedTimerState.gameId = parsedState.gameId || currentGameId;
                sharedTimerState.lastSavedTime = parsedState.lastUpdated || Date.now();
                
                // Restore turn timer state if available
                if (parsedState.turnTimer) {
                    sharedTimerState.turnTimer.currentPlayer = parsedState.turnTimer.currentPlayer || null;
                    sharedTimerState.turnTimer.currentTurnElapsed = parsedState.turnTimer.currentTurnElapsed || 0;
                    sharedTimerState.turnTimer.isRunning = parsedState.turnTimer.isRunning || false;
                    sharedTimerState.turnTimer.playerTotalTimes = parsedState.turnTimer.playerTotalTimes || {};
                    
                    if (sharedTimerState.turnTimer.isRunning) {
                        sharedTimerState.turnTimer.currentTurnStart = Date.now();
                    }
                }
                
                console.log('[TIMER] Restored timer state from localStorage:', 
                    Math.floor(sharedTimerState.elapsedTime/1000) + 's', 
                    sharedTimerState.isRunning ? 'running' : 'paused');
                
                // Also apply to gameState if it exists
                if (window.gameState) {
                    if (!window.gameState.gameTimer) {
                        window.gameState.gameTimer = {};
                    }
                    window.gameState.gameTimer.elapsedTime = sharedTimerState.elapsedTime;
                    window.gameState.gameTimer.isRunning = sharedTimerState.isRunning;
                    window.gameState.gameTimer.lastUpdated = Date.now();
                    window.gameState.gameTimer.turnTimer = sharedTimerState.turnTimer;
                    console.log('[TIMER] Also applied timer state to gameState');
                }
                
                return sharedTimerState.isRunning; // Return whether timer was running
            } else {
                console.log('[TIMER] Saved timer is from a different game/session, not restoring');
                return false;
            }
        } catch (e) {
            console.error('[TIMER] Error loading saved timer state:', e);
            return false;
        }
    }
    
    // Load saved state immediately when the module initializes
    const timerWasRunning = loadSavedTimerState();
    
    // If localStorage didn't have timer state, try loading from gameState
    if (!timerWasRunning && window.gameState && window.gameState.gameTimer) {
        console.log('[TIMER] Loading timer state from gameState as fallback');
        sharedTimerState.elapsedTime = window.gameState.gameTimer.elapsedTime || 0;
        sharedTimerState.isRunning = window.gameState.gameTimer.isRunning || false;
        sharedTimerState.gameId = window.gameState.gameTimer.gameId || getGameId();
        sharedTimerState.lastSavedTime = window.gameState.gameTimer.lastUpdated || Date.now();
        
        console.log('[TIMER] Restored timer state from gameState:', 
            Math.floor(sharedTimerState.elapsedTime/1000) + 's', 
            sharedTimerState.isRunning ? 'running' : 'paused');
    }
    
    // If timer was running before page refresh, start it again
    if ((timerWasRunning || sharedTimerState.isRunning) && sharedTimerState.isRunning) {
        console.log('[TIMER] Auto-starting timer that was running before refresh');
        sharedTimerState.startTime = Date.now();
        sharedTimerState.updateInterval = setInterval(updateDisplay, 1000);
        // Update display immediately
        setTimeout(updateDisplay, 0);
        // Update menu button to reflect running state
        setTimeout(updateMenuButton, 100);
    }

    function init() {
        console.log('[TIMER] Initializing timer controls...');
        
        // Find all timer containers
        const timerContainerElements = document.querySelectorAll('.game-timer-controls');
        if (timerContainerElements.length === 0) {
            console.warn('[TIMER] No timer containers found');
            return;
        }
        
        // First time initialization - load saved state if not already loaded
        if (!sharedTimerState.initialized) {
            // Get current game ID
            const currentGameId = getGameId();
            sharedTimerState.gameId = currentGameId;
            
            // We already tried to load the saved state when the module initialized,
            // but we'll check again in case the game state wasn't fully loaded then
            if (sharedTimerState.elapsedTime === 0 && !sharedTimerState.isRunning) {
                console.log('[TIMER] Timer state is empty during init, trying to load again...');
                const wasRunning = loadSavedTimerState();
                if (wasRunning && sharedTimerState.isRunning && !sharedTimerState.updateInterval) {
                    console.log('[TIMER] Starting timer during init that was found to be running');
                    sharedTimerState.startTime = Date.now();
                    sharedTimerState.updateInterval = setInterval(updateDisplay, 1000);
                }
            }
            
            sharedTimerState.initialized = true;
        } else {
            // Check if this is a new game (after initialization)
            const currentGameId = getGameId();
            
            // Only reset if we have a valid game ID and it's different from the current one
            if (currentGameId && sharedTimerState.gameId && currentGameId !== sharedTimerState.gameId) {
                console.log('[TIMER] New game detected, resetting timer');
                resetTimer();
                sharedTimerState.gameId = currentGameId;
            }
        }
        
        // Clean up any displays that are no longer in the DOM
        sharedTimerState.displays = sharedTimerState.displays.filter(display => document.body.contains(display));
        
        // Initialize each timer container
        timerContainerElements.forEach((timerContainer, index) => {
            // Determine timer ID - either use the existing ID or create a new one
            const timerId = timerContainer.id || `timer-${index}`;
            
            // Store container reference
            timerContainers[timerId] = timerContainer;
            
            // Check if there are existing timer displays
            const existingGameDisplay = timerContainer.querySelector('.game-timer-display');
            const existingTurnDisplay = timerContainer.querySelector('.turn-timer-display');
            
            // Always remove any existing toggle buttons since we moved to menu
            const existingToggleButtons = timerContainer.querySelectorAll('.game-timer-toggle-button');
            existingToggleButtons.forEach(btn => btn.remove());
            
            let gameDisplay, turnDisplay;
            
            if (existingGameDisplay && existingTurnDisplay) {
                // Use existing display elements
                gameDisplay = existingGameDisplay;
                turnDisplay = existingTurnDisplay;
            } else {
                // Clear any existing timer controls and create new displays
                timerContainer.innerHTML = '';
                
                // Create container for both timers
                const timersWrapper = document.createElement('div');
                timersWrapper.className = 'timers-wrapper';
                
                // Create total game timer label and display
                const gameTimerSection = document.createElement('div');
                gameTimerSection.className = 'timer-section';
                
                const gameLabel = document.createElement('div');
                gameLabel.className = 'timer-label';
                gameLabel.textContent = 'Total Time';
                
                gameDisplay = document.createElement('span');
                gameDisplay.className = 'game-timer-display';
                gameDisplay.textContent = '00:00:00';
                gameDisplay.style.display = 'inline-block';
                gameDisplay.style.width = '100px';
                gameDisplay.style.textAlign = 'left';
                gameDisplay.style.minWidth = '100px';
                gameDisplay.style.letterSpacing = '1px';
                
                gameTimerSection.appendChild(gameLabel);
                gameTimerSection.appendChild(gameDisplay);
                
                // Create turn timer label and display
                const turnTimerSection = document.createElement('div');
                turnTimerSection.className = 'timer-section';
                
                const turnLabel = document.createElement('div');
                turnLabel.className = 'timer-label';
                turnLabel.textContent = "Current Turn";
                
                turnDisplay = document.createElement('span');
                turnDisplay.className = 'turn-timer-display';
                turnDisplay.textContent = '00:00:00';
                turnDisplay.style.display = 'inline-block';
                turnDisplay.style.width = '100px';
                turnDisplay.style.textAlign = 'left';
                turnDisplay.style.minWidth = '100px';
                turnDisplay.style.letterSpacing = '1px';
                
                turnTimerSection.appendChild(turnLabel);
                turnTimerSection.appendChild(turnDisplay);
                
                // Add both sections to wrapper
                timersWrapper.appendChild(gameTimerSection);
                timersWrapper.appendChild(turnTimerSection);
                
                // Add wrapper to container
                timerContainer.appendChild(timersWrapper);
            }
            
            // Add to shared state arrays if not already there
            if (!sharedTimerState.displays.includes(gameDisplay)) {
                sharedTimerState.displays.push(gameDisplay);
            }
            if (!sharedTimerState.turnTimer.displays.includes(turnDisplay)) {
                sharedTimerState.turnTimer.displays.push(turnDisplay);
            }
            
            console.log(`[TIMER] Timer controls initialized for ${timerId}`);
        });
        
        // Update all displays immediately
        updateDisplay();
        
        // Update menu button to reflect current state
        updateMenuButton();
        
        // Set up menu button event listener
        const menuTimerButton = document.getElementById('menu-timer-toggle-button');
        if (menuTimerButton) {
            // Remove any existing listener
            menuTimerButton.removeEventListener('click', toggleTimer);
            // Add the listener
            menuTimerButton.addEventListener('click', toggleTimer);
        }
        
        // If timer was running, ensure the interval is active
        if (sharedTimerState.isRunning && !sharedTimerState.updateInterval) {
            sharedTimerState.startTime = Date.now();
            sharedTimerState.updateInterval = setInterval(updateDisplay, 1000);
        }
    }

    function toggleTimer() {
        if (sharedTimerState.isRunning) {
            // Pause the timer
            sharedTimerState.isRunning = false;
            sharedTimerState.elapsedTime += Date.now() - sharedTimerState.startTime;
            if (sharedTimerState.updateInterval) {
                clearInterval(sharedTimerState.updateInterval);
                sharedTimerState.updateInterval = null;
            }
            
            // Also pause the turn timer
            pausePlayerTurn();
            
            console.log('[TIMER] Timer paused');
        } else {
            // Start the timer
            sharedTimerState.isRunning = true;
            sharedTimerState.startTime = Date.now();
            if (!sharedTimerState.updateInterval) {
                sharedTimerState.updateInterval = setInterval(updateDisplay, 1000);
            }
            
            // Also resume the turn timer if there's a current player
            if (sharedTimerState.turnTimer.currentPlayer) {
                resumePlayerTurn();
            }
            
            console.log('[TIMER] Timer started');
        }
        
        // Update menu button text and icon
        updateMenuButton();
        
        // Save timer state immediately when toggled
        saveTimerState();
    }
    
    // Dedicated function to start the timer (only starts if not already running)
    function startTimer() {
        if (!sharedTimerState.isRunning) {
            // Start the timer
            sharedTimerState.isRunning = true;
            sharedTimerState.startTime = Date.now();
            if (!sharedTimerState.updateInterval) {
                sharedTimerState.updateInterval = setInterval(updateDisplay, 1000);
            }
            
            // Also resume the turn timer if there's a current player
            if (sharedTimerState.turnTimer.currentPlayer) {
                resumePlayerTurn();
            }
            
            console.log('[TIMER] Timer started');
            
            // Update menu button text and icon
            updateMenuButton();
            
            // Save timer state immediately when started
            saveTimerState();
        } else {
            console.log('[TIMER] Timer is already running, not starting again');
        }
    }
    
    // Get a unique identifier for the current game
    function getGameId() {
        if (window.gameState) {
            // First check if the game has a unique ID already
            if (window.gameState.gameId) {
                return window.gameState.gameId;
            }
            
            // If not, check for createdAt timestamp
            if (window.gameState.createdAt) {
                // Store this ID in the game state for future reference
                window.gameState.gameId = `game-${window.gameState.createdAt}`;
                return window.gameState.gameId;
            }
            
            // Last resort: use stage and player count as a rough identifier
            const stage = window.gameState.stage || 'unknown';
            const playerCount = (window.gameState.players || []).length;
            if (playerCount > 0) {
                const gameId = `${stage}-${playerCount}-${Date.now()}`;
                window.gameState.gameId = gameId; // Store it for consistency
                return gameId;
            }
        }
        
        // If no game state, create a temporary session ID
        if (!window.tempGameId) {
            window.tempGameId = `session-${Date.now()}`;
        }
        return window.tempGameId;
    }
    
    // Update the menu button to reflect current timer state
    function updateMenuButton() {
        const menuButton = document.getElementById('menu-timer-toggle-button');
        const timerToggleText = document.getElementById('timer-toggle-text');
        
        if (menuButton && timerToggleText) {
            const icon = menuButton.querySelector('i');
            if (sharedTimerState.isRunning) {
                if (icon) icon.className = 'fas fa-pause';
                timerToggleText.textContent = 'Pause Timer';
                menuButton.title = 'Pause Timer';
            } else {
                if (icon) icon.className = 'fas fa-play';
                timerToggleText.textContent = 'Start Timer';
                menuButton.title = 'Start Timer';
            }
        }
    }
    
    // Turn timer management functions
    function startPlayerTurn(playerId) {
        console.log('[TIMER] Starting turn for player:', playerId);
        
        // If there was a previous player, save their turn time
        if (sharedTimerState.turnTimer.currentPlayer && sharedTimerState.turnTimer.isRunning) {
            endCurrentPlayerTurn();
        }
        
        // Start new turn
        sharedTimerState.turnTimer.currentPlayer = playerId;
        sharedTimerState.turnTimer.currentTurnStart = Date.now();
        sharedTimerState.turnTimer.currentTurnElapsed = 0;
        sharedTimerState.turnTimer.isRunning = sharedTimerState.isRunning; // Match game timer state
        
        // Initialize player total time if not exists
        if (!sharedTimerState.turnTimer.playerTotalTimes[playerId]) {
            sharedTimerState.turnTimer.playerTotalTimes[playerId] = 0;
        }
        
        console.log('[TIMER] Turn started for player:', playerId);
        saveTimerState();
    }
    
    function endCurrentPlayerTurn() {
        if (sharedTimerState.turnTimer.currentPlayer && sharedTimerState.turnTimer.isRunning) {
            // Calculate final turn time
            const turnTime = sharedTimerState.turnTimer.currentTurnElapsed + 
                           (Date.now() - sharedTimerState.turnTimer.currentTurnStart);
            
            // Add to player's total time
            const playerId = sharedTimerState.turnTimer.currentPlayer;
            if (!sharedTimerState.turnTimer.playerTotalTimes[playerId]) {
                sharedTimerState.turnTimer.playerTotalTimes[playerId] = 0;
            }
            sharedTimerState.turnTimer.playerTotalTimes[playerId] += turnTime;
            
            console.log('[TIMER] Ended turn for player:', playerId, 
                       'Turn time:', formatTime(turnTime), 
                       'Total time:', formatTime(sharedTimerState.turnTimer.playerTotalTimes[playerId]));
            
            // Stop turn timer
            sharedTimerState.turnTimer.isRunning = false;
            sharedTimerState.turnTimer.currentTurnElapsed = 0;
            
            saveTimerState();
        }
    }
    
    function pausePlayerTurn() {
        if (sharedTimerState.turnTimer.isRunning) {
            // Save current turn elapsed time
            sharedTimerState.turnTimer.currentTurnElapsed += Date.now() - sharedTimerState.turnTimer.currentTurnStart;
            sharedTimerState.turnTimer.isRunning = false;
            console.log('[TIMER] Paused turn for player:', sharedTimerState.turnTimer.currentPlayer);
        }
    }
    
    function resumePlayerTurn() {
        if (sharedTimerState.turnTimer.currentPlayer && !sharedTimerState.turnTimer.isRunning) {
            sharedTimerState.turnTimer.currentTurnStart = Date.now();
            sharedTimerState.turnTimer.isRunning = true;
            console.log('[TIMER] Resumed turn for player:', sharedTimerState.turnTimer.currentPlayer);
        }
    }
    
    function getCurrentPlayerTotalTime(playerId) {
        return sharedTimerState.turnTimer.playerTotalTimes[playerId] || 0;
    }
    
    // Reset the timer to 00:00:00
    function resetTimer() {
        // Stop any running timer
        if (sharedTimerState.updateInterval) {
            clearInterval(sharedTimerState.updateInterval);
            sharedTimerState.updateInterval = null;
        }
        
        // Reset timer state
        sharedTimerState.isRunning = false;
        sharedTimerState.startTime = 0;
        sharedTimerState.elapsedTime = 0;
        
        // Reset turn timer state
        sharedTimerState.turnTimer.currentPlayer = null;
        sharedTimerState.turnTimer.currentTurnStart = 0;
        sharedTimerState.turnTimer.currentTurnElapsed = 0;
        sharedTimerState.turnTimer.isRunning = false;
        sharedTimerState.turnTimer.playerTotalTimes = {};
        
        // Update all displays to show 00:00:00
        sharedTimerState.displays.forEach(display => {
            if (display) display.textContent = '00:00:00';
        });
        
        // Update turn timer displays to show 00:00:00
        sharedTimerState.turnTimer.displays.forEach(display => {
            if (display) display.textContent = '00:00:00';
        });
        
        // Update menu button to show play icon
        updateMenuButton();
        
        // Clear saved timer state in localStorage
        try {
            localStorage.removeItem('ti4GameTimer');
        } catch (e) {
            console.error('[TIMER] Error clearing saved timer state:', e);
        }
        
        // Also clear timer state in gameState if it exists
        if (window.gameState && window.gameState.gameTimer) {
            window.gameState.gameTimer.elapsedTime = 0;
            window.gameState.gameTimer.isRunning = false;
            
            // Save the game state to persist the reset timer
            if (window.stateCore && typeof window.stateCore.saveGameState === 'function') {
                window.stateCore.saveGameState();
            }
        }
        
        console.log('[TIMER] Timer reset to 00:00:00');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded
        setTimeout(init, 0);
    }
    
    // Re-initialize timers when the DOM changes (e.g., when new timer elements are added)
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                // Check if any timer containers were added
                const hasTimerContainer = Array.from(mutation.addedNodes).some(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList?.contains('game-timer-controls')) return true;
                        return node.querySelector?.('.game-timer-controls') !== null;
                    }
                    return false;
                });
                
                if (hasTimerContainer) {
                    console.log('[TIMER] New timer container detected, reinitializing...');
                    setTimeout(init, 0);
                    break;
                }
            }
            
            // Also check for removed nodes to clean up references
            if (mutation.removedNodes.length > 0) {
                const hasRemovedTimerContainer = Array.from(mutation.removedNodes).some(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList?.contains('game-timer-controls')) return true;
                        return node.querySelector?.('.game-timer-controls') !== null;
                    }
                    return false;
                });
                
                if (hasRemovedTimerContainer) {
                    console.log('[TIMER] Timer container removed, cleaning up references...');
                    // Clean up references to removed DOM elements
                    sharedTimerState.displays = sharedTimerState.displays.filter(display => document.body.contains(display));
                }
            }
        }
    });
    
    // Start observing the document
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Add window beforeunload handler to save on page close/refresh
    window.addEventListener('beforeunload', function() {
        if (sharedTimerState.isRunning || sharedTimerState.elapsedTime > 0) {
            saveTimerState();
            console.log('[TIMER] Saved timer state before page unload');
        }
    });
    
    // Define the updateDisplay function
    function updateDisplay() {
        // Update game timer displays
        if (sharedTimerState.displays.length > 0) {
            let currentTime = sharedTimerState.elapsedTime;
            if (sharedTimerState.isRunning) {
                currentTime += Date.now() - sharedTimerState.startTime;
            }
            
            const gameTimeText = formatTime(currentTime);
            
            // Update all game timer displays
            sharedTimerState.displays.forEach(display => {
                if (display) display.textContent = gameTimeText;
            });
        }
        
        // Update turn timer displays
        if (sharedTimerState.turnTimer.displays.length > 0) {
            let currentTurnTime = sharedTimerState.turnTimer.currentTurnElapsed;
            if (sharedTimerState.turnTimer.isRunning) {
                currentTurnTime += Date.now() - sharedTimerState.turnTimer.currentTurnStart;
            }
            
            const turnTimeText = formatTime(currentTurnTime);
            
            // Update all turn timer displays
            sharedTimerState.turnTimer.displays.forEach(display => {
                if (display) display.textContent = turnTimeText;
            });
        }
        
        // Save state periodically - increased to every 10 seconds for better performance
        const now = Date.now();
        if (sharedTimerState.isRunning && (now - sharedTimerState.lastSavedTime > 10000)) {
            saveTimerState();
        }
    }
    
    // Helper function to format time as HH:MM:SS
    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }
    
    // Save timer state to both gameState and localStorage
    function saveTimerState() {
        // Calculate current elapsed time
        let currentTime = sharedTimerState.elapsedTime;
        if (sharedTimerState.isRunning) {
            currentTime += Date.now() - sharedTimerState.startTime;
        }
        
        // Calculate current turn time
        let currentTurnTime = sharedTimerState.turnTimer.currentTurnElapsed;
        if (sharedTimerState.turnTimer.isRunning) {
            currentTurnTime += Date.now() - sharedTimerState.turnTimer.currentTurnStart;
        }
        
        // Get current game ID if not already set
        if (!sharedTimerState.gameId) {
            sharedTimerState.gameId = getGameId();
        }
        
        // CRITICAL: Save directly to localStorage FIRST for persistence across refreshes
        try {
            const timerState = {
                elapsedTime: currentTime,
                isRunning: sharedTimerState.isRunning,
                gameId: sharedTimerState.gameId,
                lastUpdated: Date.now(),
                turnTimer: {
                    currentPlayer: sharedTimerState.turnTimer.currentPlayer,
                    currentTurnElapsed: currentTurnTime,
                    isRunning: sharedTimerState.turnTimer.isRunning,
                    playerTotalTimes: sharedTimerState.turnTimer.playerTotalTimes
                }
            };
            localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
            console.log('[TIMER] Saved timer state to localStorage:', 
                Math.floor(currentTime/1000) + 's', 
                sharedTimerState.isRunning ? 'running' : 'paused');
            
            // Track when we last saved
            sharedTimerState.lastSavedTime = Date.now();
        } catch (e) {
            console.error('[TIMER] Error saving timer state to localStorage:', e);
        }
        
        // Also save to game state if available
        if (window.gameState) {
            if (!window.gameState.gameTimer) {
                window.gameState.gameTimer = {};
            }
            
            // Store timer state in game state
            window.gameState.gameTimer.elapsedTime = currentTime;
            window.gameState.gameTimer.isRunning = sharedTimerState.isRunning;
            window.gameState.gameTimer.lastUpdated = Date.now();
            window.gameState.gameTimer.gameId = sharedTimerState.gameId;
            
            // Save game state if the function exists
            if (window.stateCore && typeof window.stateCore.saveGameState === 'function') {
                window.stateCore.saveGameState();
            } else if (typeof window.saveGameState === 'function') {
                window.saveGameState();
            }
        }
    }
    
    // Export timer functions
    window.gameTimer = {
        init,
        toggleTimer,
        startTimer,
        updateDisplay,
        resetTimer,
        saveTimerState,
        startPlayerTurn,
        endCurrentPlayerTurn,
        pausePlayerTurn,
        resumePlayerTurn,
        getCurrentPlayerTotalTime
    };
})();


