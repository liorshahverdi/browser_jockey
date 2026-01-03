# Sequencer Double-Click Loop Marker Adjustment

**Date:** October 26, 2025
**Feature:** Double-click timeline to move the closer loop marker

## Overview
Added intuitive double-click functionality to the sequencer timeline ruler. When loop markers are set, double-clicking anywhere within the loop range will automatically move the **closer marker** to the clicked position.

## How It Works

### Behavior
1. **Enable Loop Mode** - Turn on the sequencer loop toggle
2. **Set Loop Markers** - Define start and end markers (via clicking, dragging, or input fields)
3. **Double-Click Within Loop Range** - Click anywhere between the markers
4. **Automatic Marker Selection** - The system calculates which marker (START or END) is closer to your click position
5. **Marker Moves** - The closer marker snaps to the clicked position with fractional precision

### Example Scenarios

#### Scenario 1: Tightening Loop Start
```
Initial Loop: Bar 1 ━━━━━━━━━━━━━ Bar 8
              START                END

Double-click at Bar 2.5 (closer to START):
Updated Loop: Bar 2.5 ━━━━━━━━━ Bar 8
              START             END
```

#### Scenario 2: Extending Loop End
```
Initial Loop: Bar 2 ━━━━━ Bar 5
              START       END

Double-click at Bar 6.75 (closer to END):
Updated Loop: Bar 2 ━━━━━━━━━━━ Bar 6.75
              START               END
```

#### Scenario 3: Fine-Tuning Loop Boundaries
```
Initial Loop: Bar 1 ━━━━━━━━━━━━━ Bar 8
              START                END

Double-click at Bar 7.2 (closer to END):
Updated Loop: Bar 1 ━━━━━━━━━━ Bar 7.2
              START             END
```

## Technical Details

### Implementation
**File:** `app/static/js/modules/sequencer.js`
**Function:** `setupTimelineLoopMarkerClicks()` (line ~323)

### Algorithm
1. **Position Calculation**
   ```javascript
   const clickX = e.clientX - rect.left + scrollLeft;
   const barPosition = clickX / this.barWidth;
   const constrainedPosition = Math.max(0, Math.min(barPosition, this.numberOfBars));
   ```

2. **Distance Comparison**
   ```javascript
   const distToStart = Math.abs(constrainedPosition - this.loopStartBar);
   const distToEnd = Math.abs(constrainedPosition - this.loopEndBar);
   ```

3. **Marker Selection**
   - If `distToStart < distToEnd` → Move START marker
   - Otherwise → Move END marker

4. **Boundary Constraints**
   - START marker: Cannot move past END marker (must maintain 0.1 bar minimum gap)
   - END marker: Cannot move before START marker (must maintain 0.1 bar minimum gap)

### Safety Features
- ✅ Only works when loop is **enabled**
- ✅ Only works when **both markers are set**
- ✅ Only affects clicks **within the loop range**
- ✅ Respects **minimum gap** between markers (0.1 bars)
- ✅ Doesn't interfere with **other interactive elements** (clips, buttons, bar markers)
- ✅ Supports **fractional bar positioning** (e.g., 2.75 bars)
- ✅ Updates **input fields** automatically (1-indexed display)
- ✅ Provides **console feedback** with precise position

### Event Handling
**Double-Click Handler:**
```javascript
timelineHeader.addEventListener('dblclick', (e) => {
    // Check if loop enabled and markers set
    if (!this.loopEnabled || this.loopStartBar === null || this.loopEndBar === null) return;
    
    // Skip if clicking on interactive elements
    if (e.target.closest('.timeline-loop-marker') || /* ... */) return;
    
    // Calculate click position
    const barPosition = /* ... */;
    
    // Check if within loop range
    if (constrainedPosition >= this.loopStartBar && constrainedPosition <= this.loopEndBar) {
        // Determine closer marker and move it
        // ...
    }
});
```

## User Experience

### Visual Feedback
- **Console Logs:** Shows which marker moved and to what position
  ```
  🎯 Double-click moved loop START to bar 2.50%
  🎯 Double-click moved loop END to bar 7.25%
  ```
