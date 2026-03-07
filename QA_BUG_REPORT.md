# QA Bug Report — Browser Jockey v3.27.9

**Date:** 2026-03-07 (updated 2026-03-07)
**Codebase:** ~6,000 LOC across 19 JS modules
**Architecture:** Flask server + Web Audio API + Tone.js + Three.js (all signal processing client-side)

All bugs were **verified by reading the actual source files**, with exact file paths and line numbers confirmed against the codebase. Bugs excluded from agent-reported lists that could not be confirmed in source are omitted.

---

## Summary

| Severity | Count | IDs |
|----------|-------|-----|
| 🔴 Critical | 4 | BUG-001 – BUG-004 |
| 🟠 High | 8 | BUG-005 – BUG-011, BUG-021 |
| 🟡 Medium | 4 | BUG-012 – BUG-015 |
| ⚪ Low / Polish | 5 | BUG-016 – BUG-020 |
| **Total** | **21** | |

## Fix Status

| Bug | Severity | Status | Fixed In |
|-----|----------|--------|----------|
| BUG-001 | 🔴 Critical | ✅ **FIXED** 2026-03-07 | `autotune.js`, `app.js` |
| BUG-002 | 🔴 Critical | ✅ **FIXED** 2026-03-07 | `timestretch-processor.js`, `audio-buffer-manager.js` |
| BUG-003 | 🔴 Critical | ✅ **FIXED** 2026-03-07 | `vocoder.js` |
| BUG-004 | 🔴 Critical | ✅ **FIXED** 2026-03-07 | `playback-controller.js` |
| BUG-006 | 🟠 High | ✅ **FIXED** 2026-03-07 | `autotune.js`, `app.js` (subsumes BUG-001 fix) |
| BUG-009 | 🟠 High | ✅ **FIXED** 2026-03-07 | `vocoder.js` (subsumes BUG-003 fix) |
| BUG-021 | 🟠 High | ✅ **FIXED** 2026-03-07 | `microphone.js`, `app.js` |
| BUG-005 | 🟠 High | ✅ **FIXED** 2026-03-07 | `sampler.js` |
| BUG-007 | 🟠 High | ✅ **FIXED** 2026-03-07 | `constants.js` |
| BUG-008 | 🟠 High | ⏳ Open | — |
| BUG-010 | 🟠 High | ⏳ Open | — |
| BUG-011 | 🟠 High | ⏳ Open | — |
| BUG-012 | 🟡 Medium | ✅ **FIXED** 2026-03-07 | `sampler.js` |
| BUG-013 | 🟡 Medium | ✅ **FIXED** 2026-03-07 | `audio-buffer-manager.js` |
| BUG-014 | 🟡 Medium | ⏳ Open | — |
| BUG-015 | 🟡 Medium | ✅ **FIXED** 2026-03-07 | `config.py` |
| BUG-016–020 | ⚪ Low | ⏳ Open | — |

Run tests: start the dev server and open `http://localhost:5001/tests/unit-tests.html`

---

## 🔴 CRITICAL — Feature Non-Functional

---

### BUG-001 — Autotune produces no pitch correction

**File:** `modules/autotune.js` lines 35–65
**Secondary:** `modules/autotune.js` line 187; `modules/constants.js` line 38

**Root cause (primary):**
The "pitch shifter" implementation consists of 12× nodes each built from `{delay: 20ms, allpass filter, gain}`. A fixed 20ms delay does not shift pitch. Modulating gain on a delayed copy produces AM distortion, not a frequency shift. There is no phase manipulation or resynthesis; the output is the dry signal plus amplitude artifacts.

**Root cause (secondary):**
`findNearestNoteInScale()` (line 187) calls `musicScales[scaleKey]` where `scaleKey` is a note name (e.g. `'C'`). However, `musicScales` in `constants.js` line 38 is keyed by scale *type* (`chromatic`, `major`, `minor`, `pentatonic`), not note name. `musicScales['C']` evaluates to `undefined`, the `!scale` guard fires, and the function returns the original unmodified frequency. Scale-aware correction never applies regardless of key/scale selection.

