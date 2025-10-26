# Sequencer Loop Playback Fix

## Overview
Fixed the sequencer timeline loop functionality to properly respect loop start/end bar settings and stop playback at the correct position.

## Implementation Date
October 26, 2025

## Issues Fixed

### 1. Loop Playback Ignoring Loop Range
**Problem:** When loop was set to bars 1-6, playback continued past bar 6 and played all bars (1-8).

**Root Cause:** The `play()` function was using `this.numberOfBars` for total duration, completely ignoring the `loopStartBar` and `loopEndBar` settings.

**Solution:** Modified the `play()` function to:
- Check if loop is enabled
- Use `loopStartBar` and `loopEndBar` to calculate playback range
- Only schedule clips that fall within the loop range
- Cut off clips that extend beyond the loop end
- Start playhead at the loop start position

### 2. Recording Waveform Loop Markers Not Clickable
**Problem:** User reported inability to click/draw loop markers on the sequencer recording waveform.

**Root Cause:** The pan functionality was potentially interfering with canvas clicks.

**Solution:** Already fixed in previous update - added `e.target.closest('canvas')` to pan exclusion list, preventing pan from activating when clicking on any canvas element (including the recording waveform canvas).

## Technical Implementation

### Modified Functions

#### `play()` Function
**Before:**
```javascript
play() {
    // ...
    const totalDuration = this.numberOfBars * secondsPerBar;
    
    // Schedule all clips
    track.clips.forEach(placedClip => {
        const clipStartTime = placedClip.barPosition * secondsPerBar;
        const scheduleTime = startTime + clipStartTime;
        source.start(scheduleTime);
    });
    
    this.startPlayhead(totalDuration);
}
```

**After:**
```javascript
play() {
    // Determine playback range based on loop settings
    let startBar, endBar;
    if (this.loopEnabled) {
        startBar = this.loopStartBar || 0;
        endBar = this.loopEndBar || this.numberOfBars;
    } else {
        startBar = 0;
        endBar = this.numberOfBars;
    }
    
    const playbackDuration = (endBar - startBar) * secondsPerBar;
    const playbackStartOffset = startBar * secondsPerBar;
    
    // Only play clips that fall within the playback range
    track.clips.forEach(placedClip => {
        const clipStartTime = placedClip.barPosition * secondsPerBar;
        const clipEndTime = clipStartTime + clipDuration;
        
        // Skip clips outside loop range
        if (clipStartTime >= playbackStartOffset + playbackDuration) return;
        if (clipEndTime <= playbackStartOffset) return;
        
        // Calculate schedule time and offset
        let scheduleTime = startTime + clipStartTime - playbackStartOffset;
        let clipOffset = 0;
        
        // If clip starts before loop start, offset into the clip
        if (clipStartTime < playbackStartOffset) {
            clipOffset = playbackStartOffset - clipStartTime;
            scheduleTime = startTime;
        }
        
        // Calculate how much of the clip to play
        const maxDuration = playbackDuration - (clipStartTime - playbackStartOffset - clipOffset);
        const playDuration = Math.min(clipDuration - clipOffset, maxDuration);
        
        // Start with offset and duration
        source.start(scheduleTime, clipOffset, playDuration);
    });
    
    this.startPlayhead(playbackDuration, startBar, endBar);
}
```

#### `startPlayhead()` Function
**Before:**
```javascript
startPlayhead(duration) {
    const startPosition = 0;
    // Playhead always starts at position 0
    const position = (elapsed / secondsPerBar) * this.barWidth;
}
```

**After:**
```javascript
startPlayhead(duration, startBar = 0, endBar = null) {
    const startPosition = startBar * this.barWidth;
    // Playhead starts at loop start position
    const position = startPosition + (elapsed / secondsPerBar) * this.barWidth;
}
```

## Playback Logic

### Clip Scheduling Rules

1. **Clip Starts Before Loop Range:**
   - Skip the clip entirely (don't play)
   
2. **Clip Ends Before Loop Range:**
   - Skip the clip entirely (don't play)
   
3. **Clip Starts Before Loop Start, Ends Within Range:**
   - Calculate offset into clip: `clipOffset = loopStart - clipStart`
   - Start playing from that offset
   - Schedule at `startTime` (immediately)
   
4. **Clip Starts Within Range, Ends After Loop End:**
   - Play from beginning of clip
   - Stop at loop end: `playDuration = loopEnd - clipStart`
   
5. **Clip Entirely Within Range:**
   - Play normally from clip start
   - Full clip duration

### Example Scenarios

**Scenario 1: Loop bars 3-6**
```
Clip A: Bars 1-2    → Skip (ends before loop start)
Clip B: Bars 2-4    → Play from offset (bar 3 onwards)
Clip C: Bars 4-5    → Play fully
Clip D: Bars 5-7    → Play but stop at bar 6
Clip E: Bars 7-8    → Skip (starts after loop end)
```

**Scenario 2: Loop bars 1-4 (half timeline)**
```
Timeline: 8 bars total
Loop: Bars 1-4 (4 bars)
Clip at bar 5: Skipped
Playback duration: 4 bars worth of seconds
Playhead: Moves from bar 1 to bar 4, then loops back
```

## Console Logging

Added helpful log message:
```
▶️ Playing sequencer: Bars 1 to 6 (24.00s)
```

Shows exactly which bars are being played and the duration in seconds.

## Visual Feedback

- **Playhead:** Now starts at loop start bar position instead of always at bar 0
- **Playhead Movement:** Moves from loop start to loop end, then returns to loop start
- **Loop Markers:** Visual markers on timeline show exact loop range

## Files Modified

### `app/static/js/modules/sequencer.js`

**Functions Updated:**
1. `play()` - Added loop range calculation and clip filtering
2. `startPlayhead()` - Added startBar parameter to position playhead correctly

**Lines Changed:** ~80 lines modified/added

## Testing Checklist

- [x] Loop disabled: Plays all bars (1-8)
- [x] Loop enabled (1-8): Plays all bars and loops
- [x] Loop enabled (1-6): Plays only bars 1-6, skips 7-8
- [x] Loop enabled (3-6): Starts at bar 3, plays to bar 6
- [x] Clip starts before loop: Plays from loop start onwards
- [x] Clip ends after loop: Stops at loop end
- [x] Playhead position: Starts at correct bar
- [x] Loop markers: Visible when loop enabled
- [x] Recording waveform clicks: Canvas clicks work for loop markers

## Benefits

1. **Accurate Looping:** Playback respects loop range settings
2. **Partial Clip Playback:** Clips are intelligently trimmed to loop boundaries
3. **Visual Consistency:** Playhead matches actual playback range
4. **Professional Behavior:** Like commercial DAWs (Ableton, FL Studio, Logic Pro)
5. **CPU Efficient:** Skips clips outside loop range entirely

## Known Limitations

1. **No Pause Resume:** Pause button doesn't maintain position (marked as TODO)
2. **No Scrubbing:** Can't click timeline to set playback position
3. **No Clip Crossfade:** Clips that overlap don't crossfade

## Future Enhancements

- [ ] Add visual highlight to loop region during playback
- [ ] Show "Playing bars X-Y" in UI (not just console)
- [ ] Add loop count indicator
- [ ] Add "punch in/out" recording within loop range
- [ ] Support fractional bar loops (e.g., loop from bar 2.5 to 5.25)
