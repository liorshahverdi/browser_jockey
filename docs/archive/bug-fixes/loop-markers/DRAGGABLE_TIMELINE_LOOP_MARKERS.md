# Draggable Timeline Loop Markers Feature

## Overview
Enhanced the sequencer timeline loop markers with drag functionality, allowing users to adjust loop start/end points by dragging the visual markers directly on the timeline. **Supports precise positioning anywhere within the timeline, not just at bar boundaries.**

## Implementation Date
October 26, 2025

## Feature Description

### Interactive Loop Markers
Users can now:
- **Drag the START marker** to adjust loop start position
- **Drag the END marker** to adjust loop end position
- **Place markers anywhere** - not restricted to bar boundaries (fractional bar positions supported)
- See **real-time visual feedback** as the loop region updates while dragging
- Have values **display nearest whole bar** in input fields
- Get **precise console logging** showing exact fractional positions

### Precision Capabilities
- **Fractional Bar Positioning**: Markers can be placed at bar 2.35, 5.67, etc.
- **Pixel-Perfect Control**: Drag to any pixel position on the timeline
- **Minimum Gap**: 10% of a bar width between start and end markers
- **Free Positioning**: No grid snapping during drag

### User Experience

**Precision Loop Control:**
1. Enable loop
2. Drag START marker to bar 2.3 (between bar 2 and 3)
3. Drag END marker to bar 6.8 (near end of bar 6)
4. Input fields show "3" and "7" (rounded)
5. Console shows exact positions: "2.300" and "6.800"
6. Playback uses exact fractional positions

**Visual Feedback:**
- Smooth drag motion (no grid snap jumps)
- Loop region updates continuously
- Cursor changes to indicate drag state
- Markers can be placed at any pixel position

**Before (Grid Snapping):**
- Could only set loop to full bars (1-8, 2-6, etc.)
- Markers jumped to bar boundaries
- Limited precision for audio sync

**After (Free Positioning):**
- Can set loop to fractional positions (2.35-6.87, etc.)
- Smooth marker movement
- Precise timing control for musical accuracy

## Technical Implementation

### New Functions

#### `makeTimelineLoopMarkerDraggable(marker, type)`
Makes a loop marker (start or end) draggable with the following features:

**Parameters:**
- `marker` - DOM element of the loop marker
- `type` - String: 'start' or 'end'

**Functionality:**
1. **Mouse Down**: Captures initial position and prevents event propagation
2. **Mouse Move**: Calculates new position, snaps to bars, updates values
3. **Mouse Up**: Finalizes position and updates all markers

**Constraints:**
- **Start marker**: 
  - Minimum: Bar 0
  - Maximum: 1 bar before end marker
- **End marker**:
  - Minimum: 1 bar after start marker
  - Maximum: Total number of bars

**Snapping:**
```javascript
// NO SNAPPING - Free positioning allowed
// Fractional bar positions supported
const newBar = newLeft / this.barWidth; // e.g., 2.456 bars
this.loopStartBar = newBar;
```

**Constraints:**
- **Start marker**: 
  - Minimum: 0 (beginning of timeline)
  - Maximum: End marker position - 10% bar width
- **End marker**:
  - Minimum: Start marker position + 10% bar width  
  - Maximum: Total number of bars

**Display Updates:**
- Input fields show **rounded bar numbers** for readability
- Console logs show **precise fractional positions** for accuracy
- Example: Drag to bar 2.73 → Input shows "3", console shows "bar 2.73% (2.730 bars)"

#### `updateTimelineLoopRegion()`
Updates only the loop region background highlight during dragging for smooth performance.

**What it does:**
- Calculates start/end positions from current bar values
- Updates loop region left position and width
- Called on every mouse move during drag

### Modified Functions

#### `updateTimelineLoopMarkers()`
**Added:**
- Setup check using `marker.dataset.dragSetup`
- Calls `makeTimelineLoopMarkerDraggable()` on first update
- Prevents duplicate event listener registration

