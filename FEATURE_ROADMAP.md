# Feature Roadmap — Browser Jockey

**Base version:** v3.27.8
**Date:** 2026-03-07
**Architecture:** Flask + Web Audio API + Tone.js + Three.js (~6,000 LOC, 19 JS modules)

All features are grounded in the existing architecture. Bug-fix prerequisites are noted where a feature depends on fixing a known bug first.

---

## Summary

| Category | Features | IDs |
|----------|----------|-----|
| 1. Core Playback | 8 | F-001 – F-008 |
| 2. Effects + Processing | 8 | F-009 – F-016 |
| 3. Mixer + Routing | 5 | F-017 – F-021 |
| 4. Sequencer | 7 | F-022 – F-028 |
| 5. Theremin + Motion | 5 | F-029 – F-033 |
| 6. Sampler | 6 | F-034 – F-039 |
| 7. Recording + Export | 4 | F-040 – F-043 |
| 8. Analysis + Intelligence | 4 | F-044 – F-047 |
| 9. Project + Data Management | 4 | F-048 – F-051 |
| 10. UX + Accessibility | 6 | F-052 – F-057 |
| **Total** | **57** | |

---

## Category 1: Core Playback — Fix + Expand Existing

---

### F-001 — Implement Real Phase Vocoder Time-Stretching

**Prerequisite:** BUG-002
**Complexity:** High
**Module:** `timestretch-processor.js`

Complete the phase vocoder in the existing AudioWorklet. The scaffolding (`simpleFFT()`, `createHannWindow()`, overlap-add buffers) is already present at lines 54–101 but the `process()` method is a passthrough.

**Implementation outline:**
1. Accumulate incoming frames into a circular `inputBuffer`
2. When `inputBuffer` contains `fftSize` samples: apply Hann window → forward FFT
3. Accumulate phase increments per bin, scaled by `stretchRatio`, for phase continuity
4. Inverse FFT → apply Hann window → overlap-add into `outputBuffer`
5. Advance read pointer by `analysisHop = fftSize / overlapFactor`; write pointer by `synthesisHop = analysisHop * stretchRatio`
6. Expose `stretchRatio` as an `AudioParam` for real-time adjustment

**UX:** Decouple stretch slider from pitch slider. Display tempo percentage independently of pitch.

---

### F-002 — Implement Actual Pitch Shifting

**Prerequisite:** BUG-001
**Complexity:** Medium
**Module:** `modules/autotune.js`, new `modules/pitch-shift.js`

Replace the non-functional delay-node chain with `Tone.PitchShift`, which is already available as a project dependency.

**Implementation:**
```js
const shifter = new Tone.PitchShift(semitones).toDestination();
trackSource.connect(shifter);
```

Expose as a standalone "Pitch Shift" effect on each deck (independent of the auto-tune feature). Range: ±12 semitones in cent increments. Display current value in semitones with a fine-tune readout.

---

### F-003 — Fix Autotune Scale Lookup + Key-Aware Pitch Correction

**Prerequisite:** BUG-001 (secondary), BUG-006
**Complexity:** Low
**Module:** `modules/autotune.js`, `modules/constants.js`

Fix `findNearestNoteInScale()` to use `musicScales[scaleType]` (scale type string key) and apply the root note transposition using MIDI offsets from `noteFrequencies`.

**Implementation:**
```js
function findNearestNoteInScale(frequency, scaleType, keyNote) {
    const scale = musicScales[scaleType]; // e.g., musicScales['major']
    const rootHz = noteFrequencies[keyNote]; // e.g., noteFrequencies['C4']
    // find nearest scale degree from frequency relative to rootHz
    // return corrected frequency
}
```

Once the scale lookup is correct, the autotune feature becomes testable end-to-end once BUG-001 (primary) is also fixed.

---

### F-004 — Hot Cues (CDJ-Style)

**Complexity:** Medium
**New module:** `modules/hot-cues.js`

4–8 labeled cue points per track. Colored markers on the waveform visualization. One-click jump to cue point during live playback.

**Features:**
- Set cue: press hot cue button while playing → stores current position
- Jump: press hot cue button → `audioSource.currentTime = cuePoint.time`
- Delete: hold Shift + cue button
- Labels: editable text label per cue (displayed on waveform marker)
- Colors: 8 distinct colors, one per cue slot
- Persistence: store in IndexedDB keyed by track filename/hash

