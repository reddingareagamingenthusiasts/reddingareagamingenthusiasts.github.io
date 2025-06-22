// Utility function to determine if text should be black or white based on background color
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

// UI update functions
function updateUI() {
    const mainHeader = document.querySelector('.header');
    if (mainHeader) {
        if (gameState.stage === 'setup' && gameState.players.length === 0) {
            mainHeader.style.display = 'block'; // Show header (use block for text-align: center)
        } else {
            mainHeader.style.display = 'none'; // Hide header
        }
    }

    // Show/hide stages based on game state
    const setupStage = document.getElementById('setup-stage');
    const speakerSelectionStage = document.getElementById('speaker-selection-stage');
    const strategySelectionStage = document.getElementById('strategy-selection-stage');
    const activeStage = document.getElementById('active-stage');
    
    if (setupStage) setupStage.classList.toggle('active', gameState.stage === 'setup');
    if (speakerSelectionStage) speakerSelectionStage.classList.toggle('active', gameState.stage === 'speaker-selection');
    if (strategySelectionStage) strategySelectionStage.classList.toggle('active', gameState.stage === 'strategy-selection');
    if (activeStage) activeStage.classList.toggle('active', gameState.stage === 'active');
    
    // Update UI content based on current stage
    if (gameState.stage === 'setup') {
        if (setupStage) updateSetupUI(setupStage); // Pass the container
    } else if (gameState.stage === 'speaker-selection') {
        if (speakerSelectionStage) updateSpeakerSelectionUI(speakerSelectionStage);
    } else if (gameState.stage === 'strategy-selection') {
        if (strategySelectionStage) updateStrategySelectionUI(strategySelectionStage); // This function was already in state.js, ensure it's called correctly
    } else if (gameState.stage === 'active') {
        if (activeStage) {
            updateActiveGameUI(activeStage); // Manages the top bar
            // Explicitly render objectives and action phase players into their static containers
            const objectiveCardsContainer = document.getElementById('objective-cards-container');
            if (objectiveCardsContainer) renderObjectiveCards(objectiveCardsContainer);
            
            // Show/hide containers based on game phase
            const actionPhasePlayersContainer = document.getElementById('action-phase-players-container');
            const actionControlsContainer = document.getElementById('action-phase-controls-container');
            const statusPhaseContainer = document.getElementById('status-phase-container');
            const agendaPhaseContainer = document.getElementById('agenda-phase-container');
            
            // Hide all phase-specific containers first
            if (actionPhasePlayersContainer) actionPhasePlayersContainer.style.display = 'none';
            if (actionControlsContainer) actionControlsContainer.style.display = 'none';
            if (statusPhaseContainer) statusPhaseContainer.style.display = 'none';
            if (agendaPhaseContainer) agendaPhaseContainer.style.display = 'none';
            
            // Show the appropriate container based on the current phase
            if (gameState.phase === 'Action') {
                if (actionPhasePlayersContainer) {
                    actionPhasePlayersContainer.style.display = 'flex'; // Use flex instead of block to maintain horizontal layout
                    window.actionPhaseUI.renderActionPhasePlayers(actionPhasePlayersContainer);
                }
                if (actionControlsContainer) {
                    actionControlsContainer.style.display = 'block';
                    window.actionPhaseUI.renderActionControls(actionControlsContainer);
                }
            } else if (gameState.phase === 'Status') {
                if (statusPhaseContainer) {
                    statusPhaseContainer.style.display = 'block';
                    window.statusPhaseUI.renderStatusPhaseUI(statusPhaseContainer);
                }
            } else if (gameState.phase === 'Agenda') {
                if (agendaPhaseContainer) {
                    agendaPhaseContainer.style.display = 'block';
                    window.agendaPhaseUI.renderAgendaPhaseUI(agendaPhaseContainer);
                }
            }
        }
    }

    // Update Undo menu item state
    const undoMenuItem = document.getElementById('menu-undo-button');
    if (undoMenuItem) {
        undoMenuItem.disabled = gameStateHistory.length === 0 || gameState.stage === 'setup';
    }

    const resetMenuItem = document.getElementById('menu-reset-button');
    const menuDropdown = document.getElementById('menu-dropdown');
    if (menuDropdown && undoMenuItem && resetMenuItem) {
        if (undoMenuItem.disabled && resetMenuItem.disabled) { 
             menuDropdown.classList.remove('open');
        }
    }
}

function updateSetupPlayers() {
    const setupPlayersContainer = document.getElementById('setup-players');
    if (!setupPlayersContainer) return;
    
    setupPlayersContainer.innerHTML = ''; // Clear existing player cards
    gameState.players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'setup-player-card';
        
        const factionOptions = gameState.factions.map(faction => {
            const factionNameWithoutThe = faction.name.replace(/^The /, '');
            const isAvailable = !gameState.players.some(p => p.id !== player.id && p.faction === factionNameWithoutThe);
            const isSelected = player.faction === factionNameWithoutThe;
            return `<option value="${factionNameWithoutThe}"
                    ${!isAvailable && !isSelected ? 'disabled' : ''}
                    ${isSelected ? 'selected' : ''}>
                ${factionNameWithoutThe} ${!isAvailable && !isSelected ? '(Taken)' : ''}
            </option>`;
        }).join('');

        const allColors = defaultGameState.availableColors; 
        const colorOptionHtmlArray = allColors.map(color => {
            const isSelectedByCurrentPlayer = player.color === color;
            const isSelectedByAnotherPlayer = gameState.players.some(p => p.id !== player.id && p.color === color);
            
            let classes = 'color-option';
            let onclickHandler = '';

            if (isSelectedByCurrentPlayer) {
                classes += ' selected';
                onclickHandler = `selectColor('${player.id}', '')`;
            } else if (isSelectedByAnotherPlayer) {
                classes += ' taken';
            } else { // Available
                onclickHandler = `selectColor('${player.id}', '${color}')`;
            }

            return `
                <div class="${classes}"
                     style="background-color: ${color}"
                     ${onclickHandler ? `onclick="${onclickHandler}"` : ''}>
                </div>
            `;
        }); 

        const colorRows = `
            <div class="color-row">
                ${colorOptionHtmlArray.slice(0, 5).join('')}
            </div>
            <div class="color-row">
                ${colorOptionHtmlArray.slice(5, 10).join('')}
            </div>
        `;

        playerCard.innerHTML = `
            <div class="player-name-section">
                <i class="fas fa-user-astronaut" ${player.color ? `style="color: ${player.color}"` : ''}></i>
                ${player.isEditing ?
                    `<input type="text" class="edit-name-input" value="${player.name}"
                           onkeydown="handleNameEdit(event, '${player.id}')"
                           onblur="saveNameEdit('${player.id}', this.value)">` :
                    `<span onclick="startNameEdit('${player.id}')">${player.name}</span>`
                }
                ${!player.isEditing ?
                    `<button class="btn btn-small edit-name-btn" onclick="startNameEdit('${player.id}')">
                        <i class="fas fa-pen"></i>
                    </button>` : ''
                }
            </div>
            <div class="faction-select">
                ${player.faction ?
                    (() => {
                        const factionObject = gameState.factions.find(f => f.name.replace(/^The /, '') === player.faction);
                        if (factionObject && factionObject.id) {
                            const imageName = factionObject.id + '.webp';
                            return `<img src="images/factions/${imageName}" alt="${player.faction}" class="faction-selected-icon">`;
                        }
                        return '<img class="faction-selected-icon" style="display:none" alt="">'; // Hidden placeholder
                    })() : `
                    <img class="faction-selected-icon" style="display:none" alt="">
                `}
                <select onchange="selectFaction('${player.id}', this.value)">
                    <option value="">Select Faction</option>
                    ${factionOptions}
                </select>
            </div>
            <div class="color-select">
                ${colorRows}
            </div>
        `;
        setupPlayersContainer.appendChild(playerCard);
    });

    const startGameBtn = document.getElementById('start-game'); // This ID is in the #setup-stage if players > 0
    if (startGameBtn) {
        startGameBtn.disabled = !gameState.players.every(p => p.faction && p.color);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Menu Toggle
    const menuToggleButton = document.getElementById('menu-toggle-button');
    const menuDropdown = document.getElementById('menu-dropdown');

    if (menuToggleButton && menuDropdown) {
        menuToggleButton.onclick = () => {
            menuDropdown.classList.toggle('open');
        };

        document.addEventListener('click', (event) => {
            if (!menuToggleButton.contains(event.target) && !menuDropdown.contains(event.target)) {
                menuDropdown.classList.remove('open');
            }
        });
    }

    // Menu Item: Reset
    const menuResetBtn = document.getElementById('menu-reset-button');
    if (menuResetBtn) {
        menuResetBtn.onclick = () => {
            resetGame();
            if (menuDropdown) menuDropdown.classList.remove('open');
        };
    }

    // Menu Item: Undo
    const menuUndoBtn = document.getElementById('menu-undo-button');
    if (menuUndoBtn) {
        menuUndoBtn.onclick = () => {
            if (!menuUndoBtn.disabled) {
                undoAction();
                if (gameStateHistory.length === 0 && menuDropdown) {
                    menuDropdown.classList.remove('open');
                }
            }
        };
    }

    // Menu Item: Randomize Objectives
    const menuRandomizeObjectivesBtn = document.getElementById('menu-randomize-objectives-button');
    if (menuRandomizeObjectivesBtn) {
        menuRandomizeObjectivesBtn.addEventListener('click', () => {
            handleRandomizeObjectivesClick();
            // Close the menu after clicking
            const menuDropdown = document.getElementById('menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('open');
            }
        });
    }

    // Menu Item: Export Game
    const menuExportBtn = document.getElementById('menu-export-button');
    if (menuExportBtn) {
        menuExportBtn.addEventListener('click', () => {
            window.stateCore.exportGameState();
            // Close the menu after clicking
            const menuDropdown = document.getElementById('menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('open');
            }
        });
    }

    // Menu Item: Import Game
    const menuImportBtn = document.getElementById('menu-import-button');
    if (menuImportBtn) {
        menuImportBtn.addEventListener('click', () => {
            window.stateCore.promptImportGameState();
            // Close the menu after clicking
            const menuDropdown = document.getElementById('menu-dropdown');
            if (menuDropdown) {
                menuDropdown.classList.remove('open');
            }
        });
    }

    // Listener for Next Round (assuming it's static in active-stage)
    const nextRoundBtn = document.getElementById('next-round');
    if (nextRoundBtn) {
        nextRoundBtn.onclick = () => {
            nextRound();
        };
    }
    
    // Initial UI update. This will call updateSetupUI if in setup stage,
    // which will then attach its specific listeners.
    updateUI();
});

