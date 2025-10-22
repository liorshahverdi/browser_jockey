#!/bin/bash

# Quick start script for Audio Visualizer

echo "🎵 Starting Audio Visualizer Setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ .env file created. You can edit it to customize settings."
else
    echo "✅ .env file already exists"
fi

# Build and start containers
echo "🔨 Building Docker image..."
docker-compose build

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 5

# Check if container is running
if [ "$(docker ps -q -f name=audio-visualizer)" ]; then
    echo "✅ Container is running!"
    echo ""
    echo "🎉 Audio Visualizer is now running!"
    echo "🌐 Access it at: http://localhost:5001"
    echo ""
    echo "📋 Useful commands:"
    echo "  - View logs:        docker-compose logs -f"
    echo "  - Stop:             docker-compose down"
    echo "  - Restart:          docker-compose restart"
    echo "  - Rebuild:          docker-compose up --build -d"
else
    echo "❌ Failed to start container. Check the logs with: docker-compose logs"
    exit 1
fi
