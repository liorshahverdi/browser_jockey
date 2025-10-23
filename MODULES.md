# JavaScript Module Structure

The JavaScript codebase has been refactored into smaller, focused modules for better organization and maintainability.

## Module Overview

### `/app/static/js/modules/`

#### **constants.js**
Musical constants and mappings:
- `scales` - Major, minor, chromatic scale intervals
- `keyboardMap` - Keyboard key to note index mapping  
- `noteFrequencies` - Note frequencies and color mappings
- `musicScales` - Scale definitions for autotune/vocoder

**Exports:** `scales`, `keyboardMap`, `noteFrequencies`, `musicScales`

---

#### **loop-controls.js**
Loop playback functionality:
- `formatTime(seconds)` - Format time as M:SS
- `updateLoopRegion(...)` - Update loop marker positions with zoom
- `clearLoopPoints(...)` - Clear loop markers
- `animateReversePlayback(...)` - Reverse playback animation using requestAnimationFrame
- `stopReversePlayback(...)` - Stop reverse playback
- `handleLoopPlayback(...)` - Enforce loop boundaries during playback

**Exports:** All functions above

---

#### **audio-utils.js**
Audio analysis and waveform rendering:
- `drawWaveform(...)` - Draw waveform with zoom support
- `redrawWaveformWithZoom(...)` - Redraw waveform helper
- `drawWaveformSimple(...)` - Simple waveform (no zoom)
- `detectBPM(audioBuffer)` - BPM detection using autocorrelation
- `detectKey(audioBuffer)` - Musical key detection from buffer
- `detectMusicalKey(...)` - Real-time key detection from frequency data
- `loadAudioFile(...)` - Load and analyze audio file

**Exports:** All functions above

**Dependencies:** `constants.js` (noteFrequencies)

---

#### **audio-effects.js**
Audio effects creation and routing:
- `createReverb(context)` - Create convolution reverb
- `createDelay(context)` - Create delay with feedback
- `initAudioEffects(context, trackNumber)` - Initialize effect chain for a track
- `connectEffectsChain(...)` - Connect source through effects to destination

**Exports:** All functions above

---

#### **recording.js**
Master output recording:
- `startRecording(...)` - Start recording mixed output
- `stopRecording(...)` - Stop recording
- `drawRecordingWaveform(...)` - Real-time recording visualization
- `audioBufferToWav(audioBuffer)` - Convert AudioBuffer to WAV format
- `downloadRecording(...)` - Download recording in chosen format

**Exports:** All functions above

**Dependencies:** 
- `audio-utils.js` (drawWaveform)
- `loop-controls.js` (formatTime)

---

#### **sampler.js**  
Keyboard sampler functionality:
- `playSamplerNote(...)` - Play a note from loaded sample
- `handleKeyDown(...)` - Handle keyboard press for sampler
- `handleKeyUp(...)` - Handle keyboard release
- `enableSampler(...)` - Enable sampler mode
- `disableSampler(...)` - Disable sampler mode

**Exports:** All functions above

**Dependencies:** `constants.js` (scales, keyboardMap)

---

### Main Files

#### **visualizer-dual.js** (4578 lines → to be refactored)
Main application file for dual-track DJ mode. Will be updated to import and use the modules above.

Contains:
- DOM element references
- Application state
- Event listeners
- Track management
- Microphone features
- Vocoder
- Autotune
- Visualization (Three.js)
- Main initialization

#### **visualizer.js** (905 lines)
Single-track visualizer (simpler version). Could also benefit from using shared modules.

---

## Benefits of Modularization

1. **Better Organization** - Related functionality grouped together
2. **Reusability** - Modules can be used in both visualizer.js and visualizer-dual.js
3. **Easier Testing** - Individual modules can be tested independently
4. **Smaller Files** - Each module focuses on one responsibility
5. **Clearer Dependencies** - Import statements show what each module needs
6. **Better Collaboration** - Team members can work on different modules without conflicts

---

## Usage Example

```javascript
// Import what you need
import { formatTime, animateReversePlayback } from './modules/loop-controls.js';
import { detectBPM, detectKey } from './modules/audio-utils.js';
import { createReverb, createDelay } from './modules/audio-effects.js';

// Use the functions
const bpm = detectBPM(audioBuffer);
const timeString = formatTime(currentTime);
const reverb = createReverb(audioContext);
```

---

## Future Module Candidates

These features should be extracted into modules next:

1. **microphone.js** - Microphone input handling
2. **vocoder.js** - Vocoder effect
3. **autotune.js** - Pitch correction
4. **visualization.js** - Three.js visualization logic
5. **export.js** - Audio export functionality (stems, loops)
6. **ui-controls.js** - UI interaction helpers

---

## Migration Notes

- Modules use ES6 `export` syntax
- Main files must use `<script type="module">` in HTML
- Imports must include `.js` extension
- All paths are relative to the importing file
