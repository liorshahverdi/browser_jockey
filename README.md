# Browser Jockey

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://browser-jockey.onrender.com/)

A dual-track DJ mixing web application with advanced multi-track sequencer, independent pitch and tone controls, seamless timestretching with reverse mode, 3D audio visualization, BPM detection, beat grid + snap, hot cues (CDJ-style), slip mode, loop roll + beat jump, sidechain compression, master limiter with per-track VU metering, browser whisper transcription, precise loop markers, professional constant-power stereo panning, audio effects, microphone input with vocoder and auto-tune, standalone microphone recording, flexible audio routing, professional crossfader, browser tab audio capture, drag-and-drop track loading, clip-based arrangement with zoom/pan/fullscreen and real-time effects, and authentic DJ controls.

## Quick Links

📖 **[Full Changelog](CHANGELOG.md)** | 🎯 **[Features](docs/features/)** | 📚 **[User Guides](docs/guides/)** | 🧪 **[Testing Guide](docs/guides/TESTING_GUIDE.md)** | 🏗️ **[Module Architecture](MODULES.md)**

**Latest Update (v3.32.0)**: Master Limiter + Per-Track VU Metering! Hard limiter on the master bus prevents clipping; three real-time horizontal RMS meters (Track 1, Track 2, Master) with peak hold, latching clip indicators, and a GR readout. Also: `Alt+1`–`8` cross-deck hot cue triggering.

## Recent Updates

- **v3.32.0**: Master Limiter + Per-Track VU Metering + cross-deck hot cues — hard limiter on master bus; three RMS meters (Track 1, Track 2, Master) with peak hold, latching clip indicators, GR readout; `Alt+1`–`8` cross-deck hot cue triggering; hot cues/beat grid/slip now enabled when loading recordings to tracks
- **v3.31.0**: Browser Whisper Transcription — offline speech-to-text via Transformers.js + whisper-base; per-track and master-output transcription with export
- **v3.30.0**: Sidechain bidirectional improvement — ducking works in both directions (Track 1 from 2, Track 2 from 1)
- **v3.29.0**: Sidechain Compression — duck Track 2 from Track 1's energy; threshold, ratio, attack, release, wet/dry controls; GR meter
- **v3.28.1**: Beat Grid, Slip Mode, Loop Roll + Beat Jump — beat grid overlay with tap tempo + snap; slip mode ghost playhead; 8 hold-to-roll + 8 beat-jump buttons per track; keyboard `[`/`]`/`{`/`}` bindings
- **v3.28.0**: Hot Cues — CDJ-style 8 hot cues per track; waveform markers; `1`–`8` jump, `Shift+1`–`8` set; localStorage persistence
- **v3.27.8**: Audio element volume restoration after buffer playback - [Release Notes](current-release/RELEASE_NOTES_v3.27.8.md)
- **v3.27.7**: Position continuity when disabling reverse mode - [Release Notes](current-release/RELEASE_NOTES_v3.27.7.md)
- **v3.27.0**: Drag & drop track loading - [Feature Doc](docs/features/DRAG_DROP_TRACK_LOADING.md)
- **v3.26.0**: Professional constant-power stereo panning - [Feature Doc](docs/features/PANNING_RESOLUTION_SUMMARY.md)
- **v3.25.0**: Sequencer fullscreen toggle - [Feature Doc](docs/features/SEQUENCER_FULLSCREEN_TOGGLE.md)
- **v3.24.0**: Sequencer zoom & pan with waveform visualization - [Feature Doc](docs/features/SEQUENCER_ZOOM_PAN_FEATURE.md)
- **v3.23.0**: Seamless timestretching + reverse mode integration - [Feature Doc](docs/features/SEAMLESS_TIMESTRETCH_REVERSE.md)
- **v3.21.0**: Independent pitch & tone controls - [Feature Doc](docs/features/PITCH_TONE_IMPLEMENTATION_SUMMARY.md)
- **v3.13.0**: Browser tab audio capture - [Feature Doc](docs/features/TAB_AUDIO_CAPTURE_FEATURE.md)
- **v3.11.0**: Camera Theremin - [Feature Doc](docs/features/CAMERA_THEREMIN_FEATURE.md)
- **v3.10.0**: Professional DJ crossfader - [Feature Doc](docs/features/CROSSFADER_FEATURE.md)

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## Features

- 🎧 **Professional DJ Layout** - Authentic three-column DJ mixer design
  - 🎛️ Dual decks side-by-side (cyan/magenta color coding)
  - 🎚️ Vertical faders for volume and tempo (like real DJ mixers)
  - 🔄 Horizontal pan controls for stereo positioning
  - 🎚️ Center mixer section with crossfader and dual track controls
  - 🏆 Master output with integrated recording section
  - ✨ Glowing effects and neon accents matching DJ equipment
- 🎯 **Hot Cues (CDJ-Style)** - 8 labeled, color-coded cue points per track
  - 🖱️ Click empty button to **set** cue at current position; click filled button to **jump**
  - ⌨️ Keys `1`–`8` jump to cue on focused track; `Shift+1`–`8` set cue
  - 🔀 `Alt+1`–`8` triggers the same cue slot on the **other track** (cross-deck, no focus change)
  - 🗺️ Colored vertical markers rendered on the waveform canvas
  - 💾 Cues persist to localStorage keyed by filename + size
- 🥁 **Beat Grid + Snap** - Auto-generated beat grid from detected BPM
  - 📏 Overlay of tick marks on the waveform canvas; every 4th beat = bar line
  - 🎯 Snap toggle: loop A/B points and hot cues quantize to nearest beat
  - 🎹 Tap Tempo: 4-tap average to override detected BPM
  - ⬅️ ➡️ Nudge buttons to align grid to the first downbeat
