#!/bin/bash

# GEAMS Development Startup Script
# This script sets up and starts the development environment

set -e

echo "🚀 Starting GEAMS Development Environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data recordings

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "ℹ️  Please edit .env with your configuration"
fi

# Start development servers
echo ""
echo "════════════════════════════════════════"
echo "🎯 GEAMS Development Environment"
echo "════════════════════════════════════════"
echo "Frontend: http://localhost:3001"
echo "Backend: http://localhost:3000"
echo "Health: http://localhost:3000/health"
echo "════════════════════════════════════════"
echo ""

npm run dev
