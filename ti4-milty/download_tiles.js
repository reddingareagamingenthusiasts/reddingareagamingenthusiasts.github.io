const https = require('https');
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

console.log(`Downloading ${tileIds.length} tile images...`);

// Function to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download each tile image
async function downloadTiles() {
  for (const tileId of tileIds) {
    const url = `https://raw.githubusercontent.com/shenanigans-be/miltydraft/main/img/tiles/${tileId}.png`;
    const filePath = path.join(tilesDir, `${tileId}.png`);
    
    console.log(`Downloading tile ${tileId}...`);
    
    try {
      await downloadFile(url, filePath);
      console.log(`Successfully downloaded tile ${tileId}`);
    } catch (error) {
      console.error(`Error downloading tile ${tileId}: ${error.message}`);
    }
  }
  
  console.log('Download process completed.');
}

downloadTiles();
