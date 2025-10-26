# Sequencer Zoom & Pan Feature

## Overview

Added zoom and pan functionality to the sequencer timeline, allowing users to zoom in/out for detailed editing and pan across the timeline when zoomed in. Clips now display mini waveforms for visual reference.

## Features Implemented

### 1. Zoom Control ✅

**Location:** Sequencer controls panel

#### UI Elements
- **Zoom Slider:** 50% - 200% range (step: 10%)
- **Zoom Display:** Shows current zoom level (e.g., "100%")

#### Functionality
```javascript
// Zoom affects:
- Bar width (grid spacing)
- Timeline ruler spacing
- All placed clips width/position
- Waveform rendering resolution
```

**How It Works:**
1. Base bar width: 150px (at 100% zoom)
2. Zoom multiplier: `barWidth = baseBarWidth × zoomLevel`
3. All clips and grid elements scale proportionally
4. Timeline extends horizontally when zoomed in

**Keyboard Shortcuts:**
- None currently (future enhancement)

### 2. Timeline Panning ✅

**Location:** Sequencer timeline container

#### Panning Methods

**Method 1: Shift + Left Mouse Button**
1. Hold `Shift` key
2. Click and drag anywhere on the timeline background
3. Timeline scrolls horizontally

**Method 2: Middle Mouse Button**
1. Click middle mouse button anywhere on timeline
2. Drag to pan left/right

#### Visual Feedback
- Cursor changes to `grab` when hovering timeline
- Cursor changes to `grabbing` while panning
- Smooth scrolling animation

#### Intelligent Panning
The panning system **does not interfere** with:
- Dragging clips from sidebar
- Moving clips on timeline
- Clicking buttons or controls
- Adjusting slider values

**Implementation:**
```javascript
// Panning is disabled when clicking on:
- .timeline-clip elements
- .clip-item elements  
- button elements
- input elements
```

### 3. Waveform Visualization ✅

**Location:** Inside each placed clip on timeline

#### Features
- **Mini waveforms** rendered on each clip
- **Real-time rendering** using Canvas API
- **Responsive sizing** - adjusts to clip width/height
- **High DPI support** - uses device pixel ratio for crisp rendering
- **Zoom-aware** - redraws at appropriate resolution when zooming

#### Visual Design
```javascript
Waveform style:
- Stroke color: rgba(255, 255, 255, 0.7) - semi-transparent white
- Line width: 1px
- Background: transparent (shows clip background)
- Vertical centering: waveform centered in clip height
```

#### Performance Optimization
- Waveform samples are downsampled for performance
- Canvas uses hardware acceleration
- Only visible portions are considered for rendering
- Device pixel ratio compensation prevents blurriness

## Code Changes

### JavaScript (`app/static/js/modules/sequencer.js`)

#### 1. New Properties
```javascript
this.baseBarWidth = 150;  // Base width for 100% zoom
this.zoomLevel = 1.0;     // Current zoom multiplier
this.isPanning = false;    // Panning state
this.panStartX = 0;        // Pan gesture start position
this.panStartScrollLeft = 0; // Scroll position at pan start
```

#### 2. New Methods

**`setupTimelinePanning()`**
- Sets up mouse event listeners for panning
- Handles Shift+Drag and Middle Mouse Button
- Prevents interference with clip dragging
- Updates scroll position during drag

**`updateAllTracksForZoom()`**
- Recalculates all clip positions and widths
- Updates timeline width
- Redraws all waveforms at new zoom level

**`drawWaveform(canvas, audioBuffer)`**
- Renders audio waveform on canvas element
- Handles device pixel ratio for clarity
- Downsamples audio for performance
- Centers waveform vertically

**`setupResizeObserver()`**
- Monitors timeline container size changes
- Triggers waveform redraw on resize
- Handles responsive layout changes

**`redrawAllWaveforms()`**
- Iterates through all placed clips
- Redraws waveform canvas for each
- Called on zoom and resize events

#### 3. Modified Methods

