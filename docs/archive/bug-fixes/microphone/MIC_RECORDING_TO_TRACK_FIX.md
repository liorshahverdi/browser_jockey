# Microphone Recording to Track Fix

## Issue
When recording with the microphone and sending the recording to Track 1 or Track 2, an error occurred:
```
Error creating MediaElementSource for Track 1: TypeError: Failed to execute 'connect' on 'AudioNode': Overload resolution failed.
```

## Root Cause
The error occurred because the code was attempting to create multiple `MediaElementSource` nodes for the same HTML audio element. According to the Web Audio API specification, **you can only create one `MediaElementSource` per audio element**.

### Two Related Problems:

#### Problem 1: Premature Source Creation
When loading a recording or file, the code was trying to create a `MediaElementSource` immediately. However, the `initAudioContext()` function (which is called when the play button is clicked) also creates these sources if they don't exist. This caused a conflict.

#### Problem 2: Disconnecting and Nulling Sources
When loading a new file or recording, the code would:
1. Disconnect the existing `source1` or `source2` node
2. Set the variable to `null`
3. Change the audio element's `src` to the new file

The critical issue: **Once a `MediaElementSource` is created from an audio element, that element is permanently "captured" by the Web Audio API**. Even if you disconnect the source node and null the variable, the audio element still has the source attached internally. When you try to create a new `MediaElementSource` later, it fails because the element already has one.

The issue happened in:
1. File upload handlers (both tracks) - when cleaning up tab capture
2. `loadRecordingToTrack1()` function - when cleaning up tab capture  
3. `loadRecordingToTrack2()` function - when cleaning up tab capture

## Solution

### Part 1: Remove Premature Source Creation
Removed the premature creation of `MediaElementSource` nodes from:
- File upload handlers (both tracks)
- `loadRecordingToTrack1()` function
- `loadRecordingToTrack2()` function

The `MediaElementSource` nodes are now **only created in `initAudioContext()`**, which is called when the play button is clicked.

### Part 2: Reuse Existing Sources (Key Fix!)
**Critical change**: When loading a new file or recording, we now **keep the existing `MediaElementSource`** instead of disconnecting and nulling it.

Why this works:
- A `MediaElementSource` automatically plays whatever audio is in its associated audio element
- When you change `audioElement.src` to a new file, the existing source will play the new audio
- No need to create a new source - the old one works perfectly!

Updated these locations to NOT disconnect sources:
- File upload handler for Track 1 (line ~3476)
- File upload handler for Track 2 (line ~3608)
- `loadRecordingToTrack1()` function (line ~544)
- `loadRecordingToTrack2()` function (line ~672)

### Part 3: Prevent Duplicate Connections & Use Proper API
Added connection tracking flags (`source1Connected` and `source2Connected`) and refactored to use the existing `connectEffectsChain` function:

1. Separated source creation from effect chain connection
2. Added flags to track if sources are already connected to the effects chain
3. Replaced manual connection code with calls to `connectEffectsChain()` from `audio-effects.js`
4. Wrapped all connection code in try-catch blocks for robustness
5. Only attempt connections if the source exists AND is not yet connected

### Part 4: Fix Pitch Shifter Fallback Logic ✅ **[CRITICAL FIX]**
Fixed the audio signal path in `connectEffectsChain()`:

**Problem:** When the pitch shifter connection failed (already connected), the code would still try to route audio through it. Since panner→pitchShifter connection failed, no audio reached the pitch shifter, breaking the entire chain.

**Solution:** Added `pitchShifterConnected` flag to track if the pitch shifter connection succeeded. If it fails, we fall back to connecting panner directly to filter, bypassing the broken pitch shifter connection.

```javascript
// Before: Audio chain was broken when pitch shifter connection failed
if (pitchShifter) {
    try { panner.connect(pitchShifter.input); } catch (err) { /* fails silently */ }
}
if (pitchShifter) {  // ❌ Still tries to use pitch shifter even if connection failed!
    pitchShifter.connect(filter);
}

// After: Falls back to direct connection if pitch shifter fails
let pitchShifterConnected = false;
if (pitchShifter) {
    try { 
        panner.connect(pitchShifter.input); 
        pitchShifterConnected = true;  // ✅ Track success
    } catch (err) { /* connection failed */ }
}
if (pitchShifter && pitchShifterConnected) {  // ✅ Only use if connected
    pitchShifter.connect(filter);
} else {
    panner.connect(filter);  // ✅ Fallback keeps audio flowing
}
```

Benefits:
- Prevents "Overload resolution failed" errors from duplicate connections
- Uses tested, consistent connection logic across the codebase
- **Ensures audio signal path is never broken**
- Cleaner, more maintainable code
- Proper error handling and fallback logic

This ensures that each audio element only gets one `MediaElementSource` created for it during its lifetime, and the effect chain is only connected once using the proper API, preventing all "Overload resolution failed" errors.

## Changes Made

### app.js

1. **File upload handler for Track 1** (around line 3476):
   - Removed code that disconnected `source1` when cleaning up tab capture
   - Added comment explaining that we reuse the existing source

2. **File upload handler for Track 2** (around line 3608):
   - Removed code that disconnected `source2` when cleaning up tab capture
   - Added comment explaining that we reuse the existing source

3. **loadRecordingToTrack1() function** (around line 544):
   - Removed code that disconnected `source1` when cleaning up tab capture
   - Added comment explaining that we reuse the existing source

4. **loadRecordingToTrack2() function** (around line 672):
   - Removed code that disconnected `source2` when cleaning up tab capture
   - Added comment explaining that we reuse the existing source

5. **initAudioContext() function** (around line 2867-2930):
   - Added `source1Connected` and `source2Connected` tracking flags
   - Separated source creation from connection setup
   - Replaced manual connection code with calls to `connectEffectsChain()`
   - Wrapped connections in try-catch blocks
   - Only connect if source exists and isn't already connected

### audio-effects.js

6. **connectEffectsChain() function** (lines 172-229):
   - Wrapped ALL connection calls in try-catch blocks
   - Made the function idempotent (safe to call multiple times)
   - Changed error logging to be less verbose for already-connected nodes
   - This prevents errors when tab capture and file playback both try to connect the same nodes

## How It Works Now

1. User records with microphone
2. User clicks "Send to Track 1" (or Track 2)
3. Recording is loaded into the audio element
4. **No `MediaElementSource` is created yet**
5. User clicks Play button
6. `initAudioContext()` is called
7. `initAudioContext()` checks if `source1` (or `source2`) exists
8. If not, it creates the `MediaElementSource` and connects it to the effects chain
9. Audio plays successfully

## Testing
- [x] Record with microphone
- [x] Send recording to Track 1
- [x] Click Play - should work without errors
- [x] Send recording to Track 2
- [x] Click Play - should work without errors
- [x] Load file to Track 1 via file input
- [x] Load file to Track 2 via file input

## Date
October 28, 2025

## Final Status
✅ **COMPLETELY FIXED** - Microphone recordings now play successfully on both tracks!
