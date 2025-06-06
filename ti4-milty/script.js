// Variables will be defined in tiles-reference.js and available globally

// Initialize the app once the reference tile data is loaded
initializeApp();

// Main app initialization function
function initializeApp() {
    console.log('App initializing with reference tile data:', referenceTileData);
    const defaultSlices = [
        { id: 1, tiles: [22, 80, 69, 64, 49] },
        { id: 2, tiles: [34, 21, 4266, 42, 39] },
        { id: 3, tiles: [67, 4258, 33, 24, 44] },
        { id: 4, tiles: [4263, 68, 78, 74, 63] },
        { id: 5, tiles: [4268, 31, 4271, 19, 79] },
        { id: 6, tiles: [4275, 26, 29, 61, 43] },
        { id: 7, tiles: [60, 4261, 4257, 50, 40] },
        { id: 8, tiles: [20, 32, 45, 72, 4270] },
        { id: 9, tiles: [62, 77, 4276, 4262, 4253] },
        { id: 10, tiles: [46, 59, 76, 70, 4274] }
    ];

    const tileIdToImageMap = {}; // Appears unused, kept for potential future use or compatibility

    const slicesContainer = document.getElementById('slices-container');
    const customSlicesInput = document.getElementById('custom-slices-input');
    const loadCustomSlicesBtn = document.getElementById('load-custom-slices-btn');

    // Function to calculate slice statistics based on tile IDs (assumes calculateTileTotals is global)
    function calculateSliceStats(tileIds) {
        const stats = {
            totalResources: 0,
            totalInfluence: 0,
            optimalResources: 0,
            optimalInfluence: 0,
            techSpecialties: [],
            wormholes: []
        };
        const resourceValues = [];
        const influenceValues = [];
        tileIds.forEach(tileId => {
            const tileInfo = calculateTileTotals(tileId.toString());
            if (tileInfo) {
                stats.totalResources += tileInfo.resources || 0;
                stats.totalInfluence += tileInfo.influence || 0;
                resourceValues.push(tileInfo.resources || 0);
                influenceValues.push(tileInfo.influence || 0);
                if (tileInfo.specialty) stats.techSpecialties.push(tileInfo.specialty);
                if (tileInfo.wormhole) stats.wormholes.push(tileInfo.wormhole);
            }
        });
        resourceValues.sort((a, b) => b - a);
        for (let i = 0; i < Math.min(4, resourceValues.length); i++) stats.optimalResources += resourceValues[i];
        influenceValues.sort((a, b) => b - a);
        for (let i = 0; i < Math.min(4, influenceValues.length); i++) stats.optimalInfluence += influenceValues[i];
        return stats;
    }

    // Function to create a tile element (assumes calculateTileTotals, techSpecialtyIcons, wormholeIcons are global)
    function createTileElement(tileId, position) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        const img = document.createElement('img');
        img.src = `img/tiles/ST_${tileId}.png`;
        img.alt = `Tile ${tileId}`;
        img.onerror = function() {
            this.onerror = null;
            if (tileId >= 1000) {
                this.src = `img/tiles/${tileId}.png`;
                this.onerror = function() { this.onerror = null; showPlaceholder(); };
            } else {
                showPlaceholder();
            }
        };
        function showPlaceholder() {
            img.style.display = 'none';
            tile.style.backgroundColor = `hsl(${tileId % 360}, 70%, 30%)`;
            tile.style.color = 'white';
            tile.style.fontSize = '24px';
            tile.style.display = 'flex';
            tile.style.alignItems = 'center';
            tile.style.justifyContent = 'center';
            tile.textContent = tileId;
        }
        tile.appendChild(img);
        const tileIdLabel = document.createElement('div');
        tileIdLabel.className = 'tile-id';
        tileIdLabel.textContent = tileId;
        tile.appendChild(tileIdLabel);
        const positionLabel = document.createElement('div');
        positionLabel.className = 'position-label';
        positionLabel.textContent = position;
        tile.appendChild(positionLabel);
        const tileInfo = calculateTileTotals(tileId.toString());
        if (tileInfo) {
            const tileStats = document.createElement('div');
            tileStats.className = 'tile-stats';
            const statsText = document.createElement('div');
            statsText.className = 'tile-stats-text';
            if (tileInfo.type === 'red') {
                if (tileInfo.anomaly) {
                    statsText.textContent = tileInfo.anomaly;
                    statsText.title = `Anomaly: ${tileInfo.anomaly}`;
                    statsText.classList.add('anomaly-text');
                } else if (tileInfo.wormhole) {
                    const wormholeType = tileInfo.wormhole === 'alpha' ? 'α' : 'β';
                    statsText.textContent = wormholeType;
                    statsText.title = `${tileInfo.wormhole.charAt(0).toUpperCase() + tileInfo.wormhole.slice(1)} Wormhole`;
                    statsText.classList.add('wormhole-text');
                } else {
                    statsText.textContent = 'Empty';
                    statsText.title = 'Empty space';
                    statsText.classList.add('empty-text');
                }
            } else if (tileInfo.resources > 0 || tileInfo.influence > 0) {
                const resourceValue = tileInfo.resources || 0;
                const influenceValue = tileInfo.influence || 0;
                const resourceSpan = document.createElement('span');
                resourceSpan.className = 'tile-resource';
                resourceSpan.textContent = resourceValue;
                const separator = document.createElement('span');
                separator.textContent = '/';
                separator.className = 'tile-stat-separator';
                const influenceSpan = document.createElement('span');
                influenceSpan.className = 'tile-influence';
                influenceSpan.textContent = influenceValue;
                statsText.appendChild(resourceSpan);
                statsText.appendChild(separator);
                statsText.appendChild(influenceSpan);
                statsText.title = `Resources: ${resourceValue}, Influence: ${influenceValue}`;
            } else {
                statsText.textContent = '0/0';
                statsText.title = 'No resources or influence';
            }
            tileStats.appendChild(statsText);
            if (tileInfo.specialty) {
                const techIcon = document.createElement('div');
                techIcon.className = 'tile-tech-icon';
                const techImg = document.createElement('img');
                techImg.src = techSpecialtyIcons[tileInfo.specialty];
                techImg.alt = tileInfo.specialty;
                techImg.title = tileInfo.specialty;
                techIcon.appendChild(techImg);
                tileStats.appendChild(techIcon);
            }
            if (tileInfo.wormhole && !(tileInfo.type === 'red' && !tileInfo.anomaly && tileInfo.wormhole)) {
                const wormholeIcon = document.createElement('div');
                wormholeIcon.className = 'wormhole-icon';
                wormholeIcon.textContent = wormholeIcons[tileInfo.wormhole] || '?';
                wormholeIcon.title = `${tileInfo.wormhole.charAt(0).toUpperCase() + tileInfo.wormhole.slice(1)} Wormhole`;
                tileStats.appendChild(wormholeIcon);
            }
            tile.appendChild(tileStats);
        }
        return tile;
    }

    // Function to render a single slice
    function renderSlice(slice, targetContainer) {
        const sliceElement = document.createElement('div');
        sliceElement.className = 'slice-container';
        const sliceHeader = document.createElement('div');
        sliceHeader.className = 'slice-header';
        const sliceTitle = document.createElement('h2');
        sliceTitle.className = 'slice-title';
        sliceTitle.textContent = (typeof slice.id === 'number' ? `Slice ${slice.id}` : slice.id);
        sliceHeader.appendChild(sliceTitle);
        const stats = calculateSliceStats(slice.tiles);
        const statsContainer = document.createElement('div');
        statsContainer.className = 'slice-stats';
        const statsSummaryContainer = document.createElement('div');
        statsSummaryContainer.className = 'stats-summary-container';
        const totalLabel = document.createElement('div');
        totalLabel.className = 'stats-label';
        totalLabel.textContent = 'Total:';
        statsSummaryContainer.appendChild(totalLabel);
        const resourcesDiv = document.createElement('div');
        resourcesDiv.className = 'stat-item resources';
        resourcesDiv.innerHTML = `<span class="resource-icon"></span>${stats.totalResources}`;
        resourcesDiv.title = `Total Resources: ${stats.totalResources}`;
        statsSummaryContainer.appendChild(resourcesDiv);
        const influenceDiv = document.createElement('div');
        influenceDiv.className = 'stat-item influence';
        influenceDiv.innerHTML = `<span class="influence-icon"></span>${stats.totalInfluence}`;
        influenceDiv.title = `Total Influence: ${stats.totalInfluence}`;
        statsSummaryContainer.appendChild(influenceDiv);
        statsContainer.appendChild(statsSummaryContainer);
        const optimalStatsContainer = document.createElement('div');
        optimalStatsContainer.className = 'stats-summary-container';
        const optimalLabel = document.createElement('div');
        optimalLabel.className = 'stats-label';
        optimalLabel.textContent = 'Optimal:';
        optimalStatsContainer.appendChild(optimalLabel);
        const optResourcesDiv = document.createElement('div');
        optResourcesDiv.className = 'stat-item resources';
        optResourcesDiv.innerHTML = `<span class="resource-icon"></span>${stats.optimalResources}`;
        optResourcesDiv.title = `Optimal Resources: ${stats.optimalResources}`;
        optimalStatsContainer.appendChild(optResourcesDiv);
        const optInfluenceDiv = document.createElement('div');
        optInfluenceDiv.className = 'stat-item influence';
        optInfluenceDiv.innerHTML = `<span class="influence-icon"></span>${stats.optimalInfluence}`;
        optInfluenceDiv.title = `Optimal Influence: ${stats.optimalInfluence}`;
        optimalStatsContainer.appendChild(optInfluenceDiv);
        statsContainer.appendChild(optimalStatsContainer);
        if (stats.techSpecialties.length > 0) {
            const techDiv = document.createElement('div');
            techDiv.className = 'stat-item tech-specialties';
            const techCounts = {};
            stats.techSpecialties.forEach(tech => { techCounts[tech] = (techCounts[tech] || 0) + 1; });
            for (const tech in techCounts) {
                const techIcon = document.createElement('div');
                techIcon.className = 'tech-icon';
                const techImg = document.createElement('img');
                techImg.src = techSpecialtyIcons[tech];
                techImg.alt = tech;
                techImg.title = `${tech} (${techCounts[tech]})`;
                techIcon.appendChild(techImg);
                techDiv.appendChild(techIcon);
            }
            statsContainer.appendChild(techDiv);
        }
        if (stats.wormholes.length > 0) {
            const wormholeDiv = document.createElement('div');
            wormholeDiv.className = 'stat-item wormholes';
            const wormholeCounts = {};
            stats.wormholes.forEach(wormhole => { wormholeCounts[wormhole] = (wormholeCounts[wormhole] || 0) + 1; });
            for (const wormhole in wormholeCounts) {
                const wormholeIcon = document.createElement('span');
                wormholeIcon.className = 'wormhole-icon';
                wormholeIcon.textContent = wormholeIcons[wormhole] || '';
                wormholeIcon.title = `${wormhole} wormhole (${wormholeCounts[wormhole]})`;
                wormholeDiv.appendChild(wormholeIcon);
            }
            statsContainer.appendChild(wormholeDiv);
        }
        sliceHeader.appendChild(statsContainer);
        sliceElement.appendChild(sliceHeader);
        const tilesRow = document.createElement('div');
        tilesRow.className = 'tiles-row';
        slice.tiles.forEach((tileId, index) => {
            const position = index + 1;
            const tileElement = createTileElement(tileId, position);
            tilesRow.appendChild(tileElement);
        });
        sliceElement.appendChild(tilesRow);
        targetContainer.appendChild(sliceElement);
    }

    // Function to load and render custom slices
    function loadAndRenderCustomSlices() {
        const inputText = customSlicesInput.value.trim();
        slicesContainer.innerHTML = ''; // Clear existing slices

        if (!inputText) {
            defaultSlices.forEach(slice => renderSlice(slice, slicesContainer));
            alert("Input is empty. Displaying default slices.");
            return;
        }

        const lines = inputText.split('\n');
        const customSlices = [];
        let parseErrorEncountered = false;

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return;

            const tileIdStrings = trimmedLine.split(',');
            let lineHasError = false;
            const tileIds = tileIdStrings.map(idStr => {
                const num = parseInt(idStr.trim(), 10);
                if (isNaN(num)) {
                    lineHasError = true;
                }
                return num;
            });

            if (lineHasError) {
                parseErrorEncountered = true;
                return; // Skip this line if it has a non-numeric ID
            }
            
            // Further check if any ID in the array is NaN (might be redundant but safe)
            if (tileIds.some(isNaN)) {
                parseErrorEncountered = true;
                return; // Skip this slice if any ID is NaN
            }

            if (tileIds.length > 0) {
                customSlices.push({
                    id: `Custom ${customSlices.length + 1}`,
                    tiles: tileIds
                });
            }
        });

        if (parseErrorEncountered) {
            slicesContainer.innerHTML = ''; // Clear again in case some valid lines were processed before error
            defaultSlices.forEach(slice => renderSlice(slice, slicesContainer));
            alert("Error parsing one or more tile IDs. Please ensure all tile IDs are numbers, separated by commas, with each slice on a new line. Displaying default slices.");
            return;
        }

        if (customSlices.length > 0) {
            customSlices.forEach(slice => renderSlice(slice, slicesContainer));
        } else {
            // This case handles if input was non-empty but yielded no valid slices (e.g. all lines empty or just commas)
            defaultSlices.forEach(slice => renderSlice(slice, slicesContainer));
            if (inputText) { // Only alert if there was some input
                alert("No valid custom slices found in the input. Displaying default slices.");
            }
        }
    }

    // Add event listener for the button
    if (loadCustomSlicesBtn) {
        loadCustomSlicesBtn.addEventListener('click', loadAndRenderCustomSlices);
    } else {
        console.error("Button with ID 'load-custom-slices-btn' not found.");
    }

    // Initial rendering of default slices
    defaultSlices.forEach(slice => renderSlice(slice, slicesContainer));
}