**Reproduction steps:**
1. Load any audio track
2. Enable Auto-Tune
3. Select any key and scale
4. Monitor output — pitch is unchanged; wet signal adds AM distortion artifacts

**Expected behavior:** Output pitch is quantized to the nearest note in the selected scale.

**Fix:**
- Primary: Replace the delay-node chain with `Tone.PitchShift` (or a proper phase-vocoder implementation using `OscillatorNode` + `GainNode` with phase rotation). Tone.js `PitchShift` is already a project dependency.
- Secondary: Change `musicScales[scaleKey]` → `musicScales[scaleType]` (where `scaleType` is the scale type string). Apply root note MIDI offset derived from `noteFrequencies[key]` separately.

> **✅ FIXED 2026-03-07** — `modules/autotune.js`, `app.js`
>
> **Fix 1 — pitch shifter node:**
> Replaced 12× delay-node chain with `Tone.PitchShift` (phase-vocoder). Falls back to dry signal if Tone.js unavailable.
>
> **Fix 2 — scale lookup:**
> `findNearestNoteInScale()`: `musicScales[scaleKey]` → `musicScales[scaleType]`; added `NOTE_NAMES` array; MIDI-based `((n % 12) + 12) % 12` for always-positive octave class (0–11).
>
> **Fix 3 — Tone.js v15 native node bridge:**
> `audioSource.connect(pitchShifter.input)` threw `"Overload resolution failed"` — `Effect.input` in Tone.js v15 is a `Tone.Gain` wrapper, not a native `AudioNode`. Fixed: `audioSource.connect(pitchShifter.input.input || pitchShifter.input)`.
>
> **Fix 4 — app.js `pitchShifters` reference error:**
> `correctPitch()` referenced the old `pitchShifters` array (12 delay nodes), causing `ReferenceError` on first correction cycle. Replaced `pitchShifters.forEach(...)` with `correctPitchToTarget(autotuneState, detectedFreq, targetFreq)`.
>
> **Fix 5 — wrong autotune interception point (discovered during live testing):**
> `enableAutotune()` used `gain1`/`gain2` as the audio source. These are the *first* nodes in the effects chain (`source → gain1 → panner → ... → finalMix1 → merger`). `audioSource.disconnect(merger)` silently failed because `gain1` connects to `panner1`, not directly to `merger`. The original `finalMix1 → merger` path stayed active at full volume, completely masking the pitch-corrected signal. Fixed: source changed to `finalMix1`/`finalMix2` (last node before `merger`), which does connect directly to `merger`. `disableAutotune()` reconnect also corrected: `finalMix1 → merger` (was `gain1 → merger`).
>
> **Fix 6 — pitch detection almost never triggered (discovered during live testing):**
> `correctPitch()` used `autoCorrelate()` (time-domain AMDF with 0.9 threshold). This threshold almost never triggers on real music signals (harmonics, noise). Result: `pitchShifter.pitch` was never updated from 0. Fixed: replaced with `getByteFrequencyData` + `detectPitch()` from the autotune module (frequency-domain peak, no threshold to fail).
>
> **Fix 7 — `getNearestNoteFrequency()` wrong for sub-root notes (discovered during live testing):**
> `Math.round(semitones) % 12` returns negative values in JS when `semitones < 0` (JS `%` preserves sign of dividend). A note at E3 with key=G4 gave `noteInOctave = -3`, which matches no scale interval, causing incorrect octave snapping (e.g. G2 instead of E3). Fixed: `correctPitch()` now calls `findNearestNoteInScale()` from the module, which uses `((Math.round(midiNote) % 12) + 12) % 12` — always 0–11.
>
> Tests: `app/static/tests/unit-tests.html` — BUG-001 suite (12 tests) + BUG-001b (5 tests) + BUG-001c (5 tests, Tone.js v15 bridge).

---

### BUG-002 — TimeStretch AudioWorklet is a passthrough (feature non-functional)

**File:** `timestretch-processor.js` lines 118–120

**Root cause:**
The `process()` method contains the comment:
> "TEMPORARY: Simple passthrough for now — Phase vocoder timestretching will be implemented in offline processing"

