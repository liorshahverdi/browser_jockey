# Feature Roadmap — Browser Jockey

**Base version:** v3.27.9
**Date:** 2026-03-07
**Architecture:** Flask + Web Audio API + Tone.js + Three.js (~6,000 LOC, 19 JS modules)

All features are grounded in the existing architecture. Bug-fix prerequisites are noted where a feature depends on fixing a known bug first.

Features that were already implemented in the codebase have been removed from this roadmap (see struck-through entries in the changelog at the bottom).

---

## Summary

| Category | Features | IDs |
|----------|----------|-----|
| 1. Core Playback | 3 | F-004 – F-006 |
| 2. Effects + Processing | 8 | F-009 – F-016 |
| 3. Mixer + Routing | 4 | F-018 – F-021 |
| 4. Sequencer | 6 | F-022 – F-027 |
| 5. Theremin + Motion | 5 | F-029 – F-033 |
| 6. Sampler | 4 | F-036 – F-039 |
| 7. Recording + Export | 4 | F-040 – F-043 |
| 8. Analysis + Intelligence | 4 | F-044 – F-047 |
| 9. Project + Data Management | 3 | F-049 – F-051 |
| 9. Project + Data Management | 3 | F-049 – F-051 |
| 10. UX + Accessibility | 5 | F-052 – F-055, F-057 |
| **Total** | **46** | |

---

## Category 1: Core Playback

---

### ~~F-004 — Hot Cues (CDJ-Style)~~ ✅ Implemented v3.28.0

**Complexity:** Medium
**New module:** `modules/hot-cues.js`

8 labeled, color-coded cue points per track. One-click jump to any cue during live playback, matching the CDJ/Serato paradigm DJs expect.

**Features:**
- **Set cue:** press hot cue button while playing → stores `audioElement.currentTime` as cue position
- **Jump:** press hot cue button during playback → `audioElement.currentTime = cuePoint.time`; if paused → pre-cues (seeks without playing)
- **Delete:** Shift + cue button clears the slot
- **Labels:** editable text label per cue slot (max 12 chars), displayed on waveform marker
- **Colors:** 8 fixed colors, one per slot — `#ff4444, #ff9900, #ffdd00, #44dd44, #44aaff, #8844ff, #ff44cc, #ffffff`
- **Waveform markers:** colored vertical lines rendered on the waveform canvas at the cue time position; re-rendered on every `drawWaveform()` call
- **Keyboard triggers:** `1`–`8` jump to cue N; `Shift+1`–`Shift+8` set cue N at current position
- **Persistence:** stored in `IndexedDB` keyed by `SHA-1(filename + filesize)` so cues survive page reload and reloading the same file. Schema:
  ```js
  { fileHash: string, trackId: string, cues: [{ id: 0-7, time: number, label: string, color: string }] }
  ```

**Integration:** `hot-cues.js` exports `setCue(id, time)`, `jumpToCue(id, audioElement)`, `deleteCue(id)`, `loadCues(fileHash)`, `saveCues(fileHash, cues)`. Waveform renderer receives cue array and draws markers before returning.

---

### F-005 — Beat Grid + Quantize

**Dependency:** BPM detection (already improved — v3.27.9)
**Complexity:** Medium
**New module:** `modules/beat-grid.js`

Auto-generate a beat grid from detected BPM. Snap loop points and hot cue points to the nearest beat. Eliminates the tedious manual loop-point alignment that plagues DJ apps with only frame-accurate position seeking.

**Features:**
- **Beat grid display:** tick marks on the waveform canvas at beat positions; every 4th tick is a bar line (taller, brighter). Rendered as a transparent canvas layer composited over the waveform
- **Rendering formula:** `beatPositionSeconds(n) = firstBeatOffset + n * (60 / bpm)`. Bar n starts at pixel `x = (beatPositionSeconds(n) - viewStart) / viewDuration * canvasWidth`
- **First-beat calibration:** drag the grid left/right to align tick marks with the actual first kick/downbeat; stores `firstBeatOffset` seconds
- **Snap toggle:** "⊡ Snap" button; when active, loop A/B points and hot cues are quantized to `Math.round(rawTime / beatInterval) * beatInterval`
- **Tap tempo:** 4-tap average (`Date.now()` deltas) to override detected BPM and rebuild grid without re-analyzing the track; accepts taps at 3–300 BPM
- **Visual:** semi-transparent white tick marks at 1px width on beats, 2px on bars; hidden if BPM is 0 or unknown

---

### F-006 — Slip Mode

**Complexity:** Medium
**Module:** `modules/playback-controller.js`

Maintain a hidden "master" playback position that advances at 1× speed regardless of loops, scratches, or effects. When slip mode exits, the track resumes from where it would have been — a signature feature of professional CDJs.

**Implementation detail:**
- Add `slipEnabled: boolean` and `slipPosition: number` to `PlaybackController` state
- On each RAF tick when slip is active: `slipPosition += deltaTime * 1.0` (always 1×, even during loop or reverse)
- On loop boundary crossing (inside `handleLoopPlayback`): if slip enabled, do NOT update `slipPosition` — it keeps advancing past the loop end
- On slip exit: `audioElement.currentTime = slipPosition`; disable slip mode
- **Ghost playhead:** second translucent progress indicator on the waveform showing `slipPosition / duration` — implemented as a second `waveformProgress` div with 50% opacity and a different color (e.g., amber vs the primary cyan)
- **Interaction:** Slip mode is active only while the slip button is held (hold behavior, not toggle). Releasing the button snaps back

---

## Category 2: Effects + Processing

---

### F-009 — Sidechain Compression

**Complexity:** High
**New module:** `modules/sidechain.js`

Duck Track 2 based on Track 1's transient energy (kick drum trigger). Classic pumping effect used in electronic music. Creates a sense of rhythmic breathing in the mix.

**Controls:**
- Threshold (dBFS): level at which ducking begins, default −12 dBFS
- Ratio: compression ratio (2:1 to ∞:1); at ∞:1, gain drops to 0 immediately above threshold
- Attack (ms): how fast gain drops after threshold crossing; typical 1–5ms for transparency
- Release (ms): how fast gain recovers; 50–300ms for classic pumping feel
- Wet/dry mix: blend between ducked and unducked Track 2

**Implementation:**
- `AnalyserNode` on Track 1 feeds a dedicated `AudioWorklet` (`sidechain-processor.js`)
- Worklet reads `getFloatTimeDomainData` per block, computes RMS, compares to threshold
- On threshold crossing: ramp Track 2 `GainNode.gain` down via `setTargetAtTime(targetGain, now, attack/3)` (time constant = attack/3 gives ≈95% arrival in `attack` seconds)
- On release: `setTargetAtTime(1.0, now, release/3)`
- Use `AudioWorklet` not the deprecated `ScriptProcessorNode`; the sidechain computation is deterministic and benefits from the worklet's audio-thread scheduling

---

### F-010 — High-Quality Vocoder (AnalyserNode FFT Approach)

**Complexity:** High
**Module:** `modules/vocoder.js`

The existing vocoder (fixed in v3.27.9 via BUG-003) uses a WaveShaper full-wave rectifier + 15 Hz lowpass smoothing filter per band. This produces intelligible speech formants but lacks the per-band amplitude precision of an FFT-based approach. This feature upgrades to a higher-quality implementation.