**Integration:** Waveform renderer reads cue points and draws colored vertical markers.

---

### F-005 — Beat Grid + Quantize

**Dependency:** F-008 (improved BPM detection)
**Complexity:** Medium
**Module:** `modules/beat-grid.js`

Auto-generate a beat grid from detected BPM. Snap loop points and hot cue points to the nearest beat.

**Features:**
- Beat grid display: vertical tick marks on waveform at detected beat positions
- Beat offset correction: drag the grid to align with the actual first beat
- Snap toggle: "Snap to beat" button locks loop/cue adjustments to grid
- Tap tempo: 4-tap average to override detected BPM and rebuild grid

---

### F-006 — Slip Mode

**Complexity:** Medium
**Module:** `modules/playback-controller.js`

Maintain the underlying "master" playback position during loop playback. When the loop exits (or is disabled), resume from where the track would have been had the loop not been active.

**Implementation:**
- Maintain a `slipPosition` counter that advances at 1× regardless of loop state
- On loop exit: `audioSource.currentTime = slipPosition`
- Visual indicator: ghost playhead on waveform showing slip position

---

### F-007 — Auto BPM Sync

**Dependency:** F-008 (improved BPM detection)
**Complexity:** Medium
**Module:** `modules/bpm-sync.js`

One-click stretch Track 2 to match Track 1's detected BPM (or vice versa). Requires F-001 (real time-stretching) for pitch-transparent sync.

**Features:**
- "Sync" button per deck
- Visual BPM delta indicator: `+3.2 BPM` / `−1.5 BPM`
- Phrase sync: align to nearest 4- or 8-bar boundary
- Nudge buttons: ±1 BPM temporary adjustment (hold for continuous nudge)

---

### F-008 — Improved BPM Detection

**Prerequisite:** BUG-014
**Complexity:** Medium
**Module:** `modules/audio-utils.js` lines 91–177

Upgrade autocorrelation-based detection with:
1. **Half/double-tempo filter:** if result < 70 BPM → double; if > 180 BPM → halve (configurable range 70–180)
2. **Spectral flux onset detection:** use frequency-domain energy changes to find onset positions; cross-correlate onset times for BPM
3. **Minimum window:** pad analysis to 30s minimum (loop short tracks if needed)
4. **Confidence score:** expose detection confidence; fall back to tap tempo if confidence < 0.7

---

## Category 2: Effects + Processing

---

### F-009 — Sidechain Compression

**Complexity:** High
**New module:** `modules/sidechain.js`

Duck Track 2 based on Track 1's transient energy (kick drum trigger pattern). Classic pumping effect used in electronic music production.

**Controls:**
- Threshold (dBFS): level at which ducking begins
- Ratio: compression ratio (4:1 to ∞:1)
- Attack (ms): how fast gain reduces after threshold crossing
- Release (ms): how fast gain recovers
- Wet/dry mix

**Implementation:** Use `AnalyserNode` on Track 1 to detect transients above threshold → drive a `GainNode` on Track 2 via `ScriptProcessor` or `AudioWorklet`.

---

### F-010 — Reworked Vocoder

**Prerequisite:** BUG-003
**Complexity:** High
**Module:** `modules/vocoder.js`

Replace the non-functional WaveShaper envelope follower with a proper `AnalyserNode`-based per-band energy extraction approach.

**Architecture:**
- Use `AnalyserNode.getFloatFrequencyData()` per band via `ScriptProcessor` or `AudioWorklet`
- Extract per-band RMS energy from carrier FFT → drive carrier band `GainNode` amplitude
- Smooth with configurable attack/release envelopes per band
- Add band count presets: 4, 8, 16, 32 bands
- Formant shift control: shift modulator band mapping relative to carrier bands

---

### F-011 — Granular Synthesis Mode

**Complexity:** High
**New module:** `modules/granular.js`

Layer granular synthesis on top of loop playback for texturized, cloud-like sound manipulation.

**Controls:**
- Grain size (10–500ms)
- Scatter (random position offset ±Nms)
- Density (grains per second, 1–100)
- Pitch spread (random semitone offset per grain ±N semitones)
- Wet/dry mix

