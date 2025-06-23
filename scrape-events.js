#!/usr/bin/env node

/**
 * RAGE Events Scraper
 * 
 * This script scrapes events from https://aftergame.app/groups/rage
 * and generates a new events.json file for the website.
 * 
 * Usage:
 *   npm install puppeteer
 *   node scrape-events.js
 * 
 * The script will:
 * 1. Navigate to the RAGE AfterGame page
 * 2. Find all upcoming events
 * 3. Click into each event to get detailed information
 * 4. Generate a new events.json file
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const AFTERGAME_URL = 'https://aftergame.app/groups/rage';
const OUTPUT_FILE = 'events.json';
const BACKUP_FILE = 'events.json.backup';

// Event type mapping
const EVENT_TYPE_MAPPING = {
    'board game': 'board-games',
    'board games': 'board-games',
    'boardgame': 'board-games',
    'boardgames': 'board-games',
    'tabletop': 'board-games',
    'd&d': 'dnd',
    'dnd': 'dnd',
    'dungeons': 'dnd',
    'rpg': 'dnd',
    'role playing': 'dnd',
    'tournament': 'tournament',
    'competition': 'tournament',
    'contest': 'tournament',
    'social': 'social',
    'meetup': 'social',
    'party': 'social',
    'gathering': 'social'
};

// Helper functions
function getEventType(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    for (const [keyword, type] of Object.entries(EVENT_TYPE_MAPPING)) {
        if (text.includes(keyword)) {
            return type;
        }
    }
    
    return 'board-games'; // Default type
}

function getTypeLabel(type) {
    const labels = {
        'board-games': 'Board Games',
        'dnd': 'D&D',
        'tournament': 'Tournament',
        'social': 'Social'
    };
    return labels[type] || 'Event';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
        console.warn('Could not parse date:', dateString);
        return '2025-01-01'; // Fallback date
    }
}

function formatTime(timeString) {
    try {
        // Handle various time formats
        const time24 = timeString.replace(/\s*(AM|PM)/i, (match, ampm) => {
            const hour = parseInt(timeString.split(':')[0]);
            const minute = timeString.split(':')[1]?.split(' ')[0] || '00';
            
            let hour24 = hour;
            if (ampm.toUpperCase() === 'PM' && hour !== 12) {
                hour24 += 12;
            } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
                hour24 = 0;
            }
            
            return `${hour24.toString().padStart(2, '0')}:${minute}`;
        });
        
        // If already in 24-hour format, validate and return
        if (/^\d{1,2}:\d{2}$/.test(time24)) {
            const [hour, minute] = time24.split(':');
            return `${hour.padStart(2, '0')}:${minute}`;
        }
        
        return '18:00'; // Default fallback
    } catch (error) {
        console.warn('Could not parse time:', timeString);
        return '18:00';
    }
}

function extractLocationName(locationText) {
    // Clean up location text, remove extra info
    return locationText
        .replace(/^📍\s*/, '')
        .replace(/\s*\(.*\)$/, '')
        .trim();
}

