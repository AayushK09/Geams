#!/bin/bash

# GEAMS Production Deployment Script
# This script builds and deploys using Docker

set -e

echo "🚀 Building GEAMS for Production..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker version: $(docker --version)"
echo "✅ Docker Compose version: $(docker-compose --version)"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create .env from .env.example"
    exit 1
fi

echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers are running"
else
    echo "❌ Failed to start containers"
    docker-compose logs
    exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "🎉 GEAMS Production Deployment Complete!"
echo "════════════════════════════════════════"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:3000"
echo "Health Check: http://localhost:3000/health"
echo ""
echo "View logs: docker-compose logs -f"
echo "Stop services: docker-compose down"
echo "════════════════════════════════════════"
