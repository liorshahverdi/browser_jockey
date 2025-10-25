# Browser Jockey v3.12.0 - ADSR Envelopes & Camera Theremin

**Release Date**: October 25, 2025

## Overview

Version 3.12.0 introduces two major features that dramatically expand the creative capabilities of Browser Jockey: comprehensive ADSR envelope effects and a camera-based theremin instrument with intelligent wave detection. These additions transform the application into a powerful tool for expressive performance and innovative sound design.

---

## Major Features

### 1. ADSR Envelope Effects

Professional envelope shaping is now available across all audio contexts in Browser Jockey.

#### What are ADSR Envelopes?

ADSR stands for Attack, Decay, Sustain, Release - the four stages of an audio envelope that shapes how sounds evolve over time:

- **Attack**: How quickly the sound reaches full volume (1-2000ms)
- **Decay**: How quickly it drops from peak to sustain level (1-2000ms)  
- **Sustain**: The held volume level (0-100%)
- **Release**: How quickly it fades to silence after release (1-5000ms)

#### Implementation Locations

ADSR envelopes are integrated throughout Browser Jockey:

1. **Track 1 ADSR**: Shape the envelope of Track 1's audio
   - 4 sliders: Attack, Decay, Sustain, Release
   - Trigger button for manual envelope activation
   - Orange/amber themed controls

2. **Track 2 ADSR**: Independent envelope control for Track 2
   - Same controls as Track 1
   - Parallel processing with Track 1

3. **Master ADSR**: Shape the final mixed output
   - Apply envelope to the master bus
   - Affects all audio sources together
   - Perfect for global ducking or gating effects

4. **Keyboard Sampler ADSR**: Per-note envelope control
   - Enable/disable toggle
   - Conditional application (traditional decay or ADSR)
   - 4 sliders for envelope parameters
   - Transform sampled sounds into synthesizer-like instruments

#### Effect Chain Integration

ADSR is now a draggable effect in the effect chain system:

- **Icon**: 📊 (distinctive visual identifier)
- **Position**: Can be reordered with Filter, Reverb, Delay
- **Toggle**: Enable/disable with ✓/✗ buttons
- **Dynamic UI**: Sliders show/hide based on toggle state

#### Technical Implementation

**Audio Architecture**:
```javascript
// ADSR creates a GainNode with time-based envelope
createADSREnvelope(audioContext) {
    const adsrGain = audioContext.createGain();
    adsrGain.gain.setValueAtTime(0, audioContext.currentTime);
    return {
        gainNode: adsrGain,
        attack: 0.01,   // seconds
        decay: 0.1,     // seconds  
        sustain: 0.7,   // level (0-1)
        release: 0.3    // seconds
    };
}

// Trigger attack phase
triggerADSRAttack(adsr, audioContext) {
    const now = audioContext.currentTime;
    adsr.gainNode.gain.cancelScheduledValues(now);
    adsr.gainNode.gain.setValueAtTime(0, now);
    
    // Attack: Ramp up exponentially
    adsr.gainNode.gain.exponentialRampToValueAtTime(1.0, now + adsr.attack);
    
    // Decay: Ramp down to sustain level
    adsr.gainNode.gain.exponentialRampToValueAtTime(
        adsr.sustain, 
        now + adsr.attack + adsr.decay
    );
}

// Trigger release phase  
triggerADSRRelease(adsr, audioContext) {
    const now = audioContext.currentTime;
    const currentGain = adsr.gainNode.gain.value;
    adsr.gainNode.gain.cancelScheduledValues(now);
    adsr.gainNode.gain.setValueAtTime(currentGain, now);
    adsr.gainNode.gain.exponentialRampToValueAtTime(0.01, now + adsr.release);
}
```

**Signal Routing**:
- Signal passes through ADSR GainNode
- Envelope modulates signal amplitude over time
- Can be positioned anywhere in effect chain

**Sampler Integration**:
```javascript
playSamplerNote(note, adsrEnabled, adsrParams) {
    if (adsrEnabled) {
        // Create ADSR envelope
        const envelope = createADSREnvelope(audioContext);
        source.connect(envelope.gainNode);
        
        // Trigger attack
        triggerADSRAttack(envelope, audioContext);
        
        // Schedule release based on note duration
        setTimeout(() => {
            triggerADSRRelease(envelope, audioContext);
        }, noteDuration - releaseTime);
    } else {
        // Traditional exponential decay
        source.connect(gainNode);
        gainNode.gain.exponentialRampToValueAtTime(0.01, duration);
    }
}
```

