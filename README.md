# Browser Jockey
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://browser-jockey.onrender.com/) (disclaimer - running on a free render instance so might not always be up. But feel free to clone this repo and run locally by following the guidelines below! Feedback/suggestions always welcome at liorshahverdi@gmail.com)

- 🎤 **Advanced Microphone System** - Professional microphone input with extensive features
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
- 🎨 **Musical Key Colors** - Visualization colors based on detected keycr- ✨ **Enhanced UI/UX** - Premium button styling with CSS Grid distribution, larger controls (80px), backdrop blur effects, and logical layout organization
- 🏗️ **Modular Architecture** - Clean ES6 modules for maintainability (see [MODULES.md](MODULES.md))
- 🐛 **Production Ready** - Comprehensive error handling and live performance optimizations
- 🔄 **Live Looping Workflow** - Record, load to tracks, set loop markers, and layer recordings for complex arrangementsone input with extensive features
  - 🎙️ Live mic input with volume control and real-time waveform monitoring
  - ⏺️ **Standalone Recording** - Record directly from microphone without any tracks loaded
  - 💾 Export mic recordings as WAV or MP3
  - 📥 **Load to Tracks** - Load mic recordings directly to Track 1 or Track 2
  - 🔀 **Flexible Routing** - Use microphone OR tracks as sources for effects
  - 🎛️ **Master Routing Control** - Toggle Track 1, Track 2, Microphone, or Keyboard Sampler to master output
