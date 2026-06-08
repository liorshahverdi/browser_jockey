# Release QA Report — Browser Jockey `release/sequencer-save-playback-responsive`

## Executive summary

**Date:** 2026-06-08  
**Branch:** `release/sequencer-save-playback-responsive`  
**Latest commit at start of pass:** `7945788 Polish sequencer project loading UI`  
**Environment:** local Docker Flask app at `http://127.0.0.1:5001/`, tested with Hermes browser tools plus regression scripts.

### Result

No release-blocking functional regressions were found in the tested scope.

The release branch passed the critical bug/unit suite, responsive Sequencer checks, and an exploratory in-browser pass covering two loaded decks, DJ mixer controls, cross-feature audio-routing combinations, Sequencer save/load, the new in-app project picker, and responsive Sequencer layouts.

### Issue summary

- **Critical:** 0
- **High:** 0
- **Medium:** 0
- **Low:** 0 confirmed app bugs
- **Operational notes / limitations:** 2

The only notable operational observations were:

1. Docker health occasionally reported `unhealthy` after long/headless browser automation even when the app initially responded; restarting the `web` service restored HTTP responses.
2. Browser-level screenshots from the live exploratory state were captured in-session via Hermes `browser_vision`; the durable local screenshot set currently focuses on Sequencer save/load and responsive verification.

## Audio graph / module interaction notes

I reviewed the audio graph code before QA so the feature combinations were tested against how the modules actually interact.

### Main orchestration

- `app/static/js/app.js` is the central orchestrator.
- It imports and wires the major feature modules:
  - constants / keyboard maps
  - loop controls
  - `AudioBufferManager`
  - `PlaybackController`
  - waveform, BPM, and key detection utilities
  - `audio-effects.js`
  - `EffectChain`
  - recording / microphone / vocoder / autotune
  - sampler
  - theremin
  - lo-fi station
  - sidechain compression
  - Sequencer
- The app creates/owns the live Web Audio graph and connects UI controls to the relevant node parameters.

### Deck playback path

For each main deck:

1. User loads audio through the deck file input.
2. The app decodes/stores the audio buffer and updates waveform, BPM, key, duration, transport buttons, and export controls.
3. `PlaybackController` manages playback mode:
   - normal mode: media element / forward buffer path
   - reverse mode: `AudioBufferSourceNode` path
   - position calculation uses `currentPlaybackRate`, covered by BUG-004 tests.
4. Deck controls update node state and UI labels:
   - volume
   - tempo
   - time-stretch
   - EQ low/mid/high
   - pitch
   - pan
   - loop / reverse loop / hot cue / beat-grid state
5. Deck output feeds the effect chain, final deck mix, crossfader, and master bus.

### Effects path

- `audio-effects.js` creates reusable Web Audio effect nodes:
  - filter
  - reverb
  - delay
  - ADSR envelope
- `effect-chain.js` owns ordering/toggling UI for track and master effects.
- `connectEffectsInOrder()` reconnects available nodes based on the user-selected effect order and enabled flags.
- The exploratory pass adjusted track and master effect controls while audio buffers were loaded to verify controls remained live and console-clean.

### Crossfader / sidechain / routing

- Crossfader mode can route Track 1 ↔ Track 2, Track ↔ Mic combinations.
- Sidechain compression is implemented by `SidechainCompressor` in `sidechain.js`:
  - taps Track 1 through an `AnalyserNode`
  - inserts a ducking `GainNode` in Track 2's final path
  - computes RMS and ramps gain reduction with attack/release smoothing
- Master routing checkboxes gate Track 1, Track 2, mic, sampler, theremin, sequencer, Strudel, and lo-fi station into the master output path.

### Sequencer path

- `sequencer.js` is a standalone `Sequencer` class instantiated with the shared `AudioContext`.
- It stores:
  - available clips in `this.clips`
  - timeline tracks in `this.sequencerTracks`
  - BPM, bar count, loop state, zoom, render cache state, and routing gain
  - persistence through `IndexedDBManager`
- It can ingest clips from loaded decks and local uploaded Sequencer clips.
- Sequencer project persistence uses IndexedDB and now restores:
  - tracks
  - track names
  - mute / solo / volume state
  - placed clips
  - clip source references
  - bar/pixel placement
  - trim values
  - visible timeline DOM state
- The new project picker is an in-app dialog, replacing the previous browser `prompt()` flow.

### Other sound generators

- `sampler.js` plays pitched voices from selected deck/clip buffers, bounded by `MAX_VOICES = 16` for voice stealing.
- `theremin.js` can synthesize or modulate external deck sources using camera/motion input.
- `lofi-station.js` schedules generated drums/chords/melody/texture patterns through Web Audio.
- Strudel integration is presented as a pattern deck and participates in master routing.

## Scope tested

### Automated / regression checks

- Critical bug unit/regression page: `app/static/tests/unit-tests.html`
- Sequencer responsive layout script: `scripts/verify_sequencer_responsive_layout.py`
- Existing BUG-022 visual demo screenshots under `screenshots/`

