# Release Notes v3.11.0

## XY Oscilloscope Visualization

### New Feature: Lissajous Mode Oscilloscope

Added a professional XY oscilloscope visualization positioned to the right of the 3D visualization, creating a comprehensive dual-visualization system.

### Key Features

#### 1. **Cartesian Coordinate System**
- Origin (0,0) positioned at the center of the canvas
- Clear X and Y axes drawn through the center in bright cyan
- Small dot marker at the origin point
- Grid overlay with 8x8 division for precise visual reference

#### 2. **XY Plotting Mode (Lissajous)**
- Plots audio samples as (X, Y) coordinates instead of time-domain waveform
- Uses phase offset between samples to create dynamic patterns
- Visualizes stereo phase relationships and harmonic content
- Real-time animation based on combined audio from both tracks

#### 3. **Visual Effects**
- **Motion Blur**: Slower fade creates beautiful trailing effects
- **Radial Gradient**: Colors flow from magenta at center to cyan at edges
- **Glow Points**: Scattered luminous points along the pattern add depth
- **Smooth Animation**: RequestAnimationFrame for 60fps rendering

#### 4. **Pattern Interpretation**
The oscilloscope patterns reveal stereo relationships:
- **Circular/elliptical**: Tracks are similar or in phase
- **Diagonal lines**: One track dominates
- **Complex Lissajous curves**: Interesting harmonic relationships
- **Tight center pattern**: Mono or centered content
- **Wide pattern**: Strong stereo separation

#### 5. **Recorded Audio Playback**
- Automatically switches to display recorded audio when you play it back
- Shows the stereo characteristics of your recordings
- Returns to displaying tracks when recording stops/pauses
- Perfect for analyzing what you just created

#### 6. **Responsive Layout**
- Side-by-side with 3D visualization (2fr:1fr grid)
- Automatically stacks vertically on screens below 1200px
- Canvas auto-resizes to container dimensions
- Maintains aspect ratio and scaling

### Technical Implementation

#### Files Modified
1. **app/templates/index.html**
   - Added `visualization-wrapper` container
   - Added `oscilloscope-container` with header and canvas

2. **app/static/css/style.css**
   - Grid layout for visualization wrapper (2fr 1fr)
   - Oscilloscope container styling with glass-morphism
   - Cyan-themed header matching app aesthetic
   - Responsive media query for mobile/tablet

3. **app/static/js/app.js**
   - New variables: `oscilloscopeCanvas`, `oscilloscopeCtx`, `oscilloscopeAnalyser`, `oscilloscopeAnimationId`, `recordedAudioSource`
   - `initOscilloscope()`: Sets up canvas and analyser
   - `drawOscilloscope()`: XY plotting with phase offset
   - `connectOscilloscopeToMerger()`: Routes audio to oscilloscope analyser
   - `setupRecordedAudioConnection()`: Manages recorded audio routing
   - DOMContentLoaded listener for immediate initialization
   - Graceful degradation when no audio is playing (shows grid and center dot)

#### Audio Routing
```
Track 1 & Track 2
       ↓
    Merger (stereo)
       ↓
       ├→ Main Analyser (3D visualization)
       ├→ Oscilloscope Analyser (XY plot)
       └→ Master Effects → Output

Recorded Audio (when playing)
       ↓
    MediaElementSource
       ↓
       ├→ Oscilloscope Analyser
       └→ Audio Destination
```

### Performance
- Separate AnalyserNode prevents interference with 3D visualization
- FFT size: 2048 (good balance of resolution and performance)
- Smoothing: 0.3 (responsive but not jittery)
- Canvas updates at 60fps via requestAnimationFrame

### User Experience
- Visible immediately on page load (shows grid)
- Animates when audio starts playing
- Works with all audio sources (tracks, recordings, microphone)
- Auto-switches between live mix and recorded playback
- No configuration needed - just works!

### Use Cases
- Monitor stereo phase relationships while DJing
- Check mono compatibility of your mix
- Analyze harmonic content of recordings
- Visualize crossfader transitions
- Analyze what you just recorded
- Educational tool for understanding stereo audio
- Live performance visual element

### Future Enhancements (Ideas)
- Toggle between XY mode and traditional time-domain mode
- Adjustable phase offset for different Lissajous patterns
- Color customization
- Persistence/freeze mode
- Export oscilloscope patterns as images

---

**Version**: 3.11.0  
**Date**: October 24, 2025  
**Type**: Feature Enhancement  
**Backward Compatible**: Yes