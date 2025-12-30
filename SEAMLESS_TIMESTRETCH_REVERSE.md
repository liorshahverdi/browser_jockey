# Seamless Timestretching + Reverse Mode Integration (v3.23)

## Overview
Implemented seamless integration between timestretching and reverse playback modes, allowing users to toggle between forward and reverse playback while maintaining timestretched audio quality.

## Problem Solved
Previously, when switching between normal and reverse modes with timestretching enabled:
- Different cached buffers were created for forward vs reversed timestretching
- Mode switching would sometimes use non-timestretched buffers
- User experience was inconsistent when toggling reverse button

## Solution Architecture

### 1. Dual Buffer Storage
**Modified:** `playback-controller.js`
- Added `timestretchedBuffer` property (stores forward timestretched audio)
- Added `timestretchedBufferReversed` property (stores reversed timestretched audio)
- Both buffers are pre-rendered and ready for instant mode switching

### 2. Unified Rendering Strategy
**Modified:** `app.js` - `applyStretchToTrack()`
- Always creates forward timestretched buffer first (`isReverse = false`)
- Creates reversed version by calling `audioBufferMgr.reverseAudioBuffer(stretchedBuffer)`
- Stores both versions in PlaybackController
- Eliminates separate cache entries for forward/reverse modes

**Code Flow:**
```javascript
// 1. Create forward timestretched buffer
const stretchedBuffer = await audioBufferMgr.createTimestretchedBuffer(
    trackNum, loopStart, loopEnd, stretchRatio, currentPitchShift, false  // Always forward
);

// 2. Create reversed version
const reversedStretchedBuffer = audioBufferMgr.reverseAudioBuffer(stretchedBuffer);

// 3. Store both versions
playbackCtrl.timestretchedBuffer = stretchedBuffer;          // Forward
playbackCtrl.timestretchedBufferReversed = reversedStretchedBuffer;  // Reversed
```

### 3. Seamless Mode Switching

#### Reverse Mode Activation
**Modified:** `playback-controller.js` - `switchToReverseMode()`
- Uses `timestretchedBufferReversed` if available
- Falls back to generating standard reversed buffer if no timestretch applied
- Maintains loop position during transition

**Code:**
```javascript
const bufferToUse = this.timestretchedBufferReversed || null;
this.startReversePlayback(positionInLoop, bufferToUse);
```

#### Normal Mode Activation
**Modified:** `playback-controller.js` - `switchToNormalMode()`
- Checks if `timestretchedBuffer` exists
- If yes: Uses new `startForwardBufferPlayback()` for buffer source playback
- If no: Falls back to MediaElement playback
- Calculates position accurately accounting for `playbackRate`

**Code:**
```javascript
if (this.timestretchedBuffer && this.isPlaying) {
    this.startForwardBufferPlayback(currentPosition);
} else {
    // Use MediaElement for non-timestretched audio
    this.audioElement.currentTime = currentPosition;
    this.audioElement.play();
}
```

### 4. Forward Buffer Playback Mode
**New Method:** `playback-controller.js` - `startForwardBufferPlayback()`
- Plays timestretched forward buffer using AudioBufferSourceNode
- Enables seamless looping
- Applies tempo via `playbackRate.value`
- Mutes MediaElement to avoid double playback
- Stores timing info for position tracking

**Features:**
- Seamless loop points
- Independent tempo control (via `playbackRate`)
- Independent pitch control (already in timestretched buffer)
- Position tracking via `getCurrentTime()`

### 5. Loop Point Changes
**Modified:** `playback-controller.js` - `setLoopPoints()`
- Automatically clears both timestretched buffers when loop changes
- Triggers re-rendering on next stretch slider interaction
- Prevents stale buffers from being used with wrong loop ranges

**Code:**
```javascript
setLoopPoints(start, end) {
    this.loopStart = start;
    this.loopEnd = end;
    
    // Clear timestretched buffers - they'll need to be regenerated
    this.timestretchedBuffer = null;
    this.timestretchedBufferReversed = null;
    
    // ... rest of method
}
```

## User Experience Improvements

### Seamless Mode Transitions
1. **Load audio to Track 1**
2. **Set loop markers** (e.g., 10s - 20s)
3. **Apply timestretching** (e.g., 0.75x) - Forward buffer renders
4. **Click reverse button** ↔️ - Instant switch to reversed timestretched audio
5. **Click reverse again** ↔️ - Instant switch back to forward timestretched audio
6. **Change stretch ratio** (e.g., 1.5x) - Both buffers re-render
7. **Continue toggling** - Always uses correct timestretched buffer

### Mode Behavior Matrix

| Mode | Stretch Applied? | Audio Source | Looping | Tempo Control |
|------|------------------|--------------|---------|---------------|
| Normal | No | MediaElement | Via element | audioElement.playbackRate |
| Normal | Yes | BufferSource (forward) | Seamless | bufferSource.playbackRate |
| Reverse | No | BufferSource (reversed) | Seamless | bufferSource.playbackRate |
| Reverse | Yes | BufferSource (timestretched + reversed) | Seamless | bufferSource.playbackRate |

## Technical Details

### Cache Management
- Only stores forward version in timestretched cache
- Reversed version created on-the-fly and stored in PlaybackController
- Reduces cache size by 50% compared to storing both versions
- LRU eviction still applies at 200MB limit

### Position Tracking
- Uses `reverseStartTime` and `reverseStartOffset` for both buffer modes
- `getCurrentTime()` correctly calculates position accounting for `playbackRate`
- Works seamlessly for both forward and reverse buffer playback

### Performance
- Pre-rendering both buffers eliminates mode switching lag
- No re-rendering needed when toggling reverse button
- Smooth transitions maintain playback position

## Testing Checklist

- [x] Load audio and set loop markers
- [x] Apply timestretch (0.5x - 2.0x range)
- [x] Verify forward playback uses timestretched audio
- [x] Toggle to reverse mode - verify reversed timestretched audio plays
- [x] Toggle back to normal - verify forward timestretched audio plays
- [x] Change stretch ratio while in reverse mode
- [x] Verify both modes update seamlessly
- [x] Change loop markers - verify buffers are cleared
- [x] Apply new stretch - verify new buffers are created
- [x] Test tempo control in both modes
- [x] Test pause/resume in both modes

## Files Modified

### `app/static/js/app.js`
- `applyStretchToTrack()`: Create both forward and reversed timestretched buffers
- Store both versions in PlaybackController

### `app/static/js/modules/playback-controller.js`
- Added `timestretchedBuffer` property (forward version)
- Added `timestretchedBufferReversed` property (reversed version)
- Modified `switchToNormalMode()`: Use forward buffer if timestretched
- Modified `switchToReverseMode()`: Use reversed timestretched buffer
- Added `startForwardBufferPlayback()`: New method for forward buffer playback
- Modified `setLoopPoints()`: Clear timestretched buffers on loop change
- Position tracking works for both forward and reverse buffer modes

## Benefits

1. **Seamless User Experience**: Instant mode switching with no audio glitches
2. **Consistent Audio Quality**: Timestretching works in both forward and reverse
3. **Performance**: Pre-rendered buffers ready for immediate playback
4. **Cache Efficiency**: Single cached forward version, reversed on demand
5. **Simplified Logic**: Unified rendering strategy eliminates mode-specific caching

## Future Enhancements

- Visual indicator showing timestretched vs non-timestretched playback mode
- Auto-clear timestretched buffers when stretch slider returns to 1.0x
- Progressive rendering for longer loops (currently renders entire loop)
- Fade transitions when switching between MediaElement and BufferSource modes
