#!/usr/bin/env node

/**
 * RAGE Event Updater - Interactive Tool
 * 
 * This tool helps you quickly update events.json with real data from AfterGame.
 * It provides prompts to enter event details manually.
 */

const readline = require('readline');
const fs = require('fs');

const OUTPUT_FILE = 'events.json';
const BACKUP_FILE = 'events.json.backup';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

function parseDate(dateInput) {
    // Handle various date formats
    // "Fri, 11 Jul" -> "2025-07-11"
    // "July 11" -> "2025-07-11"
    // "2025-07-11" -> "2025-07-11"
    
    if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateInput; // Already in correct format
    }
    
    const months = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
        'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    // Try to parse "Fri, 11 Jul" format
    const match = dateInput.match(/\w+,?\s*(\d{1,2})\s+(\w{3})/i);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthName = match[2].toLowerCase();
        const month = months[monthName];
        
        if (month) {
            const currentYear = new Date().getFullYear();
            return `${currentYear}-${month}-${day}`;
        }
    }
    
    return '2025-12-31'; // Fallback
}

function parseTime(timeInput) {
    // Handle various time formats
    // "5:30pm" -> "17:30"
    // "17:30" -> "17:30"
    
    if (timeInput.match(/^\d{2}:\d{2}$/)) {
        return timeInput; // Already in 24-hour format
    }
    
    const match = timeInput.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
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
}

function determineEventType(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('d&d') || text.includes('dnd') || text.includes('dungeons')) {
        return { type: 'dnd', typeLabel: 'D&D' };
    } else if (text.includes('tournament') || text.includes('competition')) {
        return { type: 'tournament', typeLabel: 'Tournament' };
    } else if (text.includes('social') || text.includes('party')) {
        return { type: 'social', typeLabel: 'Social' };
    } else {
        return { type: 'board-games', typeLabel: 'Board Games' };
    }
}

async function addEvent(events, eventId) {
    console.log(`\n🎯 Adding Event #${eventId}`);
    console.log('=====================================');
    
    const title = await askQuestion('Event Title (e.g., "RAGE Game Night"): ');
    if (!title) {
        console.log('❌ Title is required. Skipping this event.');
        return null;
    }
    
    const description = await askQuestion('Description (or press Enter for default): ') || 
        'Join us for board games, card games, and great company! Whether you\'re a seasoned gamer or just starting out, you\'ll find a welcoming community at RAGE.';
    
    const dateInput = await askQuestion('Date (e.g., "Fri, 11 Jul" or "2025-07-11"): ');
    const date = parseDate(dateInput);
    
    const timeInput = await askQuestion('Time (e.g., "5:30pm" or "17:30"): ');
    const time = parseTime(timeInput);
    
    const location = await askQuestion('Location (e.g., "Fratelli\'s Pizza Parlour, Redding"): ') || 
        'Redding Area - Check Discord';
    
    const attendingInput = await askQuestion('Number attending (e.g., "2 going • 1 interested" or just "5"): ');
    let attending = 5; // Default
    
    // Parse attendance
    const goingMatch = attendingInput.match(/(\d+)\s*going/i);
    const interestedMatch = attendingInput.match(/(\d+)\s*interested/i);
    if (goingMatch || interestedMatch) {
        const going = goingMatch ? parseInt(goingMatch[1]) : 0;
        const interested = interestedMatch ? parseInt(interestedMatch[1]) : 0;
        attending = going + interested;
    } else if (attendingInput.match(/^\d+$/)) {
        attending = parseInt(attendingInput);
    }
    
    const featured = await askQuestion('Is this a featured event? (y/n): ');
    
    const eventType = determineEventType(title, description);
    
    const event = {
        id: eventId,
        title: title,
        description: description,
        date: date,
        time: time,
        type: eventType.type,
        typeLabel: eventType.typeLabel,
        location: location,
        attending: attending,
        featured: featured.toLowerCase().startsWith('y')
    };
    
    console.log('\n📋 Event Summary:');
    console.log(`   Title: ${event.title}`);
    console.log(`   Date: ${event.date} at ${event.time}`);
    console.log(`   Location: ${event.location}`);
    console.log(`   Attending: ${event.attending}`);
    console.log(`   Type: ${event.typeLabel}`);
    console.log(`   Featured: ${event.featured ? 'Yes' : 'No'}`);
    
    const confirm = await askQuestion('\n✅ Add this event? (y/n): ');
    if (confirm.toLowerCase().startsWith('y')) {
        return event;
    } else {
        console.log('❌ Event not added.');
        return null;
    }
}

async function main() {
    console.log('🎲 RAGE Events Interactive Updater');
    console.log('===================================');
    console.log('');
    console.log('This tool will help you add real events from AfterGame to your events.json file.');
    console.log('Have the AfterGame page open (https://aftergame.app/groups/rage) to copy data from.');
    console.log('');
    
    // Create backup
    if (fs.existsSync(OUTPUT_FILE)) {
        fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
        console.log('📋 Created backup of existing events.json');
    }
    
    const startFresh = await askQuestion('Start with a fresh events list? (y/n): ');
    
    let events = [];
    let eventId = 1;
    
    if (!startFresh.toLowerCase().startsWith('y')) {
        // Load existing events
        try {
            const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
            if (existingData.events && Array.isArray(existingData.events)) {
                events = existingData.events;
                eventId = Math.max(...events.map(e => e.id), 0) + 1;
                console.log(`📋 Loaded ${events.length} existing events. Next ID: ${eventId}`);
            }
        } catch (error) {
            console.log('⚠️ Could not load existing events, starting fresh.');
        }
    }
    
    console.log('\\n🎯 Ready to add events! Press Ctrl+C at any time to cancel.');
    
    while (true) {
        const addAnother = await askQuestion(`\\nAdd ${events.length === 0 ? 'an' : 'another'} event? (y/n): `);
        if (!addAnother.toLowerCase().startsWith('y')) {
            break;
        }
        
        const newEvent = await addEvent(events, eventId);
        if (newEvent) {
            events.push(newEvent);
            eventId++;
            console.log(`✅ Event added! Total events: ${events.length}`);
        }
    }
    
    if (events.length > 0) {
        // Sort events by date
        events.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateA - dateB;
        });
        
        // Create final JSON
        const finalData = {
            "_comment": "RAGE Events Data - Updated with real AfterGame data",
            "_lastUpdated": new Date().toISOString(),
            "_source": "Manual entry from AfterGame via interactive tool",
            "_totalEvents": events.length,
            "events": events
        };
        
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
        
        console.log(`\\n✅ Saved ${events.length} events to ${OUTPUT_FILE}`);
        console.log('\\n📅 Your events:');
        events.forEach((event, i) => {
            console.log(`   ${i + 1}. ${event.title} - ${event.date} at ${event.time}`);
        });
        
    } else {
        console.log('\\n⚠️ No events were added.');
    }
    
    console.log('\\n🎉 Done! Your website will now show the updated events.');
    rl.close();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\\n\\n👋 Goodbye!');
    rl.close();
    process.exit(0);
});

// Run the interactive updater
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error);
        rl.close();
        process.exit(1);
    });
}
