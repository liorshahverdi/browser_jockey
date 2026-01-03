# Release Notes - v3.27.3

## Reverse Playback Start Position Bugfix

**Release Date**: January 3, 2026

---

## 🐛 Bug Fix

### Correct Reverse Playback Start Position

Fixed bug where clicking the reverse loop button would jump to the end of the loop before starting reverse playback, instead of starting from the current playback position.

#### Problem
- User sets loop markers (A-B) and has playback at some position
- User clicks the reverse loop button
- **Expected**: Reverse playback starts from current position (or end of loop if before loop start)
- **Actual**: Playback jumps to the beginning of the loop (the "end" when playing in reverse) before starting

#### Root Cause
When calculating the position to start reverse playback, if the current playback position was before the loop start, the code would clamp `positionInLoop` to `0`. This caused the reverse offset calculation to be:

```javascript
reverseOffset = loopDuration - 0 = loopDuration
```

This meant starting at the END of the reversed buffer, which is actually the START of the forward loop - the wrong position!

#### Example Scenario
```
Loop: 10s → 20s (10 second loop)
Current position: 5s (before loop start)
Expected: Start reverse from 20s (end of loop)
Old behavior: Started reverse from 10s (start of loop)
```

#### Solution
Modified position calculation in `playback-controller.js`:

**Before**: Clamped to 0 if before loop start
```javascript
if (positionInLoop < 0) {
    positionInLoop = 0;  // ❌ Wrong for reverse playback!
}
```

**After**: Use loop duration if before loop start (which represents the end position)
```javascript
if (positionInLoop < 0) {
    // Start from end of loop when playing in reverse
    positionInLoop = loopDuration;
    console.log('Position before loop start - starting from end for reverse');
}
```

#### How Reverse Position Mapping Works
In reverse playback, the buffer is reversed, so:
- Loop start (10s) → End of reversed buffer
- Loop end (20s) → Start of reversed buffer (position 0)

When current position is before the loop:
- We want to start from the END of the loop (20s in forward time)
- In the reversed buffer, this is position 0
- `reverseOffset = loopDuration - loopDuration = 0` ✅ Correct!

#### Benefits
- ✅ Reverse playback starts from correct position
- ✅ No jarring jump to loop start when enabling reverse
- ✅ Natural transition when activating reverse mode
- ✅ Matches expected DJ workflow behavior

#### User Workflow Improvements
Users can now:
- **Enable reverse mode** from anywhere and it starts at the right position
- **Switch between forward and reverse** without unexpected jumps
- **Trust the playback position** when toggling reverse button

#### Technical Details
- Modified: `app/static/js/modules/playback-controller.js`
- Function: `switchToReverseMode()`
- Change: Position calculation when currentTime is before loop start
- Impact: Correct reverse playback starting position

---

## Files Changed
- `app/static/js/modules/playback-controller.js` - Position calculation in switchToReverseMode()

---

## Upgrade Notes
No breaking changes. Reverse playback now starts from the expected position.

---

## Testing
Tested scenarios:
1. Position before loop start → Reverse starts from loop end ✅
2. Position within loop → Reverse starts from current position ✅
3. Position after loop end → Reverse wraps and starts correctly ✅