**Implementation:** Use `AudioBufferSourceNode` per grain, scheduled via `setInterval` or `AudioWorklet` clock. Source grains from the loaded `AudioBuffer` at positions near the current playhead.

---

### F-012 — Tape Saturation / Wow & Flutter

**Complexity:** Medium
**New module:** `modules/tape-effects.js`

Analog tape simulation with three components:

- **Saturation:** soft-clip `WaveShaperNode` with a cubic curve. Drive knob controls amount.
- **Wow:** slow LFO (0.1–2Hz) modulating `AudioBufferSourceNode.playbackRate` ±0.3%
- **Flutter:** random micro-variations to `playbackRate` at 5–15Hz for tape flutter texture

All three are independent toggles with wet/dry per-component.

---

### F-013 — Stutter / Gate Effect

**Complexity:** Medium
**New module:** `modules/stutter.js`

Rhythmic volume gate synchronized to the detected BPM. Useful for chopped vocal effects and rhythmic interest.

**Controls:**
- Rate: 1/4, 1/8, 1/16, 1/32 note (relative to BPM)
- Pattern: selectable duty cycle (e.g., 50% = equal on/off)
- Depth (min gain during gate-off): 0.0 to 1.0
- Wet/dry mix

**Implementation:** `GainNode` driven by an LFO (`OscillatorNode` square wave) synced to BPM clock.

---

### F-014 — Spectral Freeze

**Complexity:** High
**New module:** `modules/spectral-freeze.js`

Capture a single FFT frame and sustain it indefinitely. Blend with original signal.

**Controls:**
- Freeze button: captures current frame
- Blend (0–100%): mix between frozen spectrum and live audio
- Works with theremin: X-axis = blend, Y-axis = freeze pitch shift

**Implementation:** Use `OfflineAudioContext` to render one FFT frame → inverse FFT → loop the result as a short `AudioBufferSourceNode` with crossfade.

---

### F-015 — Convolution Reverb Presets

**Complexity:** Low-Medium
**Module:** `modules/effects.js`

Add selectable impulse responses to the existing reverb effect.

**Presets:** Room, Hall, Plate, Spring, Cathedral
**Format:** Pre-bundled `.wav` IR files loaded into `ConvolverNode`
**Controls:** Decay time scaler (stretch/compress IR), Pre-delay, Wet/dry mix

Bundle 5 short (< 3s) IR files as base64 or served via Flask static. Total size budget: < 2MB.

---

### F-016 — Multiband EQ Visualization

**Complexity:** Medium
**Module:** `modules/effects.js`, waveform renderer

Real-time frequency response curve overlay on the waveform or a dedicated EQ canvas.

**Features:**
- Display current EQ curve as a smooth SVG or canvas path
- Drag EQ control points directly on the curve to adjust gain
- Frequency labels at 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
- Integrates with F-017 (3-Band EQ)

---

## Category 3: Mixer + Routing

---

### F-017 — 3-Band EQ per Track

**Complexity:** Medium
**Module:** `modules/effects.js`

Replace the single low-pass filter on each track with a standard 3-band DJ EQ:

- **Low:** shelving filter below 200Hz (kill switch + ±12dB gain)
- **Mid:** peak filter at 1kHz (kill switch + ±12dB gain)
- **High:** shelving filter above 6kHz (kill switch + ±12dB gain)

Each band has a rotary knob (mapped to gain) and a kill switch button (jumps to −∞ dB). Visual: three colored knobs per track in the mixer strip.

---

### F-018 — Headphone Cue / Pre-Fader Listen

**Complexity:** High
**Module:** `modules/mixer.js`

Route any track to a secondary audio output for headphone pre-monitoring before bringing it into the mix.

**Implementation:**
- Use `Web Audio Output Device Selection API` (`setSinkId()` on `AudioContext`) for secondary output routing
- "CUE" button per track: splits signal post-fader to headphone bus
- Split cue mix: slider between "Track only" and "Main mix" in the cue bus
- Requires user to have two audio output devices (or a DJ audio interface)

---

### F-019 — Master Limiter + Metering

**Complexity:** Medium
**Module:** `modules/mixer.js`

Add a transparent hard limiter on the master output bus to prevent clipping.

**Features:**
- Hard limit at −0.1 dBFS (configurable)
- Peak hold: display peak level with 3-second hold then fall
- Red clip indicator: lights when limiter is engaged; click to reset
- LUFS meter: rolling integrated loudness display (−24 to 0 LUFS scale)