#### Creative Use Cases

See `ADSR_CREATIVE_USE_CASES.md` for 15 detailed use cases including:

1. **Pluck Effect**: Fast attack, short decay, low sustain
2. **Pad Sounds**: Slow attack, medium decay, high sustain
3. **Stab Effect**: Fast attack, fast decay, zero sustain
4. **Gate Effect**: Instant attack, zero sustain, fast release
5. **Swell Effect**: Very slow attack, high sustain
6. **Brass Simulation**: Medium attack, low sustain
7. **Organ Simulation**: Instant attack, full sustain
8. **Piano Simulation**: Fast attack, slow decay
9. **Ducking Effect**: Master ADSR for side-chain-like ducking
10. **Rhythmic Gating**: Short attack/decay for rhythmic chops
11. **Reverse Swell**: Combined with reverse playback
12. **Percussion Shaping**: Shorten or extend drum hits
13. **Vocal Chops**: Sampler ADSR for chopped vocals
14. **Synth Bass**: Transform samples into synthesized bass
15. **Ambient Textures**: Long attack/release for atmospheres

---

### 2. Camera Theremin with Adaptive Wave Detection

A motion-controlled instrument that uses your webcam to create expressive theremin-style performances.

#### Core Concept

The camera theremin turns hand movements into musical control:

- **X-axis (Horizontal)**: Controls one parameter (e.g., pitch, filter frequency)
- **Y-axis (Vertical)**: Controls another parameter (e.g., volume, resonance)
- **Wave Detection**: Must wave hand left-right to activate sound

#### Control Mapping Modes

Three powerful modes for different performance styles:

**1. Pitch & Volume (Classic)**:
- Y-axis: Pitch (top = high, bottom = low)
- X-axis: Volume (left = quiet, right = loud)
- Traditional theremin behavior
- Frequency range: 200Hz - 2000Hz

**2. Filter & Resonance**:
- Y-axis: Filter cutoff (top = bright, bottom = dark)
- X-axis: Filter resonance/Q
- Fixed volume for consistent output
- Cutoff range: 100Hz - 10kHz
- Q range: 0.5 - 20.5

**3. ADSR Envelope**:
- Y-axis top half: Attack time (0.001 - 2.0s)
- Y-axis bottom half: Release time (0.001 - 5.0s)
- X-axis left half: Decay time (0.001 - 2.0s)
- X-axis right half: Sustain level (0 - 100%)
- Real-time envelope modulation
- Perfect for evolving textures

#### Audio Sources

Choose what the theremin controls:

1. **Built-in Oscillator** (Synthesizer):
   - Pure sine, triangle, sawtooth, or square waves
   - Waveform selector in settings
   - Clean, simple tones
   - Built-in vibrato with rate/depth controls

2. **Track 1**:
   - Use loaded audio as theremin source
   - Motion controls filter and volume
   - Create experimental effects
   - Transform existing tracks

3. **Track 2**:
   - Alternative track source
   - Same modulation capabilities
   - Mix with Track 1 independently

#### Adaptive Wave Detection System

The theremin uses intelligent motion detection optimized for varying lighting conditions.

**Detection Algorithm**:

1. **Motion Analysis** (12x12 pixel blocks):
   - Brightness analysis
   - Variance calculation
   - Edge strength detection
   - Combined motion score

2. **Hand Confidence Tracking**:
   - Adaptive baseline calibration (60 frames)
   - Dynamic threshold: `baseline × (2.0 / sensitivity)`
   - Rolling confidence value (0.0 - 1.0)
   - Smooth transitions with hysteresis

3. **Wave Detection** (30-frame position history):
   - Direction change counting
   - Movement range calculation (min to max X)
   - Total movement accumulation
   - **Thresholds** (relaxed for usability):
     - ≥2 direction changes (back-and-forth motion)
     - ≥15% screen width range
     - ≥0.3 total movement
   - 10-second auto-deactivation

**Adjustable Sensitivity** (0.5x - 3.0x):