- 🌊 **Slip Mode** - Hold-to-slip; ghost amber playhead shows where audio would be; release snaps back
- 🔀 **Sidechain Compression** - Duck Track 2 from Track 1's energy (or vice-versa); threshold, ratio, attack, release, wet/dry controls
- 🔁 **Loop Roll + Beat Jump** - CDJ-style performance controls
  - 🥁 8 hold-to-roll buttons per track (1/32 – 4 bars); releases to slip position
  - ⏩ 8 beat-jump buttons per track (±1, ±2, ±4, ±8 beats)
  - ⌨️ Keyboard: `[`/`]` = ±1 beat, `{`/`}` = ±4 beats
- 📊 **Master Limiter + VU Metering** - Transparent limiting and level monitoring
  - 🔴 Hard limiter (`DynamicsCompressorNode`) on master bus prevents digital clipping
  - 📈 Three real-time horizontal RMS meters: Track 1, Track 2, and Master output
  - ⏱️ Peak hold (3s) with 12 dB/s decay; latching clip indicator (click to reset)
  - 🎚️ Limiter on/off toggle with GR (gain reduction) readout
- 🎙️ **Browser Whisper Transcription** - Offline speech-to-text powered by Transformers.js
  - 🤫 Runs entirely in-browser via whisper-base model (no server calls)
  - 📝 Transcribe Track 1 or Track 2 audio with one click; export as text
- 🌐 **Browser Tab Audio Capture** - Capture audio from any browser tab
  - 📺 Capture YouTube, Spotify, SoundCloud, or any tab playing audio
  - 🎚️ Route to Track 1, Track 2, or Microphone input
  - 🎛️ Full effects support (volume, pan, filter, reverb, delay)
  - ⏺️ Record tab capture to master output
  - 🤖 Use with vocoder/autotune effects
  - 🔀 Mix with crossfader and other tracks
  - 💾 Record and load back to tracks for remixing
  - ⚠️ Chrome/Edge only (browser limitation)
- 🎼 **Multi-Track Sequencer with Recording** - Professional timeline-based arrangement and recording
  - 📦 **Clip Library** - Load clips from DJ tracks or upload new audio files
  - 🎚️ **Unlimited Tracks** - Create as many sequencer tracks as needed
  - 🔇 **Track Controls** - Independent mute, solo, delete, and volume (0-100%) per track
  - 📊 **Visual Timeline** - Grid-based bar positioning with dynamic ruler and mini waveforms
  - 🎵 **BPM Control** - Set tempo from 60-200 BPM for perfect timing
  - ➕➖ **Bar Management** - Add/remove bars to adjust composition length
  - 🎨 **Drag & Drop** - Intuitive clip placement with visual feedback
  - 🎯 **Playhead Animation** - Real-time playback position indicator
  - 🔍 **Zoom & Pan** - Zoom 50%-200%, Shift+drag or middle-mouse pan, intelligent non-interference
  - 🌊 **Waveform Visualization** - High-DPI mini waveforms on every clip, zoom-aware redrawing
  - ⛶ **Fullscreen Toggle** - Live fullscreen mode (100vw × 100vh), ESC to exit, smooth animations
  - ✂️ **Clip Trimming** - Non-destructive edge dragging to trim start/end (8px handles)
  - 🎨 **Per-Clip Effects** - Volume, pitch shift (±12 semitones), multimode filter, reverb, delay, ADSR envelope
  - 🎛️ **Real-Time Effects** - Adjust volume/pitch/filter/delay during playback (<10ms latency)
  - 👁️ **Toggleable Effects Panel** - Show/hide to maximize workspace and timeline
  - 📏 **Auto-Resize Timeline** - Dynamically grows/shrinks based on track count (300px-80vh)
  - 🔍 **Auto-Zoom to Fit** - Automatically adjusts zoom for long clips with 10% padding
  - ➕ **Always-Visible Add Track** - Green button always accessible at bottom
  - 🔁 **Loop Playback** - Adjustable sequencer loop markers for repeated sections
  - 🖱️ **Double-Click Loop Adjustment** - Click ruler to move nearest marker
  - 🎚️ **Per-Track Mixer** - Individual gain nodes with proper audio routing to master
  - ⏺️ **One-Click Recording** - Record entire sequencer mix with single button
  - 🎙️ **High-Quality Audio** - Opus encoding (128kbps WebM) with live timer
  - 📊 **Waveform Preview** - Real amplitude data visualization for recordings
  - ⏱️ **Smart Recording Modes** - Auto-stop at timeline end or continuous loop recording
  - 🔁 **A-B Loop Markers** - Set loop points on sequencer recordings (click, enable, clear)
  - 📥 **Load to DJ Tracks** - Send recordings directly to Track 1 or Track 2
  - 🔀 **Seamless Integration** - Recorded tracks work like any loaded audio
  - 🎛️ **Full Track Features** - Play, pause, loop (forward/reverse), effects, BPM detection, key detection, export
  - 💾 **Multi-Format Export** - Save recordings as WebM, WAV, or MP3
  - 🎹 **Sampler Integration** - Use sequencer recordings as sampler sources
- ⚡ **Professional Crossfader** - Smooth transitions with equal-power curves
  - 🔀 Three modes: Track1↔Track2, Track1↔Mic, Track2↔Mic
  - 📊 Equal-power crossfade algorithm (constant perceived loudness)
  - 🎨 Visual gradient slider with dynamic labels
  - 🎚️ Respects individual volume slider settings
- 🎚️ **Professional Stereo Panning** - Constant-power panning with 4-gain routing matrix
  - 🔊 **Smooth L-R Transitions**: Sine/cosine curves for equal perceived loudness
  - 🎛️ **Per-Track Control**: Independent panning for Track 1, Track 2, and Master output
  - 💎 **Preserves Stereo Quality**: No mono downmixing, works with stereo and mono sources
  - ⚡ **Effect Chain Compatible**: Flawless integration with timestretching and all effects
  - 🎨 **Visual Feedback**: Real-time pan position indicators
