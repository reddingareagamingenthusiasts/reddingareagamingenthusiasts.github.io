// Hex grid management
class TI4Map {    constructor() {
        this.selectedHex = null;
        this.currentTiles = {}; // Store tile assignments
        this.alternateTileId = null; // Store alternate tile ID
        this.valueHeatmapActive = false; // Track if value heatmap is active        // Define faction tile coordinates for 9-player map
        // These are the actual player home system positions where faction tiles should be placed
        this.factionTileCoordinates = new Set([
            '0,5',    // Player 1
            '3,2',    // Player 2  
            '5,-1',   // Player 3
            '5,-4',   // Player 4
            '3,-5',   // Player 5
            '-3,-2',  // Player 6
            '-5,1',   // Player 7
            '-5,4',   // Player 8
            '-3,5'    // Player 9
        ]);
        
        this.initializeEventListeners();
        this.initializeTileModal();
        this.initializeAlternateTileToggle();
        this.initializeCenterHex();
        this.initializeValueHeatmapToggle();
        this.initializeTileArtToggle();
    }// Initialize the center hex (Mecatol Rex) with proper tile info
    initializeCenterHex() {
        const centerHex = document.querySelector('.hex-center[data-position="0,0"]');
        if (centerHex) {
            // Ensure it has the proper data-tile-id
            centerHex.setAttribute('data-tile-id', '18');
            // Store in currentTiles
            this.currentTiles['0,0'] = '18';
            
            // Set the background image using the same method as placeTile
            const imagePath = 'img/tiles/ST_18.png';
            centerHex.classList.add('has-tile-image');
            centerHex.style.setProperty('background-image', `url('${imagePath}')`, 'important');
            centerHex.style.setProperty('background-size', 'cover', 'important');
            centerHex.style.setProperty('background-position', 'center', 'important');
            centerHex.style.setProperty('background-repeat', 'no-repeat', 'important');
            
            // Create tile info overlay for Mecatol Rex
            this.createTileInfoOverlay(centerHex, '18');
            console.log('Center hex (Mecatol Rex) initialized with tile 18 and background image');
        }
    }    initializeEventListeners() {
        const hexes = document.querySelectorAll('.hex');
        const coordDisplay = document.getElementById('currentCoord');
        const tileDisplay = document.getElementById('currentTile');
        const hexPreview = document.getElementById('coordHexPreview');
        const detailedInfo = document.getElementById('coordDetailedInfo');
        const resourcesDiv = document.getElementById('coordResources');
        const planetsDiv = document.getElementById('coordPlanets');
        const specialDiv = document.getElementById('coordSpecial');
        
        hexes.forEach(hex => {
            hex.addEventListener('mouseenter', (e) => {
                const position = e.currentTarget.getAttribute('data-position');
                const tileId = e.currentTarget.getAttribute('data-tile-id') || 'Empty';
                
                // Handle alternate tile position display
                let displayPosition = position;
                if (e.currentTarget.id === 'alternateHex') {
                    displayPosition = 'alt';
                }
                
                // Update basic info
                coordDisplay.textContent = `Position: ${displayPosition || 'Unknown'}`;
                tileDisplay.textContent = `Tile ID: ${tileId}`;
                
                // Update hex preview image
                this.updateHexPreview(hex, hexPreview);
                
                // Update detailed information
                this.updateDetailedTileInfo(tileId, resourcesDiv, planetsDiv, specialDiv);
            });
            
            hex.addEventListener('mouseleave', () => {
                coordDisplay.textContent = 'Position: -';
                tileDisplay.textContent = 'Tile ID: -';
                hexPreview.innerHTML = '<div class="coord-placeholder-text">Hover over a tile</div>';
                resourcesDiv.innerHTML = '';
                planetsDiv.innerHTML = '';
                specialDiv.innerHTML = '';
            });
            
            hex.addEventListener('click', (e) => {
                this.selectHex(e.currentTarget);
            });

            // Add right-click context menu to clear tiles
            hex.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const tileId = e.currentTarget.getAttribute('data-tile-id');
                if (tileId) {
                    // If hex has a tile, clear it
                    this.clearTile(e.currentTarget);
                }
            });
        });
    }

    selectHex(hex) {
        // Remove previous selection
        if (this.selectedHex) {
            this.selectedHex.style.boxShadow = '';
        }
        
        // Add selection to new hex
        this.selectedHex = hex;
        hex.style.boxShadow = '0 0 15px #ff9800, inset 0 0 15px rgba(255, 152, 0, 0.3)';
        
        const position = hex.getAttribute('data-position');
        console.log(`Selected hex at position: ${position}`);
        
        // Future: This is where tile placement logic would go
        this.onHexSelected(hex);
    }    onHexSelected(hex) {
        // Check if this is the center hex (Mecatol Rex) and prevent selection
        if (hex.classList.contains('hex-center')) {
            console.log('Cannot select Mecatol Rex hex - it is hardcoded');
            return;
        }
          // Check if this is a hyperlane and prevent selection
        if (hex.classList.contains('hex-hyperlane') || 
            hex.classList.contains('hex-hyperlane-83A') || 
            hex.classList.contains('hex-hyperlane-86A')) {
            console.log('Cannot select hyperlane hex');
            return;
        }
        
        // Get position for faction tile check
        const position = hex.getAttribute('data-position');
        const isFactionTilePosition = this.factionTileCoordinates.has(position);
        
        // Check if this is a player position hex and prevent selection (but allow faction tile positions)
        if (hex.classList.contains('hex-player') && !isFactionTilePosition) {
            console.log('Cannot select player position hex (not a faction tile position)');
            return;
        }
          // Show the tile selection modal when a hex is clicked
        console.log('Hex selected:', position);
        
        // Check if this hex contains player slice numbers (starting positions)
        const hasPlayerSliceNumber = hex.querySelector('span[class*="player"][class*="-number"]');
        
        console.log(`Position ${position} is faction tile position:`, isFactionTilePosition);
        console.log('Faction tile coordinates:', Array.from(this.factionTileCoordinates));
        
        // Open the tile selection modal, passing whether this is a faction tile position
        this.openTileSelectionModal(hex, isFactionTilePosition);
    }// Method to place a tile
    placeTile(hex, tileId) {
        const position = hex.getAttribute('data-position');
        const isFactionTilePosition = this.factionTileCoordinates.has(position);
        const tileData = referenceTiles[tileId];
        const isFactionTile = tileData && tileData.type === 'green' && tileData.faction;
        
        // Prevent placing tiles on special hexes
        if (hex.classList.contains('hex-center')) {
            console.log('Cannot place tile on Mecatol Rex - it is hardcoded to tile 18');
            return;
        }
          if (hex.classList.contains('hex-hyperlane') || 
            hex.classList.contains('hex-hyperlane-83A') || 
            hex.classList.contains('hex-hyperlane-86A') || 
            (hex.classList.contains('hex-player') && !(isFactionTilePosition && isFactionTile))) {
            console.log('Cannot place tile on special hex (hyperlane or player position)');
            return;
        }
        
        if (hex) {
            // Store the tile assignment
            this.currentTiles[position] = tileId;
            
            // Update the hex with the tile ID
            hex.setAttribute('data-tile-id', tileId);
            
            // Get tile data
            const tileData = referenceTiles[tileId];
            const tileSlot = hex.querySelector('.tile-slot');
              // Clear any existing content and reset styling
            tileSlot.innerHTML = '';
            hex.classList.remove('tile-type-green', 'tile-type-blue', 'tile-type-red', 'has-tile-image');
            
            // Set the tile image as background
            const imagePath = `img/tiles/ST_${tileId}.png`;
            
            // Add has-tile-image class immediately to trigger CSS override
            hex.classList.add('has-tile-image');
            
            // Create an image element to test if the image exists
            const testImage = new Image();
            testImage.onload = () => {
                // Check if this is a special hex that should always show tile art
                const isSpecialHex = hex.classList.contains('hex-hyperlane') || 
                                   hex.classList.contains('hex-hyperlane-83A') || 
                                   hex.classList.contains('hex-hyperlane-86A') || 
                                   hex.classList.contains('hex-center') || 
                                   hex.classList.contains('hex-player');
                
                // Check if tile art is enabled
                const tileArtEnabled = isSpecialHex || !document.querySelector('.map-container').classList.contains('hide-tile-art');
                
                if (tileArtEnabled) {
                    // Image exists, set it as background with important styles
                    hex.style.setProperty('background-image', `url('${imagePath}')`, 'important');
                    hex.style.setProperty('background-size', 'cover', 'important');
                    hex.style.setProperty('background-position', 'center', 'important');
                    hex.style.setProperty('background-repeat', 'no-repeat', 'important');
                    console.log(`Successfully loaded tile image: ${imagePath}`);
                } else {
                    // Tile art is disabled, don't show the image but restore the ring color
                    hex.style.setProperty('background-image', 'none', 'important');
                    console.log(`Tile art is disabled, not showing image for tile ${tileId}`);
                    
                    // Restore the appropriate ring color based on the hex class
                    if (hex.classList.contains('hex-inner')) {
                        hex.style.setProperty('background', 'radial-gradient(circle, #44bfff 0%, #0099dd 100%)', 'important');
                        hex.style.setProperty('box-shadow', '0 0 15px rgba(68, 191, 255, 0.4)', 'important');
                    } else if (hex.classList.contains('hex-middle')) {
                        hex.style.setProperty('background', 'radial-gradient(circle, #4488ff 0%, #0044bb 100%)', 'important');
                        hex.style.setProperty('box-shadow', '0 0 15px rgba(68, 136, 255, 0.4)', 'important');
                    } else if (hex.classList.contains('hex-outer')) {
                        hex.style.setProperty('background', 'radial-gradient(circle, #3366bb 0%, #002288 100%)', 'important');
                        hex.style.setProperty('box-shadow', '0 0 15px rgba(51, 102, 187, 0.4)', 'important');
                    } else if (hex.classList.contains('hex-outermost')) {
                        hex.style.setProperty('background', 'radial-gradient(circle, #224488 0%, #001155 100%)', 'important');
                        hex.style.setProperty('box-shadow', '0 0 15px rgba(34, 68, 136, 0.4)', 'important');
                    }
                }
            };
            
            testImage.onerror = () => {
                // Image doesn't exist, fall back to text display
                console.warn(`Tile image not found: ${imagePath}`);
                hex.classList.remove('has-tile-image');
                const tileIdElement = document.createElement('div');
                tileIdElement.className = 'hex-tile-id';
                tileIdElement.textContent = tileId;
                tileSlot.appendChild(tileIdElement);
            };
            
            testImage.src = imagePath;            // Set the tile ID as overlay text (for when image loads)
            const tileIdElement = document.createElement('div');
            tileIdElement.className = 'hex-tile-id-overlay tile-number';
            tileIdElement.textContent = tileId;
            tileSlot.appendChild(tileIdElement);
              // Apply styling based on tile type if available
            if (tileData && tileData.type) {
                const tileTypeClass = `tile-type-${tileData.type.toLowerCase()}`;
                hex.classList.add(tileTypeClass);
            }
            
            // Update tile info overlay
            this.updateTileInfoOverlay(hex, tileId);
            
            console.log(`Placed tile ${tileId} at position ${position}`);
        }
    }    // Method to clear a tile from a hex
    clearTile(hex) {
        const position = hex.getAttribute('data-position');
        
        // Prevent clearing the center hex (Mecatol Rex)
        if (hex.classList.contains('hex-center')) {
            console.log('Cannot clear Mecatol Rex - it is hardcoded to tile 18');
            return;
        }
          // Prevent clearing hyperlanes and player positions
        if (hex.classList.contains('hex-hyperlane') || 
            hex.classList.contains('hex-hyperlane-83A') || 
            hex.classList.contains('hex-hyperlane-86A') || 
            hex.classList.contains('hex-player')) {
            console.log('Cannot clear special hex (hyperlane or player position)');
            return;
        }
        
        if (hex) {
            // Remove the tile assignment
            delete this.currentTiles[position];
            
            // Remove the tile ID attribute
            hex.removeAttribute('data-tile-id');
            
            // Clear the tile slot content
            const tileSlot = hex.querySelector('.tile-slot');
            tileSlot.innerHTML = '';
              // Reset styling
            hex.classList.remove('tile-type-green', 'tile-type-blue', 'tile-type-red', 'has-tile-image');
            hex.style.removeProperty('background-image');
            hex.style.removeProperty('background-size');
            hex.style.removeProperty('background-position');
            hex.style.removeProperty('background-repeat');
            hex.style.transform = ''; // Reset any rotation
              // Restore original content if it had any (like player numbers)
            this.restoreOriginalHexContent(hex);
            
            // Update tile info overlay (remove it)
            this.updateTileInfoOverlay(hex, null);
            
            console.log(`Cleared tile from position ${position}`);
        }
    }

    // Method to rotate a tile (useful for anomalies and certain tiles)
    rotateTile(hex, degrees = 60) {
        if (hex && hex.classList.contains('has-tile-image')) {
            const currentTransform = hex.style.transform || '';
            
            // Extract current rotation if any
            const rotateMatch = currentTransform.match(/rotate\(([^)]+)\)/);
            const currentRotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
            
            // Calculate new rotation
            const newRotation = (currentRotation + degrees) % 360;
            
            // Apply new rotation while preserving other transforms
            const otherTransforms = currentTransform.replace(/rotate\([^)]+\)/, '').trim();
            const newTransform = `${otherTransforms} rotate(${newRotation}deg)`.trim();
            
            hex.style.transform = newTransform;
            
            console.log(`Rotated tile at ${hex.getAttribute('data-position')} to ${newRotation} degrees`);
        }
    }

    // Method to restore original hex content (like player numbers)
    restoreOriginalHexContent(hex) {
        const position = hex.getAttribute('data-position');
        const tileSlot = hex.querySelector('.tile-slot');
          // Check if this hex originally had player numbers or other content
        // This is a simplified version - you might want to store original content when initializing
        if (hex.classList.contains('hex-center')) {
            // Restore Mecatol Rex tile image and styling
            hex.classList.add('has-tile-image');
            hex.style.setProperty('background-image', 'url("img/tiles/ST_18.png")', 'important');
            hex.style.setProperty('background-size', 'cover', 'important');
            hex.style.setProperty('background-position', 'center', 'important');
            hex.style.setProperty('background-repeat', 'no-repeat', 'important');
            hex.setAttribute('data-tile-id', '18');
            tileSlot.innerHTML = '<div class="hex-tile-id-overlay tile-number">18</div>';
        } else if (hex.classList.contains('hex-player')) {
            // Extract player number from position or use a lookup
            const playerNumbers = {
                '0,5': '1',
                '3,2': '2', 
                '5,-1': '3',
                '5,-4': '4',
                '3,-5': '5',
                '-3,-2': '6',
                '-5,1': '7',
                '-5,4': '8',
                '-3,5': '9'
            };
            if (playerNumbers[position]) {
                tileSlot.innerHTML = playerNumbers[position];
            }
        }
        // Note: Player slice numbers would need more complex restoration logic
        // For now, they will be lost when a tile is cleared
    }
    
    // Initialize the tile selection modal
    initializeTileModal() {
        // Get modal elements
        this.modal = document.getElementById('tileSelectionModal');
        this.tileList = document.getElementById('tileList');
        this.searchInput = document.getElementById('tileSearchInput');
        const closeButton = document.querySelector('.close-button');
        
        // Close modal when clicking the X
        closeButton.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Handle search input
        this.searchInput.addEventListener('input', () => {
            this.filterTiles(this.searchInput.value);
        });
    }      // Open the tile selection modal
    openTileSelectionModal(hex, isFactionTilePosition = false) {
        this.currentHex = hex;
        this.isFactionTilePosition = isFactionTilePosition;
        this.populateTileList(isFactionTilePosition);
        this.modal.style.display = 'block';
        this.searchInput.value = '';
        this.searchInput.focus();
    }
    
    // Close the modal
    closeModal() {
        this.modal.style.display = 'none';
    }      // Populate the tile list
    populateTileList(showOnlyFactionTiles = false) {
        // Clear existing tiles
        this.tileList.innerHTML = '';
        
        // Sort tiles by ID
        const sortedTileIds = Object.keys(referenceTiles).sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });
        
        // Filter tiles based on position type
        const filteredTileIds = showOnlyFactionTiles 
            ? sortedTileIds.filter(tileId => {
                const tileData = referenceTiles[tileId];
                // Faction tiles have type "green" and a faction property
                return tileData.type === 'green' && tileData.faction;
              })
            : sortedTileIds.filter(tileId => {
                const tileData = referenceTiles[tileId];
                // For non-faction positions, exclude:
                // - Faction tiles (green tiles with faction property)
                // - Mecatol Rex (tile 18)
                // - Malice (tile 4276) 
                // - Hyperlanes
                if (tileId === '18' || tileId === '4276') {
                    return false;
                }
                if (tileData.type === 'green' && tileData.faction) {
                    return false;
                }
                if (tileData.type === 'hyperlane') {
                    return false;
                }
                return true;
              });
        
        // Update modal title to indicate filtering
        const modalTitle = this.modal.querySelector('h2');
        if (modalTitle) {
            modalTitle.textContent = showOnlyFactionTiles 
                ? 'Select a Faction Tile (Starting Position)'
                : 'Select a Tile';
        }
        
        // Add each tile to the list
        filteredTileIds.forEach(tileId => {
            const tileData = referenceTiles[tileId];
            const tileElement = this.createTileElement(tileId, tileData);
            this.tileList.appendChild(tileElement);
        });
        
        // Show message if no tiles available
        if (filteredTileIds.length === 0) {
            const noTilesMessage = document.createElement('div');
            noTilesMessage.className = 'no-tiles-message';
            noTilesMessage.textContent = showOnlyFactionTiles 
                ? 'No faction tiles available'
                : 'No tiles available';
            this.tileList.appendChild(noTilesMessage);
        }
    }
      // Create a tile element for the list
    createTileElement(tileId, tileData) {
        const tileElement = document.createElement('div');
        tileElement.className = `tile-item ${tileData.type ? tileData.type.toLowerCase() : ''}`;
        tileElement.dataset.tileId = tileId;
        
        // Create a container for the tile content
        const contentContainer = document.createElement('div');
        contentContainer.className = 'tile-content';
        
        // Create tile preview image
        const previewContainer = document.createElement('div');
        previewContainer.className = 'tile-preview';
        
        const previewImage = document.createElement('img');
        const imagePath = `img/tiles/ST_${tileId}.png`;
        previewImage.src = imagePath;
        previewImage.alt = `Tile ${tileId}`;
        previewImage.className = 'tile-preview-image';
        
        // Handle image load error
        previewImage.onerror = () => {
            previewContainer.innerHTML = `<div class="tile-preview-placeholder">${tileId}</div>`;
        };
        
        previewContainer.appendChild(previewImage);
        
        // Create tile info section
        const infoContainer = document.createElement('div');
        infoContainer.className = 'tile-info';
        
        // Create tile ID header
        const idElement = document.createElement('div');
        idElement.className = 'tile-id';
        idElement.textContent = `ID: ${tileId}`;
        infoContainer.appendChild(idElement);
        
        // Create tile details section
        const detailsElement = document.createElement('div');
        detailsElement.className = 'tile-details';
        
        // Add type
        if (tileData.type) {
            const typeElement = document.createElement('div');
            typeElement.textContent = `Type: ${tileData.type}`;
            detailsElement.appendChild(typeElement);
        }
        
        // Add faction if available
        if (tileData.faction) {
            const factionElement = document.createElement('div');
            factionElement.textContent = `Faction: ${tileData.faction}`;
            detailsElement.appendChild(factionElement);
        }
        
        // Add wormhole if available
        if (tileData.wormhole) {
            const wormholeElement = document.createElement('div');
            wormholeElement.textContent = `Wormhole: ${tileData.wormhole}`;
            detailsElement.appendChild(wormholeElement);
        }
        
        // Add anomaly if available
        if (tileData.anomaly) {
            const anomalyElement = document.createElement('div');
            anomalyElement.textContent = `Anomaly: ${tileData.anomaly}`;
            detailsElement.appendChild(anomalyElement);
        }
        
        infoContainer.appendChild(detailsElement);
        
        // Add planets if available
        if (tileData.planets && tileData.planets.length > 0) {
            const planetsElement = document.createElement('div');
            planetsElement.className = 'tile-planets';
            
            const planetsList = tileData.planets.map(planet => {
                return `<span class="planet-name">${planet.name}</span> (${planet.resources}/${planet.influence})`;
            }).join(', ');
            
            planetsElement.innerHTML = `Planets: ${planetsList}`;
            infoContainer.appendChild(planetsElement);
        }
        
        // Assemble the tile element
        contentContainer.appendChild(previewContainer);
        contentContainer.appendChild(infoContainer);
        tileElement.appendChild(contentContainer);
        
        // Add click event to select this tile
        tileElement.addEventListener('click', () => {
            this.placeTile(this.currentHex, tileId);
            this.closeModal();
        });
        
        return tileElement;
    }
    
    // Filter tiles based on search input
    filterTiles(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        const tileItems = this.tileList.querySelectorAll('.tile-item');
        
        tileItems.forEach(item => {
            const tileId = item.dataset.tileId;
            const tileData = referenceTiles[tileId];
            let shouldShow = false;
            
            // Check if ID matches
            if (tileId.toLowerCase().includes(searchTerm)) {
                shouldShow = true;
            }
            
            // Check if type matches
            if (tileData.type && tileData.type.toLowerCase().includes(searchTerm)) {
                shouldShow = true;
            }
            
            // Check if faction matches
            if (tileData.faction && tileData.faction.toLowerCase().includes(searchTerm)) {
                shouldShow = true;
            }
            
            // Check if planet names match
            if (tileData.planets) {
                for (const planet of tileData.planets) {
                    if (planet.name.toLowerCase().includes(searchTerm)) {
                        shouldShow = true;
                        break;
                    }
                }
            }
            
            // Show or hide based on search
            item.style.display = shouldShow ? '' : 'none';
        });
    }    // Parse excluded tiles from input text area
    parseExcludedTiles() {
        const excludedTilesInput = document.getElementById('excludedTilesInput');
        if (!excludedTilesInput || !excludedTilesInput.value.trim()) {
            return [];
        }
        
        const excludedTilesText = excludedTilesInput.value.trim();
        const excludedTiles = [];
        
        // Split by lines and then by commas
        const lines = excludedTilesText.split(/\n|\r\n?/);
        
        for (const line of lines) {
            if (line.trim()) {
                const tilesInLine = line.split(',').map(tile => {
                    const parsed = parseInt(tile.trim());
                    return isNaN(parsed) ? null : parsed;
                }).filter(tile => tile !== null);
                
                excludedTiles.push(...tilesInLine);
            }
        }
        
        return excludedTiles;
    }
    
    // Method to fill the universe randomly
    randomFillUniverse() {
        try {
            console.log('Starting Random Fill Universe...');
            
            // Show loading state
            const button = document.getElementById('randomFillButton');
            const originalText = button.textContent;
            button.textContent = 'Generating...';
            button.disabled = true;

            // Get all available tiles that have images (excluding faction tiles, Mecatol Rex, and hyperlanes)
            const allAvailableTiles = [];
            
            for (const tileId in referenceTiles) {
                const tile = referenceTiles[tileId];
                const id = parseInt(tileId);
                  // Skip faction tiles (1-17, 51-58, etc.) and Mecatol Rex (18)
                if (id >= 1 && id <= 17) continue;
                if (id === 18) continue; // Mecatol Rex
                if (id >= 51 && id <= 58) continue; // More faction tiles
                if (id === 4276) continue; // Skip Malice (hidden planet)
                if (tile.type === 'hyperlane') continue; // Skip hyperlane tiles
                
                // Only include tiles that have image files available
                if (this.hasImageFile(tileId)) {
                    allAvailableTiles.push(id);
                }
            }

            console.log(`Found ${allAvailableTiles.length} total available tiles with images for randomization`);
            
            // Get excluded tiles from input
            const excludedTiles = this.parseExcludedTiles();
            console.log(`Found ${excludedTiles.length} tiles to exclude: ${excludedTiles.join(', ')}`);
            
            // Filter out excluded tiles
            const availableTiles = allAvailableTiles.filter(tileId => !excludedTiles.includes(tileId));
            console.log(`After excluding tiles, ${availableTiles.length} tiles are available for randomization`);

            // Get all fillable hexes
            const fillableHexes = this.getFillableHexes();
            
            if (fillableHexes.length === 0) {
                console.log('No fillable hexes found');
                button.textContent = originalText;
                button.disabled = false;
                return;
            }

            // Validate we have enough tiles
            if (fillableHexes.length > availableTiles.length) {
                console.warn(`Not enough tiles with images (${availableTiles.length}) for all fillable hexes (${fillableHexes.length})`);
                button.textContent = originalText;
                button.disabled = false;
                return;
            }

            // Clear existing tiles first
            this.clearUniverse();

            // Shuffle both hexes and tiles for completely random placement
            this.shuffleArray(fillableHexes);
            this.shuffleArray(availableTiles);
            
            // Randomly assign tiles to hexes
            for (let i = 0; i < fillableHexes.length && i < availableTiles.length; i++) {
                const hex = fillableHexes[i];
                const tileId = availableTiles[i];
                
                this.placeTile(hex.element, tileId);
                console.log(`Placed tile ${tileId} at position ${hex.position}`);
            }
            
            // Generate alternate tile if we have remaining tiles and alternate tile is enabled
            const toggleCheckbox = document.getElementById('toggleAlternateTile');
            if (toggleCheckbox && toggleCheckbox.checked && availableTiles.length > fillableHexes.length) {
                // Use the next available tile as the alternate
                let alternateTileIndex = fillableHexes.length;
                let alternateTileId = availableTiles[alternateTileIndex];
                
                // If by chance the next tile is Malice (4276), skip it
                if (alternateTileId === 4276 && availableTiles.length > fillableHexes.length + 1) {
                    alternateTileIndex++;
                    alternateTileId = availableTiles[alternateTileIndex];
                }
                
                this.placeAlternateTile(alternateTileId);
                console.log(`Set alternate tile to: ${alternateTileId}`);
            } else {
                // Clear alternate tile if disabled or no tiles available
                this.clearAlternateTile();
            }
            
            console.log('Random Fill Universe completed!');
        
        // Restore button state
        button.textContent = originalText;
        button.disabled = false;
        
        // Refresh the value heatmap if it's active
        if (this.valueHeatmapActive) {
            console.log('Value heatmap is active, refreshing after map generation');
            this.applyValueHeatmap();
        }
            
        } catch (error) {
            console.error('Error during random fill:', error);
            
            // Restore button state on error
            const button = document.getElementById('randomFillButton');
            button.textContent = 'Random Fill Universe';
            button.disabled = false;
        }
    }    // Clear all tiles from the universe (excluding special hexes)
    clearUniverse() {
        const fillableHexes = this.getFillableHexes();
        fillableHexes.forEach(hex => {
            this.clearTile(hex.element);
        });
        
        // Also clear the alternate tile
        this.clearAlternateTile();
        
        console.log('Universe cleared of all fillable tiles');
    }

    // Get all hexes that can be filled (exclude special hexes)
    getFillableHexes() {
        const hexes = document.querySelectorAll('.hex');
        const fillableHexes = [];
        
        hexes.forEach(hex => {
            const classes = hex.className;
            const position = hex.getAttribute('data-position');
            
            // Check if hex contains player slice numbers (spans with player*-number classes)
            const hasPlayerSliceNumber = hex.querySelector('span[class*="player"][class*="-number"]');
              // Exclude:
            // - Center hex (Mecatol Rex)
            // - Hyperlanes
            // - Player positions
            // - Hexes with player slice numbers (1-5)
            if (!classes.includes('hex-center') && 
                !classes.includes('hex-hyperlane') && 
                !classes.includes('hex-hyperlane-83A') && 
                !classes.includes('hex-hyperlane-86A') && 
                !classes.includes('hex-player') &&
                !hasPlayerSliceNumber) {
                
                fillableHexes.push({
                    element: hex,
                    position: position
                });
            }
        });
        
        console.log(`Found ${fillableHexes.length} fillable hexes (excluding player slices, hyperlanes, player positions, and Mecatol Rex)`);
        return fillableHexes;
    }

    // Check if a tile has an available image file
    hasImageFile(tileId) {
        // List of tile IDs that we know have image files available
        // Based on the img/tiles directory listing
        const availableTileImages = [
            19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
            39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
            59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
            4237, 4238, 4239, 4240, 4241, 4242, 4243, 4244, 4245, 4246, 4247, 4248, 4249, 4250, 4251, 4252,
            4253, 4254, 4255, 4256, 4257, 4258, 4259, 4260, 4261, 4262, 4263, 4264, 4265, 4266, 4267, 4268,
            4269, 4270, 4271, 4272, 4273, 4274, 4275, 4276
        ];
        
        const id = parseInt(tileId);
        const hasImage = availableTileImages.includes(id);
        
        if (!hasImage) {
            console.log(`Skipping tile ${tileId} - no image file available`);
        }
        
        return hasImage;
    }

    // Utility function to shuffle an array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Initialize alternate tile toggle functionality
    initializeAlternateTileToggle() {
        const toggleCheckbox = document.getElementById('toggleAlternateTile');
        const alternatePlaceholder = document.getElementById('alternateTilePlaceholder');
        const alternateHex = document.getElementById('alternateHex');
        
        if (toggleCheckbox && alternatePlaceholder) {
            // Set initial state based on checkbox
            this.toggleAlternateTilePlaceholder(toggleCheckbox.checked);
            
            // Add event listener for toggle changes
            toggleCheckbox.addEventListener('change', (e) => {
                this.toggleAlternateTilePlaceholder(e.target.checked);
            });
        }
        
        // Add click handler for alternate tile hex
        if (alternateHex) {
            alternateHex.addEventListener('click', () => {
                this.handleAlternateTileClick();
            });
        }
    }

    // Toggle alternate tile placeholder visibility
    toggleAlternateTilePlaceholder(show) {
        const alternatePlaceholder = document.getElementById('alternateTilePlaceholder');
        if (alternatePlaceholder) {
            alternatePlaceholder.style.display = show ? 'block' : 'none';
        }
    }

    // Place a tile in the alternate tile placeholder
    placeAlternateTile(tileId) {
        console.log(`Starting placeAlternateTile with tileId: ${tileId}`);
        const alternateSlot = document.getElementById('alternateSlot');
        const alternateInfo = document.getElementById('alternateInfo');
        const alternateHex = document.getElementById('alternateHex');
        
        console.log('Alternate elements found:', {
            slot: !!alternateSlot,
            info: !!alternateInfo,
            hex: !!alternateHex
        });
        
        if (!alternateSlot || !alternateInfo) {
            console.error('Missing required alternate tile elements');
            return;
        }

        const tile = referenceTiles[tileId];
        console.log(`Tile data for ${tileId}:`, tile);
        if (!tile) {
            console.error(`No tile data found for tile ID: ${tileId}`);
            return;
        }

        this.alternateTileId = tileId;
        
        // Update the hex display
        const tileImage = `img/tiles/ST_${tileId}.png`;
        alternateSlot.innerHTML = `<img src="${tileImage}" alt="Tile ${tileId}" style="width: 100%; height: 100%; object-fit: cover;">
                                    <div class="tile-number">${tileId}</div>`;
        
        // Add has-tile-image class to the placeholder hex
        if (alternateHex) {
            alternateHex.classList.add('has-tile-image');
        }
        
        // Update the info display
        const tileIdDisplay = alternateInfo.querySelector('.tile-id');
        const tileTypeDisplay = alternateInfo.querySelector('.tile-type');
        
        console.log('Info display elements found:', {
            tileIdDisplay: !!tileIdDisplay,
            tileTypeDisplay: !!tileTypeDisplay
        });
        
        if (tileIdDisplay) {
            tileIdDisplay.textContent = `Tile ID: ${tileId}`;
            console.log(`Set tile ID display to: ${tileIdDisplay.textContent}`);
        }
        if (tileTypeDisplay) {
            tileTypeDisplay.textContent = `Type: ${tile.type || 'Unknown'}`;
            console.log(`Set tile type display to: ${tileTypeDisplay.textContent}`);
        }
        
        // Set data-tile-id attribute for hover functionality
        if (alternateHex) {
            alternateHex.setAttribute('data-tile-id', tileId);
            alternateHex.setAttribute('data-position', 'alt');
        }
        
        // Create tile info overlay for alternate tile
        this.createTileInfoOverlay(alternateHex, tileId);
        
        console.log(`Placed alternate tile: ${tileId}`);
    }

    // Clear the alternate tile placeholder
    clearAlternateTile() {
        console.log('clearAlternateTile called');
        const alternateSlot = document.getElementById('alternateSlot');
        const alternateInfo = document.getElementById('alternateInfo');
        const alternateHex = document.getElementById('alternateHex');
        
        if (!alternateSlot || !alternateInfo) return;

        this.alternateTileId = null;
        
        // Clear the hex display
        alternateSlot.innerHTML = '<div class="placeholder-text">4</div>';
        
        // Remove has-tile-image class from the placeholder hex
        if (alternateHex) {
            alternateHex.classList.remove('has-tile-image');
        }
        
        // Clear the info display
        const tileIdDisplay = alternateInfo.querySelector('.tile-id');
        const tileTypeDisplay = alternateInfo.querySelector('.tile-type');
        
        if (tileIdDisplay) tileIdDisplay.textContent = 'Tile ID: -';
        if (tileTypeDisplay) tileTypeDisplay.textContent = 'Type: -';
        
        // Remove data-tile-id attribute for hover functionality
        if (alternateHex) {
            alternateHex.removeAttribute('data-tile-id');
            alternateHex.removeAttribute('data-position');
            
            // Remove any existing tile info overlay
            const existingOverlay = alternateHex.querySelector('.tile-info-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
        }
        
        console.log('Alternate tile cleared');
    }

    // Handle clicking on the alternate tile
    handleAlternateTileClick() {
        if (!this.alternateTileId) {
            console.log('No alternate tile available to place');
            return;
        }
        
        if (!this.selectedHex) {
            console.log('No hex selected. Please select a hex first, then click the alternate tile to place it.');
            return;
        }
        
        // Check if the selected hex can receive a tile
        const classes = this.selectedHex.className;        if (classes.includes('hex-center') || 
            classes.includes('hex-hyperlane') || 
            classes.includes('hex-hyperlane-83A') || 
            classes.includes('hex-hyperlane-86A') || 
            classes.includes('hex-player-slice')) {
            console.log('Cannot place tile on this hex type');
            return;
        }
        
        // Place the alternate tile on the selected hex
        this.placeTile(this.selectedHex, this.alternateTileId);
        console.log(`Placed alternate tile ${this.alternateTileId} on selected hex`);
          // Clear the alternate tile after placing
        this.clearAlternateTile();
    }    // Initialize tile info overlay functionality
    initializeTileInfoOverlay() {
        console.log('Initializing tile info overlay functionality');
        const toggleCheckbox = document.getElementById('toggleTileInfo');
        const mapContainer = document.querySelector('.map-container');
        
        if (toggleCheckbox && mapContainer) {
            console.log(`Initial toggle state: ${toggleCheckbox.checked}`);
            // Set initial state
            this.updateTileInfoOverlays(toggleCheckbox.checked);
            
            // Add event listener for toggle changes
            toggleCheckbox.addEventListener('change', (e) => {
                console.log(`Toggle changed to: ${e.target.checked}`);
                this.updateTileInfoOverlays(e.target.checked);
            });
        } else {
            console.error('Could not find toggle checkbox or map container');
        }
    }// Update tile info overlay visibility
    updateTileInfoOverlays(show) {
        console.log(`Updating tile info overlays visibility: ${show}`);
        const mapContainer = document.querySelector('.map-container');
        const body = document.body;
        
        if (mapContainer) {
            if (show) {
                console.log('Adding show-tile-info class and creating overlays');
                mapContainer.classList.add('show-tile-info');
                body.classList.add('show-tile-info');
                this.createTileInfoOverlays();
            } else {
                console.log('Removing show-tile-info class and removing overlays');
                mapContainer.classList.remove('show-tile-info');
                body.classList.remove('show-tile-info');
                this.removeTileInfoOverlays();
            }
        }
    }

    // Initialize tile numbers toggle functionality
    initializeTileNumbersToggle() {
        const toggleCheckbox = document.getElementById('toggleTileNumbers');
        const mapContainer = document.querySelector('.map-container');
        
        if (toggleCheckbox && mapContainer) {
            // Set initial state
            this.updateTileNumbersVisibility(toggleCheckbox.checked);
            
            // Add event listener for toggle changes
            toggleCheckbox.addEventListener('change', (e) => {
                this.updateTileNumbersVisibility(e.target.checked);
            });
        }
    }

    // Update tile numbers visibility
    updateTileNumbersVisibility(show) {
        const mapContainer = document.querySelector('.map-container');
        const body = document.body;
        
        if (mapContainer) {
            if (show) {
                mapContainer.classList.add('show-tile-numbers');
                body.classList.add('show-tile-numbers');
            } else {
                mapContainer.classList.remove('show-tile-numbers');
                body.classList.remove('show-tile-numbers');
            }
        }
    }
    
    // Initialize value heatmap toggle
    initializeValueHeatmapToggle() {
        const toggleValueHeatmap = document.getElementById('toggleValueHeatmap');
        
        if (toggleValueHeatmap) {
            // Set initial state based on checkbox
            this.valueHeatmapActive = toggleValueHeatmap.checked;
            if (this.valueHeatmapActive) {
                this.applyValueHeatmap();
            }
            
            // Add event listener for changes
            toggleValueHeatmap.addEventListener('change', () => {
                this.valueHeatmapActive = toggleValueHeatmap.checked;
                if (this.valueHeatmapActive) {
                    this.applyValueHeatmap();
                } else {
                    this.removeValueHeatmap();
                }
            });
        }
    }
    
    // Initialize tile art toggle
    initializeTileArtToggle() {
        const toggleTileArt = document.getElementById('toggleTileArt');
        const mapContainer = document.querySelector('.map-container');
        
        if (toggleTileArt && mapContainer) {
            // Function to update tile visibility
            const updateTileArtVisibility = (show) => {
                console.log(`Updating tile art visibility: ${show ? 'show' : 'hide'}`);
                
                // Update container class and body class for alternate tile
                if (show) {
                    mapContainer.classList.remove('hide-tile-art');
                    document.body.classList.remove('hide-tile-art');
                } else {
                    mapContainer.classList.add('hide-tile-art');
                    document.body.classList.add('hide-tile-art');
                }
                
                // Update inline styles for all non-special hexes
                const regularHexes = document.querySelectorAll('.hex:not(.hex-hyperlane):not(.hex-hyperlane-83A):not(.hex-hyperlane-86A):not(.hex-center):not(.hex-player)');
                console.log(`Found ${regularHexes.length} regular hexes to update`);
                
                regularHexes.forEach(hex => {
                    const tileId = hex.getAttribute('data-tile-id');
                    if (tileId) {
                        if (show) {
                            // Restore tile image
                            const imagePath = `img/tiles/ST_${tileId}.png`;
                            console.log(`Showing tile art for tile ${tileId} at ${imagePath}`);
                            hex.style.setProperty('background-image', `url('${imagePath}')`, 'important');
                            hex.style.setProperty('background-size', 'cover', 'important');
                            hex.style.setProperty('background-position', 'center', 'important');
                            hex.style.setProperty('background-repeat', 'no-repeat', 'important');
                        } else {
                            // Hide tile image but keep the ring color
                            console.log(`Hiding tile art for tile ${tileId}`);
                            hex.style.setProperty('background-image', 'none', 'important');
                            
                            // Restore the appropriate ring color based on the hex class
                            if (hex.classList.contains('hex-inner')) {
                                hex.style.setProperty('background', 'radial-gradient(circle, #44bfff 0%, #0099dd 100%)', 'important');
                                hex.style.setProperty('box-shadow', '0 0 15px rgba(68, 191, 255, 0.4)', 'important');
                            } else if (hex.classList.contains('hex-middle')) {
                                hex.style.setProperty('background', 'radial-gradient(circle, #4488ff 0%, #0044bb 100%)', 'important');
                                hex.style.setProperty('box-shadow', '0 0 15px rgba(68, 136, 255, 0.4)', 'important');
                            } else if (hex.classList.contains('hex-outer')) {
                                hex.style.setProperty('background', 'radial-gradient(circle, #3366bb 0%, #002288 100%)', 'important');
                                hex.style.setProperty('box-shadow', '0 0 15px rgba(51, 102, 187, 0.4)', 'important');
                            } else if (hex.classList.contains('hex-outermost')) {
                                hex.style.setProperty('background', 'radial-gradient(circle, #224488 0%, #001155 100%)', 'important');
                                hex.style.setProperty('box-shadow', '0 0 15px rgba(34, 68, 136, 0.4)', 'important');
                            }
                        }
                    }
                });
                
                // Also handle the alternate tile placeholder
                const alternatePlaceholder = document.querySelector('.placeholder-hex');
                if (alternatePlaceholder) {
                    const hasImage = alternatePlaceholder.classList.contains('has-tile-image');
                    console.log(`Alternate tile placeholder found, has image: ${hasImage}`);
                    
                    if (show && hasImage) {
                        // Show tile image for alternate tile
                        console.log('Showing alternate tile image');
                        // Image should be restored by CSS when hide-tile-art class is removed
                    } else if (!show) {
                        // Force blue background for alternate tile when tile art is hidden
                        console.log('Forcing blue background for alternate tile');
                        alternatePlaceholder.style.setProperty('background', 'radial-gradient(circle, #3366bb 0%, #002288 100%)', 'important');
                        alternatePlaceholder.style.setProperty('box-shadow', '0 0 15px rgba(51, 102, 187, 0.4)', 'important');
                    } else {
                        // Remove inline styles to let CSS handle it
                        alternatePlaceholder.style.removeProperty('background');
                        alternatePlaceholder.style.removeProperty('box-shadow');
                    }
                }
            };
            
            // Set initial state based on checkbox
            console.log(`Initial tile art toggle state: ${toggleTileArt.checked}`);
            updateTileArtVisibility(toggleTileArt.checked);
            
            // Add event listener for changes
            toggleTileArt.addEventListener('change', (e) => {
                console.log(`Tile art toggle changed to: ${e.target.checked}`);
                updateTileArtVisibility(e.target.checked);
                
                // Don't save tile art state to localStorage - it should reset on refresh (but preserved in shareable links)
                console.log('Tile art toggled - not saving to localStorage (resets on refresh, but preserved in shareable links)');
                
                // Refresh the value heatmap if it's active to update opacity
                if (this.valueHeatmapActive) {
                    console.log('Refreshing heatmap after tile art toggle');
                    this.removeValueHeatmap();
                    this.applyValueHeatmap();
                }
            });
            
            // Load saved preference if it exists
            const savedState = localStorage.getItem('ti4MapState');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    // Remove tile art state restoration - should always default to true
                    console.log('Skipping tile art state restoration - always defaults to true');
                } catch (e) {
                    console.error('Error parsing saved state:', e);
                }
            }
        }
    }    // Create tile info overlays for all tiles
    createTileInfoOverlays() {
        console.log('Creating tile info overlays for all tiles');
        const hexes = document.querySelectorAll('.hex');
        
        hexes.forEach(hex => {
            const tileId = hex.getAttribute('data-tile-id');
            if (tileId && !hex.querySelector('.tile-info-overlay')) {
                console.log(`Found hex with tile ID ${tileId}, creating overlay`);
                this.createTileInfoOverlay(hex, tileId);
            } else if (tileId) {
                console.log(`Hex with tile ID ${tileId} already has overlay`);
            }
        });
    }
    
    // Remove all tile info overlays
    removeTileInfoOverlays() {
        const overlays = document.querySelectorAll('.tile-info-overlay');
        overlays.forEach(overlay => overlay.remove());
    }
    
    // Place a tile in the alternate tile placeholder

    
    // Apply value heatmap to all tiles
    applyValueHeatmap() {
        // Remove any existing heatmap overlays first
        this.removeValueHeatmap();
        
        // Get all hexes with tiles
        const hexes = document.querySelectorAll('.hex[data-tile-id]');
        hexes.forEach(hex => {
            const tileId = hex.getAttribute('data-tile-id');
            if (tileId) {
                const value = this.calculateTileValue(tileId);
                const color = this.getHeatmapColor(value);
                
                // Create and apply the heatmap overlay
                const overlay = document.createElement('div');
                overlay.className = 'hex-value-heatmap-overlay';
                overlay.style.backgroundColor = color;
                hex.appendChild(overlay);
            }
        });
    }
    
    // Remove all value heatmap overlays
    removeValueHeatmap() {
        const overlays = document.querySelectorAll('.hex-value-heatmap-overlay');
        overlays.forEach(overlay => overlay.remove());
    }
    
    // Calculate the value of a tile based on resources, influence, and other factors
    calculateTileValue(tileId) {
        // Get tile data from reference
        const tileData = calculateTileTotals(tileId);
        if (!tileData) return 0;
        
        // Base value is resources + influence
        let value = tileData.resources + tileData.influence;
        
        // Add bonus for tech specialties
        if (tileData.specialty) {
            value += 1; // Tech specialties are valuable
        }
        
        // Add bonus for wormholes
        if (tileData.wormhole) {
            value += 0.5; // Wormholes add some value
        }
        
        // Reduce value for anomalies
        if (tileData.anomaly) {
            // Different anomalies have different impacts
            switch (tileData.anomaly) {
                case 'supernova':
                    value -= 2; // Supernovas are very negative
                    break;
                case 'asteroid field':
                case 'asteroid-rift':
                    value -= 1; // Asteroid fields are negative
                    break;
                case 'nebula':
                    value -= 0.5; // Nebulas are slightly negative
                    break;
                case 'gravity rift':
                    value -= 1; // Gravity rifts are negative
                    break;
            }
        }
        
        return value;
    }
    
    // Get a color for the heatmap based on the value
    getHeatmapColor(value) {
        // Define color scale
        // Red (low value) to Yellow to Green (high value)
        
        // Normalize value to a 0-1 scale
        // Assuming values typically range from -2 to 8
        const minValue = -2;
        const maxValue = 8;
        const normalizedValue = Math.max(0, Math.min(1, (value - minValue) / (maxValue - minValue)));
        
        // Generate RGB color
        let r, g, b;
        
        if (normalizedValue < 0.5) {
            // Red to Yellow
            r = 255;
            g = Math.round(255 * (normalizedValue * 2));
            b = 0;
        } else {
            // Yellow to Green
            r = Math.round(255 * (1 - (normalizedValue - 0.5) * 2));
            g = 255;
            b = 0;
        }
        
        // Return with opacity for overlay effect
        return `rgba(${r}, ${g}, ${b}, 0.5)`;
    }
    
    // Toggle alternate tile placeholder visibility
    toggleAlternateTilePlaceholder(show) {
        const alternatePlaceholder = document.getElementById('alternateTilePlaceholder');
        if (alternatePlaceholder) {
            alternatePlaceholder.style.display = show ? 'block' : 'none';
        }
    }

    // Create tile info overlay for a hex
    createTileInfoOverlay(hex, tileId) {
        // Get the hex classes to check if it's a special hex
        const classes = hex.className;
        
        // Check if classes include any of these specific hyperlanes or player
        if (classes.includes('hex-hyperlane-83A') || 
            classes.includes('hex-hyperlane-86A') || 
            classes.includes('hex-player')) {
            console.log(`Skipping overlay for special hex: ${classes}`);
            return;
        }

        const tileInfo = calculateTileTotals(tileId.toString());
        console.log(`Tile info for ${tileId}:`, tileInfo);
        if (!tileInfo) {
            console.log(`No tile info found for ${tileId}`);
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'tile-info-overlay';

        const statsText = document.createElement('div');
        statsText.className = 'tile-stats-text';

        // Handle different tile types like in index.html
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

        overlay.appendChild(statsText);

        // Add tech specialty icon if present
        if (tileInfo.specialty) {
            const techIcon = document.createElement('div');
            techIcon.className = 'tile-tech-icon';
            const techImg = document.createElement('img');
            techImg.src = techSpecialtyIcons[tileInfo.specialty];
            techImg.alt = tileInfo.specialty;
            techImg.title = tileInfo.specialty;
            techIcon.appendChild(techImg);
            overlay.appendChild(techIcon);
        }

        // Add wormhole icon if present (excluding red tiles that already show wormhole in main text)
        if (tileInfo.wormhole && !(tileInfo.type === 'red' && !tileInfo.anomaly)) {
            const wormholeIcon = document.createElement('div');
            wormholeIcon.className = 'tile-wormhole-icon';
            wormholeIcon.textContent = wormholeIcons[tileInfo.wormhole] || '?';
            wormholeIcon.title = `${tileInfo.wormhole.charAt(0).toUpperCase() + tileInfo.wormhole.slice(1)} Wormhole`;
            overlay.appendChild(wormholeIcon);
        }

        hex.appendChild(overlay);
        console.log(`Successfully created tile info overlay for tile ${tileId}`);
    }

// Update tile info overlay when a tile is placed
updateTileInfoOverlay(hex, tileId) {
    // Remove existing overlay
    const existingOverlay = hex.querySelector('.tile-info-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    // Always create new overlay if tileId is provided, regardless of current toggle state
    // The CSS will control visibility based on .show-tile-info class
    if (tileId) {
        this.createTileInfoOverlay(hex, tileId);
    }
}

// Update the hex preview image in the coordinates box
updateHexPreview(hex, previewContainer) {
    // Clear existing content
    previewContainer.innerHTML = '';

    const tileId = hex.getAttribute('data-tile-id');
    
    if (!tileId || tileId === 'Empty') {
        previewContainer.innerHTML = '<div class="coord-placeholder-text">Hover over a tile</div>';
        return;
    }

    // Create a miniature hex with the tile image
    const miniHex = document.createElement('div');
    miniHex.className = 'coord-mini-hex';
        
        // Try to load the tile image
        const imagePath = `img/tiles/ST_${tileId}.png`;
        const testImage = new Image();
        
        testImage.onload = () => {
            miniHex.style.backgroundImage = `url(${imagePath})`;
            miniHex.style.backgroundSize = 'contain';
            miniHex.style.backgroundPosition = 'center';
            miniHex.style.backgroundRepeat = 'no-repeat';
        };
        
        testImage.onerror = () => {
            // Fallback: show tile ID if image doesn't exist
            miniHex.textContent = tileId;
            miniHex.style.display = 'flex';
            miniHex.style.alignItems = 'center';
            miniHex.style.justifyContent = 'center';
            miniHex.style.fontSize = '12px';
            miniHex.style.fontWeight = 'bold';
            miniHex.style.color = '#fff';
        };
        
        testImage.src = imagePath;
        previewContainer.appendChild(miniHex);
    }

    // Update detailed tile information in the coordinates box
    updateDetailedTileInfo(tileId, resourcesDiv, planetsDiv, specialDiv) {
        // Clear existing content
        resourcesDiv.innerHTML = '';
        planetsDiv.innerHTML = '';
        specialDiv.innerHTML = '';

        if (!tileId || tileId === 'Empty' || !referenceTiles[tileId]) {
            return;
        }

        const tileData = referenceTiles[tileId];
        const tileInfo = calculateTileTotals(tileId);

        // Create resources section
        if (tileInfo.resources > 0 || tileInfo.influence > 0) {
            const resourcesHeader = document.createElement('div');
            resourcesHeader.className = 'coord-section-header';
            resourcesHeader.textContent = 'Resources & Influence';
            resourcesDiv.appendChild(resourcesHeader);

            const resourcesContent = document.createElement('div');
            resourcesContent.className = 'coord-section-content';
            resourcesContent.innerHTML = `
                <div class="coord-stat">
                    <span class="coord-stat-label">Resources:</span>
                    <span class="coord-stat-value">${tileInfo.resources}</span>
                </div>
                <div class="coord-stat">
                    <span class="coord-stat-label">Influence:</span>
                    <span class="coord-stat-value">${tileInfo.influence}</span>
                </div>
            `;
            resourcesDiv.appendChild(resourcesContent);
        }

        // Create planets section
        if (tileData.planets && tileData.planets.length > 0) {
            const planetsHeader = document.createElement('div');
            planetsHeader.className = 'coord-section-header';
            planetsHeader.textContent = 'Planets';
            planetsDiv.appendChild(planetsHeader);

            const planetsContent = document.createElement('div');
            planetsContent.className = 'coord-section-content';

            tileData.planets.forEach(planet => {
                const planetItem = document.createElement('div');
                planetItem.className = 'coord-planet-item';
                
                let planetInfo = `<div class="coord-planet-name">${planet.name}</div>`;
                planetInfo += `<div class="coord-planet-stats">${planet.resources}/${planet.influence}</div>`;
                
                if (planet.specialty) {
                    planetInfo += `<div class="coord-planet-specialty">${planet.specialty}</div>`;
                }
                
                if (planet.trait) {
                    planetInfo += `<div class="coord-planet-trait">${planet.trait}</div>`;
                }
                
                if (planet.legendary) {
                    planetInfo += `<div class="coord-planet-legendary">Legendary</div>`;
                }
                
                planetItem.innerHTML = planetInfo;
                planetsContent.appendChild(planetItem);
            });

            planetsDiv.appendChild(planetsContent);
        }

        // Create special features section
        const specialFeatures = [];
        
        if (tileData.wormhole) {
            specialFeatures.push(`Wormhole: ${tileData.wormhole.charAt(0).toUpperCase() + tileData.wormhole.slice(1)}`);
        }
        
        if (tileData.anomaly) {
            specialFeatures.push(`Anomaly: ${tileData.anomaly}`);
        }
        
        if (tileData.faction) {
            specialFeatures.push(`Faction: ${tileData.faction}`);
        }
        
        if (tileInfo.specialty) {
            specialFeatures.push(`Tech Specialty: ${tileInfo.specialty.charAt(0).toUpperCase() + tileInfo.specialty.slice(1)}`);
        }

        if (specialFeatures.length > 0) {
            const specialHeader = document.createElement('div');
            specialHeader.className = 'coord-section-header';
            specialHeader.textContent = 'Special Features';
            specialDiv.appendChild(specialHeader);

            const specialContent = document.createElement('div');
            specialContent.className = 'coord-section-content';

            specialFeatures.forEach(feature => {
                const featureItem = document.createElement('div');
                featureItem.className = 'coord-special-item';
                featureItem.textContent = feature;
                specialContent.appendChild(featureItem);
            });

            specialDiv.appendChild(specialContent);
        }
    }
} // End of TI4Map class

// State Management Methods
TI4Map.prototype.saveStateToLocalStorage = function() {
        const state = {
            currentTiles: this.currentTiles,
            alternateTileId: this.alternateTileId,
            uiSettings: {
                showPlayerSlices: document.getElementById('togglePlayerSlices').checked,
                showAlternateTile: document.getElementById('toggleAlternateTile').checked,
                // showTileArt: document.getElementById('toggleTileArt').checked, // Don't save tile art to localStorage (but included in shareable links)
                showTileInfo: document.getElementById('toggleTileInfo').checked,
                showTileNumbers: document.getElementById('toggleTileNumbers').checked,
                showValueHeatmap: document.getElementById('toggleValueHeatmap').checked
            }
        };
        
        localStorage.setItem('ti4MapState', JSON.stringify(state));
        console.log('Map state saved to local storage');
        
        // Show a brief notification
        this.showNotification('Map state saved to local storage');
    }
    
    // Load the map state from local storage
TI4Map.prototype.loadStateFromLocalStorage = function() {
        const savedState = localStorage.getItem('ti4MapState');
        if (!savedState) {
            console.log('No saved state found in local storage');
            this.showNotification('No saved state found');
            return false;
        }
        
        try {
            const state = JSON.parse(savedState);
            
            // Clear the current map first
            this.clearUniverse();
            
            // Restore tile placements
            this.currentTiles = state.currentTiles || {};
            for (const [position, tileId] of Object.entries(this.currentTiles)) {
                if (position === '0,0') continue; // Skip Mecatol Rex
                
                const hex = document.querySelector(`.hex[data-position="${position}"]`);
                if (hex) {
                    this.placeTile(hex, tileId, false); // Don't update currentTiles again
                }
            }
            
            // Restore alternate tile
            if (state.alternateTileId) {
                this.placeAlternateTile(state.alternateTileId);
            }                // Restore UI settings
            if (state.uiSettings) {
                const { showPlayerSlices, showAlternateTile, showTileInfo, showTileNumbers, showValueHeatmap } = state.uiSettings;
                
                const togglePlayerSlices = document.getElementById('togglePlayerSlices');
                if (togglePlayerSlices) {
                    togglePlayerSlices.checked = showPlayerSlices;
                    if (showPlayerSlices) {
                        document.querySelector('.map-container').classList.remove('hide-player-numbers');
                    } else {
                        document.querySelector('.map-container').classList.add('hide-player-numbers');
                    }
                }
                
                const toggleAlternateTile = document.getElementById('toggleAlternateTile');
                if (toggleAlternateTile) {
                    toggleAlternateTile.checked = showAlternateTile;
                    this.toggleAlternateTilePlaceholder(showAlternateTile);
                }
                
                const toggleTileInfo = document.getElementById('toggleTileInfo');
                if (toggleTileInfo) {
                    toggleTileInfo.checked = showTileInfo;
                    this.updateTileInfoOverlays(showTileInfo);
                }
                
                const toggleTileNumbers = document.getElementById('toggleTileNumbers');
                if (toggleTileNumbers) {
                    toggleTileNumbers.checked = showTileNumbers;
                    this.updateTileNumbersVisibility(showTileNumbers);
                }
                
                const toggleValueHeatmap = document.getElementById('toggleValueHeatmap');
                if (toggleValueHeatmap) {
                    toggleValueHeatmap.checked = showValueHeatmap;
                    this.valueHeatmapActive = showValueHeatmap;
                    if (showValueHeatmap) {
                        this.applyValueHeatmap();
                    } else {
                        this.removeValueHeatmap();
                    }
                }
                
                // Tile art toggle should always default to ON (true) and not be saved/restored
                const toggleTileArt = document.getElementById('toggleTileArt');
                if (toggleTileArt) {
                    toggleTileArt.checked = true; // Always default to true
                    // Ensure tile art is shown by default
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) {
                        mapContainer.classList.remove('hide-tile-art');
                        document.body.classList.remove('hide-tile-art');
                    }
                }
            }
            
            console.log('Map state loaded from local storage');
            this.showNotification('Map state loaded from local storage');
            return true;
        } catch (error) {
            console.error('Error loading state from local storage:', error);
            this.showNotification('Error loading saved state');
            return false;
        }
    }
    
    // Generate a shareable link with the current state encoded in the URL
