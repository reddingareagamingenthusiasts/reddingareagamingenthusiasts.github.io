const fs = require('fs');
const path = require('path');

// Create the tiles directory if it doesn't exist
const tilesDir = path.join(__dirname, 'img', 'tiles');
if (!fs.existsSync(tilesDir)) {
  fs.mkdirSync(tilesDir, { recursive: true });
}

// Get all unique tile IDs from our slices
const slices = [
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

// Extract unique tile IDs
const tileIds = [...new Set(slices.flatMap(slice => slice.tiles))];

console.log(`Creating ${tileIds.length} placeholder SVG images...`);

// Function to create a placeholder SVG image
function createPlaceholderSVG(tileId) {
  // Generate a random color for each tile
  const hue = Math.floor(Math.random() * 360);
  const backgroundColor = `hsl(${hue}, 70%, 30%)`;
  const textColor = `hsl(${hue}, 70%, 80%)`;
  
  // Create an SVG with the tile ID
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <polygon points="100,10 190,50 190,150 100,190 10,150 10,50" fill="${backgroundColor}" stroke="#000" stroke-width="2" />
    <text x="100" y="110" font-family="Arial" font-size="36" font-weight="bold" fill="${textColor}" text-anchor="middle">${tileId}</text>
  </svg>`;
  
  return svg;
}

// Create placeholder images for each tile
for (const tileId of tileIds) {
  const filePath = path.join(tilesDir, `${tileId}.svg`);
  const svg = createPlaceholderSVG(tileId);
  
  fs.writeFileSync(filePath, svg);
  console.log(`Created placeholder for tile ${tileId}`);
}

console.log('All placeholder images created successfully.');
