# Release branch — Sequencer save/load + playback reverse position + responsive Sequencer layout

## Branch

`release/sequencer-save-playback-responsive`

## Included branches

- `fix/save-project-download-json`
  - Restores Sequencer tracks and placed clip arrangements from saved projects.
- `fix/playback-controller-reverse-position`
  - Fixes `PlaybackController.getCurrentTime()` reverse/buffer position calculation when `reverseStartTime` is `0`.

## Additional release-branch fix: Sequencer project picker + restored track UI state

### Problem

Two Sequencer persistence UX issues remained after the save/load restoration work:

- loading a saved project used a blocking native `prompt()` where users had to type a project number,
- saved mute/solo/volume metadata was restored into track objects, but the visible track controls did not reflect that restored state.

### Fix

Updated `app/static/js/modules/sequencer.js` so the Sequencer now:

- renders an in-app project picker modal for saved projects,
- lists saved project names and saved timestamps,
- loads the selected project from the modal without `prompt()`,
- shows an empty-state modal when no saved projects exist,
- restores visible track volume slider/label state,
- restores visible muted state as `Unmute` with the active mute styling,
- restores visible solo active styling,
- keeps `track.volume` synchronized when the volume slider changes.

Added browser-unit coverage for both behaviors in `app/static/tests/unit-tests.html`.

### RED/GREEN evidence

Before implementation, the new tests failed as expected:

```text
❌ showLoadProjectDialog renders in-app project picker instead of prompt
→ Expected no native prompt() call
❌ restored mute/solo/volume state is visible in track controls
→ Expected restored volume slider 35, got 80
```

After implementation:

```text
✅ showLoadProjectDialog renders in-app project picker instead of prompt
✅ restored mute/solo/volume state is visible in track controls
Results: 40 passed / 0 failed / 1 skipped
```

## Additional release-branch fix: Sequencer responsive layout

### Problem

The Sequencer layout was awkward at tablet/mobile widths:

- source clips and timeline stayed side-by-side too long,
- the header/control area could overflow or squeeze awkwardly,
- track control buttons could be pushed to the far right of a wide timeline,
- the whole page risked horizontal overflow instead of keeping horizontal scrolling localized to the timeline editor.

### Fix

Updated `app/static/css/style.css` so the Sequencer:

- stacks Available Clips above the timeline at narrow widths,
- wraps transport/save/load/zoom controls cleanly,
- keeps timeline bars horizontally scrollable inside the timeline panel,
- keeps track headers/control buttons visible and wrapped,
- prevents page-level horizontal overflow in the tested desktop/tablet/mobile viewports.

The BUG-022 visual demo markup was also aligned with the production Sequencer classes (`sequencer-container`, `sequencer-timeline-container`, `timeline-header`) so screenshots and responsive checks exercise the real CSS selectors.

## TDD / regression verification

### RED

Added `scripts/verify_sequencer_responsive_layout.py`, a real-browser CDP regression check for Sequencer layout at desktop/tablet/mobile widths.

Before the CSS fix, the test failed, for example:

```text
AssertionError: desktop (1280px): trackHeader overflows viewport ...
```

The earlier implementation also failed tablet/mobile single-column expectations because `.sequencer-workspace` remained `250px 1fr`.

### GREEN

After the responsive CSS fix:

```text
PASS desktop 1280px columns=250px 926px clips=3
PASS tablet 768px columns=681px clips=3
PASS mobile 390px columns=318px clips=3
```

### Existing browser unit harness

Verified at:

```text
http://127.0.0.1:5001/static/tests/unit-tests.html?final=project-picker-ui-state
```

Result:

```text
Results: 40 passed / 0 failed / 1 skipped
```

## Visual evidence

The screenshots below use the real BUG-022 visual demo page, which creates Sequencer clips/tracks, saves the project, wipes the visible timeline, and reloads it through `loadProject()`.

```text
screenshots/sequencer-responsive-desktop.png
screenshots/sequencer-responsive-tablet.png
screenshots/sequencer-responsive-mobile.png
screenshots/sequencer-release-save-load-ui-state.png
screenshots/sequencer-release-project-picker-modal.png
```

The mobile screenshot shows controls wrapped into touch-friendly rows, Available Clips stacked above the timeline, and restored tracks/clips visible in the Sequencer timeline. The release UI-state screenshot shows the real Sequencer after save/load with restored placements plus visible `35%` muted drums and `64%` solo lead track controls. The project-picker screenshot shows the new in-app modal listing the saved project and Load/Cancel actions.