---

### F-020 — Stem Export

**Complexity:** Medium
**Module:** `modules/recorder.js`

Export Track 1 and Track 2 as separate rendered audio files in addition to the stereo mix.

**Implementation:**
- Use `OfflineAudioContext` to render each track independently
- Export as WAV at original sample rate
- UI: "Export Stems" button produces a zip containing `track1.wav`, `track2.wav`, `mix.wav`

---

### F-021 — Send/Return FX Buses

**Complexity:** Medium
**Module:** `modules/effects.js`

Implement shared reverb and delay instances as send effects to reduce CPU overhead.

**Architecture:**
- Two shared effect chains: Reverb bus, Delay bus
- Each track has a pre-fader send gain knob per bus (0–100%)
- Effect output returns to the master bus
- Reduces CPU vs. separate instances per track

---

## Category 4: Sequencer

---

### F-022 — Undo/Redo

**Complexity:** High
**New module:** `modules/history.js`

Full history stack for all sequencer actions: clip moves, trims, loop point changes, effect parameter changes.

**Implementation:** Command pattern — each action produces an `{execute, undo}` pair pushed onto a stack. Max stack depth: 50.

**Keybindings:** `Cmd+Z` / `Ctrl+Z` = undo; `Cmd+Shift+Z` / `Ctrl+Y` = redo.

---

### F-023 — Pattern/Loop View

**Complexity:** High
**New module:** `modules/pattern-view.js`

Add a step sequencer grid alongside the existing timeline arrangement view.

**Features:**
- 16-step or 32-step grid per track
- Switch between "Arrangement" and "Pattern" views via tab
- Patterns link to clips in the arrangement
- Per-step velocity (brightness = velocity)
- Pattern length: 1, 2, 4, 8 bars

---

### F-024 — MIDI Export

**Complexity:** Medium
**Module:** `modules/export.js`

Export the arrangement (sequencer clip positions and lengths) as a MIDI file for import into DAWs.

**Implementation:**
- Use a lightweight MIDI file writer (no external dependencies; MIDI format is well-specified)
- Map each clip to a MIDI note-on/note-off pair on separate channels
- Tempo track from detected BPM
- Export as `.mid` file download

---

### F-025 — Clip Color Coding

**Complexity:** Low
**Module:** `modules/sequencer.js`, sequencer renderer

Assign colors to sequencer clips by source type (Track 1 loop = blue, Track 2 loop = orange, sampler = green) or manually via right-click context menu.

**Implementation:**
- Store `color` property on each clip object
- Sequencer canvas renderer uses `clip.color` for fill
- Right-click context menu: "Change color" → color picker

---

### F-026 — Track Grouping / Bus

**Complexity:** High
**Module:** `modules/sequencer.js`, `modules/mixer.js`

Group sequencer tracks into a sub-bus for collective effects and gain control.

**Features:**
- Drag tracks into a group; group shown as collapsible header
- Group has its own gain fader and effect insert chain
- Collapse/expand group rows in the timeline view
- Group mute/solo button silences/solos all members

---

### F-027 — Auto-Slice on Transients

**Complexity:** High
**New module:** `modules/slicer.js`

Detect transient peaks in a loaded audio file and automatically create clip slices.

**Implementation:**
1. Run onset detection on the loaded buffer (spectral flux or HFC)
2. Display slice markers on waveform (user can drag to adjust)
3. "Slice to Sampler" button: loads each slice as a separate sampler pad
4. "Slice to Sequencer" button: creates a clip per slice in the arrangement

---

### F-028 — Sequencer LRU Cache

**Prerequisite:** BUG-008
**Complexity:** Low
**Module:** `modules/audio-buffer-manager.js`

Fix the unbounded `loopBuffers` and `timestretched` Maps with a max-5-entry LRU eviction policy.

**Implementation:**
```js
class LRUCache {
    constructor(maxSize = 5) { this.maxSize = maxSize; this.cache = new Map(); }
    get(key) { /* move to end */ }
    set(key, value) { if (this.cache.size >= this.maxSize) this.cache.delete(this.cache.keys().next().value); this.cache.set(key, value); }
}
```

---

## Category 5: Theremin + Motion