// UI Update Functions (specific to stages)
function updateSetupUI(container) {
    container.innerHTML = ''; // Clear previous content

    if (gameState.players.length === 0) { // Initial setup: Player count, Create Game, and Options
        // Create and append Number of Players section first
        const setupInitialDiv = document.createElement('div');
        setupInitialDiv.className = 'setup-initial';
        setupInitialDiv.id = 'setup-initial';
        let initialPlayerCount = gameState.prospectivePlayerCount || 6;

        setupInitialDiv.innerHTML = `
            <div class="player-count-controls">
                <label>Number of Players</label>
                <div class="counter-controls">
                    <button class="btn btn-small" id="decrease-players"><i class="fas fa-minus"></i></button>
                    <span id="player-count" class="counter-value">${initialPlayerCount}</span>
                    <button class="btn btn-small" id="increase-players"><i class="fas fa-plus"></i></button>
                </div>
                <button class="btn btn-large" id="create-game">
                    <i class="fas fa-gamepad"></i> Create Game
                </button>
            </div>
        `;
        container.appendChild(setupInitialDiv); // Append player count section

        // Add listeners for player count controls
        const decreasePlayersBtn = setupInitialDiv.querySelector('#decrease-players');
        const increasePlayersBtn = setupInitialDiv.querySelector('#increase-players');
        const playerCountDisplay = setupInitialDiv.querySelector('#player-count');
        const createGameBtn = setupInitialDiv.querySelector('#create-game');

        if (playerCountDisplay) {
            let currentCount = parseInt(playerCountDisplay.textContent);
            if (decreasePlayersBtn) {
                decreasePlayersBtn.onclick = () => {
                    if (currentCount > 2) {
                        currentCount--;
                        playerCountDisplay.textContent = currentCount;
                        setProspectivePlayerCount(currentCount); // Update state and extended mode
                    }
                };
            }
            if (increasePlayersBtn) {
                increasePlayersBtn.onclick = () => {
                    if (currentCount < MAX_PLAYERS) {
                        currentCount++;
                        playerCountDisplay.textContent = currentCount;
                        setProspectivePlayerCount(currentCount); // Update state and extended mode
                    }
                };
            }
        }
        if (createGameBtn) {
            createGameBtn.onclick = () => {
                // createGame will use gameState.prospectivePlayerCount if players.length is 0
                createGame(gameState.prospectivePlayerCount);
            };
        }

        // Then, create and append the options row
        const setupOptionsRow = document.createElement('div');
        setupOptionsRow.className = 'setup-options-row';

        // Box 1: Extended Mode Toggle
        const extendedModeBox = document.createElement('div');
        extendedModeBox.className = 'setup-option-box';
        extendedModeBox.innerHTML = `
            <h3 class="option-box-title">Additional Strategy Cards</h3>
            <p class="option-box-description">Adds Industry (4.5) and Logistics (6.5) strategy cards.</p>
            <label class="switch">
                <input type="checkbox" id="extended-mode-toggle" ${gameState.extendedMode ? 'checked' : ''} ${(gameState.players.length > 0 ? gameState.players.length > 8 : gameState.prospectivePlayerCount > 8) ? 'disabled' : ''}>
                <span class="slider round"></span>
            </label>
            <p class="option-box-status" id="extended-mode-status">${gameState.extendedMode ? 'Enabled' : 'Disabled'}</p>
        `;
        setupOptionsRow.appendChild(extendedModeBox);
        const extendedModeCheckbox = extendedModeBox.querySelector('#extended-mode-toggle');
        const extendedModeStatus = extendedModeBox.querySelector('#extended-mode-status');
        if (extendedModeCheckbox && extendedModeStatus) {
            extendedModeCheckbox.onchange = (e) => {
                setExtendedMode(e.target.checked);
                extendedModeStatus.textContent = e.target.checked ? 'Enabled' : 'Disabled';
            };
        }

        // Box 2: Red Tape Variant Toggle
        const redTapeBox = document.createElement('div');
        redTapeBox.className = 'setup-option-box';
        redTapeBox.innerHTML = `
            <h3 class="option-box-title">Red Tape Variant</h3>
            <p class="option-box-description">Adds a special primary ability to the Diplomacy strategy card.</p>
            <label class="switch">
                <input type="checkbox" id="red-tape-variant-toggle" ${gameState.redTapeVariant ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
            <p class="option-box-status" id="red-tape-variant-status">${gameState.redTapeVariant ? 'Enabled' : 'Disabled'}</p>
        `;
        setupOptionsRow.appendChild(redTapeBox);
        const redTapeCheckbox = redTapeBox.querySelector('#red-tape-variant-toggle');
        const redTapeStatus = redTapeBox.querySelector('#red-tape-variant-status');
        if (redTapeCheckbox && redTapeStatus) {
            redTapeCheckbox.onchange = (e) => {
                gameState.redTapeVariant = e.target.checked;
                redTapeStatus.textContent = e.target.checked ? 'Enabled' : 'Disabled';
                // No need to call saveGameState() here, as game state is not fully formed/saved until 'Create Game'
            };
        }

        // Box 3: Game Length Toggle
        const gameLengthBox = document.createElement('div');
        gameLengthBox.className = 'setup-option-box';
        gameLengthBox.innerHTML = `
            <h3 class="option-box-title">Game Length</h3>
            <p class="option-box-description">Set the victory point target for the game.</p>
            <label class="switch">
                <input type="checkbox" id="long-game-toggle" ${gameState.gameLength === 14 ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
            <p class="option-box-status" id="game-length-status">${gameState.gameLength === 14 ? '14 Points (Long)' : '10 Points (Normal)'}</p>
        `;
        setupOptionsRow.appendChild(gameLengthBox);
        const longGameToggleCheckbox = gameLengthBox.querySelector('#long-game-toggle');
        const gameLengthStatus = gameLengthBox.querySelector('#game-length-status');
        if (longGameToggleCheckbox && gameLengthStatus) {
            // Function to update the toggle state
            const updateToggleState = () => {
                const isLongGame = gameState.gameLength === 14;
                longGameToggleCheckbox.checked = isLongGame;
                gameLengthStatus.textContent = isLongGame ? '14 Points (Long)' : '10 Points (Normal)';
            };
            
            // Set initial state
            updateToggleState();
            
            // Listen for game state updates
            window.addEventListener('gameStateUpdated', updateToggleState);
            
            // Handle changes
            longGameToggleCheckbox.onchange = (e) => {
                setGameLength(e.target.checked ? 14 : 10);
            };
        }
        
        container.appendChild(setupOptionsRow); // Append the populated options row to the container

    } else { // Player configuration: Factions, Colors, Names (after createGame)
        const setupControlsTop = document.createElement('div');
        setupControlsTop.className = 'setup-controls-top';
        setupControlsTop.id = 'setup-controls'; // Match ID from HTML for consistency if needed
        setupControlsTop.innerHTML = `
            <button class="btn btn-secondary" id="randomize-all">
                <i class="fas fa-random"></i> Randomize All
            </button>
        `;
        container.appendChild(setupControlsTop);
        const randomizeAllBtn = setupControlsTop.querySelector('#randomize-all');
        if (randomizeAllBtn) {
            randomizeAllBtn.onclick = randomizeAll;
        }

        const setupPlayersDiv = document.createElement('div');
        setupPlayersDiv.className = 'setup-players';
        setupPlayersDiv.id = 'setup-players'; // This is where player cards go
        container.appendChild(setupPlayersDiv);
        updateSetupPlayers(); // Populate player cards into #setup-players

        const setupControlsBottom = document.createElement('div');
        setupControlsBottom.className = 'setup-controls'; // General class for bottom controls
        setupControlsBottom.innerHTML = `
            <button class="btn btn-large" id="start-game" ${!gameState.players.every(p => p.faction && p.color) ? 'disabled' : ''}>
                <i class="fas fa-users"></i> Continue to Speaker Selection
            </button>
        `;
        container.appendChild(setupControlsBottom);
        const startGameBtn = setupControlsBottom.querySelector('#start-game');
        if (startGameBtn) {
            startGameBtn.onclick = () => {
                if (!startGameBtn.disabled) {
                    startGame();
                }
            };
        }
    }
}

