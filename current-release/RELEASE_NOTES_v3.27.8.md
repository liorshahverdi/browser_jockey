# Release Notes - v3.27.8

## Fix Audio Element Volume Restoration After Buffer Playback

**Release Date**: January 5, 2026

---

## 🐛 Bug Fix

### Fixed Silent Playback After Using Timestretch or Reverse Mode

Fixed critical bug where audio would play silently after using timestretched loop playback or reverse mode. The audio element's volume was being muted during buffer-based playback but never restored when switching back to normal playback.

#### Problem
- User enables loop with timestretch → audio plays correctly ✅
- User stops playback → buffer source stopped ✅
- User presses play again → "Audio playing successfully" but **no sound** ❌
- Volume slider shows normal levels, all connections intact, but completely silent

#### Root Cause

When using buffer-based playback (timestretch or reverse mode), the system mutes the audio element to prevent double audio output:

```javascript
// In PlaybackController - startForwardBufferPlayback()
if (this.audioElement) {
    this.audioElement.volume = 0;  // Mute to prevent double playback
}
```

When the user stops playback, the buffer source is properly cleaned up and mode is reset to 'normal':

```javascript
// Stop button handler
playbackController1.isPlaying = false;
playbackController1.mode = 'normal';
// ❌ MISSING: audioElement1.volume = 1;
```

However, the audio element volume was **never restored**. When play is pressed again, since loop is now disabled, it takes the normal MediaElement playback path:

```javascript
// Play button handler
if (!loopState1.enabled) {
    // Use normal MediaElement playback
    audioElement1.play()  // ✅ Succeeds
        .then(() => {
            console.log('✅ Audio playing successfully');  // ✅ Logs success
        });
    // ❌ But audioElement1.volume is still 0!
}
```

The play() promise resolves successfully, all console logs show "✅ Audio playing successfully", all connections are intact, but **no sound** because `volume = 0`.

#### User Impact

**Before Fix:**
1. Load track → works fine
2. Enable loop → works fine  
3. Adjust timestretch slider → buffer playback starts, audio element muted
4. Stop playback → buffer stops, mode reset, **but volume still 0**
5. Press play → "Audio playing successfully" but silent ❌
6. User confused: all indicators show it's playing, but no sound

**After Fix:**
1. Load track → works fine
2. Enable loop → works fine
3. Adjust timestretch slider → buffer playback starts, audio element muted
4. Stop playback → buffer stops, mode reset, **volume restored to 1** ✅
5. Press play → audio plays normally ✅

#### Solution

Added volume restoration in **four critical locations**:

**1. Track 1 Play Button** (app.js line ~4988)
```javascript
} else {
    // Use normal MediaElement playback
    audioElement1.volume = 1; // Restore volume (may have been muted during buffer playback)
    audioElement1.play()
```

**2. Track 1 Stop Button** (app.js line ~5134)
```javascript
playbackController1.isPlaying = false;
playbackController1.mode = 'normal';
audioElement1.volume = 1; // Restore volume (may have been muted during buffer playback)
```

**3. Track 2 Play Button** (app.js line ~5042)
```javascript
} else {
    // Use normal MediaElement playback
    audioElement2.volume = 1; // Restore volume (may have been muted during buffer playback)
    audioElement2.play();
```

**4. Track 2 Stop Button** (app.js line ~5192)
```javascript
playbackController2.isPlaying = false;
playbackController2.mode = 'normal';
audioElement2.volume = 1; // Restore volume (may have been muted during buffer playback)
```

#### Technical Details

**Why Volume Muting is Necessary:**
- Buffer-based playback uses `AudioBufferSourceNode` connected directly to the effects chain
- Audio element continues to exist and would play simultaneously if not muted
- Double audio output would cause phase issues and audio artifacts

**Why Restoration is Critical:**
- When switching back to normal playback (loop disabled, no timestretch), the audio element becomes the active source again
- Without volume restoration, the audio element plays but produces no sound
- All diagnostic indicators (play state, connections, gain values) appear normal, making debugging difficult

**Affected Scenarios:**
1. **Timestretch with Loop**: Adjust stretch slider while loop enabled → triggers buffer playback → mutes audio element
2. **Reverse Mode**: Enable reverse loop → uses buffer playback → mutes audio element
3. **Loop without Timestretch**: If previously timestretched, cached buffer exists → triggers buffer playback

**Console Log Evidence:**
```
✅ Audio playing successfully
🎚️ Track 1 gain value: 0.7071067690849304
🎚️ Master gain value: 1
🎚️ Merger gain value: 1
🔗 Source1 exists: true
🔗 Source1 connected: true
Audio element ready state: 4
Audio element duration: 37.137029
```

All indicators appear normal, but no sound because audio element volume was 0.

#### Files Modified
- `app/static/js/app.js`
  - Track 1 play button handler: Added volume restoration before MediaElement playback
  - Track 1 stop button handler: Added volume restoration after resetting playback mode
  - Track 2 play button handler: Added volume restoration before MediaElement playback
  - Track 2 stop button handler: Added volume restoration after resetting playback mode

#### Testing

**Test Scenario 1: Timestretch Loop Workflow**
1. Load audio file to Track 1
2. Set loop points (A/B markers)
3. Adjust timestretch slider (triggers buffer playback, mutes element)
4. Observe audio playing correctly
5. Press stop button
6. Press play button → **Should hear audio immediately** ✅

**Test Scenario 2: Reverse Mode Workflow**
1. Load audio file to Track 1
2. Set loop points
3. Enable reverse mode (triggers buffer playback, mutes element)
4. Observe reverse playback working
5. Disable reverse mode
6. Press play → **Should hear audio immediately** ✅

**Test Scenario 3: Stop/Play Cycle**
1. Load track, enable loop, apply timestretch
2. Press stop
3. Press play
4. Press stop again
5. Press play again → **Should consistently produce audio** ✅

---

## 📊 Statistics
- **Bug Severity**: Critical (complete audio loss)
- **User Impact**: High (affects common DJ workflow)
- **Lines Changed**: 4 lines added (volume restoration)
- **Files Modified**: 1 (`app.js`)

---

## 🔍 Diagnostic Notes

**How to Identify This Bug:**
- All visual indicators show playback is active
- Console logs show "Audio playing successfully"
- All audio nodes report as connected with non-zero gain
- But absolutely no sound output
- Occurs after using timestretch or reverse mode, then stopping and replaying

**Future Prevention:**
Consider adding defensive volume restoration in:
- `PlaybackController.stopBufferPlayback()` method
- Mode switching functions in PlaybackController
- Any function that transitions from buffer playback to MediaElement playback

---

## 📝 Related Issues
- Complements v3.27.5-v3.27.7 fixes for reverse mode position tracking
- Part of ongoing playback state management improvements
- Related to dual-playback architecture (buffer source + audio element)

---

## ✅ Verification Checklist
- [x] Volume restored when stopping buffer playback
- [x] Volume restored when switching to normal MediaElement playback
- [x] Both tracks (1 and 2) fixed
- [x] Works with timestretch scenarios
- [x] Works with reverse mode scenarios
- [x] No regression in normal playback
- [x] No regression in buffer playback
