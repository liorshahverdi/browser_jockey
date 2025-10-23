# Browser Jockey
A dual-track DJ mixing web application with 3D audio visualization, BPM detection, A-B loop markers, audio effects, microphone input with vocoder and auto-tune, and professional DJ controls.

## Screenshots

![Browser Jockey Screenshot 1](app/screenshots/app_screenshot_2025_10_22_at_23_01_40.png)

![Browser Jockey Screenshot 2](app/screenshots/app_screenshot_2025_10_23_at_02_04_14.png)

![Browser Jockey Screenshot 3](app/screenshots/app_screenshot_2025_10_23_at_02_04_34.png)

![Browser Jockey Screenshot 4](app/screenshots/app_screenshot_2025_10_23_at_02_04_51.png)

![Browser Jockey Screenshot 5](app/screenshots/app_screenshot_2025_10_23_at_02_09_07.png)

![Browser Jockey Screenshot 6 - Keyboard Sampler (v3.0)](app/screenshots/app_screenshot_2025_10_23_at_10_15_40.png)
*v3.0 Keyboard Sampler Feature - Play tracks/loops on pentatonic scales using keyboard*



## Features

- 🎛️ **Dual Track DJ System** - Load and mix two audio tracks simultaneously
- 🎵 **BPM Detection** - Automatic tempo detection for each track
- 🎹 **Key Detection** - Per-track musical key analysis
- 🔁 **A-B Loop Markers** - Create precise loops with draggable markers
- ⚡ **Quick Loops** - Auto-create 1, 2, 4, or 8 bar loops based on BPM
- 🔍 **Waveform Zoom** - Zoom up to 20x with drag-to-pan
- 🎚️ **Audio Effects** - Reverb, delay, and filters (low/high/band pass)
- 💾 **Export** - Export full stems or loop regions as WAV or MP3 files
- 🎵 **Format Options** - Choose between WAV (lossless) or MP3 (compressed 128kbps) export
- 🎤 **Microphone Input** - Live mic input with volume control and monitoring
- 🤖 **Vocoder Effect** - Robot voice effect with 8-32 frequency bands, carrier source selection
- 🎵 **Auto-Tune Effect** - Real-time pitch correction with key/scale selection, adjustable correction speed
- 🎨 **3D Visualization** - Real-time WebGL visualization with Three.js (Circle/Bars/Sphere modes)
- 🌈 **Dynamic Heat Map Colors** - Circle mode bars change color based on energy (blue→cyan→green→yellow→red)
- 🎨 **Musical Key Colors** - Visualization colors based on detected key
- 🎙️ **Recording** - Record your live mix with waveform display
- 📥 **Load Recording to Tracks** - Load recorded output back into Track 1 or Track 2 for layering and live looping
- 🎹 **Keyboard Sampler** - Play tracks/loops/recordings on pentatonic scales using keyboard (Q-I, A-K keys)
  - 🎼 Multiple scales: Pentatonic Major/Minor, Chromatic
  - 🎵 Transposable to any root note (C through B)
  - 🎚️ Independent volume control for mixing with tracks
  - 🎯 2-octave range with pitch shifting
  - 📦 Sample from any track, loop region, or recording
