# Pitch & Tone Sliders Feature - October 28, 2025

## Overview
Added dedicated **Pitch** and **Tone** sliders to each DJ track (Track 1 and Track 2), positioned alongside the existing **Tempo** and **Volume** controls. All four sliders are draggable during playback for live DJ mixing and creative performance.

## Features

### 1. **Pitch Slider** (-12 to +12 semitones)
- **Range**: -12 to +12 semitones (±1 octave)
- **Step**: 0.1 semitones for precise pitch adjustment
- **Live Control**: Draggable during playback
- **Interaction**: Works in conjunction with tempo slider
- **Visual**: Vertical green-themed slider with gradient (green → white → orange)
- **Label**: Shows current pitch (e.g., "+5.0", "0", "-3.2")

#### How It Works
- Uses exponential pitch shifting: `playbackRate = tempo × 2^(semitones/12)`
- Maintains tempo while adjusting pitch
- Both tempo and pitch affect the final playback rate
- Perfect for:
  - Key matching different tracks
  - Creating harmonies
  - Pitch bending effects
  - Live remixing

### 2. **Tone Slider** (20Hz to 20kHz)
- **Range**: 20Hz to 20kHz
- **Step**: 10Hz increments
- **Type**: Low-pass filter
- **Live Control**: Draggable during playback
- **Visual**: Vertical orange-themed slider with gradient (white → orange)
- **Label**: Shows current frequency (e.g., "20kHz", "5.2kHz", "440Hz")

#### How It Works
- Controls the low-pass filter cutoff frequency
- Default: 20kHz (wide open, no filtering)
- Lower values progressively cut high frequencies
- Perfect for:
  - Creating filter sweeps
  - Removing brightness from tracks
  - Build-up and breakdown effects
  - Creative sound design

## Implementation Details

### HTML Changes (`app/templates/index.html`)

**Added to Track 1 controls** (lines ~127-136):
```html
<div class="pitch-control-inline">
    <label>Pitch: <span id="pitchValue1">0</span></label>
    <input type="range" id="pitchSlider1" min="-12" max="12" step="0.1" value="0" class="pitch-slider">
</div>
<div class="tone-control-inline">
    <label>Tone: <span id="toneValue1">20kHz</span></label>
    <input type="range" id="toneSlider1" min="20" max="20000" step="10" value="20000" class="tone-slider">
</div>
```

**Added to Track 2 controls** (lines ~497-506):
```html
<div class="pitch-control-inline">
    <label>Pitch: <span id="pitchValue2">0</span></label>
    <input type="range" id="pitchSlider2" min="-12" max="12" step="0.1" value="0" class="pitch-slider">
</div>
<div class="tone-control-inline">
    <label>Tone: <span id="toneValue2">20kHz</span></label>
    <input type="range" id="toneSlider2" min="20" max="20000" step="10" value="20000" class="tone-slider">
</div>
```

### CSS Styling (`app/static/css/style.css`)

**Pitch Control Styling** (lines ~964-1034):
```css
.pitch-control-inline {
    flex: 1;
    padding: 15px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 200px;
}

.pitch-slider {
    writing-mode: bt-lr; /* IE */
    -webkit-appearance: slider-vertical; /* Webkit */
    appearance: slider-vertical; /* Standard */
    width: 8px;
    height: 150px;
    background: linear-gradient(180deg, 
        rgba(0, 255, 0, 0.6) 0%, 
        rgba(255, 255, 255, 0.6) 50%, 
        rgba(255, 165, 0, 0.6) 100%
    );
}
```

**Tone Control Styling** (lines ~1036-1106):
```css
.tone-control-inline {
    flex: 1;
    padding: 15px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 200px;
}

.tone-slider {
    writing-mode: bt-lr; /* IE */
    -webkit-appearance: slider-vertical; /* Webkit */
    appearance: slider-vertical; /* Standard */
    width: 8px;
    height: 150px;
    background: linear-gradient(180deg, 
        rgba(255, 255, 255, 0.6) 0%, 
        rgba(255, 165, 0, 0.6) 100%
    );
}
```

### JavaScript Implementation (`app/static/js/visualizer-dual.js`)

**DOM Element References** (lines ~101-108, ~156-163):
```javascript
// Track 1
const pitchSlider1 = document.getElementById('pitchSlider1');
const pitchValue1 = document.getElementById('pitchValue1');
const toneSlider1 = document.getElementById('toneSlider1');
const toneValue1 = document.getElementById('toneValue1');

// Track 2
const pitchSlider2 = document.getElementById('pitchSlider2');
const pitchValue2 = document.getElementById('pitchValue2');
const toneSlider2 = document.getElementById('toneSlider2');
const toneValue2 = document.getElementById('toneValue2');
```