TI4Map.prototype.generateShareableLink = function() {
        // Create a compressed representation of the current state
        const state = {
            t: {}, // tiles (shortened key for smaller URL)
            a: this.alternateTileId, // alternate tile
            u: { // UI settings
                p: document.getElementById('togglePlayerSlices').checked,
                a: document.getElementById('toggleAlternateTile').checked,
                i: document.getElementById('toggleTileInfo').checked,
                n: document.getElementById('toggleTileNumbers').checked,
                v: document.getElementById('toggleValueHeatmap').checked,
                ta: document.getElementById('toggleTileArt').checked
            }
        };
        
        // Only include non-empty tiles to save space
        for (const [position, tileId] of Object.entries(this.currentTiles)) {
            if (position !== '0,0') { // Skip Mecatol Rex as it's always the same
                state.t[position] = tileId;
            }
        }
        
        // Convert to JSON and encode for URL
        const stateStr = JSON.stringify(state);
        const encodedState = btoa(stateStr);
        
        // Create the URL with the encoded state
        const url = new URL(window.location.href);
        url.searchParams.set('state', encodedState);
        
        // Copy to clipboard
        navigator.clipboard.writeText(url.toString())
            .then(() => {
                console.log('Shareable link copied to clipboard');
                this.showNotification('Shareable link copied to clipboard');
            })
            .catch(err => {
                console.error('Could not copy link to clipboard:', err);
                this.showNotification('Link generated but could not copy to clipboard');
                
                // Show the link in a modal as fallback
                this.showShareableLinkModal(url.toString());
            });
            
        return url.toString();
    }
    
    // Load state from URL parameters