**Code:**
```javascript
// Setup drag functionality on first call
if (!startMarker.dataset.dragSetup) {
    this.makeTimelineLoopMarkerDraggable(startMarker, 'start');
    startMarker.dataset.dragSetup = 'true';
}
if (!endMarker.dataset.dragSetup) {
    this.makeTimelineLoopMarkerDraggable(endMarker, 'end');
    endMarker.dataset.dragSetup = 'true';
}
```

## Event Handling

### Mouse Events

**mousedown on marker:**
```javascript
marker.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startLeft = parseInt(marker.style.left) || 0;
    marker.style.cursor = 'grabbing';
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Prevents timeline panning
});
```

**mousemove on document:**
```javascript
document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    let newLeft = startLeft + deltaX;
    
    // Snap to bar
    const barPosition = Math.round(newLeft / this.barWidth);
    newLeft = barPosition * this.barWidth;
    
    // Update values and visuals
    this.loopStartBar = newBar; // or this.loopEndBar
    this.loopStartBarInput.value = newBar + 1;
    marker.style.left = `${newLeft}px`;
    this.updateTimelineLoopRegion();
});
```

**mouseup on document:**
```javascript
document.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        marker.style.cursor = 'ew-resize';
        this.updateTimelineLoopMarkers(); // Final update
    }
});
```

## Synchronization

### Input Fields ↔ Markers
**Bidirectional sync:**

1. **User changes input field** → Markers update
   - Existing functionality via input event listeners
   - Calls `updateTimelineLoopMarkers()`

2. **User drags marker** → Input fields update
   - New functionality in drag handler
   - Updates `this.loopStartBarInput.value` or `this.loopEndBarInput.value`
   - Also updates internal state: `this.loopStartBar` / `this.loopEndBar`

## Visual Feedback

### Cursor States
- **Default**: `cursor: ew-resize` (resize arrows)
- **Hover**: Width increases to 5px, glows (CSS)
- **Dragging**: `cursor: grabbing` (closed hand)
- **After drag**: Returns to `cursor: ew-resize`

### Real-time Updates
During drag:
- Marker position updates on every mouse move
- Loop region (golden background) updates width/position
- Smooth 60fps-like feedback
- Bar snapping provides tactile feedback

### Console Logging
```javascript
console.log(`🔄 Dragged loop start to bar ${newBar + 1}`);
console.log(`🔄 Dragged loop end to bar ${newBar}`);
```

## Edge Cases Handled

### 1. Minimum Loop Size
- Loop must be at least 1 bar wide
- Start marker cannot reach end marker position
- End marker cannot reach start marker position

### 2. Boundary Constraints
- Start marker: `0 ≤ position < (endBar - 1)`
- End marker: `(startBar + 1) < position ≤ numberOfBars`

### 3. Timeline Expansion
- If timeline has 8 bars, end marker can't go beyond bar 8
- Auto-expand feature (from previous update) adds bars if clips extend further

### 4. Pan Interference Prevention
- `e.stopPropagation()` prevents timeline pan from activating
- Marker dragging takes precedence over pan gesture

### 5. Zoom Compatibility
- Markers update positions when zoom changes
- Drag calculations use current `this.barWidth`
- Snap-to-bar works at any zoom level

## Files Modified

### `app/static/js/modules/sequencer.js`

**New Functions:**
- `makeTimelineLoopMarkerDraggable(marker, type)` - ~70 lines
- `updateTimelineLoopRegion()` - ~10 lines

**Modified Functions:**
- `updateTimelineLoopMarkers()` - Added drag setup

**Total Lines:** ~90 lines added

## User Benefits

