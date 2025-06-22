// Stats Page Module for TI4 Scoreboard
(function() {
    'use strict';

    let isStatsPageOpen = false;

    // Format time from milliseconds to HH:MM:SS
    function formatTime(milliseconds) {
        if (!milliseconds || milliseconds < 0) return '00:00:00';
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Get total game time
    function getTotalGameTime() {
        if (!window.gameTimer) return 0;
        
        // Get current elapsed time from the timer
        const timerState = window.gameTimer;
        let currentTime = 0;
        
        // Try to access the shared timer state
        if (timerState && typeof timerState.getCurrentPlayerTotalTime === 'function') {
            // Calculate total game time from timer
            // We'll need to access the timer's internal state
            try {
                // Access the internal timer state if available
                const gameTimerDisplay = document.querySelector('.game-timer-display');
                if (gameTimerDisplay && gameTimerDisplay.textContent !== '00:00:00') {
                    // Parse the display time back to milliseconds
                    const timeStr = gameTimerDisplay.textContent;
                    const parts = timeStr.split(':');
                    if (parts.length === 3) {
                        const hours = parseInt(parts[0]) || 0;
                        const minutes = parseInt(parts[1]) || 0;
                        const seconds = parseInt(parts[2]) || 0;
                        currentTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
                    }
                }
            } catch (e) {
                console.warn('[STATS] Could not get game time from display:', e);
            }
        }
        
        return currentTime;
    }

    // Calculate public objective points for a player
    function calculatePublicObjectivePoints(playerId) {
        const state = window.stateCore.getGameState();
        if (!state.publicObjectiveScores) return 0;
        
        let totalPoints = 0;
        
        // Check all objectives to see if player has scored them
        Object.keys(state.publicObjectiveScores).forEach(objectiveId => {
            const scorers = state.publicObjectiveScores[objectiveId];
            if (scorers && scorers.includes(playerId)) {
                // Find the objective to get its point value
                let objective = null;
                if (typeof ALL_STAGE_I_OBJECTIVES !== 'undefined') {
                    objective = ALL_STAGE_I_OBJECTIVES.find(obj => obj.id === objectiveId);
                }
                if (!objective && typeof ALL_STAGE_II_OBJECTIVES !== 'undefined') {
                    objective = ALL_STAGE_II_OBJECTIVES.find(obj => obj.id === objectiveId);
                }
                
                if (objective) {
                    totalPoints += objective.points || 0;
                }
            }
        });
        
        return totalPoints;
    }

    // Get player statistics with timing data
    function getPlayerStats() {
        const state = window.stateCore.getGameState();
        if (!state || !state.players) return [];

        return state.players.map(player => {
            let totalTime = 0;
            
            // Get player's total turn time from the timer
            if (window.gameTimer && typeof window.gameTimer.getCurrentPlayerTotalTime === 'function') {
                totalTime = window.gameTimer.getCurrentPlayerTotalTime(player.id) || 0;
            }

            return {
                id: player.id,
                name: player.name || 'Unknown Player',
                faction: player.faction,
                color: player.color,
                score: player.score || 0,
                secretObjectives: player.secretObjectives || 0,
                supportForThrone: player.supportForThrone || 0,
                custodians: player.custodians || false,
                otherVPs: player.otherVPs || 0,
                objectivePoints: calculatePublicObjectivePoints(player.id),
                totalTime: totalTime
            };
        }).sort((a, b) => b.score - a.score); // Sort by score descending
    }

    // Check if game has ended (someone reached target score)
    function hasGameEnded() {
        const state = window.stateCore.getGameState();
        const targetScore = state.gameLength || 10;
        return state.players.some(player => player.score >= targetScore);
    }

    // Get stats button text based on game state
    function getStatsButtonText() {
        const gameEnded = hasGameEnded();
        return gameEnded ? 'End Game - Show Stats' : 'Show Stats';
    }

    // Create and show the stats page
    function showStatsPage() {
        if (isStatsPageOpen) return;
        
        isStatsPageOpen = true;
        const playerStats = getPlayerStats();
        const totalGameTime = getTotalGameTime();
        const gameEnded = hasGameEnded();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'stats-page-overlay';
        overlay.id = 'stats-page-overlay';
        
        // Create stats page content
        const statsPage = document.createElement('div');
        statsPage.className = 'stats-page';
        
        // Header
        const header = document.createElement('div');
        header.className = 'stats-header';
        
        const title = document.createElement('h1');
        title.textContent = gameEnded ? 'Game Complete!' : 'Game Statistics';
        title.className = 'stats-title';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'stats-close-button';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.onclick = closeStatsPage;
        closeButton.title = 'Close Stats';
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Game Summary
        const gameSummary = document.createElement('div');
        gameSummary.className = 'stats-section game-summary';
        
        const summaryTitle = document.createElement('h2');
        summaryTitle.textContent = 'Game Summary';
        summaryTitle.className = 'stats-section-title';
        
        const summaryContent = document.createElement('div');
        summaryContent.className = 'summary-stats';
        
        const state = window.stateCore.getGameState();
        const gameLength = state.gameLength || 10;
        const currentRound = state.round || 1;
        const currentPhase = state.phase || 'Unknown';
        
        summaryContent.innerHTML = `
            <div class="summary-item">
                <div class="summary-label">Total Game Time</div>
                <div class="summary-value">${formatTime(totalGameTime)}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Current Round</div>
                <div class="summary-value">${currentRound}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Current Phase</div>
                <div class="summary-value">${currentPhase}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Victory Target</div>
                <div class="summary-value">${gameLength} Points</div>
            </div>
        `;
        
        gameSummary.appendChild(summaryTitle);
        gameSummary.appendChild(summaryContent);
        
        // Player Statistics
        const playerSection = document.createElement('div');
        playerSection.className = 'stats-section player-stats';
        
        const playerTitle = document.createElement('h2');
        playerTitle.textContent = 'Player Statistics';
        playerTitle.className = 'stats-section-title';
        
        // Create table structure
        const tableContainer = document.createElement('div');
        tableContainer.className = 'player-stats-table-container';
        
        const table = document.createElement('table');
        table.className = 'player-stats-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th class="rank-header">#</th>
            <th class="stats-player-header">Player</th>
            <th class="faction-header">Faction</th>
            <th class="score-header">Score</th>
            <th class="time-header">Total Time</th>
            <th class="objectives-header">Objectives</th>
            <th class="secrets-header">Secrets</th>
            <th class="support-header">Support</th>
            <th class="other-header">Other VPs</th>
            <th class="custodians-header">Custodians</th>
        `;
        thead.appendChild(headerRow);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        playerStats.forEach((player, index) => {
            const row = document.createElement('tr');
            row.className = 'player-row';
            if (index === 0 && gameEnded) {
                row.classList.add('winner-row');
            }
            
            // Rank
            const rankCell = document.createElement('td');
            rankCell.className = 'rank-cell';
            rankCell.innerHTML = index === 0 && gameEnded ? '👑' : (index + 1).toString();
            
            // Player name
            const playerCell = document.createElement('td');
            playerCell.className = 'player-cell';
            const playerName = document.createElement('div');
            playerName.className = 'player-name-table';
            
            // Add faction icon if available
            if (player.faction) {
                const state = window.stateCore.getGameState();
                const factionDetails = state.factions.find(f => f.name.replace(/^The /, '') === player.faction);
                if (factionDetails && factionDetails.id) {
                    const factionIcon = document.createElement('img');
                    factionIcon.src = `images/factions/${factionDetails.id}.webp`;
                    factionIcon.alt = player.faction;
                    factionIcon.className = 'player-faction-icon-table';
                    playerName.appendChild(factionIcon);
                }
            }
            
            // Add player name text
            const nameText = document.createElement('span');
            nameText.textContent = player.name;
            if (player.color) {
                nameText.style.color = player.color;
            }
            playerName.appendChild(nameText);
            
            playerCell.appendChild(playerName);
            
            // Faction
            const factionCell = document.createElement('td');
            factionCell.className = 'faction-cell';
            factionCell.textContent = player.faction || 'No Faction';
            
            // Score
            const scoreCell = document.createElement('td');
            scoreCell.className = 'score-cell';
            const scoreValue = document.createElement('div');
            scoreValue.className = 'score-value-table';
            scoreValue.innerHTML = `<span class="score-number-table">${player.score}</span><span class="score-label-table">pts</span>`;
            scoreCell.appendChild(scoreValue);
            
            // Total Time
            const timeCell = document.createElement('td');
            timeCell.className = 'time-cell';
            timeCell.textContent = formatTime(player.totalTime);
            
            // Objective Points
            const objectivesCell = document.createElement('td');
            objectivesCell.className = 'objectives-cell';
            objectivesCell.textContent = player.objectivePoints;
            
            // Secrets
            const secretsCell = document.createElement('td');
            secretsCell.className = 'secrets-cell';
            secretsCell.textContent = player.secretObjectives;
            
            // Support
            const supportCell = document.createElement('td');
            supportCell.className = 'support-cell';
            supportCell.textContent = player.supportForThrone;
            
            // Other VPs
            const otherCell = document.createElement('td');
            otherCell.className = 'other-cell';
            otherCell.textContent = player.otherVPs;
            
            // Custodians
            const custodiansCell = document.createElement('td');
            custodiansCell.className = 'custodians-cell';
            if (player.custodians) {
                const indicator = document.createElement('div');
                indicator.className = 'custodians-indicator-table';
                indicator.innerHTML = '<i class="fas fa-medal"></i>';
                custodiansCell.appendChild(indicator);
            } else {
                custodiansCell.innerHTML = '<span class="no-custodians">—</span>';
            }
            
            // Append all cells to row
            row.appendChild(rankCell);
            row.appendChild(playerCell);
            row.appendChild(factionCell);
            row.appendChild(scoreCell);
            row.appendChild(timeCell);
            row.appendChild(objectivesCell);
            row.appendChild(secretsCell);
            row.appendChild(supportCell);
            row.appendChild(otherCell);
            row.appendChild(custodiansCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);
        
        playerSection.appendChild(playerTitle);
        playerSection.appendChild(tableContainer);
        
        // Action buttons
        const actionSection = document.createElement('div');
        actionSection.className = 'stats-actions';
        
        const continueButton = document.createElement('button');
        continueButton.className = 'btn btn-primary stats-button';
        continueButton.textContent = gameEnded ? 'New Game' : 'Continue Game';
        continueButton.onclick = () => {
            if (gameEnded) {
                // Start new game
                if (confirm('Start a new game? This will reset all progress.')) {
                    window.resetGame(false);
                    closeStatsPage();
                }
            } else {
                // Just close stats
                closeStatsPage();
            }
        };
        
        actionSection.appendChild(continueButton);
        
        // Export button (for future feature)
        const exportButton = document.createElement('button');
        exportButton.className = 'btn btn-secondary stats-button';
        exportButton.innerHTML = '<i class="fas fa-download"></i> Export Stats';
        exportButton.onclick = exportStats;
        exportButton.title = 'Export game statistics';
        
        actionSection.appendChild(exportButton);
        
        // Assemble the page
        statsPage.appendChild(header);
        statsPage.appendChild(gameSummary);
        statsPage.appendChild(playerSection);
        statsPage.appendChild(actionSection);
        
        overlay.appendChild(statsPage);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeStatsPage();
            }
        });
        
        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeStatsPage();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    // Close the stats page
    function closeStatsPage() {
        const overlay = document.getElementById('stats-page-overlay');
        if (overlay) {
            overlay.remove();
        }
        isStatsPageOpen = false;
    }

    // Export stats (placeholder for future enhancement)
    function exportStats() {
        const playerStats = getPlayerStats();
        const totalGameTime = getTotalGameTime();
        const state = window.stateCore.getGameState();
        
        const statsData = {
            gameInfo: {
                totalTime: formatTime(totalGameTime),
                round: state.round || 1,
                phase: state.phase || 'Unknown',
                gameLength: state.gameLength || 10,
                exportedAt: new Date().toISOString()
            },
            players: playerStats.map(player => ({
                name: player.name,
                faction: player.faction,
                score: player.score,
                totalTime: formatTime(player.totalTime),
                secretObjectives: player.secretObjectives,
                supportForThrone: player.supportForThrone,
                otherVPs: player.otherVPs,
                custodians: player.custodians
            }))
        };
        
        const blob = new Blob([JSON.stringify(statsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ti4-stats-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Update stats button in menu
    function updateStatsButton() {
        const statsButton = document.getElementById('menu-stats-button');
        if (statsButton) {
            const buttonText = statsButton.querySelector('.stats-button-text');
            if (buttonText) {
                buttonText.textContent = getStatsButtonText();
            }
        }
    }

    // Initialize stats button in menu
    function initializeStatsButton() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeStatsButton);
            return;
        }

        // Find the menu dropdown and add stats button if it doesn't exist
        const menuDropdown = document.getElementById('menu-dropdown');
        if (menuDropdown && !document.getElementById('menu-stats-button')) {
            const statsButton = document.createElement('button');
            statsButton.className = 'menu-item';
            statsButton.id = 'menu-stats-button';
            statsButton.title = 'View Game Statistics';
            statsButton.innerHTML = `
                <i class="fas fa-chart-bar"></i> 
                <span class="stats-button-text">${getStatsButtonText()}</span>
            `;
            
            statsButton.addEventListener('click', () => {
                showStatsPage();
                // Close the menu after clicking
                menuDropdown.classList.remove('open');
            });
            
            // Insert before the last menu item (timer toggle)
            const timerButton = document.getElementById('menu-timer-toggle-button');
            if (timerButton) {
                menuDropdown.insertBefore(statsButton, timerButton);
            } else {
                menuDropdown.appendChild(statsButton);
            }
        }
        
        // Update button text
        updateStatsButton();
    }

    // Listen for game state changes to update button text
    function handleGameStateChange() {
        updateStatsButton();
    }

    // Expose public functions
    window.statsPage = {
        showStatsPage,
        closeStatsPage,
        updateStatsButton,
        getStatsButtonText,
        hasGameEnded
    };

    // Initialize when the module loads
    initializeStatsButton();
    
    // Update stats button when UI updates
    if (window.addEventListener) {
        window.addEventListener('gameStateUpdated', handleGameStateChange);
    }

    // Also listen for score changes
    const originalUpdateScore = window.updateScore;
    if (originalUpdateScore) {
        window.updateScore = function(...args) {
            const result = originalUpdateScore.apply(this, args);
            updateStatsButton();
            return result;
        };
    }

})();