Line 120: `output[channel].set(input[channel])` — audio is copied without any processing. The FFT/phase-vocoder infrastructure (`simpleFFT()`, `createHannWindow()`, overlap-add buffers) is fully defined at lines 54–101 but is **never invoked** from `process()`. Any apparent tempo change comes solely from `playbackRate` adjustment on the source node, which shifts both tempo and pitch together.

**Reproduction steps:**
1. Load a track
2. Move the stretch slider away from 1.0×
3. Observe: tempo does not change independently of pitch; phase-vocoder processing is not applied

**Expected behavior:** Tempo changes without pitch change (true time-stretching).

**Fix:**
Implement the phase vocoder `process()` loop using the already-defined `simpleFFT()` and `createHannWindow()`. Algorithm outline:
1. Fill `inputBuffer` with incoming frames
2. When `inputBuffer` has `fftSize` samples: apply Hann window, forward FFT
3. Accumulate phase increments per bin scaled by `stretchRatio`
4. Inverse FFT + Hann window + overlap-add into `outputBuffer`
5. Advance read pointer by `analysisHop = fftSize / overlapFactor`; advance write pointer by `synthesisHop = analysisHop * stretchRatio`

Alternatively, pre-render stretched audio using `OfflineAudioContext` on track load or loop-point change.

> **✅ FIXED 2026-03-07** — `timestretch-processor.js` + `modules/audio-buffer-manager.js`
> - **AudioWorklet** (`timestretch-processor.js`): Implemented full phase vocoder in `process()` using the existing `simpleFFT()` and `createHannWindow()` infrastructure. Added per-channel state (`chStates[]`) for stereo support. Bypass mode at `stretchRatio=1.0` preserves zero latency. Phase accumulators reset on ratio change to avoid discontinuities.
> - **Offline path** (`audio-buffer-manager.js` `createTimestretchedBuffer()`): Added pitch correction `−12·log₂(stretchRatio)` semitones via `Tone.PitchShift` to cancel the pitch change from `player.playbackRate`. Combined with any user `pitchShift` parameter into `totalPitchShift`.
> - Tests: `app/static/tests/unit-tests.html` — BUG-002 suite (offline pitch-correction formula, AudioWorklet bypass, AudioWorklet produces non-silent output at stretch≠1).

---

### BUG-003 — Vocoder envelope follower missing smoothing; gain base value wrong

**File:** `modules/vocoder.js` lines 62–79

**Root cause (1) — No smoothing filter:**
The WaveShaper at line 65 with curve `Math.abs(j/128 - 1)` correctly implements full-wave rectification (maps −1→+1 range to 0→1). However, there is no lowpass/smoothing filter downstream of the WaveShaper per band. A real envelope follower requires an attack/release lowpass (typically 5–30Hz) to extract the slowly-varying amplitude envelope. Without it, the "envelope" is the instantaneous absolute sample value, causing harsh AM distortion at audio frequency rather than smooth amplitude modulation.

**Root cause (2) — Wrong gain base value:**
`bandGain.gain.value = 1.0` at line 71. The envelope follower output is *added* to the `AudioParam` base value, so effective gain oscillates between 1.0 (silence) and 2.0 (full modulator signal), rather than between 0.0 and 1.0. The carrier band is never fully silenced.

**Reproduction steps:**
1. Enable the vocoder
2. Speak into the microphone
3. Output sounds like heavily amplitude-modulated distortion, not vocoded speech; no formant-tracking effect is heard

**Expected behavior:** Carrier bands are amplitude-modulated by the modulator's (speech) per-band envelope, producing recognizable speech formants on the carrier.

**Fix:**
- After each WaveShaper, insert a `BiquadFilterNode` (`type: 'lowpass'`, frequency 10–30Hz) to smooth the rectified signal to a slow envelope.
- Change `bandGain.gain.value = 0` so that the envelope (0→1 range) drives gain from silence to full amplitude.

