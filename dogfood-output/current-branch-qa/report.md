# Browser Jockey Current-Branch QA Report

**Target:** `http://127.0.0.1:5017/`  
**Branch:** `release/sequencer-save-playback-responsive`  
**Commit:** `66e01af`  
**Date:** 2026-06-09T13:36:04-04:00  
**Tester:** Hermes Agent automated + visual exploratory QA  
**QA artifacts:** `dogfood-output/current-branch-qa/`  

## Executive Summary

Tested the current branch by launching the Flask app locally, generating valid WAV fixtures, loading both DJ tracks, exercising visible mixer controls, permission-dependent entry points, pattern/lo-fi controls, master output controls, sequencer upload/playback/recording/save/load controls, and desktop/tablet/mobile layouts.

**Issues found:** 3

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 1 |
| Medium | 0 |
| Low | 2 |
| **Total** | **3** |

**Overall assessment:** Core DJ track loading and most visible controls respond, but the current branch has a serious Sequencer recording-state bug plus polish/debug-output issues that should be cleaned before release.

---

## Issue #1: Empty Sequencer recording starts anyway and displays an impossible elapsed time

| Field | Value |
|---|---|
| **Severity** | High |
| **Category** | Functional / UX |
| **URL** | `http://127.0.0.1:5017/` |
| **Evidence screenshot** | `dogfood-output/current-branch-qa/screenshots/10-empty-sequencer-recording.png` |
| **Related console evidence** | `dogfood-output/current-branch-qa/empty-recording-output.json` |

### Description

Clicking **Sequencer → Record** in a fresh session with no clips in the timeline starts the recording UI anyway. The app logs that the sequencer is empty, but the visible recording section remains active and the timer shows a huge impossible value: `29683775:49` in the targeted repro and `29683773:06` in the mobile responsive pass.

This is a core state bug: users can enter a recording state for an empty timeline, and the timer appears to be calculated from an uninitialized/epoch-like start time rather than starting at `0:00`.

### Steps to reproduce

1. Start the app locally and open `http://127.0.0.1:5017/`.
2. Switch to the **Sequencer** tab.
3. Do not add any clips to the timeline.
4. Click **Record**.
5. Wait 2–3 seconds and inspect the Sequencer Recording panel.

### Expected behavior

One of the following should happen:

- Recording is blocked with clear in-app feedback such as “Add a clip before recording”; or
- Recording starts only when there are active timeline clips, and the timer begins at `0:00`.

### Actual behavior

- The recording section appears despite `Total clips: 0` / `No clips to record - sequencer is empty` in the console.
- The timer displays an impossible elapsed value (`29683775:49`).
- The recording state visually persists and can obscure/confuse subsequent sequencer actions.

### Console context

```text
🔴 startRecording() called - NEW VERSION with 300ms delay
🔴 Sequencer tracks: 1
🔴 Total clips: 0
🎵 Auto-starting sequencer playback for recording
▶️ Playing sequencer: Bars 1 to 9 (16.00s)
🔴 Checking for clips to record...
🔴 Has active sources: false
🔴 Tracks with clips: 0
⚠️ No clips to record - sequencer is empty
🎙️ Recording will auto-stop after 16.0 seconds (8 bars)
🎙️ Started recording sequencer output
```

### Screenshot

MEDIA:/home/lior/projects/browser_jockey/dogfood-output/current-branch-qa/screenshots/10-empty-sequencer-recording.png

---

## Issue #2: Footer credit text overlays active controls instead of staying at the bottom

| Field | Value |
|---|---|
| **Severity** | Low |
| **Category** | Visual |
| **URL** | `http://127.0.0.1:5017/` |
| **Evidence screenshots** | `02-after-two-track-upload.png`, `06-sequencer-empty-state.png` |

### Description

The footer text `Made by Lior Shahverdi and Claude Sonnet 4.5 in VS Code.` is not confined to the bottom of the page. It appears over active UI sections while scrolling through the app:

- On the DJ Mixer view, it overlays the Track 1 hot-cue / beat-grid area.
- On the Sequencer view, it overlays the Master Effects area.

This makes the page feel unfinished and can interfere with readability of dense controls.

### Steps to reproduce

1. Open the app.
2. Load tracks into Track 1 and Track 2, or switch to the Sequencer tab.
3. Inspect the middle of the page around Track 1 controls / Master Effects.
4. Observe the credit text floating across active controls.

### Expected behavior

Footer/credits text should render after the app content or in a dedicated non-overlapping footer region.

### Actual behavior

The credit text appears inside the interactive app area. Automated layout capture recorded the footer at viewport coordinates approximately:

```json
{"x":886.6875,"y":878,"w":378.3125,"h":12,"right":1265,"bottom":890,"cls":"credits"}
```

