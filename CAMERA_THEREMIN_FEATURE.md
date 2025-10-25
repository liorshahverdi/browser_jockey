# Camera Theremin Feature

## Overview
Added a camera-based theremin instrument that allows users to control various audio parameters through hand motion detected by their webcam. This provides an interactive, expressive way to create music alongside the existing DJ tracks and keyboard sampler.

## Implementation Date
October 25, 2025

## Last Updated
October 25, 2025 - Added multiple control mapping modes (see [THEREMIN_MAPPING_MODES.md](THEREMIN_MAPPING_MODES.md))

## Features

### Control Mapping Modes 🆕
The theremin now supports three different mapping modes for controlling audio parameters:

1. **Pitch & Volume (Classic)** - Traditional theremin control
   - Y-axis: Pitch/Filter frequency
   - X-axis: Volume

2. **Filter & Resonance** - Advanced filter control
   - Y-axis: Filter cutoff (brightness)
   - X-axis: Filter resonance/Q (sharpness)

3. **ADSR Envelope** - Dynamic envelope shaping
   - Y-axis: Attack (top) / Release (bottom)
   - X-axis: Decay (left) / Sustain (right)

📖 **See [THEREMIN_MAPPING_MODES.md](THEREMIN_MAPPING_MODES.md) for detailed documentation**

### Motion Control
- **Vertical Motion (Y-axis)**: Parameter control varies by mapping mode
  - Pitch & Volume: Frequency control
  - Filter & Resonance: Filter cutoff
  - ADSR: Attack (top half) / Release (bottom half)

- **Horizontal Motion (X-axis)**: Parameter control varies by mapping mode
  - Pitch & Volume: Volume control
  - Filter & Resonance: Resonance/Q
  - ADSR: Decay (left half) / Sustain (right half)

### Visual Feedback
- Live camera feed with mirrored display for intuitive control
- Real-time motion tracking with crosshair indicator
- Dynamic parameter values overlaid on video (changes with mapping mode)
- Color-coded status indicators:
  - **Cyan**: Searching for hand
  - **Orange**: Hand detected, wave to activate
  - **Green**: Active (wave detected)
- Motion detection highlights the most active region

### Sound Synthesis

#### Audio Source Options
- **Oscillator (Synthesizer)**: Pure synthesis with waveform selection
- **Track 1**: Use loaded track as audio source for modulation
- **Track 2**: Use loaded track as audio source for modulation

#### Waveform Options (Oscillator Mode Only)
- **Sine**: Pure, smooth tone (classic theremin sound)
- **Triangle**: Soft, mellow tone
- **Sawtooth**: Bright, rich harmonics
- **Square**: Retro, electronic sound

#### Pitch Range Presets (Oscillator Mode Only)
- **Low**: 100-800 Hz (deep, bass-like tones)
- **Medium**: 200-2000 Hz (default, vocal-like range)
- **High**: 400-4000 Hz (bright, whistle-like tones)
- **Wide**: 100-4000 Hz (full expressive range)

#### Audio Effects
- **Vibrato**: Automatic pitch modulation for expressiveness
  - Rate control: 0-15 Hz
  - Depth control: 0-50 Hz
  - Creates natural, warbling effect

- **Low-pass Filter**: Dynamic filtering
  - Behavior varies by mapping mode
  - In Pitch/Volume mode: Follows hand position
  - In Filter/Resonance mode: Directly controlled by Y-axis
  - In ADSR mode: Fixed, envelope affects gain

- **Reverb**: Built-in reverb effect
  - 70% dry / 30% wet mix
  - Creates spatial depth and atmosphere

### Audio Routing
- Theremin output routes to:
  - Master output (mix with tracks and sampler)
  - Recording destination (can be recorded with master mix)
  
- Integrates seamlessly with:
  - Dual track DJ mixer
  - Keyboard sampler
  - Microphone input
  - Master effects chain

## Technical Details

### Files Created
- `/app/static/js/modules/theremin.js` - Main theremin module

### Files Modified
- `/app/templates/index.html` - Added theremin UI section
- `/app/static/css/style.css` - Added theremin styling
- `/app/static/js/visualizer-dual.js` - Integrated theremin controls and event handlers

### Motion Detection Algorithm
The theremin uses a simple but effective computer vision approach:

