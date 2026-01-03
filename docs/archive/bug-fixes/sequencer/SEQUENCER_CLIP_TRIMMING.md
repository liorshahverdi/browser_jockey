# Sequencer Clip Trimming Feature

## Overview
Implemented the ability to trim sequencer clips by dragging their left or right edges, allowing users to adjust the start and end points of audio clips directly in the timeline without affecting the original audio file.

## Features

### Visual Resize Handles
- **Edge Indicators**: Clips now have visual handles on both left and right edges
- **Semi-transparent borders** on edges that become more visible on hover
- **Cursor Changes**: Cursor changes to `ew-resize` when hovering over edges, indicating resize capability
- **Distinct States**: Different visual states for normal, dragging, and resizing

### Trimming Functionality

#### Left Edge (Trim Start)
- **Drag right**: Trims from the beginning - clip moves right and gets shorter
- **Drag left**: Restores trimmed audio from the start - clip moves left and gets longer
- **Visual Updates**: Both position (left) and width update in real-time
- **Smooth Interaction**: Incremental trim based on drag distance

#### Right Edge (Trim End)
- **Drag left**: Trims from the end - clip gets shorter from the right
- **Drag right**: Restores trimmed audio from the end - clip gets longer to the right
- **Visual Updates**: Width updates in real-time
- **Smooth Interaction**: Incremental trim based on drag distance

#### Constraints
- **Minimum Duration**: Clips cannot be trimmed below 20 pixels width
- **Maximum Trim**: Cannot trim more than the available audio (leaves minimum 0.1 seconds)
- **Independent Trims**: Start and end trims are independent and stored separately

### Playback Integration
- Trimmed clips play only the visible portion during sequencer playback
- Trim points are respected for both normal clips and loop region clips
- ADSR envelope and effects are applied to the trimmed portion
- Accurate timing based on trim start and end points

### Waveform Updates
- Waveform visualization updates in real-time during trimming
- Only the trimmed portion of the audio is displayed
- Maintains visual quality with proper sample range calculation

## Implementation Details

### Data Structure
Each placed clip now stores:
```javascript
{
    id: clipId,
    sourceClip: clip,
    barPosition: barPosition,
    pixelPosition: pixelPosition,
    element: clipElement,
    trimStart: 0,  // Seconds trimmed from start
    trimEnd: 0     // Seconds trimmed from end
}
```

### CSS Changes (`style.css`)

#### Resize Handles
```css
/* Visual resize handles using pseudo-elements */
.timeline-clip::before,
.timeline-clip::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 8px;
    z-index: 10;
    cursor: ew-resize;
}

.timeline-clip::before {
    left: 0;
    border-left: 2px solid rgba(255, 255, 255, 0.6);
    background: linear-gradient(to right, rgba(255, 255, 255, 0.2), transparent);
}

.timeline-clip::after {
    right: 0;
    border-right: 2px solid rgba(255, 255, 255, 0.6);
    background: linear-gradient(to left, rgba(255, 255, 255, 0.2), transparent);
}
```

#### Resizing State
```css
.timeline-clip.resizing {
    opacity: 0.8;
    z-index: 1000;
}
```

### JavaScript Changes (`modules/sequencer.js`)

#### 1. Enhanced `makeClipDraggable()` Method
- Added resize detection based on mouse position
- Separate states for dragging vs. resizing
- Dynamic cursor updates based on hover position
- Calculate trim in seconds based on pixel movement
- Update both visual appearance and stored trim data

#### 2. Updated `drawWaveform()` Method
- Added `trimStart` and `trimEnd` parameters
- Calculate sample range based on trim points
- Only render the visible portion of the waveform
```javascript
drawWaveform(clipElement, audioBuffer, width, trimStart = 0, trimEnd = 0)
```

#### 3. Updated `play()` Method
- Account for trim points when scheduling audio playback
- Apply trims to both loop clips and regular clips
- Calculate correct offset and duration for AudioBufferSourceNode

#### 4. Updated `addClipToTrack()` Method
- Initialize `trimStart` and `trimEnd` to 0 for new clips

## User Experience

### Workflow
1. **Add Clip**: Drag a clip from the Available Clips panel onto a track
2. **Hover**: Move mouse to the left or right edge of the clip
3. **See Cursor Change**: Cursor changes to horizontal resize arrows
4. **Drag to Trim**: Click and drag the edge to trim the clip
5. **See Feedback**: Waveform updates in real-time showing trimmed portion
6. **Play**: Sequencer plays only the visible/trimmed portion

### Visual Feedback
- **Edge Highlights**: Edges become more visible on hover
- **Cursor Indication**: Resize cursor shows trim capability
- **Real-time Waveform**: Waveform redraws as you trim
- **Real-time Resize**: Clip visually resizes as you drag the edges
  - Left trim: Clip moves right and gets shorter
  - Right trim: Clip gets shorter from the right
  - Both dimensions update smoothly during drag
- **Console Log**: Trim values logged when resizing completes

### Visual Resize Behavior
The clip **does resize in real-time** in the session view:

**Left Edge Trimming:**
- Position (`left`) updates: Clip moves to the right as you trim
- Width updates: Clip gets shorter proportionally
- Both changes happen simultaneously for smooth visual feedback

**Right Edge Trimming:**
- Width updates: Clip gets shorter from the right edge
- Position stays fixed at the left edge

