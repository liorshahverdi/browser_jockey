# BUG-022 — Sequencer project save/load preserves timeline arrangements

## Branch

`fix/save-project-download-json`

## Background

During QA, the highest-impact remaining persistence problem was in the Sequencer project save/load path. A user could save a project with clips arranged on tracks, but loading the project recreated only a default empty timeline. This made the Save Project / Load Project controls unreliable for actual DJ/sequencer work because the most valuable state — track layout and placed clips — was lost.

## User impact

- Saved sequencer projects appeared successful but did not restore the timeline arrangement.
- Placed clips, clip positions, and trims were effectively lost on load.
- This undermined trust in project persistence and made longer sessions risky.

## Root cause

`Sequencer.loadProject()` loaded project metadata and source clips, then called `initializeTimeline()` with a comment noting track restoration was not implemented:

```js
// Restore tracks and clip placements
// (Track restoration would require recreating track DOM elements)
this.initializeTimeline();
```

There was also a serialization issue: `serializeProject()` wrote placed clip metadata from fields that do not exist on placed clip objects:

- `placedClip.startBar`
- `placedClip.duration`

The real placed-clip shape stores:

- `barPosition`
- `pixelPosition`
- `sourceClip.duration`
- `trimStart`
- `trimEnd`

Using `||` defaults also meant explicit values such as `trimEnd: 0` could be lost.

## TDD coverage added

Added `BUG-022` tests to `app/static/tests/unit-tests.html`.

### Regression tests

1. `serializeProject stores placed clip duration and explicit trimEnd=0`
   - Builds a minimal Sequencer-like object.
   - Calls `Sequencer.prototype.serializeProject` directly.
   - Verifies placed clip duration is serialized from `sourceClip.duration`.
   - Verifies `trimEnd: 0` is preserved exactly.

2. `loadProject recreates saved tracks and clip placements`
   - Stubs the IndexedDB manager.
   - Stubs `addSequencerTrack()` and `addClipToTrack()`.
   - Calls `Sequencer.prototype.loadProject()` with saved track data.
   - Verifies saved track id/name are recreated.
   - Verifies placed clip id, source clip link, pixel position, and trim values are restored.

## Implementation summary

### `app/static/js/modules/sequencer.js`

#### `serializeProject()`

Now serializes track metadata and real placed-clip fields:

- track `name`
- track `muted`
- track `solo`
- track `volume`
- placed clip `id`
- source clip id as `clipId` / `sourceClipId`
- `startBar` from `barPosition`
- `duration` from `sourceClip.duration`
- `trimStart` with `??`
- `trimEnd` with `??`

#### `loadProject()`

Now:

1. Clears existing clips and track DOM.
2. Restores BPM, bar count, zoom, and project tempo.
3. Loads source clips from IndexedDB.
4. Recreates saved tracks using saved ids/names/options.
5. Re-adds each placed clip to its saved track at the saved bar position.
6. Restores trim values.
7. Falls back to one empty timeline track for older projects with no saved track data.

#### `addSequencerTrack(name, options = {})`

Now accepts optional restoration metadata:

- `id`
- `muted`
- `solo`
- `volume`

#### `addClipToTrack(trackId, clip, pixelPosition, options = {})`

Now accepts optional restoration metadata:

- `id`
- `trimStart`
- `trimEnd`

## Verification

Run locally with Docker:

```bash
docker compose up --build -d
```


Open:

```text
http://127.0.0.1:5001/static/tests/unit-tests.html
```

BUG-022 focused verification result:

```text
✅ serializeProject stores placed clip duration and explicit trimEnd=0
✅ loadProject recreates saved tracks and clip placements
```

Important scope note: after removing the unrelated `playback-controller.js` change from this branch, the legacy BUG-004 tests in the shared browser test harness fail exactly as they do against `main`. That existing playback-controller issue is intentionally not bundled into this Sequencer persistence branch.

Visual app/demo screenshot captured at:

```text
/home/lior/projects/browser_jockey/screenshots/bug022-app-visual-demo-timeline.png
```

The visual screenshot shows the Sequencer UI after a save → visible wipe → load cycle using the real `Sequencer` module methods. It contains restored available clips, two restored tracks, and three restored timeline clip placements.

A reproducible visual demo page is available at:

```text
http://127.0.0.1:5001/static/tests/bug022-visual-demo.html
```

## Notes / follow-up recommendations

- The JSON export/import path still warns that audio buffers are not included. A future branch should either:
  - export an archive-like project bundle with audio assets, or
  - clearly label JSON export as metadata-only.
- The load dialog still uses `prompt()`. A future UX branch should replace it with a modal project picker.
- Track mute/solo/volume UI visuals can be made more exact on restored tracks in a follow-up polish branch.