TI4Map.prototype.loadStateFromURL = function() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedState = urlParams.get('state');
        
        if (!encodedState) {
            return false;
        }
        
        try {
            const stateStr = atob(encodedState);
            const state = JSON.parse(stateStr);
            
            // Clear the current map first
            this.clearUniverse();
            
            // Restore tile placements
            if (state.t) {
                for (const [position, tileId] of Object.entries(state.t)) {
                    const hex = document.querySelector(`.hex[data-position="${position}"]`);
                    if (hex) {
                        this.placeTile(hex, tileId, false);
                        this.currentTiles[position] = tileId;
                    }
                }
            }
            
            // Restore alternate tile
            if (state.a) {
                this.placeAlternateTile(state.a);
            }
            
            // Restore UI settings
            if (state.u) {
                const togglePlayerSlices = document.getElementById('togglePlayerSlices');
                if (togglePlayerSlices && state.u.p !== undefined) {
                    togglePlayerSlices.checked = state.u.p;
                    if (state.u.p) {
                        document.querySelector('.map-container').classList.remove('hide-player-numbers');
                    } else {
                        document.querySelector('.map-container').classList.add('hide-player-numbers');
                    }
                }
                
                const toggleAlternateTile = document.getElementById('toggleAlternateTile');
                if (toggleAlternateTile && state.u.a !== undefined) {
                    toggleAlternateTile.checked = state.u.a;
                    this.toggleAlternateTilePlaceholder(state.u.a);
                }
                
                const toggleTileInfo = document.getElementById('toggleTileInfo');
                if (toggleTileInfo && state.u.i !== undefined) {
                    toggleTileInfo.checked = state.u.i;
                    this.updateTileInfoOverlays(state.u.i);
                }
                
                const toggleTileNumbers = document.getElementById('toggleTileNumbers');
                if (toggleTileNumbers && state.u.n !== undefined) {
                    toggleTileNumbers.checked = state.u.n;
                    this.updateTileNumbersVisibility(state.u.n);
                }
                
                const toggleValueHeatmap = document.getElementById('toggleValueHeatmap');
                if (toggleValueHeatmap && state.u.v !== undefined) {
                    toggleValueHeatmap.checked = state.u.v;
                    this.valueHeatmapActive = state.u.v;
                    if (state.u.v) {
                        this.applyValueHeatmap();
                    } else {
                        this.removeValueHeatmap();
                    }
                }
                
                const toggleTileArt = document.getElementById('toggleTileArt');
                if (toggleTileArt && state.u.ta !== undefined) {
                    toggleTileArt.checked = state.u.ta;
                    const mapContainer = document.querySelector('.map-container');
                    if (mapContainer) {
                        if (state.u.ta) {
                            mapContainer.classList.remove('hide-tile-art');
                            document.body.classList.remove('hide-tile-art');
                        } else {
                            mapContainer.classList.add('hide-tile-art');
                            document.body.classList.add('hide-tile-art');
                        }
                    }
                    
                    // Apply tile art visibility to all tiles
                    const regularHexes = document.querySelectorAll('.hex:not(.hex-hyperlane):not(.hex-hyperlane-83A):not(.hex-hyperlane-86A):not(.hex-center):not(.hex-player)');
                    regularHexes.forEach(hex => {
                        const tileId = hex.getAttribute('data-tile-id');
                        if (tileId) {
                            if (state.u.ta) {
                                // Show tile image
                                const imagePath = `img/tiles/ST_${tileId}.png`;
                                hex.style.setProperty('background-image', `url('${imagePath}')`, 'important');
                                hex.style.setProperty('background-size', 'cover', 'important');
                                hex.style.setProperty('background-position', 'center', 'important');
                                hex.style.setProperty('background-repeat', 'no-repeat', 'important');
                            } else {
                                // Hide tile image but restore ring color
                                hex.style.setProperty('background-image', 'none', 'important');
                                if (hex.classList.contains('hex-inner')) {
                                    hex.style.setProperty('background', 'radial-gradient(circle, #44bfff 0%, #0099dd 100%)', 'important');
                                    hex.style.setProperty('box-shadow', '0 0 15px rgba(68, 191, 255, 0.4)', 'important');
                                } else if (hex.classList.contains('hex-middle')) {
                                    hex.style.setProperty('background', 'radial-gradient(circle, #4488ff 0%, #0044bb 100%)', 'important');
                                    hex.style.setProperty('box-shadow', '0 0 15px rgba(68, 136, 255, 0.4)', 'important');
                                } else if (hex.classList.contains('hex-outer')) {
                                    hex.style.setProperty('background', 'radial-gradient(circle, #3366bb 0%, #002288 100%)', 'important');
                                    hex.style.setProperty('box-shadow', '0 0 15px rgba(51, 102, 187, 0.4)', 'important');
                                } else if (hex.classList.contains('hex-outermost')) {
                                    hex.style.setProperty('background', 'radial-gradient(circle, #224488 0%, #001155 100%)', 'important');
                                    hex.style.setProperty('box-shadow', '0 0 15px rgba(34, 68, 136, 0.4)', 'important');
                                }
                            }
                        }
                    });
                    
                    // Handle alternate tile placeholder
                    const alternatePlaceholder = document.querySelector('.placeholder-hex');
                    if (alternatePlaceholder && alternatePlaceholder.classList.contains('has-tile-image')) {
                        if (!state.u.ta) {
                            alternatePlaceholder.style.setProperty('background', 'radial-gradient(circle, #3366bb 0%, #002288 100%)', 'important');
                            alternatePlaceholder.style.setProperty('box-shadow', '0 0 15px rgba(51, 102, 187, 0.4)', 'important');
                        } else {
                            alternatePlaceholder.style.removeProperty('background');
                            alternatePlaceholder.style.removeProperty('box-shadow');
                        }
                    }
                }
            }
            
            console.log('Map state loaded from URL');
            this.showNotification('Map state loaded from shared link');
            
            // Clear the URL parameter to avoid reloading the same state on refresh
            const url = new URL(window.location.href);
            url.searchParams.delete('state');
            window.history.replaceState({}, document.title, url.toString());
            
            return true;
        } catch (error) {
            console.error('Error loading state from URL:', error);
            return false;
        }
    }
    
    // Show a notification message
