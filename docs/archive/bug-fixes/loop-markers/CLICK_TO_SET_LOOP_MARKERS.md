# Click-to-Set Timeline Loop Markers Feature

## Overview
Added click functionality to the sequencer timeline header, allowing users to set loop start and end markers by clicking directly on the timeline, in addition to dragging existing markers or using input fields.

## Implementation Date
October 26, 2025

## Feature Description

### Click-to-Set Workflow
1. **Enable Loop Mode**: Click the 🔁 Loop button
2. **First Click**: Click anywhere on the timeline header → Sets START marker
3. **Second Click**: Click anywhere on the timeline header → Sets END marker
4. **Third Click**: Click anywhere on the timeline header → Resets and sets new START marker

### Visual Feedback
- Console messages guide the user through the process
- Markers appear and move to clicked positions
- Loop region updates to show the selected range
- Input fields update to show nearest whole bar

## Event Conflict Prevention

### Multiple Safety Checks

The click-to-set feature includes several guards to prevent interfering with other functionality:

#### 1. Loop Enabled Check
```javascript
if (!this.loopEnabled) return;
```
- Only works when loop mode is active
- Prevents accidental marker placement

#### 2. Marker Drag Detection
```javascript
let isDraggingMarker = false;

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.timeline-loop-marker')) {
        isDraggingMarker = true;
    }
});

if (isDraggingMarker) {
    console.log('🚫 Skipping click - marker was being dragged');
    return;
}
```
- Detects when user starts dragging a marker
- Prevents click event from firing after drag ends
- Small 10ms delay ensures clean separation

#### 3. Interactive Element Exclusion
```javascript
if (e.target.closest('.timeline-loop-marker') ||
    e.target.closest('.timeline-clip') ||
    e.target.closest('button') ||
    e.target.closest('input') ||
    e.target.closest('.bar-marker')) {
    return;
}
```
- Skips if clicking on loop markers themselves
- Skips if clicking on timeline clips
- Skips if clicking on buttons or inputs
- Skips if clicking on bar number markers

#### 4. Pan Detection
```javascript
if (this.isPanning) {
    console.log('🚫 Skipping click - was panning timeline');
    return;
}
```
- Checks if user was panning the timeline
- Prevents marker placement after pan gesture
- Uses existing `this.isPanning` state from pan functionality

### Event Listener Hierarchy

**Click Event Flow:**
1. User clicks on timeline header
2. Check: Is loop enabled? → No: Exit
3. Check: Was marker being dragged? → Yes: Exit
4. Check: Click on interactive element? → Yes: Exit
5. Check: Was panning? → Yes: Exit
6. Calculate position and set marker ✅

**Pan Event Flow:**
1. User presses Shift+Click or Middle Mouse
2. Pan mousedown sets `this.isPanning = true`
3. User moves mouse → Timeline scrolls
4. User releases mouse → `this.isPanning = false`
5. If user clicks immediately after, pan check prevents marker placement

**Drag Event Flow:**
1. User mousedown on marker → Sets `isDraggingMarker = true`
2. User moves mouse → Marker position updates
3. User mouseup → Waits 10ms, then sets `isDraggingMarker = false`
4. Click event (if any) is blocked during this period

## Click Position Calculation

### Accounting for Scroll
```javascript
const rect = timelineHeader.getBoundingClientRect();
const timelineContainer = document.querySelector('.sequencer-timeline-container');
const scrollLeft = timelineContainer ? timelineContainer.scrollLeft : 0;

const clickX = e.clientX - rect.left + scrollLeft;
const barPosition = clickX / this.barWidth;
```

**Why This Matters:**
- Timeline can be scrolled horizontally when zoomed
- `getBoundingClientRect()` gives viewport-relative position
- Must add `scrollLeft` to get actual timeline position
- Converts pixels to fractional bar position

### Constraints
```javascript
const constrainedPosition = Math.max(0, Math.min(barPosition, this.numberOfBars));
```
- Minimum: Bar 0 (start of timeline)
- Maximum: Total number of bars (end of timeline)
- Prevents placing markers outside valid range

## State Management

### Click Counter
```javascript
let markerClickCount = 0; // Tracks: 0 = none, 1 = start set, 2 = both set
```

**State Transitions:**
- `0` → Click → `1` (Start marker set, waiting for end)
- `1` → Click → `2` (End marker set, loop complete)
- `2` → Click → `1` (Reset, new start marker set)

### Validation
```javascript
if (constrainedPosition > this.loopStartBar + 0.1) {
    // Set end marker
} else {
    console.log(`⚠️ End marker must be after start marker`);
}
```
- End marker must be at least 0.1 bars after start
- Prevents zero-length or negative loops
- User-friendly error message

## Console Output

### User Guidance
```
✅ Timeline click-to-set loop markers enabled
🎯 Click-set loop START to bar 3.27%
🎯 Click-set loop END to bar 6.84%
✅ Loop markers set! Click again to reset.
🔄 Resetting loop markers...
🎯 Click-set loop START to bar 5.50%
```

### Safety Messages
```
🚫 Skipping click - marker was being dragged
🚫 Skipping click - was panning timeline
⚠️ End marker must be after start marker
```

## Integration with Other Features

