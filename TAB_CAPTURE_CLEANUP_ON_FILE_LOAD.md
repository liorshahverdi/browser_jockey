# Tab Capture Cleanup When Loading Files

## Issue
When loading a recorded file (or any file) back to a track that was currently doing tab capture, the user got an error message:
```
"This button controls the audio processing in Browser Jockey, 
but the actual playback happens in the source file"
```

This happened because:
1. Track 1 was capturing tab audio (had `window.tabCaptureState1` set)
2. User recorded the output
3. User clicked "Load to Track 1"
4. The file loaded but **tab capture state wasn't cleared**
5. Play button still thought it was tab capture mode

## Solution
Added **automatic tab capture cleanup** when loading files to a track that's currently capturing. This happens in:

1. **Loading recorded audio** (`loadRecordingToTrack1/2`)
2. **Uploading new files** (`audioFile1/2` change event)

## What Gets Cleaned Up

### Media Stream
- Stop all tracks in `tabCaptureStream1/2`
- Set stream reference to `null`

### Audio Nodes
- Disconnect `tabCaptureSource1/2`
- Disconnect `source1/2`
- Set sources to `null` so new MediaElementSource can be created

### State Variables
- Clear `window.tabCaptureState1/2`
- Reset UI tooltips (play/pause/stop buttons)
- Update file name display

## Code Changes

### File: `app/static/js/visualizer-dual.js`

#### 1. Load Recording to Track 1 (line ~486)
```javascript
async function loadRecordingToTrack1() {
    // ... existing code ...
    
    // Clean up tab capture if Track 1 is currently capturing
    if (window.tabCaptureState1 && window.tabCaptureState1.isTabCapture) {
        console.log('Cleaning up tab capture on Track 1 before loading recording');
        
        // Stop the tab capture stream
        if (tabCaptureStream1) {
            tabCaptureStream1.getTracks().forEach(track => {
                track.stop();
            });
            tabCaptureStream1 = null;
        }
        
        // Disconnect sources
        if (tabCaptureSource1) {
            try {
                tabCaptureSource1.disconnect();
            } catch (e) {
                console.log('Error disconnecting tab capture source:', e);
            }
            tabCaptureSource1 = null;
        }
        
        if (source1) {
            try {
                source1.disconnect();
            } catch (e) {
                console.log('Error disconnecting source1:', e);
            }
            source1 = null;
        }
        
        // Clear state
        window.tabCaptureState1 = null;
        
        // Reset UI
        fileName1.textContent = 'No file loaded';
        playBtn1.title = '';
        pauseBtn1.title = '';
        stopBtn1.title = '';
        
        console.log('✅ Track 1 tab capture cleaned up, ready for file playback');
    }
    
    // ... continue with loading file ...
}
```

#### 2. Load Recording to Track 2 (line ~653)
Same cleanup logic for Track 2.

#### 3. File Upload Handler - Track 1 (line ~3358)
```javascript
audioFile1.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        // Clean up tab capture if Track 1 is currently capturing
        if (window.tabCaptureState1 && window.tabCaptureState1.isTabCapture) {
            // ... same cleanup as above ...
        }
        
        // ... continue with file loading ...
    }
});
```

#### 4. File Upload Handler - Track 2 (line ~3530)
Same cleanup logic for Track 2.

## User Experience

### Before Fix
```
[Track 1 is capturing tab audio from YouTube]
User: Records master output
User: Clicks "Load to Track 1"
[File loads but tab capture state remains]
User: Clicks Play on Track 1
❌ Error: "This button controls the audio processing..."
😕 Confused - file is loaded but can't play it
```

### After Fix
```
[Track 1 is capturing tab audio from YouTube]
User: Records master output
User: Clicks "Load to Track 1"
Console: "Cleaning up tab capture on Track 1 before loading recording"
Console: "✅ Track 1 tab capture cleaned up, ready for file playback"
[Tab capture stream stopped and disconnected]
[File loads as normal audio file]
User: Clicks Play on Track 1
✅ Recording plays normally!
😊 Smooth transition from tab capture to file playback
```

## Testing Scenarios

### Test 1: Load Recording to Tab Capture Track
1. Capture tab audio to Track 1
2. Start master recording
3. Record for 10 seconds, stop
4. Click "Load to Track 1"
5. **Expected:** Console shows cleanup messages
6. **Expected:** File loads, no tab capture warning
7. Click Play
8. **Expected:** Recording plays normally

### Test 2: Upload File to Tab Capture Track
1. Capture tab audio to Track 2
2. Click "Choose File" on Track 2
3. Select any audio file
4. **Expected:** Console shows cleanup messages
5. **Expected:** File loads, replacing tab capture
6. Click Play
7. **Expected:** File plays normally

### Test 3: Switch Between Tab Capture and Files
1. Capture tab to Track 1
2. Upload file to Track 1 (tab capture cleaned up)
3. Play file (works)
4. Capture tab to Track 1 again
5. Load recording to Track 1 (tab capture cleaned up)
6. Play recording (works)

### Test 4: Both Tracks Tab Capturing
1. Capture tab to Track 1 (YouTube)
2. Capture different tab to Track 2 (Spotify)
3. Record master output (both tabs mixed)
4. Load recording to Track 1
5. **Expected:** Track 1 tab capture cleaned up, Track 2 still capturing
6. Load recording to Track 2
7. **Expected:** Track 2 tab capture cleaned up
8. Both tracks now playing the recording file

## Console Logs

### Successful Cleanup
```
Cleaning up tab capture on Track 1 before loading recording
Stopped tab capture track: audio
Disconnected tab capture source
Disconnected existing source1
✅ Track 1 tab capture cleaned up, ready for file playback
Creating object URL from blob
Setting audio element source
Track 1 metadata loaded. Duration: 10.5
Creating MediaElementSource for Track 1
Track 1 audio source connected successfully
Recording successfully loaded to Track 1
```

## Benefits

1. **No More Errors** - Tab capture state properly cleared before loading files
2. **Smooth Transitions** - Users can freely switch between tab capture and file playback
3. **Prevents Leaks** - Media streams properly stopped to free resources
4. **Clear Feedback** - Console logs confirm cleanup happened
5. **Automatic** - No manual steps required from user

## Related Features

This cleanup is essential for:
- ✅ Recording tab capture and playing it back on the same track
- ✅ Switching from tab capture to file upload
- ✅ Loading multiple recordings sequentially
- ✅ Freeing up tab capture resources

## Technical Notes

### Why Disconnect is Important
- `disconnect()` breaks audio graph connections
- Allows new `MediaElementSource` to be created
- Prevents multiple sources trying to use same effect chain

### Why Stop Tracks is Important
- `track.stop()` releases the media stream
- Browser stops capturing tab audio
- Frees system resources
- Prevents ghost streams

### Order Matters
1. Stop tracks first (releases capture)
2. Disconnect sources (breaks audio graph)
3. Clear state (resets UI logic)
4. Load new file (creates fresh setup)

---
**Date:** October 26, 2025  
**Status:** ✅ Implemented and ready for testing  
**Impact:** Enables smooth workflow - record tab capture → load to same track → play