- 🎛️ **Dual Track DJ System** - Load and mix two audio tracks simultaneously
  - 📁 **Drag & Drop Loading** - Drag audio files directly onto Track 1 or Track 2
  - ✨ **Visual Feedback** - Containers glow (cyan/magenta) when files are dragged over
  - 🎵 **Live Loading** - Load files while other track is playing without interruption
  - ⏺️ **Recording Compatible** - Load files during master recording seamlessly
  - 🎨 **All Formats Supported** - MP3, WAV, OGG, FLAC, M4A, AAC, WEBM, MP4, etc.
  - 🖱️ **Click to Upload** - Traditional file picker still available
- 🎚️ **Independent Pitch & Tone Controls** - Professional track manipulation
  - 🎵 **Pitch Slider**: ±12 semitones (one octave range) with Tone.js integration
  - 🎛️ **Tone Slider**: 20Hz-20kHz low-pass filter for frequency shaping
  - ⚡ **Live Control**: Draggable during playback for real-time adjustments
  - 🔄 **True Independence**: Pitch changes without affecting tempo, tempo changes without affecting pitch
  - 🎨 **Color-Coded UI**: Green gradient (pitch), orange gradient (tone)
  - 🎹 **Key Matching**: Perfect for harmonic mixing and creative sound design
- ▶️▶️ **Dual Track Controls** - Play both tracks at once, or play both and record simultaneously
- 🎤 **Advanced Microphone System** - Professional microphone input with extensive features
  - 🎙️ Live mic input with volume control and real-time waveform monitoring
  - ⏺️ **Standalone Recording** - Record directly from microphone without any tracks loaded
  - 💾 Export mic recordings as WAV or MP3
  - 📥 **Load to Tracks** - Load mic recordings directly to Track 1 or Track 2
  - 🔀 **Flexible Routing** - Use microphone OR tracks as sources for effects
  - 🎛️ **Master Routing Control** - Toggle Track 1, Track 2, Microphone, or Keyboard Sampler to master output
- 🤖 **Vocoder Effect** - Robot voice effect with advanced routing
  - 8-32 frequency bands with adjustable mix
  - Select modulator source: Microphone, Track 1, or Track 2
  - Select carrier source: Microphone (Feedback), Track 1, Track 2, or Both Tracks (Mix)
  - Mic-to-mic feedback for creative robotic effects
  - **NEW**: Use tab capture audio with vocoder!
- 🎵 **Auto-Tune Effect** - Real-time pitch correction with flexible sources
  - Select audio source: Microphone, Track 1, or Track 2
  - Key/scale selection with adjustable correction speed and strength
  - Works standalone or with tracks
  - **NEW**: Use tab capture audio with auto-tune!
- 📊 **ADSR Envelope Effects** - Professional envelope shaping for dynamic control
  - 📈 Attack (1-2000ms), Decay (1-2000ms), Sustain (0-100%), Release (1-5000ms)
  - 🎚️ Available for Track 1, Track 2, Master output, and Keyboard Sampler
  - 🔘 Manual trigger buttons for precise envelope activation
  - 🔗 Integrated into drag-and-drop effect chains
  - 🎹 Conditional sampler ADSR (enable/disable per note)
  - 💡 15+ creative use cases documented (plucks, pads, stabs, gates, swells)
- 📹 **Camera Theremin** - Motion-controlled instrument using webcam
  - 👋 Wave detection with adjustable sensitivity (0.5x-3.0x)
  - 🎛️ Three control modes: Pitch & Volume, Filter & Resonance, ADSR Envelope
  - 🎵 Audio sources: Built-in oscillator, Track 1, or Track 2
  - 💡 Adaptive motion detection for varied lighting conditions
  - 🎨 Wave-only mode (no hand detection required) for easier activation
  - 🌊 Visual feedback: Cyan (searching) → Orange (wave to activate) → Green (active)
  - 🎚️ Master volume, vibrato controls, pitch range selection
  - 🔊 Routes to master output with individual routing toggle
- 🎵 **BPM Detection** - Automatic tempo detection for each track
- 🎹 **Key Detection** - Per-track musical key analysis
- 🔁 **Precise Loop Markers** - Millisecond-accurate loop point control
  - 🎯 **Numeric Inputs** - Set exact loop times with 0.001s precision
  - 🖱️ **Time Tooltip** - Hover to preview exact time before clicking
  - 🧠 **Smart Adjustment** - Click moves nearest marker automatically
  - 🔍 **Zoom Compatible** - Works perfectly at 16x-20x zoom levels
  - ⌨️ **Arrow Key Fine-Tuning** - Adjust by ±0.001s increments
  - 💡 **In-App Hints** - Clear guidance without reading docs
  - 🎛️ **Fixed Click Detection** - No more ignored clicks when zoomed
  - ✨ **Quick Loop Integration** - Refine auto-generated loops manually
  - 📦 **Perfect for Tab Capture** - Chop tiny segments with precision
- 🔁 **A-B Loop Markers** - Create precise loops with draggable markers
- ⏪ **Reverse Loop** - Play loops backwards with seamless toggle (perfect for live performance)
- 🔄 **Seamless Timestretching + Reverse** - Professional time-stretching with instant mode switching
  - 📦 **Dual Buffer Storage**: Pre-rendered forward and reversed timestretched audio
  - ⚡ **Instant Toggle**: Switch between forward/reverse with no regeneration delay
  - 💎 **Quality Preservation**: Maintains timestretched audio quality in both directions
  - 🎭 **Live Performance Ready**: Perfect for DJ sets with on-the-fly direction changes