> **✅ FIXED 2026-03-07** — `modules/vocoder.js`
> - Added `smoothingFilter` (15 Hz lowpass `BiquadFilterNode`) after each `WaveShaper` per band. `disableVocoder()` now disconnects these nodes.
> - Changed `bandGain.gain.value = 1.0` → `0`. Envelope follower now drives gain 0→1 (carrier fully silenced when modulator energy is zero).
> - BUG-009 also fixed: `getVocoderCarrierSource('mix',...)` now accepts a `vocoderState` parameter and stores the created `mixGain` in `vocoderState.mixGainNode`; `disableVocoder()` disconnects it.
> - Tests: `app/static/tests/unit-tests.html` — BUG-003 suite (7 tests: smoothingFilter exists/type/frequency, bandGain.value=0, mixGainNode stored, disableVocoder cleanup).

---

### BUG-004 — `this.playbackRate` undefined; position wrong on reverse→normal switch

**File:** `modules/playback-controller.js` line 60 vs. line 27

**Root cause:**
The constructor at line 27 stores the playback rate as `this.currentPlaybackRate = 1.0`. At line 60, the position calculation references `this.playbackRate` (note: no `current` prefix), which is `undefined`. The expression `undefined || 1.0` silently falls back to `1.0`, so the position offset is always calculated as if playback is at 1× speed regardless of the actual rate.

**Reproduction steps:**
1. Set playback rate to 1.5×
2. Enable reverse playback mode
3. Let it play for several seconds
4. Toggle back to forward mode
5. Observe: the playhead jumps to an incorrect position (calculated at 1× instead of 1.5×)

**Expected behavior:** Position is recalculated correctly using the actual playback rate.

**Fix:**
Line 60: change `this.playbackRate` → `this.currentPlaybackRate`.

```js
// Before (buggy):
const rate = this.playbackRate || 1.0;

// After (fixed):
const rate = this.currentPlaybackRate || 1.0;
```

> **✅ FIXED 2026-03-07** — `modules/playback-controller.js` line 60
> - One-character rename: `this.playbackRate` → `this.currentPlaybackRate`.
> - Tests: `app/static/tests/unit-tests.html` — BUG-004 suite (5 tests: initialization, setPlaybackRate, `getCurrentTime()` at rate=2.0 produces 3.0s not 4.0s, rate=1.5 formula check).

---

## 🟠 HIGH — Incorrect Behavior / Memory Issues

---

### BUG-005 — Sampler ADSR schedules release in the past for short samples

**File:** `modules/sampler.js` line 48

**Root cause:**
```js
releaseStartTime = now + samplerAudioBuffer.duration - adsrParams.release;
```
When `adsrParams.release > samplerAudioBuffer.duration`, `releaseStartTime < now`. Web Audio API treats past-scheduled `setTargetAtTime` / `linearRampToValueAtTime` events as having occurred at the scheduling moment, which effectively skips the attack and decay stages — the note sounds as if it starts muted and immediately begins releasing.

**Reproduction steps:**
1. Load a short (0.2s) sample into the sampler
2. Set release to 0.5s
3. Trigger the note
4. Observe: no audible attack or sustain phase; note either sounds inverted or behaves unexpectedly

**Fix:**
```js
const minReleaseStart = now + adsrParams.attack + adsrParams.decay;
const naturalRelease = now + samplerAudioBuffer.duration - adsrParams.release;
releaseStartTime = Math.max(minReleaseStart, naturalRelease);
```

> **✅ FIXED 2026-03-07** — `modules/sampler.js` line 48
> Added `minReleaseStart = now + attack + decay` and `releaseStartTime = Math.max(minReleaseStart, naturalRelease)`. Release can never be scheduled before the attack+decay phases complete, regardless of sample length.

---

### BUG-006 — Autotune scale lookup always returns original frequency

**File:** `modules/autotune.js` line 187; `modules/constants.js` line 38

*Note: This is also covered under BUG-001 (secondary). It is listed separately because it affects `correctPitchToTarget()` independently, even if the pitch-shifter hardware were replaced.*

**Root cause:**
`musicScales[scaleKey]` where `scaleKey` is a MIDI note name like `'C'`. The `musicScales` object is keyed by scale type strings. Every call hits the `!scale` guard and returns the unmodified input frequency. No scale-aware pitch snapping ever occurs.

