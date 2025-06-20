// Player Score Bar UI Component for TI4 Scoreboard
// This is a shared component that can be used across different game phases

/**
 * Renders a horizontal player score bar with player information, scores, and strategy cards
 * @param {HTMLElement} container - The container to render the player score bar in
 * @param {Object} options - Options for customizing the player score bar
 * @param {string} [options.currentPlayerId] - ID of the current active player
 * @param {boolean} [options.showStrategyCards=true] - Whether to show strategy cards
 * @param {boolean} [options.showScoreControls=true] - Whether to show score control buttons
 * @param {boolean} [options.showPassedState=true] - Whether to show if players have passed
 * @param {Function} [options.onPlayerClick] - Callback when a player card is clicked
 */
function renderPlayerScoreBar(container, options = {}) {
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    
    const state = window.stateCore.getGameState();
    
    if (!state.turnOrder || state.turnOrder.length === 0) {
        container.innerHTML = '<p class="player-bar-message">No players in turn order.</p>';
        return;
    }
    
    // Set default options
    const defaultOptions = {
        currentPlayerId: null,
        showStrategyCards: true,
        showScoreControls: true,
        showPassedState: true,
        onPlayerClick: null
    };
    
    // Merge default options with provided options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Create the score bar container
    const scoreBarContainer = document.createElement('div');
    scoreBarContainer.className = 'player-score-bar';
    
    // Create player cards for each player in turn order
    state.turnOrder.forEach(playerId => {
        const player = state.players.find(p => p.id === playerId);
        if (!player) return; // Should not happen
        
        const playerEl = document.createElement('div');
        playerEl.className = 'player-card';
        playerEl.style.borderColor = player.color || 'var(--border-color)';
        
        // Add click handler if provided
        if (mergedOptions.onPlayerClick) {
            playerEl.style.cursor = 'pointer';
            playerEl.onclick = () => mergedOptions.onPlayerClick(player.id);
        }

        const isCurrentPlayer = player.id === mergedOptions.currentPlayerId;

        if (mergedOptions.showPassedState && player.passed) {
            playerEl.classList.add('passed-player');
        } 
        
        if (isCurrentPlayer) {
            playerEl.classList.add('active-player');
            // Add a subtle highlight for the current player without animations
            playerEl.style.boxShadow = `0 0 5px 2px ${player.color || 'var(--accent-color)'}`;
            // No animation
        }

        // Faction Image
        let factionImageHTML = '';
        if (player.faction) {
            const factionDetails = state.factions.find(f => f.name.replace(/^The /, '') === player.faction);
            if (factionDetails && factionDetails.id) {
                const imageName = factionDetails.id + '.webp';
                factionImageHTML = `<img src="images/factions/${imageName}" alt="${player.faction}" class="player-faction-icon">`;
            }
        }

        // Strategy Card Display
        let scDisplayHTML = '';
        if (mergedOptions.showStrategyCards && player.strategyCard) {
            const scData = state.strategyCards.find(sc => sc.name === player.strategyCard);
            if (scData) {
                const cardIconClass = getStrategyCardIcon(scData.name);                scDisplayHTML = `
                    <div class="player-sc ${player.strategyCardUsed ? 'used' : ''}" data-card="${scData.name}" title="${scData.name} (Initiative: ${scData.initiative})">
                        <i class="fas ${cardIconClass} sc-icon"></i>
                        <span class="sc-initiative">${scData.initiative}</span>
                        <span class="sc-name">${scData.name}</span>
                    </div>
                `;
            } else {
                scDisplayHTML = `<div class="player-sc-none">Unknown SC: ${player.strategyCard}</div>`;
            }
        }
          // Build the player card HTML
        let playerHTML = `
            <div class="player-info">
                <div class="player-name" style="color: ${player.color || 'var(--text-color)'}">
                    ${player.name} ${mergedOptions.showPassedState && player.passed ? '(Passed)' : ''}
                </div>
                ${isCurrentPlayer ? `<div class="current-player-badge" style="background-color: ${player.color}">
                    <span style="color: ${getContrastTextColor(player.color)}">Current Player</span>
                </div>` : ''}
                <div class="player-faction">${factionImageHTML}<span>${player.faction || 'N/A'}</span></div>
            </div>
            <div class="player-details">
                <div class="player-details-content">
        `;
          // Add simplified score display with menu if enabled
        if (mergedOptions.showScoreControls) {
            playerHTML += `
                <div class="score-components">
                    
                    <div class="score-component-row">
                        <div class="score-component secrets">
                            <span class="component-label">Secrets</span>
                            <div class="component-dots">
                                ${generateDotIndicators(player.secretObjectives || 0, 3)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="score-component-row">
                        <div class="score-component support">
                            <span class="component-label">Support</span>
                            <div class="component-dots">
                                ${generateDotIndicators(player.supportForThrone || 0, Math.max(0, state.players.length - 1))}
                            </div>
                        </div>
                    </div>
                    
                    <div class="score-component-row">
                        <div class="score-component other-vps">
                            <span class="component-label">Other VPs</span>
                            <div class="component-dots">
                                ${generateDotIndicators(player.otherVPs || 0, 5)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="score-component-row menu-row">
                        <button class="score-menu-btn" onclick="event.stopPropagation(); toggleScoreMenu('${player.id}')">
                            <i class="fas fa-cog"></i> Adjust Score
                        </button>
                    </div>
                </div>
                </div>
            `;
        } else {
            playerHTML += `<div class="player-score-display">${player.score}</div>`;
        }
        
        // Close player-details div and add strategy card if enabled
        playerHTML += `</div>`;
        
        if (scDisplayHTML) {
            playerHTML += scDisplayHTML;
        }
          playerEl.innerHTML = playerHTML;
        
        // Add speaker icon below the player card if this player is the current speaker
        if (player.isCurrentSpeaker) {
            const speakerIcon = document.createElement('div');
            speakerIcon.className = 'speaker-icon-below';
            speakerIcon.innerHTML = '<i class="fas fa-gavel" title="Current Speaker"></i>';
            playerEl.appendChild(speakerIcon);
        }
        
        // Add custodians icon below the player card if this player has the custodians token
        if (player.custodians) {
            const custodiansIcon = document.createElement('div');
            custodiansIcon.className = 'custodians-icon-below';
            custodiansIcon.innerHTML = '<i class="fas fa-medal" title="Custodians Token"></i>';
            playerEl.appendChild(custodiansIcon);
        }
        
        scoreBarContainer.appendChild(playerEl);
    });
    
    container.appendChild(scoreBarContainer);
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

// Helper function to generate dot indicators for score components
function generateDotIndicators(currentValue, maxValue) {
    // Ensure values are numbers and not undefined/null
    currentValue = Number(currentValue) || 0;
    maxValue = Number(maxValue) || 0;
    
    let dotsHtml = '';
    for (let i = 0; i < maxValue; i++) {
        const isActive = i < currentValue;
        dotsHtml += `<span class="dot ${isActive ? 'active' : ''}"></span>`;
    }
    return dotsHtml;
}

// Score menu functionality
function toggleScoreMenu(playerId) {
    const existingMenu = document.getElementById('score-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const state = window.stateCore.getGameState();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    createScoreMenu(player);
}

function createScoreMenu(player) {
    const overlay = document.createElement('div');
    overlay.className = 'score-menu-overlay';
    overlay.id = 'score-menu';
    
    const state = window.stateCore.getGameState();
    const canClaimCustodians = !player.custodians && !state.players.some(p => p.custodians);
    
    overlay.innerHTML = `
        <div class="score-menu-content">
            <div class="score-menu-header">
                <h3>Adjust Score - ${player.name}</h3>
                <button class="score-menu-close" onclick="closeScoreMenu()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="score-menu-body">
                <div class="score-menu-item">
                    <label>Secret Objectives</label>
                    <div class="score-menu-controls">
                        <button class="score-btn minus" onclick="updateSecretObjectives('${player.id}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="score-value">${player.secretObjectives || 0}</span>
                        <button class="score-btn plus" onclick="updateSecretObjectives('${player.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="score-menu-dots">
                        ${generateDotIndicators(player.secretObjectives || 0, 3)}
                    </div>
                </div>
                
                <div class="score-menu-item">
                    <label>Support for the Throne</label>
                    <div class="score-menu-controls">
                        <button class="score-btn minus" onclick="updateSupportForThrone('${player.id}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="score-value">${player.supportForThrone || 0}</span>
                        <button class="score-btn plus" onclick="updateSupportForThrone('${player.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="score-menu-dots">
                        ${generateDotIndicators(player.supportForThrone || 0, Math.max(0, state.players.length - 1))}
                    </div>
                </div>
                
                <div class="score-menu-item">
                    <label>Other Victory Points</label>
                    <div class="score-menu-controls">
                        <button class="score-btn minus" onclick="updateOtherVPs('${player.id}', -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="score-value">${player.otherVPs || 0}</span>
                        <button class="score-btn plus" onclick="updateOtherVPs('${player.id}', 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="score-menu-dots">
                        ${generateDotIndicators(player.otherVPs || 0, 5)}
                    </div>
                </div>
                
                ${canClaimCustodians ? `
                <div class="score-menu-item custodians-item">
                    <button class="custodians-claim-btn" onclick="toggleCustodians('${player.id}'); closeScoreMenu();">
                        <i class="fas fa-medal"></i> Claim Custodians Token
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeScoreMenu();
        }
    });
    
    document.body.appendChild(overlay);
}

