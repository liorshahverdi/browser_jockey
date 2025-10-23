# Testing Guide - After Refactoring

## 🧪 How to Test the Refactored Code

Before deploying, you should test all features to ensure the refactoring didn't break anything.

## 🚀 Quick Start Test

1. **Start the server:**
   ```bash
   python run.py
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:5000` (or your configured port)
   - Open browser console (F12) to watch for errors

## ✅ Testing Checklist

### Phase 1 Features (Previously Working)

#### 1. Audio Loading & Playback
- [ ] Load an audio file to Track 1
- [ ] Load an audio file to Track 2
- [ ] Play/Pause both tracks
- [ ] Adjust volume for each track
- [ ] Verify waveform displays correctly

#### 2. Loop Controls
- [ ] Click to set loop start point
- [ ] Click to set loop end point
- [ ] Verify loop plays correctly
- [ ] Test reverse loop button
- [ ] Clear loop points

#### 3. Audio Effects
- [ ] Enable reverb on Track 1
- [ ] Adjust reverb wet/dry mix
- [ ] Enable delay on Track 2
- [ ] Adjust delay time and feedback
- [ ] Test filter controls

#### 4. Recording
- [ ] Click Start Recording
- [ ] Play some audio
- [ ] Click Stop Recording
- [ ] Download recording as WAV
- [ ] Download recording as MP3
- [ ] Load recording to Track 2

#### 5. Keyboard Sampler
- [ ] Select a track as sampler source
- [ ] Choose a scale (major/minor/chromatic)
- [ ] Enable sampler
- [ ] Play notes using keyboard (A-K keys)
- [ ] Adjust sampler volume
- [ ] Disable sampler

#### 6. Audio Analysis
- [ ] Verify BPM detection displays
- [ ] Verify musical key detection displays
- [ ] Check waveform zoom functionality

### Phase 2 Features (Newly Refactored)

#### 7. Microphone Input
- [ ] Click "Enable Microphone"
- [ ] Grant microphone permissions
- [ ] Verify microphone waveform displays
- [ ] Adjust microphone volume slider
- [ ] Check "Monitor" checkbox (hear yourself)
- [ ] Uncheck "Monitor" checkbox
- [ ] Disable microphone

#### 8. Vocoder Effect
- [ ] Enable microphone first
- [ ] Select carrier source (Track 1, Track 2, or Mic)
- [ ] Click "Enable Vocoder"
- [ ] Speak/sing into microphone
- [ ] Verify vocoder effect is audible
- [ ] Adjust vocoder mix slider
- [ ] Adjust number of bands slider
- [ ] Change carrier source
- [ ] Disable vocoder

#### 9. Autotune Effect
- [ ] Enable microphone first
- [ ] Click "Enable Autotune"
- [ ] Speak/sing into microphone
- [ ] Verify pitch correction is audible
- [ ] Adjust strength slider (0-100%)
- [ ] Change musical key (C, D, E, etc.)
- [ ] Change scale (Major/Minor)
- [ ] Disable autotune

### Integration Tests

#### 10. Combined Features
- [ ] Use microphone + vocoder + autotune together
- [ ] Record while using microphone effects
- [ ] Use sampler while tracks are playing
- [ ] Mix all three: tracks + mic + sampler
- [ ] Verify no audio glitches or distortion

#### 11. Error Handling
- [ ] Try enabling vocoder without microphone (should show alert)
- [ ] Try enabling autotune without microphone (should show alert)
- [ ] Load invalid audio file (should handle gracefully)
- [ ] Rapidly enable/disable features (should not crash)

#### 12. Performance
- [ ] Check CPU usage in browser task manager
- [ ] Play audio for 5+ minutes (check for memory leaks)
- [ ] Enable multiple effects simultaneously
- [ ] Verify smooth waveform animation

## 🐛 What to Look For

### In Browser Console (F12)
- ❌ No red error messages
- ✅ Only informational logs (green/blue)
- ✅ Module loading messages
- ✅ Feature enable/disable messages

### Common Issues to Check
1. **Import Errors**: Module not found or import syntax errors
2. **Undefined References**: Variables/functions not accessible
3. **Audio Glitches**: Crackling, popping, or stuttering
4. **Memory Leaks**: Browser slowing down over time
5. **UI Responsiveness**: Buttons/sliders not responding

## 📊 Expected Console Output

When features are enabled, you should see:
```
Microphone enabled successfully
Vocoder enabled with 16 bands
Auto-tune enabled
Recording started
```

## 🔧 Troubleshooting

### If Microphone Doesn't Work:
1. Check browser permissions (click lock icon in address bar)
2. Ensure microphone is not used by another app
3. Try refreshing the page
4. Check console for specific error messages

### If Vocoder/Autotune Doesn't Work:
1. Ensure microphone is enabled first
2. Check that a carrier source is selected for vocoder
3. Verify audio is playing from the carrier source
4. Check console for error messages

### If Modules Don't Load:
1. Verify the HTML file has `<script type="module">`
2. Check that all `.js` files exist in the modules folder
3. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
4. Check browser console for import errors

## ✅ Success Criteria

All tests pass if:
- ✅ No console errors
- ✅ All features work as expected
- ✅ Audio quality is good (no glitches)
- ✅ UI is responsive
- ✅ No memory leaks over time
- ✅ All module imports work correctly

## 📝 Reporting Issues

If you find any issues:
1. Note which feature is affected
2. Copy the console error message
3. Note the browser and version
4. Document steps to reproduce
5. Check if issue existed before refactoring

## 🎉 When Testing is Complete

Once all features work correctly:
1. Commit the changes
2. Deploy to production
3. Monitor for any user-reported issues
4. Celebrate the successful refactoring! 🎊

---

**Note:** The refactoring should NOT have changed any functionality. If something doesn't work, it's likely a minor issue that can be quickly fixed by checking the console error messages.
