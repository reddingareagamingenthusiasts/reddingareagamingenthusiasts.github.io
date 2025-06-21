// Action Phase UI Components for TI4 Scoreboard

// Render Action Phase Players
function renderActionPhasePlayers(container) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous
    
    const state = window.stateCore.getGameState();

    if (state.phase !== 'Action' || !state.turnOrder || state.turnOrder.length === 0) {
        container.innerHTML = '<p class="ap-phase-message">Waiting for Action Phase to begin or no players in turn order.</p>';
        return;
    }

    const currentPlayerIdInActionPhase = state.turnOrder[state.actionPhasePlayerIndex];
    
    // Use the shared player score bar component
    window.playerScoreBar.renderPlayerScoreBar(container, {
        currentPlayerId: currentPlayerIdInActionPhase,
        showStrategyCards: true,
        showScoreControls: true,
        showPassedState: true
    });
}

// Render Action Controls for the current player
function renderActionControls(controlsContainer) {
    if (!controlsContainer) return;
    controlsContainer.innerHTML = '';
    
    const state = window.stateCore.getGameState();

    if (state.phase !== 'Action' || !state.turnOrder || state.turnOrder.length === 0) {
        controlsContainer.innerHTML = '<p class="ap-info-text">Waiting for Action Phase to begin.</p>';
        return;
    }

    const currentPlayerId = state.turnOrder[state.actionPhasePlayerIndex];
    const player = state.players.find(p => p.id === currentPlayerId);
    
    if (!player) {
        controlsContainer.innerHTML = '<p class="ap-info-text">Error: Current player not found.</p>';
        return;
    }

    if (player.passed) {
        controlsContainer.innerHTML = `<p class="ap-info-text">${player.name} has passed. Waiting for other players...</p>`;
        if (state.passedPlayerCount >= state.players.length) {
            controlsContainer.innerHTML = '<p class="ap-info-text">All players have passed. Proceeding to Status Phase.</p>';
        }
        return;
    }

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'ap-current-player-actions';
    actionsWrapper.style.color = player.color || 'var(--accent-secondary)';

    // Current Player Title
    const title = document.createElement('h4');
    title.textContent = `${player.name}'s Turn`;
    title.style.color = player.color || 'var(--text-color)';
    actionsWrapper.appendChild(title);

    // Action Selection Buttons
    const actionSelectionDiv = document.createElement('div');
    actionSelectionDiv.className = 'action-select-buttons';

    // Strategy Card Button
    const playSCButton = document.createElement('button');
    playSCButton.className = 'btn btn-action';
    const hasStrategyCard = player.strategyCard !== null && player.strategyCard !== undefined;
    const scName = hasStrategyCard ? player.strategyCard : 'Strategy Card';
    playSCButton.innerHTML = `<i class="fas fa-play-circle"></i> Play ${scName}`;
    playSCButton.onclick = () => window.actionPhase.playerPlaysStrategyCard(player.id);
    playSCButton.disabled = player.strategyCardUsed || !hasStrategyCard;
    playSCButton.title = player.strategyCardUsed ? 'Strategy Card already used' : 
                        !hasStrategyCard ? 'No Strategy Card available' : 
                        'Play your Strategy Card';

    // Component Action Button
    const componentActionButton = document.createElement('button');
    componentActionButton.className = 'btn btn-action';
    componentActionButton.innerHTML = '<i class="fas fa-cogs"></i> Component/Tactical Action';
    componentActionButton.onclick = () => window.actionPhase.playerPerformsComponentAction(player.id);
    componentActionButton.title = 'Perform a tactical or component action';

    // Pass Button
    const passButton = document.createElement('button');
    passButton.className = 'btn btn-action btn-pass';
    passButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Pass';
    passButton.onclick = () => window.actionPhase.playerPassesActionPhase(player.id);
    passButton.disabled = !player.strategyCardUsed;
    passButton.title = player.strategyCardUsed ? 
        'Pass your turn and end your participation in this Action Phase' : 
        'Must use Strategy Card before passing';

    // Add selected-action class if action is staged
    if (state.stagedPlayerAction && state.stagedPlayerAction.playerId === player.id) {
        // Map the action types to their respective buttons
        const buttonMap = {
            'strategy': playSCButton,
            'component': componentActionButton,
            'pass': passButton
        };
        
        // The action type is inside the actionType object property
        const actionType = state.stagedPlayerAction.actionType?.type;
        
        const buttonToHighlight = buttonMap[actionType];
        if (buttonToHighlight) {
            buttonToHighlight.classList.add('selected-action');
        }
    }

    actionSelectionDiv.appendChild(playSCButton);
    actionSelectionDiv.appendChild(componentActionButton);
    actionSelectionDiv.appendChild(passButton);
    actionsWrapper.appendChild(actionSelectionDiv);

    // Confirmation Buttons (only shown when an action is staged)
    if (state.stagedPlayerAction && state.stagedPlayerAction.playerId === player.id) {
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'action-confirm-buttons';

        const confirmButton = document.createElement('button');
        confirmButton.className = 'btn btn-confirm';
        confirmButton.innerHTML = '<i class="fas fa-check-circle"></i> Confirm';
        confirmButton.onclick = () => window.actionPhase.confirmCurrentPlayerAction();
        confirmButton.title = 'Confirm this action';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn btn-cancel';
        cancelButton.innerHTML = '<i class="fas fa-times-circle"></i> Cancel';
        cancelButton.onclick = () => window.actionPhase.clearStagedAction();
        cancelButton.title = 'Cancel this action';

        confirmationDiv.appendChild(cancelButton);
        confirmationDiv.appendChild(confirmButton);
        actionsWrapper.appendChild(confirmationDiv);
    }

    controlsContainer.appendChild(actionsWrapper);
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

// Helper function to get strategy card icon
function getStrategyCardIcon(cardName) {
    const icons = {
        'Leadership': 'fa-crown',
        'Diplomacy': 'fa-handshake',
        'Politics': 'fa-landmark',
        'Construction': 'fa-tools',
        'Trade': 'fa-exchange-alt',
        'Warfare': 'fa-crosshairs',
        'Technology': 'fa-flask',
        'Imperial': 'fa-chess-king',
        'Industry': 'fa-industry',
        'Logistics': 'fa-truck-loading'
    };
    return icons[cardName] || 'fa-question-circle';
}

// Export all UI functions
window.actionPhaseUI = {
    renderActionPhasePlayers,
    renderActionControls,
    getContrastTextColor,
    getStrategyCardIcon
};
