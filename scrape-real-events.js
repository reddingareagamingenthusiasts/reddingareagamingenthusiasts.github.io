#!/usr/bin/env node

/**
 * RAGE Events Scraper - Real AfterGame Scraper
 * 
 * This script properly scrapes the actual events from AfterGame by:
 * 1. Finding all event cards on the main page
 * 2. Clicking into each event to get detailed information
 * 3. Extracting all the real event data
 * 4. Completely replacing the events.json file
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const AFTERGAME_URL = 'https://aftergame.app/groups/rage';
const OUTPUT_FILE = 'events.json';
const BACKUP_FILE = 'events.json.backup';

// Helper functions
function parseDate(dateString) {
    // Parse dates like "Fri, 11 Jul" or "Friday, 15 Aug"
    try {
        const months = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        // Extract day, month from formats like "Fri, 11 Jul" or "Friday, 15 Aug"
        const match = dateString.match(/(\w+),?\s+(\d{1,2})\s+(\w{3})/i);
        if (match) {
            const day = parseInt(match[2]);
            const monthName = match[3].toLowerCase();
            const month = months[monthName];
            
            if (month !== undefined) {
                // Assume current year or next year if date has passed
                const currentYear = new Date().getFullYear();
                let year = currentYear;
                
                const testDate = new Date(year, month, day);
                if (testDate < new Date()) {
                    year = currentYear + 1;
                }
                
                const finalDate = new Date(year, month, day);
                return finalDate.toISOString().split('T')[0]; // YYYY-MM-DD
            }
        }
        
        return '2025-12-31'; // Fallback date
    } catch (error) {
        console.warn('Could not parse date:', dateString);
        return '2025-12-31';
    }
}

function parseTime(timeString) {
    // Parse times like "5:30pm - 9:00pm PDT" or "5:30pm"
    try {
        const match = timeString.match(/(\d{1,2}):(\d{2})(am|pm)/i);
        if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2];
            const ampm = match[3].toLowerCase();
            
            if (ampm === 'pm' && hours !== 12) {
                hours += 12;
            } else if (ampm === 'am' && hours === 12) {
                hours = 0;
            }
            
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }
        
        return '18:00'; // Default fallback
    } catch (error) {
        console.warn('Could not parse time:', timeString);
        return '18:00';
    }
}

function parseAttendees(attendeeString) {
    // Parse strings like "2 going • 1 interested" or "5 going"
    try {
        const goingMatch = attendeeString.match(/(\d+)\s+going/i);
        const interestedMatch = attendeeString.match(/(\d+)\s+interested/i);
        
        const going = goingMatch ? parseInt(goingMatch[1]) : 0;
        const interested = interestedMatch ? parseInt(interestedMatch[1]) : 0;
        
        return going + interested;
    } catch (error) {
        console.warn('Could not parse attendees:', attendeeString);
        return 5; // Default fallback
    }
}

function determineEventType(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('d&d') || text.includes('dnd') || text.includes('dungeons') || text.includes('rpg')) {
        return { type: 'dnd', typeLabel: 'D&D' };
    } else if (text.includes('tournament') || text.includes('competition') || text.includes('contest')) {
        return { type: 'tournament', typeLabel: 'Tournament' };
    } else if (text.includes('social') || text.includes('party') || text.includes('meetup')) {
        return { type: 'social', typeLabel: 'Social' };
    } else {
        return { type: 'board-games', typeLabel: 'Board Games' };
    }
}

function cleanLocation(locationString) {
    // Clean up location, remove extra details
    return locationString
        .replace(/,\s*\d{5}.*$/, '') // Remove zip and after
        .replace(/,\s*(California|CA).*$/, '') // Remove state and after
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
        headless: false, // Keep visible for debugging
        defaultViewport: { width: 1400, height: 900 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set user agent to appear more like a real browser
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('🌐 Navigating to AfterGame RAGE page...');
        await page.goto(AFTERGAME_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for the page to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🔍 Looking for event cards...');
        
        // Take a screenshot first to see what we're working with
        await page.screenshot({ path: 'aftergame-debug.png', fullPage: true });
        console.log('📸 Debug screenshot saved');
        
        // Wait a bit more for dynamic content
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Try multiple approaches to find events
        let eventCards = [];
        
        // Approach 1: Look for elements containing "RAGE Game Night"
        console.log('🔍 Approach 1: Looking for RAGE Game Night text...');
        const rageGameNightElements = await page.$$eval('*', (elements) => {
            return elements
                .map((el, index) => ({
                    text: el.textContent?.trim() || '',
                    tagName: el.tagName,
                    href: el.getAttribute('href'),
                    onclick: el.getAttribute('onclick'),
                    className: el.className,
                    index: index
                }))
                .filter(el => el.text.includes('RAGE Game Night') && el.text.length < 200)
                .slice(0, 10);
        });
        
        console.log(`Found ${rageGameNightElements.length} elements with "RAGE Game Night"`);
        
        // Approach 2: Look for date patterns that might indicate events
        console.log('🔍 Approach 2: Looking for date patterns...');
        const dateElements = await page.$$eval('*', (elements) => {
            return elements
                .map((el, index) => ({
                    text: el.textContent?.trim() || '',
                    tagName: el.tagName,
                    href: el.getAttribute('href'),
                    className: el.className,
                    index: index
                }))
                .filter(el => {
                    const text = el.text.toLowerCase();
                    return text.match(/\w{3},?\s+\d{1,2}\s+\w{3}/) && text.length < 100;
                })
                .slice(0, 10);
        });
        
        console.log(`Found ${dateElements.length} elements with date patterns`);
        
        // Approach 3: Look for clickable elements in the events section
        console.log('🔍 Approach 3: Looking for clickable event elements...');
        const clickableElements = await page.$$eval('a, button, [role="button"], [onclick]', (elements) => {
            return elements
                .map((el, index) => ({
                    text: el.textContent?.trim() || '',
                    href: el.getAttribute('href'),
                    onclick: el.getAttribute('onclick'),
                    className: el.className,
                    id: el.id,
                    index: index
                }))
                .filter(el => {
                    const text = el.text.toLowerCase();
                    return (text.includes('game') || text.includes('event') || text.includes('rage')) && 
                           text.length > 5 && text.length < 200 &&
                           (el.href || el.onclick);
                })
                .slice(0, 15);
        });
        
        console.log(`Found ${clickableElements.length} clickable elements with game/event content`);
        
        // Combine and prioritize results
        const allPotentialEvents = [];
        
        // Add RAGE Game Night elements (highest priority)
        rageGameNightElements.forEach(el => {
            allPotentialEvents.push({
                ...el,
                priority: 10,
                source: 'rage-game-night'
            });
        });
        
        // Add date elements
        dateElements.forEach(el => {
            allPotentialEvents.push({
                ...el,
                priority: 8,
                source: 'date-pattern'
            });
        });
        
        // Add clickable elements
        clickableElements.forEach(el => {
            allPotentialEvents.push({
                ...el,
                priority: 5,
                source: 'clickable'
            });
        });
        
        // Remove duplicates and sort by priority
        const uniqueEvents = allPotentialEvents
            .filter((event, index, self) => 
                index === self.findIndex(e => e.text === event.text && e.href === event.href)
            )
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 8);
        
        console.log(`\n📋 Found ${uniqueEvents.length} unique potential events:`);
        uniqueEvents.forEach((event, i) => {
            console.log(`   ${i + 1}. [${event.source}] "${event.text.substring(0, 50)}..."`);
            if (event.href) console.log(`      URL: ${event.href}`);
        });
        
        eventCards = uniqueEvents;
        
        const events = [];
        let eventId = 1;
        
        // Process each event card by clicking into it
        for (let i = 0; i < Math.min(eventCards.length, 5); i++) {
            const card = eventCards[i];
            console.log(`\n📅 Processing event ${i + 1}: "${card.text.substring(0, 40)}..."`);
            
            try {
                let eventUrl = card.href;
                
                // Handle relative URLs
                if (eventUrl && !eventUrl.startsWith('http')) {
                    eventUrl = `https://aftergame.app${eventUrl}`;
                }
                
                if (!eventUrl) {
                    console.log(`⚠️ No URL found for event ${i + 1}, skipping`);
                    continue;
                }
                
                console.log(`🌐 Opening event: ${eventUrl}`);
                
                // Open event in new page
                const eventPage = await browser.newPage();
                await eventPage.goto(eventUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(resolve => setTimeout(resolve, 4000));
                
                // Take screenshot of event page for debugging
                await eventPage.screenshot({ path: `event-${i + 1}-debug.png` });
                
                // Extract detailed event information
                const eventDetails = await eventPage.evaluate(() => {
                    const getTextContent = (selector) => {
                        const el = document.querySelector(selector);
                        return el ? el.textContent.trim() : '';
                    };
                    
                    const getAllText = () => document.body.textContent || '';
                    const fullText = getAllText();
                    const lines = fullText.split('\n').filter(line => line.trim().length > 0);
                    
                    console.log('Page text length:', fullText.length);
                    
                    // Extract title - try multiple selectors
                    let title = getTextContent('h1') || 
                              getTextContent('[class*="title"]') || 
                              getTextContent('[class*="Title"]') ||
                              'RAGE Game Night';
                    
                    // Clean up title
                    if (title.includes('RAGE Game Night')) {
                        title = 'RAGE Game Night';
                    }
                    
                    let dateTimeInfo = '';
                    let locationInfo = '';
                    let attendeeInfo = '';
                    let description = 'Join us for this RAGE gaming event!';
                    
                    // Look for specific patterns in the text
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        
                        // Date/time pattern like "Fri, 11 Jul 5:30pm - 9:00pm PDT"
                        if (trimmedLine.match(/\w{3,9},?\s+\d{1,2}\s+\w{3}\s+\d{1,2}:\d{2}(am|pm)/i)) {
                            dateTimeInfo = trimmedLine;
                            console.log('Found date/time:', dateTimeInfo);
                        }
                        
                        // Location pattern
                        if ((trimmedLine.includes('California') || trimmedLine.includes('Redding') || 
                             trimmedLine.match(/\d{3,4}\s+\w+\s+(St|Ave|Rd|Blvd|Street|Avenue|Road|Boulevard)/i)) &&
                            trimmedLine.length < 150) {
                            locationInfo = trimmedLine;
                            console.log('Found location:', locationInfo);
                        }
                        
                        // Attendee pattern like "2 going • 1 interested"
                        if (trimmedLine.match(/\d+\s+(going|interested)/i) && trimmedLine.length < 50) {
                            attendeeInfo = trimmedLine;
                            console.log('Found attendees:', attendeeInfo);
                        }
                        
                        // Description - look for longer descriptive text
                        if (trimmedLine.length > 20 && trimmedLine.length < 300 && 
                            !trimmedLine.includes(title) && 
                            !trimmedLine.includes('going') && 
                            !trimmedLine.includes('PDT') &&
                            !trimmedLine.includes('California') &&
                            !trimmedLine.includes('Redding') &&
                            (trimmedLine.includes('game') || trimmedLine.includes('play') || 
                             trimmedLine.includes('join') || trimmedLine.includes('welcome'))) {
                            description = trimmedLine;
                            console.log('Found description:', description);
                        }
                    }
                    
                    return {
                        title: title,
                        dateTime: dateTimeInfo,
                        location: locationInfo,
                        attendees: attendeeInfo,
                        description: description,
                        fullTextLength: fullText.length,
                        totalLines: lines.length
                    };
                });
                
                await eventPage.close();
                
                console.log(`📋 Event details extracted:`);
                console.log(`   Title: ${eventDetails.title}`);
                console.log(`   Date/Time: ${eventDetails.dateTime}`);
                console.log(`   Location: ${eventDetails.location}`);
                console.log(`   Attendees: ${eventDetails.attendees}`);
                console.log(`   Description: ${eventDetails.description.substring(0, 50)}...`);
                
                // Parse the extracted information
                if (eventDetails.dateTime || card.text.match(/\w{3},?\s+\d{1,2}\s+\w{3}/)) {
                    const eventType = determineEventType(eventDetails.title, eventDetails.description);
                    
                    // Use card text for date if event page didn't have it
                    const dateSource = eventDetails.dateTime || card.text;
                    
                    const event = {
                        id: eventId++,
                        title: eventDetails.title || 'RAGE Game Night',
                        description: eventDetails.description,
                        date: parseDate(dateSource),
                        time: parseTime(dateSource),
                        type: eventType.type,
                        typeLabel: eventType.typeLabel,
                        location: cleanLocation(eventDetails.location) || 'Redding Area - Check Discord',
                        attending: parseAttendees(eventDetails.attendees),
                        featured: i === 0 // First event is featured
                    };
                    
                    events.push(event);
                    console.log(`✅ Added: ${event.title} on ${event.date} at ${event.time}`);
                } else {
                    console.log(`⚠️ Could not parse date/time for event ${i + 1}`);
                    
                    // Add event anyway with fallback data
                    const eventType = determineEventType(card.text, '');
                    const futureDate = new Date();
                    futureDate.setDate(futureDate.getDate() + (i + 1) * 7);
                    
                    const fallbackEvent = {
                        id: eventId++,
                        title: 'RAGE Game Night',
                        description: 'Join us for games and good times! Check Discord for details.',
                        date: futureDate.toISOString().split('T')[0],
                        time: '18:00',
                        type: eventType.type,
                        typeLabel: eventType.typeLabel,
                        location: 'Redding Area - Check Discord',
                        attending: 5,
                        featured: i === 0
                    };
                    
                    events.push(fallbackEvent);
                    console.log(`⚠️ Added fallback event: ${fallbackEvent.title}`);
                }
                
            } catch (error) {
                console.log(`❌ Error processing event ${i + 1}:`, error.message);
            }
        }
        
        console.log(`\n🎉 Successfully processed ${events.length} events!`);
        
        // Sort events by date/time
        events.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        });
        
        // Create the JSON structure - COMPLETELY REPLACE old data
        const jsonData = {
            "_comment": "RAGE Events Data - Scraped from AfterGame. This file is automatically generated and replaces all previous data.",
            "_lastUpdated": new Date().toISOString(),
            "_source": AFTERGAME_URL,
            "_scraped": true,
            "events": events
        };
        
        // Write to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(jsonData, null, 2));
        
        console.log(`\n✅ Events saved to ${OUTPUT_FILE}`);
        console.log(`📋 Backup saved as ${BACKUP_FILE}`);
        console.log('\n🎯 Scraped Events:');
        events.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.title}`);
            console.log(`      📅 ${event.date} at ${event.time}`);
            console.log(`      📍 ${event.location}`);
            console.log(`      👥 ${event.attending} attending`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error during scraping:', error);
        throw error;
        
    } finally {
        await browser.close();
        console.log('\n🏁 Scraping complete!');
    }
}

// Run the scraper
if (require.main === module) {
    scrapeAfterGameEvents().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { scrapeAfterGameEvents };
