// Strategy Card Full-Screen Modal for TI4 Scoreboard
// This module handles the display of strategy cards in a full-screen modal during the action phase

let currentStrategyModal = null;
let secondaryActionState = null;

/**
 * Show a full-screen strategy card modal
 * @param {string} cardName - Name of the strategy card
 * @param {Object} player - Player object who played the card
 * @param {string} phase - 'primary' or 'secondary'
 */
function showStrategyCardModal(cardName, player, phase = 'primary') {
    const state = window.stateCore.getGameState();
    const card = state.strategyCards.find(c => c.name === cardName);
    
    if (!card) {
        console.error('Strategy card not found:', cardName);
        return;
    }

    // Remove any existing modal
    if (currentStrategyModal) {
        currentStrategyModal.remove();
        currentStrategyModal = null;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'strategy-card-modal';
    modal.id = 'strategy-card-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'strategy-card-modal-content';
    
    // Modal header
    const header = document.createElement('div');
    header.className = 'strategy-card-modal-header';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'strategy-card-modal-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.onclick = () => hideStrategyCardModal();
    
    const title = document.createElement('h1');
    title.className = 'strategy-card-modal-title';
    title.innerHTML = `
        <span class="strategy-card-modal-initiative">${card.initiative}</span>
        <i class="fas ${getStrategyCardIcon(cardName)}"></i>
        ${cardName}
    `;
    
    const playerInfo = document.createElement('div');
    playerInfo.className = 'strategy-card-modal-player';

    const faction = state.factions.find(f => f.name === player.faction || f.name.replace(/^The /, '') === player.faction);
    const factionIcon = faction ? `images/factions/${faction.id}.webp` : '';
    const factionName = player.faction;

    if (factionIcon) {
        playerInfo.innerHTML = `
            <img src="${factionIcon}" alt="${factionName}" class="strategy-card-modal-player-faction-icon">
            <div class="strategy-card-modal-player-details">
                <span class="strategy-card-modal-player-name-text" style="color: ${player.color}">${player.name}</span>
                <span class="strategy-card-modal-player-faction-text">${factionName}</span>
            </div>
        `;
    } else {
        playerInfo.innerHTML = `<span style="color: ${player.color}"><i class="fas fa-user-astronaut"></i> ${player.name}</span>`;
    }
    
    header.appendChild(closeButton);
    header.appendChild(title);
    header.appendChild(playerInfo);
    
    // Modal body
    const body = document.createElement('div');
    body.className = 'strategy-card-modal-body';
    
    if (phase === 'primary') {
        // Show primary action
        body.appendChild(createPrimaryActionSection(card));
        
        // Add controls for primary action
        const controls = document.createElement('div');
        controls.className = 'strategy-card-modal-controls';
        
        const primaryCompleteBtn = document.createElement('button');
        primaryCompleteBtn.className = 'btn btn-large';
        primaryCompleteBtn.innerHTML = '<i class="fas fa-check"></i> Primary Action Complete';
        primaryCompleteBtn.onclick = () => completePrimaryAction(cardName, player);
        
        controls.appendChild(primaryCompleteBtn);
        body.appendChild(controls);
    } else {
        // Show secondary action
        body.appendChild(createSecondaryActionSection(card, player));
    }
    
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modal.appendChild(modalContent);
    
    // Add to DOM
    document.body.appendChild(modal);
    currentStrategyModal = modal;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            hideStrategyCardModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    if (phase === 'secondary') {
        const playersDiv = document.getElementById('secondary-action-players');
        if (playersDiv) {
            const startTimerForCurrentSecondaryPlayer = () => {
                const currentPlayerEl = playersDiv.querySelector('.secondary-action-player.current');
                if (currentPlayerEl) {
                    const playerId = currentPlayerEl.dataset.playerId;
                    if (window.TI4 && TI4.Core && TI4.Core.Timer) {
                        console.log('[STRATEGY MODAL] Switching timer to secondary player:', playerId);
                        TI4.Core.Timer.startPlayerTimer(playerId);
                    }
                } else if (secondaryActionState && secondaryActionState.completed) {
                    // All secondaries are done, revert to primary player's timer
                    if (window.TI4 && TI4.Core && TI4.Core.Timer && secondaryActionState.activePlayerId) {
                        console.log('[STRATEGY MODAL] Secondary actions completed, reverting timer to primary player:', secondaryActionState.activePlayerId);
                        TI4.Core.Timer.startPlayerTimer(secondaryActionState.activePlayerId);
                    }
                }
            };

            const observer = new MutationObserver(startTimerForCurrentSecondaryPlayer);
            observer.observe(playersDiv, { 
                childList: true, 
                subtree: true, 
                attributes: true, 
                attributeFilter: ['class'] 
            });
            currentStrategyModal.observer = observer; // Store observer on the modal to disconnect later

            startTimerForCurrentSecondaryPlayer(); // Initial timer set
        }
    }
}

/**
 * Hide the strategy card modal
 */
function hideStrategyCardModal() {
    if (currentStrategyModal) {
        if (currentStrategyModal.observer) {
            currentStrategyModal.observer.disconnect();
        }
        currentStrategyModal.remove();
        currentStrategyModal = null;
        
        // Store the active player ID before resetting secondaryActionState
        let activePlayerId = null;
        if (secondaryActionState && secondaryActionState.activePlayerId) {
            activePlayerId = secondaryActionState.activePlayerId;
        }
        
        secondaryActionState = null;
        
        // Restore body scroll
        document.body.style.overflow = '';

        // When modal closes, we need to restore timer to the active player of the turn.
        const state = window.stateCore.getGameState();
        if (state && state.players && state.currentPlayerIndex !== undefined) {
            const currentActivePlayer = state.players[state.currentPlayerIndex];
            if (currentActivePlayer && window.TI4 && TI4.Core && TI4.Core.Timer) {
                console.log('[STRATEGY MODAL] Restoring timer to current active player:', currentActivePlayer.name, currentActivePlayer.id);
                TI4.Core.Timer.startPlayerTimer(currentActivePlayer.id);
            }
        } else if (activePlayerId && window.TI4 && TI4.Core && TI4.Core.Timer) {
            // Fallback to the stored active player ID from secondary action state
            console.log('[STRATEGY MODAL] Fallback: Restoring timer to stored active player:', activePlayerId);
            TI4.Core.Timer.startPlayerTimer(activePlayerId);
        }
    }
}

/**
 * Create the primary action section
 */
function createPrimaryActionSection(card) {
    const section = document.createElement('div');
    section.className = 'strategy-card-modal-phase';
    
    const title = document.createElement('h2');
    title.className = 'strategy-card-modal-phase-title';
    title.textContent = 'Primary Action';
    section.appendChild(title);
    
    // Special ability (if exists and applicable)
    if (card.specialAbility && card.name === 'Diplomacy' && window.stateCore.getGameState().redTapeVariant) {
        const specialDiv = document.createElement('div');
        specialDiv.className = 'strategy-card-ability';
        
        const specialTitle = document.createElement('h3');
        specialTitle.className = 'strategy-card-ability-title';
        specialTitle.innerHTML = '<i class="fas fa-star"></i> Special Ability';
        
        const specialList = document.createElement('ul');
        specialList.className = 'strategy-card-ability-list';
        card.specialAbility.forEach(ability => {
            const li = document.createElement('li');
            li.textContent = ability;
            specialList.appendChild(li);
        });
        
        specialDiv.appendChild(specialTitle);
        specialDiv.appendChild(specialList);
        section.appendChild(specialDiv);
    }
    
    // Primary ability
    const primaryDiv = document.createElement('div');
    primaryDiv.className = 'strategy-card-ability';
    
    const primaryTitle = document.createElement('h3');
    primaryTitle.className = 'strategy-card-ability-title';
    primaryTitle.innerHTML = '<i class="fas fa-crown"></i> Primary Ability';
    
    const primaryList = document.createElement('ul');
    primaryList.className = 'strategy-card-ability-list';
    
    let primaryAbilities = card.primaryAbility;
    if (card.name === 'Diplomacy' && window.stateCore.getGameState().redTapeVariant) {
        // Handle red tape variant for Diplomacy
        primaryAbilities = [card.primaryAbility[0], ...card.primaryAbility.slice(1)];
    }
    
    primaryAbilities.forEach(ability => {
        const li = document.createElement('li');
        li.textContent = ability;
        primaryList.appendChild(li);
    });
    
    primaryDiv.appendChild(primaryTitle);
    primaryDiv.appendChild(primaryList);
    section.appendChild(primaryDiv);
    
    return section;
}

/**
 * Create the secondary action section
 */
function createSecondaryActionSection(card, activePlayer) {
    const section = document.createElement('div');
    section.className = 'strategy-card-modal-phase';
    
    const title = document.createElement('h2');
    title.className = 'strategy-card-modal-phase-title';
    title.textContent = 'Secondary Action';
    section.appendChild(title);
    
    // Secondary ability
    const secondaryDiv = document.createElement('div');
    secondaryDiv.className = 'strategy-card-ability';
    
    const secondaryTitle = document.createElement('h3');
    secondaryTitle.className = 'strategy-card-ability-title';
    secondaryTitle.innerHTML = '<i class="fas fa-users"></i> Secondary Ability';
    
    const secondaryList = document.createElement('ul');
    secondaryList.className = 'strategy-card-ability-list';
    card.secondaryAbility.forEach(ability => {
        const li = document.createElement('li');
        li.textContent = ability;
        secondaryList.appendChild(li);
    });
    
    secondaryDiv.appendChild(secondaryTitle);
    secondaryDiv.appendChild(secondaryList);
    section.appendChild(secondaryDiv);
    
    // Add secondary action player selection
    const secondaryActionDiv = document.createElement('div');
    secondaryActionDiv.className = 'secondary-action-phase';
    
    const secondaryActionTitle = document.createElement('h3');
    secondaryActionTitle.className = 'secondary-action-phase-title';
    secondaryActionTitle.textContent = 'Other Players May Use Secondary Ability';
    secondaryActionDiv.appendChild(secondaryActionTitle);
    
    // Initialize secondary action state if not exists
    if (!secondaryActionState) {
        initializeSecondaryActionState(activePlayer);
    }
    
    const playersDiv = document.createElement('div');
    playersDiv.className = 'secondary-action-players';
    playersDiv.id = 'secondary-action-players';
    
    updateSecondaryActionPlayers(playersDiv);
    secondaryActionDiv.appendChild(playersDiv);
    
    // Controls for secondary action phase
    const controls = document.createElement('div');
    controls.className = 'strategy-card-modal-controls';
    
    if (!secondaryActionState.completed) {
        const skipAllBtn = document.createElement('button');
        skipAllBtn.className = 'btn btn-secondary';
        skipAllBtn.innerHTML = '<i class="fas fa-forward"></i> Skip All Remaining';
        skipAllBtn.onclick = () => skipAllSecondaryActions();
        
        controls.appendChild(skipAllBtn);
    }
    
    const completeBtn = document.createElement('button');
    completeBtn.className = 'btn btn-large';
    completeBtn.innerHTML = '<i class="fas fa-check-double"></i> Complete Strategy Card';
    completeBtn.onclick = () => completeStrategyCard();
    completeBtn.disabled = !secondaryActionState.completed;
    completeBtn.id = 'complete-strategy-card-btn';
    
    controls.appendChild(completeBtn);
    secondaryActionDiv.appendChild(controls);
    
    section.appendChild(secondaryActionDiv);
    return section;
}

/**
 * Initialize secondary action state
 */
function initializeSecondaryActionState(activePlayer) {
    const state = window.stateCore.getGameState();
    const players = state.players.filter(p => p.id !== activePlayer.id && !p.passed);
    
    // Order players clockwise from the active player
    const activePlayerIndex = state.players.findIndex(p => p.id === activePlayer.id);
    const orderedPlayers = [];
    
    for (let i = 1; i < state.players.length; i++) {
        const playerIndex = (activePlayerIndex + i) % state.players.length;
        const player = state.players[playerIndex];
        if (!player.passed) {
            orderedPlayers.push({
                ...player,
                status: 'waiting' // waiting, current, completed, skipped
            });
        }
    }
    
    if (orderedPlayers.length > 0) {
        orderedPlayers[0].status = 'current';
    }
    
    secondaryActionState = {
        players: orderedPlayers,
        currentIndex: orderedPlayers.length > 0 ? 0 : -1,
        completed: orderedPlayers.length === 0,
        activePlayerId: activePlayer.id
    };
}

/**
 * Update secondary action players display
 */
function updateSecondaryActionPlayers(playersDiv) {
    playersDiv.innerHTML = '';
    
    const state = window.stateCore.getGameState();

    secondaryActionState.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = `secondary-action-player ${player.status}`;
        playerDiv.dataset.playerId = player.id;
        
        const header = document.createElement('div');
        header.className = 'secondary-action-player-header';
        
        const faction = state.factions.find(f => f.name === player.faction || f.name.replace(/^The /, '') === player.faction);
        const factionIcon = faction ? `images/factions/${faction.id}.webp` : 'images/icons/gavel.svg';

        const name = document.createElement('div');
        name.className = 'secondary-action-player-name';
        name.innerHTML = `
            <img src="${factionIcon}" alt="${player.faction}" class="secondary-action-player-faction-icon">
            <div class="secondary-action-player-details">
                <span class="secondary-action-player-name-text" style="color: ${player.color};">${player.name}</span>
                <span class="secondary-action-player-faction">${player.faction}</span>
            </div>
        `;
        
        const status = document.createElement('div');
        status.className = `secondary-action-player-status ${player.status}`;
        
        switch (player.status) {
            case 'waiting':
                status.textContent = 'Waiting';
                break;
            case 'current':
                status.textContent = 'Current Turn';
                break;
            case 'completed':
                status.textContent = 'Used Secondary';
                break;
            case 'skipped':
                status.textContent = 'Skipped';
                break;
        }
        
        header.appendChild(name);
        header.appendChild(status);
        playerDiv.appendChild(header);
        
        if (player.status === 'current') {
            const controls = document.createElement('div');
            controls.className = 'secondary-action-player-controls';
            
            const useBtn = document.createElement('button');
            useBtn.className = 'btn btn-success';
            useBtn.innerHTML = '<i class="fas fa-check"></i> Use Secondary';
            useBtn.onclick = () => useSecondaryAction(index);
            
            const skipBtn = document.createElement('button');
            skipBtn.className = 'btn btn-secondary';
            skipBtn.innerHTML = '<i class="fas fa-times"></i> Skip';
            skipBtn.onclick = () => skipSecondaryAction(index);
            
            controls.appendChild(useBtn);
            controls.appendChild(skipBtn);
            playerDiv.appendChild(controls);
        }
        
        playersDiv.appendChild(playerDiv);
    });
}

