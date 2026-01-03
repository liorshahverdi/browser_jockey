# Release Notes - v3.27.6

## Fix Buffer Source Stop() Errors

**Release Date**: January 3, 2026

---

## 🐛 Bug Fix

### Eliminated InvalidStateError When Stopping Buffer Sources

Fixed JavaScript errors that occurred when stopping playback after switching to reverse mode while paused. The error `InvalidStateError: cannot call stop without calling start first` would appear in the console.

#### Problem
- User clicks reverse loop button while playback is paused
- Buffer source is created but `.start()` is not called (paused state)
- User then clicks stop button or disables loop
- Code attempts to call `.stop()` on buffer source that was never started
- Browser throws `InvalidStateError` exception

#### Root Cause
The Web Audio API `AudioScheduledSourceNode` requires that `.start()` must be called before `.stop()` can be called. The code was creating buffer sources in two states:

1. **Playing**: Creates buffer → calls `.start()` → can call `.stop()` ✅
2. **Paused**: Creates buffer → does NOT call `.start()` → cannot call `.stop()` ❌

Console showed:
```
⏸️ Reverse playback created but NOT started (isPlaying=false)
... later ...
Error stopping buffer source: InvalidStateError
```

#### Solution
Added `bufferSourceStarted` flag to track buffer source lifecycle:

**Before**: Blindly called `.stop()` on all buffer sources
```javascript
if (this.bufferSource) {
    this.bufferSource.stop();  // ❌ Error if never started!
    this.bufferSource.disconnect();
}
```

**After**: Only call `.stop()` if buffer was started
```javascript
if (this.bufferSource) {
    if (this.bufferSourceStarted) {
        this.bufferSource.stop();  // ✅ Safe, was started
    } else {
        console.log('Buffer source cleaned up (was never started)');
    }
    this.bufferSource.disconnect();
    this.bufferSource = null;
    this.bufferSourceStarted = false;
}
```

#### Implementation Details
1. **Added tracking flag** in constructor:
   ```javascript
   this.bufferSourceStarted = false;
   ```

2. **Set flag when starting** in `startReversePlayback()` and `startForwardBufferPlayback()`:
   ```javascript
   if (this.isPlaying) {
       this.bufferSource.start(0, offset);
       this.bufferSourceStarted = true;  // ✅ Mark as started
   } else {
       this.bufferSourceStarted = false;  // ⏸️ Mark as NOT started
   }
   ```

3. **Check flag before stopping** in all cleanup locations:
   - `switchToNormalMode()`
   - `pause()`
   - `stop()`
   - `destroy()`
   - `setLoopPoints()`
   - Stop button handlers in `app.js`
   - Loop toggle handlers in `app.js`

---

## 🔧 Files Modified
- `app/static/js/modules/playback-controller.js`
  - Added `bufferSourceStarted` flag
  - Modified all buffer source `.start()` calls to set flag
  - Modified all buffer source `.stop()` calls to check flag
- `app/static/js/app.js`
  - Updated Track 1 stop button handler
  - Updated Track 2 stop button handler
  - Updated Track 1 loop toggle handler
  - Updated Track 2 loop toggle handler
  - Updated timestretch buffer restart logic

---

## ✅ Testing Verification
- [x] Click reverse while paused → stop playback → no errors
- [x] Enable reverse while playing → stop playback → no errors
- [x] Toggle loop off while reverse paused → no errors
- [x] All buffer cleanup operations now silent and error-free

---

## 📋 Error Locations Fixed
All instances in console now eliminated:
```
❌ Before: "Error stopping buffer source: InvalidStateError"
✅ After: "Buffer source cleaned up (was never started)"
```

Affected 11 locations across 2 files where `.stop()` was called.

---

## 📋 Impact
**User Impact**: Medium - Eliminates console errors (no visible user-facing issues)  
**Scope**: All buffer source cleanup operations  
**Regression Risk**: None - Adds safety check, prevents invalid operations  

---

## 🔗 Related Issues
- Discovered during v3.27.5 testing
- Prevents invalid API usage per Web Audio spec
- Improves code robustness and console cleanliness
