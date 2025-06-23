#!/usr/bin/env node

/**
 * RAGE Events API Explorer
 * 
 * This script attempts to discover and use AfterGame's public API endpoints
 * to fetch event data for the RAGE group.
 */

const fs = require('fs');

// Configuration
const RAGE_GROUP_ID = 'rage'; // From the URL structure
const OUTPUT_FILE = 'events.json';
const BACKUP_FILE = 'events.json.backup';

// Common API endpoint patterns to try
const API_BASE_URLS = [
    'https://aftergame.app/api',
    'https://api.aftergame.app',
    'https://aftergame.app/api/v1',
    'https://aftergame.app/api/v2'
];

const ENDPOINT_PATTERNS = [
    '/groups/{groupId}/events',
    '/groups/{groupId}/games',
    '/events?group={groupId}',
    '/games?group={groupId}',
    '/groups/{groupId}',
    '/{groupId}/events',
    '/{groupId}/games'
];

async function testApiEndpoint(url) {
    try {
        console.log(`🔍 Testing: ${url}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            console.log(`   Content-Type: ${contentType}`);
            
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log(`   ✅ JSON Response (${JSON.stringify(data).length} chars)`);
                return { success: true, data, url };
            } else {
                const text = await response.text();
                console.log(`   📄 Text Response (${text.length} chars)`);
                if (text.length < 500) {
                    console.log(`   Preview: ${text.substring(0, 200)}...`);
                }
            }
        }
        
        return { success: false, status: response.status, url };
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { success: false, error: error.message, url };
    }
}

async function discoverApiEndpoints() {
    console.log('🕵️ Discovering AfterGame API endpoints...\n');
    
    const results = [];
    
    // Test various combinations
    for (const baseUrl of API_BASE_URLS) {
        for (const pattern of ENDPOINT_PATTERNS) {
            const url = baseUrl + pattern.replace('{groupId}', RAGE_GROUP_ID);
            const result = await testApiEndpoint(url);
            results.push(result);
            
            // Small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log('\n📊 Summary of API Discovery:');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful requests: ${successful.length}`);
    console.log(`❌ Failed requests: ${failed.length}`);
    
    if (successful.length > 0) {
        console.log('\n🎉 Working API endpoints found:');
        successful.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.url}`);
            console.log(`   Data preview: ${JSON.stringify(result.data).substring(0, 100)}...`);
        });
        
        return successful;
    } else {
        console.log('\n⚠️ No working API endpoints discovered with standard patterns.');
        return [];
    }
}

async function tryAlternativeDiscovery() {
    console.log('\n🔍 Trying alternative discovery methods...');
    
    // Method 1: Check if there's a robots.txt or sitemap that might reveal API paths
    const discoveryUrls = [
        'https://aftergame.app/robots.txt',
        'https://aftergame.app/sitemap.xml',
        'https://aftergame.app/.well-known/api'
    ];
    
    for (const url of discoveryUrls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const text = await response.text();
                console.log(`📄 Found ${url}:`);
                console.log(text.substring(0, 300) + '...');
            }
        } catch (error) {
            // Ignore errors for these discovery attempts
        }
    }
    
    // Method 2: Try GraphQL endpoint (common pattern)
    const graphqlUrls = [
        'https://aftergame.app/graphql',
        'https://api.aftergame.app/graphql',
        'https://aftergame.app/api/graphql'
    ];
    
    for (const url of graphqlUrls) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: '{ __schema { types { name } } }'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`🎯 GraphQL endpoint found at: ${url}`);
                console.log(`Schema types: ${data.data?.__schema?.types?.length || 0}`);
            }
        } catch (error) {
            // Ignore GraphQL errors
        }
    }
}

async function createManualEventTemplate() {
    console.log('\n📝 Creating manual event entry template...');
    
    // Based on the screenshots, create a template for manual data entry
    const manualTemplate = {
        "_comment": "RAGE Events Data - Manual entry based on AfterGame data. Update events below with real information from https://aftergame.app/groups/rage",
        "_instructions": [
            "1. Visit https://aftergame.app/groups/rage",
            "2. Click on each upcoming event to get details", 
            "3. Copy the information into the events array below",
            "4. Use the template structure provided"
        ],
        "_template": {
            "id": "number (increment for each event)",
            "title": "RAGE Game Night (or specific event title)",
            "description": "Event description from the event page",
            "date": "YYYY-MM-DD (e.g., 2025-07-11)",
            "time": "HH:MM (24-hour format, e.g., 17:30 for 5:30pm)",
            "type": "board-games|dnd|tournament|social",
            "typeLabel": "Board Games|D&D|Tournament|Social",
            "location": "Venue name and address (e.g., Fratelli's Pizza Parlour, 1774 California St, Redding)",
            "attending": "number (total going + interested)",
            "featured": "true|false (set first/most important event to true)"
        },
        "_realEventExamples": [
            {
                "note": "Based on your screenshots, here are the events I can see:",
                "event1": "RAGE Game Night - Fri, 11 Jul at 5:30pm PDT",
                "event2": "RAGE Game Night - Fri, 15 Aug at 5:30pm PDT", 
                "event3": "RAGE Game Night - Fri, 19 Sep at 5:30pm PDT",
                "location_example": "Fratelli's Pizza Parlour, 1774 California St, Redding 96001, California, United States",
                "attendee_example": "2 going • 1 interested = 3 total"
            }
        ],
        "_lastUpdated": new Date().toISOString(),
        "_source": "Manual entry from AfterGame",
        "events": [
            {
                "id": 1,
                "title": "RAGE Game Night",
                "description": "Join us for board games, card games, and great company! Whether you're a seasoned gamer or just starting out, you'll find a welcoming community at RAGE.",
                "date": "2025-07-11", 
                "time": "17:30",
                "type": "board-games",
                "typeLabel": "Board Games",
                "location": "Fratelli's Pizza Parlour, Redding",
                "attending": 3,
                "featured": true
            },
            {
                "id": 2,
                "title": "RAGE Game Night",
                "description": "Join us for board games, card games, and great company! Whether you're a seasoned gamer or just starting out, you'll find a welcoming community at RAGE.",
                "date": "2025-08-15",
                "time": "17:30", 
                "type": "board-games",
                "typeLabel": "Board Games",
                "location": "Fratelli's Pizza Parlour, Redding",
                "attending": 5,
                "featured": false
            },
            {
                "id": 3,
                "title": "RAGE Game Night", 
                "description": "Join us for board games, card games, and great company! Whether you're a seasoned gamer or just starting out, you'll find a welcoming community at RAGE.",
                "date": "2025-09-19",
                "time": "17:30",
                "type": "board-games", 
                "typeLabel": "Board Games",
                "location": "Fratelli's Pizza Parlour, Redding",
                "attending": 4,
                "featured": false
            }
        ]
    };
    
    return manualTemplate;
}

async function main() {
    console.log('🚀 RAGE Events API Discovery Tool\n');
    
    // Create backup
    if (fs.existsSync(OUTPUT_FILE)) {
        fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
        console.log('📋 Created backup of existing events.json\n');
    }
    
    // Try to discover API endpoints
    const apiResults = await discoverApiEndpoints();
    
    if (apiResults.length === 0) {
        // Try alternative discovery methods
        await tryAlternativeDiscovery();
        
        // Create manual template with data from screenshots
        console.log('\n📝 Since API discovery was unsuccessful, creating a manual entry template...');
        const manualTemplate = await createManualEventTemplate();
        
        // Write the manual template
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manualTemplate, null, 2));
        
        console.log(`\n✅ Manual template saved to ${OUTPUT_FILE}`);
        console.log('\n💡 Next steps:');
        console.log('   1. Visit https://aftergame.app/groups/rage');
        console.log('   2. Click on each upcoming event');
        console.log('   3. Copy the details into events.json');
        console.log('   4. Use the template structure provided in the file');
        console.log('\n🎯 I\'ve pre-filled some events based on your screenshots!');
        
    } else {
        // Process API results
        console.log('\n🎉 Found working API endpoints! Processing data...');
        
        // Use the first successful API result
        const bestResult = apiResults[0];
        const processedEvents = await processApiData(bestResult.data);
        
        const finalData = {
            "_comment": "RAGE Events Data - Retrieved from AfterGame API",
            "_lastUpdated": new Date().toISOString(),
            "_source": bestResult.url,
            "_apiDiscovered": true,
            "events": processedEvents
        };
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
        console.log(`\n✅ API data saved to ${OUTPUT_FILE}`);
    }
}

async function processApiData(apiData) {
    // This function would process the API response into our event format
    // Implementation depends on the actual API structure
    console.log('🔄 Processing API data...');
    return [];
}

// Run the discovery tool
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { discoverApiEndpoints, testApiEndpoint };
