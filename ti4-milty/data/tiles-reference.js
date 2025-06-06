// Mapping for tech specialty icons
const techSpecialtyIcons = {
    "biotic": "img/tech/biotic.webp",
    "propulsion": "img/tech/propulsion.webp",
    "cybernetic": "img/tech/cybernetic.webp",
    "warfare": "img/tech/warfare.webp"
};

// Mapping for wormhole icons
const wormholeIcons = {
    "alpha": "α",
    "beta": "β",
    "delta": "δ"
};

// Mapping for tech specialty colors
const techSpecialtyColors = {
    "biotic": "#1faa54", // Green
    "propulsion": "#3677c5", // Blue
    "cybernetic": "#e6c545", // Yellow
    "warfare": "#c82626" // Red
};

// This will be populated from reference-tiles.json
let referenceTileData = referenceTiles;


// Function to calculate total resources and influence for a tile based on its planets
function calculateTileTotals(tileId) {
    // Convert tileId to string if it's not already
    tileId = tileId.toString();
    
    if (!referenceTileData) {
        console.error('Reference tile data not loaded yet!');
        return { resources: 0, influence: 0, specialty: null, wormhole: null, type: 'red', anomaly: null };
    }
    
    
    if (!referenceTileData[tileId]) {
        console.warn(`Tile ID ${tileId} not found in reference data`);
        // For missing tiles, return a placeholder with type 'red' to show it properly
        return { resources: 0, influence: 0, specialty: null, wormhole: null, type: 'red', anomaly: 'Unknown' };
    }
    
    const tile = referenceTileData[tileId];
    
    const result = {
        resources: 0,
        influence: 0,
        specialty: null,
        wormhole: tile.wormhole,
        type: tile.type || 'blue', // Default to blue if type is not specified
        anomaly: tile.anomaly
    };
    
    // Sum up resources and influence from all planets in the tile
    if (tile.planets && tile.planets.length > 0) {
        tile.planets.forEach(planet => {
            // Make sure we're dealing with numbers
            const planetResources = typeof planet.resources === 'number' ? planet.resources : 0;
            const planetInfluence = typeof planet.influence === 'number' ? planet.influence : 0;
            
            result.resources += planetResources;
            result.influence += planetInfluence;
            
            // Take the first specialty we find
            if (planet.specialty && !result.specialty) {
                result.specialty = planet.specialty;
            }
        });
    }
    
    return result;
}




