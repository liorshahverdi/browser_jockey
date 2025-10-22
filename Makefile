.PHONY: help build up down restart logs clean install test

help:
	@echo "🎵 Audio Visualizer - Available Commands:"
	@echo ""
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start the application"
	@echo "  make down       - Stop the application"
	@echo "  make restart    - Restart the application"
	@echo "  make logs       - View application logs"
	@echo "  make clean      - Remove containers and images"
	@echo "  make install    - Install dependencies locally"
	@echo "  make dev        - Run in development mode (local)"
	@echo "  make prod       - Run with Gunicorn (production)"
	@echo ""

build:
	@echo "🔨 Building Docker images..."
	docker-compose build

up:
	@echo "🚀 Starting application..."
	docker-compose up -d
	@echo "✅ Application running at http://localhost:5001"

down:
	@echo "🛑 Stopping application..."
	docker-compose down

restart:
	@echo "🔄 Restarting application..."
	docker-compose restart

logs:
	@echo "📋 Showing logs (Ctrl+C to exit)..."
	docker-compose logs -f

clean:
	@echo "🧹 Cleaning up containers and images..."
	docker-compose down -v --rmi all
	@echo "✅ Cleanup complete"

install:
	@echo "📦 Installing Python dependencies with uv..."
	@if ! command -v uv &> /dev/null; then \
		echo "⚠️  uv not found. Installing uv..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh; \
	fi
	uv venv
	uv pip install -r requirements.txt
	@echo "✅ Dependencies installed"
	@echo "💡 Activate the virtual environment with: source .venv/bin/activate"

dev:
	@echo "🔧 Running in development mode..."
	python run.py

prod:
	@echo "🚀 Running with Gunicorn (production mode)..."
	gunicorn -w 4 -b 0.0.0.0:5001 run:app

start:
	@./start.sh