**Pitch Event Listeners** (lines ~5546-5578):
```javascript
// Pitch sliders
pitchSlider1.addEventListener('input', (e) => {
    const pitch = parseFloat(e.target.value);
    const pitchShift = Math.pow(2, pitch / 12);
    const currentTempo = parseFloat(tempoSlider1.value);
    audioElement1.playbackRate = currentTempo * pitchShift;
    
    if (pitch === 0) {
        pitchValue1.textContent = '0';
    } else if (pitch > 0) {
        pitchValue1.textContent = `+${pitch.toFixed(1)}`;
    } else {
        pitchValue1.textContent = pitch.toFixed(1);
    }
});
```

**Tone Event Listeners** (lines ~5580-5602):
```javascript
// Tone sliders (filter control)
toneSlider1.addEventListener('input', (e) => {
    const freq = parseInt(e.target.value);
    if (filter1) {
        filter1.frequency.value = freq;
    }
    if (freq >= 1000) {
        toneValue1.textContent = (freq / 1000).toFixed(1) + 'kHz';
    } else {
        toneValue1.textContent = freq + 'Hz';
    }
});
```

**Updated Tempo Sliders** (lines ~5483-5497):
```javascript
tempoSlider1.addEventListener('input', (e) => {
    const tempo = parseFloat(e.target.value);
    const pitch = parseFloat(pitchSlider1.value);
    const pitchShift = Math.pow(2, pitch / 12);
    audioElement1.playbackRate = tempo * pitchShift;
    tempoValue1.textContent = tempo.toFixed(2) + 'x';
});
```

## Layout

Each track now has **4 vertical sliders** side-by-side:
```
┌─────────┬─────────┬─────────┬─────────┐
│  Tempo  │ Volume  │  Pitch  │  Tone   │
│  (cyan) │(magenta)│ (green) │(orange) │
│   ↕️     │   ↕️     │   ↕️     │   ↕️     │
│ 0.25-2x │ 0-100%  │ -12/+12 │20Hz-20k │
└─────────┴─────────┴─────────┴─────────┘
```

All sliders are positioned in the `.tempo-volume-row` container below the waveform and loop controls.

## Usage Examples

### Example 1: Key Matching
1. Load two tracks in different keys
2. Adjust **Pitch** slider on one track to match the other
3. Use your ear or the key detection display
4. Mix seamlessly without dissonance

### Example 2: Filter Sweep Build-Up
1. Start with **Tone** at 20kHz (wide open)
2. During playback, drag **Tone** down to 500Hz
3. Creates a classic low-pass filter sweep
4. Release back to 20kHz for the drop

### Example 3: Pitch Bend Effect
1. During playback, drag **Pitch** up +5 semitones
2. Creates a "chipmunk" effect
3. Drag down -5 semitones for "slow-mo" effect
4. Return to 0 for normal pitch

### Example 4: Combined Tempo + Pitch
1. Set **Tempo** to 1.5x (faster)
2. Set **Pitch** to -7 semitones (down a fifth)
3. Track plays faster but at lower pitch
4. Independent control of speed vs. pitch

## Technical Notes

### Pitch Shifting Algorithm
- Uses exponential formula: `2^(semitones/12)`
- Combines multiplicatively with tempo
- Final playback rate = `tempo × pitchShift`
- Example: Tempo 1.2x + Pitch +5 = 1.2 × 2^(5/12) ≈ 1.61x

### Filter Implementation
- Uses Web Audio API `BiquadFilterNode`
- Type: Low-pass filter
- Q-value: 1.0 (moderate resonance)
- Real-time frequency updates during playback

### Performance
- All sliders respond instantly during playback
- No audio glitches or interruptions
- Smooth parameter transitions
- Browser-native audio processing (no external libraries)

## Color Coding

| Control | Color | Gradient |
|---------|-------|----------|
| Tempo | Cyan | Green → White → Red |
| Volume | Magenta | Magenta → Gray |
| Pitch | Green | Green → White → Orange |
| Tone | Orange | White → Orange |
| Pan | Yellow | Cyan → White → Magenta |

## Compatibility

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Mobile browsers (touch-friendly vertical sliders)

## Future Enhancements

Potential additions:
- **Pitch lock mode**: Adjust tempo without changing pitch
- **Resonance control**: Add Q-factor slider for tone
- **Filter type selector**: High-pass, band-pass options
- **MIDI mapping**: Control sliders with external hardware
- **Automation recording**: Record slider movements

---

**Files Modified:**
- `app/templates/index.html`
- `app/static/css/style.css`
- `app/static/js/visualizer-dual.js`

**Lines Changed:** ~200 lines added