---

### F-029 — MediaPipe Hand Tracking

**Complexity:** High
**Module:** `modules/theremin.js`

Replace pixel-diff motion detection with MediaPipe Hands (21-point hand skeleton). Provides accurate hand position in varied lighting conditions.

**Integration:**
- Load MediaPipe Hands via CDN (lazy-load only when theremin is enabled)
- Map `landmarks[8]` (index fingertip) position to X/Y parameters
- Retain existing parameter mapping (X = pitch/volume, Y = filter)
- Graceful fallback to pixel-diff if MediaPipe fails to load

---

### F-030 — Two-Hand Theremin

**Dependency:** F-029
**Complexity:** Medium
**Module:** `modules/theremin.js`

Distinguish left and right hands for independent parameter control.

**Mapping:**
- Left hand: pitch (X-axis), volume (Y-axis)
- Right hand: filter cutoff (X-axis), reverb send (Y-axis)
- Hand separation threshold: minimum pixel distance to treat as two distinct hands
- Visualize both hand positions as colored crosshairs on the theremin canvas

---

### F-031 — Theremin Scale Lock

**Complexity:** Low
**Module:** `modules/theremin.js`

Quantize theremin pitch output to the nearest note in a selected musical scale.

**Controls:**
- Scale selector: chromatic, major, minor, pentatonic, blues
- Root key selector: C through B
- Glide: 0–200ms portamento to smooth transitions between quantized pitches

---

### F-032 — Gesture Presets

**Dependency:** F-029
**Complexity:** Medium
**New module:** `modules/gesture-presets.js`

Map hand gestures to parameter changes or toggles.

**Built-in gestures:**
- Closed fist → mute
- Open palm → reverb swell (increase reverb send to 100%)
- Pinch → gain reduction
- Victory sign → loop toggle

**Implementation:** Use MediaPipe hand landmark geometry (finger extension angles). Store gesture-to-action mappings as JSON. Allow user to customize and save presets.

---

### F-033 — Theremin MIDI Output

**Complexity:** Medium
**Module:** `modules/theremin.js`

Send theremin X/Y position as MIDI CC messages via Web MIDI API.

**Controls:**
- X-axis CC number (default: CC1 Mod Wheel)
- Y-axis CC number (default: CC11 Expression)
- MIDI output device selector (from `navigator.requestMIDIAccess()`)
- CC range: 0–127 mapped from 0–1 normalized position

---

## Category 6: Sampler

---

### F-034 — Fix Voice Stealing

**Prerequisite:** BUG-016
**Complexity:** Low
**Module:** `modules/sampler.js`

Track the active `AudioBufferSourceNode` per key. On re-trigger of the same key, stop the previous source with a short fade (5ms) before starting the new one.

```js
if (activeSources[key]) {
    activeSources[key].gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.005);
    activeSources[key].source.stop(ctx.currentTime + 0.005);
}
activeSources[key] = { source: newSource, gain: newGain };
```

---

### F-035 — Fix Chromatic Scale

**Prerequisite:** BUG-007
**Complexity:** Low (1 line)
**Module:** `modules/constants.js`

```js
// Before (buggy — 15 elements):
chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15]

// After (correct — 12 semitones):
chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
```

---

### F-036 — Pad Grid View

**Complexity:** Medium
**Module:** `modules/sampler.js`, sampler UI

Add an MPC-style 4×4 or 8×8 pad grid as an alternative to the keyboard view.

**Features:**
- Toggle between keyboard view and pad view
- Each pad shows: sample name (truncated), velocity indicator (brightness)
- Pad right-click context menu: assign sample, set choke group, toggle reverse
- Mouse click and keyboard both trigger pads
- Visual hit animation on trigger

---

### F-037 — Per-Pad Reverse

**Complexity:** Low
**Module:** `modules/sampler.js`

Allow individual sampler keys/pads to play their sample in reverse independently of each other and independent of the global reverse setting.

**UI:** Small "R" toggle button per pad in pad grid view.
**Implementation:** Store `reverse: boolean` per pad in the sampler state. When playing, use `AudioBufferSourceNode` with the buffer read backwards (pre-rendered reversed buffer in `AudioBufferManager` cache).

---

### F-038 — Choke Groups

**Complexity:** Medium
**Module:** `modules/sampler.js`