### Manual / exploratory browser checks

Tested in the live app at `http://127.0.0.1:5001/`:

- App startup and initial console state
- Synthetic WAV upload into Track 1 and Track 2
- Deck enablement after upload
- Transport controls becoming enabled
- Export controls becoming enabled
- Dual-track mixer controls becoming enabled
- Sidechain becoming available after both decks load
- Sampler source list population after loaded decks
- Track controls:
  - volume
  - tempo
  - stretch
  - EQ low/mid/high
  - pitch
  - pan
  - filter
  - reverb
  - delay
  - delay time
- Mixer / master controls:
  - play-both availability
  - BPM sync controls availability
  - crossfader mode and position
  - master volume
  - master pan
  - master routing toggles
- Sequencer controls:
  - tab navigation
  - loaded deck clips visible in Available Clips
  - add bar
  - add track
  - BPM edit
  - save project
  - load project
  - in-app project picker dialog
  - load restored project
- Responsive Sequencer layouts:
  - desktop 1280px
  - tablet 768px
  - mobile 390px

## Evidence

### Unit/regression tests

Observed in the browser test page:

```text
Results: 40 passed / 0 failed / 1 skipped
✅ All critical bugs verified fixed.
```

Console after unit test page load:

```text
0 console messages / 0 JavaScript errors
```

### Responsive layout script

Command:

```bash
python3 scripts/verify_sequencer_responsive_layout.py
```

Output:

```text
PASS desktop 1280px columns=250px 926px clips=3
PASS tablet 768px columns=681px clips=3
PASS mobile 390px columns=318px clips=3
```

### Exploratory upload / enablement check

In-browser synthetic WAV upload result:

```json
{
  "file1": "qa-tone-a440.wav",
  "file2": "qa-tone-e660.wav",
  "play1Disabled": false,
  "play2Disabled": false,
  "dualDisabled": false,
  "sidechainDisabled": false,
  "samplerOptions": 7,
  "alerts": []
}
```

Interpretation:

- Both decks accepted generated WAV fixtures.
- Individual play controls became enabled.
- Dual-track play became enabled.
- Sidechain became available after both decks loaded.
- Sampler had 7 source options after deck/clip population.
- No upload alerts appeared.

### Exploratory mixer/control-combination check

In-browser control-combination sweep result:

```json
{
  "vol1": "72%",
  "vol2": "41%",
  "tempo1": "1.25x",
  "tempo2": "0.80x",
  "stretch1": "1.50x",
  "cross": "97% / 23%",
  "masterVol": "83%",
  "sidechain": "OFF",
  "alerts": [
    "⚠️ Please set loop points (A-B) first by clicking on the waveform!"
  ]
}
```

Interpretation:

- Track sliders updated visible UI values correctly.
- Master volume updated correctly.
- Crossfader used a non-linear/equal-power style display where percentages do not necessarily sum to 100%; this was noted but not classified as a bug.
- The loop warning was expected because reverse-loop was triggered before A/B loop points were set.
- Console remained clean after this sweep.

### Sequencer save/load check

In-browser Sequencer save/load result:

```json
{
  "activeTab": "🎼 Sequencer",
  "bpm": "132",
  "clips": 3,
  "tracks": 2,
  "bars": 9,
  "modal": false,
  "alerts": [
    "⚠️ Please set loop points (A-B) first by clicking on the waveform!",
    "✅ Project \"autosave\" saved!",
    "✅ Project \"autosave\" loaded!"
  ]
}
```

Interpretation:

- Sequencer tab opened successfully.
- Loaded deck clips appeared as Sequencer clips.
- Project BPM changed to 132.
- Added bar persisted visually: 9 bars.
- Two Sequencer tracks were visible.
- Save and load success alerts appeared.
- The in-app load picker opened before load and disappeared after load.
- Console remained clean after save/load.

### Screenshot evidence

Stored screenshot evidence in the repository:

```text
screenshots/sequencer-release-project-picker-modal.png
screenshots/sequencer-release-save-load-ui-state.png
screenshots/sequencer-responsive-desktop.png
screenshots/sequencer-responsive-tablet.png
screenshots/sequencer-responsive-mobile.png
screenshots/bug022-app-visual-demo.png
screenshots/bug022-app-visual-demo-timeline.png
```

Key evidence notes:

- `sequencer-release-project-picker-modal.png`
  - Shows the in-app **Load Sequencer Project** dialog with saved project metadata and Load/Cancel buttons.
  - Confirms the release no longer relies on a browser `prompt()` for project selection.
- `sequencer-release-save-load-ui-state.png`
  - Shows the restored Sequencer UI with restored tracks, placed clips, and visible mute/solo/volume state.
- `sequencer-responsive-desktop.png`
  - Shows desktop Sequencer layout with available clips and restored timeline visible side-by-side.
- `sequencer-responsive-tablet.png`
  - Shows tablet layout preserving the two-column Sequencer structure.