**During Resize:**
- Minimum width enforced (20px) - prevents over-trimming
- Waveform redraws to show only the visible audio portion
- Changes are incremental and smooth based on mouse movement

### Distinction from Moving
- **Moving**: Click and drag from the center/body of the clip
- **Trimming**: Click and drag from the edges (first/last 8 pixels)
- **Delete**: Double-click on the clip (existing functionality)

## Technical Details

### Pixel to Time Conversion
```javascript
const secondsPerBar = (60 / this.currentBPM) * 4;
const pixelsPerSecond = this.barWidth / secondsPerBar;
const trimSeconds = deltaPixels / pixelsPerSecond;
```

### Trim Calculation (Left Edge)
```javascript
// Store initial trim on mousedown
startTrimStart = placedClip.trimStart || 0;

// On mousemove: calculate from total delta, not incremental
const trimSeconds = deltaX / pixelsPerSecond;
const newTrimStart = Math.max(0, Math.min(startTrimStart + trimSeconds, maxTrim));
const actualTrimChange = newTrimStart - startTrimStart;

// Update position and width based on change from initial
const newLeft = startLeft + (actualTrimChange * pixelsPerSecond);
const newWidth = startWidth - (actualTrimChange * pixelsPerSecond);

clipElement.style.left = `${newLeft}px`;
clipElement.style.width = `${newWidth}px`;
```

### Trim Calculation (Right Edge)
```javascript
// Store initial trim on mousedown
startTrimEnd = placedClip.trimEnd || 0;

// On mousemove: calculate from total delta, not incremental
const trimSeconds = -deltaX / pixelsPerSecond;
const newTrimEnd = Math.max(0, Math.min(startTrimEnd + trimSeconds, maxTrim));
const actualTrimChange = newTrimEnd - startTrimEnd;

// Update width based on change from initial
const newWidth = startWidth - (actualTrimChange * pixelsPerSecond);
clipElement.style.width = `${newWidth}px`;
```

**Important**: The trim is calculated from the **initial state** (captured on mousedown) plus the **total delta**, not incrementally added on each mousemove event. This prevents trim values from accumulating incorrectly.

### Playback Offset Calculation
```javascript
const trimStart = placedClip.trimStart || 0;
const trimEnd = placedClip.trimEnd || 0;
const startOffset = trimStart + clipOffset;
const trimmedDuration = clipDuration - trimStart - trimEnd;
source.start(scheduleTime, startOffset, playDuration);
```

## Testing Checklist

### Visual Tests
- [ ] Edge handles visible on hover
- [ ] Cursor changes to resize arrows on edges
- [ ] Cursor remains as move cursor in center
- [ ] Waveform updates during resize
- [ ] Clip width changes appropriately

### Trim Left Edge Tests
- [ ] Drag right trims from start
- [ ] Drag left restores from start
- [ ] Position updates correctly
- [ ] Cannot trim beyond minimum width
- [ ] Cannot trim more than available audio

### Trim Right Edge Tests
- [ ] Drag left trims from end
- [ ] Drag right restores from end
- [ ] Width updates correctly
- [ ] Cannot trim beyond minimum width
- [ ] Cannot trim more than available audio

### Playback Tests
- [ ] Trimmed clip plays only visible portion
- [ ] Start trim respected in playback
- [ ] End trim respected in playback
- [ ] Both trims work together correctly
- [ ] Works with effects (ADSR, delay, etc.)
- [ ] Works with loop regions

### Integration Tests
- [ ] Trimming works on all tracks
- [ ] Multiple clips can be trimmed independently
- [ ] Trimmed clips can still be moved
- [ ] Trimmed clips can still be deleted (double-click)
- [ ] Timeline expands to fit trimmed clips
- [ ] Works with sequencer loop

## Benefits

1. **Non-Destructive Editing**: Original audio remains unchanged
2. **Precision Timing**: Fine-tune clip start/end points visually
3. **Workflow Efficiency**: No need to pre-trim audio files
4. **Creative Flexibility**: Quickly experiment with different clip lengths
5. **Visual Feedback**: See exactly what will play

## Future Enhancements

Potential improvements:
- [ ] Show trim values (in seconds) in tooltip on hover
- [ ] Snap to zero-crossings when trimming to avoid clicks
- [ ] Fade in/out at trim points to prevent audio pops
- [ ] Undo/redo for trim operations
- [ ] Numerical input for precise trim values
- [ ] Copy/paste trim settings between clips
- [ ] Keyboard shortcuts for trimming (e.g., Shift+drag for fine control)

## Troubleshooting

### Issue: Trim values accumulating incorrectly
**Symptom**: Clip trims by extreme amounts (e.g., 225 seconds instead of a few seconds)

**Cause**: Previously, the trim was calculated incrementally on each mousemove event, causing it to accumulate.

**Fix**: Now stores initial trim values on mousedown (`startTrimStart`, `startTrimEnd`) and calculates the new trim based on total delta from the initial position, not incremental changes.

### Issue: Trim not working at all
**Checklist**:
- [ ] Are you hovering over the edge (first/last 8 pixels)?
- [ ] Does the cursor change to resize arrows (↔)?
- [ ] Is the clip wide enough to trim (minimum 20px)?
- [ ] Check browser console for errors

## Version
- **Added in**: v3.20
- **Status**: Production Ready
- **Bug Fix**: v3.20.1 - Fixed trim accumulation issue
- **Dependencies**: Requires existing sequencer functionality