Keys/pads assigned to the same choke group stop each other when any one is triggered. Classic use case: hi-hat open/closed (triggering the closed hat stops the open hat decay).

**Implementation:**
- Choke group property (0 = no group, 1–8 = group number) per pad
- On trigger: iterate `activeSources` for same choke group → stop with 5ms fade
- UI: group number selector per pad in the pad settings panel

---

### F-039 — Multi-Sample Velocity Layers

**Complexity:** High
**Module:** `modules/sampler.js`

Support different audio samples for soft versus hard hits on the same key.

**Architecture:**
- Each key can have up to 4 velocity layers: pp (0–32), mp (33–64), mf (65–96), ff (97–127)
- MIDI velocity or mouse click force (Web API drag delta) determines which layer plays
- Crossfade between layers at boundary velocities for smooth transition

---

## Category 7: Recording + Export

---

### F-040 — Punch In/Out

**Complexity:** Medium
**Module:** `modules/recorder.js`

Set in/out punch points; recording automatically starts at the in-point and stops at the out-point during playback.

**Controls:**
- Set In: stores current position as punch-in time
- Set Out: stores current position as punch-out time
- Punch mode toggle: pre-roll (playback starts N bars before in-point)
- Visual markers on waveform at in/out positions

---

### F-041 — Multi-Format Export

**Complexity:** Medium-High
**Module:** `modules/recorder.js`

Export rendered audio in multiple formats and bit depths.

**Formats:**
- WAV: 16-bit, 24-bit, 32-bit float; sample rates 44.1kHz, 48kHz, 96kHz
- MP3: 128, 192, 320 kbps (requires `lamejs` WASM encoder)
- FLAC: lossless (requires `libflac.js` WASM encoder)
- OGG Vorbis: quality 0–10

**Metadata:** Artist, title, album, year, BPM (auto-filled from detection), key (from harmonic analysis).

---

### F-042 — Cue Sheet Export

**Complexity:** Low
**Module:** `modules/export.js`

Export a `.cue` file or `.csv` file with track names, timestamps, and hot cue points.

**Format (CUE):**
```
TRACK 01 AUDIO
  TITLE "Main Loop"
  INDEX 01 00:00:00
TRACK 02 AUDIO
  TITLE "Drop"
  INDEX 01 01:32:10
```

**Use case:** Mastering workflow integration; importing into CD authoring or DJ software.

---

### F-043 — Recording Level Metering

**Complexity:** Low
**Module:** `modules/recorder.js`

Display input levels before and during recording to prevent clipping.

**Features:**
- VU meter: RMS level with peak hold (3-second decay)
- Clip indicator: red segment above −0.5 dBFS; stays lit until clicked
- Pre-roll metering: show levels before recording starts
- Recommended level guideline: visual target at −18 dBFS (orange zone)

---

## Category 8: Analysis + Intelligence

---

### F-044 — Harmonic Mixing Wheel

**Complexity:** Medium
**New module:** `modules/harmonic-mixing.js`

Display each track's detected key on the Camelot Wheel (open key notation). Highlight compatible keys for harmonic mixing.

**Features:**
- Camelot wheel SVG rendered in a dedicated panel
- Current track keys shown as highlighted segments
- Compatible keys highlighted (±1 position, relative major/minor)
- Filter the track library by compatible keys
- "Key Shift" button: transpose a track by +1 or −1 Camelot position (semitone shift)

---

### F-045 — Spectral Waveform

**Complexity:** Medium
**Module:** waveform renderer

Replace the amplitude-based waveform with a frequency-content colorized version.

**Visualization:**
- Perform STFT on loaded buffer at waveform render time
- Map frequency energy to hue: bass (0–200Hz) = red/orange, mids = yellow/green, highs = blue/white
- Luminosity = amplitude at that time slice
- Toggle between amplitude and spectral views

---

### F-046 — Energy Graph

**Complexity:** Low
**Module:** waveform renderer

Display a secondary mini-graph below the main waveform showing track energy over time.

**Calculation:** RMS energy in 0.1s windows across the full track.
**Use case:** Quickly identify drops, breakdowns, and build-ups without listening.
**Visualization:** Filled area chart, semi-transparent, drawn below waveform canvas.

---

### F-047 — Loudness Normalization

**Complexity:** Medium
**New module:** `modules/loudness.js`