- **Input Field Updates:** Displays new marker position (rounded, 1-indexed)
- **Visual Marker Position:** Golden vertical line updates immediately
- **Loop Region:** Highlighted area adjusts automatically

### When Double-Click Does Nothing
- ⚠️ Loop is **not enabled**
- ⚠️ Markers are **not yet set**
- ⚠️ Click position is **outside the loop range**
- ⚠️ Clicked on **interactive element** (clip, button, marker)
- ⚠️ New position would **violate minimum gap** constraint

Console message: `⚠️ Double-click outside loop range - no marker moved`

## Integration with Existing Features

### Compatible With
✅ **Single-Click Marker Setting** - Works alongside the click-to-set workflow
✅ **Drag Markers** - Can drag markers then fine-tune with double-click
✅ **Input Fields** - Can type values then adjust with double-click
✅ **Timeline Zoom** - Works at any zoom level (50%-200%)
✅ **Timeline Pan** - Works with scrolled/panned timeline
✅ **Fractional Positioning** - Supports sub-bar precision

### Does Not Interfere With
✅ Dragging clips
✅ Dragging loop markers
✅ Clicking bar numbers
✅ Timeline panning (Shift+drag)
✅ Other UI controls

## Use Cases

### 1. Quick Loop Adjustment During Playback
Enable loop, set rough markers, then double-click to fine-tune boundaries while listening.

### 2. Precise Beat Matching
Zoom in to high level (150%-200%), double-click to align loop markers with exact beat positions.

### 3. Rapid Loop Experimentation
Quickly test different loop start/end points by double-clicking different positions.

### 4. One-Handed Workflow
Adjust loop markers without reaching for input fields or dragging markers - just double-click.

### 5. Touch-Friendly Adjustment
On touch devices, double-tap provides easier marker adjustment than dragging.

## Benefits

### Efficiency
- ⚡ **Faster than dragging** - Direct positioning with one gesture
- ⚡ **Faster than typing** - No need to calculate bar numbers
- ⚡ **Fewer steps** - One double-click vs. selecting input field + typing

### Precision
- 🎯 **Fractional positioning** - Can place markers at any point in a bar
- 🎯 **Visual feedback** - See exactly where marker will land
- 🎯 **Scroll-aware** - Works correctly with panned/scrolled timeline

### Intuitiveness
- 💡 **Natural gesture** - Double-click is familiar interaction pattern
- 💡 **Automatic selection** - System chooses the right marker to move
- 💡 **Smart constraints** - Prevents invalid marker positions

## Console Messages

### Success
```
🎯 Double-click moved loop START to bar 2.50%
🎯 Double-click moved loop END to bar 7.25%
```

### Warnings
```
⚠️ Double-click outside loop range - no marker moved
```

## Testing Checklist

- [x] Double-click within loop range moves closer marker
- [x] START marker moves when closer to click position
- [x] END marker moves when closer to click position
- [x] Marker respects minimum gap constraint (0.1 bars)
- [x] Works with fractional bar positions
- [x] Updates input fields correctly (1-indexed)
- [x] Works at various zoom levels
- [x] Works with scrolled/panned timeline
- [x] Doesn't interfere with other click handlers
- [x] Console logs show correct position
- [x] No errors in browser console

## Future Enhancements

### Potential Additions
1. **Shift+Double-Click** - Force move START marker regardless of distance
2. **Ctrl+Double-Click** - Force move END marker regardless of distance
3. **Alt+Double-Click** - Create new loop centered at click position
4. **Visual Preview** - Show which marker will move before double-click completes
5. **Snap to Beat** - Option to snap to nearest beat grid when double-clicking

## Related Features
- Loop Marker Dragging (`makeTimelineLoopMarkerDraggable()`)
- Click-to-Set Markers (`setupTimelineLoopMarkerClicks()`)
- Loop Marker Indexing Fix (`SEQUENCER_LOOP_INDEXING_FIX.md`)
- Timeline Zoom & Pan
- Fractional Bar Positioning

---

**Status:** ✅ Implemented and tested
**Version:** October 26, 2025