- 📱 **Professional Layout** - Side-by-side dual deck DJ interface
- 🎨 **Customizable Colors** - Personalize waveform colors for each track

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
```Browser Jockey Screenshot](app/screenshots/app_screenshot_2025_10_22_at_23_01_40.png)

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
  5. **Live Performance**: Drag loop markers smoothly during playback without glitches or audio cuts
- **Quick Loops**: Auto-create 1, 2, 4, or 8 bar loops based on detected BPM
- **Professional Quality**: Debounced seeking prevents static, buffer checks ensure smooth playback

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
- **Format Selection**: Choose export format for each track
  - **WAV (lossless)**: Uncompressed, high-quality audio (~30 MB for 3-min track)
  - **MP3 (compressed)**: 128 kbps encoding (~3 MB for 3-min track)
- **Export Stem**: Save full track with all effects applied
- **Export Loop**: Save loop region with all effects applied
- **Use Cases**:
  - WAV: Professional production, mastering, further processing
  - MP3: Sharing online, email, storage optimization, demos

### Microphone Input
1. **Enable Microphone**: Click 🎤 Enable Microphone button
2. **Grant Permission**: Allow browser access to your microphone
3. **Adjust Volume**: Use the mic volume slider (0-100%)
4. **Monitor**: Check "Monitor" to hear yourself through speakers
5. **Visual Feedback**: Watch the real-time waveform and level meter
6. **Auto-Mix**: Mic audio automatically mixed with DJ tracks and included in recordings

**Use Cases**: DJ commentary, live vocals, karaoke, beatboxing, podcast recording, instrument input

### Vocoder Effect (🤖)
**Requires**: Microphone enabled

**Classic robot voice effect** - Uses your voice to modulate music tracks:

1. **Enable Vocoder**: Click "Enable Vocoder" button
2. **Choose Carrier Source**:
   - **Track 1**: Modulate Track 1 audio with your voice
   - **Track 2**: Modulate Track 2 audio with your voice
   - **Both Tracks (Mix)**: Modulate the mixed output
   - **Microphone (Feedback)**: Self-modulation for experimental effects
3. **Adjust Settings**:
   - **Dry/Wet Mix**: Blend vocoded signal (0-100%)
   - **Bands**: Number of frequency bands (8-32)
     - 8-12 bands: Classic robotic sound
     - 24-32 bands: Natural, intelligible vocoded speech
4. **Perform**: Sing or speak into the mic while music plays

**Use Cases**: Robot voice effects, talk box simulation (funk/disco), creative sound design, live DJ sets

### Auto-Tune Effect (🎵)
**Requires**: Microphone enabled

**Professional pitch correction** - Real-time auto-tune for vocals:

1. **Enable Auto-Tune**: Click "Enable Auto-Tune" button
2. **Select Musical Key**: Choose root key (C, C#, D, etc.) - default: A
3. **Select Scale**:
   - **Major**: Happy/bright sound
   - **Minor**: Sad/dark sound
   - **Chromatic**: All 12 notes (minimal correction)
4. **Adjust Settings**:
   - **Correction Speed**: 0-200ms
     - 0-20ms: Instant "T-Pain" effect (hard auto-tune)
     - 50-100ms: Natural pitch correction
     - 100-200ms: Subtle, musical correction
   - **Strength**: 0-100% dry/wet mix
     - 0%: Original voice only
     - 100%: Fully auto-tuned
5. **Perform**: Sing into the mic and hear real-time pitch correction

**Use Cases**: Classic auto-tune effect, subtle pitch correction, karaoke enhancement, live performance, music production demos

**Advanced**: Combine vocoder + auto-tune for complex vocal processing!

### Recording
1. Set up your mix (volume, tempo, loops, effects)
2. (Optional) Enable microphone for voice/instrument input
3. (Optional) Enable vocoder and/or auto-tune effects
4. Click "Start Recording"
5. Perform your mix
6. Click "Stop Recording"
7. Choose what to do with your recording:
   - **Select Format**: Choose export format
     - **WebM (original)**: Native recording format (~instant, small size)
     - **WAV (lossless)**: Uncompressed, high-quality audio (~0.5s conversion)
     - **MP3 (compressed)**: 128 kbps encoding (~1-2s conversion)
   - **💾 Download Recording**: Save in chosen format
   - **📥 Load to Track 1**: Load recording into Track 1 for further mixing
   - **📥 Load to Track 2**: Load recording into Track 2 for further mixing

**Live Looping Workflow**:
- Record a loop on Track 1
- Load it to Track 2
- Record new content on Track 1 while Track 2 loops
- Load the new recording to Track 1
- Build complex, layered arrangements progressively
- Each loaded recording gets full BPM/key analysis and all track features

**Export Format Guide**:
- **WebM**: Best for quick capture, minimal file size, good quality
- **WAV**: Professional production, mastering, compatibility with all DAWs
- **MP3**: Sharing online, email, storage optimization

### 3D Visualization
- **Three Modes**: Circle, Bars, Sphere
- **Circle Mode Features**:
  - **Dynamic Heat Map Colors**: Bars change color based on their height/energy
    - Blue (0-20%): Low energy, quiet passages
    - Cyan (20-40%): Building energy
    - Green (40-60%): Medium energy
    - Yellow (60-80%): High energy
    - Red (80-100%): Maximum energy, bass drops
  - **Smooth Transitions**: Colors blend seamlessly as energy changes
  - **Emissive Glow**: Bars emit light matching their color
- **Musical Key Colors**: Background colors based on detected key (all modes)
- **Real-time**: Responds to merged audio output with physics-based animations

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
- **Audio**: Web Audio API (AnalyserNode, GainNode, BiquadFilterNode, ConvolverNode, DelayNode, MediaStreamSource)
- **Microphone**: getUserMedia API for audio input capture
- **Vocal Effects**: 
  - **Vocoder**: Band-pass filter banks with envelope followers
  - **Auto-Tune**: Autocorrelation pitch detection with delay-based pitch shifting
- **Export**: 
  - OfflineAudioContext for rendering with effects
  - WAV encoding (PCM 16-bit)
  - MP3 encoding via lamejs (128 kbps)
- **Recording**: MediaRecorder API (WebM format)
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
| Microphone input | ✅ | ✅ | ✅** | ✅ |
| Vocoder effect | ✅ | ✅ | ✅** | ✅ |
| Auto-Tune effect | ✅ | ✅ | ✅** | ✅ |

*Safari may require MediaRecorder polyfill  
**Safari requires HTTPS for getUserMedia (microphone access)

## Version History

- **v3.0** (Current) - Keyboard sampler feature with volume control
- **v2.9** - Improved load recording & seamless track loading (proper MediaElementSource handling)
- **v2.8** - Load recording to track fix (initial attempt, later improved in v2.9)
- **v2.7** - Recording export formats (WebM/WAV/MP3) and download button fix
- **v2.6** - MP3 and WAV export format options with lamejs integration for tracks
- **v2.5** - Load recording to tracks for layering and live looping
- **v2.4** - Loop playback audio fixes (debouncing, smooth marker dragging)
- **v2.3** - Dynamic heat map colors in Circle mode visualization
- **v2.2** - Auto-tune effect with pitch correction
- **v2.1** - Microphone as vocoder carrier option
- **v2.0** - Vocoder effect (8-32 frequency bands)
- **v1.8** - Microphone input with monitoring and waveform display
- **v1.7** - Recording with live waveform visualization
- **v1.6** - Export functionality (stems and loops as WAV)
- **v1.5** - Audio effects (reverb, delay, filters)
- **v1.4** - Quick loop creation (1, 2, 4, 8 bars)
- **v1.3** - Waveform zoom and pan (up to 20x)
- **v1.2** - A-B loop markers with drag functionality
- **v1.1** - BPM detection and static waveform display
- **v1.0** - Initial dual-track DJ system with 3D visualization

See [CHAT_HISTORY.md](CHAT_HISTORY.md) for detailed development history.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.