TI4Map.prototype.showNotification = function(message) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('mapNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'mapNotification';
            notification.className = 'map-notification';
            document.body.appendChild(notification);
        }
        
        // Set message and show
        notification.textContent = message;
        notification.classList.add('show');
        
        // Hide after a delay
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Show a modal with the shareable link
TI4Map.prototype.showShareableLinkModal = function(link) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('shareableLinkModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'shareableLinkModal';
            modal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            const closeButton = document.createElement('span');
            closeButton.className = 'close-button';
            closeButton.innerHTML = '&times;';
            closeButton.onclick = () => modal.style.display = 'none';
            
            const title = document.createElement('h2');
            title.textContent = 'Shareable Link';
            
            const linkContainer = document.createElement('div');
            linkContainer.className = 'shareable-link-container';
            
            const linkInput = document.createElement('input');
            linkInput.type = 'text';
            linkInput.id = 'shareableLinkInput';
            linkInput.readOnly = true;
            linkInput.value = link;
            
            const copyButton = document.createElement('button');
            copyButton.className = 'action-button';
            copyButton.textContent = 'Copy';
            copyButton.onclick = () => {
                linkInput.select();
                document.execCommand('copy');
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            };
            
            linkContainer.appendChild(linkInput);
            linkContainer.appendChild(copyButton);
            
            modalContent.appendChild(closeButton);
            modalContent.appendChild(title);
            modalContent.appendChild(linkContainer);
            modal.appendChild(modalContent);
            
            document.body.appendChild(modal);
        } else {
            // Update link if modal already exists
            document.getElementById('shareableLinkInput').value = link;
        }
        
        // Show the modal
        modal.style.display = 'block';
    }