**Current state (v3.27.9):** WaveShaper + BiquadFilter lowpass per band, functional. 16 bands default.

**Upgrade target — `AnalyserNode` per-band energy extraction:**
- Replace per-band `WaveShaper + lowpass` chain with a single `AnalyserNode` on the modulator and a single `AnalyserNode` on the carrier
- On each audio frame (via `AudioWorklet`): call `getFloatFrequencyData()` on modulator analyser; map each vocoder band's frequency range to the FFT bins covering that range; compute band RMS from those bins
- Apply computed band gain directly to carrier band `GainNode.gain.setValueAtTime()` — no smoothing filter needed (FFT averaging provides natural smoothing)
- Configurable band count presets: 4, 8, 16, 32
- **Formant shift:** offset the modulator band → carrier band mapping by ±N bands to shift the "voice character" higher or lower without pitch-shifting

**Controls to add:**
- Band count selector: 4 / 8 / 16 / 32
- Formant shift: ±8 bands
- Modulator gate: minimum modulator energy threshold; below this, all carrier bands mute (prevents noise vocoding)

---

### F-011 — Granular Synthesis Mode

**Complexity:** High
**New module:** `modules/granular.js`

Scatter and layer short grains from a loaded buffer for texturized, cloud-like sound. Most useful when applied to a frozen loop or sustained pad sample in the sampler.

**Controls:**
- Grain size: 10–500ms (length of each `AudioBufferSourceNode` playback)
- Scatter: random position offset ±Nms from the current playhead (uniformly distributed)
- Density: grains per second, 1–100
- Pitch spread: random playback-rate offset ±N semitones per grain, drawn fresh each grain
- Wet/dry mix: blend granular cloud with the dry signal

**Implementation detail:**
- Maintain a scheduler loop using `audioContext.currentTime`-based lookahead (standard Web Audio scheduler pattern: schedule 100ms ahead, run every 25ms via `setTimeout`)
- Each grain: `AudioBufferSourceNode` with a Hann-windowed `GainNode` (attack = grain size / 3, release = grain size / 3) to prevent clicks at grain boundaries
- Source position: `playheadTime + (Math.random() - 0.5) * 2 * scatter`; clamp to `[0, buffer.duration]`
- Playback rate: `2 ** (randomSemitones / 12)` where `randomSemitones = (Math.random() - 0.5) * 2 * pitchSpread`
- Max concurrent grains capped at 64 to prevent node explosion; if at cap, skip scheduling until existing grains end

---

### F-012 — Tape Saturation / Wow & Flutter

**Complexity:** Medium
**New module:** `modules/tape-effects.js`

Analog tape simulation as a per-track insert effect. Three independent components, each with its own wet/dry.

- **Saturation:** soft-clip `WaveShaperNode` using a cubic curve: `f(x) = (3x/2)(1 − x²/3)` for `|x| < 1`, clamped at ±1. Drive knob (0–100%) controls pre-gain before the shaper (more drive = more harmonic distortion)
- **Wow:** slow LFO (0.1–2Hz) via `OscillatorNode` (sine) modulating `AudioBufferSourceNode.playbackRate` ±0.3% via `setValueAtTime` polling; simulates slow tape speed variation
- **Flutter:** band-limited noise at 5–15Hz (sum of 3 sine oscillators at 7, 10, 13Hz with random phases) modulating `playbackRate` ±0.05%; simulates high-frequency mechanical flutter

Each component has an on/off toggle and a depth control (0–100% modulation amount).

---

### F-013 — Stutter / Gate Effect

**Complexity:** Medium
**New module:** `modules/stutter.js`

Rhythmic volume gating synchronized to the track's detected BPM. Produces the classic chopped / gated vocal and instrument effect.

**Controls:**
- Rate: 1/4, 1/8, 1/16, 1/32 note (displayed as musical subdivision)
- Pattern: duty cycle — proportion of each cycle that is "open" (0.1 to 0.9); 0.5 = equal on/off
- Depth: minimum gain during gate-off phase (0.0 = full silence, 1.0 = no effect)
- Wet/dry mix
- Sync toggle: lock gate phase to the beat grid (F-005) or free-run

**Implementation:**
- Derive gate period from BPM: `gatePeriod = (60 / bpm) / subdivision` (e.g., at 128 BPM, 1/16 = 0.117s)
- BPM clock reference: `currentBeat = (audioElement.currentTime - firstBeatOffset) / (60 / bpm)`; gate phase = `(currentBeat * subdivision) % 1.0`
- Drive a `GainNode` on each track: `gain = phase < dutyCycle ? 1.0 : depth`
- Update via `requestAnimationFrame`; set gain with `setValueAtTime` at the exact phase crossover calculated from `audioContext.currentTime`
- Pattern presets: "4-on-floor" (1/4, duty=0.8), "Trap chop" (1/16, duty=0.35), "Hard gate" (1/8, duty=0.5, depth=0)

---

### F-014 — Spectral Freeze

**Complexity:** High
**New module:** `modules/spectral-freeze.js`

Capture a single FFT snapshot and sustain it indefinitely as a pitched drone, blended with the live signal.

**Controls:**
- Freeze button: captures current spectral frame
- Blend (0–100%): crossfade between live signal and frozen drone
- Pitch shift: transpose the frozen frame ±12 semitones in real time (via `Tone.PitchShift` on the frozen source)
- Theremin integration: when theremin is active, X-axis = blend, Y-axis = frozen-pitch shift

**Implementation:**
1. On freeze: use `OfflineAudioContext` to render one window of the current playback position (FFT size = 4096 samples, Hann windowed)
2. Compute inverse FFT → short `AudioBuffer` (one analysis frame)
3. Loop the buffer at zero crossings using `AudioBufferSourceNode.loop = true` + `loopStart` / `loopEnd` set to the zero-crossing points closest to the buffer edges
4. Crossfade with live signal via a complementary `GainNode` pair: `frozenGain.gain.value = blend/100; liveGain.gain.value = 1 - blend/100`
5. If no zero crossing found, apply a 2ms Hann fade-in/fade-out at loop points to suppress click

---

### F-015 — Convolution Reverb Presets

**Complexity:** Low-Medium
**Module:** `modules/audio-effects.js`

The existing reverb (v3.27.9) uses a `ConvolverNode` fed a synthetically generated impulse response (exponential noise decay). This feature replaces that with real room IR recordings and adds preset selection.

**Presets:** Room, Hall, Plate, Spring, Cathedral
**Format:** Pre-bundled `.wav` IR files (≤ 3s each) served via Flask `/static/audio/ir/`. Total IR file budget: < 2MB uncompressed. Load via `fetch()` → `decodeAudioData()` on first use; cache in memory thereafter.

**Controls:**
- Preset selector dropdown (replaces the single reverb wet/dry slider)
- Decay scaler: stretch or compress the IR buffer sample-rate during playback (0.5× = shorter/brighter, 2.0× = longer/darker)
- Pre-delay: 0–100ms delay before IR convolution begins (`DelayNode` inserted before `ConvolverNode`)
- Wet/dry mix (existing slider, unchanged)

**Implementation:** Replace `createReverb()` in `audio-effects.js`. The `ConvolverNode` instance is already in the effect chain; only the buffer being loaded into it changes on preset switch.

---