**Fix:** Use `musicScales[scaleType]` for the scale array, and derive the root-note transposition from `noteFrequencies[keyNote]`.

> **✅ FIXED 2026-03-07** — subsumed by BUG-001 fixes 2 and 7. `findNearestNoteInScale()` in `autotune.js` and `correctPitch()` in `app.js` both now use `musicScales[scaleType]` with correct MIDI-based modulo arithmetic.

---

### BUG-007 — Chromatic scale has 15 elements with a gap (missing semitone 13)

**File:** `modules/constants.js` line 5

**Root cause:**
```js
chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15]
```
This array has 15 elements and skips index 13. A chromatic octave should be exactly 12 semitones (indices 0–11). Elements at positions 12, 14, and 15 produce unintended pitches:
- Index 12 → `2^(12/12) = 2.0` (one octave above root — might be intentional)
- Index 14 → `2^(14/12) ≈ 2.52` (no standard chromatic note)
- Index 15 → `2^(15/12) ≈ 2.83` (no standard chromatic note)

**Reproduction steps:**
1. Open sampler in chromatic mode
2. Trigger keys mapped to indices 12, 14, 15 (typically the `,` `.` `/` keys)
3. Observe: pitches do not match expected chromatic scale notes

**Fix:**
```js
chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
```

> **✅ FIXED 2026-03-07** — `modules/constants.js` line 5
> Corrected to 13 elements `[0..12]` (12 semitones + octave root). The spurious indices 14 and 15 (non-standard pitches) are removed.

---

### BUG-008 — AudioBufferManager timestretch cache grows unbounded

**File:** `modules/audio-buffer-manager.js` lines 153–156, 124

**Root cause:**
Each unique combination of `(startTime, endTime, stretchRatio, pitchShift, reverse)` creates a new entry in `bufferData.timestretched` and `bufferData.loopBuffers` Maps. There is no maximum size limit and no LRU eviction policy. A stereo 4-minute track at 44.1kHz consumes approximately 40MB per cached buffer. Cache keys use `toFixed(3)` precision.

**Reproduction steps:**
1. Load a 4-minute track
2. Enable timestretch
3. Drag loop markers to 20 different positions in sequence
4. Check Chrome DevTools → Memory tab → Heap snapshots confirm growing allocation without release

**Impact:** Memory grows without bound per session; can exhaust available heap on long sessions or on systems with less than 4GB RAM.

**Fix:**
- Add a `MAX_CACHE_SIZE = 5` constant
- Implement LRU eviction: track insertion order; when cache exceeds max, delete the oldest entry
- Call `clearLoopCache()` whenever loop points change

---

### BUG-009 — Vocoder carrier source `'mix'` leaks a GainNode

**File:** `modules/vocoder.js` lines 185–190

**Root cause:**
`getVocoderCarrierSource('mix', ...)` creates a `mixGain` GainNode and connects sources to it. This node is returned to the caller but is never stored in the vocoder's internal state object. `disableVocoder()` therefore cannot reference it and never calls `.disconnect()`. Each enable/disable cycle creates and orphans one GainNode.

**Reproduction steps:**
1. Select "mix" as the carrier source
2. Enable the vocoder
3. Disable the vocoder
4. Repeat steps 2–3 ten times
5. Open Chrome DevTools → Web Audio Inspector → count GainNodes; observe growing chain of connected, unreferenced nodes

**Fix:**
Store `mixGain` in the vocoder state: `vocoderState.mixGainNode = mixGain`. In `disableVocoder()`, check for `vocoderState.mixGainNode`, call `.disconnect()`, and set to `null`.

---

### BUG-010 — Loop-controls RAF callback ID not stored; cannot force-cancel

**File:** `modules/loop-controls.js` line 31

**Root cause:**
```js
requestAnimationFrame(() => updateReverseProgress(...))
```
The RAF return value (the frame ID) is not stored. The loop does check `playbackController.mode !== 'reverse'` on each frame and self-terminates, but because the ID is lost, there is no way to call `cancelAnimationFrame(id)` to immediately halt it. On a mode switch, one extra frame always executes.