Analyze a loaded track's integrated LUFS and apply a gain offset to match a target level.

**Controls:**
- Target LUFS: −14 (streaming standard), −18 (broadcast), −23 (EBU R128)
- Per-track override: disable normalization for a specific track
- Show measured LUFS in the track header

**Implementation:** Use `OfflineAudioContext` to analyze `AudioBuffer`; accumulate RMS per 400ms block with gating (< −70 LUFS blocks excluded) per ITU-R BS.1770-4.

---

## Category 9: Project + Data Management

---

### F-048 — Fix IndexedDB Delete

**Complexity:** Low (1 function)
**Module:** project persistence module

Replace the full cursor scan in `deleteProject()` with a direct `IDBIndex.delete(projectId)` lookup. Cursor scans on large project stores are O(n) and block the main thread.

```js
// Before (slow cursor scan):
store.openCursor().onsuccess = (e) => { /* iterate all */ };

// After (fast index lookup):
store.index('projectId').openCursor(IDBKeyRange.only(id)).onsuccess = (e) => {
    if (e.target.result) e.target.result.delete();
};
```

---

### F-049 — Storage Quota Indicator

**Complexity:** Low
**Module:** project save UI

Show `navigator.storage.estimate()` results before saving a project. Warn when storage is near capacity.

**UI:**
- Storage bar: `[████████░░] 800 MB / 1.2 GB`
- Warning at 90% usage: yellow text "Storage nearly full"
- Error at 98% usage: prevent save, prompt to delete old projects

---

### F-050 — Effect Preset Library

**Complexity:** Medium
**New module:** `modules/preset-library.js`

Save and load named effect chain configurations as JSON.

**Features:**
- Save current effect settings as a named preset
- Load preset: apply all stored parameter values at once
- Export preset as `.json` file; import from file
- Built-in factory presets: "Club Ready", "Lo-Fi Vinyl", "Radio FM", "Deep Space"
- Share presets: copy preset JSON to clipboard

---

### F-051 — Track Library / Crate Management

**Complexity:** High
**New module:** `modules/track-library.js`

Index all previously loaded files with metadata. Organize into named crates (playlists/folders).

**Features:**
- Auto-index on load: BPM, detected key, duration, file name, date added
- Sortable columns: BPM, key, duration, name
- Create crates (named collections); drag tracks into crates
- Search: filter by BPM range, key, filename
- Persist in IndexedDB; survives page reload

---

## Category 10: UX + Accessibility

---

### F-052 — MIDI Controller Mapping

**Complexity:** High
**New module:** `modules/midi-controller.js`

Map hardware MIDI controller knobs, faders, and buttons to any app control via Web MIDI API.

**Features:**
- Learn mode: click any on-screen control → move hardware knob → binding created
- Persistent binding storage in `localStorage`
- Visual binding indicator: small MIDI logo badge on bound controls
- Preset mappings for common controllers (DDJ-200, Launch Control XL)
- Support for: CC (continuous), Note On/Off (buttons/pads), Pitch Bend

---

### F-053 — Keyboard Shortcut System

**Complexity:** Medium
**New module:** `modules/keyboard-shortcuts.js`

Full application keymap with user-configurable bindings.

**Default bindings:**

| Key | Action |
|-----|--------|
| `Space` | Play/Pause (focused deck) |
| `Z` | Set Cue |
| `X` | Toggle Loop |
| `C` | Set Loop In |
| `V` | Set Loop Out |
| `1`–`8` | Hot Cue 1–8 |
| `Q/W` | Pitch Bend −/+ |
| `Esc` | Emergency stop all |

**Features:** On-screen reference overlay (toggle with `?`). Configurable via settings panel. Export/import keymaps as JSON.

---

### F-054 — Touch / Mobile PWA

**Complexity:** High
**Module:** `app/static/css/style.css`, `app.js`, `app/templates/index.html`

Make the application usable on tablets and mobile phones.

**Touch events:**
- Replace `mousedown/mousemove/mouseup` on sliders with `touch` equivalents
- Add `touch-action: none` to draggable elements

**PWA manifest:**
- `manifest.json` with name, icons, `display: standalone`
- Service worker for offline caching of static assets
- `Add to Home Screen` prompt

