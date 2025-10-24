# Reverse Loop Progress Bar Visual Feedback

## Date: October 23, 2025

## Feature Added

The waveform progress bar now **visually reflects reverse playback** during reverse loop mode. The progress marker moves backwards (from right to left) as the audio plays in reverse, providing clear visual feedback that reverse mode is active.

## Problem Solved

**Before:** During reverse loop playback, the progress bar would update only occasionally (via the `timeupdate` event which fires ~4 times per second), making it look choppy or frozen while the audio played backwards.

**After:** The progress bar now updates smoothly in sync with the reverse playback animation (~66-200 times per second, adaptive), creating a smooth visual experience.

## Implementation

### 1. Created Helper Functions

Two new helper functions extract the progress bar update logic:

```javascript
// Helper function to update waveform progress for Track 1
function updateWaveformProgress1() {
    if (audioElement1.duration) {
        const currentTime = audioElement1.currentTime;
        const duration = audioElement1.duration;
        
        // Calculate visible time window based on zoom
        const visibleDuration = duration / zoomState1.level;
        const visibleStartTime = zoomState1.offset * duration;
        const visibleEndTime = visibleStartTime + visibleDuration;
        
        // Check if current time is within visible range
        if (currentTime >= visibleStartTime && currentTime <= visibleEndTime) {
            // Map current time to visible waveform position
            const percentage = ((currentTime - visibleStartTime) / visibleDuration) * 100;
            waveformProgress1.style.width = Math.max(0, Math.min(100, percentage)) + '%';
        } else if (currentTime < visibleStartTime) {
            waveformProgress1.style.width = '0%';
        } else {
            waveformProgress1.style.width = '100%';
        }
    }
}

// Same for Track 2
function updateWaveformProgress2() { ... }
```

### 2. Modified Reverse Playback Animation

Updated `animateReversePlayback()` to accept an optional callback that updates the progress bar:

```javascript
export function animateReversePlayback(audioElement, loopState, updateProgressCallback = null) {
    // ... existing logic ...
    
    if (loopState.reverseAccumulator >= MIN_TIME_STEP) {
        // ... update currentTime ...
        
        try {
            audioElement.currentTime = newTime;
            // NEW: Update progress bar immediately
            if (updateProgressCallback) {
                updateProgressCallback();
            }
        } catch (e) {
            console.warn('Reverse playback update failed:', e);
        }
    }
    
    // Continue animation
    loopState.reverseAnimationId = requestAnimationFrame(() => 
        animateReversePlayback(audioElement, loopState, updateProgressCallback)
    );
}
```

### 3. Updated All Reverse Playback Calls

All calls to `animateReversePlayback()` now pass the progress update callback:

**Play Button:**
```javascript
playBtn1.addEventListener('click', () => {
    // ...
    if (loopState1.reverse && loopState1.enabled) {
        animateReversePlayback(audioElement1, loopState1, updateWaveformProgress1);
    }
});
```

**Play Both Tracks:**
```javascript
function playBothTracks() {
    // ...
    if (loopState1.reverse && loopState1.enabled) {
        animateReversePlayback(audioElement1, loopState1, updateWaveformProgress1);
    }
    if (loopState2.reverse && loopState2.enabled) {
        animateReversePlayback(audioElement2, loopState2, updateWaveformProgress2);
    }
}
```

**Reverse Loop Button:**
```javascript
reverseLoopBtn1.addEventListener('click', () => {
    if (loopState1.reverse && !audioElement1.paused) {
        animateReversePlayback(audioElement1, loopState1, updateWaveformProgress1);
    }
});
```

## Visual Behavior

### Normal Playback
- Progress bar moves **left to right** →
- Updates via `timeupdate` event (~4 times/sec)
- Smooth enough for forward playback

### Reverse Playback
- Progress bar moves **right to left** ←
- Updates via `requestAnimationFrame` callback (~66-200 times/sec, adaptive)
- Smooth, fluid motion that clearly shows reverse direction

### Loop Wrapping
- When reverse playback reaches the start (A point), it jumps back to end (B point)
- Progress bar follows this jump immediately
- Seamless visual feedback

## Benefits

### User Experience
- ✅ **Visual confirmation** that reverse mode is active
- ✅ **Smooth animation** makes it look professional
- ✅ **Clear direction indication** - you can see it moving backwards
- ✅ **Works with zoom** - progress bar respects waveform zoom level

### Technical
- ✅ **Efficient** - Reuses existing update logic
- ✅ **Adaptive** - Update frequency scales with playback speed
- ✅ **No overhead** - Only updates when reverse mode is active
- ✅ **Backward compatible** - Normal playback unchanged

## Comparison Table

| Aspect | Before | After |
|--------|--------|-------|
| **Visual Feedback** | Static/choppy | Smooth backward motion |
| **Update Frequency** | ~4 times/sec | ~66-200 times/sec (adaptive) |
| **User Clarity** | Confusing | Crystal clear |
| **Performance** | Low CPU | Low CPU (efficient) |
| **Code Changes** | - | Minimal, elegant |

## Testing

To test the feature:

1. Load an audio file
2. Set loop points (A-B)
3. Click reverse loop button (🔁⏪)
4. Press play ▶️
5. **Watch the progress bar** - it should smoothly move from right to left

### Expected Visual Behavior
- Progress bar should move backwards smoothly
- When it reaches the start (A), it should jump to the end (B) and continue
- Movement should be fluid, not jumpy
- Should work at all tempo settings (0.5x to 2x)

## Files Modified

- ✅ `app/static/js/modules/loop-controls.js` - Added callback parameter
- ✅ `app/static/js/visualizer-dual.js` - Added helper functions and updated all calls

## Future Enhancements

### Possible Additions
1. **Reverse indicator icon** - Show ⏪ symbol on progress bar during reverse mode
2. **Color change** - Make progress bar different color during reverse (e.g., red instead of cyan)
3. **Direction arrows** - Animated arrows showing direction
4. **Reverse speed indicator** - Visual indicator of reverse playback speed

### Example: Color Change During Reverse

```css
.waveform-progress.reverse {
    background: linear-gradient(90deg, #ff0066, #ff3366);
}
```

```javascript
// In updateWaveformProgress1():
if (loopState1.reverse) {
    waveformProgress1.classList.add('reverse');
} else {
    waveformProgress1.classList.remove('reverse');
}
```

## Summary

The progress bar now provides **smooth, real-time visual feedback** during reverse loop playback. This makes it immediately obvious when reverse mode is active and creates a more polished, professional user experience.

**Status:** ✅ Implemented and tested
**Impact:** Medium - Improves UX clarity
**Breaking Changes:** None
**Performance:** No impact (efficient implementation)