**Impact:** Low under normal operation. Could cause a stale frame rendering or a single incorrect position update on rapid mode switching.

**Fix:**
```js
let rafId = null;

function startReverseLoop() {
    rafId = requestAnimationFrame(() => updateReverseProgress(...));
}

function stopReverseLoop() {
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}
```

---

### BUG-011 — Microphone waveform: `enabled` primitive closure prevents proper stop

**File:** `modules/microphone.js` lines 88–139

**Root cause:**
`drawMicWaveform(canvas, micAnalyser, enabled)` receives `enabled` as a boolean primitive. JavaScript passes primitives by value, so the closure inside `draw()` captures the original value. Even if the calling scope sets its variable to `false`, the closure's `enabled` remains `true`. The loop can only be stopped by retaining and calling `cancelAnimationFrame` with the RAF ID returned by the outermost `draw()` call at line 138.

**Impact:** If any caller discards the return value (which is easy to do accidentally), the waveform draw loop runs indefinitely — consuming CPU time and holding a reference to the canvas and analyser even after the microphone is disabled.

**Fix (option A — reference object):**
```js
function drawMicWaveform(canvas, micAnalyser, stateRef) {
    // stateRef = { enabled: true }
    // closure reads stateRef.enabled; caller sets stateRef.enabled = false to stop
}
```
**Fix (option B — return cancel function):**
```js
const { cancel } = drawMicWaveform(canvas, micAnalyser);
// later:
cancel();
```

---

### BUG-021 — Mic recording captures raw stream; auto-tune not included in recording

**File:** `modules/microphone.js` line 187; `app.js` `startMicRecordingHandler()`

**Root cause:**
`startMicRecording()` passes `micState.micStream` (the raw `getUserMedia` `MediaStream`) directly to `MediaRecorder`. This stream is the **pre-Web Audio** microphone signal — it branches off before the Web Audio graph even sees it. Auto-tune, vocoder, EQ, and all other Web Audio processing exist inside the graph and are never present on the raw stream. A user who enables auto-tune on the mic, records, then loads to a track hears the unprocessed vocal on playback.

Additionally, when the mic is subsequently disabled (e.g., after loading the recording to a track), `disableAutotune()` is called automatically because the mic source is gone. By the time Track 1 plays, auto-tune is already off.

**Reproduction steps:**
1. Enable microphone
2. Enable auto-tune (source: mic, key: G, strength: 100%)
3. Record a 15-second vocal
4. Load recording to Track 1
5. Play Track 1 — output is unprocessed; no pitch correction audible

**Expected behavior:** When auto-tune is active on the mic source during recording, the recording should capture the pitch-corrected signal.

**Fix:**
- Add optional `overrideStream` parameter to `startMicRecording()` (defaults to `micState.micStream`)
- In `startMicRecordingHandler()`, when auto-tune is active on mic: create a `MediaStreamDestination`, connect `autotuneState.dryGain` and `autotuneState.wetGain` to it, pass its stream as `overrideStream` — captures the exact auto-tuned output with no other-track bleed
- Disconnect `autotuneRecordDest` in `stopMicRecordingHandler()` cleanup

> **✅ FIXED 2026-03-07** — `modules/microphone.js`, `app.js`
> - `startMicRecording(micState, overrideStream = null)`: `MediaRecorder` now uses `overrideStream || micState.micStream`
> - `startMicRecordingHandler()`: when `autotuneEnabled && autotuneSource === 'mic'`, creates a dedicated `MediaStreamDestination` tapped from `autotuneState.dryGain + autotuneState.wetGain` and passes it as `overrideStream`
> - `stopMicRecordingHandler()`: disconnects `dryGain` and `wetGain` from the recording destination on stop
> - Auto-tune is now baked into the recording; playback of the loaded track sounds pitch-corrected without requiring auto-tune to be re-enabled on the track

---

## 🟡 MEDIUM — Incorrect Output / Poor UX

---

### BUG-012 — Sampler exponential ramp to 0.01 creates audible click on note end

**File:** `modules/sampler.js` line 60

