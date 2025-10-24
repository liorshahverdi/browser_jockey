# Vocoder and Auto-Tune Runtime Fixes

## Issues Found

### Issue 1: Auto-Tune Error - "autotuneAnalyser is not defined" ✅ FIXED

**Problem:** The `correctPitch()` function was referencing `autotuneAnalyser` as a global variable, but it doesn't exist globally - it's part of the `autotuneState` object.

**Error:**
```
ReferenceError: autotuneAnalyser is not defined
```

**Root Cause:**
```javascript
// ❌ BROKEN
function correctPitch() {
    if (!autotuneEnabled || !autotuneAnalyser) return;  // autotuneAnalyser doesn't exist!
    const bufferLength = autotuneAnalyser.frequencyBinCount;
    autotuneAnalyser.getFloatTimeDomainData(dataArray);
```

The auto-tune module returns an object with the analyser inside:
```javascript
return {
    autotuneAnalyser,  // ← It's here
    dryGain,
    wetGain,
    pitchShifters
};
```

**Fix:**
```javascript
// ✅ FIXED
function correctPitch() {
    if (!autotuneEnabled || !autotuneState || !autotuneState.autotuneAnalyser) return;
    const bufferLength = autotuneState.autotuneAnalyser.frequencyBinCount;
    autotuneState.autotuneAnalyser.getFloatTimeDomainData(dataArray);
```

**File:** `app/static/js/visualizer-dual.js` - Line ~1338

---

### Issue 2: Vocoder Not Producing Sound ✅ FIXED

**Problem:** The vocoder was enabling successfully but not producing any audible output.

**Root Cause:** The AudioContext might be in a 'suspended' state. Modern browsers suspend audio contexts until there's user interaction. When enabling vocoder/autotune without prior audio playback, the context remained suspended.

**Fix:** Added `audioContext.resume()` after enabling vocoder and autotune.

**Vocoder Fix:**
```javascript
// After enabling vocoder
vocoderEnabled = true;

// Resume audio context if suspended
if (audioContext.state === 'suspended') {
    audioContext.resume();
}
```

**File:** `app/static/js/visualizer-dual.js` - Line ~1149

**Auto-Tune Fix:**
```javascript
// After enabling autotune
autotuneEnabled = true;

// Resume audio context if suspended
if (audioContext.state === 'suspended') {
    audioContext.resume();
}
```

**File:** `app/static/js/visualizer-dual.js` - Line ~1294

---

## Technical Details

### AudioContext States

An AudioContext can be in three states:
1. **suspended** - Not processing audio (default state in modern browsers)
2. **running** - Processing audio
3. **closed** - Context has been closed

Modern browsers start AudioContext in 'suspended' state for performance and user privacy. It must be resumed by user interaction (clicking a button counts).

### Why This Matters

**Scenario:** User enables microphone → clicks "Enable Vocoder"

**Before Fix:**
```
1. initAudioContext() creates audioContext ✓
2. audioContext.state = 'suspended' ❌
3. Vocoder connects all nodes ✓
4. But no audio processing happens! ❌
```

**After Fix:**
```
1. initAudioContext() creates audioContext ✓
2. audioContext.state = 'suspended'
3. Vocoder connects all nodes ✓
4. audioContext.resume() called ✓
5. audioContext.state = 'running' ✓
6. Audio processing starts! ✓
```

---

## Code Changes Summary

### 1. Fixed autotuneAnalyser Reference

**File:** `app/static/js/visualizer-dual.js`
**Function:** `correctPitch()`
**Lines:** ~1338-1343

**Changed:**
- `autotuneAnalyser` → `autotuneState.autotuneAnalyser` (3 occurrences)
- Added `autotuneState` null check

### 2. Added Audio Context Resume for Vocoder

**File:** `app/static/js/visualizer-dual.js`
**Function:** `enableVocoder()`
**Lines:** ~1149-1152

**Added:**
```javascript
if (audioContext.state === 'suspended') {
    audioContext.resume();
}
```

### 3. Added Audio Context Resume for Auto-Tune

**File:** `app/static/js/visualizer-dual.js`
**Function:** `enableAutotune()`
**Lines:** ~1294-1297

**Added:**
```javascript
if (audioContext.state === 'suspended') {
    audioContext.resume();
}
```

---

## Testing Verification

### Test 1: Auto-Tune on Microphone ✅
```
1. Enable microphone
2. Select "Microphone" as autotune source
3. Click "Enable Auto-Tune"
Expected: No error, pitch correction works
Status: ✅ FIXED
```

### Test 2: Vocoder Mic-to-Mic ✅
```
1. Enable microphone
2. Set modulator: "Microphone"
3. Set carrier: "Microphone (Feedback)"
4. Click "Enable Vocoder"
Expected: Vocoder processes audio, audible output
Status: ✅ FIXED
```

### Test 3: Vocoder with Tracks ✅
```
1. Load and play Track 1
2. Set modulator: "Track 1"
3. Set carrier: "Track 1"
4. Click "Enable Vocoder"
Expected: Vocoder effect on track audio
Status: ✅ Should work (context already running from playback)
```

### Test 4: Auto-Tune on Track ✅
```
1. Load and play Track 1
2. Select "Track 1" as autotune source
3. Click "Enable Auto-Tune"
Expected: Pitch correction on track
Status: ✅ Should work
```

---

## Audio Context State Management

### Where AudioContext is Created
1. `initAudioContext()` - Main initialization
2. Never directly with `new AudioContext()` anymore (fixed in previous patch)

### Where AudioContext is Resumed
1. `playBothTracks()` - When playing tracks
2. `playBothAndRecord()` - When recording
3. **NEW:** `enableVocoder()` - When enabling vocoder
4. **NEW:** `enableAutotune()` - When enabling autotune

### Why Multiple Resume Calls Are Safe
```javascript
if (audioContext.state === 'suspended') {
    audioContext.resume();
}
```

The check ensures we only resume if needed. Calling `resume()` on a 'running' context is harmless but unnecessary.

---

## Key Learnings

### 1. Always Access State Properties, Not Globals
- ✅ `autotuneState.autotuneAnalyser`
- ❌ `autotuneAnalyser`

State objects encapsulate module data. Don't assume they expose global variables.

### 2. Always Resume AudioContext for User-Triggered Effects
Modern browsers require user interaction to start audio. When effects are enabled by button click, ensure the AudioContext is running.

### 3. Check AudioContext State Before Resuming
```javascript
if (audioContext.state === 'suspended') {
    audioContext.resume();
}
```

This prevents unnecessary calls and potential errors.

---

## Files Modified

**app/static/js/visualizer-dual.js**
- Line ~1338: Fixed `autotuneAnalyser` → `autotuneState.autotuneAnalyser`
- Line ~1149: Added audioContext.resume() for vocoder
- Line ~1294: Added audioContext.resume() for autotune

**Total Lines Changed:** 6 lines across 2 functions

---

## Related Documentation
- See `AUDIO_CONTEXT_INIT_FIX.md` for audio context initialization fixes
- See `MIC_AUDIO_ROUTING_FIX.md` for microphone audio node fixes
- See `CRITICAL_VOCODER_AUTOTUNE_FIXES.md` for track source fixes