- ⚡ **Quick Loops** - Auto-create 1, 2, 4, or 8 bar loops based on BPM
- 🎚️ **Seamless Loop Control** - Toggle between forward/reverse during playback with no audio cuts
- 🔍 **Waveform Zoom** - Zoom up to 20x with drag-to-pan
- 🔗 **Drag-and-Drop Effect Chains** - Visually reorder effects for Track 1, Track 2, and Master output
  - 🎚️ Filter, Reverb, Delay, ADSR per track
  - ✓/✗ Toggle effects on/off with dynamic slider visibility
  - ⋮⋮ Drag to reorder effect processing
  - 🏆 Master effect chain with golden theme for final mix processing
- 🎚️ **Audio Effects** - Reverb, delay, and filters (low/high/band pass)
- 🎛️ **Master Output Effects** - Apply professional mastering effects to the final mixed output
- ⏺️ **Master Recording** - Record your mix directly from master output
  - 💾 Export as WebM, WAV, or MP3
  - 📥 Load recordings back to tracks for layering
  - **NEW**: Records tab capture audio with all effects!
- 💾 **Export** - Export full stems or loop regions as WAV or MP3 files
- 🎵 **Format Options** - Choose between WAV (lossless) or MP3 (compressed 128kbps) export
- 📊 **3D Visualization** - Real-time WebGL visualization with Three.js (Circle/Bars/Sphere modes)
- 〰️ **XY Oscilloscope** - Lissajous mode visualization with Cartesian coordinates
  - 📐 Centered at (0,0) with clear X/Y axes
  - 🎨 Dynamic phase-offset plotting for complex patterns
  - 🌈 Radial gradient colors (magenta→cyan)
  - ✨ Motion blur trails and glow effects
  - 🎯 Shows stereo correlation and harmonic relationships
  - 🎵 Displays live mix OR recorded audio playback
  - 🔄 Auto-switches between tracks and recordings
- 🌈 **Dynamic Heat Map Colors** - Circle mode bars change color based on energy (blue→cyan→green→yellow→red)
- 🎨 **Musical Key Colors** - Visualization colors based on detected key
- 🎹 **Keyboard Sampler** - Play tracks/loops/recordings on pentatonic scales using keyboard (Q-I, A-K keys)
  - 🎼 Multiple scales: Pentatonic Major/Minor, Chromatic
  - 🎵 Transposable to any root note (C through B)
  - 🎚️ Independent volume control for mixing with tracks
  - 🎯 2-octave range with pitch shifting
  - 📦 Sample from any track, loop region, or recording
- 🎨 **Customizable Colors** - Personalize waveform colors for each track
- ✨ **Enhanced UI/UX** - Premium button styling with CSS Grid distribution, larger controls (80px), backdrop blur effects, and logical layout organization
- 🏗️ **Modular Architecture** - Clean ES6 modules for maintainability (see [MODULES.md](MODULES.md))
- 🐛 **Production Ready** - Comprehensive error handling and live performance optimizations
- 🔄 **Live Looping Workflow** - Record, load to tracks, set loop markers, and layer recordings for complex arrangements

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

### Deploy to Render (Recommended):

1. **Fork or push this repository to GitHub**

2. **Create a new Web Service on Render:**
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Alternatively, manual setup:**
   - Runtime: Docker
   - Build Command: (leave empty, uses Dockerfile)
   - Start Command: (leave empty, uses Dockerfile CMD)
   - Set environment variables:
     - `FLASK_ENV=production`
     - `FLASK_DEBUG=0`
     - `SECRET_KEY` (generate a strong secret key)
     - `HOST=0.0.0.0`
     - `PORT=5001`

4. **Deploy!**
   - Render will build and deploy your application
   - Access your app at the provided URL (e.g., `https://browser-jockey.onrender.com`)

**Note**: The free tier on Render may spin down after inactivity and take ~30 seconds to restart.

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
│   │       ├── simple-player.js       # Original single-track (deprecated)
│   │       ├── app.js  # Main dual-track DJ engine
│   │       └── modules/            # ES6 modules
│   │           ├── constants.js
│   │           ├── loop-controls.js
│   │           ├── audio-utils.js
│   │           ├── audio-effects.js
│   │           ├── recording.js
│   │           ├── microphone.js
│   │           ├── vocoder.js
│   │           ├── autotune.js
│   │           ├── sampler.js
│   │           ├── theremin.js
│   │           ├── sequencer.js    # Multi-track sequencer
│   │           └── effect-chain.js
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

### Browser Tab Audio Capture (NEW!)
1. **Track 1 or Track 2**: Click "Capture Tab Audio" button
2. **Browser Picker**: Select the tab playing audio (YouTube, Spotify, etc.)
3. **Important**: Check "Share audio" in the picker dialog!
4. **Control Playback**: Use play/pause in the SOURCE TAB (browser security limitation)
5. **Apply Effects**: All track effects work in real-time (volume, pan, filter, reverb, delay)
6. **Record**: Start master recording to capture the tab audio with effects
7. **Stop**: Click "Stop" button to end tab capture

**Microphone Tab Capture**:
1. Click "Capture Tab Audio" in Microphone section
2. Use with vocoder/auto-tune effects
3. Mix with crossfader
4. Note: Recording from mic may not work with tab capture (use master recording instead)

**Use Cases**: DJ with YouTube/Spotify, remix online content, karaoke with YouTube, sample from streaming services, mix podcast audio, capture game audio for mixing

**Browser Support**: Chrome/Edge only (Chromium). Firefox and Safari do not support tab audio capture.

### Loading Tracks
1. **Track 1 & Track 2**: Drag and drop or click to upload audio files
   - **Supported formats**: MP3, WAV, OGG, FLAC (browser-dependent), AIFF
   - **Best compatibility**: MP3 or WAV
   - **OR** Click "Capture Tab Audio" to stream from another browser tab

### Playback Controls
- **Play/Pause/Stop**: Independent controls for each track
- **Tempo Slider**: Adjust playback speed (0.25x - 2.0x)
- **Volume Faders**: Mix levels for each track (0-100%)
- **Note**: For tab capture, control playback in the source tab (browser security)

