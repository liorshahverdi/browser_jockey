# Panning Fix - Test Instructions

## Quick Test Procedure

### Prerequisites
1. Browser Jockey application running at http://localhost:5001
2. Audio file loaded (any format: MP3, FLAC, WAV, etc.)
3. Headphones or stereo speakers

### Test 1: Basic Panning (Track 1)

1. **Load audio to Track 1**
   - Click "Choose File" for Track 1
   - Select any audio file
   - Click "Load to Track 1"

2. **Play audio**
   - Click Play button for Track 1
   - Verify audio plays normally

3. **Test center pan**
   - Ensure pan slider is at center (0%)
   - **Expected:** Audio plays equally in both left and right speakers
   - **Verify:** ✅ Balanced sound

4. **Test full left pan**
   - Move pan slider all the way to left (-100%)
   - **Expected:** Audio only in left speaker/headphone
   - **Verify:** ✅ Right speaker silent, left speaker has audio

5. **Test full right pan**
   - Move pan slider all the way to right (+100%)
   - **Expected:** Audio only in right speaker/headphone
   - **Verify:** ✅ Left speaker silent, right speaker has audio

6. **Test smooth panning**
   - Slowly move pan slider from left to right
   - **Expected:** Sound smoothly moves from left to right
   - **Verify:** ✅ No volume dips, no audio cutting out

### Test 2: Panning with Effects

1. **Enable effects** (while audio is playing and panned)
   - Enable EQ (adjust low/mid/high)
   - Enable reverb (adjust wetness)
   - Enable delay
   - Enable pitch shift
   - Enable time stretch (change tempo)

2. **Test panning with each effect**
   - Move pan slider to full left
   - Move pan slider to full right
   - **Expected:** Panning still works correctly with effects active
   - **Verify:** ✅ Effects don't interfere with panning

### Test 3: Dual Track Panning

1. **Load audio to both tracks**
   - Load different audio files to Track 1 and Track 2

2. **Play both tracks**
   - Start playback on both tracks

3. **Test independent panning**
   - Pan Track 1 to full left
   - Pan Track 2 to full right
   - **Expected:** Track 1 audio in left speaker, Track 2 in right
   - **Verify:** ✅ Independent panning works

4. **Cross panning**
   - Pan Track 1 to full right
   - Pan Track 2 to full left
   - **Expected:** Positions swap correctly
   - **Verify:** ✅ No interference between tracks

### Test 4: Master Panning

1. **With both tracks playing**
   - Set Track 1 pan to center
   - Set Track 2 pan to center

2. **Test master pan**
   - Move Master pan slider to full left
   - **Expected:** Both tracks move to left speaker
   - **Verify:** ✅ Master pan affects combined output

3. **Combined panning**
   - Pan Track 1 to slight left (-30%)
   - Pan Track 2 to slight right (+30%)
   - Pan Master to full right
   - **Expected:** Entire mix shifts right, maintaining relative positions
   - **Verify:** ✅ Master and track panning work together

### Test 5: Console Verification

1. **Open browser console** (F12 or Cmd+Option+I)

2. **Move pan slider**
   - Adjust any pan slider

3. **Check console output**
   - Look for messages like: `🎚️ Pan: 1.00 | L: 0.00, R: 1.00`
   - **Expected:** Gain values update correctly
     - At full left (-1.0): L: 1.00, R: 0.00
     - At center (0.0): L: 0.71, R: 0.71 (constant-power)
     - At full right (1.0): L: 0.00, R: 1.00
   - **Verify:** ✅ Console shows correct gain calculations

### Test 6: Mono vs Stereo Sources

1. **Test with stereo file** (most music files)
   - Load stereo audio
   - Test panning as above
   - **Verify:** ✅ Panning works correctly

2. **Test with mono file** (microphone recording)
   - Record microphone or load mono file
   - Test panning as above
   - **Verify:** ✅ Panning works correctly (mono upmixed to stereo)

## Expected Results Summary

### ✅ PASS Criteria

- [ ] Audio audible at all pan positions (-100% to +100%)
- [ ] Full left: audio only in left speaker
- [ ] Center: audio balanced in both speakers
- [ ] Full right: audio only in right speaker
- [ ] Smooth transitions with no volume dips
- [ ] No audio cutting out or disappearing
- [ ] Works with all effects enabled
- [ ] Independent panning per track
- [ ] Master panning affects combined output
- [ ] Console shows correct gain values
- [ ] Works with both mono and stereo sources

### ❌ FAIL Indicators

- Audio disappears at extreme positions
- Volume drops at center position
- Clicking or popping during pan changes
- Effects disable panning
- One track affects another's panning
- Console shows incorrect gain values
- Different behavior for mono vs stereo

## Troubleshooting

### If panning doesn't work:

1. **Hard refresh browser**
   - Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Clears cached JavaScript

2. **Check console for errors**
   - Look for red error messages
   - Check for connection issues

3. **Verify audio is playing**
   - Volume slider not at zero
   - Gain values in console are non-zero

4. **Test isolated panning**
   - Open `test_panning.html` in browser
   - Verify basic Web Audio API panning works

## Advanced Testing

### Waveform Visualization (Optional)

If you want to visualize that panning is actually working:

1. **Enable oscilloscope** (if available in app)
2. **Pan to full left**
   - Should see waveform only in left channel
3. **Pan to full right**
   - Should see waveform only in right channel

### Analyser Test (Developer)

```javascript
// In browser console
const analyser = audioContext.createAnalyser();
panner1.output.connect(analyser);
analyser.fftSize = 2048;
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteTimeDomainData(dataArray);
console.log('Waveform data:', dataArray);
```

## Success Confirmation

If all tests pass:
- ✅ Panning functionality fully restored
- ✅ Professional-grade audio quality
- ✅ No phase or interference issues
- ✅ Compatible with all effects
- ✅ Works with all audio sources

## Report Issues

If any test fails:
1. Note which specific test failed
2. Check browser console for errors
3. Document exact steps to reproduce
4. Include audio file type and characteristics
5. Report browser version and OS

---

**Document Version:** 1.0  
**Last Updated:** December 30, 2025  
**Related:** PANNING_FIX_RELEASE_NOTES.md
