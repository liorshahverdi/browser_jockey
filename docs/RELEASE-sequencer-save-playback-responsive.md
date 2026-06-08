# Release branch — Sequencer save/load + playback reverse position + responsive Sequencer layout

## Branch

`release/sequencer-save-playback-responsive`

## Included branches

- `fix/save-project-download-json`
  - Restores Sequencer tracks and placed clip arrangements from saved projects.
- `fix/playback-controller-reverse-position`
  - Fixes `PlaybackController.getCurrentTime()` reverse/buffer position calculation when `reverseStartTime` is `0`.

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
http://127.0.0.1:5001/static/tests/unit-tests.html?final=1
```

Result:

```text
Results: 38 passed / 0 failed / 1 skipped
```

## Visual evidence

The screenshots below use the real BUG-022 visual demo page, which creates Sequencer clips/tracks, saves the project, wipes the visible timeline, and reloads it through `loadProject()`.

```text
screenshots/sequencer-responsive-desktop.png
screenshots/sequencer-responsive-tablet.png
screenshots/sequencer-responsive-mobile.png
```

The mobile screenshot shows controls wrapped into touch-friendly rows, Available Clips stacked above the timeline, and restored tracks/clips visible in the Sequencer timeline.