**Root cause:**
```js
gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
```
`0.01` is −40 dBFS, which is not perceptual silence. When the `AudioBufferSourceNode` stops abruptly after the ramp completes, the 40 dBFS discontinuity produces an audible click or pop, especially noticeable during rapid repeated triggering of the same key.

**Reproduction steps:**
1. Load any sample
2. Trigger the same key rapidly 5–10 times
3. Observe: audible click/pop at the end of each note

**Fix:**
```js
gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime); // −80 dBFS ≈ perceptual silence
```

> **✅ FIXED 2026-03-07** — `modules/sampler.js` line 60
> Changed ramp target `0.01` → `0.0001` (−40 dBFS → −80 dBFS). The source node now stops at perceptual silence with no audible discontinuity.

---

### BUG-013 — Cache key collision possible for very close loop points

**File:** `modules/audio-buffer-manager.js` line 84

**Root cause:**
The loop buffer cache key is built with `toFixed(3)`, giving 1ms resolution. Two loop start positions within 0.5ms of each other (e.g., `1.5001` and `1.5004`) both stringify to `"1.500"`, causing the second request to return the first cached buffer — an incorrect buffer for the second loop position.

**Reproduction steps:**
1. Set loop start to 1.500s → enable reverse → a buffer is cached
2. Set loop start to 1.5003s → observe: the same buffer from step 1 is returned; the loop plays from 1.500s instead of 1.5003s

**Fix:**
```js
// Before:
const key = `${startTime.toFixed(3)}_${endTime.toFixed(3)}_...`;

// After:
const key = `${startTime.toFixed(4)}_${endTime.toFixed(4)}_...`;
```

> **✅ FIXED 2026-03-07** — `modules/audio-buffer-manager.js` lines 84, 150
> All `toFixed(3)` calls in cache key construction changed to `toFixed(4)` (0.1ms → 0.05ms resolution). Applies to both `loopBuffers` and `timestretched` cache keys.

---

### BUG-014 — BPM detection unreliable for short tracks or half-time grooves

**File:** `modules/audio-utils.js` lines 91–177

**Root cause (static analysis):**
The autocorrelation peak detector uses a fixed threshold without half/double-tempo disambiguation. For tracks with strong half-time characteristics (heavy kick on beat 3 only), the algorithm may lock to the half-time period and report 64 BPM for a 128 BPM track, or vice versa. Short tracks (< 30s) provide insufficient autocorrelation window to distinguish closely spaced peaks.

**Reproduction steps:**
1. Load a track with a clear tempo of 128 BPM
2. Observe the BPM display — may show 64 or 256 BPM
3. Repeat with a half-time hip-hop groove (85 BPM) — may show 42 or 170 BPM

**Fix suggestions:**
- Add half/double-tempo filter: if detected BPM < 70, double it; if > 180, halve it (configurable range)
- Combine autocorrelation with spectral flux onset detection for higher accuracy
- Use a minimum analysis window of 30s (or full track if shorter)

---

### BUG-015 — Flask `SECRET_KEY` is placeholder string

**File:** `config.py`

**Root cause:**
```python
SECRET_KEY = 'your_secret_key_here'
```
A static, publicly known secret key defeats Flask's HMAC-based session signing. If session cookies are ever used (e.g., for user preferences, CSRF tokens), any user who knows the key can forge session data.

**Impact:** Low in the current stateless configuration, but becomes a serious vulnerability if session-based authentication or CSRF protection is added without fixing this.

**Fix:**
```python
import os
import secrets

SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
```

> **✅ FIXED 2026-03-07** — `config.py` line 2
> `secrets.token_hex(32)` generates a cryptographically random 256-bit key at startup when `SECRET_KEY` env var is not set. Set `SECRET_KEY` in the environment for persistent sessions across restarts.

---

## ⚪ LOW / POLISH

---

### BUG-016 — Sampler: no voice count limit for polyphonic playing

**File:** `modules/sampler.js`

**Root cause:**
Each unique key creates a new `AudioBufferSourceNode` + `GainNode` pair. The `activeKeys` Set prevents re-triggering the *same* key while held, but multiple different keys held simultaneously each allocate independent nodes. For long samples with many simultaneous keys, node count accumulates within a session.

