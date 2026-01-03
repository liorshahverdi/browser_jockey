# Master Recording Debug Enhancement

## Issue
User reported that when recording master output with tab capture audio on Track 1, **no waveform was generated** after stopping the recording. The logs showed no errors, but also no waveform decoding logs.

## Investigation

### Original Logs (No Errors, But No Waveform)
```
Theremin button element: <button id=​"enableThereminBtn" ...>
app.js:1408 Capturing tab audio for Track 1
app.js:1436 Tab audio captured with 1 audio track(s)
app.js:2822 Oscilloscope connected to audio merger
recording.js:23 Starting recording with analyser connected: AnalyserNode {...}
app.js:5988 Created MediaElementSource for recorded audio
app.js:6010 Recorded audio connected to oscilloscope and output
app.js:2822 Oscilloscope connected to audio merger
app.js:6020 Recorded audio paused - oscilloscope reconnected to tracks
app.js:2822 Oscilloscope connected to audio merger
app.js:6025 Recorded audio ended - oscilloscope reconnected to tracks
```

### Possible Causes
1. **No audio data captured** - MediaRecorder might be recording silence or empty chunks
2. **MIME type incompatibility** - Hardcoded 'audio/webm' might not work with tab capture streams
3. **Decoding failure** - Silent error when trying to decode the audio buffer
4. **Audio routing issue** - Tab capture audio not flowing through master output

## Solutions Implemented

### 1. Enhanced MIME Type Detection (Like Microphone Recording)
Previously, master recording used a hardcoded MIME type:
```javascript
const options = { mimeType: 'audio/webm' };
```

Now it tries multiple formats:
```javascript
const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/mpeg'
];

let selectedMimeType = null;
for (const mimeType of mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        console.log('Using MIME type for master recording:', mimeType);
        break;
    }
}
```

### 2. Comprehensive Logging Throughout Recording Process

#### A. MediaRecorder Creation
```javascript
console.log('Recording destination stream:', recordingDestination.stream);
console.log('Stream tracks:', recordingDestination.stream.getTracks());
console.log('MediaRecorder created successfully with mimeType:', recordingState.mediaRecorder.mimeType);
```

#### B. Data Availability Tracking
```javascript
recordingState.mediaRecorder.ondataavailable = (event) => {
    console.log('MediaRecorder data available, size:', event.data.size);
    if (event.data.size > 0) {
        recordingState.chunks.push(event.data);
        console.log('Chunk added, total chunks:', recordingState.chunks.length);
    } else {
        console.warn('Received empty data chunk');
    }
};
```

#### C. Recording State Transitions
```javascript
recordingState.mediaRecorder.onstart = () => {
    console.log('MediaRecorder started, state:', recordingState.mediaRecorder.state);
};

recordingState.mediaRecorder.onerror = (event) => {
    console.error('MediaRecorder error event:', event);
    console.error('Error:', event.error);
};
```

#### D. Empty Recording Detection
```javascript
recordingState.mediaRecorder.onstop = () => {
    console.log('MediaRecorder stopped, chunks:', recordingState.chunks.length);
    
    // Calculate total size
    let totalSize = 0;
    recordingState.chunks.forEach((chunk, index) => {
        totalSize += chunk.size;
        console.log(`  Chunk ${index}: ${chunk.size} bytes, type: ${chunk.type}`);
    });
    console.log('Total data size:', totalSize, 'bytes');
    
    if (totalSize === 0) {
        console.error('⚠️ WARNING: No audio data was recorded! The chunks are empty.');
        alert('Recording completed but no audio data was captured...');
    }
}
```

#### E. Detailed Decoding Logs
```javascript
console.log('Starting to decode audio for waveform...');
const reader = new FileReader();
reader.onload = async (e) => {
    try {
        console.log('FileReader loaded, arrayBuffer size:', e.target.result.byteLength);
        const arrayBuffer = e.target.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log('Audio decoded successfully, duration:', audioBuffer.duration, 'channels:', audioBuffer.numberOfChannels);
        console.log('Drawing waveform to canvas...');
        drawWaveform(recordingElements.waveform, audioBuffer);
        console.log('Waveform drawn successfully');
    } catch (err) {
        console.error('Error decoding recorded audio:', err);
        console.error('Error name:', err.name, 'Error message:', err.message);
        alert(`Could not decode recording: ${err.message}...`);
    }
};
```

### 3. User-Friendly Error Messages

If no audio data is captured:
```
Recording completed but no audio data was captured. This can happen if:

1. The audio source is not connected to the master output
2. The volume is muted
3. The audio stream is paused in the source tab

Try:
- Make sure audio is playing in the source tab
- Check master volume is not at 0
- Verify the track is not muted
```

If decoding fails:
```
Could not decode recording: [error message]

The recording file may be corrupted or in an unsupported format.
```

## Testing Instructions

### Test 1: Tab Capture Recording with Audio Playing
1. Open YouTube/Spotify in another tab
2. **Make sure audio is playing**
3. In Browser Jockey, capture tab audio to Track 1
4. Start master recording
5. Let it record for 5-10 seconds
6. Stop recording
7. **Check console logs:**
   - Should see "MediaRecorder data available" with non-zero sizes
   - Should see total data size > 0
   - Should see "Audio decoded successfully"
   - Should see "Waveform drawn successfully"

**Expected Result:** Waveform appears in master recording section

### Test 2: Recording with No Audio (Paused Source)
1. Capture tab audio to Track 1
2. **Pause the audio in the source tab**
3. Start master recording
4. Let it record for 5-10 seconds
5. Stop recording
6. **Check console logs:**
   - Should see "MediaRecorder data available" but with very small sizes (header data)
   - Should see "WARNING: No audio data was recorded!"
   - Should see helpful alert message