function updateSpeakerSelectionUI(container) {
    container.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'setup-header';
    header.innerHTML = `
        <h3>Select Speaker</h3>
        <p class="setup-instructions">Choose the player who will be the Speaker. Click a player to select them, then confirm.</p>
    `;
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'speaker-selection-grid';
    grid.id = 'speaker-selection-grid';
    if (gameState.speaker) {
        grid.classList.add('speaker-is-chosen');
    }
    gameState.players.forEach(player => {
        const candidateCard = document.createElement('div');
        // Add 'selected-speaker' class if this player is the speaker
        candidateCard.className = `speaker-candidate ${gameState.speaker === player.id ? 'selected-speaker' : ''}`;
        candidateCard.style.borderColor = player.color;
        // The card itself is clickable to select the speaker
        candidateCard.onclick = () => selectSpeaker(player.id);
        candidateCard.innerHTML = `
            <div class="speaker-token"><i class="fas fa-gavel fa-2x"></i></div>
            <div class="player-name" style="color: ${player.color}">${player.name}</div>
            <div class="faction-name">${player.faction}</div>
            <div class="select-speaker-indicator">
                ${gameState.speaker === player.id ? '<i class="fas fa-gavel"></i> Speaker' : ''}
            </div>
        `;
        grid.appendChild(candidateCard);
    });
    container.appendChild(grid);

    // Add control buttons container
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'speaker-selection-controls';

    // Add Random Speaker button
    const randomButton = document.createElement('button');
    randomButton.className = 'btn btn-secondary'; // Use existing button styles
    randomButton.id = 'random-speaker-btn';
    randomButton.innerHTML = '<i class="fas fa-random"></i> Select Random Speaker';
    randomButton.onclick = () => {
        selectRandomSpeaker();
        // updateUI(); // selectRandomSpeaker should call saveGameState which calls updateUI
    };
    controlsDiv.appendChild(randomButton);

    // Add Confirm button
    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-large'; // Use existing button styles
    confirmButton.id = 'confirm-speaker-btn';
    confirmButton.innerHTML = '<i class="fas fa-arrow-right"></i> Confirm & Continue';
    confirmButton.disabled = !gameState.speaker; // Disabled if no speaker is selected
    confirmButton.onclick = () => {
        if (gameState.speaker) {
            confirmSpeakerAndProceed();
            // updateUI(); // confirmSpeakerAndProceed should call saveGameState which calls updateUI
        }
    };
    controlsDiv.appendChild(confirmButton);

    container.appendChild(controlsDiv);
}

