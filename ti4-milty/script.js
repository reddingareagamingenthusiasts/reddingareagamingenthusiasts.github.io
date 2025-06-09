// Variables will be defined in tiles-reference.js and available globally

// State management for slices
let sliceStates = {}; // Track which slices are taken
let currentSlices = []; // Track current loaded slices

// Global reference to the loadAndRenderCustomSlices function
let loadAndRenderCustomSlices;

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
        
        tileIds.forEach(tileId => {
            const tileInfo = calculateTileTotals(tileId.toString());
            if (tileInfo) {
                stats.totalResources += tileInfo.resources || 0;
                stats.totalInfluence += tileInfo.influence || 0;
                if (tileInfo.specialty) stats.techSpecialties.push(tileInfo.specialty);
                if (tileInfo.wormhole) stats.wormholes.push(tileInfo.wormhole);
                
                // Calculate optimal values at planet level (like the original project)
                if (referenceTileData && referenceTileData[tileId.toString()]) {
                    const tile = referenceTileData[tileId.toString()];
                    if (tile.planets) {
                        tile.planets.forEach(planet => {
                            const planetResources = planet.resources || 0;
                            const planetInfluence = planet.influence || 0;
                            
                            // Apply optimal calculation logic from original project
                            if (planetInfluence > planetResources) {
                                stats.optimalInfluence += planetInfluence;
                                // stats.optimalResources += 0; (no need to add 0)
                            } else if (planetResources > planetInfluence) {
                                stats.optimalResources += planetResources;
                                // stats.optimalInfluence += 0; (no need to add 0)
                            } else if (planetResources === planetInfluence) {
                                // If equal, take half of each
                                stats.optimalResources += planetResources / 2;
                                stats.optimalInfluence += planetInfluence / 2;
                            }
                        });
                    }
                }
            }
        });
        
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
        
        // Add magnifier functionality
        addTileMagnifier(tile, tileId, tileInfo);
        
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

        addTakeSliceButton(sliceElement, slice.id);
    }

    // Function to load and render custom slices
    loadAndRenderCustomSlices = function() {
        const inputText = customSlicesInput.value.trim();
        slicesContainer.innerHTML = ''; // Clear existing slices

        if (!inputText) {
            currentSlices = [...defaultSlices]; // Update currentSlices
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
                    id: `Slice ${customSlices.length + 1}`,
                    tiles: tileIds
                });
            }
        });

        if (parseErrorEncountered) {
            slicesContainer.innerHTML = ''; // Clear again in case some valid lines were processed before error
            currentSlices = [...defaultSlices]; // Update currentSlices
            defaultSlices.forEach(slice => renderSlice(slice, slicesContainer));
            alert("Error parsing one or more tile IDs. Please ensure all tile IDs are numbers, separated by commas, with each slice on a new line. Displaying default slices.");
            return;
        }

        if (customSlices.length > 0) {
            currentSlices = [...customSlices]; // Update currentSlices
            customSlices.forEach(slice => renderSlice(slice, slicesContainer));
        } else {
            // This case handles if input was non-empty but yielded no valid slices (e.g. all lines empty or just commas)
            currentSlices = [...defaultSlices]; // Update currentSlices
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
    currentSlices = [...defaultSlices];
    defaultSlices.forEach(slice => renderSlice(slice, slicesContainer));
}

// Initialize menu controls and sharing functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeMenuControls();
    initializeSharing();
    loadStateFromURL();
});

function initializeMenuControls() {
    // Toggle menu visibility
    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('mainMenu');
    
    if (menuToggle && mainMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mainMenu.classList.toggle('show');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainMenu.contains(e.target) && e.target !== menuToggle) {
                mainMenu.classList.remove('show');
            }
        });
    }
}

function initializeSharing() {
    const shareButton = document.getElementById('shareSlicesButton');
    const resetButton = document.getElementById('resetAllSlicesButton');
    
    if (shareButton) {
        shareButton.addEventListener('click', generateShareableLink);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetAllSlices);
    }
}

function addTakeSliceButton(sliceElement, sliceId) {
    const sliceHeader = sliceElement.querySelector('.slice-header');
    const takeButton = document.createElement('button');
    takeButton.className = 'take-slice-btn';
    takeButton.textContent = sliceStates[sliceId] ? 'Mark Available' : 'Mark Taken';
    takeButton.dataset.sliceId = sliceId;
    
    takeButton.addEventListener('click', () => {
        toggleSliceState(sliceId);
        updateSliceDisplay(sliceElement, sliceId);
        updateTakeButton(takeButton, sliceId);
    });
    
    sliceHeader.appendChild(takeButton);
    return takeButton;
}

