# Tab Audio Capture Feature

**Date:** October 26, 2025  
**Feature:** Real-time audio capture from browser tabs to DJ tracks

## Overview

This feature allows users to capture audio playing in another browser tab and route it to Track 1 or Track 2 in real-time. This enables DJs to:

- Mix audio from streaming services (YouTube, Spotify, SoundCloud, etc.)
- Apply effects to live broadcasts or podcasts
- Layer effects on web-based synthesizers or music apps
- Create mashups with online audio sources

## How It Works

### User Flow

1. **Click "🎵 Capture Tab Audio" button** on Track 1 or Track 2
2. **Browser shows tab picker dialog**
   - Select the tab playing audio
   - **Important:** Check the "Share audio" checkbox
   - Click "Share"
3. **Audio streams to the track** in real-time
4. **Apply effects** using the track's controls (volume, pan, filter, reverb, delay, etc.)
5. **Mix with other tracks** using the crossfader
6. **Click Stop** to end the capture

### Technical Implementation

#### Browser API Used
- **`navigator.mediaDevices.getDisplayMedia()`** with audio constraints
- Supported in Chrome, Edge, and other Chromium-based browsers
- Requires user permission and active user gesture

#### Audio Routing

```
Browser Tab Audio
    ↓
MediaStream (captured)
    ↓
MediaStreamSource (Web Audio API)
    ↓
Track Effects Chain (Gain → Pan → Filter → Reverb → Delay)
    ↓
Merger → Master Effects → Output
```

#### Key Differences from File Loading

| Feature | File Loading | Tab Capture |
|---------|-------------|-------------|
| Source | Audio file from disk | Live audio stream |
| Playback Control | Play/Pause/Stop | Stop only (live stream) |
| Looping | ✅ Supported | ❌ Not available |
| Waveform Display | ✅ Shows full waveform | ❌ Live stream only |
| Export | ✅ Can export | ❌ Cannot export directly |
| Effects | ✅ All effects work | ✅ All effects work |
| BPM/Key Detection | ✅ Automatic | ❌ Not available |

## Code Changes

### HTML Changes (`app/templates/index.html`)

Added capture buttons for both tracks:

```html
<!-- Track 1 -->
<button id="captureTabAudio1" class="upload-btn" title="Capture audio from another browser tab">
    <span>🎵 Capture Tab Audio</span>
</button>

<!-- Track 2 -->
<button id="captureTabAudio2" class="upload-btn" title="Capture audio from another browser tab">
    <span>🎵 Capture Tab Audio</span>
</button>
```

### JavaScript Changes (`app/static/js/app.js`)

#### New DOM References

```javascript
const captureTabAudio1 = document.getElementById('captureTabAudio1');
const captureTabAudio2 = document.getElementById('captureTabAudio2');
```

#### New State Variables

```javascript
let tabCaptureStream1 = null;
let tabCaptureStream2 = null;
let tabCaptureSource1 = null;
let tabCaptureSource2 = null;
```

#### New Function: `captureTabAudio(trackNumber)`

**Purpose:** Captures audio from a browser tab and routes it to a track

**Parameters:**
- `trackNumber` (1 or 2) - Which track to route the audio to

**Process:**
1. Check browser support for `getDisplayMedia`
2. Request display media with audio constraints
3. Validate that audio track exists
4. Initialize audio context if needed
5. Create `MediaStreamSource` from the captured stream
6. Connect to track's effect chain
7. Update UI (disable play/loop controls, enable stop)
8. Set up stream end handler
9. Start visualization

**Error Handling:**
- `NotAllowedError` - Permission denied by user
- `NotFoundError` - No audio source in selected tab
- `AbortError` - User cancelled selection
- Generic errors with descriptive messages

#### Event Listeners

```javascript
if (captureTabAudio1) {
    captureTabAudio1.addEventListener('click', () => captureTabAudio(1));
}

if (captureTabAudio2) {
    captureTabAudio2.addEventListener('click', () => captureTabAudio(2));
}
```

#### Stop Button Enhancement

Updated stop button handlers to clean up tab capture:

```javascript
stopBtn1.addEventListener('click', () => {
    // ... existing code ...
    
    // Stop tab capture if active
    if (tabCaptureStream1) {
        tabCaptureStream1.getTracks().forEach(track => track.stop());
        tabCaptureStream1 = null;
    }
    if (tabCaptureSource1) {
        try {
            tabCaptureSource1.disconnect();
        } catch (e) {
            console.log('Error disconnecting tab capture source:', e);
        }
        tabCaptureSource1 = null;
        source1 = null;
    }
    if (fileName1.textContent.includes('Tab Audio')) {
        fileName1.textContent = 'No file selected';
        stopBtn1.disabled = true;
    }
});
```

## Usage Examples

### Example 1: DJ Mix with YouTube
1. Open YouTube in another tab, start playing a song
2. In Browser Jockey, click "🎵 Capture Tab Audio" on Track 1
3. Select the YouTube tab, ensure "Share audio" is checked
4. The YouTube audio now streams to Track 1
5. Load a local file on Track 2
6. Use crossfader to mix between YouTube and local file

