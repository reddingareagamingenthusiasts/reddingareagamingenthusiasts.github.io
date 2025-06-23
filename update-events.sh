#!/bin/bash

# RAGE Events Updater
# Simple script to update events and preview the website

echo "🎲 RAGE Events Updater"
echo "====================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Generate events
echo "🎯 Generating events..."
npm run generate-events
echo ""

# Ask if user wants to preview
read -p "🌐 Would you like to preview the website? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting local server..."
    echo "   Visit: http://localhost:8000"
    echo "   Press Ctrl+C to stop the server"
    echo ""
    npm run serve
else
    echo "✅ Events updated! Your website is ready."
    echo ""
    echo "💡 To preview locally, run: npm run serve"
    echo "📝 To edit events manually, edit the events.json file"
fi