/**
 * Player uses secondary action
 */
function useSecondaryAction(playerIndex) {
    if (!secondaryActionState || playerIndex !== secondaryActionState.currentIndex) return;
    
    secondaryActionState.players[playerIndex].status = 'completed';
    advanceSecondaryAction();
}

/**
 * Player skips secondary action
 */
function skipSecondaryAction(playerIndex) {
    if (!secondaryActionState || playerIndex !== secondaryActionState.currentIndex) return;
    
    secondaryActionState.players[playerIndex].status = 'skipped';
    advanceSecondaryAction();
}

/**
 * Skip all remaining secondary actions
 */
function skipAllSecondaryActions() {
    if (!secondaryActionState) return;
    
    secondaryActionState.players.forEach(player => {
        if (player.status === 'waiting' || player.status === 'current') {
            player.status = 'skipped';
        }
    });
    
    secondaryActionState.completed = true;
    secondaryActionState.currentIndex = -1;
    
    // Update display
    const playersDiv = document.getElementById('secondary-action-players');
    if (playersDiv) {
        updateSecondaryActionPlayers(playersDiv);
    }
    
    // Enable complete button
    const completeBtn = document.getElementById('complete-strategy-card-btn');
    if (completeBtn) {
        completeBtn.disabled = false;
    }
}