function updateStrategySelectionUI(container) { // Changed from state.js, now takes container
    if (!container) container = document.getElementById('strategy-selection-stage'); // Fallback if not passed
    if (!container) return;

    console.log('Updating strategy selection UI, container:', container.id);
    
    // Create grid first before clearing the container
    const grid = document.createElement('div');
    grid.id = 'strategy-selection-grid';
    grid.className = 'strategy-selection-grid'; // Ensure class for styling
    
    // Clear container and then add the new grid
    container.innerHTML = ''; // Clear previous stage content first
    container.appendChild(grid); // Add the grid immediately after clearing
    
    // Debug - ensure we have strategy cards to display
    if (!gameState.strategyCards || gameState.strategyCards.length === 0) {
        console.error('Strategy cards missing or empty in updateStrategySelectionUI');
        // Try to initialize them from BASE_STRATEGY_CARDS
        if (typeof BASE_STRATEGY_CARDS !== 'undefined') {
            gameState.strategyCards = [...BASE_STRATEGY_CARDS];
            console.log('Initialized strategy cards from BASE_STRATEGY_CARDS');
        }
    }    const header = document.createElement('div');
    header.className = 'setup-header';
    
    const needsDualCards = gameState.players.length <= 4;
    const instructionText = needsDualCards 
        ? `With ${gameState.players.length} players, each player will select 2 strategy cards. Selection happens in two rounds - first each player selects one card, then everyone selects a second card. The card with the lower initiative will determine turn order.`
        : 'Players will select strategy cards in turn order, starting with the Speaker. Each card provides unique abilities.';
    
    header.innerHTML = `
        <h3>Strategy Phase</h3>
        <p class="setup-instructions">${instructionText}</p>
    `;
    container.appendChild(header);
    
    // Main content wrapper for side-by-side layout
    const mainContentWrapper = document.createElement('div');
    mainContentWrapper.className = 'strategy-selection-main-content';
    container.appendChild(mainContentWrapper);    // Left side: Turn Order with Round Tracker
    const turnOrderDisplay = document.createElement('div');
    turnOrderDisplay.className = 'turn-order-display vertical-turn-order'; // New class for vertical styling
    turnOrderDisplay.innerHTML = ''; // Clear existing content

    // Create Turn Order Header
    const turnOrderHeaderEl = document.createElement('div');
    turnOrderHeaderEl.className = 'turn-order-header';

    const turnOrderTitle = document.createElement('h3');
    turnOrderTitle.textContent = 'Turn Order';
    // Create Container for Round Tracker and Timer
    const roundTrackerAndTimerContainerEl = document.createElement('div');
    roundTrackerAndTimerContainerEl.className = 'round-tracker-timer-container'; // Reuse class for styling

    // Create Round Tracker Widget
    const roundTrackerWidgetEl = document.createElement('div');
    roundTrackerWidgetEl.className = 'round-tracker-widget';
    roundTrackerWidgetEl.innerHTML = `
        <i class="fas fa-clock"></i>
        <div class="round-info-text">
            <span class="label">Round</span>
            <span id="round-number-strategy" class="value">${gameState.round}</span>
        </div>
    `;
    roundTrackerAndTimerContainerEl.appendChild(roundTrackerWidgetEl);

    // Create Game Timer Controls
    const gameTimerControlsEl = document.createElement('div');
    gameTimerControlsEl.className = 'game-timer-controls';

    const gameTimerDisplayEl = document.createElement('span');
    gameTimerDisplayEl.id = 'game-timer-display-strategy'; // Unique ID for this instance
    gameTimerDisplayEl.className = 'game-timer-display';
    gameTimerDisplayEl.textContent = '00:00:00';
    gameTimerControlsEl.appendChild(gameTimerDisplayEl);

    const gameTimerToggleButtonEl = document.createElement('button');
    gameTimerToggleButtonEl.id = 'game-timer-toggle-button-strategy'; // Unique ID for this instance
    gameTimerToggleButtonEl.className = 'game-timer-toggle-button';
    gameTimerToggleButtonEl.innerHTML = '<i class="fas fa-pause"></i>'; // Initial state: Pause
    gameTimerControlsEl.appendChild(gameTimerToggleButtonEl);

    roundTrackerAndTimerContainerEl.appendChild(gameTimerControlsEl);

    // Append the container (tracker and timer) to the header FIRST
    turnOrderHeaderEl.appendChild(roundTrackerAndTimerContainerEl);

    // Then append the Turn Order Title to the header
    turnOrderHeaderEl.appendChild(turnOrderTitle);

    // Append header to turnOrderDisplay
    turnOrderDisplay.appendChild(turnOrderHeaderEl);

    // Create Turn Order List
    const turnOrderListEl = document.createElement('div');
    turnOrderListEl.className = 'turn-order-list';
    turnOrderListEl.innerHTML = getTurnOrderDisplay()
        .map((p, i) => `
            <div class="turn-order-item" style="color: ${p.color}">
                ${i + 1}. ${p.name} ${p.card ? `(${p.card} - ${p.initiative})` : ''}
            </div>
        `).join('');
    turnOrderDisplay.appendChild(turnOrderListEl);
    mainContentWrapper.appendChild(turnOrderDisplay);

    // Right side: Strategy Cards Grid (which includes banner and cards)
    const strategyGrid = container.querySelector('#strategy-selection-grid') || document.createElement('div');
    if (!container.querySelector('#strategy-selection-grid')) { // Ensure strategyGrid is properly initialized if it wasn't before
        strategyGrid.id = 'strategy-selection-grid';
        strategyGrid.className = 'strategy-selection-grid';
    }
    strategyGrid.innerHTML = ''; // Clear previous strategyGrid content (important if re-using existing strategyGrid element)
    mainContentWrapper.appendChild(strategyGrid);


    console.log('UI: Calling window.strategyPhase.getNextPlayerInOrder');
    console.log('UI: window.strategyPhase exists?', !!window.strategyPhase);
    const nextPlayer = window.strategyPhase.getNextPlayerInOrder();
    console.log('UI: nextPlayer result', nextPlayer);
    
    if (nextPlayer) {
        const activePlayer = gameState.players.find(p => p.id === nextPlayer);
        const activePlayerBanner = document.createElement('div');
        activePlayerBanner.className = 'active-player-banner';
        activePlayerBanner.innerHTML = `
            <h2>Current Selection: <span style="color: ${activePlayer.color}">${activePlayer.name}'s</span> Turn to Choose a Strategy Card</h2>
        `;
        strategyGrid.appendChild(activePlayerBanner);
    }
    // Create and append the proceed button controls (will be reordered with cards later if needed)
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'strategy-selection-controls';

    const proceedButton = document.createElement('button');
    proceedButton.className = 'btn btn-large';
    proceedButton.id = 'proceed-to-active-btn';
    proceedButton.innerHTML = '<i class="fas fa-arrow-right"></i> Proceed to Action Phase';
    
    // Check if all players have selected their required cards
    let allPlayersSelectedCards = false;
    
    if (needsDualCards) {
        // For dual cards, all players need exactly 2 strategy cards
        allPlayersSelectedCards = gameState.players.every(p => 
            p.strategyCards && p.strategyCards.length === 2
        );
    } else {
        // Standard single card logic
        allPlayersSelectedCards = gameState.players.every(p => gameState.selectedCards[p.id]);
    }
    
    proceedButton.disabled = !allPlayersSelectedCards;

    proceedButton.onclick = () => {
        window.strategyPhase.proceedToActivePhase();
        // updateUI(); // proceedToActivePhase should call saveGameState which calls updateUI
    };
    controlsDiv.appendChild(proceedButton);
    strategyGrid.appendChild(controlsDiv);

    // Debug output to help diagnose the issue
    console.log('Strategy cards available:', gameState.strategyCards ? gameState.strategyCards.length : 'none');
    
    // Create container for strategy cards
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'strategy-cards-container';
    strategyGrid.appendChild(cardsContainer);
    
    // Card layout constants that were missing
    const cardWidth = 300; // From CSS: .strategy-card-large flex-basis/max-width
    const cardGapRem = 1.5; // From CSS: .strategy-cards-row gap
    
    // Ensure we have strategy cards to display
    if (!gameState.strategyCards || gameState.strategyCards.length === 0) {
        console.error('No strategy cards available');
        if (typeof BASE_STRATEGY_CARDS !== 'undefined') {
            gameState.strategyCards = [...BASE_STRATEGY_CARDS];
            console.log('Initialized strategy cards from BASE_STRATEGY_CARDS');
        } else {
            console.error('BASE_STRATEGY_CARDS is not available');
            return; // Can't proceed without strategy cards
        }
    }
    
    // Sort the strategy cards by initiative
    const sortedCards = [...gameState.strategyCards].sort((a, b) => a.initiative - b.initiative);
    const totalCards = sortedCards.length;
    console.log('Sorted strategy cards:', totalCards);
    
    // Card layout calculations
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const cardGapPx = rootFontSize * cardGapRem;

    // Calculate available width directly from strategyGrid, which should have its final flexed width.
    const availableWidth = strategyGrid.clientWidth;
    
    let idealCardsPerRow = (totalCards === 10) ? 5 : 4;
    let cardsToDisplayPerRow = idealCardsPerRow;

    if (availableWidth > 0) {
        const maxCardsThatCanFit = Math.floor((availableWidth + cardGapPx) / (cardWidth + cardGapPx));
        // If maxCardsThatCanFit is 0 (e.g., very narrow screen), it will default to ideal, then be clamped by Math.max(1, ...)
        if (maxCardsThatCanFit > 0 && maxCardsThatCanFit < cardsToDisplayPerRow) {
            cardsToDisplayPerRow = maxCardsThatCanFit;
        } else if (maxCardsThatCanFit === 0 && idealCardsPerRow > 1) {
            // If it calculates 0 fit, but ideal was > 1, try one less than ideal, down to 1.
            // This handles cases where strategyGrid.clientWidth might be temporarily too small.
            cardsToDisplayPerRow = Math.max(1, idealCardsPerRow - 1);
        }
    }
    cardsToDisplayPerRow = Math.max(1, cardsToDisplayPerRow);

    let currentRow = null;
    let cardsInCurrentRow = 0;

    sortedCards.forEach((card, index) => {
        const needsDualCards = gameState.players.length <= 4;
        
        let isSelectedByOther = false;
        let selectedByPlayer = null;
        
        if (needsDualCards) {
            // For dual cards, check if any OTHER player has this card
            selectedByPlayer = gameState.players.find(p => 
                p.id !== nextPlayer && p.strategyCards && p.strategyCards.includes(card.name)
            );
            isSelectedByOther = !!selectedByPlayer;
        } else {
            // Standard single card logic
            isSelectedByOther = Object.values(gameState.selectedCards).includes(card.name);
            selectedByPlayer = isSelectedByOther ? gameState.players.find(p => gameState.selectedCards[p.id] === card.name) : null;
        }
        
        // Check if current player already has this card (prevent duplicates)
        const currentPlayer = gameState.players.find(p => p.id === nextPlayer);
        const playerAlreadyHas = needsDualCards && currentPlayer && currentPlayer.strategyCards && 
                                currentPlayer.strategyCards.includes(card.name);
        
        // Check if player has reached their card limit
        const playerCardCount = needsDualCards && currentPlayer && currentPlayer.strategyCards ? 
                               currentPlayer.strategyCards.length : 0;
        const playerAtLimit = needsDualCards && playerCardCount >= 2;
        
        const isClickable = !isSelectedByOther && !playerAlreadyHas && !playerAtLimit && nextPlayer;

        const cardElement = document.createElement('div');
        cardElement.className = `strategy-card-large ${isSelectedByOther ? 'selected' : ''}`;
        cardElement.dataset.card = card.name;

        if (isClickable) {
            cardElement.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                window.strategyPhaseUI.handleStrategyCardClick(event, nextPlayer, card.name);
            };
        }

        // Calculate total characters for dynamic font sizing
        let totalChars = 0;
        if (card.specialAbility) totalChars += card.specialAbility.join('').length;
        totalChars += card.primaryAbility.join('').length;
        totalChars += card.secondaryAbility.join('').length;

        let fontSizeClass = 'ability-text-md'; // Default
        if (totalChars < 180) { // Less text, larger font
            fontSizeClass = 'ability-text-lg';
        } else if (totalChars > 330) { // More text, smaller font
            fontSizeClass = 'ability-text-sm';
        }
        // Thresholds (180, 330) are estimates and may need tweaking

        let specialAbilityHTML = '';
        if (card.name === 'Diplomacy' && gameState.redTapeVariant && card.specialAbility && card.specialAbility.length > 0) {
            specialAbilityHTML = `
                <div class="ability special-ability ${fontSizeClass}">
                    <h4>SPECIAL:</h4>
                    <ul class="${fontSizeClass}">${card.specialAbility.map(item => `<li>${item}</li>`).join('')}</ul>
                </div>
            `;
        }

        let primaryAbilityListItems = '';
        if (card.name === 'Diplomacy') {
            let items = [];
            if (gameState.redTapeVariant && card.primaryAbility[0]) {
                items.push(card.primaryAbility[0]);
            }
            items = items.concat(card.primaryAbility.slice(1));
            primaryAbilityListItems = items.map(item => `<li>${item}</li>`).join('');
        } else {
            primaryAbilityListItems = card.primaryAbility.map(item => `<li>${item}</li>`).join('');
        }
        const primaryAbilityHTML = `
            <div class="ability primary-ability">
                <h4>PRIMARY ABILITY:</h4>
                <ul class="${fontSizeClass}">${primaryAbilityListItems}</ul>
            </div>`;

        const secondaryAbilityListItems = card.secondaryAbility.map(item => `<li>${item}</li>`).join('');
        const secondaryAbilityHTML = `
            <div class="ability secondary-ability">
                <h4>SECONDARY ABILITY:</h4>
                <ul class="${fontSizeClass}">${secondaryAbilityListItems}</ul>
            </div>`;

        const selectedByHTML = isSelectedByOther && selectedByPlayer ? `
            <div class="selected-by" style="background-color: ${selectedByPlayer.color};">
                <i class="fas fa-user-astronaut"></i>
                Selected by ${selectedByPlayer.name}
            </div>
            ` : '<div class="selected-by-placeholder"></div>';

        cardElement.innerHTML = `
            <div class="card-header" style="background-color: ${getStrategyCardColor(card.name)}">
                <span class="initiative-number">${card.initiative}</span>
                <h3 class="card-title">
                    <i class="fas ${getStrategyCardIcon(card.name)}"></i>
                    ${card.name}
                </h3>
            </div>
            <div class="card-content">
                <div class="ability-group-top">
                    ${specialAbilityHTML}
                    ${primaryAbilityHTML}
                </div>
                ${secondaryAbilityHTML}
                ${selectedByHTML}
            </div>
        `;

        if (cardsInCurrentRow === 0 || !currentRow) {
            currentRow = document.createElement('div');
            currentRow.className = 'strategy-cards-row';
            cardsContainer.appendChild(currentRow);
            cardsInCurrentRow = 0; // Reset for the new row
        }

        currentRow.appendChild(cardElement);
        cardsInCurrentRow++;

        if (cardsInCurrentRow >= cardsToDisplayPerRow) {
            cardsInCurrentRow = 0; // Reset for the next iteration, will trigger new row creation
        }
    });

    // Insert cardsContainer into strategyGrid (between banner and controls)
    const bannerInGrid = strategyGrid.querySelector('.active-player-banner');
    const controlsInGrid = strategyGrid.querySelector('.strategy-selection-controls');

    if (bannerInGrid && controlsInGrid) {
        bannerInGrid.after(cardsContainer);
    } else if (controlsInGrid) { // No banner, but controls exist
        controlsInGrid.before(cardsContainer);
    } else { // No banner, no controls (should not happen if proceed button is always there)
        strategyGrid.appendChild(cardsContainer);
    }
    
}