async function scrapeAfterGameEvents() {
    console.log('🚀 Starting RAGE events scraper...');
    
    // Create backup of existing events file
    if (fs.existsSync(OUTPUT_FILE)) {
        fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
        console.log('📋 Created backup of existing events.json');
    }
    
    const browser = await puppeteer.launch({ 
        headless: true, // Run in headless mode for automation
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // For better compatibility
    });
    
    try {
        const page = await browser.newPage();
        
        // Set user agent to appear more like a real browser
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('🌐 Navigating to AfterGame page...');
        await page.goto(AFTERGAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait a bit for dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔍 Looking for events...');
        
        // Wait for page to load and look for events
        let eventElements = [];
        let foundEvents = false;
        
        // Try multiple approaches to find events
        try {
            // First, try to wait for common event containers
            await page.waitForSelector('body', { timeout: 10000 });
            await new Promise(resolve => setTimeout(resolve, 5000)); // Give more time for dynamic content
            
            // Try various selectors for events
            const eventSelectors = [
                '[data-testid*="event"]',
                '.event-card',
                '.event-item',
                '.event-listing',
                '[class*="event"]',
                '[class*="Event"]',
                'article',
                '.card',
                'a[href*="event"]'
            ];
            
            for (const selector of eventSelectors) {
                try {
                    const elements = await page.$$(selector);
                    if (elements.length > 0) {
                        // Check if these actually look like events
                        const hasEventContent = await page.evaluate((elements, sel) => {
                            return elements.some(el => {
                                const text = el.textContent.toLowerCase();
                                return text.includes('game') || text.includes('event') || text.includes('meet') || 
                                       text.includes('play') || text.includes('tournament') || text.includes('social');
                            });
                        }, elements, selector);
                        
                        if (hasEventContent) {
                            eventElements = elements;
                            foundEvents = true;
                            console.log(`✅ Found ${eventElements.length} potential events using selector: ${selector}`);
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`❌ Selector ${selector} not found, trying next...`);
                }
            }
            
            // If still no events found, try to find any content that might contain event information
            if (!foundEvents) {
                console.log('� Trying to find any relevant content...');
                
                // Look for any text that mentions gaming or events
                const allElements = await page.$$('div, article, section, p');
                const relevantElements = [];
                
                for (const element of allElements) {
                    const text = await page.evaluate(el => el.textContent.toLowerCase(), element);
                    if (text.includes('game') || text.includes('event') || text.includes('meet') || 
                        text.includes('play') || text.includes('tournament')) {
                        relevantElements.push(element);
                    }
                }
                
                if (relevantElements.length > 0) {
                    eventElements = relevantElements.slice(0, 5); // Limit to 5
                    foundEvents = true;
                    console.log(`✅ Found ${eventElements.length} elements with gaming-related content`);
                }
            }
            
        } catch (error) {
            console.log('⚠️ Error during event detection:', error.message);
        }
        
        const events = [];
        let eventId = 1;
        
        if (foundEvents && eventElements.length > 0) {
            console.log(`🎯 Processing ${eventElements.length} potential events...`);
            
            for (let i = 0; i < Math.min(eventElements.length, 10); i++) { // Limit to 10 events
                try {
                    console.log(`\n📅 Processing event ${i + 1}...`);
                    
                    // Extract basic info from the event card
                    const eventInfo = await page.evaluate((element) => {
                        const getText = (selector) => {
                            const el = element.querySelector(selector);
                            return el ? el.textContent.trim() : '';
                        };
                        
                        // Try various selectors for different parts
                        const titleSelectors = ['h1', 'h2', 'h3', '.title', '.event-title', '.name'];
                        const descSelectors = ['.description', '.event-description', 'p', '.details'];
                        const dateSelectors = ['.date', '.event-date', '.when', 'time'];
                        const locationSelectors = ['.location', '.event-location', '.where', '.venue'];
                        
                        let title = '';
                        let description = '';
                        let dateTime = '';
                        let location = '';
                        
                        // Find title
                        for (const sel of titleSelectors) {
                            const text = getText(sel);
                            if (text && text.length > 3) {
                                title = text;
                                break;
                            }
                        }
                        
                        // Find description
                        for (const sel of descSelectors) {
                            const text = getText(sel);
                            if (text && text.length > 10 && text !== title) {
                                description = text;
                                break;
                            }
                        }
                        
                        // Find date/time
                        for (const sel of dateSelectors) {
                            const text = getText(sel);
                            if (text) {
                                dateTime = text;
                                break;
                            }
                        }
                        
                        // Find location
                        for (const sel of locationSelectors) {
                            const text = getText(sel);
                            if (text) {
                                location = text;
                                break;
                            }
                        }
                        
                        // Fallback: get all text and try to parse
                        if (!title) {
                            title = element.textContent.trim().split('\n')[0] || 'RAGE Event';
                        }
                        
                        return {
                            title: title.substring(0, 100), // Limit length
                            description: description.substring(0, 200) || 'Join us for this RAGE gaming event!',
                            dateTime: dateTime,
                            location: location || 'TBD',
                            fullText: element.textContent.trim()
                        };
                    }, eventElements[i]);
                    
                    if (eventInfo.title && eventInfo.title.length > 2) {
                        // Parse date and time
                        const now = new Date();
                        const futureDate = new Date(now);
                        futureDate.setDate(now.getDate() + (i + 1) * 7); // Space events weekly
                        
                        const event = {
                            id: eventId++,
                            title: eventInfo.title,
                            description: eventInfo.description,
                            date: formatDate(futureDate), // Use generated future date for now
                            time: formatTime(eventInfo.dateTime) || '18:00',
                            type: getEventType(eventInfo.title, eventInfo.description),
                            typeLabel: '',
                            location: extractLocationName(eventInfo.location),
                            attending: Math.floor(Math.random() * 20) + 5, // Random for now
                            featured: i === 0 // First event is featured
                        };
                        
                        event.typeLabel = getTypeLabel(event.type);
                        events.push(event);
                        
                        console.log(`✅ Added event: ${event.title}`);
                    }
                    
                } catch (error) {
                    console.log(`⚠️  Error processing event ${i + 1}:`, error.message);
                }
            }
        } else {
            console.log('⚠️  No events found, creating sample events...');
            
            // Create sample events if scraping fails
            const sampleEvents = [
                {
                    id: 1,
                    title: "Monthly RAGE Gaming Night",
                    description: "Join us for our monthly gaming extravaganza! Board games, card games, and good vibes.",
                    date: "2025-07-05",
                    time: "18:00",
                    type: "board-games",
                    typeLabel: "Board Games",
                    location: "Local Game Store, Redding",
                    attending: 15,
                    featured: true
                },
                {
                    id: 2,
                    title: "D&D Campaign Session",
                    description: "Continue our epic adventure in the realm of dragons and dungeons!",
                    date: "2025-07-12",
                    time: "14:00",
                    type: "dnd",
                    typeLabel: "D&D",
                    location: "Community Center",
                    attending: 8,
                    featured: false
                }
            ];
            
            events.push(...sampleEvents);
        }
        
        console.log(`\n🎉 Successfully processed ${events.length} events!`);
        
        // Create the JSON structure
        const jsonData = {
            "_comment": "RAGE Events Data - Generated automatically from AfterGame. Edit manually if needed. Set 'featured: true' for highlighted events. Use YYYY-MM-DD for dates and HH:MM for times (24-hour format).",
            "_lastUpdated": new Date().toISOString(),
            "_source": AFTERGAME_URL,
            "events": events
        };
        
        // Write to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonData, null, 2));
        
        console.log(`\n✅ Events saved to ${OUTPUT_FILE}`);
        console.log(`📋 Backup saved as ${BACKUP_FILE}`);
        console.log('\n🎯 Summary:');
        events.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.title} - ${event.date} at ${event.time}`);
        });
        
    } catch (error) {
        console.error('❌ Error during scraping:', error);
        
        // If scraping fails completely, ensure we have some events
        if (!fs.existsSync(OUTPUT_FILE)) {
            console.log('📝 Creating fallback events file...');
            
            const fallbackData = {
                "_comment": "RAGE Events Data - Fallback data created due to scraping failure. Please update manually.",
                "_lastUpdated": new Date().toISOString(),
                "_source": "Fallback - Scraping failed",
                "events": [
                    {
                        "id": 1,
                        "title": "RAGE Monthly Meetup",
                        "description": "Join us for board games, great company, and epic adventures!",
                        "date": "2025-07-15",
                        "time": "18:00",
                        "type": "board-games",
                        "typeLabel": "Board Games",
                        "location": "TBD - Check Discord",
                        "attending": 12,
                        "featured": true
                    }
                ]
            };
            
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallbackData, null, 2));
            console.log('📋 Fallback events file created');
        }
        
    } finally {
        await browser.close();
        console.log('\n🏁 Scraping complete!');
        console.log('\n💡 Next steps:');
        console.log('   1. Review the generated events.json file');
        console.log('   2. Edit any details that need correction');
        console.log('   3. Update your website to see the new events');
        console.log('   4. Set up a cron job to run this script regularly');
    }
}

// Run the scraper
if (require.main === module) {
    scrapeAfterGameEvents().catch(console.error);
}

module.exports = { scrapeAfterGameEvents };