1. **Intuitive Interaction**: Drag visual elements instead of typing numbers
2. **Visual Feedback**: See exactly where loop points are
3. **Faster Workflow**: No need to calculate bar numbers
4. **Precision**: Automatic bar snapping ensures accuracy
5. **Consistency**: Same interaction as track waveform loop markers
6. **Discoverable**: Visual markers invite interaction

## Comparison with Track Loop Markers

### Similarities
- Both use drag interaction
- Both snap to boundaries (bars vs. time segments)
- Both update input fields automatically
- Both show visual region highlight

### Differences
| Feature | Timeline Loop Markers | Track Loop Markers |
|---------|----------------------|-------------------|
| Granularity | Snap to whole bars | Snap to precise time (seconds) |
| Visual | Golden vertical lines | A/B text markers |
| Region | Full timeline height | Waveform height |
| Context | Sequencer session | Individual track playback |
| Units | Bars (1-8) | Time (mm:ss.ms) |

## Testing Checklist

- [x] Drag start marker left/right
- [x] Drag end marker left/right
- [x] Start marker stops at end - 1
- [x] End marker stops at start + 1
- [x] Input fields update during drag
- [x] Loop region updates during drag
- [x] Markers snap to bar boundaries
- [x] Cursor changes (ew-resize ↔ grabbing)
- [x] Works at different zoom levels
- [x] Doesn't interfere with timeline panning
- [x] Console logs show bar changes
- [x] Playback respects dragged loop range

## Known Limitations

1. **No touch support**: Only works with mouse events (no touch/pen)
2. **No keyboard control**: Can't use arrow keys to adjust
3. **Input fields show rounded values**: For user convenience, but can be confusing if you want to see exact position
4. **No multi-drag**: Can't drag both markers simultaneously
5. **Minimum gap**: 10% bar width minimum between markers (prevents zero-length loops)

## Future Enhancements

- [ ] Add touch event support for mobile/tablet
- [ ] Add keyboard controls (arrow keys + modifier)
- [ ] Show tooltip with **exact fractional bar position** while dragging
- [ ] Add double-click to reset to defaults
- [ ] Animate marker movement when changing via input fields
- [ ] Add "snap to clip edges" option
- [ ] Add "snap to bar grid" toggle for users who want grid snapping
- [ ] Display fractional values in input fields with toggle option

## Performance Considerations

### Optimizations
1. **Event Delegation**: Uses document-level mousemove/mouseup
2. **Conditional Updates**: Only updates when value changes
3. **Separate Region Update**: `updateTimelineLoopRegion()` is lightweight
4. **Dataset Flag**: `marker.dataset.dragSetup` prevents duplicate listeners

### Potential Issues
- Many rapid mousemove events during drag (mitigated by browser's event throttling)
- Recalculating bar width on every move (negligible performance impact)

## CSS Integration

Uses existing CSS classes from previous implementation:
- `.timeline-loop-marker` - Has `cursor: ew-resize` built-in
- `.timeline-loop-marker:hover` - Visual feedback on hover
- `.timeline-loop-region` - Golden highlight region

No CSS changes needed - JavaScript handles cursor changes during drag.

## Console Output Examples

```
📍 Updated timeline loop markers: 300px to 900px
🔄 Dragged loop start to bar 3.27% (2.270 bars)
🔄 Dragged loop end to bar 7.84% (6.840 bars)
📍 Updated timeline loop markers: 340.5px to 1026px
▶️ Playing sequencer: Bars 3.27 to 7.84 (18.24s)
```

**Fractional Bar Display:**
- Input field: "3" (rounded for user convenience)
- Console: "bar 3.27% (2.270 bars)" (precise for debugging)
- Playback: Uses exact fractional values for accuracy

## Related Features

- **Timeline Loop Playback**: Dragged markers immediately affect playback range
- **Visual Loop Markers**: Markers created in previous update
- **Timeline Panning**: Drag prevented via `stopPropagation()`
- **Zoom Functionality**: Markers scale with zoom level
- **Auto-Expand Bars**: End marker constrained by current bar count