### Crossfader
- **Select Mode**: Track1↔Track2, Track1↔Mic, or Track2↔Mic
- **Drag Slider**: Smooth crossfade between sources
- **Equal Power**: Constant perceived loudness throughout transition
- **Visual Feedback**: Gradient shows current mix position

### Looping
- **Manual Loops**: 
  1. Click 🔁 to enable loop mode
  2. Click waveform to set point A (start)
  3. Click again to set point B (end)
  4. Drag markers to fine-tune
  5. **Live Performance**: Drag loop markers smoothly during playback without glitches or audio cuts
- **Quick Loops**: Auto-create 1, 2, 4, or 8 bar loops based on detected BPM
- **Reverse Loop**: Click ⏪ to toggle reverse playback direction
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
- **ADSR Envelope**: Attack, Decay, Sustain, Release shaping
- **Drag to Reorder**: Click and drag effect chips to change processing order
- **Toggle On/Off**: Click ✓/✗ to bypass effects

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
**Requires**: Microphone enabled OR tab capture

**Classic robot voice effect** - Uses your voice to modulate music tracks:

1. **Enable Vocoder**: Click "Enable Vocoder" button
2. **Choose Modulator Source**:
   - **Microphone**: Use your voice/instrument
   - **Track 1**: Use Track 1 audio as modulator
   - **Track 2**: Use Track 2 audio as modulator
3. **Choose Carrier Source**:
   - **Track 1**: Modulate Track 1 audio
   - **Track 2**: Modulate Track 2 audio
   - **Both Tracks (Mix)**: Modulate the mixed output
   - **Microphone (Feedback)**: Self-modulation for experimental effects
4. **Adjust Settings**:
   - **Dry/Wet Mix**: Blend vocoded signal (0-100%)
   - **Bands**: Number of frequency bands (8-32)
     - 8-12 bands: Classic robotic sound
     - 24-32 bands: Natural, intelligible vocoded speech
5. **Perform**: Sing or speak into the mic while music plays

**NEW with Tab Capture**: Capture YouTube vocals and vocode them with instrumental tracks!

**Use Cases**: Robot voice effects, talk box simulation (funk/disco), creative sound design, live DJ sets

### Auto-Tune Effect (🎵)
**Requires**: Microphone enabled OR tab capture

**Professional pitch correction** - Real-time auto-tune for vocals:

1. **Enable Auto-Tune**: Click "Enable Auto-Tune" button
2. **Select Audio Source**:
   - **Microphone**: Use your voice/instrument
   - **Track 1**: Auto-tune Track 1 audio
   - **Track 2**: Auto-tune Track 2 audio
