// Strategy Phase UI Components for TI4 Scoreboard

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

function renderSelectedCard(player, cardName) {
    const state = window.stateCore.getGameState();
    const card = state.strategyCards.find(c => c.name === cardName);
    return `
        <div class="player-header">            <div class="player-name" style="color: ${player.color}">
                <i class="fas fa-user-astronaut"></i>
                ${player.name}
                ${player.isCurrentSpeaker ? `<i class="fas fa-gavel speaker-icon" title="Current Speaker"></i>` : ''}
            </div>
        </div>
        <div class="strategy-card selected" onclick="event.preventDefault(); event.stopPropagation(); window.strategyPhaseUI.handleStrategyCardClick(event, '${player.id}', '${cardName}')" data-card="${cardName}">
            <span class="initiative-number">${card.initiative}</span>
            <i class="fas ${getStrategyCardIcon(cardName)}"></i>
            ${cardName}
        </div>
    `;
}

function renderAvailableCards(player, isActive) {
    const state = window.stateCore.getGameState();
    const selectedCards = Object.values(state.selectedCards);
    
    return `
        <div class="player-header">
            <div class="player-name" style="color: ${player.color}">
                <i class="fas fa-user-astronaut"></i>
                ${player.name}
                ${player.isCurrentSpeaker ? `<i class="fas fa-gavel speaker-icon" title="Current Speaker"></i>` : ''}
                ${isActive ? '<span class="player-turn-indicator">(Selecting...)</span>' : ''}
            </div>
        </div>
        <div class="strategy-cards-grid">
            ${state.strategyCards.map(card => {
                const isUnavailable = selectedCards.includes(card.name) && selectedCards[player.id] !== card.name;
                const canSelect = isActive && !isUnavailable;
                
                return `
                    <div class="strategy-card ${isUnavailable ? 'unavailable' : ''} ${canSelect ? 'selectable' : ''}" 
                         onclick="${canSelect ? `event.preventDefault(); event.stopPropagation(); window.strategyPhaseUI.handleStrategyCardClick(event, '${player.id}', '${card.name}')` : ''}" 
                         data-card="${card.name}">
                        <span class="initiative-number">${card.initiative}</span>
                        <i class="fas ${getStrategyCardIcon(card.name)}"></i>
                        ${card.name}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function handleStrategyCardClick(event, playerId, cardName) {
    // Prevent all default behavior and stop event propagation
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }
    }
    
    // Store current scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    try {
        // Process the card selection
        const selectionResult = window.strategyPhase.selectStrategyCard(playerId, cardName);
        
        if (selectionResult) {
            // Update UI in the next tick to prevent layout thrashing
            setTimeout(() => {
                try {
                    updateUI();
                    // Restore scroll position after UI update
                    window.scrollTo(0, scrollPosition);
                } catch (e) {
                    console.error('Error during UI update:', e);
                }
            }, 0);
        }
    } catch (e) {
        console.error('Error in handleStrategyCardClick:', e);
    }
    
    // Return false to prevent any default behavior
    return false;
}

function updateStrategySelectionUI() {
    const state = window.stateCore.getGameState();
    const grid = document.getElementById('strategy-selection-grid');
    grid.innerHTML = '';
    
    // Add player score bar at the top
    const playerBarContainer = document.createElement('div');
    playerBarContainer.className = 'strategy-player-bar-container';
    window.playerScoreBar.renderPlayerScoreBar(playerBarContainer, {
        currentPlayerId: null,
        showStrategyCards: true,
        showScoreControls: true,
        showPassedState: false
    });
    grid.appendChild(playerBarContainer);

    const nextPlayer = window.strategyPhase.getNextPlayerInOrder();

    state.turnOrder.forEach(playerId => {
        const player = state.players.find(p => p.id === playerId);
        const isActive = playerId === nextPlayer;
        
        const playerCard = document.createElement('div');
        playerCard.className = `strategy-selection-player ${isActive ? 'active' : ''}`;
        
        const selectedCard = state.selectedCards[player.id];
        
        if (selectedCard) {
            playerCard.innerHTML = renderSelectedCard(player, selectedCard);
        } else {
            playerCard.innerHTML = renderAvailableCards(player, isActive);
        }
        grid.appendChild(playerCard);
    });
    
    // Add a "Proceed to Action Phase" button if all players have selected cards
    const allPlayersSelected = state.players.every(p => state.selectedCards[p.id]);
    if (allPlayersSelected) {
        const proceedButton = document.createElement('div');
        proceedButton.className = 'proceed-button-container';
        proceedButton.innerHTML = `
            <button class="btn btn-large" id="proceed-to-action-phase">
                <i class="fas fa-play"></i> Proceed to Action Phase
            </button>
        `;
        grid.appendChild(proceedButton);
        
        const proceedBtn = proceedButton.querySelector('#proceed-to-action-phase');
        if (proceedBtn) {
            proceedBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.strategyPhase.proceedToActivePhase();
                // updateUI() is called by proceedToActivePhase via saveGameState
            };
        }
    }
}

// Export all UI functions
window.strategyPhaseUI = {
    getStrategyCardIcon,
    renderSelectedCard,
    renderAvailableCards,
    handleStrategyCardClick,
    updateStrategySelectionUI
};
