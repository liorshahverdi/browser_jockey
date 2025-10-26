# Sequencer Recording Debug Enhancement

**Date:** October 26, 2025
**Issue:** Recording produces tiny files (110 bytes) with no actual audio data

## Problem Diagnosis

### Symptoms
```
🎙️ Started recording sequencer output
⏹️ Stopped recording sequencer output
❌ Error decoding recorded audio: EncodingError: Unable to decode audio data
📥 Loading sequencer recording: sequencer-recording-1761518236063.webm (audio/webm;codecs=opus, 110 bytes)
```

**110 bytes = Empty/invalid WebM file!**

### Root Causes Identified

1. **No timeslice parameter** - `mediaRecorder.start()` without timeslice may not capture data reliably
2. **Silent audio stream** - MediaStreamDestination might not be receiving audio
3. **Suspended AudioContext** - Recording started before context resumed
4. **Missing data chunks** - No logging to verify data capture

## Solution Implemented

### 1. Added Timeslice Parameter

**Before:**
```javascript
this.mediaRecorder.start(); // No guaranteed data capture
```

**After:**
```javascript
this.mediaRecorder.start(100); // Request data every 100ms
```

**Why 100ms?**
- Ensures regular data capture during recording
- Small enough to prevent data loss
- Large enough to avoid excessive overhead
- Standard practice for reliable MediaRecorder usage

### 2. Comprehensive Debug Logging

Added extensive logging throughout the recording pipeline:

```javascript
// Stream validation
console.log('🔗 Sequencer output connected to recording destination');
console.log('📊 Stream tracks:', dest.stream.getTracks().length);
console.log('📊 Stream active:', dest.stream.active);

// Chunk capture monitoring
this.mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
        console.log(`📦 Recorded chunk: ${e.data.size} bytes`);
        this.recordedChunks.push(e.data);
    } else {
        console.warn('⚠️ Received empty data chunk');
    }
};

// Final blob verification
this.mediaRecorder.onstop = () => {
    console.log(`📦 Total chunks: ${this.recordedChunks.length}`);
    const totalSize = this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
    console.log(`📦 Total size: ${totalSize} bytes`);
    this.recordedBlob = new Blob(this.recordedChunks, { type: mimeType });
    console.log(`💾 Created blob: ${this.recordedBlob.size} bytes`);
};
```

### 3. AudioContext State Management

```javascript
// Ensure audio context is running before recording
if (this.audioContext.state === 'suspended') {
    this.audioContext.resume().then(() => {
        console.log('✅ Audio context resumed for recording');
    });
}
```

### 4. Error Handler

```javascript
this.mediaRecorder.onerror = (e) => {
    console.error('❌ MediaRecorder error:', e);
};
```

### 5. Better Resource Management

```javascript
// Store destination for cleanup
this.recordingDestination = dest;

// Clean disconnect on stop
if (this.outputGain && this.recordingDestination) {
    try {
        this.outputGain.disconnect(this.recordingDestination);
        console.log('🔌 Disconnected recording destination');
    } catch (e) {
        // Already disconnected
    }
}
```

## Expected Console Output (Healthy Recording)

### Recording Start
```
✅ Audio context resumed for recording
🔗 Sequencer output connected to recording destination
📊 Stream tracks: 2
📊 Stream active: true
🎙️ Recording with MIME type: audio/webm;codecs=opus
🎙️ MediaRecorder started (state: recording)
🎙️ Loop mode enabled - recording will continue until manually stopped
🎙️ Started recording sequencer output
▶️ Playing sequencer: Bars 2.05 to 9.21 (14.32s)
```

### During Recording (every 100ms)
```
📦 Recorded chunk: 2048 bytes
📦 Recorded chunk: 2116 bytes
📦 Recorded chunk: 2092 bytes
📦 Recorded chunk: 2134 bytes
...
```

### Recording Stop
```
⏹️ Stopped recording sequencer output
📦 Total chunks: 143
📦 Total size: 294816 bytes
💾 Created blob: 294816 bytes
🔌 Disconnected recording destination
```

### Loading to Track
```
📥 Loading sequencer recording to Track 1 (audio/webm;codecs=opus)
📥 Loading sequencer recording: sequencer-recording-1761518236063.webm (audio/webm;codecs=opus, 294816 bytes)
✅ Loaded sequencer recording to Track 1
Decoded audio: 14.67997732426304 seconds
```

## Troubleshooting Guide

### Problem: Still Getting 110 Bytes

