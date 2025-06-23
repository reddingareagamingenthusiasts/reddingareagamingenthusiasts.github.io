#!/usr/bin/env node

/**
 * RAGE Website Validator
 * 
 * This script validates that the website and events are set up correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🎲 RAGE Website Validator');
console.log('========================\n');

// Check if required files exist
const requiredFiles = [
    'index.html',
    'style.css',
    'events.json',
    'package.json'
];

console.log('📁 Checking required files...');
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
}

// Validate events.json
console.log('\n📋 Validating events.json...');
try {
    const eventsData = JSON.parse(fs.readFileSync('events.json', 'utf8'));
    
    if (!eventsData.events || !Array.isArray(eventsData.events)) {
        console.log('❌ events.json missing "events" array');
    } else {
        console.log(`✅ events.json valid with ${eventsData.events.length} events`);
        
        // Validate each event
        eventsData.events.forEach((event, i) => {
            const requiredFields = ['id', 'title', 'date', 'time', 'type', 'typeLabel', 'location', 'attending', 'featured'];
            const missingFields = requiredFields.filter(field => event[field] === undefined);
            
            if (missingFields.length > 0) {
                console.log(`⚠️  Event ${i + 1} missing fields: ${missingFields.join(', ')}`);
            } else {
                console.log(`✅ Event ${i + 1}: ${event.title} - ${event.date}`);
            }
        });
    }
} catch (error) {
    console.log(`❌ events.json validation failed: ${error.message}`);
}

// Check if server is running
console.log('\n🌐 Server status...');
console.log('To view the website properly:');
console.log('1. Run: npm run serve');
console.log('2. Visit: http://localhost:8000');
console.log('\n💡 Note: Opening index.html directly in browser may cause CORS issues');

console.log('\n🎯 Quick commands:');
console.log('- npm run serve          # Start local server');
console.log('- npm run update-events  # Interactive event editor');
console.log('- npm run discover-api   # Create event template');

console.log('\n✅ Validation complete!');