- 🤖 **Vocoder Effect** - Robot voice effect with advanced routingo-live-brightgreen)](https://browserjockey.onrender.com/)

A dual-track DJ mixing web application with 3D audio visualization, XY oscilloscope, BPM detection, A-B loop markers, audio effects, microphone input with vocoder and auto-tune, standalone microphone recording, flexible audio routing, professional crossfader, and authentic DJ controls.

**Latest Update (v3.11.0)**: Added XY Oscilloscope (Lissajous mode) visualization! Beautiful Cartesian coordinate system with (0,0) at center, displaying stereo phase relationships and audio patterns in real-time. Features animated XY plotting with phase offset for dynamic Lissajous curves, radial color gradients (magenta to cyan), motion blur trails, glow effects, and grid overlay. Perfect for visualizing stereo correlation and harmonic relationships between tracks!

**v3.10.5**: Fixed critical bug where loop markers weren't setting on recorded .webm files! Now properly waits for audio metadata to load before allowing loop marker placement. Added duration validation to prevent silent failures. Includes better error handling with console warnings when duration is unavailable. Perfect for live looping workflows with recorded content.

**v3.10.4**: Enhanced UI with improved track controls layout and microphone master routing! Track control buttons now use CSS Grid for even distribution with larger, premium styling (80px min size). Waveform color picker relocated to upload section for better UX. Control buttons repositioned below BPM/Key info for logical flow. Added microphone to master output routing controls for precise mixing.

**v3.10.3**: UI improvements - Enhanced track control buttons with CSS Grid layout for even spacing, larger premium button styling, improved visual effects with backdrop blur and multi-layer shadows, relocated waveform color picker to upload section, and repositioned control buttons below track info.

**v3.10.0**: Added professional DJ crossfader with three modes (Track1↔Track2, Track1↔Mic, Track2↔Mic)! Features equal-power crossfade curves for smooth transitions, dynamic mode switching, and full three-column DJ layout (Track 1 | Mixer | Track 2). Master section reorganized with compact volume/pan controls. Includes critical bug fix for crossfader gain node references.

**v3.9.0**: Major microphone and effects routing enhancements! Added standalone microphone recording (record directly from mic without tracks), flexible vocoder/auto-tune routing (use mic OR tracks as sources), load microphone recordings to tracks, side-by-side tempo/volume controls for compact layout, and master output routing toggles for precise mixing control. Includes comprehensive bug fixes for audio node routing and AudioContext initialization.

**v3.8.0**: Complete professional DJ mixer redesign! Features authentic DJ layout with dual decks, vertical faders, and stereo panning controls. Interface now mirrors real DJ equipment with side-by-side decks (cyan/magenta), center mixer section, vertical volume/tempo sliders, and horizontal pan controls for precise stereo positioning. Recording integrated into master output section for streamlined workflow.

**v3.7.0**: Added drag-and-drop effect chains for Track 1, Track 2, and Master output! Reorder effects visually, toggle them on/off with dynamic slider visibility, and apply professional mastering effects to the final mix. Master channel features a distinctive golden theme. See [EFFECT_CHAIN_FEATURE.md](EFFECT_CHAIN_FEATURE.md), [EFFECT_CHAIN_ENHANCEMENT.md](EFFECT_CHAIN_ENHANCEMENT.md), and [MASTER_EFFECT_CHAIN.md](MASTER_EFFECT_CHAIN.md) for details.

**v3.6.1**: Significantly improved reverse loop smoothness with adaptive update frequency, time accumulator pattern, and real-time visual feedback. Progress bar now smoothly moves backwards during reverse playback. See [REVERSE_LOOP_SMOOTHNESS_FIX.md](REVERSE_LOOP_SMOOTHNESS_FIX.md) and [REVERSE_LOOP_PROGRESS_VISUAL.md](REVERSE_LOOP_PROGRESS_VISUAL.md) for details.

**v3.6.0**: Added Dual Track Controls - new buttons to play both tracks simultaneously and to play both tracks while recording. Perfect for live mixing and creating layered recordings! See [DUAL_TRACK_CONTROLS_FEATURE.md](DUAL_TRACK_CONTROLS_FEATURE.md) for details.

## Screenshots

![Browser Jockey](app/screenshots/Screenshot%202025-10-24%20at%2014.18.13.png)

![Master Output](app/screenshots/Screenshot%202025-10-24%20at%2015.26.33.png)

![Browser Jockey Effects Chain](app/screenshots/Screenshot%202025-10-24%20at%2015.28.00.png)



## Features

- 🎧 **Professional DJ Layout** - Authentic three-column DJ mixer design
  - 🎛️ Dual decks side-by-side (cyan/magenta color coding)
  - 🎚️ Vertical faders for volume and tempo (like real DJ mixers)
  - 🔄 Horizontal pan controls for stereo positioning
  - �️ Center mixer section with crossfader and dual track controls
  - 🏆 Master output with integrated recording section
  - ✨ Glowing effects and neon accents matching DJ equipment
- ⚡ **Professional Crossfader** - Smooth transitions with equal-power curves
  - 🔀 Three modes: Track1↔Track2, Track1↔Mic, Track2↔Mic
  - 📊 Equal-power crossfade algorithm (constant perceived loudness)
  - 🎨 Visual gradient slider with dynamic labels
  - 🎚️ Respects individual volume slider settings
- 🎚️ **Stereo Panning** - Full L/R stereo control for each track and master output
- 🎛️ **Dual Track DJ System** - Load and mix two audio tracks simultaneously
- ▶️▶️ **Dual Track Controls** - Play both tracks at once, or play both and record simultaneously
- 🎤 **Advanced Microphone System** - Professional microphone input with extensive features
  - 🎙️ Live mic input with volume control and real-time waveform monitoring
  - ⏺️ **Standalone Recording** - Record directly from microphone without any tracks loaded
  - 💾 Export mic recordings as WAV or MP3
  - 📥 **Load to Tracks** - Load mic recordings directly to Track 1 or Track 2
  - 🔀 **Flexible Routing** - Use microphone OR tracks as sources for effects
  - �️ **Master Routing Control** - Toggle Track 1, Track 2, or Keyboard Sampler to master output
- 🤖 **Vocoder Effect** - Robot voice effect with advanced routing
  - 8-32 frequency bands with adjustable mix
  - Select modulator source: Microphone, Track 1, or Track 2
  - Select carrier source: Microphone (Feedback), Track 1, Track 2, or Both Tracks (Mix)
  - Mic-to-mic feedback for creative robotic effects
- �🎵 **Auto-Tune Effect** - Real-time pitch correction with flexible sources
  - Select audio source: Microphone, Track 1, or Track 2
  - Key/scale selection with adjustable correction speed and strength
  - Works standalone or with tracks
- 🎵 **BPM Detection** - Automatic tempo detection for each track
- 🎹 **Key Detection** - Per-track musical key analysis
- 🔁 **A-B Loop Markers** - Create precise loops with draggable markers
- ⏪ **Reverse Loop** - Play loops backwards with seamless toggle (perfect for live performance)
- ⚡ **Quick Loops** - Auto-create 1, 2, 4, or 8 bar loops based on BPM
- 🎚️ **Seamless Loop Control** - Toggle between forward/reverse during playback with no audio cuts
- 🔧 **WebM Loop Support** - Full loop marker support for recorded .webm files with proper metadata handling
- 🔍 **Waveform Zoom** - Zoom up to 20x with drag-to-pan
- 🔗 **Drag-and-Drop Effect Chains** - Visually reorder effects for Track 1, Track 2, and Master output
  - 🎚️ Filter, Reverb, Delay per track
  - ✓/✗ Toggle effects on/off with dynamic slider visibility
  - ⋮⋮ Drag to reorder effect processing
  - 🏆 Master effect chain with golden theme for final mix processing
- 🎚️ **Audio Effects** - Reverb, delay, and filters (low/high/band pass)
- 🎛️ **Master Output Effects** - Apply professional mastering effects to the final mixed output
- ⏺️ **Master Recording** - Record your mix directly from master output
  - 💾 Export as WebM, WAV, or MP3
  - 📥 Load recordings back to tracks for layering
- 💾 **Export** - Export full stems or loop regions as WAV or MP3 files
- 🎵 **Format Options** - Choose between WAV (lossless) or MP3 (compressed 128kbps) export
-  **3D Visualization** - Real-time WebGL visualization with Three.js (Circle/Bars/Sphere modes)
- 🌈 **Dynamic Heat Map Colors** - Circle mode bars change color based on energy (blue→cyan→green→yellow→red)
- 🎨 **Musical Key Colors** - Visualization colors based on detected key
- 🎹 **Keyboard Sampler** - Play tracks/loops/recordings on pentatonic scales using keyboard (Q-I, A-K keys)
  - 🎼 Multiple scales: Pentatonic Major/Minor, Chromatic
  - 🎵 Transposable to any root note (C through B)
  - 🎚️ Independent volume control for mixing with tracks
  - 🎯 2-octave range with pitch shifting
  - 📦 Sample from any track, loop region, or recording
- 🎨 **Customizable Colors** - Personalize waveform colors for each track
- � **Enhanced UI/UX** - Premium button styling with CSS Grid distribution, larger controls (80px), backdrop blur effects, and logical layout organization
- �🏗️ **Modular Architecture** - Clean ES6 modules for maintainability (see [MODULES.md](MODULES.md))
- 🐛 **Production Ready** - Comprehensive error handling and live performance optimizations

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

### 3D Visualization & Oscilloscope
- **Three Visualization Modes**: Circle, Bars, Sphere
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
- **XY Oscilloscope** (Side-by-side with 3D visualization):
  - **Lissajous Mode**: Classic XY plotting for stereo phase visualization
  - **Cartesian Grid**: Centered at (0,0) with clear X and Y axes
  - **Dynamic Patterns**: Shape morphs based on stereo relationships
    - Circular patterns when tracks are in phase
    - Diagonal lines when one track dominates
    - Complex Lissajous curves for harmonic relationships
  - **Visual Effects**: Motion blur trails, radial gradients, glow points
  - **Real-time Response**: Animated based on combined audio from both tracks
  - **Recorded Audio Playback**: When you play a recording, oscilloscope automatically switches to display it
  - **Smart Switching**: Returns to showing tracks when recording stops

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

- **v3.4** (Current) - Phase 2 refactoring: Microphone, vocoder, and autotune modules
  - Created 3 additional modules: microphone.js, vocoder.js, autotune.js (540 lines)
  - Total of 9 ES6 modules (1,635 lines of organized, reusable code)
  - Reduced main file from 3,825 to 3,600 lines (21.4% total reduction from original)
  - Refactored visualizer.js to use shared constants and utilities
  - 40+ functions now modularized with clean separation of concerns
  - Comprehensive documentation: MODULES.md, REFACTORING_STATUS.md, TESTING_GUIDE.md
- **v3.3** - Code refactoring & seamless loop improvements
  - Modularized codebase (6 reusable modules: constants, loop-controls, audio-utils, audio-effects, recording, sampler)
  - Reduced main file by 753 lines (16.4% reduction)
  - Fixed reverse loop bugs (loop points preservation, toggle logic)
  - Seamless loop toggling for live performance (no audio cuts when switching modes)
  - Improved error handling and validation
- **v3.2** - Reverse loop playback feature
- **v3.1** - Fixed sampler output routing to recording destination
- **v3.0** - Keyboard sampler feature with volume control
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