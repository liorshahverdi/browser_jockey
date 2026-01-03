# Release Notes - v3.27.5

## Reverse Mode Position Tracking with Timestretch

**Release Date**: January 3, 2026

---

## 🐛 Bug Fix

### Fixed Stale Position When Switching to Reverse Mode with Timestretching

Fixed critical bug where switching to reverse mode while using timestretched playback would read a stale `audioElement.currentTime` value instead of the actual buffer playback position, causing reverse mode to always start from the wrong position.

#### Problem
- User enables timestretch (tempo slider)
- Playback switches to buffer source mode (pauses audio element)
- User toggles between forward/reverse modes
- Position always reverts to the same stale value (e.g., 43.42s)
- Should start from current playback position instead

#### Root Cause
When timestretching is enabled, playback uses an `AudioBufferSourceNode` instead of the `<audio>` element:

1. Audio element gets paused when buffer playback starts
2. `audioElement.currentTime` becomes frozen at the pause position
3. `switchToReverseMode()` reads `audioElement.currentTime` (stale!)
4. Buffer continues playing at 71s, 73s, 76s... but reads 43.42s every time
5. Reverse mode always starts from the wrong, outdated position

#### Example Scenario
```
Console logs showing the bug:
switchToReverseMode: audioElement.currentTime = 43.42s (stale!)
Actual buffer playback position: 71.30s
User expects reverse from 71.30s, gets 43.42s instead

After toggling forward → reverse → forward → reverse:
All reverse mode switches start from 43.42s regardless of actual position
```

#### Solution
Modified `switchToReverseMode()` in `playback-controller.js`:

**Before**: Always read from audio element
```javascript
let currentTime = this.audioElement.currentTime;  // ❌ Stale when using buffer!
```

**After**: Check if buffer source exists and use calculated position
```javascript
let currentTime;
if (this.bufferSource && this.bufferSource.buffer) {
    // Use calculated position from buffer playback timing
    currentTime = this.getCurrentTime();  // ✅ Accurate real-time position
} else {
    // Fall back to audio element for non-timestretched playback
    currentTime = this.audioElement.currentTime;
}
```

#### Technical Details
- `getCurrentTime()` calculates position from buffer source timing:
  - Uses `audioContext.currentTime - reverseStartTime` for elapsed time
  - Accounts for playback rate (tempo changes)
  - Calculates position within loop bounds
  - Returns absolute track time
- Only used when `bufferSource` exists (timestretched mode)
- Falls back to `audioElement.currentTime` for normal playback
- Ensures position continuity across all mode transitions

---

## 🔧 Files Modified
- `app/static/js/modules/playback-controller.js`
  - Modified `switchToReverseMode()` to detect buffer playback mode
  - Added conditional logic to use `getCurrentTime()` vs `audioElement.currentTime`

---

## ✅ Testing Verification
- [x] Enable timestretch → toggle forward/reverse → position continues correctly
- [x] No more stuck at old position (43.42s bug eliminated)
- [x] Multiple forward/reverse toggles → each starts from current position
- [x] Works without timestretch → uses audio element time correctly

---

## 📊 Console Log Evidence
**Before fix:**
```
📊 Audio element state: currentTime=43.42s
📊 Actual playback position: 71.30s  ← Wrong!
```

**After fix:**
```
📊 Using buffer playback position: 71.30s
📊 Actual playback position: 71.30s  ← Correct!
```

---

## 📋 Impact
**User Impact**: Critical - Fixes broken reverse mode with timestretching  
**Scope**: Reverse mode when tempo slider is used  
**Regression Risk**: None - Adds conditional check, doesn't change existing logic  

---

## 🔗 Related Issues
- Builds on v3.27.4 (reverse double-call fix)
- Completes reverse mode position tracking improvements
- Essential for professional DJ workflow with tempo manipulation