3. **Select Musical Key**: Choose root key (C, C#, D, etc.) - default: A
4. **Select Scale**:
   - **Major**: Happy/bright sound
   - **Minor**: Sad/dark sound
   - **Chromatic**: All 12 notes (minimal correction)
5. **Adjust Settings**:
   - **Correction Speed**: 0-200ms
     - 0-20ms: Instant "T-Pain" effect (hard auto-tune)
     - 50-100ms: Natural pitch correction
     - 100-200ms: Subtle, musical correction
   - **Strength**: 0-100% dry/wet mix
     - 0%: Original voice only
     - 100%: Fully auto-tuned
6. **Perform**: Sing into the mic and hear real-time pitch correction

**NEW with Tab Capture**: Auto-tune YouTube vocals or instrumentals!

**Use Cases**: Classic auto-tune effect, subtle pitch correction, karaoke enhancement, live performance, music production demos

**Advanced**: Combine vocoder + auto-tune for complex vocal processing!

### ADSR Envelope (📊)
**Professional dynamic shaping** - Control attack, decay, sustain, release:

1. **Locate ADSR**: Find in effect chain for Track 1, Track 2, Master, or Sampler
2. **Adjust Parameters**:
   - **Attack**: 1-2000ms (how fast sound reaches full volume)
   - **Decay**: 1-2000ms (how fast it drops to sustain level)
   - **Sustain**: 0-100% (held volume level)
   - **Release**: 1-5000ms (how fast sound fades after release)
3. **Manual Trigger**: Click "Trigger Attack" / "Trigger Release" buttons
4. **Enable Effect**: Toggle on in effect chain
5. **Reorder**: Drag in effect chain for different sound shaping

**Use Cases**: Plucks (short attack/release), pads (long attack/release), stabs (instant attack, short decay), gates (instant attack/release with low sustain), swells (long attack), percussive effects, volume automation

See [ADSR_CREATIVE_USE_CASES.md](ADSR_CREATIVE_USE_CASES.md) for 15+ detailed examples!

### Camera Theremin (📹)
**Motion-controlled instrument** - Use webcam to control sound:

1. **Enable Webcam**: Click "Enable Theremin" button
2. **Grant Camera Permission**: Allow browser access to webcam
3. **Choose Control Mode**:
   - **Pitch & Volume**: Hand X-axis = pitch, Y-axis = volume
   - **Filter & Resonance**: Hand controls filter frequency and resonance
   - **ADSR Envelope**: Hand triggers ADSR attack/release
4. **Select Audio Source**:
   - **Oscillator**: Built-in synthesizer
   - **Track 1**: Control Track 1 audio
   - **Track 2**: Control Track 2 audio
5. **Adjust Settings**:
   - **Sensitivity**: 0.5x-3.0x (how much motion affects parameters)
   - **Master Volume**: Overall theremin volume
   - **Vibrato**: Add pitch wobble
   - **Pitch Range**: Low/Medium/High frequency ranges
   - **Hand Requirement**: Both hands or single hand
6. **Activate**: Wave at camera (visual feedback changes to green when active)

**Tip**: If hand detection is difficult, use Wave-only mode (no hand detection required)

**Use Cases**: Live performances, experimental music, sound design, interactive installations, teaching physics of sound

### Keyboard Sampler (🎹)
**Play tracks as an instrument** - Use keyboard to trigger samples:

1. **Load Audio**: Load a track, recording, or set loop markers
2. **Enable Sampler**: Click "Enable Keyboard Sampler"
3. **Select Sample Source**:
   - Track 1 (full or loop region)
   - Track 2 (full or loop region)
   - Last Recording
4. **Choose Scale**:
   - **Pentatonic Major**: 5-note happy scale
   - **Pentatonic Minor**: 5-note bluesy scale
   - **Chromatic**: All 12 notes
5. **Select Root Note**: Transpose to any key (C through B)
6. **Play**: Press Q-I keys (top row) or A-K keys (middle row) for 2 octaves
7. **Adjust Volume**: Use sampler volume slider to mix with tracks
8. **ADSR Options**: Enable "Sampler ADSR" to apply envelope to each note

**Performance Tips**:
- Use loop markers for rhythmic samples
- Transpose to match track key
- Layer with playing tracks
- Record sampler performances

**Use Cases**: Live remixing, beat making, harmonic loops, percussive patterns, creative layering

### Sequencer (🎼)
**Multi-track timeline arrangement and recording** - Professional DAW-style workflow:

#### Getting Started
1. **Switch to Sequencer**: Click the "🎼 Sequencer" tab
2. **Load Clips**: Start in DJ Mixer and load audio files, or upload directly in sequencer
3. **Add Tracks**: Click "➕ Add New Track" (unlimited tracks supported)
4. **Drag Clips**: Drag clips from the left panel onto timeline tracks
5. **Position Clips**: Clips snap to bar boundaries for perfect alignment
6. **Set Tempo**: Adjust BPM (60-200) to match your music
7. **Manage Length**: Use Add/Remove Bar buttons to set composition length

#### Clip Editing
- **Trim Clips**: Hover over clip edges to see resize handles (↔ cursor)
  - Drag left edge right to trim from start
  - Drag right edge left to trim from end
  - Minimum 20px width maintained
  - Waveform updates in real-time
- **Move Clips**: Drag clips to different bar positions or tracks
- **Delete Clips**: Right-click or use delete controls
- **Visual Feedback**: Selected clips show golden border

#### Per-Clip Effects
1. **Click Clip**: Select any clip to open effects panel on right
2. **Adjust Effects**:
   - **Volume**: 0-150% (boost or reduce)
   - **Pitch Shift**: ±12 semitones (one octave range)
   - **Filter**: Low/High/Band Pass, 20Hz-20kHz
   - **Reverb**: 0-100% wet/dry mix
   - **Delay**: 0-100% mix, 50-2000ms time
   - **ADSR Envelope**: Attack/Decay/Sustain/Release shaping
3. **Real-Time Updates**: Adjust volume, pitch, filter, delay during playback (<10ms latency)
4. **Toggle Panel**: Click "🎛️ Effects Panel" button to show/hide
5. **Reset**: Use "Reset All Effects" to return to defaults

#### Track Controls
- **Mute** (🔇): Silence individual tracks during playback
- **Solo** (👤): Isolate specific tracks for focused listening
- **Delete** (🗑️): Remove tracks from arrangement
- **Volume**: Per-track volume control (0-100%)

#### Playback Controls
- **Play** (▶️): Start sequencer playback with visual playhead
- **Pause** (⏸️): Temporarily stop playback
- **Stop** (⏹️): Stop and reset playhead to start
- **Loop**: Enable to continuously repeat between loop markers
- **Double-Click Markers**: Click timeline ruler to adjust nearest loop marker

#### Recording Sequencer Output
1. **Arrange Your Mix**: Set up clips, effects, and levels
2. **Click Record** (⏺️): Starts recording with automatic playback
3. **Watch Progress**: Live timer shows recording duration
4. **Stop Recording**: Click stop or wait for auto-stop at timeline end
5. **Review**: Play back with built-in controls
6. **Export or Load**:
   - **💾 Download**: Save as WebM, WAV, or MP3
   - **📥 Load to Track 1/2**: Send to DJ mixer for further processing

#### Sequencer Recording Features
- **High-Quality Audio**: Opus encoding (128kbps WebM)
- **Waveform Visualization**: Real amplitude data displayed
- **A-B Loop Markers**: Set loop points on recordings (click waveform twice)
- **Loop Controls**: Enable loop, clear markers, adjust playback
- **Multi-Format Export**: WebM (instant), WAV (lossless), MP3 (compressed)
- **DJ Integration**: Load recordings to tracks with full functionality
  - BPM detection, key detection, all effects, export capability

#### Advanced Sequencer Workflow
```
1. Arrange clips across multiple tracks
2. Apply per-clip effects (volume, pitch, filter, etc.)
3. Shape dynamics with ADSR envelopes
4. Record sequencer output
5. Load recording to Track 1 or Track 2
6. Mix with other tracks using crossfader
7. Apply master effects
8. Record final master output
```

#### UI Optimizations
- **Auto-Resize Timeline**: Height adjusts based on track count (300px-80vh)
- **Timeline Expansion**: Gains +280px width and +5vh height when effects panel hidden
- **Auto-Zoom**: Automatically adjusts zoom to fit long clips
- **Always-Visible Controls**: Add Track button always accessible
- **Responsive Layout**: Adapts to different screen sizes

**Use Cases**: Live performance prep, multi-track compositions, mashups, remixing, layering workflows, sampling, beat making

### Recording
1. Set up your mix (volume, tempo, loops, effects)
2. (Optional) Enable microphone for voice/instrument input
3. (Optional) Enable vocoder and/or auto-tune effects
4. (Optional) Capture tab audio for remixing online content
5. Click "Start Recording"
6. Perform your mix
7. Click "Stop Recording"
8. Choose what to do with your recording:
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

**NEW: Tab Capture Recording**:
- Capture YouTube audio to Track 1
- Apply effects (reverb, delay, filter)
- Record to master output
- Load recording back to Track 2
- Create remixes of online content!

**Export Format Guide**:
- **WebM**: Best for quick capture, minimal file size, good quality
- **WAV**: Professional production, mastering, compatibility with all DAWs
- **MP3**: Sharing online, email, storage optimization

### 3D Visualization
- **Four Modes**: Circle, Bars, Sphere, XY Oscilloscope
- **Circle Mode Features**:
  - **Dynamic Heat Map Colors**: Bars change color based on their height/energy
    - Blue (0-20%): Low energy, quiet passages
    - Cyan (20-40%): Building energy
    - Green (40-60%): Medium energy
    - Yellow (60-80%): High energy
    - Red (80-100%): Maximum energy, bass drops
  - **Smooth Transitions**: Colors blend seamlessly as energy changes
  - **Emissive Glow**: Bars emit light matching their color
- **XY Oscilloscope Mode** (Lissajous):
  - Cartesian coordinate display centered at (0,0)
  - Dynamic phase-offset plotting for complex stereo patterns
  - Radial gradient colors (magenta→cyan)
  - Motion blur trails and glow effects
  - Shows stereo correlation and harmonic relationships
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
- **Audio**: Web Audio API (AnalyserNode, GainNode, BiquadFilterNode, ConvolverNode, DelayNode, MediaStreamSource, MediaStreamDestination)
- **Tab Capture**: getDisplayMedia API for screen/tab sharing with audio (Chrome/Edge only)
- **Microphone**: getUserMedia API for audio input capture
- **Camera**: getUserMedia API for video capture (theremin hand detection)
- **Vocal Effects**: 
  - **Vocoder**: Band-pass filter banks with envelope followers
  - **Auto-Tune**: Autocorrelation pitch detection with delay-based pitch shifting
- **Export**: 
  - OfflineAudioContext for rendering with effects
  - WAV encoding (PCM 16-bit)
  - MP3 encoding via lamejs (128 kbps)
- **Recording**: MediaRecorder API (WebM format) with MIME type detection
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
| Tab audio capture | ✅ | ❌ | ❌ | ✅ |
| Camera theremin | ✅ | ✅ | ✅** | ✅ |

*Safari may require MediaRecorder polyfill  
**Safari requires HTTPS for getUserMedia (microphone/camera access)

## Version History

- **v3.32.0** (Current) - Master Limiter + Per-Track VU Metering + cross-deck hot cues
  - Hard `DynamicsCompressorNode` limiter on master bus (threshold −1 dBFS, ratio 20:1)
  - Three `AnalyserNode` side-taps: Track 1 (post-effects), Track 2 (post-effects), Master (post-limiter)
  - Horizontal RMS canvas meters; green→yellow→orange→red gradient; 3s peak hold; latching clip dot
  - Limiter toggle (purple glow = on); GR readout; meter rows hidden until track loaded
  - `Alt+1`–`8` keyboard shortcut triggers hot cues on the non-focused track (cross-deck)
  - Hot cues, beat grid, slip mode now correctly enabled when loading recordings to tracks
- **v3.31.0** - Browser Whisper Transcription
  - Offline speech-to-text via Transformers.js + xenova/whisper-base
  - Transcription panel for each track and master output recordings; export as text
  - Runs entirely in a Web Worker — no server round-trips
- **v3.30.0** - Sidechain bidirectional improvement
  - Ducking direction toggle: Track 1 ducks Track 2 or Track 2 ducks Track 1
- **v3.29.0** - Sidechain Compression
  - `AnalyserNode` tap on source track; `GainNode` ducking on target track
  - Controls: threshold, ratio, attack, release, wet/dry; GR meter
- **v3.28.1** - Beat Grid, Slip Mode, Loop Roll + Beat Jump
  - Beat grid canvas overlay with auto-BPM, tap tempo, nudge, snap toggle
  - Slip mode: hold-to-slip ghost amber playhead; release snaps to virtual position
  - 8 hold-to-roll buttons per track (1/32–4 bars); 8 beat-jump buttons (±1/2/4/8 beats)
  - Keyboard: `[`/`]` ±1 beat, `{`/`}` ±4 beats on focused deck
- **v3.28.0** - Hot Cues (CDJ-Style)
  - 8 labeled, color-coded cue points per track; waveform markers; localStorage persistence
  - `1`–`8` jump, `Shift+1`–`8` set; focus switches between decks on button click
- **v3.26** - Professional constant-power stereo panning
  - Fixed critical signal chain disconnection bug with timestretching
  - Implemented 4-gain routing matrix (L→L, L→R, R→L, R→R)
  - Sine/cosine curves for smooth L-R transitions
  - Preserves stereo quality without mono downmixing
  - Works flawlessly with all effects and timestretching
- **v3.25** - Sequencer fullscreen toggle
  - Live fullscreen mode with instant switching
  - Button control and keyboard shortcut (ESC)
  - Full viewport (100vw × 100vh) with dark overlay
  - Expanded panels and smooth fade-in animation
  - All sequencer functionality fully operational
- **v3.24** - Sequencer zoom & pan with waveform visualization
  - Zoom control (50%-200%) for detailed editing
  - Shift+drag or middle-mouse timeline panning
  - Mini waveforms rendered on every clip
  - High-DPI canvas rendering for crisp display
  - Intelligent panning that doesn't interfere with clip dragging
  - Zoom-aware waveform redrawing
- **v3.23** - Seamless timestretching + reverse mode integration
  - Dual buffer storage for forward/reversed timestretched audio
  - Unified rendering strategy
  - Instant mode switching without regeneration
  - Maintains audio quality when toggling reverse
  - Perfect for live DJ performance workflows
- **v3.22** - Sequencer per-track mixer
  - Independent volume control per track (0-100%)
  - Per-track gain nodes with proper audio routing
  - Visual volume sliders in track headers
  - Fixed no-audio-output bug from sequencer playback
  - Clean signal flow: Clip → Track Gain → Sequencer Output → Master
- **v3.21** - Independent pitch & tone controls
  - Pitch slider (±12 semitones) with Tone.js integration
  - Tone slider (20Hz-20kHz low-pass filter)
  - True independent pitch shifting without tempo changes
  - Live draggable controls during playback
  - Reordered UI for logical workflow
  - Fallback to vinyl-style if Tone.js unavailable
- **v3.20** - Major sequencer enhancements
  - Non-destructive clip trimming by dragging edges
  - Real-time effect updates during playback (volume, pitch, filter, delay)
  - Toggleable effects panel to maximize workspace
  - Automatic timeline resize based on track count (300px-80vh)
  - Timeline expansion when effects hidden (+280px width, +5vh height)
  - Auto-zoom to fit long clips
  - Fixed "Add Track" button always visible
  - Fixed trim accumulation bug
- **v3.19.1** - Critical bugfix
  - Fixed master recording to track playback issue
  - Audio element source preservation when loading recordings
  - All recording workflows now work correctly
- **v3.19** - Sequencer recording with track integration
  - One-click sequencer recording with Opus encoding
  - Live waveform preview and recording timer
  - Auto-stop at timeline end or loop recording mode
  - Load recordings directly to Track 1 or Track 2
  - Double-click loop marker adjustment
  - Clip name overflow fixes
  - Critical audio capture timing fixes
- **v3.18** - Sequencer recording enhancements
  - Accurate waveform visualization for recordings
  - A-B loop markers for sequencer recordings
  - Full loop controls (set, enable, clear)
- **v3.17** - Per-clip ADSR envelopes
  - Attack, Decay, Sustain, Release controls per clip
  - Manual trigger buttons for envelope preview
  - Seamless playback integration
- **v3.16** - Individual clip effects
  - Click-to-edit effects panel for each clip
  - Volume, pitch shift, multimode filter, reverb, delay per clip
  - Smart UI integration with workspace expansion
- **v3.15** - Multi-track sequencer
  - Timeline-based arrangement with drag and drop
  - Unlimited sequencer tracks with mute/solo/delete
  - Dynamic bar management (60-200 BPM)
  - Visual playhead animation
  - Grid-based clip positioning
- **v3.14** - Precise loop markers with millisecond accuracy
  - Numeric inputs for exact loop times (0.001s precision)
  - Interactive time tooltip on hover
  - Intelligent marker adjustment
  - Works at 16x-20x zoom levels
- **v3.13** - Browser tab audio capture feature
  - Capture audio from any browser tab (YouTube, Spotify, etc.)
  - Route to Track 1, Track 2, or Microphone input
  - Full effects support (volume, pan, filter, reverb, delay)
  - Record tab capture to master output
  - Use with vocoder/auto-tune effects
  - Mix with crossfader and other tracks
  - Chrome/Edge only (browser limitation)
  - Automatic cleanup when loading files to tab capture tracks
  - Comprehensive documentation and troubleshooting guides
- **v3.12** - ADSR Envelope effects
  - Attack, Decay, Sustain, Release controls for all tracks
  - Manual trigger buttons for precise envelope activation
  - Integrated into drag-and-drop effect chains
  - Conditional sampler ADSR (enable/disable per note)
  - 15+ creative use cases documented
- **v3.11** - Camera Theremin feature
  - Motion-controlled instrument using webcam
  - Wave detection with adjustable sensitivity
  - Three control modes (Pitch & Volume, Filter & Resonance, ADSR Envelope)
  - Audio sources (oscillator, Track 1, Track 2)
  - Adaptive motion detection and wave-only mode
- **v3.10** - Professional DJ crossfader
  - Three modes (Track1↔Track2, Track1↔Mic, Track2↔Mic)
  - Equal-power crossfade curves for smooth transitions
  - Dynamic mode switching and visual feedback
- **v3.9** - Microphone and effects routing enhancements
  - Standalone microphone recording
  - Flexible vocoder/auto-tune routing
  - Load mic recordings to tracks
  - Master output routing toggles
- **v3.8** - Professional DJ mixer redesign
  - Authentic DJ layout with dual decks
  - Vertical faders and stereo panning controls
- **v3.7** - Drag-and-drop effect chains
  - Reorder effects visually for Track 1, Track 2, Master
  - Toggle effects on/off with dynamic visibility
- **v3.6.1** - Reverse loop smoothness improvements
- **v3.6** - Dual track controls (play both, record both)
- **v3.5** - XY Oscilloscope visualization mode
- **v3.4** - Phase 2 refactoring (microphone, vocoder, autotune modules)
- **v3.3** - Code refactoring & seamless loop improvements
- **v3.2** - Reverse loop playback feature
- **v3.1** - Fixed sampler output routing to recording
- **v3.0** - Keyboard sampler feature with volume control
- **v2.9** - Improved load recording & seamless track loading
- **v2.8** - Load recording to track fix
- **v2.7** - Recording export formats (WebM/WAV/MP3)
- **v2.6** - MP3 and WAV export for tracks
- **v2.5** - Load recording to tracks for layering
- **v2.4** - Loop playback audio fixes
- **v2.3** - Dynamic heat map colors in Circle mode
- **v2.2** - Auto-tune effect
- **v2.1** - Microphone as vocoder carrier option
- **v2.0** - Vocoder effect
- **v1.8** - Microphone input
- **v1.7** - Recording with waveform
- **v1.6** - Export functionality
- **v1.5** - Audio effects
- **v1.4** - Quick loop creation
- **v1.3** - Waveform zoom and pan
- **v1.2** - A-B loop markers
- **v1.1** - BPM detection
- **v1.0** - Initial dual-track DJ system

See [CHAT_HISTORY.md](CHAT_HISTORY.md) for detailed development history.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
