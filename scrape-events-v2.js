#!/usr/bin/env node

/**
 * RAGE Events Scraper - Improved Version
 * 
 * This script attempts to scrape events from AfterGame, but includes
 * better fallback mechanisms and manual event templates.
 * 
 * Usage:
 *   npm install puppeteer
 *   node scrape-events-v2.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const AFTERGAME_URL = 'https://aftergame.app/groups/rage';
const OUTPUT_FILE = 'events.json';
const BACKUP_FILE = 'events.json.backup';

// Enhanced event templates for manual use
const EVENT_TEMPLATES = {
    "weekly_board_games": {
        "title": "Weekly Board Game Night",
        "description": "Join us for our weekly board game meetup! Bring your favorites or try something new from our collection.",
        "type": "board-games",
        "typeLabel": "Board Games",
        "time": "18:00",
        "location": "Local Game Store, Redding",
        "recurring": "weekly"
    },
    "monthly_social": {
        "title": "Monthly RAGE Social",
        "description": "Monthly social gathering with games, food, and great company. Perfect for new members!",
        "type": "social",
        "typeLabel": "Social",
        "time": "19:00", 
        "location": "Community Center",
        "recurring": "monthly"
    },
    "dnd_campaign": {
        "title": "D&D Campaign Session",
        "description": "Continue our ongoing D&D adventure! New players welcome.",
        "type": "dnd",
        "typeLabel": "D&D",
        "time": "14:00",
        "location": "Member's House",
        "recurring": "bi-weekly"
    },
    "tournament": {
        "title": "Board Game Tournament",
        "description": "Competitive tournament with prizes! Test your skills against other RAGE members.",
        "type": "tournament", 
        "typeLabel": "Tournament",
        "time": "12:00",
        "location": "Local Game Store, Redding",
        "recurring": "monthly"
    }
};

function generateUpcomingEvents() {
    console.log('🎲 Generating sample upcoming events...');
    
    const events = [];
    const now = new Date();
    let eventId = 1;
    
    // Generate next 8 weeks of events
    for (let week = 0; week < 8; week++) {
        const weekDate = new Date(now);
        weekDate.setDate(now.getDate() + (week * 7));
        
        // Weekly board games (every Friday)
        const friday = new Date(weekDate);
        const dayOfWeek = friday.getDay();
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
        friday.setDate(friday.getDate() + daysUntilFriday);
        
        if (friday > now) {
            const template = EVENT_TEMPLATES.weekly_board_games;
            events.push({
                id: eventId++,
                title: template.title,
                description: template.description,
                date: friday.toISOString().split('T')[0],
                time: template.time,
                type: template.type,
                typeLabel: template.typeLabel,
                location: template.location,
                attending: Math.floor(Math.random() * 15) + 8,
                featured: events.length === 0 // First event is featured
            });
        }
        
        // D&D every other Saturday
        if (week % 2 === 0) {
            const saturday = new Date(friday);
            saturday.setDate(friday.getDate() + 1);
            
            if (saturday > now) {
                const template = EVENT_TEMPLATES.dnd_campaign;
                events.push({
                    id: eventId++,
                    title: template.title,
                    description: template.description,
                    date: saturday.toISOString().split('T')[0],
                    time: template.time,
                    type: template.type,
                    typeLabel: template.typeLabel,
                    location: template.location,
                    attending: Math.floor(Math.random() * 8) + 4,
                    featured: false
                });
            }
        }
        
        // Monthly social (first Saturday of month)
        if (week === 0 || (friday.getDate() <= 7 && friday.getMonth() !== now.getMonth())) {
            const firstSat = new Date(friday);
            firstSat.setDate(friday.getDate() + 1);
            
            if (firstSat > now) {
                const template = EVENT_TEMPLATES.monthly_social;
                events.push({
                    id: eventId++,
                    title: template.title,
                    description: template.description,
                    date: firstSat.toISOString().split('T')[0],
                    time: template.time,
                    type: template.type,
                    typeLabel: template.typeLabel,
                    location: template.location,
                    attending: Math.floor(Math.random() * 20) + 12,
                    featured: false
                });
            }
        }
        
        // Monthly tournament (third Saturday)
        if (week === 2) {
            const thirdSat = new Date(friday);
            thirdSat.setDate(friday.getDate() + 15); // Third Saturday
            
            if (thirdSat > now) {
                const template = EVENT_TEMPLATES.tournament;
                events.push({
                    id: eventId++,
                    title: `${['Catan', 'Ticket to Ride', 'Splendor', 'Azul'][Math.floor(Math.random() * 4)]} Tournament`,
                    description: template.description,
                    date: thirdSat.toISOString().split('T')[0],
                    time: template.time,
                    type: template.type,
                    typeLabel: template.typeLabel,
                    location: template.location,
                    attending: Math.floor(Math.random() * 12) + 6,
                    featured: false
                });
            }
        }
    }
    
    // Sort by date and limit to 10 events
    events.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    return events.slice(0, 10);
}

async function attemptScraping() {
    console.log('🕷️ Attempting to scrape AfterGame...');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        defaultViewport: { width: 1200, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('🌐 Loading AfterGame page...');
        await page.goto(AFTERGAME_URL, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'aftergame-screenshot.png', fullPage: false });
        console.log('📸 Screenshot saved for debugging');
        
        // Try to find actual event content
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Look for event-specific patterns
        const eventInfo = await page.evaluate(() => {
            const events = [];
            
            // Look for common event indicators
            const eventIndicators = [
                'upcoming', 'event', 'meetup', 'gathering', 'tournament', 'game night', 'play'
            ];
            
            // Get all text content and look for dates and event-like content
            const allText = document.body.innerText.toLowerCase();
            const lines = allText.split('\n').filter(line => line.trim().length > 0);
            
            for (const line of lines) {
                for (const indicator of eventIndicators) {
                    if (line.includes(indicator) && line.length > 10 && line.length < 200) {
                        // Check if this line contains date-like patterns
                        const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2}|\d{1,2}-\d{1,2})/i;
                        if (datePattern.test(line) || line.includes('tonight') || line.includes('tomorrow') || line.includes('this week')) {
                            events.push({
                                text: line.trim(),
                                type: indicator
                            });
                        }
                    }
                }
            }
            
            return {
                events: events.slice(0, 5), // Limit to 5
                pageTitle: document.title,
                hasEvents: events.length > 0
            };
        });
        
        await browser.close();
        
        if (eventInfo.hasEvents) {
            console.log(`✅ Found ${eventInfo.events.length} potential events from scraping`);
            return eventInfo.events;
        } else {
            console.log('⚠️ No clear events found during scraping');
            return null;
        }
        
    } catch (error) {
        console.log('❌ Scraping failed:', error.message);
        await browser.close();
        return null;
    }
}

async function main() {
    console.log('🚀 Starting RAGE Events Generator...');
    
    // Create backup
    if (fs.existsSync(OUTPUT_FILE)) {
        fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
        console.log('📋 Created backup of existing events.json');
    }
    
    // Try scraping first
    const scrapedEvents = await attemptScraping();
    
    let events = [];
    let source = "Generated - Smart templates";
    
    if (scrapedEvents && scrapedEvents.length > 0) {
        // If we got some scraped data, try to parse it into events
        console.log('🔄 Processing scraped data...');
        // For now, fall back to generated events since scraping isn't perfect
        events = generateUpcomingEvents();
        source = "Generated - Scraping incomplete, using templates";
    } else {
        // Generate smart event schedule
        events = generateUpcomingEvents();
    }
    
    // Create the JSON structure
    const jsonData = {
        "_comment": "RAGE Events Data - Smart generated events based on typical gaming group patterns. Edit manually as needed. Set 'featured: true' for highlighted events. Use YYYY-MM-DD for dates and HH:MM for times (24-hour format).",
        "_instructions": "To customize events: 1) Update dates/times manually, 2) Change titles and descriptions, 3) Set featured events, 4) Update locations to match your venues",
        "_templates": EVENT_TEMPLATES,
        "_lastUpdated": new Date().toISOString(),
        "_source": source,
        "events": events
    };
    
    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonData, null, 2));
    
    console.log(`\n✅ Events saved to ${OUTPUT_FILE}`);
    console.log(`📋 Backup saved as ${BACKUP_FILE}`);
    console.log('\n🎯 Generated Events:');
    events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title} - ${event.date} at ${event.time}`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('   1. Review and customize the generated events.json file');
    console.log('   2. Update dates, times, and locations as needed');
    console.log('   3. Set which events should be featured');
    console.log('   4. Your website will automatically show the updated events');
    console.log('\n🎲 Pro tip: Use the _templates section as a guide for creating new events!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateUpcomingEvents, EVENT_TEMPLATES };