**`addClipToTrack()`**
```javascript
// Before: Simple div with text
clipElement.innerHTML = `<div>${clip.name}</div>`;

// After: Canvas for waveform + text overlay
const canvas = document.createElement('canvas');
canvas.className = 'clip-waveform';
// ... canvas setup and waveform rendering
const textOverlay = document.createElement('div');
textOverlay.className = 'timeline-clip-content';
```

**`initializeEventListeners()`**
```javascript
// Added zoom slider listener
this.zoomSlider?.addEventListener('input', (e) => {
    this.zoomLevel = parseInt(e.target.value) / 100;
    this.barWidth = this.baseBarWidth * this.zoomLevel;
    this.updateTimelineRuler();
    this.updateAllTracksForZoom();
});
```

### CSS (`app/static/css/style.css`)

#### 1. Timeline Container
```css
.sequencer-timeline-container {
    overflow-x: auto;
    overflow-y: auto;
    scroll-behavior: smooth;
    cursor: grab; /* NEW */
}

.sequencer-timeline-container:active {
    cursor: grabbing; /* NEW */
}
```

#### 2. Waveform Canvas
```css
.clip-waveform {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
}
```

#### 3. Clip Content Overlay
```css
.timeline-clip-content {
    position: relative;
    z-index: 2;
    pointer-events: none;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
```

### HTML (`app/templates/index.html`)

#### Zoom Control
```html
<div class="sequencer-control-group">
    <label for="sequencerZoom">Zoom</label>
    <input type="range" id="sequencerZoom" min="50" max="200" 
           step="10" value="100">
    <span id="zoomValue">100%</span>
</div>
```

## Usage Guide

### Zooming In/Out

1. **Locate the Zoom Slider** in the sequencer controls panel
2. **Adjust the slider:**
   - Left: Zoom out (50% - see more bars)
   - Right: Zoom in (200% - see details)
3. **Timeline adjusts automatically:**
   - Grid spacing changes
   - Clips resize proportionally
   - Waveforms redraw at new resolution

### Panning the Timeline

**When to use:** After zooming in, when timeline is wider than viewport

**Method 1: Shift+Drag**
1. Zoom in to 150% or 200%
2. Hold `Shift` key
3. Click and drag on timeline background
4. Timeline scrolls left/right

**Method 2: Middle Mouse**
1. Zoom in to desired level
2. Click middle mouse button on timeline
3. Drag to pan
4. Release to stop

**Tips:**
- Panning only works on empty timeline space
- Clips can still be dragged normally (without Shift)
- Use scrollbar as alternative for precise positioning

### Viewing Waveforms

**Automatic Display:**
- Waveforms appear on all clips automatically
- No configuration needed
- Updates when zooming

**Use Cases:**
- **Visual alignment** - see where audio starts/ends
- **Find beats** - identify percussive hits visually  
- **Detect silence** - spot gaps in audio
- **Trim planning** - see what to cut before editing

## Technical Details

### Zoom Mathematics

```javascript
// Calculate new bar width
barWidth = baseBarWidth × (zoomLevel / 100)

// Example at 150% zoom:
barWidth = 150px × 1.5 = 225px per bar

// Clip width calculation
const secondsPerBar = (60 / BPM) × 4;
const clipWidthInBars = clipDuration / secondsPerBar;
const clipWidthPx = clipWidthInBars × barWidth;
```

### Waveform Rendering

```javascript
// Canvas resolution
canvas.width = clipWidth × devicePixelRatio;
canvas.height = clipHeight × devicePixelRatio;
canvas.style.width = `${clipWidth}px`;
canvas.style.height = `${clipHeight}px`;

// Sample downsampling
const step = Math.ceil(audioBuffer.length / canvas.width);
// Draw ~1 sample per pixel for performance
```

### Pan Gesture Detection

```javascript
// Prevent panning on interactive elements
if (e.target.closest('.timeline-clip') || 
    e.target.closest('.clip-item') ||
    e.target.closest('button') ||
    e.target.closest('input')) {
    return; // Don't start panning
}

// Allow panning on background
if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
    startPanning();
}
```

## Performance Considerations

### Waveform Rendering
- **Downsampling:** Audio is sampled at ~1 point per pixel
- **Lazy rendering:** Only draws visible waveforms
- **Cached:** Canvas remains until zoom/resize