// Helper to populate objective card details (moved from renderObjectiveCards)
function populateCardDetails(card, objective, stageTypeStr) {
    card.innerHTML = ''; // Clear any placeholder text or previous content
    const h4 = document.createElement('h4');
    // Remove the stage type text from the title - just use the objective name
    h4.textContent = objective.name || 'Unknown Objective';
    card.appendChild(h4);
    const pText = document.createElement('p');
    pText.className = 'objective-text';
    pText.textContent = objective.text || 'No description available.';
    card.appendChild(pText);
    const pPoints = document.createElement('p');
    pPoints.className = 'objective-points';
    const strongPoints = document.createElement('strong');
    strongPoints.textContent = (objective.points || '0') + ' VP';
    pPoints.appendChild(strongPoints);
    card.appendChild(pPoints);
}

// NEW: Handle Objective Card Click for Context Menu
function handleObjectiveCardClick(event, objective, stageType, slotIndex, cardElement) {
    event.preventDefault();
    event.stopPropagation();

    // Remove any existing context menu
    document.querySelector('.objective-context-menu')?.remove();

    const menu = document.createElement('div');
    menu.className = 'objective-context-menu';

    const ul = document.createElement('ul');

    // 1. Change Objective
    const changeLi = document.createElement('li');
    changeLi.textContent = 'Change Objective';
    changeLi.onclick = () => {
        promptForObjectiveSelection(stageType, slotIndex); // stageType is 'Stage I' or 'Stage II'
        menu.remove();
    };
    ul.appendChild(changeLi);

    // 2. Score Objective
    const scoreLi = document.createElement('li');
    scoreLi.textContent = 'Score Objective';
    const isRedTaped = cardElement.classList.contains('red-taped');

    if (isRedTaped) {
        scoreLi.classList.add('menu-item-disabled');
        scoreLi.title = 'Cannot score an objective with red tape.'; // Tooltip
        // Optionally, explicitly prevent click action though CSS pointer-events: none is preferred
        // scoreLi.onclick = (e) => { e.stopPropagation(); }; 
    } else {
        scoreLi.onclick = () => {
            promptPlayerForScoring(objective, cardElement, menu);
        };
    }
    ul.appendChild(scoreLi);

    ul.appendChild(document.createElement('hr'));

    // 3. Conditional Action (Hide/Reveal or Red Tape)
    const conditionalLi = document.createElement('li');
    if (gameState.redTapeVariant) {
        const hasRedTape = cardElement.classList.contains('red-taped');
        conditionalLi.textContent = hasRedTape ? 'Remove Red Tape' : 'Add Red Tape';
        conditionalLi.onclick = () => {
            const newRedTapeState = !cardElement.classList.contains('red-taped'); // State *after* toggle
            cardElement.classList.toggle('red-taped');
            
            if (!gameState.objectiveRedTapeStatus) { gameState.objectiveRedTapeStatus = {}; } // Ensure object exists
            gameState.objectiveRedTapeStatus[objective.id] = newRedTapeState;
            window.stateCore.recordHistory(); // Record before saving potentially impactful change
            window.stateCore.saveGameState();
            console.log(`Red Tape toggled for: ${objective.id}. New state: ${newRedTapeState}. Saved to gameState.`);
            menu.remove();
        };
    } else { // Standard Mode
        const isHidden = cardElement.classList.contains('hidden-objective');
        conditionalLi.textContent = isHidden ? 'Reveal Objective' : 'Hide Objective';
        conditionalLi.onclick = () => {
            if (conditionalLi.textContent === 'Reveal Objective') { // Action is to Reveal
                cardElement.classList.remove('hidden-objective');
                cardElement.classList.add('revealed');
                populateCardDetails(cardElement, objective, stageType);
            } else { // Action is to Hide
                cardElement.classList.add('hidden-objective');
                cardElement.classList.remove('revealed');
                cardElement.innerHTML = ''; // Clear existing details
                const placeholderText = document.createElement('span');
                placeholderText.textContent = `${stageType} Objective`;
                cardElement.appendChild(placeholderText);
            }
            const isRevealing = (conditionalLi.textContent === 'Reveal Objective');
            
            if (!gameState.objectiveUIVisibility) { gameState.objectiveUIVisibility = {}; } // Ensure object exists
            gameState.objectiveUIVisibility[objective.id] = isRevealing;
            window.stateCore.recordHistory(); // Record before saving potentially impactful change
            window.stateCore.saveGameState();
            console.log(`Visibility state saved for: ${objective.id}. New state: ${isRevealing}. Saved to gameState.`);
            menu.remove();
        };
    }
    ul.appendChild(conditionalLi);

    menu.appendChild(ul);
    document.body.appendChild(menu);

    // Position menu
    const rect = cardElement.getBoundingClientRect();
    let top = window.scrollY + rect.bottom + 5;
    let left = window.scrollX + rect.left;

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;

    // Adjust if menu goes off-screen
    // Must be done *after* adding to body and setting initial position for offsetWidth/Height to be correct
    if (left + menu.offsetWidth > window.innerWidth) {
        menu.style.left = `${window.innerWidth - menu.offsetWidth - 5}px`;
    }
    if (top + menu.offsetHeight > window.innerHeight + window.scrollY) { // Compare with scrollY for elements extending below viewport
        menu.style.top = `${window.scrollY + rect.top - menu.offsetHeight - 5}px`; // Position above the card
    }
    
    // Function to prompt for player selection when scoring an objective
function promptPlayerForScoring(objective, cardElement, menuToRemove) {
    menuToRemove.remove(); // Close the context menu first

    // Remove any existing player selection modal
    document.getElementById('playerSelectionModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'playerSelectionModal';
    modal.className = 'themed-modal'; // Use a generic class for modals if available, or style 'player-selection-modal'

    const modalContent = document.createElement('div');
    modalContent.className = 'themed-modal-content';

    const title = document.createElement('h3');
    title.textContent = `Score "${objective.name || 'this objective'}" for:`;
    modalContent.appendChild(title);

    const playerList = document.createElement('ul');
    playerList.className = 'player-selection-list';

    if (!gameState || !gameState.players || gameState.players.length === 0) {
        const noPlayersMsg = document.createElement('p');
        noPlayersMsg.textContent = 'No players available to score objective.';
        modalContent.appendChild(noPlayersMsg);
    } else {
        gameState.players.forEach(player => {
            const playerItem = document.createElement('li');
            const playerButton = document.createElement('button');
            const hasScored = gameState.publicObjectiveScores && 
                                gameState.publicObjectiveScores[objective.id] && 
                                gameState.publicObjectiveScores[objective.id].includes(player.id);

            playerButton.className = 'player-select-button';
            if (hasScored) {
                playerButton.classList.add('scored-this-objective-button');
                playerButton.textContent = `Unscore for ${player.name}`;
            } else {
                playerButton.textContent = `Score for ${player.name}`;
            }

            playerButton.onclick = () => {
                if (hasScored) {
                    // Call unscorePublicObjective
                    if (typeof unscorePublicObjective === 'function') {
                        unscorePublicObjective(objective.id, player.id);
                    } else if (window.core && typeof window.core.unscorePublicObjective === 'function') {
                        window.core.unscorePublicObjective(objective.id, player.id);
                    } else {
                        console.error('unscorePublicObjective function not found.');
                        showThemedAlert('Error: Could not unscore objective. State function missing.');
                        modal.remove();
                        return;
                    }
                    console.log(`Objective ${objective.id} un-scored for player ${player.id}`);
                } else {
                    // Call scorePublicObjective
                    if (typeof scorePublicObjective === 'function') {
                        scorePublicObjective(objective.id, player.id);
                    } else if (window.core && typeof window.core.scorePublicObjective === 'function') {
                        window.core.scorePublicObjective(objective.id, player.id);
                    } else {
                        console.error('scorePublicObjective function not found.');
                        showThemedAlert('Error: Could not score objective. State function missing.');
                        modal.remove();
                        return;
                    }
                    console.log(`Objective ${objective.id} scored for player ${player.id}`);
                }
                modal.remove();
            };
            playerItem.appendChild(playerButton);
            playerList.appendChild(playerItem);
        });
        modalContent.appendChild(playerList);
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cancel';
    closeButton.className = 'themed-modal-close-button';
    closeButton.onclick = () => {
        modal.remove();
    };
    modalContent.appendChild(document.createElement('hr'));
    modalContent.appendChild(closeButton);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Center the modal (basic centering)
    modal.style.position = 'fixed';
    modal.style.left = '50%';
    modal.style.top = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.zIndex = '1001'; // Ensure it's above context menu if any race condition
}

// Add listener to close menu when clicking elsewhere
    const closeMenuHandler = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenuHandler, true);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenuHandler, true), 0);
}

