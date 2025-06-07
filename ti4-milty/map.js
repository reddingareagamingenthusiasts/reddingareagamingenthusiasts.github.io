// Hex grid management
class TI4Map {    constructor() {
        this.selectedHex = null;
        this.currentTiles = {}; // Store tile assignments
        this.alternateTileId = null; // Store alternate tile ID        // Define faction tile coordinates for 9-player map
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
    }initializeEventListeners() {
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
                
                // Update basic info
                coordDisplay.textContent = `Position: ${position}`;
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
        
        // Prevent placing tiles on special hexes
        if (hex.classList.contains('hex-center')) {
            console.log('Cannot place tile on Mecatol Rex - it is hardcoded to tile 18');
            return;
        }
          if (hex.classList.contains('hex-hyperlane') || 
            hex.classList.contains('hex-hyperlane-83A') || 
            hex.classList.contains('hex-hyperlane-86A') || 
            hex.classList.contains('hex-player')) {
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
                // Image exists, set it as background with important styles
                hex.style.setProperty('background-image', `url('${imagePath}')`, 'important');
                hex.style.setProperty('background-size', 'cover', 'important');
                hex.style.setProperty('background-position', 'center', 'important');
                hex.style.setProperty('background-repeat', 'no-repeat', 'important');
                console.log(`Successfully loaded tile image: ${imagePath}`);
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
    }    // Method to fill the universe randomly
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

            // Get all fillable hexes
            const fillableHexes = this.getFillableHexes();
            
            if (fillableHexes.length === 0) {
                console.log('No fillable hexes found');
                button.textContent = originalText;
                button.disabled = false;
                return;
            }

            // Validate we have enough tiles
            if (fillableHexes.length > allAvailableTiles.length) {
                console.warn(`Not enough tiles with images (${allAvailableTiles.length}) for all fillable hexes (${fillableHexes.length})`);
                button.textContent = originalText;
                button.disabled = false;
                return;
            }

            // Clear existing tiles first
            this.clearUniverse();

            // Shuffle both hexes and tiles for completely random placement
            this.shuffleArray(fillableHexes);
            this.shuffleArray(allAvailableTiles);            // Randomly assign tiles to hexes
            for (let i = 0; i < fillableHexes.length && i < allAvailableTiles.length; i++) {
                const hex = fillableHexes[i];
                const tileId = allAvailableTiles[i];
                
                this.placeTile(hex.element, tileId);
                console.log(`Placed tile ${tileId} at position ${hex.position}`);
            }
            
            // Generate alternate tile if we have remaining tiles and alternate tile is enabled
            const toggleCheckbox = document.getElementById('toggleAlternateTile');
            if (toggleCheckbox && toggleCheckbox.checked && allAvailableTiles.length > fillableHexes.length) {
                // Use the next available tile as the alternate
                const alternateTileId = allAvailableTiles[fillableHexes.length];
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
        const alternateSlot = document.getElementById('alternateSlot');
        const alternateInfo = document.getElementById('alternateInfo');
        
        if (!alternateSlot || !alternateInfo) return;

        const tile = referenceTiles[tileId];
        if (!tile) return;

        this.alternateTileId = tileId;
        
        // Update the hex display
        const tileImage = `img/tiles/ST_${tileId}.png`;
        alternateSlot.innerHTML = `<img src="${tileImage}" alt="Tile ${tileId}" style="width: 100%; height: 100%; object-fit: cover;">`;
        
        // Update the info display
        const tileIdDisplay = alternateInfo.querySelector('.tile-id');
        const tileTypeDisplay = alternateInfo.querySelector('.tile-type');
        
        if (tileIdDisplay) tileIdDisplay.textContent = `Tile ID: ${tileId}`;
        if (tileTypeDisplay) tileTypeDisplay.textContent = `Type: ${tile.type || 'Unknown'}`;
        
        console.log(`Alternate tile set to: ${tileId}`);
    }

    // Clear the alternate tile placeholder
    clearAlternateTile() {
        const alternateSlot = document.getElementById('alternateSlot');
        const alternateInfo = document.getElementById('alternateInfo');
        
        if (!alternateSlot || !alternateInfo) return;

        this.alternateTileId = null;
        
        // Clear the hex display
        alternateSlot.innerHTML = '<div class="placeholder-text">No alternate tile</div>';
        
        // Clear the info display
        const tileIdDisplay = alternateInfo.querySelector('.tile-id');
        const tileTypeDisplay = alternateInfo.querySelector('.tile-type');
        
        if (tileIdDisplay) tileIdDisplay.textContent = 'Tile ID: -';
        if (tileTypeDisplay) tileTypeDisplay.textContent = 'Type: -';
        
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
        if (mapContainer) {
            if (show) {
                console.log('Adding show-tile-info class and creating overlays');
                mapContainer.classList.add('show-tile-info');
                this.createTileInfoOverlays();
            } else {
                console.log('Removing show-tile-info class and removing overlays');
                mapContainer.classList.remove('show-tile-info');
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
        if (mapContainer) {
            if (show) {
                mapContainer.classList.add('show-tile-numbers');
            } else {
                mapContainer.classList.remove('show-tile-numbers');
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
    }    // Create a single tile info overlay
    createTileInfoOverlay(hex, tileId) {
        console.log(`Creating tile info overlay for hex ${hex.getAttribute('data-position')} with tile ID ${tileId}`);
          // Don't add overlays to hyperlanes and player positions (but allow center hex since it has tile 18)
        const classes = hex.className;        if (classes.includes('hex-hyperlane') || 
            classes.includes('hex-hyperlane-83A') || 
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
            overlay.appendChild(wormholeIcon);        }

        hex.appendChild(overlay);
        console.log(`Successfully created tile info overlay for tile ${tileId}`);
    }// Update tile info overlay when a tile is placed
    updateTileInfoOverlay(hex, tileId) {
        // Remove existing overlay
        const existingOverlay = hex.querySelector('.tile-info-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }        // Always create new overlay if tileId is provided, regardless of current toggle state
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
    
    // Initialize tile info overlay after map is created
    window.ti4Map.initializeTileInfoOverlay();
    
    // Initialize tile numbers toggle after map is created
    window.ti4Map.initializeTileNumbersToggle();
    
    // Add Random Fill Universe functionality
    const randomFillButton = document.getElementById('randomFillButton');
    if (randomFillButton) {
        randomFillButton.addEventListener('click', () => {
            window.ti4Map.randomFillUniverse();
        });    }
    
    // Add Clear Universe functionality
    const clearUniverseButton = document.getElementById('clearUniverseButton');
    if (clearUniverseButton) {
        clearUniverseButton.addEventListener('click', () => {
            window.ti4Map.clearUniverse();
        });
    }
});
