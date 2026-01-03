# Release Notes - v3.27.4

## Reverse Playback Double-Call Bugfix

**Release Date**: January 3, 2026

---

## 🐛 Bug Fix

### Fixed Duplicate Buffer Start in Reverse Mode

Fixed critical bug where switching to reverse mode would start the buffer playback twice, causing position desynchronization and incorrect playback behavior.

#### Problem
- User clicks reverse loop button during playback
- `switchToReverseMode()` creates buffer and calls `.start()`
- Then `play()` method incorrectly calls `startReversePlayback()` again
- Buffer gets restarted with wrong position
- Results in jumpy, incorrect playback behavior

#### Root Cause
The `play()` method was checking `mode === 'reverse'` and calling `startReversePlayback()` without verifying if the buffer source was already playing. This caused:

1. `switchToReverseMode()` → calls `startReversePlayback(currentPositionInLoop)` → buffer starts
2. `play()` → sees mode is 'reverse' → calls `startReversePlayback(0)` → buffer restarts from wrong position

#### Example Scenario
```
User at 15s in a 10s-20s loop, switches to reverse:
1. switchToReverseMode() correctly starts at 15s
2. play() immediately restarts at 20s (wrong!)
Result: Position jumps unexpectedly
```

#### Solution
Modified `play()` method in `playback-controller.js`:

**Before**: Always called startReversePlayback in reverse mode
```javascript
if (this.mode === 'reverse') {
    this.startReversePlayback(0);  // ❌ Restarts even if already playing!
}
```

**After**: Only starts if buffer source doesn't exist
```javascript
if (this.mode === 'reverse') {
    if (!this.bufferSource) {
        // Only create buffer if one doesn't exist
        this.startReversePlayback(this.currentPositionInLoop || 0);
    }
    console.log('✅ Reverse playback buffer already started, no action needed');
}
```

#### Technical Details
- Stores `currentPositionInLoop` in `switchToReverseMode()` before mode switch
- `play()` now checks for existing buffer source before starting reverse playback
- Prevents duplicate `.start()` calls on AudioBufferSourceNode
- Maintains correct position tracking across mode transitions

---

## 🔧 Files Modified
- `app/static/js/modules/playback-controller.js`
  - Modified `switchToReverseMode()` to store position before calling `startReversePlayback()`
  - Modified `play()` to skip reverse buffer creation if already exists

---

## ✅ Testing Verification
- [x] Switch to reverse mode during playback → starts at correct position
- [x] Reverse playback continues smoothly without jumps
- [x] Toggle pause/play in reverse mode → maintains position
- [x] Switch between forward/reverse multiple times → no position drift

---

## 📋 Impact
**User Impact**: High - Eliminates jarring position jumps when using reverse mode  
**Scope**: Reverse playback mode with timestretching  
**Regression Risk**: Low - Logic now prevents duplicate operations  

---

## 🔗 Related Issues
- Related to v3.27.3 (reverse start position fix)
- Complements v3.27.5 (position tracking with timestretch)