// NEW: Render Objective Cards
function renderObjectiveCards(container) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous

    const allObjectivesContainer = document.createElement('div');
    allObjectivesContainer.className = 'objective-stage-container all-objectives-row';
    container.appendChild(allObjectivesContainer);

    const isRedTape = gameState.redTapeVariant;

    // Stage I Objectives
    for (let i = 0; i < 5; i++) {
        const objectiveId = gameState.revealedStageIObjectives[i];
        const objective = objectiveId ? ALL_STAGE_I_OBJECTIVES.find(obj => obj.id === objectiveId) : null;
        
        const card = document.createElement('div');
        card.className = 'objective-card-slot stage-i';
        // Store data on the card element for easy access in the click handler
        if(objective) card.dataset.objectiveId = objective.id; 
        card.dataset.slotIndex = i;
        card.dataset.stageType = 'Stage I';

        if (objective) { // Slot is populated
            let isVisible;
            if (isRedTape) { // In Red Tape variant, all objectives are revealed by default
                isVisible = true;
            } else { // Standard Mode
                if (gameState.objectiveUIVisibility && typeof gameState.objectiveUIVisibility[objective.id] === 'boolean') {
                    isVisible = gameState.objectiveUIVisibility[objective.id];
                } else {
                    isVisible = (i < 2); // Default: first two Stage I are visible
                }
            }

            if (isVisible) {
                card.classList.add('revealed');
                card.classList.remove('hidden-objective');
                populateCardDetails(card, objective, 'Stage I');
            } else {
                card.classList.add('hidden-objective');
                card.classList.remove('revealed');
                card.innerHTML = ''; // Clear previous content
                const placeholderText = document.createElement('span');
                placeholderText.textContent = 'Stage I Objective';
                card.appendChild(placeholderText);
            }

            // Determine red tape status
            if (isRedTape) { // Only apply red tape logic if in red tape variant
                let isTaped;
                const defaultRedTapeForStageI = (i >= 2); // Default for Stage I in Red Tape variant
                if (gameState.objectiveRedTapeStatus && typeof gameState.objectiveRedTapeStatus[objective.id] === 'boolean') {
                    isTaped = gameState.objectiveRedTapeStatus[objective.id];
                } else {
                    isTaped = defaultRedTapeForStageI;
                }

                if (isTaped) {
                    card.classList.add('red-taped');
                } else {
                    card.classList.remove('red-taped');
                }
            } else { // Standard mode, ensure no red tape class
                 card.classList.remove('red-taped');
            }
            
            // Add player tokens for scorers (only if visible and populated)
            if (isVisible) {
                const scorersContainerStg1 = document.createElement('div');
                scorersContainerStg1.className = 'objective-card-scorers';
                if (gameState.publicObjectiveScores && gameState.publicObjectiveScores[objective.id]) {
                    gameState.publicObjectiveScores[objective.id].forEach(playerId => {
                        const player = gameState.players.find(p => p.id === playerId);
                        if (player) {
                            const token = document.createElement('div');
                            token.className = 'player-token objective-scorer-token'; // Add specific class if needed for sizing
                            token.style.backgroundColor = player.color;
                            token.title = player.name; // Tooltip with player name

                            if (player.faction) {
                                const factionObject = gameState.factions.find(f => f.name.replace(/^The /, '') === player.faction.replace(/^The /, ''));
                                if (factionObject && factionObject.id) {
                                    const img = document.createElement('img');
                                    img.src = `images/factions/${factionObject.id}.webp`;
                                    img.alt = player.faction;
                                    img.className = 'player-token-faction-icon';
                                    token.appendChild(img);
                                } else {
                                    token.textContent = player.faction.charAt(0).toUpperCase();
                                }
                            } else {
                                token.textContent = player.name.charAt(0).toUpperCase();
                            }
                            scorersContainerStg1.appendChild(token);
                        }
                    });
                }
                if (scorersContainerStg1.hasChildNodes()) {
                     card.appendChild(scorersContainerStg1);
                }
            }
            // Add click listener for context menu to ALL populated cards
            card.addEventListener('click', (event) => handleObjectiveCardClick(event, objective, 'Stage I', i, card));
        } else { // Slot is empty
            card.classList.add('empty-slot', 'stage-i-empty', 'clickable');
            const placeholderText = document.createElement('span');
            placeholderText.textContent = 'Select Stage I Objective';
            card.appendChild(placeholderText);
            card.onclick = () => promptForObjectiveSelection('Stage I', i);
        }
        allObjectivesContainer.appendChild(card);
    }

    // Stage II Objectives
    for (let i = 0; i < 5; i++) {
        const objectiveId = gameState.revealedStageIIObjectives[i];
        const objective = objectiveId ? ALL_STAGE_II_OBJECTIVES.find(obj => obj.id === objectiveId) : null;

        const card = document.createElement('div');
        card.className = 'objective-card-slot stage-ii';
        if(objective) card.dataset.objectiveId = objective.id;
        card.dataset.slotIndex = i;
        card.dataset.stageType = 'Stage II';

        if (objective) { // Slot is populated
            let isVisible;
            if (isRedTape) { // In Red Tape variant, all objectives are revealed by default
                isVisible = true;
            } else { // Standard Mode
                if (gameState.objectiveUIVisibility && typeof gameState.objectiveUIVisibility[objective.id] === 'boolean') {
                    isVisible = gameState.objectiveUIVisibility[objective.id];
                } else {
                    isVisible = false; // Default: Stage II objectives are hidden
                }
            }

            if (isVisible) {
                card.classList.add('revealed');
                card.classList.remove('hidden-objective');
                populateCardDetails(card, objective, 'Stage II');
            } else {
                card.classList.add('hidden-objective');
                card.classList.remove('revealed');
                card.innerHTML = ''; // Clear previous content
                const placeholderText = document.createElement('span');
                placeholderText.textContent = 'Stage II Objective';
                card.appendChild(placeholderText);
            }

            // Determine red tape status
            if (isRedTape) { // Only apply red tape logic if in red tape variant
                let isTaped;
                const defaultRedTapeForStageII = true; // Default for Stage II in Red Tape variant (ALL start taped)
                if (gameState.objectiveRedTapeStatus && typeof gameState.objectiveRedTapeStatus[objective.id] === 'boolean') {
                    isTaped = gameState.objectiveRedTapeStatus[objective.id];
                } else {
                    isTaped = defaultRedTapeForStageII;
                }

                if (isTaped) {
                    card.classList.add('red-taped');
                } else {
                    card.classList.remove('red-taped');
                }
            } else { // Standard mode, ensure no red tape class
                 card.classList.remove('red-taped');
            }
            
            // Add player tokens for scorers (only if visible and populated)
            if (isVisible) {
                const scorersContainerStg2 = document.createElement('div');
                scorersContainerStg2.className = 'objective-card-scorers';
                if (gameState.publicObjectiveScores && gameState.publicObjectiveScores[objective.id]) {
                    gameState.publicObjectiveScores[objective.id].forEach(playerId => {
                        const player = gameState.players.find(p => p.id === playerId);
                        if (player) {
                            const token = document.createElement('div');
                            token.className = 'player-token objective-scorer-token'; // Add specific class if needed for sizing
                            token.style.backgroundColor = player.color;
                            token.title = player.name; // Tooltip with player name

                            if (player.faction) {
                                const factionObject = gameState.factions.find(f => f.name.replace(/^The /, '') === player.faction.replace(/^The /, ''));
                                if (factionObject && factionObject.id) {
                                    const img = document.createElement('img');
                                    img.src = `images/factions/${factionObject.id}.webp`;
                                    img.alt = player.faction;
                                    img.className = 'player-token-faction-icon';
                                    token.appendChild(img);
                                } else {
                                    token.textContent = player.faction.charAt(0).toUpperCase();
                                }
                            } else {
                                token.textContent = player.name.charAt(0).toUpperCase();
                            }
                            scorersContainerStg2.appendChild(token);
                        }
                    });
                }
                if (scorersContainerStg2.hasChildNodes()) {
                     card.appendChild(scorersContainerStg2);
                }
            }
            // Add click listener for context menu to ALL populated cards
            card.addEventListener('click', (event) => handleObjectiveCardClick(event, objective, 'Stage II', i, card));
        } else { // Slot is empty
            card.classList.add('empty-slot', 'stage-ii-empty', 'clickable');
            const placeholderText = document.createElement('span');
            placeholderText.textContent = 'Select Stage II Objective';
            card.appendChild(placeholderText);
            card.onclick = () => promptForObjectiveSelection('Stage II', i);
        }
        allObjectivesContainer.appendChild(card);
    }
}