### F-016 — Multiband EQ Visualization

**Complexity:** Medium
**Module:** `modules/audio-effects.js`, waveform renderer

Real-time frequency response curve overlay for the 3-band EQ already on each track. The EQ nodes (lowshelf 250Hz, peaking 1kHz Q=1.0, highshelf 4kHz) are already wired — this feature adds the visual representation.

**Features:**
- Dedicated EQ canvas (120px tall) drawn below each track's waveform
- Frequency response curve computed analytically from the three `BiquadFilterNode` gain values using the standard biquad transfer function `H(z)` at 512 log-spaced frequency points from 20Hz to 20kHz
- X-axis: log frequency (20Hz–20kHz); Y-axis: gain in dB (−15 to +15); 0 dB baseline drawn in mid-grey
- Frequency labels: 60Hz, 250Hz, 1kHz, 4kHz, 16kHz
- Drag on the curve to adjust the nearest EQ band gain: click at a frequency bin, drag vertically → maps to `eqLow/Mid/High.gain.value` change; slider and display update simultaneously
- Color: track 1 = cyan (#00ffff), track 2 = magenta (#ff00ff)
- Redraws on every slider `input` event (no RAF needed — only redraws on user interaction)

---

## Category 3: Mixer + Routing

---

### F-018 — Headphone Cue / Pre-Fader Listen

**Complexity:** High
**Module:** `modules/mixer.js`

Route any track to a secondary audio output for headphone pre-monitoring before the track is live in the mix. The core professional DJ workflow feature.

**Implementation:**
- Use `AudioContext.setSinkId()` (Chrome 110+) to create a secondary `AudioContext` routed to the headphone output device
- "CUE" button per track: splits post-fader signal via an additional `GainNode` → secondary `AudioContext` destination
- Split cue mix slider: blend between "isolated track" and "main mix monitoring" in the cue bus (useful for beatmatching)
- Cue bus gain: separate volume control for headphone bus independent of master fader
- Device selector: `navigator.mediaDevices.enumerateDevices()` filtered to `audiooutput`; dropdown in the settings panel

**Browser support note:** `setSinkId()` is Chrome/Edge only as of 2026. Firefox lacks support. Detect via `'setSinkId' in AudioContext.prototype`; show a browser-compatibility warning if unsupported and offer the workaround of using the OS audio router instead.

**Requires:** user to have two audio output devices (built-in speakers + headphones, or a DJ audio interface with 4+ channels).

---

### F-019 — Master Limiter + Metering

**Complexity:** Medium
**Module:** `modules/mixer.js`

A transparent hard limiter on the master output bus prevents digital clipping when both tracks peak simultaneously. Combined with peak and loudness metering visible during performance.

**Limiter implementation:**
- `DynamicsCompressorNode` after the master `ChannelMergerNode`: `{ threshold: -0.1, knee: 0, ratio: 20, attack: 0.001, release: 0.01 }` — at ratio 20:1 with zero knee this functions as a hard limiter
- Configurable ceiling: expose `threshold` as a UI control (−3 to 0 dBFS)

**Metering features:**
- Peak level: sample `masterAnalyser.getFloatTimeDomainData()` per RAF frame; track `peakLevel = Math.max(...Math.abs(samples))`; display as a vertical bar
- Peak hold: hold displayed peak for 3 seconds after it's set, then fall at 12 dB/s
- Clip indicator: red segment above −0.1 dBFS; latches on (stays lit until clicked); driven by `DynamicsCompressorNode.reduction` > 0
- LUFS meter: rolling 400ms integrated loudness using ITU-R BS.1770-4 K-weighting. Approximate implementation: `AnalyserNode` at 1024 FFT → apply K-weighting frequency response → compute RMS → convert to dBFS → display on −24 to 0 LUFS scale

**UI:** Vertical stereo meter strip in the mixer center column, drawn on a `<canvas>` element updated on RAF.

---

### F-020 — Stem Export (Combined Zip)

**Complexity:** Medium
**Module:** `modules/recording.js`

Individual track export already works (the "Export Track" / "Export Loop" buttons use `OfflineAudioContext` rendering). This feature adds a single-click "Export All Stems" workflow that bundles all outputs together.

**What's new (beyond existing per-track export):**
- Single "Export Stems" button renders Track 1, Track 2, and the stereo mix in sequence using `OfflineAudioContext`
- Bundles all three into a `.zip` file using the `fflate` library (lightweight WASM zip, ~25KB gzip): `track1.wav`, `track2.wav`, `mix.wav`
- Filenames include BPM and key metadata: `track1_128bpm_Am.wav`
- Progress bar during multi-track render (OfflineAudioContext renders faster than real-time but can take several seconds for long tracks)

---

### F-021 — Send/Return FX Buses

**Complexity:** Medium
**Module:** `modules/audio-effects.js`

Currently each track has its own reverb and delay instances. Moving to shared send buses reduces CPU overhead and produces a more coherent mix (both tracks share the same reverb space).

**Architecture:**
```
Track 1 post-fader ──[sendGain1R]──→ ┐
Track 2 post-fader ──[sendGain2R]──→ ├──→ Reverb Bus → master
Track 1 post-fader ──[sendGain1D]──→ ┐
Track 2 post-fader ──[sendGain2D]──→ ├──→ Delay Bus  → master
```
- Two shared effect instances: `sharedReverb` (`ConvolverNode`) and `sharedDelay` (`DelayNode` + feedback)
- Each track has two pre-fader send gain knobs: Reverb Send (0–100%) and Delay Send (0–100%)
- Per-track insert reverb and delay remain as options but default off when send buses are active
- Effect return level: one master gain per bus back to the `ChannelMergerNode`

---

## Category 4: Sequencer

---

### F-022 — Undo/Redo

**Complexity:** High
**New module:** `modules/history.js`

Full undo/redo stack for all sequencer mutations. Every destructive action wraps an `execute`/`undo` pair.

**Command interface:**
```ts
interface Command {
    description: string;        // shown in undo history list
    execute(): void;
    undo(): void;
}
```

**Covered actions:** clip move, clip trim, clip delete, clip add, loop point change, track mute/solo, effect parameter change (coalesced: rapid slider changes within 500ms collapse into one command to avoid flooding the stack).

**Implementation:**
- `HistoryManager` class: `stack: Command[]`, `cursor: number`; `push(cmd)` truncates any forward history then calls `cmd.execute()`; `undo()` calls `stack[--cursor].undo()`; `redo()` calls `stack[++cursor].execute()`
- Max stack depth: 50 commands; oldest entry is dropped when exceeded
- Keybindings: `Cmd/Ctrl+Z` = undo; `Cmd/Ctrl+Shift+Z` or `Ctrl+Y` = redo
- History panel: collapsible list of command descriptions with current position highlighted

---

### F-023 — Pattern / Loop View

**Complexity:** High
**New module:** `modules/pattern-view.js`

A step sequencer grid alongside the existing timeline arrangement view. Toggle between "Arrangement" and "Pattern" views via the existing tab system.

**Features:**
- 16-step or 32-step grid per track (user-selectable per track)
- Steps triggered on the BPM grid; step duration = 1/16 note by default
- Per-step velocity (1–127); displayed as fill-height within each step cell
- Pattern length: 1, 2, 4, 8 bars (selects how many steps make one loop)
- Patterns are linked to clips in the arrangement: placing a pattern-mode clip in the arrangement plays the corresponding pattern on repeat
- Switch between Arrangement and Pattern view without interrupting playback

**Rendering:** `<canvas>` grid; each step cell = `(canvasWidth - padding) / stepCount` pixels wide. Active steps filled with track color; inactive steps dark grey. Click to toggle; drag vertically to set velocity.

---

### F-024 — MIDI Export

**Complexity:** Medium
**Module:** `modules/export.js`

Export the sequencer arrangement as a standard MIDI file for import into DAWs (Ableton, Logic, FL Studio).

**Implementation:**
- Pure-JS MIDI file writer (no external dependencies; MIDI 1.0 format is fully specified in ~10 pages)
- MIDI file structure: header chunk + one tempo track + one track per sequencer row
- Each clip → `Note On` at clip start time, `Note Off` at clip end time; clip pitch determined by track assignment (Track 1 = C3, Track 2 = D3, sampler clips = pad pitch)
- Tempo track: `Set Tempo` event from detected BPM at tick 0
- Ticks per quarter note: 480 (standard resolution)
- Export as `.mid` file download via `URL.createObjectURL(new Blob([midiBytes], { type: 'audio/midi' }))`

---

### F-025 — Clip Color Coding

**Complexity:** Low
**Module:** `modules/sequencer.js`, sequencer canvas renderer

Assign colors to sequencer clips by source type or manually. Makes dense arrangements immediately readable at a glance.

**Default color map:**
- Track 1 loop clips: `#00ffff` (cyan)
- Track 2 loop clips: `#ff6600` (orange)
- Sampler clips: `#44ff44` (green)
- Mic recording clips: `#ff4444` (red)
- Sequencer-generated clips: `#9966ff` (purple)

**Manual override:**
- Right-click clip → context menu → "Change color" → opens a `<input type="color">` picker
- `clip.color` is stored on the clip object in sequencer state; overrides the default
- Color stored per-clip in the sequencer's `clips[]` array and persists with project save

**Implementation:** Sequencer canvas renderer reads `clip.color ?? defaultColors[clip.sourceType]` for fill; clip border drawn 2px darker.

---

### F-026 — Track Grouping / Sub-Bus

**Complexity:** High
**Module:** `modules/sequencer.js`, `modules/mixer.js`

Group multiple sequencer tracks under a shared sub-bus for collective gain, mute, and effect control.

**Features:**
- Drag tracks onto a "Group" header row to add them to the group
- Group header row shows: group name (editable), group gain fader, group mute/solo button
- Group has its own `GainNode` in the Web Audio graph; all member tracks route through it before reaching the master
- Group can have an insert effect chain (same `EffectChain` component already used per-track)
- Collapse/expand: clicking the group header collapses member rows to save vertical space; group waveform preview shows summed RMS of all members
- Solo: soloing a group mutes all tracks outside the group

---

### F-027 — Auto-Slice on Transients

**Complexity:** High
**New module:** `modules/slicer.js`

Detect onset transients in a loaded buffer and place slice markers automatically. Enables rapid drum loop chopping and melodic phrase isolation.

**Onset detection algorithm (Spectral Flux):**
```
flux(t) = Σ_k max(0, |X(t,k)| − |X(t−1,k)|)
```
where `X(t,k)` is the FFT magnitude at time frame `t`, bin `k`. Positive-only half-wave rectification emphasizes energy increases (onsets) while ignoring energy decreases (note tails). Pick peaks above a dynamic threshold (mean + 1.5σ of flux signal) with a minimum inter-onset distance of 50ms.

**Features:**
- "Auto-Slice" button → runs onset detection on the loaded `AudioBuffer` via `OfflineAudioContext`
- Slice markers drawn as vertical lines on the waveform; drag to adjust position ±10ms
- Sensitivity slider: adjusts the `+σ` multiplier (0.5–3.0) to get more or fewer slices
- "Slice to Sampler": loads each slice segment as a separate pad in the sampler (up to 16 pads)
- "Slice to Sequencer": creates one clip per slice in the arrangement at the original playback position

---

## Category 5: Theremin + Motion

---

### F-029 — MediaPipe Hand Tracking

**Complexity:** High
**Module:** `modules/theremin.js`

Replace the existing pixel-difference motion detection with MediaPipe Hands (21-point hand skeleton). Provides accurate fingertip tracking regardless of lighting, clothing color, or background.

**Integration:**
- Lazy-load `@mediapipe/hands` via CDN only when theremin is enabled (avoids loading a 10MB model on every page load)
- Map `landmarks[8]` (index fingertip) `x` and `y` (normalized 0–1) to theremin X/Y parameters
- `landmarks[8].z` (depth): map to a third parameter (e.g., reverb wet amount) if desired
- Retain existing parameter mapping (X = pitch/frequency, Y = filter cutoff or volume)
- Graceful fallback: if MediaPipe fails to load or initialize (ad blocker, slow CDN), fall back to pixel-diff motion detection with a visible warning

**Performance:** Run `hands.send({ image: videoElement })` at 30fps (throttle with `requestAnimationFrame` and a 33ms gate). MediaPipe Hands runs in WASM + WebGL and should not block the audio thread.

---

### F-030 — Two-Hand Theremin

**Dependency:** F-029 (MediaPipe Hand Tracking)
**Complexity:** Medium
**Module:** `modules/theremin.js`

Independently control four audio parameters using left-hand and right-hand positions.

**Mapping:**
- Left hand: pitch (X-axis), volume (Y-axis)
- Right hand: filter cutoff (X-axis), reverb send (Y-axis)
- Hand classification: use MediaPipe `Handedness` field (`Left` / `Right`) from the result; do not rely on screen-position heuristics
- Minimum separation threshold: if two detected hands are within 80px of each other (normalized), treat as a single hand (prevents mis-classification flicker)

**Visualization:** Two colored crosshairs on the theremin canvas — blue for left hand, orange for right hand — plus parameter labels at the edges showing current mapped values.

---

### F-031 — Theremin Scale Lock

**Complexity:** Low
**Module:** `modules/theremin.js`

Quantize theremin pitch output to the nearest note in a selected musical scale. Eliminates out-of-tune sliding and makes the theremin usable as a melodic instrument in a live performance context.

**Controls:**
- Scale selector: chromatic, major, minor, pentatonic, blues (using existing `musicScales` from `constants.js`)
- Root key selector: C through B (using existing `noteFrequencies`)
- Glide: 0–200ms portamento — `OscillatorNode.frequency.setTargetAtTime(targetHz, now, glide/3)` for smooth pitch transitions between quantized notes

**Quantization algorithm:**
1. Convert raw theremin frequency to MIDI note: `midi = 12 * log2(freq / 440) + 69`
2. Find nearest scale degree: `noteClass = ((Math.round(midi) % 12) + 12) % 12`; search `musicScales[scaleType]` for closest value
3. Snap MIDI note to nearest scale degree in the same octave
4. Convert back to Hz: `targetHz = 440 * 2 ** ((snappedMidi - 69) / 12)`
5. Apply to `OscillatorNode.frequency` with glide

---

### F-032 — Gesture Presets

**Dependency:** F-029 (MediaPipe Hand Tracking)
**Complexity:** Medium
**New module:** `modules/gesture-presets.js`

Map static hand gestures to parameter changes or toggle actions. Extends hands-free control beyond position-based X/Y mapping.

**Built-in gestures (detected from MediaPipe landmark geometry):**
- **Closed fist:** all fingers curled (fingertip Y > knuckle Y for all 4 fingers) → Mute toggle
- **Open palm:** all fingers extended (fingertip Y < knuckle Y) → Reverb swell (ramp reverb send to 100% over 2s)
- **Pinch:** index fingertip within 40px of thumb tip → Gain reduction (proportional to pinch depth)
- **Victory / Peace:** index and middle extended, others curled → Loop toggle

**Customization:**
- Each gesture slot is user-assignable to any app action via a gesture-to-action JSON mapping
- Actions: any function exposed on the `GestureActionRegistry` (mute, loop, cue, effect toggle, etc.)
- Save/load gesture presets as named JSON blobs to `localStorage`
- Gesture sensitivity: debounce of 500ms between same-gesture fires to prevent rapid repeated triggers

---

### F-033 — Theremin MIDI Output

**Complexity:** Medium
**Module:** `modules/theremin.js`

Transmit theremin X/Y position as MIDI Continuous Controller messages via the Web MIDI API. Allows the theremin to control external hardware synthesizers or DAW automations.

**Controls:**
- X-axis CC number: default CC1 (Mod Wheel), range 0–127
- Y-axis CC number: default CC11 (Expression), range 0–127
- MIDI output device: dropdown populated from `navigator.requestMIDIAccess({ sysex: false })`
- MIDI channel: 1–16
- Scaling: 0–1 normalized position → 0–127 integer, sent only when value changes by ≥1 unit to avoid flooding

**Implementation:**
```js
const midi = await navigator.requestMIDIAccess();
const output = midi.outputs.get(selectedDeviceId);
output.send([0xB0 | (channel - 1), ccNumber, Math.round(normalizedValue * 127)]);
```
Throttled to 60Hz (RAF-driven). Graceful degradation: if Web MIDI is unavailable (Firefox, iOS Safari), hide the MIDI output panel with an explanatory tooltip.

---

## Category 6: Sampler

---

### F-036 — Pad Grid View

**Complexity:** Medium
**Module:** `modules/sampler.js`, sampler UI

An MPC-style 4×4 pad grid as an alternative to the piano-keyboard view. More intuitive for drum programming and beat-making workflows.

**Features:**
- Toggle button: "⌨ Keys" / "▦ Pads" switches between the existing keyboard and the new grid view
- 16 pads in a 4×4 layout; each pad maps to a keyboard key from `keyboardMap` (pads 0–15 = keys `q,w,e,r / a,s,d,f / z,x,c,v / t,y,u,i`)
- Each pad displays: sample name (first 8 chars, truncated with ellipsis), velocity indicator bar (height ∝ velocity)
- Velocity: mouse button hold duration (0–200ms → MIDI velocity 20–127) OR drag-down distance on touchscreen
- Right-click context menu per pad: "Assign sample from track 1/2", "Toggle reverse", "Set choke group"
- Hit animation: pad flashes to full brightness on trigger, fades over 80ms

**Keyboard triggers:** existing `handleKeyDown` events continue to work in pad view — no new bindings needed.

---

### F-037 — Per-Pad Reverse

**Complexity:** Low
**Module:** `modules/sampler.js`

Play any individual pad's sample in reverse, independent of other pads and of the global sampler reverse setting.

**UI:** Small "R" toggle button in the corner of each pad in the pad grid view (F-036 dependency for the UI surface; can also be added as a right-click option in keyboard view).

**Implementation:**
- Add `reverse: boolean` per-pad to sampler state object (`samplerPadState[padIndex].reverse`)
- In `playSamplerNote()`: if `padState.reverse`, pre-render the reversed buffer via `AudioBufferManager.createLoopBuffer()` (which already caches reversed sections) for the full sample duration, or use `reverseAudioBuffer()` on the full `samplerAudioBuffer`
- Reversed buffers cached in `AudioBufferManager` — no re-rendering on repeated trigger

---

### F-038 — Choke Groups

**Complexity:** Medium
**Module:** `modules/sampler.js`

Pads assigned to the same choke group stop each other on trigger. Classic use case: triggering the closed hi-hat silences the open hi-hat mid-decay — essential for realistic drum programming.

**Implementation:**
- Choke group property per pad: `0` = no group, `1–8` = group ID
- On trigger: before starting the new source, iterate `samplerVoiceRegistry` (already exists from BUG-016 fix); for each active voice whose pad shares the same choke group, call a 5ms fade-out then `source.stop(ctx.currentTime + 0.005)`
- Requires storing `chokeGroup` alongside each voice in `samplerVoiceRegistry`: change registry values from bare `source` to `{ source, noteGain, chokeGroup }`
- **UI:** group number selector (0–8) per pad in the pad settings panel (right-click → "Choke group: [dropdown]")

---

### F-039 — Multi-Sample Velocity Layers

**Complexity:** High
**Module:** `modules/sampler.js`

Different audio samples play for soft versus hard hits on the same pad — the key ingredient for realistic-sounding drum samples.

**Architecture:**
- Each pad supports up to 4 velocity layers: `pp` (velocity 0–32), `mp` (33–64), `mf` (65–96), `ff` (97–127)
- Each layer holds a separate `AudioBuffer` loaded from a separate file
- On trigger: determine velocity (from mouse hold duration, drag distance, or MIDI velocity); pick the layer whose range contains the velocity
- **Round-robin within layer:** cycle through up to 3 alternate samples per layer to avoid the "machine-gun effect" (same sample repeated identically)
- **Layer crossfade at boundaries:** at velocity = 64 (mp/mf boundary), blend mp layer at 50% and mf layer at 50% by playing both simultaneously at half gain

**UI:** Per-pad sample management panel: 4 rows (pp / mp / mf / ff), each with a "Load sample" button and a velocity range indicator. Drag the boundary sliders to re-partition the velocity zones.

---

## Category 7: Recording + Export

---

### F-040 — Punch In/Out Recording

**Complexity:** Medium
**Module:** `modules/recorder.js`

Set pre-defined in/out points so that recording starts and stops automatically at exact positions during playback — a standard DAW recording workflow for overdubs and punch fixes.

**Controls:**
- Set In button: stores `audioElement.currentTime` as punch-in time; marker drawn on waveform
- Set Out button: stores current position as punch-out time; marker drawn on waveform
- Pre-roll: playback starts N bars before the in-point so the performer can feel the tempo before recording starts (configurable: 1, 2, 4 bars)
- Punch mode toggle: "Auto Punch" — `MediaRecorder.start()` is called automatically when `audioElement.currentTime >= punchIn`; `MediaRecorder.stop()` when `currentTime >= punchOut`
- Visual markers: punch-in = green vertical line on waveform; punch-out = red vertical line; displayed alongside loop markers

**Implementation:** Add a `timeupdate` event listener on `audioElement` that checks the current position against `punchIn` / `punchOut` and calls `startMicRecording()` / `stopMicRecording()` accordingly.

---

### F-041 — Multi-Format Export (Expanded)

**Complexity:** Medium-High
**Module:** `modules/recording.js`

The existing export (v3.27.9) supports WAV (16-bit integer via `audioBufferToWav`) and MP3 (via `lamejs`). This feature expands the format and bit-depth options.

**Additional formats to add:**
- **WAV 24-bit:** 3-byte signed integer samples; requires a custom `audioBufferToWav24()` since `lamejs` only handles 16-bit
- **WAV 32-bit float:** native `Float32Array` — trivial since Web Audio buffers are already 32-bit float
- **Sample rate options:** 44.1kHz, 48kHz; use `OfflineAudioContext` at the target sample rate (Web Audio handles SRC automatically)
- **MP3 bit rate:** expose 128 / 192 / 320 kbps options (existing `lamejs` supports this via `Mp3Encoder` `kbps` parameter)
- **FLAC:** lossless; requires `libflac.js` WASM encoder (lazy-loaded ~800KB); encode the `Float32Array` samples as 24-bit FLAC frames
- **OGG Vorbis:** lossy; requires `libvorbis.js` WASM encoder (lazy-loaded); quality 0–10 option

**Metadata tags:** expose text inputs for artist, title, BPM (pre-filled from detection), key (pre-filled from detection); write as ID3 tags (MP3) or Vorbis comments (OGG/FLAC) or RIFF INFO chunk (WAV).

---

### F-042 — Cue Sheet Export

**Complexity:** Low
**Module:** `modules/export.js`

Export a `.cue` sheet (CD authoring format) or `.csv` with track names, timestamps, and hot cue positions.

**CUE format:**
```
FILE "mix.wav" WAVE
TRACK 01 AUDIO
  TITLE "Intro"
  INDEX 01 00:00:00
TRACK 02 AUDIO
  TITLE "Drop"
  INDEX 01 01:32:10
```

**Implementation:** Iterate the hot cue list (F-004) in time order; format each as a `TRACK` entry. Timestamps use `MM:SS:FF` format (75 frames per second for CD, or whole seconds for DJ export). Also export as `.csv` with columns `track, title, time_seconds, bpm, key`.

**Use case:** Mastering workflow; import into CD authoring (Wavelab, Toast) or upload to streaming services that accept cue sheets.

---

### F-043 — Recording Input Level Metering

**Complexity:** Low
**Module:** `modules/recorder.js`, microphone UI

Show live input levels during microphone recording so the user can prevent clipping before a take is ruined.

**Features:**
- VU meter: RMS level updated at 60fps, displayed as a vertical bar alongside the mic waveform canvas
- Peak hold: peak sample value held for 3 seconds then falls at 12 dB/s
- Clip indicator: red segment lights above −0.5 dBFS; stays lit until clicked (latching clip indicator)
- Target zone: orange band marking the recommended recording level of −18 to −12 dBFS; green below, red above
- Pre-roll metering: meter is active from the moment mic is enabled, not just during recording — lets the user set input gain before starting

**Implementation:** `micAnalyser.getFloatTimeDomainData(buffer)` on each RAF frame; compute `rms = Math.sqrt(buffer.reduce((s,x) => s + x*x, 0) / buffer.length)`; draw on the meter canvas.

---

## Category 8: Analysis + Intelligence

---

### F-044 — Harmonic Mixing Wheel (Camelot Wheel)

**Complexity:** Medium
**New module:** `modules/harmonic-mixing.js`

Display detected track keys on the industry-standard Camelot Wheel (Mixed In Key notation). Highlight harmonically compatible keys for smooth key-compatible mixing.

**Camelot Wheel data structure:**
```js
const CAMELOT = {
    'C major':  '8B', 'A minor':  '8A',
    'G major':  '9B', 'E minor':  '9A',
    'D major': '10B', 'B minor': '10A',
    'A major': '11B', 'F# minor':'11A',
    'E major': '12B', 'C# minor':'12A',
    'B major':  '1B', 'G# minor': '1A',
    'F# major': '2B', 'D# minor': '2A',
    'C# major': '3B', 'A# minor': '3A',
    'G# major': '4B', 'F minor':  '4A',
    'D# major': '5B', 'C minor':  '5A',
    'A# major': '6B', 'G minor':  '6A',
    'F major':  '7B', 'D minor':  '7A',
};
```

**Compatible keys:** for a track at position NX, compatible = `{NX, (N±1)X, N(opposite)}` — same number adjacent on the wheel or relative major/minor.

**Features:**
- SVG Camelot Wheel rendered in a dedicated panel (24 segments in 2 concentric rings)
- Current Track 1 key = highlighted cyan segment; Track 2 key = highlighted magenta; compatible keys = dim green highlight
- "Key Shift" buttons: +1 / −1 Camelot position = ±1 semitone transpose applied via `Tone.PitchShift` on the track
- Filter: clicking a compatible key slot filters a future track library (F-051) to show only tracks in that key

---

### F-045 — Spectral Waveform

**Complexity:** Medium
**Module:** waveform renderer (`modules/audio-utils.js`)

Replace or augment the amplitude waveform with a frequency-colorized STFT view. The color of each time slice encodes frequency content, making song structure (basslines, breakdowns, drop energy) immediately visible.

**Visualization scheme:**
- Perform STFT on the loaded `AudioBuffer` at render time (once per load, cached): `fftSize = 2048`, `hopSize = 512`
- For each time column on the canvas: compute spectrum magnitudes, split into three bands:
  - Bass (20–200Hz): map energy to red/orange hue
  - Mids (200Hz–4kHz): map to yellow/green
  - Highs (4kHz–20kHz): map to blue/white
- Luminosity = normalized RMS of the slice
- Blend band colors by energy ratio: `hue = bassWeight * 0° + midWeight * 120° + highWeight * 240°`
- Toggle button: switch between "Amplitude" and "Spectral" waveform views

**Performance:** STFT on a 4-minute 44.1kHz track takes ~3s. Run inside a `Worker` thread to avoid blocking the UI. Cache the resulting pixel buffer; re-use on zoom changes by re-sampling from the cached STFT.

---

### F-046 — Track Energy Graph

**Complexity:** Low
**Module:** waveform renderer

A secondary mini-graph showing track RMS energy over time, displayed below the waveform. Instantly reveals song structure — drops, breakdowns, build-ups — without listening.

**Calculation:** 0.1s RMS windows across the full track duration (computed at load time, same pass as BPM detection). Result: `energyTimeline[i] = rms of samples[i*hopSize .. (i+1)*hopSize]`

**Visualization:**
- Filled area chart drawn on a `<canvas>` element (height: 40px) below the waveform canvas
- Semi-transparent fill in the track color; 1px stroke at top
- X-axis matches waveform time axis exactly (same zoom and scroll state)
- Y-axis: normalized 0–1 (peak normalized per track)
- Updates on zoom/scroll together with waveform via the existing `redrawWaveformWithZoom()` call

---

### F-047 — Loudness Normalization

**Complexity:** Medium
**New module:** `modules/loudness.js`

Measure a loaded track's integrated LUFS and apply a makeup gain offset to match a target loudness level. Prevents jarring volume jumps when transitioning between tracks mastered at different loudness levels.

**Controls:**
- Target LUFS: −14 LUFS (streaming standard), −18 LUFS (broadcast), −23 LUFS (EBU R128); user-selectable dropdown
- Per-track override: checkbox to disable normalization on a specific track (for tracks intentionally louder/quieter)
- Measured LUFS display: shown in the track header next to BPM and key (e.g., "−11.2 LUFS")

**Algorithm (ITU-R BS.1770-4 approximation):**
1. Apply K-weighting: high-shelf pre-filter (+4dB above 1681Hz) followed by high-pass (75Hz, −3dB)
2. Compute mean square of the K-weighted signal in 400ms overlapping blocks (75% overlap)
3. Gating: exclude blocks where block loudness < −70 LUFS absolute; then exclude blocks < −10 LUFS relative to ungated mean
4. Integrated loudness `L_K = −0.691 + 10 log10(mean of gated block power)`
5. Makeup gain: `gainDB = targetLUFS − L_K`; apply to track's `GainNode`

Run in `OfflineAudioContext` on the loaded `AudioBuffer`; report result asynchronously.

---

## Category 9: Project + Data Management

---

### F-049 — Storage Quota Indicator

**Complexity:** Low
**Module:** project save UI

Show available storage before saving so users are not surprised by silent save failures.

**Implementation:**
```js
const { usage, quota } = await navigator.storage.estimate();
const usageMB = (usage / 1024 / 1024).toFixed(0);
const quotaMB = (quota / 1024 / 1024).toFixed(0);
```

**UI:**
- Storage bar: `[████████░░] 800 MB / 1.2 GB` rendered as a `<progress>` element in the project save dialog
- Warning at 90% usage: yellow text "Storage nearly full — consider deleting old projects"
- Error at 98% usage: disable the Save button; show "Storage full — delete projects to continue"
- Refresh on dialog open (not on every keystroke)

---

### F-050 — Effect Preset Library

**Complexity:** Medium
**New module:** `modules/preset-library.js`

Save and restore named effect chain configurations as JSON objects. Eliminates manual re-dialing of complex effect setups.

**Features:**
- "Save Preset" button: captures all current effect parameter values (filter type/frequency, EQ gains, reverb wet/dry, delay time/feedback, ADSR, pitch shift) as a JSON object with a user-supplied name
- "Load Preset" dropdown: apply all stored parameter values at once, animating each control to its new value over 200ms
- Export: download preset as `preset-name.json`; import from `.json` file
- Built-in factory presets: "Club Ready" (high EQ +3dB, mid −2dB, reverb 20%), "Lo-Fi Vinyl" (lowpass 3kHz, saturation 60%, wow 30%), "Radio FM" (bandpass 200Hz–8kHz, compression), "Deep Space" (long reverb 80%, delay 400ms 60% feedback)
- Share: "Copy preset JSON" button → clipboard; paste on another browser instance

**Storage:** presets saved in `localStorage` as a JSON array (no size concern — text only, no audio data).

---

### F-051 — Track Library / Crate Management

**Complexity:** High
**New module:** `modules/track-library.js`

Persistent index of all previously loaded tracks with metadata, organized into named crates. Brings a Rekordbox/Serato-style library to the browser.

**IndexedDB schema:**
```js
// Object store: "tracks"
{ id: autoIncrement, filename: string, fileHash: string,
  duration: number, bpm: number, key: string, lufs: number,
  dateAdded: number, crateIds: number[] }

// Object store: "crates"
{ id: autoIncrement, name: string, trackIds: number[], dateCreated: number }
```

**Features:**
- Auto-index on load: file hash (SHA-1), BPM (from `detectBPM`), key (from `detectKey`), duration, filename, date added
- Sortable table: click column header to sort by BPM, key, duration, name, date
- Search: text input filters by filename; range slider filters by BPM; key dropdown filters by detected key
- Crates: named collections; drag tracks from the library table into a crate panel; crates persist across sessions
- Load to deck: double-click library row → loads the file into Track 1 or Track 2 depending on which deck is selected
- Persist: all data in IndexedDB; survives page reload and browser restart

---

## Category 10: UX + Accessibility

---

### F-052 — MIDI Controller Mapping

**Complexity:** High
**New module:** `modules/midi-controller.js`

Map hardware MIDI controller knobs, faders, and buttons to any on-screen control via the Web MIDI API. Enables hands-on DJ performance without touching the mouse.

**Features:**
- **Learn mode:** click "MIDI Learn" → click any on-screen control to highlight it → move the hardware knob/fader → binding created automatically
- **Binding storage:** saved to `localStorage` as `{ deviceId, channel, ccNumber, controlId, min, max }` array
- **Visual indicator:** small MIDI badge overlaid on bound controls
- **Preset mappings:** factory bindings for common controllers:
  - Pioneer DDJ-200: jog wheels → seek, EQ knobs → EQ sliders, crossfader → crossfader
  - Novation Launch Control XL: 8 faders → track volume, 8 knobs → EQ
- **Supported message types:** CC (continuous, for knobs/faders), Note On/Off (for buttons/pads), Pitch Bend (for pitch bend wheels)
- **Range mapping:** MIDI 0–127 linearly mapped to control's `min`/`max` attribute values

---

### F-053 — Keyboard Shortcut System

**Complexity:** Medium
**New module:** `modules/keyboard-shortcuts.js`

Full application keymap with user-configurable bindings and an on-screen reference overlay.

**Default bindings:**

| Key | Action |
|-----|--------|
| `Space` | Play/Pause (focused deck) |
| `Enter` | Cue (jump to cue point, hold = preview) |
| `Z` / `X` | Set loop in / loop out |
| `C` | Toggle loop |
| `1`–`8` | Jump to Hot Cue 1–8 |
| `Shift+1`–`Shift+8` | Set Hot Cue 1–8 |
| `Q` / `W` | Pitch bend −/+ (temporary nudge) |
| `Esc` | Emergency stop all (fade to 0 over 2s) |
| `Tab` | Switch focused deck |
| `?` | Toggle shortcut reference overlay |

**Shortcut overlay:** pressing `?` renders a centered modal listing all bindings in a two-column layout. Dismisses on `Esc` or a second `?`.

**Customization:** settings panel lists all actions with current binding; click a binding → press new key combo → saved to `localStorage`. Export/import keymap as JSON.

**Conflict detection:** warn if a new binding conflicts with browser defaults (`Ctrl+W`, `Cmd+R`, etc.) or sampler keys.

---

### F-054 — Touch / Mobile PWA

**Complexity:** High
**Module:** `style.css`, `app.js`, `index.html`

Make the application fully usable on tablets (iPad) and mobile phones. Note: CSS responsive breakpoints (768px, 480px) were added in v3.27.9 (BUG-020). Remaining work is PWA infrastructure and touch event handling.

**Remaining work:**

**Touch events:**
- Replace `mousedown/mousemove/mouseup` on waveform scrubbing and loop-marker dragging with `pointerdown/pointermove/pointerup` (Pointer Events API — works for both mouse and touch)
- Add `touch-action: none` to all draggable elements to prevent scroll interference
- Crossfader and sliders: test `input` event on mobile (may need `touchmove` fallback for older iOS)

**PWA manifest** (`/static/manifest.json`):
```json
{ "name": "Browser Jockey", "short_name": "BJ",
  "display": "standalone", "start_url": "/",
  "theme_color": "#667eea",
  "icons": [{ "src": "/static/img/icon-512.png", "sizes": "512x512" }] }
```

**Service worker** (`/static/sw.js`): cache-first strategy for all static assets (JS modules, CSS, fonts); network-first for Flask routes. Enables offline use after first load.

**Add to Home Screen:** show the browser's install prompt on first visit (listen for `beforeinstallprompt` event); offer a manual "Install App" button in the header.

---

### F-055 — ARIA Accessibility (Full Pass)

**Complexity:** Medium
**File:** `app/templates/index.html`, `app.js`

Priority playback controls, sliders, and canvas elements received `aria-label`, `aria-valuenow`, and `role="img"` attributes in v3.27.9 (BUG-019). This feature completes the full accessibility pass across all remaining controls.

**Remaining work (estimated ~270 controls not yet addressed):**

1. **Live state sync for toggle buttons:** `aria-pressed` was set statically in the HTML; needs JS updates on state change — e.g., `loopBtn1.setAttribute('aria-pressed', loopState.enabled)` in every place loop state changes
2. **Effect chain toggles:** `aria-pressed` + `aria-label` on all dynamically-generated effect chain toggle buttons (generated by `EffectChain`)
3. **Sequencer controls:** all step buttons (`aria-pressed`, `aria-label="Step N, Track M"`), clip elements (`role="listitem"`, `aria-label`)
4. **Sampler pad/key buttons:** `aria-label="Note [name], [octave]"` + `aria-pressed` for held state
5. **Section landmarks:** `role="region"` + `aria-label` on major panels (mixer, track 1 deck, track 2 deck, sequencer, sampler, microphone)
6. **Select elements:** `aria-label` on all `<select>` dropdowns (filter type, vocoder source, autotune key, etc.)
7. **Theremin canvas:** `role="application"` (not `img`) + `aria-label` + `aria-description` explaining motion-control nature

**Testing:** Verify with NVDA (Windows), VoiceOver (macOS/iOS), axe-core automated scan (`npm run axe`). Target: 0 critical, 0 serious violations.

---

### F-057 — Onboarding Tour

**Complexity:** Medium
**New module:** `modules/onboarding.js`

First-launch interactive walkthrough that guides new users to the key controls without reading documentation.

**Steps:**
1. Load a track (highlight file input + drag-zone)
2. Play/Pause and transport controls
3. Loop controls (A/B point workflow)
4. EQ knobs
5. Effects panel
6. Crossfader
7. Sampler and theremin (optional advanced step)

**Implementation:**
- Spotlight highlight: `backdrop-filter: brightness(0.3)` on `body`; target element elevated with `z-index: 9999` + bright border ring
- Step indicator: "3 / 8" pill in the top-right corner of the spotlight overlay
- Skip button: dismisses immediately; state stored in `localStorage` key `onboardingDismissed`
- "Don't show again" checkbox on final step; also stored in `localStorage`
- Resume: "Start Tour" button in a Help menu / `?` icon restarts the tour from step 1
- Keyboard: `←`/`→` arrow keys navigate steps; `Esc` skips

---

## Implementation Priority Matrix

| Priority | ID | Feature | Effort | Impact |
|----------|----|---------|--------|--------|
| P1 | F-004 | Hot Cues | Med | High |
| P1 | F-005 | Beat Grid + Quantize | Med | High |
| P1 | F-019 | Master Limiter + Metering | Med | High |
| P1 | F-036 | Pad Grid View | Med | High |
| P1 | F-043 | Recording Level Metering | Low | High |
| P2 | F-006 | Slip Mode | Med | Med |
| P2 | F-009 | Sidechain Compression | High | Med |
| P2 | F-013 | Stutter / Gate Effect | Med | Med |
| P2 | F-016 | EQ Visualization | Med | Med |
| P2 | F-021 | Send/Return FX Buses | Med | Med |
| P2 | F-044 | Harmonic Mixing Wheel | Med | High |
| P2 | F-047 | Loudness Normalization | Med | High |
| P2 | F-050 | Effect Preset Library | Med | Med |
| P2 | F-052 | MIDI Controller Mapping | High | High |
| P2 | F-053 | Keyboard Shortcut System | Med | Med |
| P3 | F-010 | High-Quality Vocoder | High | Med |
| P3 | F-011 | Granular Synthesis | High | High |
| P3 | F-012 | Tape Saturation | Med | Med |
| P3 | F-014 | Spectral Freeze | High | Med |
| P3 | F-015 | Convolution Reverb Presets | Low-Med | Med |
| P3 | F-022 | Undo/Redo | High | High |
| P3 | F-027 | Auto-Slice on Transients | High | High |
| P3 | F-029 | MediaPipe Hand Tracking | High | Med |
| P3 | F-038 | Choke Groups | Med | High |
| P3 | F-045 | Spectral Waveform | Med | Med |
| P3 | F-051 | Track Library / Crates | High | High |
| P3 | F-054 | Touch / Mobile PWA | High | Med |
| P3 | F-055 | ARIA Accessibility (full) | Med | Med |

---

## Architecture Notes

- **Beat grid** (F-005) unblocks F-013 (stutter gate sync), F-022 (quantized undo), F-006 (slip mode visual)
- **MediaPipe hand tracking** (F-029) unblocks F-030, F-032, F-033
- **Hot cues** (F-004) unblocks F-042 (cue sheet export) and enriches F-051 (track library)
- **Pad grid view** (F-036) is the UI surface prerequisite for F-037 (per-pad reverse) and F-038 (choke groups)
- **`OfflineAudioContext` operations** (F-020 stems, F-041 export, F-047 loudness) should run in a `Worker` thread to avoid main-thread jank during long renders
- **WASM audio codecs** (F-041 FLAC/OGG) should be lazy-loaded on first export use only — do not bundle into the initial page load
- **Responsive CSS** (768px, 480px breakpoints) was completed in v3.27.9 (BUG-020); F-054 PWA work can proceed without further CSS prerequisite

---

## Removed Features (Implemented in v3.27.9)

The following features from earlier roadmap versions were removed because they are now fully implemented in the codebase:

| ID | Feature | Implemented via |
|----|---------|----------------|
| F-001 | Real Phase Vocoder Time-Stretching | BUG-002: `timestretch-processor.js` full phase vocoder |
| F-002 | Actual Pitch Shifting (Tone.PitchShift) | BUG-001: `autotune.js` replaced delay-node chain |
| F-003 | Autotune Scale Lookup Fix | BUG-001 + BUG-006: `findNearestNoteInScale()` corrected |
| F-007 | Auto BPM Sync | `syncTrackBPM()` in `app.js`; UI buttons wired |
| F-008 | Improved BPM Detection | BUG-014: min-peak-distance, half-tempo check, 60s window |
| F-017 | 3-Band EQ per Track | `audio-effects.js`: lowshelf 250Hz + peaking 1kHz + highshelf 4kHz |
| F-028 | Sequencer LRU Cache | BUG-008: `_cacheGet`/`_cacheSet` with MAX\_CACHE\_SIZE=5 |
| F-034 | Sampler Voice Stealing | BUG-016: `samplerVoiceRegistry` + MAX\_VOICES=16 |
| F-035 | Fix Chromatic Scale | BUG-007: `constants.js` corrected to 13 elements \[0..12\] |
| F-048 | Fix IndexedDB Delete | `deleteProject()` uses direct key lookup (not cursor scan) |
| F-056 | CSS Responsive Breakpoints | BUG-020: 768px and 480px breakpoints added to `style.css` |