### Zoom Performance
- **Batch updates:** All clips updated together
- **RAF (RequestAnimationFrame):** Smooth visual updates
- **CSS transforms:** Hardware-accelerated when possible

### Panning Smoothness
- **Native scrolling:** Uses browser's optimized scroll
- **Smooth scroll:** CSS `scroll-behavior: smooth`
- **Debouncing:** Prevents excessive redraws during pan

## Browser Compatibility

### Required Features
- ✅ Canvas API (all modern browsers)
- ✅ ResizeObserver (IE 11+, all modern browsers)
- ✅ Audio API (Chrome, Firefox, Safari, Edge)
- ✅ CSS custom properties (all modern browsers)

### Fallbacks
```javascript
// ResizeObserver fallback
if (typeof ResizeObserver === 'undefined') {
    // Manual resize detection via window.resize event
}

// Device pixel ratio fallback
const dpr = window.devicePixelRatio || 1;
```

## Known Limitations

1. **Maximum Zoom:** Limited to 200% to prevent performance issues
2. **Minimum Zoom:** Limited to 50% to maintain readability
3. **Waveform Detail:** Limited by canvas resolution
4. **Mobile Support:** Touch panning not yet implemented

## Future Enhancements

### Planned Features
- [ ] Keyboard shortcuts for zoom (Ctrl +/-, Ctrl 0)
- [ ] Pinch-to-zoom on trackpad/touchscreen
- [ ] Two-finger scroll for horizontal panning (trackpad)
- [ ] Zoom to selection
- [ ] Fit timeline to window width
- [ ] Waveform color customization
- [ ] Vertical zoom (waveform amplitude)
- [ ] Mini-map navigator

### Potential Improvements
- [ ] Smooth zoom animation
- [ ] Zoom focus point (zoom toward cursor)
- [ ] Waveform peak detection
- [ ] Waveform frequency display (spectrogram)
- [ ] Clip thumbnail previews
- [ ] Save zoom level preference

## Troubleshooting

### Waveforms Not Showing
**Symptoms:** Clips appear solid color, no waveform
**Solutions:**
1. Check browser console for Canvas errors
2. Verify audio buffer is loaded correctly
3. Try refreshing the page
4. Check if clip has valid audio data

### Panning Not Working
**Symptoms:** Can't drag timeline, scrollbar doesn't appear
**Solutions:**
1. **Zoom in first** - panning only works when timeline is wider than viewport
2. Make sure you're holding `Shift` key
3. Try middle mouse button instead
4. Click on empty timeline space, not on clips

### Waveforms Blurry
**Symptoms:** Waveforms appear pixelated or blurry
**Solutions:**
1. Feature automatically handles device pixel ratio
2. Try zooming in for higher resolution
3. Check if browser supports Canvas scaling

### Performance Issues
**Symptoms:** Lag when zooming or panning
**Solutions:**
1. Reduce number of clips on timeline
2. Close other browser tabs
3. Use lower zoom levels
4. Consider shorter audio clips

## Testing Checklist

### Zoom Functionality
- [x] Zoom slider changes timeline scale
- [x] Zoom value displays correctly
- [x] Clips resize proportionally
- [x] Grid spacing adjusts
- [x] Waveforms redraw at new resolution
- [x] Ruler markers update

### Pan Functionality  
- [x] Shift+Drag pans timeline
- [x] Middle mouse pans timeline
- [x] Cursor changes during pan
- [x] Panning doesn't interfere with clip drag
- [x] Smooth scrolling works
- [x] Scrollbar appears when zoomed

### Waveform Display
- [x] Waveforms render on all clips
- [x] Waveforms are crisp (not blurry)
- [x] Waveforms update on zoom
- [x] Waveforms update on window resize
- [x] Waveforms stay within clip bounds
- [x] Text overlay is readable over waveform

### Integration
- [x] Works with clip dragging
- [x] Works with clip effects
- [x] Works with playback
- [x] Works with recording
- [x] Works in fullscreen mode

---

**Implemented by:** Lior Shahverdi and Claude Sonnet 4.5  
**Date:** October 26, 2025