```javascript
// Threshold calculation
const baseMultiplier = 2.0 / sensitivity;
const dynamicThreshold = Math.max(
    baselineScore × baseMultiplier,
    avgRecentScore × (0.6 / sensitivity)
);

// Example with different sensitivities:
// Baseline: 250, Sensitivity: 1.0x
// → Threshold: 250 × 2.0 = 500

// Baseline: 250, Sensitivity: 2.0x  
// → Threshold: 250 × 1.0 = 250 (more sensitive)

// Baseline: 250, Sensitivity: 0.5x
// → Threshold: 250 × 4.0 = 1000 (less sensitive)
```

**Hand Detection Requirement Toggle**:

- **Enabled** (requireHandDetection = true):
  - Both hand detection AND wave detection required
  - More precise control
  - Harder to activate in difficult lighting

- **Disabled** (requireHandDetection = false) - DEFAULT:
  - Only wave detection required
  - Easier activation
  - Works in varied lighting conditions
  - **Recommended for most users**

#### Visual Feedback System

Real-time visual indicators show detection status:

**1. Detection Status Bar** (bottom-left of video):
- **Color-coded confidence level**:
  - 🟢 Green: Wave active, sound playing
  - 🟠 Orange: Hand detected, wave to activate
  - 🟡 Yellow: Some confidence (30%+)
  - 🔴 Red: Low/no confidence
- **Status text**:
  - "ACTIVE ✓" - Sound playing
  - "Wave to activate 👋" - Hand detected
  - "Searching..." - No hand detected
- **Confidence bar**: Visual representation (0-100%)

**2. Crosshair Tracking**:
- **Color matches detection state**:
  - Cyan: Searching
  - Orange: Hand detected
  - Green: Wave active
- **Size scales with state**:
  - 30px: Searching
  - 40px: Hand detected
  - 50px: Wave active
- **Position**: Tracks hand location in real-time

**3. Frequency/Volume Display** (top-left):
- Shows current parameter values
- Updates in real-time
- Label changes based on mapping mode:
  - Pitch & Volume: "Freq: XXX Hz | Vol: YY%"
  - Filter & Resonance: "Filter: XXXXHz | Q: Y.Y"
  - ADSR: "A: 0.XXXs | D: 0.XXXs"

**4. Console Logging** (for debugging):
- `📹 Motion detection loop running` - Every 2 seconds
- `🔍 Detection status` - Every 3 seconds (confidence, score, threshold)
- `Hand DETECTED/LOST` - State changes with metrics
- `🔍 Wave check` - Every 0.5s when hand detected but wave inactive
- `👋 WAVE DETECTED!` - When wave criteria met
- `🔊 Theremin sound active!` - When sound starts
- `🎛️ External source: Filter=XXXXHz, Volume=YY%` - Every second while playing
- `🔇 Fading out theremin` - When conditions not met

#### Theremin Settings

**Master Volume** (0-100%):
- Controls overall theremin output level
- Independent from track volumes
- Default: 50%

**Vibrato Controls**:
- **Rate** (0-15 Hz): LFO frequency
- **Depth** (0-50 Hz): Pitch modulation amount
- Classic theremin vibrato effect

**Pitch Range Selection**:
- **Low**: 100-800 Hz
- **Medium**: 200-2000 Hz (default)
- **High**: 400-4000 Hz
- **Wide**: 100-4000 Hz

**Waveform** (Oscillator mode only):
- Sine: Pure, smooth tone
- Triangle: Soft, mellow
- Sawtooth: Bright, buzzy
- Square: Retro, hollow

**Detection Sensitivity** (0.5x - 3.0x):
- Adjust for room lighting
- Higher = easier to trigger
- Lower = reduce false positives
- Default: 1.5x

**Hand Detection Requirement**:
- Checkbox to enable/disable
- Unchecked (default): Wave-only mode
- Checked: Requires both hand AND wave

#### Master Output Routing

Theremin has its own routing toggle in the Master section:

- **Enabled**: Theremin → Master effects → Recording
- **Disabled**: Theremin bypasses master (monitoring only)
- Independent from track routing
- Appears in master routing controls

---

## Technical Architecture

### ADSR Implementation

**Files Created**:
- No new files (integrated into existing `audio-effects.js`)

