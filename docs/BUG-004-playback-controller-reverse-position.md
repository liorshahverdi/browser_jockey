# BUG-004 — PlaybackController reverse position calculation

## Branch

`fix/playback-controller-reverse-position`

## Why this is separate

This fix was originally discovered while verifying the Sequencer save/load branch. It is unrelated to Sequencer persistence, so it was split out to keep `fix/save-project-download-json` focused and avoid ambiguity about regressions.

## Problem

The existing browser test harness showed two failing BUG-004 tests on `main`:

```text
❌ getCurrentTime() uses currentPlaybackRate (not undefined playbackRate)
→ Expected ~3.0s (with rate=2.0), got 0.000s. Bug would give ~4.0s.

❌ Position calculation at rate=1.5 matches expected formula
→ Expected ~13.0s, got 0.000s
```

Root cause: `getCurrentTime()` required both a truthy `bufferSource` and a truthy `reverseStartTime` before using reverse-loop position math:

```js
if (this.bufferSource && this.reverseStartTime && this.loopStart !== null && this.loopEnd !== null) {
```

That fails when tests set `reverseStartTime = 0`, because `0` is falsy. It also unnecessarily couples position calculation to a `bufferSource` instance for the tested reverse state.

## Fix

Use explicit null checking for reverse timing state:

```js
if (this.reverseStartTime !== null && this.loopStart !== null && this.loopEnd !== null) {
```

## TDD verification

### RED — before fix on `main`

```text
Results: 34 passed / 2 failed / 1 skipped
```

Failing tests:

```text
❌ getCurrentTime() uses currentPlaybackRate (not undefined playbackRate)
❌ Position calculation at rate=1.5 matches expected formula
```

### GREEN — after fix

```text
Results: 36 passed / 0 failed / 1 skipped
```

Passing BUG-004 tests include:

```text
✅ getCurrentTime() uses currentPlaybackRate (not undefined playbackRate)
✅ Position calculation at rate=1.5 matches expected formula
```

## Files changed

```text
app/static/js/modules/playback-controller.js
docs/BUG-004-playback-controller-reverse-position.md
```
