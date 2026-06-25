#!/bin/bash

# GEAMS Docker Cleanup Script
# This script stops and removes Docker containers

set -e

echo "🧹 Cleaning up GEAMS Docker environment..."

docker-compose down -v

echo "✅ Cleanup complete!"
echo ""
echo "To remove Docker images as well, run:"
echo "docker-compose down -v --rmi all"