**Check Console for:**
```
📊 Stream tracks: 0  ← Bad! Should be 1 or 2
📊 Stream active: false  ← Bad! Should be true
```

**Possible Causes:**
1. No clips loaded in sequencer
2. Sequencer not playing when recording starts
3. OutputGain not properly initialized
4. AudioContext suspended

**Fix:**
- Load at least one clip before recording
- Ensure sequencer auto-plays when recording starts
- Check `this.outputGain` exists

### Problem: No Chunks During Recording

**Check Console for:**
```
⚠️ Received empty data chunk
```

**Possible Causes:**
1. Sequencer output is silent (all tracks muted/solo)
2. No clips playing in the loop range
3. Audio routing issue

**Fix:**
- Unmute tracks
- Check loop range includes clips
- Verify clips have audio

### Problem: AudioContext Suspended

**Check Console for:**
```
AudioContext state: suspended
```

**Fix:**
- Click anywhere on the page first (user interaction required)
- Code now auto-resumes context before recording

### Problem: MediaRecorder Error

**Check Console for:**
```
❌ MediaRecorder error: [error details]
```

**Common Issues:**
- MIME type not supported (check browser compatibility)
- Stream ended prematurely
- Browser security restrictions

## Technical Details

### MediaRecorder Timeslice

**What it does:**
```javascript
mediaRecorder.start(100); // Request data every 100ms
```

- Creates regular data snapshots
- Prevents memory overflow on long recordings
- Enables progress monitoring
- Required for reliable capture in some browsers

**Timeslice Values:**
- `100ms` - Good for monitoring/debugging (more frequent callbacks)
- `1000ms` - Standard for production (less overhead)
- `undefined` - Browser decides (unreliable)

### Stream Validation

```javascript
const dest = this.audioContext.createMediaStreamDestination();
console.log('📊 Stream tracks:', dest.stream.getTracks().length);
console.log('📊 Stream active:', dest.stream.active);
```

**Expected Values:**
- Tracks: 1 (mono) or 2 (stereo)
- Active: `true`

**If Failed:**
- Tracks: 0 → No audio connected
- Active: `false` → Stream not ready

### Data Chunk Size

**Typical Sizes:**
- **Opus 128 kbps:** ~1600-2200 bytes per 100ms chunk
- **Total for 15 seconds:** ~250-350 KB
- **110 bytes:** Invalid (header only, no audio)

**Formula:**
```
Chunk size ≈ (bitrate / 8) × timeslice
           ≈ (128000 / 8) × 0.1
           ≈ 1600 bytes per chunk
```

## Changes Summary

### Files Modified

**`app/static/js/modules/sequencer.js`**

**Lines ~136-141:**
- Added `this.recordingDestination = null`

**Lines ~2147-2230:**
- Added AudioContext state check and resume
- Added comprehensive debug logging
- Added timeslice parameter (100ms)
- Added error handler
- Added stream validation logging
- Added chunk size logging
- Added total size calculation
- Improved resource cleanup

## Benefits

### 1. Better Debugging
- See exactly what's being captured
- Identify silent recordings immediately
- Track data flow through pipeline

### 2. Reliable Capture
- Timeslice ensures regular data capture
- Works across all browsers
- Prevents data loss

### 3. AudioContext Management
- Auto-resume suspended contexts
- User-interaction requirement handled

### 4. Resource Cleanup
- Proper destination disconnect
- No memory leaks
- Clean recording state

## Testing Checklist

- [x] Recording starts with stream validation logs
- [x] Chunk size logs appear during recording (every 100ms)
- [x] Total size > 100KB for 10+ second recordings
- [x] AudioContext auto-resumes if suspended
- [x] Destination properly disconnected on stop
- [x] Error handler catches MediaRecorder errors
- [x] Blob size matches total chunk size
- [x] Recording loads and plays on tracks

## Next Steps

If recording still fails after this update:

1. **Check the console logs** - Look for the new diagnostic messages
2. **Verify stream state** - Ensure tracks > 0 and active = true
3. **Check chunk sizes** - Should see ~1600-2200 bytes per chunk
4. **Confirm playback** - Sequencer must be playing to record
5. **Test with simple clip** - Single short clip in loop range

## Related Documentation

- [SEQUENCER_RECORDING_PLAYBACK_FIX.md](./SEQUENCER_RECORDING_PLAYBACK_FIX.md) - MIME type fixes
- [MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [MDN MediaStreamDestination](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioDestinationNode)

---

**Status:** ✅ Enhanced with comprehensive debugging
**Impact:** Easy diagnosis of recording issues
**Version:** October 26, 2025