function toggleSliceState(sliceId) {
    sliceStates[sliceId] = !sliceStates[sliceId];
}

function updateSliceDisplay(sliceElement, sliceId) {
    if (sliceStates[sliceId]) {
        sliceElement.classList.add('taken');
    } else {
        sliceElement.classList.remove('taken');
    }
}

function updateTakeButton(button, sliceId) {
    if (sliceStates[sliceId]) {
        button.textContent = 'Mark Available';
        button.classList.add('taken');
    } else {
        button.textContent = 'Mark Taken';
        button.classList.remove('taken');
    }
}

function resetAllSlices() {
    sliceStates = {};
    const sliceElements = document.querySelectorAll('.slice-container');
    sliceElements.forEach(element => {
        element.classList.remove('taken');
        const takeButton = element.querySelector('.take-slice-btn');
        if (takeButton) {
            const sliceId = takeButton.dataset.sliceId;
            updateTakeButton(takeButton, sliceId);
        }
    });
    console.log('All slices reset to available');
}

function generateShareableLink() {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    // Encode slice data
    if (currentSlices.length > 0) {
        const sliceData = currentSlices.map(slice => slice.tiles.join(',')).join('|');
        params.set('slices', sliceData);
    }
    
    // Encode taken states
    const takenSlices = Object.keys(sliceStates).filter(id => sliceStates[id]);
    if (takenSlices.length > 0) {
        params.set('taken', takenSlices.join(','));
    }
    
    const shareUrl = `${baseUrl}?${params.toString()}`;
    showShareModal(shareUrl);
}

function showShareModal(link) {
    let modal = document.getElementById('shareModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        const closeButton = document.createElement('span');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '&times;';
        closeButton.onclick = () => modal.style.display = 'none';
        
        const title = document.createElement('h2');
        title.textContent = 'Shareable Link';
        
        const description = document.createElement('p');
        description.textContent = 'Share this link to let others view the current slices and their taken/available states:';
        description.style.marginBottom = '15px';
        
        const linkContainer = document.createElement('div');
        linkContainer.className = 'shareable-link-container';
        
        const linkInput = document.createElement('input');
        linkInput.type = 'text';
        linkInput.id = 'shareableLinkInput';
        linkInput.readOnly = true;
        linkInput.value = link;
        
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.onclick = () => {
            linkInput.select();
            navigator.clipboard.writeText(linkInput.value).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            }).catch(() => {
                // Fallback for older browsers
                document.execCommand('copy');
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            });
        };
        
        linkContainer.appendChild(linkInput);
        linkContainer.appendChild(copyButton);
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(title);
        modalContent.appendChild(description);
        modalContent.appendChild(linkContainer);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
    } else {
        // Update link if modal already exists
        document.getElementById('shareableLinkInput').value = link;
    }
    
    // Show the modal
    modal.style.display = 'block';
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function loadStateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load slice data from URL
    const slicesParam = urlParams.get('slices');
    if (slicesParam) {
        const sliceLines = slicesParam.split('|');
        const customSlicesInput = document.getElementById('custom-slices-input');
        if (customSlicesInput) {
            customSlicesInput.value = sliceLines.join('\n');
            // Trigger loading after a short delay to ensure DOM is ready
            setTimeout(() => {
                loadAndRenderCustomSlices();
                
                // Load taken states after slices are rendered
                const takenParam = urlParams.get('taken');
                if (takenParam) {
                    const takenIds = takenParam.split(',');
                    takenIds.forEach(id => {
                        sliceStates[id] = true;
                    });
                    
                    // Apply taken states to rendered slices
                    setTimeout(() => {
                        applyTakenStates();
                    }, 100);
                }
            }, 100);
        }
    } else {
        // Load taken states for default slices
        const takenParam = urlParams.get('taken');
        if (takenParam) {
            const takenIds = takenParam.split(',');
            takenIds.forEach(id => {
                sliceStates[id] = true;
            });
            
            // Apply taken states after default slices are rendered
            setTimeout(() => {
                applyTakenStates();
            }, 100);
        }
    }
}