**Expected Result:** User gets clear feedback about why recording failed

### Test 3: Recording with Muted Track
1. Capture tab audio to Track 1 (audio playing in source)
2. **Mute the track volume (set to 0)**
3. Start master recording
4. Should capture silence
5. Stop recording
6. **Check console logs:**
   - Should see data being captured
   - May see very small waveform or flat line

**Expected Result:** Recording works but waveform shows silence

### Test 4: MIME Type Detection
1. Capture tab audio
2. Start master recording
3. **Check console immediately:**
   - Should see "Using MIME type for master recording: [format]"
   - Should see "MediaRecorder created successfully with mimeType: [format]"

**Expected Result:** Logs show which MIME type was selected

## New Console Output (Expected)

### Successful Recording
```
Starting recording with analyser connected: AnalyserNode {...}
Recording destination stream: MediaStream {...}
Stream tracks: [MediaStreamTrack, ...]
Using MIME type for master recording: audio/webm;codecs=opus
MediaRecorder created successfully with mimeType: audio/webm;codecs=opus
MediaRecorder.start() called, initial state: recording
MediaRecorder started, state: recording
MediaRecorder data available, size: 4096
Chunk added, total chunks: 1
MediaRecorder data available, size: 8192
Chunk added, total chunks: 2
...
MediaRecorder stopped, chunks: 15
  Chunk 0: 4096 bytes, type: audio/webm;codecs=opus
  Chunk 1: 8192 bytes, type: audio/webm;codecs=opus
  ...
Total data size: 125440 bytes
Created blob, size: 125440, type: audio/webm
Starting to decode audio for waveform...
FileReader loaded, arrayBuffer size: 125440
Audio decoded successfully, duration: 5.234, channels: 2
Drawing waveform to canvas...
Waveform drawn successfully
```

### Failed Recording (No Audio)
```
Starting recording with analyser connected: AnalyserNode {...}
...
MediaRecorder stopped, chunks: 2
  Chunk 0: 48 bytes, type: audio/webm;codecs=opus
  Chunk 1: 52 bytes, type: audio/webm;codecs=opus
Total data size: 100 bytes
⚠️ WARNING: No audio data was recorded! The chunks are empty.
Created blob, size: 100, type: audio/webm
Skipping waveform decode since no audio data was captured
```

## Code Changes Summary

### File: `app/static/js/modules/recording.js`

**Changes:**
1. ✅ Added MIME type detection loop (lines ~23-40)
2. ✅ Added detailed stream/track logging (lines ~24-26)
3. ✅ Enhanced ondataavailable logging (lines ~55-63)
4. ✅ Added onstart handler (lines ~144-146)
5. ✅ Added onerror handler (lines ~141-144)
6. ✅ Added chunk size analysis in onstop (lines ~67-87)
7. ✅ Added empty recording detection with user alert (lines ~78-87)
8. ✅ Enhanced decoding error logging (lines ~107-112)
9. ✅ Added FileReader error handler (lines ~113-115)
10. ✅ Skip decoding if no data captured (lines ~117-119)

**Lines Changed:** ~100 lines modified/added

## Diagnostic Workflow

When a user reports "recording doesn't work":

1. **Check MediaRecorder Creation:**
   - Look for "Using MIME type" log
   - Look for "MediaRecorder created successfully"
   - If not present: MIME type compatibility issue

2. **Check Recording Start:**
   - Look for "MediaRecorder started, state: recording"
   - If not present: MediaRecorder failed to start

3. **Check Data Capture:**
   - Look for "MediaRecorder data available" logs
   - Check chunk sizes - should be hundreds/thousands of bytes
   - If chunks are < 100 bytes: No audio flowing through

4. **Check Total Data Size:**
   - Should be thousands of bytes for even short recordings
   - If < 200 bytes: No audio was captured

5. **Check Decoding:**
   - Look for "Audio decoded successfully"
   - Check duration and channels
   - If error: Codec/format issue

6. **Check Waveform Drawing:**
   - Look for "Waveform drawn successfully"
   - If not present: Canvas/rendering issue

## Related Issues & Solutions

### Issue: Tab capture audio not flowing to master
**Solution:** Verify audio graph connections in `initAudioContext()`:
```javascript
gainMaster.connect(recordingDestination);  // Line ~2609
```

### Issue: Audio playing but recording silence
**Possible causes:**
- Master volume at 0
- Track volume at 0
- Audio source paused in source tab
- Audio context suspended

**Check:**
```javascript
console.log('Master gain value:', gainMaster.gain.value);
console.log('Audio context state:', audioContext.state);
```

### Issue: Waveform shows but no audio when playing back
**Possible causes:**
- Decoding succeeded but blob is corrupted
- Audio element not properly connected
- Volume controls not working

## Browser Compatibility

| Browser | MIME Type Support | Tab Capture | Master Recording |
|---------|------------------|-------------|------------------|
| Chrome  | ✅ audio/webm;codecs=opus | ✅ | ✅ |
| Edge    | ✅ audio/webm;codecs=opus | ✅ | ✅ |
| Firefox | ✅ audio/ogg;codecs=opus  | ⚠️ Limited | ✅ |
| Safari  | ⚠️ audio/mp4              | ❌ | ✅ (files only) |

---
**Date:** October 26, 2025  
**Status:** ✅ Enhanced logging implemented  
**Next Step:** User testing to identify actual failure point