function updateActiveGameUI(container) {
    // Find or create the top bar wrapper
    let topBarWrapper = container.querySelector('.active-game-top-bar');
    if (!topBarWrapper) {
        topBarWrapper = document.createElement('div');
        topBarWrapper.className = 'active-game-top-bar';
        // Prepend it to ensure it's at the top of the activeStage container
        if (container.firstChild) {
            container.insertBefore(topBarWrapper, container.firstChild);
        } else {
            container.appendChild(topBarWrapper);
        }
    } else {
        topBarWrapper.innerHTML = ''; // Clear only the top bar for re-rendering
    }

    // Container for Round Tracker and Game Timer
    const roundTrackerAndTimerContainer = document.createElement('div');
    roundTrackerAndTimerContainer.className = 'round-tracker-timer-container';

    // Round Tracker (Clock Icon and Round Number)
    const roundTrackerWidget = document.createElement('div');
    roundTrackerWidget.className = 'round-tracker-widget';
    roundTrackerWidget.innerHTML = `
        <i class="fas fa-clock"></i>
        <div class="round-info-text">
            <span class="label">Round</span>
            <span id="round-number" class="value">${gameState.round}</span>
        </div>
    `;
    roundTrackerAndTimerContainer.appendChild(roundTrackerWidget);

    // Game Timer and Controls
    const gameTimerControls = document.createElement('div');
    gameTimerControls.className = 'game-timer-controls';

    const gameTimerDisplay = document.createElement('span');
    gameTimerDisplay.id = 'game-timer-display';
    gameTimerDisplay.className = 'game-timer-display';
    gameTimerDisplay.textContent = '00:00:00';
    gameTimerControls.appendChild(gameTimerDisplay);

    const gameTimerToggleButton = document.createElement('button');
    gameTimerToggleButton.id = 'game-timer-toggle-button';
    gameTimerToggleButton.className = 'game-timer-toggle-button';
    gameTimerToggleButton.innerHTML = '<i class="fas fa-pause"></i>'; // Initial state: Pause
    gameTimerControls.appendChild(gameTimerToggleButton);

    roundTrackerAndTimerContainer.appendChild(gameTimerControls);

    topBarWrapper.appendChild(roundTrackerAndTimerContainer);

    // Score Track
    const scoreTrackContainer = document.createElement('div');
    scoreTrackContainer.id = 'score-track-container';
    let maxScore;
    if (gameState.gameLength === 'standard') {
        maxScore = 10;
    } else if (gameState.gameLength === 'long') {
        maxScore = 14;
    } else {
        maxScore = parseInt(gameState.gameLength, 10); // Fallback if it's already a number string or actual number
    }

    // Ensure maxScore is a valid number, default to 10 if not
    if (isNaN(maxScore)) {
        console.warn('[UI WARN] gameState.gameLength was not recognized, defaulting maxScore to 10. gameLength:', gameState.gameLength);
        maxScore = 10;
    }
    const scoreTrackDiv = document.createElement('div');
    scoreTrackDiv.className = 'score-track';
    if (maxScore === 14) { // Check against the derived numerical maxScore
        scoreTrackDiv.classList.add('score-track-long');
    }

    for (let i = 0; i <= maxScore; i++) {
        const scoreCell = document.createElement('div');
        scoreCell.className = 'score-cell';
        scoreCell.dataset.score = i;

        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'score-label';
        scoreLabel.textContent = i;
        scoreCell.appendChild(scoreLabel);

        const playerTokensContainer = document.createElement('div');
        playerTokensContainer.className = 'player-tokens-container';
        scoreCell.appendChild(playerTokensContainer);

        scoreTrackDiv.appendChild(scoreCell);
    }
    scoreTrackContainer.appendChild(scoreTrackDiv);

    // Place player tokens on the score track
    gameState.players.forEach(player => {
        const playerScoreCell = scoreTrackDiv.querySelector(`.score-cell[data-score='${player.score}'] .player-tokens-container`);
        if (playerScoreCell) {
            const playerToken = document.createElement('div');
            playerToken.className = 'player-token';
            playerToken.style.backgroundColor = player.color;
            playerToken.title = player.name;
            playerToken.innerHTML = '';

            if (player.faction) {
                const factionObject = gameState.factions.find(f => f.name.replace(/^The /, '') === player.faction);
                if (factionObject && factionObject.id) {
                    const img = document.createElement('img');
                    img.src = `images/factions/${factionObject.id}.webp`;
                    img.alt = player.faction;
                    img.className = 'player-token-faction-icon';
                    playerToken.appendChild(img);
                } else {
                    playerToken.textContent = player.faction.charAt(0).toUpperCase();
                }
            } else {
                playerToken.textContent = player.name.charAt(0).toUpperCase();
            }
            playerScoreCell.appendChild(playerToken);
        }
    });
    topBarWrapper.appendChild(scoreTrackContainer);

    // The rest of this function (old players-grid, objective cards, action phase players rendering)
    // is removed as those elements are now static in index.html and populated by
    // renderObjectiveCards and renderActionPhasePlayers called directly from updateUI.
}

