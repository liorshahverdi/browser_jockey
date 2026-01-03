# Release Notes - v3.26.2

**Release Date:** January 2, 2026  
**Type:** Bug Fix Release

## Critical Fixes

### Theremin Track Modulation (Critical Bug Fix)
Fixed critical issue where camera theremin was not modulating Track 1/Track 2 audio signals despite showing active parameter values in console logs.

**Root Cause:**
- `gain1.disconnect(merger)` failed with `InvalidAccessError` when track wasn't directly connected to merger
- Left track connected to both normal audio path AND theremin path simultaneously
- Full-volume normal signal drowned out low-volume (15-25%) theremin-modulated signal
- Users heard only unmodulated playback despite theremin being active

**Solution:**
- Changed from specific disconnect (`disconnect(merger)`) to complete disconnect (`disconnect()`)
- Ensures track disconnects from ALL outputs before routing through theremin
- Only theremin-modulated signal reaches speakers when theremin is active
- Track properly reconnects to normal path when theremin disabled/switched

**Code Changes:**
- `theremin.js` line 1083: `externalSourceNode.disconnect()` (was `disconnect(merger)`)
- `theremin.js` line 1019: Restore logic uses `disconnect()` then `connect(merger)`
- `theremin.js` line 242: Disable logic uses `disconnect()` then `connect(merger)`

**User Experience:**
- **Before:** No audible modulation when theremin enabled on track
- **After:** Clear filter sweeps and volume control via hand motion
- Applies identically to both Track 1 and Track 2
- Seamless switching between normal playback and theremin modulation

### Theremin Activation Requirements (UX Enhancement)
Simplified activation requirements for track modulation mode vs. oscillator mode.

**Previous Behavior:**
- Required "waving" motion (repeated back-and-forth hand movement) for all sources
- Wave detection needed 2+ direction changes, 15% screen range, significant total movement
- Counterintuitive for track modulation (users expect immediate response)

**New Behavior:**
- **Track/Sequencer Mode:** Activates immediately on hand detection (no waving required)
- **Oscillator Mode:** Still requires wave motion (prevents accidental sound generation)
- More natural workflow: hold hand still to modulate existing audio, wave to play oscillator

**Code Changes:**
- `theremin.js` lines 515-524: Source-type conditional activation logic
- External sources (`track1`, `track2`, `sequencer`): `shouldPlaySound = handDetected`
- Oscillator source: `shouldPlaySound = handDetected && waveActive` (original behavior)

**Console Logging:**
- `🔊 Theremin sound active!` when modulation starts
- `🎛️ External source: Filter=XXXXHz, Volume=XX%` every second (shows live values)
- `🔇 Fading out theremin: handDetected=false` when hand removed
- Helps users understand activation state and parameter changes

### Stop Button Buffer Cleanup (Reliability Fix)
Fixed incomplete cleanup when stop buttons pressed during buffer-based playback.

**Issue:**
- Stop buttons only paused audio element, didn't cleanup PlaybackController buffer sources
- Reverse/timestretched buffers continued playing silently in background
- Could cause resource leaks and unexpected behavior on next playback

**Solution:**
- Added buffer source cleanup to both Track 1 and Track 2 stop buttons
- Stops buffer source with `stop()`, disconnects from graph, nullifies reference
- Resets `playbackController.isPlaying` and `mode` to clean state

**Code Changes:**
- `app.js` lines 5132-5147: Track 1 stop button buffer cleanup
- `app.js` lines 5184-5199: Track 2 stop button buffer cleanup (identical logic)

### Loop Disable During Playback (Edge Case Fix)
Fixed issue where disabling loop during buffer playback didn't properly stop looping.

**Issue:**
- Loop disable tried to set `bufferSource.loop = false`
- AudioBufferSourceNode properties are immutable after `start()` called
- Buffer continued looping despite loop markers being cleared
- `handleLoopPlayback` continued enforcing bounds with stale loop state

**Solution:**
- Stop buffer source completely when loop disabled
- Switch to audio element for non-looping playback
- Clear loop points BEFORE stopping buffer (prevents race condition)
- Resume playback at current position on audio element

**Code Changes:**
- `app.js` lines 5251-5281: Track 1 loop disable logic
- `app.js` lines 5315-5345: Track 2 loop disable logic (identical)
- Order: Clear loop points → Stop buffer → Switch to audio element → Resume

### Loop Marker Dragging During Playback (Buffer Recreation)
Fixed lack of buffer recreation when dragging loop markers during timestretched/reverse playback.

**Issue:**
- Dragging loop markers updated `playbackController.setLoopPoints()`
- Timestretched/reversed buffers not regenerated with new loop boundaries
- Audio continued playing with old loop region until timestretch slider moved

**Solution:**
- Detect if playback is active in buffer mode during marker drag mouseup
- Call `applyStretchToTrack()` to regenerate timestretched buffer with new boundaries
- Seamless transition to new loop region without interruption

**Code Changes:**
- `app.js` lines 4719-4726: Track 1 buffer recreation on marker drag
- `app.js` lines 4730-4737: Track 2 buffer recreation on marker drag

## Technical Details

### Affected Modules
- `app/static/js/modules/theremin.js` - Track routing and activation logic
- `app/static/js/app.js` - Stop buttons, loop disable, marker dragging

### Audio Graph Routing
**Normal Playback:**
```
source1/2 → gain1/2 → merger → masterGain → destination
```

**Theremin Modulation:**
```
source1/2 → gain1/2 → sourceGain → filter → gainNode → routingGain → merger → destination
                  (disconnected from merger during modulation)
```

### Browser Compatibility
- No changes to browser requirements
- Tested on Chrome 131+ (Web Audio API disconnect behavior)

## Upgrade Notes

- **No breaking changes** - All existing functionality preserved
- Users will notice immediate improvement in theremin responsiveness
- Track modulation now works as documented in v3.11.0 release notes

## Related Documentation
- [CAMERA_THEREMIN_FEATURE.md](CAMERA_THEREMIN_FEATURE.md) - Theremin feature documentation
- [AUDIO_CONTEXT_INIT_FIX.md](AUDIO_CONTEXT_INIT_FIX.md) - Audio routing architecture
- [README.md](README.md) - Main application documentation

## Contributors
- Fixed by: GitHub Copilot
- Tested by: lshahverdi

---

**Previous Version:** v3.26.1  
**Next Version:** TBD