function applyTakenStates() {
    const sliceElements = document.querySelectorAll('.slice-container');
    sliceElements.forEach(element => {
        const takeButton = element.querySelector('.take-slice-btn');
        if (takeButton) {
            const sliceId = takeButton.dataset.sliceId;
            if (sliceStates[sliceId]) {
                updateSliceDisplay(element, sliceId);
                updateTakeButton(takeButton, sliceId);
            }
        }
    });
}

// Tile magnifier functionality
function addTileMagnifier(tileElement, tileId, tileInfo) {
    const img = tileElement.querySelector('img');
    if (!img) return;

    tileElement.addEventListener('mouseenter', (e) => {
        showTileMagnifier(e, tileId, tileInfo, img.src);
    });

    tileElement.addEventListener('mousemove', (e) => {
        updateMagnifierPosition(e);
    });

    tileElement.addEventListener('mouseleave', () => {
        hideTileMagnifier();
    });
}

function showTileMagnifier(event, tileId, tileInfo, imageSrc) {
    // Remove any existing magnifier
    hideTileMagnifier();

    const magnifier = document.createElement('div');
    magnifier.id = 'tileMagnifier';
    magnifier.className = 'tile-magnifier';

    // Create magnified image
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = `Tile ${tileId}`;
    magnifier.appendChild(img);

    // Add tile ID
    const tileIdLabel = document.createElement('div');
    tileIdLabel.className = 'magnifier-tile-id';
    tileIdLabel.textContent = tileId;
    magnifier.appendChild(tileIdLabel);

    // Add stats if available
    if (tileInfo) {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'magnifier-stats';

        const statsText = document.createElement('div');
        statsText.className = 'magnifier-stats-text';

        if (tileInfo.type === 'red') {
            if (tileInfo.anomaly) {
                statsText.textContent = tileInfo.anomaly;
                statsText.classList.add('anomaly-text');
            } else if (tileInfo.wormhole) {
                const wormholeType = tileInfo.wormhole === 'alpha' ? 'α' : 'β';
                statsText.textContent = wormholeType;
                statsText.classList.add('wormhole-text');
            } else {
                statsText.textContent = 'Empty';
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
        } else {
            statsText.textContent = '0/0';
        }

        statsContainer.appendChild(statsText);

        // Add tech specialty icon if available
        if (tileInfo.specialty) {
            const techIcon = document.createElement('div');
            techIcon.className = 'magnifier-tech-icon';
            const techImg = document.createElement('img');
            techImg.src = techSpecialtyIcons[tileInfo.specialty];
            techImg.alt = tileInfo.specialty;
            techImg.title = tileInfo.specialty;
            techIcon.appendChild(techImg);
            statsContainer.appendChild(techIcon);
        }

        // Add wormhole icon if available (for non-red tiles or red tiles with anomalies)
        if (tileInfo.wormhole && !(tileInfo.type === 'red' && !tileInfo.anomaly)) {
            const wormholeIcon = document.createElement('div');
            wormholeIcon.className = 'magnifier-wormhole-icon';
            wormholeIcon.textContent = wormholeIcons[tileInfo.wormhole] || '?';
            wormholeIcon.title = `${tileInfo.wormhole.charAt(0).toUpperCase() + tileInfo.wormhole.slice(1)} Wormhole`;
            statsContainer.appendChild(wormholeIcon);
        }

        magnifier.appendChild(statsContainer);
    }

    document.body.appendChild(magnifier);
    magnifier.style.display = 'block';
    
    // Position the magnifier
    updateMagnifierPosition(event);
}

function updateMagnifierPosition(event) {
    const magnifier = document.getElementById('tileMagnifier');
    if (!magnifier) return;

    const offset = 20;
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const magnifierWidth = 300;
    const magnifierHeight = 300;

    let left = mouseX + offset;
    let top = mouseY + offset;

    // Adjust position if magnifier would go off screen
    if (left + magnifierWidth > windowWidth) {
        left = mouseX - magnifierWidth - offset;
    }
    if (top + magnifierHeight > windowHeight) {
        top = mouseY - magnifierHeight - offset;
    }

    // Ensure magnifier stays within viewport
    left = Math.max(10, Math.min(left, windowWidth - magnifierWidth - 10));
    top = Math.max(10, Math.min(top, windowHeight - magnifierHeight - 10));

    magnifier.style.left = left + 'px';
    magnifier.style.top = top + 'px';
}

function hideTileMagnifier() {
    const existing = document.getElementById('tileMagnifier');
    if (existing) {
        existing.remove();
    }
}