**Files Modified**:
- `app/static/js/modules/audio-effects.js`:
  - `createADSREnvelope()`
  - `triggerADSRAttack()`
  - `triggerADSRRelease()`
  - `updateADSRParameters()`
- `app/static/js/modules/effect-chain.js`:
  - Added ADSR to available effects
  - Updated effect ordering logic
  - Added ADSR control ID mapping
- `app/static/js/modules/sampler.js`:
  - Modified `playSamplerNote()` for conditional ADSR
  - Added ADSR parameter support
- `app/static/js/visualizer-dual.js`:
  - Created `adsr1`, `adsr2`, `adsrMaster` variables
  - Added ~29 event listeners for ADSR controls
  - Integrated ADSR with effect chains
- `app/templates/index.html`:
  - Added ADSR controls to Track 1, 2, Master, Sampler
  - 4 sliders + trigger button per context
- `app/static/css/style.css`:
  - ADSR-specific styling (orange/amber theme)
  - Trigger button styling with glow effects

### Theremin Implementation

**Files Created**:
- `app/static/js/modules/theremin.js` (1,073 lines):
  - Complete theremin instrument
  - Motion detection algorithms
  - Wave detection system
  - Audio routing and effects
  - Visual feedback rendering

**Files Modified**:
- `app/static/js/visualizer-dual.js`:
  - Import theremin functions
  - Event listeners for theremin controls
  - Integration with master mixer
- `app/templates/index.html`:
  - Theremin section UI (video, canvas, controls)
  - Settings panel with all options
- `app/static/css/style.css`:
  - Theremin-specific styling
  - Video mirroring (`scaleX(-1)`)
  - Control panel layouts

**Theremin Module Exports**:
```javascript
export {
    initializeThereminCamera,
    enableTheremin,
    disableTheremin,
    changeThereminWaveform,
    changeThereminRange,
    changeThereminVibrato,
    changeThereminVolume,
    setThereminAudioSource,
    setThereminMappingMode,
    getThereminRoutingGain,
    changeThereminSensitivity,
    changeThereminHandRequirement,
    cleanupTheremin
};
```

---

## Documentation

### New Documentation Files

1. **ADSR_ENVELOPE_EFFECT.md** (Complete technical reference):
   - What ADSR envelopes are
   - Parameter explanations
   - Implementation details per context
   - Audio routing architecture
   - Signal flow diagrams
   - UI integration details
   - Code examples

2. **ADSR_CREATIVE_USE_CASES.md** (Practical guide):
   - 15 detailed use cases with exact settings
   - Genre-specific techniques (House, Ambient, Hip-Hop, Techno, Dub)
   - Advanced combinations and formulas
   - Quick reference chart
   - Musical context and tips

3. **THEREMIN_WAVE_DETECTION.md** (Technical deep-dive):
   - Motion detection algorithm
   - Wave detection logic
   - Adaptive threshold system
   - Visual feedback implementation
   - Debugging and troubleshooting
   - Performance optimization

---

## Browser Compatibility

**Fully Supported**:
- ✅ Chrome/Chromium (recommended)
- ✅ Edge
- ✅ Firefox

**Partial Support**:
- ⚠️ Safari (requires HTTPS for camera access)

**Requirements**:
- WebRTC (for camera access)
- Web Audio API
- ES6 modules
- Modern JavaScript features

**Camera/Theremin**:
- Requires HTTPS in production (getUserMedia restriction)
- Works on localhost for development
- Mobile support limited (performance)

---

## Performance

**ADSR**:
- Minimal CPU overhead (simple gain modulation)
- No latency added to audio path
- Efficient exponential ramping

**Theremin**:
- Motion detection: ~60fps on modern hardware
- Video processing: 640×480 resolution
- Canvas rendering: Hardware accelerated
- Audio processing: Real-time with minimal latency
- Total CPU usage: ~5-10% on typical laptop

**Optimization Techniques**:
- Downsampled video for motion detection
- Block-based processing (12×12 pixels)
- Debounced logging (reduce console spam)
- Request animation frame for smooth updates
- Adaptive update rates based on activity

---

## Known Issues & Limitations

1. **ADSR Release Timing**:
   - Sampler notes must complete within sample duration
   - Long release times may be truncated
   - Solution: Adjust release or extend sample playback

2. **Theremin Lighting**:
   - Performance varies with room lighting
   - Extreme brightness/darkness may affect detection
   - Solution: Use sensitivity adjustment (0.5x-3.0x)