function closeScoreMenu() {
    const menu = document.getElementById('score-menu');
    if (menu) {
        menu.remove();
    }
}

// Update score functions that will refresh the menu content
function updateScoreMenuDisplay(playerId) {
    const menu = document.getElementById('score-menu');
    if (menu) {
        const state = window.stateCore.getGameState();
        const player = state.players.find(p => p.id === playerId);
        if (player) {
            // Update the displayed values in the menu
            const secretsValue = menu.querySelector('.score-menu-item:nth-child(1) .score-value');
            const supportValue = menu.querySelector('.score-menu-item:nth-child(2) .score-value');
            const otherVPsValue = menu.querySelector('.score-menu-item:nth-child(3) .score-value');
            
            if (secretsValue) secretsValue.textContent = player.secretObjectives || 0;
            if (supportValue) supportValue.textContent = player.supportForThrone || 0;
            if (otherVPsValue) otherVPsValue.textContent = player.otherVPs || 0;
            
            // Update dot indicators
            const secretsDots = menu.querySelector('.score-menu-item:nth-child(1) .score-menu-dots');
            const supportDots = menu.querySelector('.score-menu-item:nth-child(2) .score-menu-dots');
            const otherVPsDots = menu.querySelector('.score-menu-item:nth-child(3) .score-menu-dots');
            
            if (secretsDots) secretsDots.innerHTML = generateDotIndicators(player.secretObjectives || 0, 3);
            if (supportDots) supportDots.innerHTML = generateDotIndicators(player.supportForThrone || 0, Math.max(0, state.players.length - 1));
            if (otherVPsDots) otherVPsDots.innerHTML = generateDotIndicators(player.otherVPs || 0, 5);
        }
    }
}

// Export all UI functions - Hybrid approach for ES Modules migration
// 1. Export to window for backward compatibility
window.playerScoreBar = {
    renderPlayerScoreBar,
    getContrastTextColor,
    getStrategyCardIcon,
    generateDotIndicators,
    toggleScoreMenu,
    createScoreMenu,
    closeScoreMenu,
    updateScoreMenuDisplay
};