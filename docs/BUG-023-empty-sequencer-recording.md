# BUG-023 — Empty Sequencer recording starts anyway

## Summary

The Sequencer Record button could start the recording flow when the Sequencer timeline had no placed clips. The UI showed the recording panel and its timer eventually displayed an impossible elapsed time because the timer was started while `recordingStartTime` was still `0`.

## Severity

High / Functional

## Root cause

`Sequencer.startRecording()` always auto-started sequencer playback and scheduled MediaRecorder setup before checking whether any sequencer track contained clips.

The later `_setupMediaRecorder()` path did detect the empty timeline, but by that point it had already:

- auto-started playback,
- entered the recording setup flow,
- exposed recording UI state,
- started a timer path that could calculate elapsed time from `recordingStartTime = 0`.

So the no-clips guard lived too late in the flow.

## Fix

Added an early guard in `startRecording()`:

- compute total placed clips across `sequencerTracks`,
- if the total is `0`, alert the user that there are no clips to record,
- return before playback, MediaRecorder setup, recording UI, or timer state can start.

## Test added

`app/static/tests/unit-tests.html`

New regression section:

- `BUG-023 — Empty Sequencer recording is blocked before recorder setup`

The test uses a minimal fake Sequencer instance and verifies an empty recording attempt:

- does not call `play()`,
- does not call `_setupMediaRecorder()`,
- leaves the recording section hidden,
- leaves the Record button enabled,
- leaves the Stop Recording button disabled,
- shows a no-clips alert.

## RED evidence

Before the production fix, the new regression failed as expected:

```text
BUG-023 — Empty Sequencer recording is blocked before recorder setup
❌ empty sequencer recording is blocked before playback, recorder setup, and timer UI
→ Expected empty sequencer recording to avoid auto-starting playback
Results: 40 passed / 1 failed / 1 skipped
❌ Some tests failed — check output above.
```

## GREEN evidence

After the production fix:

```text
BUG-023 — Empty Sequencer recording is blocked before recorder setup
✅ empty sequencer recording is blocked before playback, recorder setup, and timer UI
Results: 41 passed / 0 failed / 1 skipped
✅ All critical bugs verified fixed.
```

Screenshot evidence:

- Automated test evidence: `/home/lior/projects/browser_jockey/screenshots/bug023-unit-tests-passing.png`
- App behavior evidence: `/home/lior/projects/browser_jockey/screenshots/bug023-empty-recording-blocked.png`

## Actual app verification

Manual browser automation against `http://127.0.0.1:5017/` clicked Sequencer → Record with an empty timeline.

Observed dialog:

```text
No clips to record. Add at least one clip to the sequencer timeline first.
```

Observed page state after dismissing the dialog:

```json
{
  "recordButtonDisabled": false,
  "recordingSectionDisplay": "none",
  "recordingTime": "0:00",
  "mediaRecorderState": null
}
```

This confirms the impossible elapsed-time UI no longer appears for empty recordings.