// Menu and Toggle Controls
document.addEventListener('DOMContentLoaded', () => {
    // Toggle menu visibility
    const menuToggle = document.getElementById('menuToggle');
    const mainMenu = document.getElementById('mainMenu');
    
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mainMenu.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mainMenu.contains(e.target) && e.target !== menuToggle) {
            mainMenu.classList.remove('show');
        }    });
    
    // Toggle player numbers visibility
    const togglePlayerSlices = document.getElementById('togglePlayerSlices');
    const mapContainer = document.querySelector('.map-container');
    
    togglePlayerSlices.addEventListener('change', () => {
        if (togglePlayerSlices.checked) {
            mapContainer.classList.remove('hide-player-numbers');
        } else {
            mapContainer.classList.add('hide-player-numbers');
        }
    });
    
    // Initialize the map
    window.ti4Map = new TI4Map();
    console.log('TI4 Map initialized and ready for tile placement');
    
    // Check for state in URL parameters
    window.ti4Map.loadStateFromURL();
    
    // Initialize tile info overlay after map is created
    window.ti4Map.initializeTileInfoOverlay();
    
    // Initialize tile numbers toggle after map is created
    window.ti4Map.initializeTileNumbersToggle();
    
    // Initialize value heatmap toggle after map is created
    window.ti4Map.initializeValueHeatmapToggle();
    
    // Initialize tile art toggle after map is created
    window.ti4Map.initializeTileArtToggle();
    
    // Add Random Fill Universe functionality
    const randomFillButton = document.getElementById('randomFillButton');
    if (randomFillButton) {
        randomFillButton.addEventListener('click', () => {
            window.ti4Map.randomFillUniverse();
        });
    }
    
    // Add Clear Universe functionality
    const clearUniverseButton = document.getElementById('clearUniverseButton');
    if (clearUniverseButton) {
        clearUniverseButton.addEventListener('click', () => {
            window.ti4Map.clearUniverse();
        });
    }
    
    // Add Save State functionality
    const saveStateButton = document.getElementById('saveStateButton');
    if (saveStateButton) {
        saveStateButton.addEventListener('click', () => {
            window.ti4Map.saveStateToLocalStorage();
        });
    }
    
    // Add Load State functionality
    const loadStateButton = document.getElementById('loadStateButton');
    if (loadStateButton) {
        loadStateButton.addEventListener('click', () => {
            window.ti4Map.loadStateFromLocalStorage();
        });
    }
    
    // Add Share Map functionality
    const shareMapButton = document.getElementById('shareMapButton');
    if (shareMapButton) {
        shareMapButton.addEventListener('click', () => {
            window.ti4Map.generateShareableLink();
        });
    }
});