**Layout:** Depends on F-056 (responsive breakpoints). Touch targets minimum 44×44px.

---

### F-055 — ARIA Accessibility

**Prerequisite:** BUG-019
**Complexity:** Medium
**File:** `app/templates/index.html`

Add ARIA attributes to all 286 interactive controls and 4 canvas elements.

**Priority order:**
1. Main playback controls: `role="button"`, `aria-label="Play Track 1"` etc.
2. Sliders: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`
3. Toggle buttons: `aria-pressed="true/false"`
4. Canvas elements: `role="img"`, `aria-label="Track 1 Waveform Visualization"`
5. Section landmarks: `role="region"`, `aria-label` for each major panel

**Testing:** Verify with NVDA (Windows), VoiceOver (macOS), and axe-core automated scan.

---

### F-056 — CSS Responsive Breakpoints

**Prerequisite:** BUG-020
**Complexity:** Medium
**File:** `app/static/css/style.css`

Add responsive breakpoints for all common viewport sizes.

```css
/* 1200px: reduce to 2-column DJ layout */
@media (max-width: 1200px) {
    .dj-grid { grid-template-columns: 1fr 1fr; }
    .visualizer-panel { grid-column: 1 / -1; }
}

/* 768px: single column, stacked */
@media (max-width: 768px) {
    .dj-grid { grid-template-columns: 1fr; }
    .transport-controls { flex-wrap: wrap; }
}

/* 480px: mobile — larger tap targets, hide secondary visualizations */
@media (max-width: 480px) {
    button { min-height: 44px; min-width: 44px; }
    .three-js-canvas { display: none; }
}
```

---

### F-057 — Onboarding Tour

**Complexity:** Medium
**New module:** `modules/onboarding.js`

First-launch interactive walkthrough highlighting key controls.

**Steps (suggested):**
1. Load a track (highlight drop zone)
2. Play/pause controls
3. Loop controls
4. EQ knobs
5. Effects panel
6. Sampler / theremin

**Features:**
- Skip button (suppressed for session)
- "Don't show again" checkbox (stored in `localStorage`)
- Resume button in Help menu to restart tour at any time
- Step progress indicator (3/8)
- Spotlight highlight: darken background, highlight target element

---

## Implementation Priority Matrix

| Priority | ID | Feature | Effort | Impact |
|----------|----|---------|--------|--------|
| P0 (bug fix) | F-001 | Real Phase Vocoder | High | Critical |
| P0 (bug fix) | F-002 | Actual Pitch Shifting | Med | Critical |
| P0 (bug fix) | F-003 | Autotune Scale Lookup | Low | Critical |
| P1 | F-004 | Hot Cues | Med | High |
| P1 | F-017 | 3-Band EQ | Med | High |
| P1 | F-019 | Master Limiter + Metering | Med | High |
| P1 | F-034 | Sampler Voice Stealing | Low | High |
| P1 | F-035 | Fix Chromatic Scale | Low | High |
| P1 | F-028 | Sequencer LRU Cache | Low | High |
| P2 | F-008 | Improved BPM Detection | Med | Med |
| P2 | F-009 | Sidechain Compression | High | Med |
| P2 | F-052 | MIDI Controller Mapping | High | High |
| P2 | F-053 | Keyboard Shortcuts | Med | Med |
| P3 | F-010 | Reworked Vocoder | High | Med |
| P3 | F-011 | Granular Synthesis | High | High |
| P3 | F-044 | Harmonic Mixing Wheel | Med | High |
| P3 | F-055 | ARIA Accessibility | Med | Med |

---

## Architecture Notes

- **Phase vocoder** (F-001) unblocks F-007 (BPM sync) and improves all timestretch-dependent features
- **Pitch shifting** (F-002) unblocks F-003 (autotune) and F-031 (theremin scale lock)
- **Improved BPM detection** (F-008) unblocks F-005 (beat grid), F-007 (auto sync), F-013 (stutter), F-044 (harmonic wheel)
- **MediaPipe hand tracking** (F-029) unblocks F-030, F-032, F-033
- **Responsive CSS** (F-056) is a prerequisite for meaningful F-054 (mobile PWA) work
- All `OfflineAudioContext` operations should run in a Web Worker to avoid main-thread jank
- WASM audio codecs for F-041 (MP3/FLAC export) should be lazy-loaded on first use only
