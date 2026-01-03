# Tab Audio Capture - Quick Start Testing Guide

## Prerequisites

- **Browser:** Chrome, Edge, or Chromium-based browser (desktop)
- **Multiple tabs:** Browser Jockey app + an audio source tab

## Quick Test Scenarios

### Test 1: Basic Capture from YouTube

1. Open YouTube in a new tab
2. Start playing any video with audio
3. Go back to Browser Jockey tab
4. Click "🎵 Capture Tab Audio" button on Track 1
5. In the dialog:
   - Select the YouTube tab
   - ✅ **Check "Share audio"** (important!)
   - Click "Share"
6. ✅ **Expected:** Alert says "Tab audio is now streaming to Track 1!"
7. ✅ **Expected:** Filename shows "🎵 Tab Audio (Live)"
8. ✅ **Expected:** Visualization responds to YouTube audio
9. Adjust volume slider → should affect audio level
10. Click Stop → should stop the capture

### Test 2: Mix Tab Audio with File

1. Capture YouTube audio to Track 1 (as above)
2. Load a local audio file to Track 2
3. Click Play on Track 2
4. Use crossfader to mix between:
   - Left (Track 1 - YouTube)
   - Right (Track 2 - Local file)
5. ✅ **Expected:** Smooth crossfade between both sources

### Test 3: Apply Effects to Tab Audio

1. Capture any web audio to Track 1
2. **Filter:** Move filter slider → should filter the live audio
3. **Reverb:** Increase reverb → should add echo/space
4. **Delay:** Increase delay → should add echo effect
5. **Pan:** Move pan slider → should pan left/right
6. ✅ **Expected:** All effects work in real-time on captured audio

### Test 4: Error Handling

**Test 4a: No Audio Share**
1. Click "🎵 Capture Tab Audio"
2. Select a tab
3. **Don't check** "Share audio"
4. Click Share
5. ✅ **Expected:** Alert says "No audio was captured..."

**Test 4b: Silent Tab**
1. Open a tab with no audio playing
2. Click "🎵 Capture Tab Audio"
3. Select the silent tab, check "Share audio"
4. ✅ **Expected:** Alert says "No audio was captured..."

**Test 4c: Cancel Selection**
1. Click "🎵 Capture Tab Audio"
2. Click "Cancel" in the dialog
5. ✅ **Expected:** No error, operation cancelled gracefully

### Test 5: Stream End Handling

1. Capture YouTube audio to Track 1
2. Go to the YouTube tab
3. Close the YouTube tab
4. Return to Browser Jockey
5. ✅ **Expected:** Filename shows "Tab capture ended"
6. ✅ **Expected:** Stop button is disabled

### Test 6: Both Tracks Capture

1. Open YouTube in Tab A (play Song 1)
2. Open SoundCloud in Tab B (play Song 2)
3. Capture Tab A to Track 1
4. Capture Tab B to Track 2
5. Play both simultaneously
6. Use crossfader to mix
7. ✅ **Expected:** Both captures work independently
8. ✅ **Expected:** Can mix between two live sources

### Test 7: Vocoder/Autotune with Tab Capture

1. Enable microphone
2. Capture web audio to Track 1
3. Enable vocoder with Track 1 as carrier
4. Speak into mic
5. ✅ **Expected:** Mic modulates the captured tab audio

### Test 8: Master Effects on Captured Audio

1. Capture web audio to Track 1
2. Enable master reverb
3. Enable master ADSR envelope
4. ✅ **Expected:** Master effects apply to captured audio

## Common Issues & Solutions

### Issue: "No audio was captured"
**Solution:** Make sure to check "Share audio" checkbox

### Issue: "Tab audio capture is not supported"
**Solution:** Switch to Chrome or Edge browser

### Issue: Audio is choppy/laggy
**Solution:** 
- Close other heavy tabs
- Check internet connection
- Normal for some latency (50-200ms)

### Issue: Capture stopped unexpectedly
**Solution:** Check if source tab still open and playing

### Issue: Effects don't work
**Solution:** 
- Check source tab volume is adequate
- Verify filter cutoff isn't set too low
- Check track volume slider

## Browser Compatibility Check

### ✅ Should Work
- Chrome (latest)
- Edge (latest)
- Opera
- Brave

### ❌ Won't Work
- Firefox (getDisplayMedia audio support limited)
- Safari (no tab audio capture)
- Mobile browsers

## Quick Verification Checklist

- [ ] Capture button appears on Track 1
- [ ] Capture button appears on Track 2
- [ ] Dialog appears when clicking button
- [ ] Can select a tab with audio
- [ ] Audio streams to the selected track
- [ ] Filename changes to "🎵 Tab Audio (Live)"
- [ ] Visualization responds to captured audio
- [ ] Volume control works
- [ ] Pan control works
- [ ] Filter effect works
- [ ] Reverb effect works
- [ ] Delay effect works
- [ ] Stop button stops the capture
- [ ] Can capture to both tracks simultaneously
- [ ] Crossfader works with captured audio
- [ ] Error messages are clear and helpful
- [ ] Stream ends gracefully when source tab closes

## Advanced Testing

### Latency Test
1. Capture audio from a metronome web app
2. Load the same metronome audio file to Track 2
3. Play both simultaneously
4. Listen for delay between them
5. **Note:** Some latency (50-200ms) is expected

### Quality Test
1. Capture high-quality audio (320kbps streaming)
2. Compare to original source
3. Apply effects and verify no distortion
4. **Note:** Quality should be very good in Chromium browsers

### Stress Test
1. Capture audio to Track 1
2. Load file to Track 2
3. Enable microphone
4. Enable vocoder
5. Enable autotune
6. Apply all effects
7. Use crossfader
8. **Expected:** Should handle all features simultaneously

## Success Criteria

✅ **Feature Working If:**
1. Can capture audio from YouTube, Spotify, SoundCloud
2. Captured audio routes through track effects
3. Can mix captured audio with files
4. Stop button cleanly ends capture
5. Error messages are helpful
6. Works in Chrome/Edge
7. No console errors during operation

---

**Happy Testing! 🎵**