1. **Frame Capture**: Video frames are drawn to a hidden canvas
2. **Block Sampling**: Image is sampled in 16x16 pixel blocks for efficiency
3. **Activity Detection**: Each block is scored based on:
   - Brightness (average RGB values)
   - Color variance (indicates motion/edges)
4. **Position Smoothing**: Exponential smoothing (80% previous, 20% new) prevents jittery audio
5. **Parameter Mapping**: Smoothed position maps to frequency and volume

### Audio Architecture
```
Motion Detection → Smoothed Position
                         ↓
    ┌────────────────────┴────────────────────┐
    │                                         │
    ↓                                         ↓
Frequency (Y-axis)                    Volume (X-axis)
    ↓                                         ↓
Oscillator ← Vibrato LFO             Gain Node
    ↓                                         ↓
Low-pass Filter ← X-position              Dry/Wet
    ↓                           ┌──────────────┴──────────┐
    └──────────→ Gain ←────────┘                          │
                  │                                        │
            ┌─────┴─────┐                                 │
            ↓           ↓                                  ↓
        Dry (70%)   Reverb (30%)                    Recording
            │           │                               Destination
            └────→ Mix ←┘
                  ↓
            Master Output
```

## User Interface

### Location
The Camera Theremin section appears in the center mixer panel, after the Keyboard Sampler section and before the Master Effects section.

### Controls

#### Enable/Disable
- **Enable Theremin** button: Requests camera permission and starts theremin
- **Disable Theremin** button: Stops theremin and releases camera

#### Video Feed
- Live camera preview (mirrored for intuitive control)
- Motion tracking overlay with crosshair
- Real-time frequency and volume display

#### Settings Panel
- **Waveform selector**: Choose oscillator waveform
- **Pitch Range selector**: Select frequency range preset
- **Vibrato Rate slider**: Adjust vibrato speed (0-15 Hz)
- **Vibrato Depth slider**: Adjust vibrato intensity (0-50 Hz)

## Browser Compatibility

### Required Features
- WebRTC (getUserMedia API) for camera access
- Web Audio API for sound synthesis
- Canvas API for motion detection

### Tested Browsers
- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Edge
- ⚠️ Safari (may require camera permissions prompt)

### Camera Requirements
- Any webcam (built-in or external)
- Minimum 640x480 resolution recommended
- Good lighting improves motion detection accuracy

## Usage Tips

### Getting Started
1. Click "Enable Theremin" button
2. Allow camera access when prompted
3. Position yourself in frame with good lighting
4. Move your hand to control sound

### Best Practices
- **Lighting**: Ensure good, even lighting for best motion detection
- **Background**: Contrasting background helps motion tracking
- **Distance**: Sit 2-3 feet from camera for optimal tracking
- **Movement**: Smooth, deliberate movements work best
- **Practice**: Experiment with different waveforms and ranges to find your preferred sound

### Creative Uses
- **Ambient Textures**: Use sine/triangle waves with low vibrato for atmospheric sounds
- **Lead Melodies**: Use sawtooth/square with medium range for melodic lines
- **Sound Effects**: Wide range with high vibrato for swooping effects
- **Live Performance**: Record theremin with DJ mix for unique performances

## Performance Considerations

### Optimization
- Motion detection runs at animation frame rate (~60 FPS)
- Block sampling reduces computational load
- Canvas operations are hardware-accelerated
- Audio smoothing prevents CPU spikes from rapid position changes

### Resource Usage
- **CPU**: Low to moderate (motion detection + audio synthesis)
- **Memory**: Minimal (single video frame buffer)
- **Camera**: Activates camera, ensure privacy settings are appropriate

## Privacy & Security
- Camera access only requested when enabling theremin
- No video recording or transmission
- Camera stream released when disabling theremin
- No data leaves the browser

## Future Enhancement Ideas
- Hand tracking using ML models (MediaPipe, TensorFlow.js)
- Multi-hand support for stereo control
- Gesture recognition for effect triggers
- Visual trail effects showing motion history
- Theremin presets (save/load favorite settings)
- MIDI output for controlling external synths
- Touch screen support for mobile devices

## Credits
Feature designed and implemented for Browser Jockey by Lior Shahverdi and Claude Sonnet 4.5.

## Related Features
- Keyboard Sampler (pitch-shifted sample playback)
- Microphone Input (live audio processing)
- Master Effects Chain (apply effects to theremin output)
- Master Recording (record theremin performances)