3. **Wave Detection Strictness**:
   - May be too strict for some users
   - Requires consistent back-and-forth motion
   - Solution: Disable hand detection requirement

4. **Camera Permission**:
   - Browser prompts for camera access
   - User must explicitly allow
   - Production requires HTTPS

5. **Mobile Performance**:
   - Theremin may have reduced performance on mobile
   - Limited by device camera and processing power
   - Desktop recommended for best experience

---

## Migration Guide

### From v3.11.0 to v3.12.0

**No Breaking Changes**: All existing features continue to work as before.

**New Optional Features**:
1. ADSR controls appear in track panels - can be ignored if not needed
2. Theremin section appears in sidebar - disabled by default
3. Effect chain includes ADSR - can be toggled on/off

**To Use ADSR**:
1. Load audio to a track
2. Adjust ADSR sliders (Attack, Decay, Sustain, Release)
3. Click trigger button to activate envelope
4. Or drag ADSR into effect chain and toggle on

**To Use Theremin**:
1. Click "Enable Theremin" button
2. Allow camera access when prompted
3. Select audio source (Oscillator/Track1/Track2)
4. Adjust sensitivity if needed
5. Wave hand left-right to activate
6. Move hand to control parameters

---

## Future Enhancements

**Potential ADSR Improvements**:
- Visual envelope graph display
- Envelope presets/saving
- Velocity sensitivity (from MIDI controllers)
- Multi-stage envelopes (ADSHR, etc.)
- Envelope modulation of other parameters

**Potential Theremin Improvements**:
- Hand gesture recognition (open/close fist)
- Multi-hand support (two-handed theremin)
- Recording of theremin performances
- MIDI output from hand movements
- AR overlays for visual feedback

---

## Credits

**Development**: Browser Jockey Team  
**ADSR Implementation**: Session-based development (October 25, 2025)  
**Theremin Implementation**: Session-based development with wave detection refinement  
**Testing**: Community feedback and iteration  
**Libraries Used**:
- Web Audio API (audio processing)
- MediaDevices API (camera access)
- Canvas API (motion detection and visualization)

---

## Changelog

**v3.12.0** (October 25, 2025):
- ✨ Added ADSR envelope effects for Track 1, Track 2, Master, and Sampler
- ✨ Added camera theremin with wave detection
- ✨ Added adaptive motion detection with adjustable sensitivity
- ✨ Added three theremin control mapping modes
- ✨ Added visual feedback system for theremin detection
- ✨ Added hand detection requirement toggle
- 🎨 Created comprehensive ADSR and theremin documentation
- 🐛 Fixed wave detection thresholds for better usability
- 🐛 Fixed detection status bar positioning
- 🐛 Fixed waveform progress display during theremin use
- 📝 Updated README with new features
- 📝 Created detailed use case documentation

---

## Getting Started

### Quick Start with ADSR

1. **Load a track** to Track 1 or Track 2
2. **Locate ADSR controls** below the filter controls
3. **Adjust the sliders**:
   - Attack: How fast sound starts (try 10-50ms for plucks)
   - Decay: How fast it drops (try 100-300ms)
   - Sustain: Held level (try 50-70%)
   - Release: How fast it ends (try 200-500ms)
4. **Click the trigger button** to hear the effect
5. **Experiment** with different settings for your sound

### Quick Start with Theremin

1. **Click "Enable Theremin"** in the sidebar
2. **Allow camera access** when prompted
3. **Adjust sensitivity** slider if hand isn't detected (try 2.0x-2.5x for bright rooms)
4. **Uncheck "Require hand detection"** for easier activation (recommended)
5. **Wave your hand** left-right across the camera view
6. **Watch for green crosshair** - indicates active state
7. **Move hand vertically** to control pitch/filter
8. **Move hand horizontally** to control volume/resonance
9. **Experiment** with different mapping modes and audio sources

---

## Support

For issues, feature requests, or questions:
- **GitHub Issues**: [browser-jockey/issues](https://github.com/liorshahverdi/browser_jockey/issues)
- **Email**: liorshahverdi@gmail.com
- **Documentation**: See ADSR_*.md and THEREMIN_*.md files

---

## License

MIT License - See LICENSE file for details