**Fix:**
Track the active `AudioBufferSourceNode` per key. When a key is re-triggered, stop the previous source before starting the new one (monophonic per key). Optionally add a global max voice count (e.g., 16) with oldest-voice stealing.

---

### BUG-017 — `musicScales` and `scales` duplicate data with incompatible structures

**File:** `modules/constants.js` lines 2–7, 38–43

**Root cause:**
Two separate scale definitions exist:
- `scales` (used by sampler): 8-element arrays with octave-spanning semitone values
- `musicScales` (used by autotune): 7/12-element arrays

Both define `major`, `minor`, and `chromatic` but with different lengths and semantics, leading to confusion about which to use where and making BUG-001/006 harder to fix correctly.

**Fix:**
Consolidate into a single `scales` object. Define each scale once as `[0..11]` semitone offsets from the root. Consumers can take the first N elements as needed.

---

### BUG-018 — No user-visible error shown when file format is unsupported

**File:** `app.js` (audio load handling)

**Root cause (static analysis):**
`AudioContext.decodeAudioData()` throws on FLAC in Firefox and some AAC files in Safari. If the rejection is caught silently or not caught at all, the user sees nothing happen after selecting a file — no error message, no spinner dismissal, no guidance.

**Reproduction steps:**
1. Open in Firefox
2. Attempt to load a `.flac` file
3. Observe: no feedback; track appears unloaded

**Fix:**
In the `decodeAudioData` catch handler, display a visible error toast:
```js
.catch(err => {
    showUserError(`Could not decode audio file: ${err.message}. Supported formats: MP3, WAV, OGG, AAC.`);
});
```

---

### BUG-019 — Zero ARIA labels on all interactive controls

**File:** `app/templates/index.html`

**Root cause:**
All 286 interactive control IDs (sliders, buttons, toggles, knobs) lack `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `role` attributes. The four canvas elements lack `role="img"` and `aria-label`. The application is completely inaccessible to screen readers and assistive technology.

**Fix:**
Add ARIA attributes to all controls. Priority order:
1. Main playback controls (play, stop, cue, loop toggle)
2. Volume and crossfader sliders (`role="slider"`, `aria-valuemin/max/now`)
3. Effect toggles (`aria-pressed`)
4. Canvas visualizations (`role="img"`, `aria-label="[description]"`)

---

### BUG-020 — No responsive CSS breakpoints below 1200px

**File:** `app/static/css/style.css`

**Root cause:**
The 3-column DJ grid has a breakpoint at 1400px that collapses the layout, but no further breakpoints exist for 1200px, 768px, or 480px viewports. On tablets and phones, controls overflow the viewport and become unusable.

**Fix:**
Add responsive breakpoints:
```css
@media (max-width: 1200px) { /* 2-column layout */ }
@media (max-width: 768px)  { /* 1-column stacked layout */ }
@media (max-width: 480px)  { /* mobile: larger tap targets, hide visualizations */ }
```

---

## Verification Notes

- All bugs include exact file paths and line numbers confirmed against source files
- BUG-004 and BUG-007 are single-line fixes with zero risk of regression
- BUG-001 required 7 distinct fixes across two files; the delay-node replacement alone was insufficient — the interception point, pitch detection algorithm, and scale snap function all independently prevented the feature from working
- BUG-002 requires non-trivial reimplementation; test with A/B comparison against known-tempo input
- BUG-008 fix (LRU cache) must be benchmarked against memory-limited devices (≤ 4GB RAM)
- BUG-015 requires environment variable support in deployment; document in README
- BUG-021: the `MediaRecorder(micState.micStream)` pattern is correct for raw recording; the fix only changes behaviour when auto-tune is explicitly active on the mic source
- The recording decode path (Blob → FileReader → `decodeAudioData`) is architecturally correct and is **not** a bug
- The RAF loop exit check in `loop-controls.js` **does** exist (`mode !== 'reverse'`); only the missing stored ID is a bug (BUG-010)
- `this.reverseStartOffset = null` in `playback-controller.js` line 90 is correctly scoped with `this.`
