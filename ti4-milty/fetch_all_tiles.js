const https = require('https');
const fs = require('fs');
const path = require('path');

// Create the tiles directory if it doesn't exist
const tilesDir = path.join(__dirname, 'img', 'tiles');
if (!fs.existsSync(tilesDir)) {
  fs.mkdirSync(tilesDir, { recursive: true });
}

// Function to make a GET request to the GitHub API
function fetchFromGitHub(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'TI4-Milty-Slice-Viewer'
      }
    };

    https.get(url, options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}: ${response.statusCode}`));
          return;
        }
        
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

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

// Main function to fetch all tile images
async function fetchAllTiles() {
  try {
    console.log('Fetching list of tiles from GitHub repository...');
    
    // Get the contents of the tiles directory
    const repoContents = await fetchFromGitHub('https://api.github.com/repos/shenanigans-be/miltydraft/contents/img/tiles');
    
    console.log(`Found ${repoContents.length} files in the tiles directory.`);
    
    // Filter for image files
    const imageFiles = repoContents.filter(file => 
      file.type === 'file' && 
      (file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.svg'))
    );
    
    console.log(`Found ${imageFiles.length} image files to download.`);
    
    // Download each image file
    for (const [index, file] of imageFiles.entries()) {
      const filePath = path.join(tilesDir, file.name);
      console.log(`[${index + 1}/${imageFiles.length}] Downloading ${file.name}...`);
      
      try {
        await downloadFile(file.download_url, filePath);
        console.log(`Successfully downloaded ${file.name}`);
      } catch (error) {
        console.error(`Error downloading ${file.name}: ${error.message}`);
      }
    }
    
    console.log('All tiles downloaded successfully!');
  } catch (error) {
    console.error(`Error fetching tiles: ${error.message}`);
  }
}

fetchAllTiles();
