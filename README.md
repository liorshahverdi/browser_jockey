# Browser Jockey

A dual-track DJ mixing web application with 3D audio visualization, BPM detection, A-B loop markers, audio effects, and professional DJ controls.

## Features

- �️ **Dual Track DJ System** - Load and mix two audio tracks simultaneously
- � **BPM Detection** - Automatic tempo detection for each track
- 🎹 **Key Detection** - Per-track musical key analysis
- 🔁 **A-B Loop Markers** - Create precise loops with draggable markers
- ⚡ **Quick Loops** - Auto-create 1, 2, 4, or 8 bar loops based on BPM
- 🔍 **Waveform Zoom** - Zoom up to 20x with drag-to-pan
- 🎚️ **Audio Effects** - Reverb, delay, and filters (low/high/band pass)
- 💾 **Export** - Export full stems or loop regions as WAV files
- 🎨 **3D Visualization** - Real-time WebGL visualization with Three.js
- 🌈 **Musical Key Colors** - Dynamic colors based on detected key
- 🎙️ **Recording** - Record your live mix with waveform display
- 📱 **Professional Layout** - Side-by-side dual deck DJ interface

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
cd browser_jockey
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
browser_jockey/
├── app/
│   ├── __init__.py          # Flask app initialization
│   ├── routes.py            # Application routes
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css    # All styling
│   │   └── js/
│   │       ├── visualizer.js       # Original single-track (deprecated)
│   │       └── visualizer-dual.js  # Main dual-track DJ engine
│   └── templates/
│       └── index.html       # Main UI
├── config.py               # Configuration
├── run.py                  # Application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── CHAT_HISTORY.md        # Development history
├── LICENSE                # MIT License
└── README.md              # This file
```

## Usage

### Loading Tracks
1. **Track 1 & Track 2**: Drag and drop or click to upload audio files
   - **Supported formats**: MP3, WAV, OGG, FLAC (browser-dependent), AIFF
   - **Best compatibility**: MP3 or WAV

### Playback Controls
- **Play/Pause/Stop**: Independent controls for each track
- **Tempo Slider**: Adjust playback speed (0.25x - 2.0x)
- **Volume Faders**: Mix levels for each track (0-100%)

### Looping
- **Manual Loops**: 
  1. Click 🔁 to enable loop mode
  2. Click waveform to set point A (start)
  3. Click again to set point B (end)
  4. Drag markers to fine-tune
- **Quick Loops**: Auto-create 1, 2, 4, or 8 bar loops based on detected BPM

### Waveform Zoom
- **🔍+ Zoom In**: Zoom up to 20x magnification
- **🔍− Zoom Out**: Decrease zoom level
- **⟲ Reset**: Return to 1x zoom
- **Drag**: Pan across the waveform when zoomed

### Audio Effects
- **Filter**: Low pass, high pass, or band pass with frequency control
- **Reverb**: Wet/dry mix control (0-100%)
- **Delay**: Amount and time control

### Export
- **Export Stem**: Save full track with effects as WAV
- **Export Loop**: Save loop region with effects as WAV

### Recording
1. Set up your mix (volume, tempo, loops, effects)
2. Click "Start Recording"
3. Perform your mix
4. Click "Stop Recording"
5. Click "Download Recording" to save as .webm

### 3D Visualization
- **Three Modes**: Circle, Bars, Sphere
- **Dynamic Colors**: Based on detected musical key
- **Real-time**: Responds to merged audio output

**Note**: FLAC files may not play in Safari. For best compatibility across all browsers, use MP3 or WAV formats.

## Musical Key Detection

The app analyzes each track's audio buffer to detect the musical key, and uses real-time frequency analysis for visualization colors:

**Key → Color Mapping**:
- **C** → Red
- **C#** → Orange
- **D** → Yellow
- **D#** → Lime
- **E** → Green
- **F** → Cyan
- **F#** → Teal
- **G** → Blue
- **G#** → Indigo
- **A** → Purple
- **A#** → Magenta
- **B** → Pink

Each key has its own color, creating a unique visual experience for different songs!

## Technologies Used

- **Backend**: Flask 3.0
- **Frontend**: Three.js r128 for 3D WebGL rendering
- **Audio**: Web Audio API (AnalyserNode, GainNode, BiquadFilterNode, ConvolverNode, DelayNode)
- **Export**: OfflineAudioContext, WAV encoding
- **Recording**: MediaRecorder API
- **Containerization**: Docker & Docker Compose
- **Production Server**: Gunicorn
- **Package Management**: uv (for local development)

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core functionality | ✅ | ✅ | ✅ | ✅ |
| MP3/WAV playback | ✅ | ✅ | ✅ | ✅ |
| FLAC playback | ✅ | ✅ | ❌ | ✅ |
| Recording | ✅ | ✅ | ⚠️* | ✅ |

*Safari may require MediaRecorder polyfill

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.