- `sequencer-responsive-mobile.png`
  - Shows mobile layout stacked vertically, with controls wrapping and the timeline remaining reachable horizontally.

## Detailed findings

### Finding 1 — Critical regression suite passes

**Severity:** Pass  
**Category:** Regression  
**Evidence:** Unit test page and console check

The critical bug suite passed all active tests:

```text
40 passed / 0 failed / 1 skipped
```

Covered regressions include:

- BUG-001 autotune scale lookup
- BUG-001b pitch correction through Tone PitchShift
- BUG-001c Tone.js v15 connection skip when Tone not loaded in the test harness
- BUG-003 vocoder smoothing/filter gain initialization
- BUG-004 PlaybackController reverse/position calculation
- BUG-002 TimeStretch AudioWorklet behavior
- BUG-002b offline timestretch pitch correction
- BUG-022 Sequencer project save/load track placement restoration
- in-app project picker instead of prompt
- restored mute/solo/volume track control state

### Finding 2 — Sequencer project picker works as intended

**Severity:** Pass  
**Category:** Functional / UX  
**Evidence:** `screenshots/sequencer-release-project-picker-modal.png`

The Load flow displays an in-app modal with:

- title: `Load Sequencer Project`
- explanatory text: `Choose a project saved in this browser.`
- saved project name
- saved timestamp
- `Load` button
- `Cancel` button

No native prompt was observed in this flow.

### Finding 3 — Sequencer save/load restoration works in the visible UI

**Severity:** Pass  
**Category:** Functional / Persistence  
**Evidence:** `screenshots/sequencer-release-save-load-ui-state.png`

The saved project can be loaded back into the UI with:

- restored tracks
- restored clip placements
- visible clip labels
- visible track volume controls
- mute/solo/delete controls
- restored timeline structure

The exploratory browser pass also confirmed save/load alerts:

```text
✅ Project "autosave" saved!
✅ Project "autosave" loaded!
```

### Finding 4 — Deck upload enables combined DJ flows

**Severity:** Pass  
**Category:** Functional / Audio  
**Evidence:** Browser interaction result and in-session screenshot capture

Synthetic WAV files uploaded into both decks successfully. After upload:

- Track 1 filename displayed as `qa-tone-a440.wav`
- Track 2 filename displayed as `qa-tone-e660.wav`
- Track 1 play enabled
- Track 2 play enabled
- Play Both Tracks enabled
- Sidechain controls enabled
- Sampler source options populated

No console errors were observed after upload.

### Finding 5 — Mixer and master control combinations remain console-clean

**Severity:** Pass  
**Category:** Functional / Audio graph  
**Evidence:** Browser interaction result and console check

The QA pass adjusted multiple interdependent audio controls in one session:

- deck volume + tempo + stretch
- EQ + pitch + pan
- track effects
- crossfader
- sidechain toggle path
- sampler source / sampler enable path
- master volume + pan
- master routing toggles

The page remained usable and console-clean after these interactions.

### Finding 6 — Responsive Sequencer layout passes scripted checks

**Severity:** Pass  
**Category:** Responsive / Layout  
**Evidence:** `scripts/verify_sequencer_responsive_layout.py` output and responsive screenshots

The responsive verification script passed desktop, tablet, and mobile viewport checks.

On mobile, the layout stacks controls and content vertically. The timeline remains horizontally scrollable/reachable, which is expected for a timeline editor with bars and clips.

## Operational notes / limitations

### Note 1 — Docker health became unhealthy after long browser automation

During long-running headless/browser automation attempts, Docker reported:

```text
audio-visualizer   running   Up ... (unhealthy)
```

At that point HTTP requests to the Flask app timed out. Restarting the service restored access:

```text
ready 200 120453
```

This was treated as an environment/automation stability note rather than a confirmed app bug because the release checks and browser QA were completed successfully before the timeout state, and the service recovered with restart.

### Note 2 — Screenshot persistence gap for live exploratory state

Hermes browser screenshots were captured visually during this QA pass for:

- two loaded decks
- enabled mixer controls
- Sequencer project picker

The durable screenshot files already present in `screenshots/` cover Sequencer project picker, save/load state, and responsive layouts. If we want a perfect audit trail, the next QA polish item should be saving live mixer/deck screenshots to disk as well.

## Recommendations before opening PR

1. Keep this release branch focused: do not add unrelated fixes discovered after this point unless they are release blockers.
2. Push the branch and open the PR once GitHub CLI authentication is available.
3. Include this report in the PR description or link to it from the PR summary.
4. Optionally add one durable mixer/deck screenshot file before merge so the screenshot set covers both the Sequencer and DJ Mixer sides of the release.
5. If the Docker health/read-timeout behavior repeats outside QA automation, split it into a separate investigation branch rather than bundling it with this Sequencer release.

## Final release QA status

**Status:** Pass with operational notes.  
**Release-blocking bugs found:** None in tested scope.  
**Recommended next step:** Push `release/sequencer-save-playback-responsive` and open the PR after GitHub auth is completed.
