# 3D Audio Visualizer

A Flask-based web application that provides real-time 3D audio visualization with musical key detection and color-coded displays.

## Features

- 🎵 **Real-time Audio Visualization** - Upload and visualize audio files in 3D
- 🎨 **Musical Key Detection** - Automatically detects the musical key and adjusts colors
- 🔄 **Three Visualization Modes**:
  - Circle: Rotating circular bars
  - Bars: Classic 3D equalizer bars
  - Sphere: Pulsating sphere pattern
- 🌈 **Dynamic Color Coding** - Colors change based on detected musical key
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Prerequisites

- Docker and Docker Compose (recommended)
- OR Python 3.10+ and `uv` (for local development)

Install `uv` if you haven't already:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Quick Start with Docker

### 1. Build and run with Docker Compose:

```bash
docker-compose up --build
```

### 2. Access the application:

Open your browser and navigate to: `http://localhost:5001`

### 3. Stop the application:

```bash
docker-compose down
```

## Alternative: Build with Docker only

### Build the image:

```bash
docker build -t audio-visualizer .
```

### Run the container:

```bash
docker run -p 5001:5001 audio-visualizer
```

## Local Development (Without Docker)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd flask-audio-visualizer
```

### 2. Create a Virtual Environment with uv

```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies with uv

```bash
uv pip install -r requirements.txt
```

### 4. Run the Application

```bash
python run.py
```

### 5. Access the Application

Open your browser and navigate to: `http://localhost:5001`

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Available environment variables:

- `FLASK_ENV` - Environment mode (development/production)
- `FLASK_DEBUG` - Enable/disable debug mode (0/1)
- `SECRET_KEY` - Secret key for Flask sessions
- `HOST` - Host address (default: 0.0.0.0)
- `PORT` - Port number (default: 5001)

## Production Deployment

### Using Docker:

1. Update `.env` file for production:
```bash
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=generate-a-strong-secret-key
```

2. Comment out volume mounts in `docker-compose.yml`

3. Run with Docker Compose:
```bash
docker-compose up -d
```

### Using Gunicorn (Production WSGI Server):

```bash
# With uv
uv pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 run:app
```

## Project Structure

```
flask-audio-visualizer/
├── app/
│   ├── __init__.py          # Flask app initialization
│   ├── routes.py            # Application routes
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css    # Styles
│   │   └── js/
│   │       └── visualizer.js # 3D visualization logic
│   └── templates/
│       └── index.html       # Main HTML template
├── content/                 # Sample audio files
├── config.py               # Configuration
├── run.py                  # Application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
└── README.md              # This file
```

## Usage

1. **Upload Audio**: Click "Choose Audio File" and select an audio file
   - **Supported formats**: MP3, WAV, OGG, M4A, AAC, FLAC, AIFF, OPUS, WEBM, and more
2. **Play**: Click the Play button to start playback and visualization
3. **Switch Modes**: Try different visualization modes (Circle, Bars, Sphere)
4. **Watch**: The colors will automatically adjust based on the detected musical key

**Note**: Some formats like AIFF may need browser codec support. For best compatibility, use MP3, WAV, or OGG formats.

## Musical Key Detection

The app analyzes the dominant frequencies in real-time and maps them to musical notes:

- **C** → Red
- **D** → Yellow
- **E** → Green
- **F#** → Cyan
- **A** → Purple
- **B** → Pink

Each key has its own color, creating a unique visual experience for different songs!

## Technologies Used

- **Backend**: Flask 3.0
- **Frontend**: Three.js for 3D rendering
- **Audio**: Web Audio API
- **Containerization**: Docker & Docker Compose
- **Production Server**: Gunicorn
- **Package Management**: uv (for local development)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.