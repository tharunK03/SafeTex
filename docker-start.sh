#!/bin/bash

# SAFT ERP Docker Startup Script
# This script helps you quickly start the SAFT ERP application with Docker

set -e

echo "🚀 Starting SAFT ERP Application with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    if [ -f "docker.env.example" ]; then
        cp docker.env.example .env
        echo "📝 Created .env file from template. Please edit it with your actual values."
        echo "   You can edit it with: nano .env"
        echo ""
        read -p "Press Enter to continue after editing .env file..."
    else
        echo "❌ No docker.env.example file found. Please create a .env file manually."
        exit 1
    fi
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -d, --dev     Start in development mode with hot reloading"
    echo "  -b, --build   Force rebuild of all images"
    echo "  -c, --clean   Clean up containers and images before starting"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Start in production mode"
    echo "  $0 --dev          # Start in development mode"
    echo "  $0 --build        # Rebuild and start"
    echo "  $0 --clean        # Clean up and start fresh"
}

# Parse command line arguments
DEV_MODE=false
BUILD_MODE=false
CLEAN_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dev)
            DEV_MODE=true
            shift
            ;;
        -b|--build)
            BUILD_MODE=true
            shift
            ;;
        -c|--clean)
            CLEAN_MODE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Clean up if requested
if [ "$CLEAN_MODE" = true ]; then
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v 2>/dev/null || true
    docker system prune -f
    echo "✅ Cleanup completed"
fi

# Build mode
if [ "$BUILD_MODE" = true ]; then
    echo "🔨 Building Docker images..."
    docker-compose build --no-cache
fi

# Start the application
if [ "$DEV_MODE" = true ]; then
    echo "🛠️  Starting in development mode..."
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
else
    echo "🏭 Starting in production mode..."
    docker-compose up --build
fi

echo ""
echo "✅ SAFT ERP Application is starting up!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "❤️  Health Check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop the application"


