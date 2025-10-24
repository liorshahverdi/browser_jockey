# WebM Loop Marker Fix

## Problem
When loading a recorded .webm file to Track 1 or Track 2, loop markers were not setting when clicking on the waveform. This was caused by the audio element's `duration` property not being available or being set to `NaN`/`Infinity` before the metadata was fully loaded.

## Root Cause
WebM files (especially those created from MediaRecorder) don't always have duration metadata immediately available when the source is set. The code was attempting to calculate loop marker positions using `audioElement.duration` before the metadata was loaded, resulting in:
- `NaN` calculations for time positions
- Loop markers silently failing to set
- No error messages to indicate the issue

## Solution

### 1. Added Duration Validation in Waveform Click Handlers
Added validation checks before attempting to set loop markers to ensure the duration is valid:

**Track 1 (line ~2670):**
```javascript
// Check if duration is valid before proceeding
if (!audioElement1.duration || isNaN(audioElement1.duration) || !isFinite(audioElement1.duration)) {
    console.warn('Cannot set loop markers: audio duration not yet available');
    return;
}
```

**Track 2 (line ~2780):**
```javascript
// Check if duration is valid before proceeding
if (!audioElement2.duration || isNaN(audioElement2.duration) || !isFinite(audioElement2.duration)) {
    console.warn('Cannot set loop markers: audio duration not yet available');
    return;
}
```

### 2. Wait for Metadata Before Continuing Load Process
Modified both `loadRecordingToTrack1()` and `loadRecordingToTrack2()` functions to wait for the `loadedmetadata` event before proceeding:

```javascript
// Wait for metadata to load before proceeding
await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for audio metadata'));
    }, 5000); // 5 second timeout
    
    audioElement.addEventListener('loadedmetadata', () => {
        clearTimeout(timeoutId);
        console.log('Metadata loaded. Duration:', audioElement.duration);
        resolve();
    }, { once: true });
    
    audioElement.addEventListener('error', (e) => {
        clearTimeout(timeoutId);
        reject(new Error('Error loading audio metadata: ' + e.message));
    }, { once: true });
    
    audioElement.load(); // Explicitly load the audio
});
```

## Benefits
- **Prevents silent failures**: Now provides console warnings when duration is not available
- **Ensures metadata is loaded**: Waits for metadata before allowing loop marker operations
- **Better error handling**: 5-second timeout with clear error messages
- **Works with WebM files**: Properly handles files from MediaRecorder that may have delayed metadata
- **Consistent behavior**: Same validation logic for both Track 1 and Track 2

## Testing
To test the fix:
1. Record audio using the microphone or master recording feature
2. Load the recording to Track 1 or Track 2
3. Enable loop mode by clicking the loop button
4. Click on the waveform to set loop start and end points
5. Verify that loop markers appear and the loop region is visible
6. Play the audio to confirm the loop is working correctly

## Files Modified
- `/app/static/js/visualizer-dual.js`
  - Modified waveform click handler for Track 1 (added duration validation)
  - Modified waveform click handler for Track 2 (added duration validation)
  - Modified `loadRecordingToTrack1()` function (added metadata wait)
  - Modified `loadRecordingToTrack2()` function (added metadata wait)

## Date
October 24, 2025
