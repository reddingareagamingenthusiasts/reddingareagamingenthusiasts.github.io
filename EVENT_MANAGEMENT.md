# RAGE Events Management

## 🚀 Quick Start

**To view the website properly:**
```bash
npm run serve
```
Then visit: http://localhost:8000

**Easy way to update events:**
```bash
npm run update-events
```

**Validate everything is working:**
```bash
npm run validate
```

⚠️ **Important:** Don't open `index.html` directly in your browser - it will show "Unable to load events" due to CORS restrictions. Always use the local server with `npm run serve`.

## 📋 Current Status

The events.json file is currently set up with a template based on your AfterGame screenshots. The events include:

- **RAGE Game Night** - July 11, 2025 at 5:30 PM
- **RAGE Game Night** - August 15, 2025 at 5:30 PM  
- **RAGE Game Night** - September 19, 2025 at 5:30 PM

Location: **Fratelli's Pizza Parlour, Redding**

## 🔧 How to Update with Real Data

### Method 1: Interactive Tool (Recommended)
```bash
npm run update-events
```

This will walk you through adding events step by step. Have AfterGame open in your browser to copy from.

### Method 2: Manual Editing

1. Open `events.json` in your editor
2. Visit https://aftergame.app/groups/rage  
3. Click on each event to see details
4. Update the events array with real data:

```json
{
  "id": 1,
  "title": "RAGE Game Night",
  "description": "Copy from event page",
  "date": "2025-07-11",
  "time": "17:30",
  "type": "board-games",
  "typeLabel": "Board Games", 
  "location": "Fratelli's Pizza Parlour, Redding",
  "attending": 3,
  "featured": true
}
```

## 📊 Event Data Structure

Each event needs these fields:
- **id**: Unique number
- **title**: Event name  
- **description**: Event details
- **date**: YYYY-MM-DD format
- **time**: HH:MM (24-hour format)
- **type**: board-games, dnd, tournament, or social
- **typeLabel**: Display name for type
- **location**: Venue name and location
- **attending**: Number of people going
- **featured**: true/false for highlighting

## 🎯 Based on Your AfterGame Screenshots

I can see you have actual events like:
- **RAGE Game Night** - Fri, 11 Jul at 5:30pm PDT
- **RAGE Game Night** - Fri, 15 Aug at 5:30pm PDT
- **RAGE Game Night** - Fri, 19 Sep at 5:30pm PDT

**Location**: Fratelli's Pizza Parlour, 1774 California St, Redding 96001, California, United States

**Attendance**: Format like "2 going • 1 interested" = 3 total

## 🔍 API Discovery Results

I attempted to find AfterGame's public API endpoints but they appear to return HTML instead of JSON. The Discord conversation mentioned public endpoints exist, but they may require different authentication or have different URLs than the standard patterns I tested.

## 🛠️ Available Tools

- **`discover-api.js`** - Attempts to find API endpoints, creates template
- **`update-events-interactive.js`** - Interactive event entry tool
- **`scrape-events-v2.js`** - Generates template events (fallback)
- **`scrape-real-events.js`** - Attempts browser automation (experimental)

## 📝 Next Steps

1. **Use the interactive tool**: `npm run update-events`
2. **Or manually edit** `events.json` with real data from AfterGame
3. **Your website automatically updates** when you save the file

## 🎲 Files

- **`events.json`** - The event data (edit this!)
- **`events.json.backup`** - Automatic backup
- **`index.html`** - Website that displays events
- **`package.json`** - Scripts and dependencies

---

The system is ready to use! The interactive tool makes it easy to add real events from AfterGame without complex scraping.
3. Save the file - changes will appear immediately on the website

### Event Object Structure

```json
{
  "id": 1,                          // Unique number for each event
  "title": "Event Name",            // Event title
  "description": "Event details",   // Brief description
  "date": "2025-06-28",            // Date in YYYY-MM-DD format
  "time": "18:00",                 // Time in 24-hour format (HH:MM)
  "type": "board-games",           // CSS class for styling (see types below)
  "typeLabel": "Board Games",      // Display name for event type
  "location": "Venue Name",        // Where the event takes place
  "attending": 12,                 // Number of people attending
  "featured": true                 // true = highlighted, false = normal
}
```

### Event Types (for styling)

- `board-games` - Board game events (blue theme)
- `dnd` - D&D sessions (purple theme)
- `tournament` - Tournaments (orange theme)
- `social` - Social events (green theme)

### Tips

- Only set `featured: true` for 1-2 most important upcoming events
- Use realistic dates (future events only)
- Keep descriptions concise but informative
- Location should include city if not obvious
- Increment the `id` for new events

### Example New Event

```json
{
  "id": 5,
  "title": "Magic: The Gathering Draft",
  "description": "Commander draft with prize support. Bring your trade binders!",
  "date": "2025-07-20",
  "time": "15:00",
  "type": "tournament",
  "typeLabel": "Tournament",
  "location": "Dragon's Den Games, Redding",
  "attending": 8,
  "featured": false
}
```

The website will automatically:
- Format dates and times for display
- Calculate countdowns
- Apply appropriate styling based on event type
- Show featured events prominently

No need to restart the server or refresh anything - just edit the JSON file and the changes will be live!