/**
 * Advance to next player in secondary action
 */
function advanceSecondaryAction() {
    if (!secondaryActionState) return;
    
    // Find next waiting player
    let nextIndex = -1;
    for (let i = secondaryActionState.currentIndex + 1; i < secondaryActionState.players.length; i++) {
        if (secondaryActionState.players[i].status === 'waiting') {
            nextIndex = i;
            break;
        }
    }
    
    if (nextIndex !== -1) {
        secondaryActionState.players[nextIndex].status = 'current';
        secondaryActionState.currentIndex = nextIndex;
    } else {
        // No more waiting players
        secondaryActionState.completed = true;
        secondaryActionState.currentIndex = -1;
        
        // Enable complete button
        const completeBtn = document.getElementById('complete-strategy-card-btn');
        if (completeBtn) {
            completeBtn.disabled = false;
        }
    }
    
    // Update display
    const playersDiv = document.getElementById('secondary-action-players');
    if (playersDiv) {
        updateSecondaryActionPlayers(playersDiv);
    }
}

/**
 * Complete primary action and move to secondary
 */
function completePrimaryAction(cardName, player) {
    // Show secondary action phase
    showStrategyCardModal(cardName, player, 'secondary');
}

/**
 * Complete the strategy card entirely
 */
function completeStrategyCard() {
    console.log('completeStrategyCard called');
    hideStrategyCardModal();
    
    // Call the action phase function to complete the strategy card action
    if (window.actionPhase && window.actionPhase.completeStrategyCardAction) {
        console.log('Calling completeStrategyCardAction');
        window.actionPhase.completeStrategyCardAction();
    } else {
        console.error('completeStrategyCardAction not found on window.actionPhase');
    }
    // Force a UI update in case state changes are not triggering it
    if (window.stateCore && typeof window.stateCore.saveGameState === 'function') {
        window.stateCore.saveGameState();
    }
}

/**
 * Get strategy card icon (utility function)
 */
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

// Export functions to global scope
window.strategyCardModal = {
    showStrategyCardModal,
    hideStrategyCardModal,
    completePrimaryAction,
    completeStrategyCard,
    useSecondaryAction,
    skipSecondaryAction,
    skipAllSecondaryActions
};