function createPlayerCard(player) {
    const div = document.createElement('div');
    div.className = `player-card ${player.isActive ? 'active' : ''}`;
    if (player.color) {
        div.style.borderColor = player.color;
    }
    
    const selectedCard = gameState.selectedCards[player.id];
    const card = selectedCard ? gameState.strategyCards.find(c => c.name === selectedCard) : null;
    
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
            ${card ? `
                <div class="strategy-card selected" onclick="event.preventDefault(); event.stopPropagation(); window.strategyPhaseUI.handleStrategyCardClick(event, '${player.id}', '${selectedCard}')" data-card="${selectedCard}">
                    <span class="initiative-number">${card.initiative}</span>
                    <i class="fas ${getStrategyCardIcon(selectedCard)}"></i>
                    ${selectedCard}
                </div>
            ` : ''}
        </div>
    `;
    return div;
}

function promptForObjectiveSelection(stageType, slotIndex) {
    const availableObjectives = stageType === 'Stage I' ? ALL_STAGE_I_OBJECTIVES : ALL_STAGE_II_OBJECTIVES;
    const revealedObjectiveIds = stageType === 'Stage I' ?
        gameState.revealedStageIObjectives.filter(id => id !== null) :
        gameState.revealedStageIIObjectives.filter(id => id !== null);

    const unrevealedObjectives = availableObjectives.filter(obj => !revealedObjectiveIds.includes(obj.id));

    if (unrevealedObjectives.length === 0) {
        // Instead of alert, we could use a more integrated notification if available
        // For now, keeping it simple or using a custom modal for this message too.
        showThemedAlert('No more ' + stageType + ' objectives available to reveal.');
        return;
    }

    // Remove any existing objective modal
    const existingModal = document.getElementById('objective-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'objective-modal';
    modal.className = 'modal objective-modal-theme'; // Added theme class

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const title = document.createElement('h3');
    title.textContent = 'Select an objective for ' + stageType + ' slot ' + (slotIndex + 1);
    modalContent.appendChild(title);

    const objectiveList = document.createElement('ul');
    objectiveList.className = 'objective-list';

    unrevealedObjectives.forEach(obj => {
        const listItem = document.createElement('li');
        listItem.textContent = obj.name;
        listItem.dataset.objectiveId = obj.id;
        listItem.onclick = () => {
            // Remove 'selected' class from currently selected item
            const currentlySelected = objectiveList.querySelector('.selected');
            if (currentlySelected) {
                currentlySelected.classList.remove('selected');
            }
            // Add 'selected' class to clicked item
            listItem.classList.add('selected');
        };
        objectiveList.appendChild(listItem);
    });
    modalContent.appendChild(objectiveList);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';

    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.className = 'btn'; // Use existing button style
    okButton.onclick = () => {
        const selectedItem = objectiveList.querySelector('.selected');
        if (selectedItem && selectedItem.dataset.objectiveId) {
            const selectedObjectiveId = selectedItem.dataset.objectiveId;
            
            recordHistory(); // Record state before changing objectives
            if (stageType === 'Stage I') {
                gameState.revealedStageIObjectives[slotIndex] = selectedObjectiveId;
            } else {
                gameState.revealedStageIIObjectives[slotIndex] = selectedObjectiveId;
            }
            saveGameState(); // This will trigger updateUI
            modal.remove();
        } else {
            // Optionally, show a message if nothing is selected
            showThemedAlert('Please select an objective.');
        }
    };
    buttonContainer.appendChild(okButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn btn-secondary'; // Use existing button style
    cancelButton.onclick = () => {
        modal.remove();
    };
    buttonContainer.appendChild(cancelButton);

    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Function to prompt for player selection when scoring an objective
function promptPlayerForScoringObjective(objective) {
    // Remove any existing player selection modal
    const existingModal = document.getElementById('player-score-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'player-score-modal';
    modal.className = 'modal player-score-modal-theme'; // Consider adding a specific theme class for styling

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const title = document.createElement('h3');
    title.textContent = `Who scored "${objective.name}"?`;
    modalContent.appendChild(title);

    const playerList = document.createElement('ul');
    playerList.className = 'player-list'; // For styling

    if (!gameState || !gameState.players || gameState.players.length === 0) {
        showThemedAlert('No players available to score objective.');
        return;
    }

    gameState.players.forEach(player => {
        const listItem = document.createElement('li');
        
        const playerNameSpan = document.createElement('span');
        playerNameSpan.textContent = player.name;
        
        const playerColorIndicator = document.createElement('span');
        playerColorIndicator.style.display = 'inline-block';
        playerColorIndicator.style.width = '12px';
        playerColorIndicator.style.height = '12px';
        playerColorIndicator.style.backgroundColor = player.color || '#ccc';
        playerColorIndicator.style.marginLeft = '8px';
        playerColorIndicator.style.border = '1px solid #555';
        playerColorIndicator.style.borderRadius = '50%';

        listItem.appendChild(playerNameSpan);
        listItem.appendChild(playerColorIndicator);
        listItem.dataset.playerId = player.id;

        listItem.onclick = () => {
            const currentlySelected = playerList.querySelector('.selected');
            if (currentlySelected) {
                currentlySelected.classList.remove('selected');
            }
            listItem.classList.add('selected');
        };
        playerList.appendChild(listItem);
    });
    modalContent.appendChild(playerList);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'modal-buttons';

    const okButton = document.createElement('button');
    okButton.textContent = 'Score';
    okButton.className = 'btn'; 
    okButton.onclick = () => {
        const selectedItem = playerList.querySelector('.selected');
        if (selectedItem && selectedItem.dataset.playerId) {
            const selectedPlayerId = selectedItem.dataset.playerId;
            const success = scorePublicObjective(objective.id, selectedPlayerId);
            // scorePublicObjective calls saveGameState() which triggers updateUI()
            // It also handles alerts for conditions like already scored.
            if (success) { // Or simply always remove, as scorePublicObjective gives feedback
                modal.remove();
            }
        } else {
            showThemedAlert('Please select a player.');
        }
    };
    buttonContainer.appendChild(okButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'btn btn-secondary'; 
    cancelButton.onclick = () => {
        modal.remove();
    };
    buttonContainer.appendChild(cancelButton);

    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

// Helper function for themed alerts (can be expanded)
function showThemedAlert(message) {
    // For now, using a simple alert. This could be replaced with a themed modal.
    alert(message);
}

// --- Helper function for shuffling arrays (Fisher-Yates) ---
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array]; // Create a copy to avoid modifying the original array directly
    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
}

// --- New Function for Randomizing Objectives ---
function handleRandomizeObjectivesClick() {
    console.log('Randomize Objectives button clicked! Processing...');

    // Ensure objective data and essential functions/gameState are available
    if (typeof ALL_STAGE_I_OBJECTIVES === 'undefined' || 
        typeof ALL_STAGE_II_OBJECTIVES === 'undefined' ||
        typeof gameState === 'undefined' ||
        typeof recordHistory === 'undefined' ||
        typeof saveGameState === 'undefined' ||
        typeof updateUI === 'undefined' ||
        typeof showThemedAlert === 'undefined') {
        console.error('Essential data or functions (ALL_STAGE_OBJECTIVES, gameState, recordHistory, saveGameState, updateUI, showThemedAlert) are not available.');
        // Use a basic alert if showThemedAlert might also be missing or part of the issue
        alert('Critical Error: Cannot randomize objectives due to missing components. Please check the console.'); 
        return;
    }

    try {
        recordHistory(); // Save current state for undo

        // Shuffle and select Stage I objectives
        const shuffledStageI = shuffleArray(ALL_STAGE_I_OBJECTIVES);
        gameState.revealedStageIObjectives = shuffledStageI.slice(0, 5).map(obj => obj.id);
        // Ensure the array has 5 elements, padding with null if necessary (matching renderObjectiveCards structure)
        while (gameState.revealedStageIObjectives.length < 5) {
            gameState.revealedStageIObjectives.push(null);
        }

        // Shuffle and select Stage II objectives
        const shuffledStageII = shuffleArray(ALL_STAGE_II_OBJECTIVES);
        gameState.revealedStageIIObjectives = shuffledStageII.slice(0, 5).map(obj => obj.id);
        // Ensure the array has 5 elements, padding with null if necessary
        while (gameState.revealedStageIIObjectives.length < 5) {
            gameState.revealedStageIIObjectives.push(null);
        }

        // Note: Public Objective III randomization is not included here yet.
        // This could be added if there's a similar ALL_PUBLIC_III_OBJECTIVES array and 
        // a corresponding gameState property (e.g., gameState.revealedPublicObjectiveIII).

        saveGameState();
        updateUI();

        showThemedAlert('Objectives have been randomly assigned!');
        console.log('Randomly assigned objectives:', {
            stageI: gameState.revealedStageIObjectives,
            stageII: gameState.revealedStageIIObjectives
        });

    } catch (error) {
        console.error('Error during objective randomization:', error);
        showThemedAlert('An error occurred while randomizing objectives. Check console for details.');
        // Consider if any state rollback is needed or possible here.
    }
}