### Screenshots

MEDIA:/home/lior/projects/browser_jockey/dogfood-output/current-branch-qa/screenshots/02-after-two-track-upload.png

MEDIA:/home/lior/projects/browser_jockey/dogfood-output/current-branch-qa/screenshots/06-sequencer-empty-state.png

---

## Issue #3: Production UI emits excessive debug console output during normal use

| Field | Value |
|---|---|
| **Severity** | Low |
| **Category** | Console / Developer Experience |
| **URL** | `http://127.0.0.1:5017/` |
| **Evidence files** | `raw-output.txt`, `empty-recording-output.json` |

### Description

Routine app usage produces a large amount of debug logging in the browser console. Initial page load alone produced 19 console messages. Loading two small valid WAV files and smoke-testing normal controls produced hundreds of additional messages, including implementation details, object-store creation logs, waveform/motion detection loops, audio routing internals, and repeated “wave check” diagnostics.

This is not a user-blocking bug, but it makes real console failures much harder to spot during QA and creates a noisy production debugging surface.

### Steps to reproduce

1. Open the app with DevTools console visible.
2. Load valid WAV files into Track 1 and Track 2.
3. Click standard controls: play/pause/stop, beat grid, sidechain, pattern deck, lo-fi station, sequencer controls.
4. Observe console output.

### Expected behavior

Production builds should keep console output quiet except for actionable warnings/errors. Optional verbose diagnostics should be behind a debug flag.

### Actual behavior

Examples observed:

```text
DOM Elements loaded: {audioFile1: true, playBtn1: true, audioElement1: true}
🔍 Sync button elements check: {syncTrack1to2Btn: Found, ...}
Theremin elements initialization: {enableBtn: true, ...}
✅ Sequencer audio routing initialized
Track 1 file upload triggered
Decoded audio: 2 seconds
✅ Pitch shifter created for track 1
🎬 Play button clicked for Track 1
🔍 Wave check: changes=5, range=98%, movement=2.10 | Need: changes≥2, range≥15%, movement≥0.3
```

### Screenshot

MEDIA:/home/lior/projects/browser_jockey/dogfood-output/current-branch-qa/screenshots/01-initial-mixer.png

---

## Testing Coverage

### Environment and setup

- Local Flask server: `PORT=5017 python run.py`
- Browser automation: Playwright Chromium
- Visual evidence: full-page screenshots saved under `dogfood-output/current-branch-qa/screenshots/`
- Generated valid audio fixtures:
  - `dogfood-output/current-branch-qa/qa-tone-a.wav` — 2s 440Hz WAV
  - `dogfood-output/current-branch-qa/qa-tone-b.wav` — 2s 660Hz WAV

### Components / flows exercised

- App boot and initial console state
- Tab navigation: DJ Mixer ↔ Sequencer
- Track 1 upload, waveform render, metadata/duration display, BPM/key display
- Track 2 upload, waveform render, metadata/duration display, BPM/key display
- Track transport controls: play, pause, stop
- Loop/reverse/slip/hot-cue/beat-grid entry points
- Track zoom buttons
- Track mixer controls: volume, tempo, stretch, low/mid/high EQ, pitch, pan
- Track effects: filter type/slider, reverb, delay, delay time
- Export controls enabled after upload
- Dual-track controls: play both, sync, auto-sync
- Crossfader mode/value updates
- Sidechain toggle/direction and sliders
- Microphone/tab-capture/camera entry points with fake media permissions
- Keyboard sampler source/scale/root/volume controls
- Camera theremin entry point
- Strudel Pattern Deck play/stop/sync/preset controls
- Lo-fi Station play/stop/regenerate/sync/mute/volume controls
- Master routing toggles
- Master volume/pan/effect-chain/effects controls
- Master recording entry point
- Sequencer controls: play, pause, stop, loop, record, add/remove bar, clear cache, save/load, export/import, effects panel, fullscreen
- Sequencer file upload and available-clips list
- Responsive captures at desktop, tablet, and mobile widths

### Areas not fully validated

- Real audible audio output quality was not judged by ear.
- Browser tab capture, microphone, and camera were tested with fake/headless media permissions, not with real physical devices.
- Drag-and-drop clip placement on the sequencer timeline was not fully completed in this pass; the file upload/library path was exercised.
- Downloaded export file contents were not decoded and audited in this pass.

## Automation artifacts

- Main QA runner: `scripts/qa_current_branch.py`
- Empty recording repro: `scripts/qa_empty_recording.py`
- Raw main output: `dogfood-output/current-branch-qa/raw-output.txt`
- Empty recording raw output: `dogfood-output/current-branch-qa/empty-recording-output.json`