### Example 2: Live Effects on Podcast
1. Open a podcast streaming site in another tab
2. Capture the audio to Track 1
3. Apply reverb, delay, and filter effects in real-time
4. Record your mic commentary on Track 2
5. Mix and fade between podcast and your voice

### Example 3: Web Synth Layering
1. Open a web-based synthesizer (like WebSynths.com)
2. Capture the synth output to Track 1
3. Load a drum loop on Track 2
4. Apply different effects to each track
5. Use crossfader for transitions

## Browser Compatibility

### Supported Browsers
- ✅ Google Chrome (desktop)
- ✅ Microsoft Edge (desktop)
- ✅ Opera (desktop)
- ✅ Brave (desktop)
- ✅ Other Chromium-based browsers

### Not Supported
- ❌ Firefox (limited getDisplayMedia audio support)
- ❌ Safari (no tab audio capture)
- ❌ Mobile browsers (no screen/tab sharing)

### Feature Detection

The app checks for browser support before attempting capture:

```javascript
if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    alert('❌ Tab audio capture is not supported in your browser.');
    return;
}
```

## Limitations

### Technical Limitations

1. **No Waveform Display** - Live streams don't have a known duration/waveform
2. **No Looping** - Can't set A-B loop points on live audio
3. **No Direct Export** - Can't export the captured stream directly (but you can record the master output)
4. **No BPM Detection** - Requires full audio buffer
5. **No Play/Pause** - Live stream is always "playing" until stopped

### User Experience Considerations

1. **Must check "Share audio"** - Easy to forget in the picker dialog
2. **Tab must have audio** - Silent tabs won't provide audio tracks
3. **Stream ends when tab closes** - Closing the source tab stops the capture
4. **Latency** - Some audio latency is unavoidable (typically 50-200ms)

## Troubleshooting

### "No audio was captured from the selected tab"

**Causes:**
- Forgot to check "Share audio" checkbox
- Selected a window/screen instead of a tab
- Tab is not playing any audio

**Solution:**
1. Click "🎵 Capture Tab Audio" again
2. Select a **tab** (not window/screen)
3. Check the **"Share audio"** checkbox
4. Make sure the tab is actively playing audio

### "Tab audio capture is not supported"

**Cause:** Using unsupported browser

**Solution:** Use Chrome, Edge, or another Chromium-based browser

### "Audio is delayed/laggy"

**Cause:** Normal browser audio processing latency

**Solution:** 
- Some latency is unavoidable with tab capture
- Try using a wired connection if on WiFi
- Close other heavy browser tabs

### "Capture stopped suddenly"

**Causes:**
- Source tab was closed
- Source tab navigated to a different page
- User stopped sharing from the source tab

**Solution:** Restart the capture with the correct tab

### "Effects don't seem to work"

**Cause:** Source audio might be very quiet or very loud

**Solution:**
- Adjust the source tab's volume
- Use the track volume slider
- Check filter cutoff isn't too low

## Future Enhancements

### Potential Improvements

- [ ] **Recording support** - Record the captured tab audio
- [ ] **Visual feedback** - Show audio level meter for captured stream
- [ ] **Auto-reconnect** - Option to automatically reconnect if stream drops
- [ ] **Multiple tab mixing** - Capture from multiple tabs simultaneously
- [ ] **Screen audio option** - Capture all system audio (where supported)
- [ ] **Latency adjustment** - Manual latency compensation control
- [ ] **Stream preview** - Preview audio before routing to track

### Advanced Features

- [ ] **Real-time BPM detection** - Analyze live stream for tempo
- [ ] **Buffer and loop** - Option to buffer captured audio for looping
- [ ] **Stem recording** - Record the processed track output
- [ ] **Auto-ducking** - Automatically lower tab audio when mic is active

## Security & Privacy

### Permissions Required
- Screen/tab sharing permission (user must grant via browser dialog)
- Audio capture from the selected tab only

### Privacy Notes
- Only captures audio from the **selected tab**
- Does not record screen content (video track is discarded)
- User must explicitly grant permission each time
- User can see which tab is being shared (browser indicator)
- Capture can be stopped at any time by clicking Stop or closing the source tab

### Best Practices
- Always inform users if you're capturing their audio
- Respect copyright when using audio from streaming services
- Use for personal/educational purposes or ensure proper licensing

## Testing Checklist

- [x] Capture audio from YouTube tab
- [x] Capture audio from Spotify Web Player
- [x] Capture audio from SoundCloud
- [x] Apply effects to captured audio (reverb, delay, filter)
- [x] Mix captured audio with file-based track using crossfader
- [x] Stop capture using Stop button
- [x] Handle stream end when source tab closes
- [x] Test error messages (no audio shared, permission denied)
- [x] Verify browser compatibility detection
- [x] Check audio quality and latency
- [x] Test with microphone crossfader mode
- [x] Verify vocoder/autotune compatibility

## Known Issues

None currently identified.

## Credits

**Implementation:** Browser Jockey Development Team  
**API:** Web Audio API + Screen Capture API (getDisplayMedia)  
**Browser Support:** Chromium project

---

**Note:** This feature requires a modern Chromium-based browser. Always ensure you have permission to capture and use audio from other sources.
