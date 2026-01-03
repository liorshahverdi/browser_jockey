# Release Notes - v3.27.7

## Fix Position Continuity When Disabling Reverse Mode

**Release Date**: January 3, 2026

---

## 🐛 Bug Fix

### Fixed Playback Position Jump When Toggling Reverse Mode Off

Fixed bug where disabling reverse mode (switching back to forward playback) would cause the playback position to jump unexpectedly instead of continuing from the current position. Now both enabling AND disabling reverse mode maintain position continuity.

#### Problem
- User enables reverse mode → correctly starts from current position ✅ (fixed in v3.27.5)
- User disables reverse mode → playback jumps to wrong position ❌
- Should continue from current position in both directions

#### Root Cause
When switching from reverse to normal mode, `switchToNormalMode()` calculated the correct absolute position (e.g., 79.55s) but passed it directly to `startForwardBufferPlayback()`:

```javascript
// switchToNormalMode() calculates:
currentPosition = 79.55s  // Absolute track time

// Then calls:
this.startForwardBufferPlayback(currentPosition);  // ❌ Wrong parameter!
```

However, `startForwardBufferPlayback()` expects `positionInLoop` (position *relative* to loop start):

```javascript
startForwardBufferPlayback(positionInLoop = 0) {
    // Expects: positionInLoop relative to loop start
    // Receives: 79.55s (absolute time) when loop is 77.20s-87.21s
    // Should receive: 79.55 - 77.20 = 2.35s
}
```

This caused the buffer to start at the wrong offset, leading to position jumps.

#### Example Scenario
```
Loop: 77.20s → 87.21s (10 second loop)
Current playback position: 79.55s

switchToNormalMode() calculates:
  currentPosition = 79.55s (absolute time) ✅ Correct

But passes to startForwardBufferPlayback:
  positionInLoop = 79.55s ❌ Wrong! Should be 2.35s

Result: Buffer starts at offset 79.55s in a 13.34s buffer
  → Wraps around → Jumps to unexpected position
```

#### Solution
Modified `switchToNormalMode()` in `playback-controller.js`:

**Before**: Passed absolute position
```javascript
this.startForwardBufferPlayback(currentPosition);  // ❌ Absolute time!
```

**After**: Convert to position within loop
```javascript
// Convert absolute position to position within loop
const positionInLoop = currentPosition - this.loopStart;
this.startForwardBufferPlayback(positionInLoop);  // ✅ Relative to loop start!
```

#### Technical Details
- **Absolute position**: Time on the entire track timeline (e.g., 79.55s)
- **Position in loop**: Time relative to loop start (e.g., 2.35s)
- Timestretched buffer contains only the loop section
- Buffer's `start(offset)` expects offset within the buffer (0 to buffer.duration)
- Loop: 77.20s-87.21s → Buffer: 0s-13.34s (at 0.75x tempo)
- Position 79.55s absolute = 2.35s into loop = 2.35s into buffer

#### Console Log Evidence
**Before fix:**
```
🔧 startForwardBufferPlayback called, positionInLoop: 79.55s  ← Wrong!
📊 updateWaveformProgress1: currentTime=87.18s  ← Jumped!
```

**After fix:**
```
🔧 startForwardBufferPlayback called, positionInLoop: 2.35s  ← Correct!
📊 updateWaveformProgress1: currentTime=79.57s  ← Continues smoothly!
```

---

## 🔧 Files Modified
- `app/static/js/modules/playback-controller.js`
  - Modified `switchToNormalMode()` to convert absolute position to loop-relative position

---

## ✅ Testing Verification
- [x] Toggle reverse ON → continues from current position ✅
- [x] Toggle reverse OFF → continues from current position ✅
- [x] Multiple forward/reverse/forward cycles → no position jumps ✅
- [x] Works with different tempo settings (0.75x, 1.0x, 1.25x) ✅

---

## 📋 Impact
**User Impact**: High - Enables seamless reverse mode toggling for DJ performance  
**Scope**: Reverse mode with timestretching enabled  
**Regression Risk**: None - Converts parameter to correct format  

---

## 🎯 User Experience
Before this fix, users could toggle reverse mode ON successfully but toggling it OFF would cause unexpected jumps. Now the workflow is seamless:

1. Play forward at 79.55s
2. Click reverse → smoothly continues backward from 79.55s ✅
3. Click forward → smoothly continues forward from current position ✅
4. Repeat infinitely without position drift ✅

---

## 🔗 Related Issues
- Completes the reverse mode position continuity series
- Works alongside v3.27.4 (double-call fix) and v3.27.5 (position tracking)
- Essential for live DJ performance with reverse effects