### Works Alongside:
1. **Input Fields**: Click-to-set updates the same state as manual input
2. **Drag Markers**: Can drag after setting via click
3. **Timeline Pan**: Pan gesture doesn't trigger marker placement
4. **Zoom**: Click position calculated correctly at any zoom level
5. **Auto-Expand**: Works with dynamically expanded timelines

### Doesn't Interfere With:
1. **Clip Dragging**: Clips remain draggable
2. **Clip Selection**: Clicking clips doesn't set markers
3. **Button Clicks**: Buttons in timeline remain functional
4. **Input Focus**: Input fields remain focusable
5. **Marker Dragging**: Can drag markers without triggering clicks

## Files Modified

### `app/static/js/modules/sequencer.js`

**New Function:**
- `setupTimelineLoopMarkerClicks()` - ~70 lines

**Called From:**
- Constructor, after `setupTimelinePanning()`

**Dependencies:**
- `this.loopEnabled` - Loop state
- `this.isPanning` - Pan state from setupTimelinePanning
- `this.loopStartBar` / `this.loopEndBar` - Marker positions
- `this.barWidth` - Current bar width (zoom-aware)
- `this.updateTimelineLoopMarkers()` - Visual update function

## User Benefits

1. **Quick Setup**: Click twice instead of typing/dragging
2. **Visual Precision**: See exactly where you're clicking
3. **No Mode Switching**: Works seamlessly with other interactions
4. **Discoverable**: Natural interaction pattern
5. **Forgiving**: Easy to reset and try again
6. **Accessible**: Works at any zoom level or scroll position

## Edge Cases Handled

### 1. Rapid Clicking
- Click counter properly increments through states
- Each click logged for user feedback
- Third click resets cleanly

### 2. Click During Drag
- `isDraggingMarker` flag prevents click event
- 10ms delay ensures clean state reset
- Drag behavior unaffected

### 3. Click After Pan
- `this.isPanning` check prevents marker placement
- Pan gesture completes normally
- User must release and click again to set marker

### 4. Click on Interactive Element
- `closest()` checks prevent event handling
- Interactive elements remain fully functional
- No event propagation issues

### 5. Scrolled Timeline
- Position calculation accounts for scroll offset
- Markers placed at correct bar regardless of viewport
- Zoom level properly considered

### 6. End Before Start
- Validation prevents invalid ranges
- User-friendly error message
- State remains unchanged

## Testing Checklist

- [x] Click timeline to set start marker
- [x] Click timeline to set end marker
- [x] Click timeline third time to reset
- [x] Click on loop marker (should not set new marker)
- [x] Drag loop marker (should not trigger click)
- [x] Pan timeline then click (should not set marker)
- [x] Click on clip (should not set marker)
- [x] Click on bar marker (should not set marker)
- [x] Click on button (should not set marker)
- [x] Click with loop disabled (should do nothing)
- [x] Click to set end before start (should show error)
- [x] Click on scrolled timeline (should calculate correctly)
- [x] Click at different zoom levels (should work)
- [x] Use input fields after click-to-set (should sync)
- [x] Drag markers after click-to-set (should work)

## Performance Considerations

### Optimizations
1. **Single Event Listener**: One click listener on header, not each bar
2. **Quick Validation**: Early returns prevent unnecessary calculations
3. **Minimal DOM Queries**: Caches container reference when needed
4. **No Throttling Needed**: Click events are naturally infrequent

### Memory
- Closures capture minimal state (markerClickCount, isDraggingMarker)
- No memory leaks (listeners properly scoped)
- Event listeners added once, not per marker

## Known Limitations

1. **No Click Indicator**: No visual cue showing click position before confirming
2. **No Undo**: Can't undo individual marker placements (must reset)
3. **No Tooltips**: No tooltip showing what will happen on click
4. **Desktop Only**: Touch events not supported
5. **Three-Click Reset**: Must click three times to start over (no clear button)

## Future Enhancements

- [ ] Add visual preview on hover showing where marker will be placed
- [ ] Add tooltip: "Click to set START" / "Click to set END"
- [ ] Add keyboard shortcut to enable/disable click-to-set mode
- [ ] Add "Clear Loop Markers" button
- [ ] Add touch event support for mobile
- [ ] Add click sound effect for audio feedback
- [ ] Add temporary visual indicator (pulse) at click position
- [ ] Add right-click context menu: "Set Start Here" / "Set End Here"

## Comparison with Other Loop Systems

### Track Waveform Loop Markers
- **Similarity**: Click-to-set workflow (A, then B)
- **Difference**: Works on canvas vs. timeline header
- **Difference**: Uses letter labels (A, B) vs. START/END

### Timeline Drag Markers
- **Similarity**: Sets same state variables
- **Difference**: Drag for precision, click for speed
- **Complement**: Both can be used interchangeably

### Input Fields
- **Similarity**: Updates same loop range
- **Difference**: Typing specific bars vs. visual clicking
- **Complement**: Input shows rounded values, click allows fractional

## Related Documentation

- `DRAGGABLE_TIMELINE_LOOP_MARKERS.md` - Drag functionality
- `SEQUENCER_TIMELINE_LOOP_MARKERS.md` - Visual markers
- `SEQUENCER_LOOP_PLAYBACK_FIX.md` - Playback respecting loop range
