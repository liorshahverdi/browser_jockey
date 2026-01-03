# Release Notes - v3.27.1

## Loop State Persistence Bugfix

**Release Date**: January 3, 2026

---

## 🐛 Bug Fix

### Loop Markers Persist After Toggle

Fixed critical bug where loop points would be lost when toggling the loop button off and on again, resulting in silent playback.

#### Problem
- User sets loop markers (A-B points) on a track
- User stops playback and clicks the loop button to disable looping
- User clicks the loop button again to re-enable looping
- User presses play button
- **Result**: Playback marker moves but no audio plays
- **Cause**: Loop start/end points were cleared (set to `null`) when loop was disabled

#### Console Evidence
```javascript
🔁 Loop enabled: true
🔁 Loop start: null    // ❌ Should have preserved the value
🔁 Loop end: null      // ❌ Should have preserved the value
✅ Audio playing successfully  // But no sound because loop bounds are undefined
```

#### Solution
Modified loop toggle behavior in `app.js` for both tracks:

**Before**: Toggling loop OFF would call `clearLoopPoints()`, completely erasing start/end values
```javascript
if (!loopState1.enabled) {
    clearLoopPoints(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1);
    // ... loop points now null ...
}
```

**After**: Toggling loop OFF now only hides markers visually, preserving the actual values
```javascript
if (!loopState1.enabled) {
    // Hide loop markers but preserve loop points
    if (loopRegion1) loopRegion1.style.display = 'none';
    if (loopMarkerStart1) loopMarkerStart1.style.display = 'none';
    if (loopMarkerEnd1) loopMarkerEnd1.style.display = 'none';
    // ... loop points remain intact ...
} else {
    // Loop enabled - show markers if loop points are set
    if (loopState1.start !== null && loopState1.end !== null) {
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
        updatePreciseLoopInputs(1);
    }
}
```

#### Benefits
- ✅ Loop points persist across enable/disable cycles
- ✅ Re-enabling loop shows previous markers automatically
- ✅ Audio plays correctly when loop is re-enabled
- ✅ "Clear Loop" button still available to explicitly remove markers
- ✅ Loop monitoring (`handleLoopPlayback`) already respects `enabled` flag

#### User Workflow Improvements
Users can now:
- **Toggle loop mode** without losing their carefully set loop points
- **Quickly switch** between looped and non-looped playback
- **Avoid silent playback bug** when re-enabling loops after stopping
- **Trust that markers persist** until explicitly cleared

#### Technical Details
- Modified: `app/static/js/app.js` (loop button handlers for both tracks)
- Affected functions: `loopBtn1` and `loopBtn2` event listeners
- Preserved: `loopState.start` and `loopState.end` values across toggle
- Maintained: Visual hiding/showing of loop markers and regions
- Unchanged: `handleLoopPlayback` already checks `enabled` flag before enforcement

---

## Files Changed
- `app/static/js/app.js` - Loop button toggle logic for Track 1 and Track 2

---

## Upgrade Notes
No breaking changes. Existing loop functionality remains the same, just more robust.

---

## Testing
Tested scenario:
1. Load audio to Track 1
2. Set loop markers (A-B)
3. Play and verify looping works
4. Stop playback
5. Disable loop button
6. Re-enable loop button
7. Press play
8. ✅ Audio now plays correctly (previously silent)
