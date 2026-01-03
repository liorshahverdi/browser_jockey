# Sequencer Smart Snap Fix

## Problem
When placing clips in sequence on the same track in the sequencer, clips would either overlap or leave gaps because they only snapped to whole bar boundaries (150px grid). Since clips can have any duration (e.g., 3.5 bars), it was impossible to place clips immediately adjacent to each other without manual pixel-perfect positioning.

### Example Issue
- Clip A is 3.5 bars long (525px), placed at bar 0 (0px)
- Clip A ends at pixel 525
- When placing Clip B after it:
  - Snapping to bar 3 (450px) → **overlaps** Clip A
  - Snapping to bar 4 (600px) → **leaves a 75px gap**

## Solution
Implemented **smart snapping** that snaps to both grid lines AND adjacent clip edges.

### Changes Made

#### 1. New Helper Method: `snapToGridOrClip()`
**Location:** `app/static/js/modules/sequencer.js`

```javascript
snapToGridOrClip(position, track, currentClip = null) {
    const snapThreshold = 20; // pixels - snap range for clip edges
    
    // Default: snap to bar grid
    let snappedPosition = Math.round(position / this.barWidth) * this.barWidth;
    
    // Find nearest clip edge within threshold
    for (const clip of track.clips) {
        // Skip the current clip being dragged
        if (currentClip && clip.element === currentClip) continue;
        
        const clipLeft = parseInt(clip.element.style.left);
        const clipWidth = parseFloat(clip.element.style.width);
        const clipRight = clipLeft + clipWidth;
        
        // Check if position is near clip start or end
        // If within threshold, snap to that edge instead of grid
    }
}
```

**Features:**
- 20px snap threshold for detecting nearby clip edges
- Checks both start and end positions of all clips on the track
- Excludes the currently dragged clip (prevents self-snapping)
- Falls back to grid snapping if no clip edges are nearby

#### 2. Updated `setupDropZone()` Method
**Before:**
```javascript
const barPosition = Math.floor(x / this.barWidth);
this.addClipToTrack(trackId, clip, barPosition);
```

**After:**
```javascript
const track = this.sequencerTracks.find(t => t.id === trackId);
const pixelPosition = this.snapToGridOrClip(x, track);
this.addClipToTrack(trackId, clip, pixelPosition);
```

Now uses pixel-precise positioning instead of bar indices.

#### 3. Updated `addClipToTrack()` Method
**Before:**
```javascript
addClipToTrack(trackId, clip, barPosition) {
    clipElement.style.left = `${barPosition * this.barWidth}px`;
    track.clips.push({ barPosition: barPosition, ... });
}
```

**After:**
```javascript
addClipToTrack(trackId, clip, pixelPosition) {
    clipElement.style.left = `${pixelPosition}px`;
    const barPosition = pixelPosition / this.barWidth;
    track.clips.push({ 
        barPosition: barPosition, 
        pixelPosition: pixelPosition,
        ...
    });
}
```

Now accepts pixel position directly and stores both pixel and bar positions.

#### 4. Updated `makeClipDraggable()` Method
**Before:**
```javascript
// Snap to bar grid only
const snappedLeft = Math.round(newLeft / this.barWidth) * this.barWidth;
clipElement.style.left = `${snappedLeft}px`;
```

**After:**
```javascript
// Get current track
const track = this.sequencerTracks.find(t => 
    t.element.querySelector('.track-timeline') === timeline
);

// Snap to grid or adjacent clips
const snappedLeft = this.snapToGridOrClip(newLeft, track, clipElement);
clipElement.style.left = `${snappedLeft}px`;
```

Now uses smart snapping when dragging existing clips on the timeline.

## How It Works

### Placing Clips in Sequence
1. Drag Clip A from the sidebar and drop it at bar 0
2. Drag Clip B from the sidebar and drop it near where Clip A ends
3. **Smart snap:** If you drop within 20px of Clip A's end, it snaps exactly to that position
4. Result: Clip B starts exactly where Clip A ends (no gap, no overlap)

### Visual Feedback
- When you drag a clip near another clip's edge (within 20px), it "magnetically" snaps to align perfectly
- Works for both the start and end of existing clips
- Still snaps to grid when you're not near any clip edges

### Dragging Existing Clips
The same smart snapping works when repositioning clips that are already on the timeline.

## Benefits

✅ **No more overlaps** - Clips won't snap on top of each other  
✅ **No more gaps** - Clips can be placed exactly adjacent  
✅ **Better workflow** - Natural drag-and-drop for sequential arrangements  
✅ **Flexible** - Still supports grid snapping when desired  
✅ **Intuitive** - 20px threshold feels natural and forgiving  

## Testing

### Test Case 1: Sequential Clips
1. Load two audio clips
2. Add a track to the sequencer
3. Drop Clip A at bar 0
4. Drop Clip B close to where Clip A ends
5. ✅ Clip B should snap exactly to Clip A's end (no gap)

### Test Case 2: Gap Creation
1. Place Clip A at bar 0
2. Drop Clip B far from Clip A (e.g., near bar 8)
3. ✅ Clip B should snap to the nearest bar grid (not to Clip A)

### Test Case 3: Dragging to Align
1. Place Clip A at bar 0 and Clip B at bar 5
2. Drag Clip B toward Clip A's end
3. ✅ When within 20px, Clip B should snap to Clip A's end

### Test Case 4: Multiple Clips
1. Place 3 clips in sequence
2. Drag the middle clip
3. ✅ Should be able to snap to either adjacent clip's edges

## Technical Notes

### Snap Threshold
The 20px threshold is configurable in the `snapToGridOrClip` method:
```javascript
const snapThreshold = 20; // Adjust if needed
```

### Pixel Precision
Clips are now positioned using fractional bar positions (stored as pixels), allowing for sub-bar precision while maintaining grid alignment as a fallback.

### Backward Compatibility
- Existing clips continue to work
- Grid snapping still works as before when not near other clips
- Bar position tracking is preserved for display/logic

## Future Enhancements

Potential improvements:
- [ ] Visual snap indicators (show when snapping to a clip edge)
- [ ] Collision prevention (prevent overlapping clips entirely)
- [ ] Configurable snap threshold in UI
- [ ] Snap to multiple points (quarters, halves of bars)
- [ ] Keyboard shortcuts to toggle snapping modes

---

**Fixed by:** Lior Shahverdi and Claude Sonnet 4.5  
**Date:** October 26, 2025
