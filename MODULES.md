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

#### **audio-graph-lifecycle.js**
Deterministic ownership for long-lived audio resources:
- Owns the shared application `AudioContext`
- Groups nodes, streams, workers, timers, object URLs, and cleanup callbacks into named scopes
- Replaces dynamic scopes without leaking the previous generation
- Disposes the complete graph on page shutdown

**Exports:** `AudioGraphLifecycle`, `AudioResourceScope`

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

#### **microphone.js**
Microphone input handling and visualization:
- `enableMicrophone(context, merger)` - Request and setup microphone access
- `disableMicrophone(state)` - Cleanup microphone resources
- `drawMicWaveform(canvas, analyser, enabled)` - Visualize mic input
- `updateMicVolume(gain, volume)` - Adjust microphone gain

**Exports:** All functions above

**Dependencies:** None

---

#### **vocoder.js**
Vocoder effect implementation:
- `enableVocoder(context, micSource, carrierSource, merger, numBands)` - Create vocoder with band-pass filters
- `disableVocoder(state)` - Cleanup vocoder resources
- `updateVocoderMix(gain, mixValue)` - Adjust wet/dry mix
- `getVocoderCarrierSource(type, source1, source2, micSource)` - Get carrier signal source

**Exports:** All functions above

**Dependencies:** None

---

#### **autotune.js**
Pitch correction and auto-tune:
- `enableAutotune(context, micGain, merger, strength)` - Enable pitch correction
- `disableAutotune(state)` - Cleanup autotune resources
- `updateAutotuneStrength(dryGain, wetGain, strength)` - Adjust correction strength
- `detectPitch(frequencyData, sampleRate, fftSize)` - Detect pitch from audio
- `findNearestNoteInScale(freq, key, scaleType)` - Find nearest scale note
- `correctPitchToTarget(state, currentFreq, targetFreq)` - Apply pitch correction

**Exports:** All functions above

**Dependencies:** `constants.js` (musicScales)

---

### Main Files

#### **app.js**
Main application integration file for dual-track DJ mode. It remains the primary refactoring target; audio lifecycle ownership is being moved into dedicated modules.

Contains:
- DOM element references
- Application state
- Event listeners
- Track management
- Integration of all modules

#### **simple-player.js**
Deprecated single-track visualizer retained for compatibility. It shares constants and key-detection utilities with the main application.

---

## Runtime Audio Signal Flow

The full Web Audio graph is documented in [AUDIO_GRAPH.md](AUDIO_GRAPH.md), including the generated signal-flow diagram at `docs/assets/browser-jockey-true-signal-flow.png`.

Key runtime routing facts reflected in the diagram:

- `AudioGraphLifecycle` owns the one long-lived application `AudioContext`; `initAudioContext()` creates its summing bus, master analyser/recording taps, track effect nodes, and feature integrations.
- Short-lived decode-only contexts are closed in `finally` blocks and never become part of the live signal graph.
- `merger` is a plain `GainNode` used as a stereo summing bus, not a `ChannelMergerNode`.
- `connectEffectsChain()` routes track and tab-capture sources through gain → pan → optional timestretch → optional Tone.js pitch shift → EQ → filter → reverb → delay → final mix.
- Microphone, sampler, sequencer, Pattern Deck, and Lo-fi Station can feed the same `merger` bus.
- Master recording taps `gainMaster` after master effects, while the oscilloscope taps `merger` before master effects.
- Auto-tune and vocoder are optional inserts that reconnect source/final-mix nodes through their own dry/wet or band-bank output before returning to `merger`.

---

## Benefits of Modularization

1. **Better Organization** - Related functionality grouped together
2. **Reusability** - Modules can be used in both simple-player.js and app.js
3. **Easier Testing** - Individual modules can be tested independently
4. **Incremental Boundaries** - New ownership boundaries can be extracted from the integration files without rewriting the complete application
5. **Clearer Dependencies** - Import statements show what each module needs
6. **Better Collaboration** - Team members can work on different modules without conflicts

---

## Usage Example

```javascript
// Import what you need
import { formatTime, animateReversePlayback } from './modules/loop-controls.js';
import { detectBPM, detectKey } from './modules/audio-utils.js';
import { createReverb, createDelay } from './modules/audio-effects.js';
import { enableMicrophone, disableMicrophone } from './modules/microphone.js';
import { enableVocoder, updateVocoderMix } from './modules/vocoder.js';
import { enableAutotune, detectPitch } from './modules/autotune.js';

// Use the functions
const bpm = detectBPM(audioBuffer);
const timeString = formatTime(currentTime);
const reverb = createReverb(audioContext);
const micState = await enableMicrophone(audioContext, merger);
```

---

## Future Module Candidates

These features could be extracted into modules next (optional):

1. ✅ **microphone.js** - Microphone input handling (COMPLETED)
2. ✅ **vocoder.js** - Vocoder effect (COMPLETED)
3. ✅ **autotune.js** - Pitch correction (COMPLETED)
4. **deck-controller.js** - Shared Track 1/Track 2 source, playback, effects, and lifecycle ownership
5. **visualization.js** - Three.js visualization logic
6. **export.js** - Audio export functionality (stems, loops)
7. **ui-controls.js** - UI interaction helpers

---

## Migration Notes

- Modules use ES6 `export` syntax
- Main files must use `<script type="module">` in HTML
- Imports must include `.js` extension
- All paths are relative to the importing file
- Long-lived audio resources must use an `AudioGraphLifecycle` scope or expose an idempotent `destroy()` method
- Decode-only `AudioContext` instances must close in a `finally` block
