# Theremin Mapping Modes Feature

## Overview
The Camera Theremin now supports multiple control mapping modes, allowing you to modulate different audio parameters with hand motion beyond just pitch and volume.

## Date Implemented
October 25, 2025

## Mapping Modes

### 1. Pitch & Volume (Classic)
**Default mode** - Traditional theremin behavior

**Oscillator Mode:**
- **Y-axis (↕️):** Pitch control (100Hz - 4000Hz depending on range setting)
  - Top = High pitch
  - Bottom = Low pitch
- **X-axis (↔️):** Volume control (0% - 100%)
  - Left = Quiet
  - Right = Loud

**Track Mode (Track 1/Track 2):**
- **Y-axis (↕️):** Filter brightness (100Hz - 10kHz cutoff)
  - Top = Bright/Sharp
  - Bottom = Dark/Muffled
- **X-axis (↔️):** Volume control (0% - 100%)
  - Left = Quiet
  - Right = Loud

### 2. Filter & Resonance
**Advanced filter control mode**

**All Audio Sources:**
- **Y-axis (↕️):** Filter cutoff frequency (100Hz - 10kHz)
  - Top = Bright/Open filter
  - Bottom = Dark/Closed filter
- **X-axis (↔️):** Filter resonance/Q (0.5 - 20.5)
  - Left = Smooth, subtle filtering
  - Right = Sharp, resonant peaks (can self-oscillate)

**Note:** In this mode, volume is fixed at 30% of master volume for consistent output.

### 3. ADSR Envelope
**Dynamic envelope shaping mode**

Controls the amplitude envelope shape in real-time:

- **Y-axis (↕️):**
  - **Top half:** Attack time (0.001s - 2s)
    - Higher = Faster attack
    - Lower = Slower, gradual fade-in
  - **Bottom half:** Release time (0.001s - 5s)
    - Higher = Faster release
    - Lower = Slower, gradual fade-out

- **X-axis (↔️):**
  - **Left half:** Decay time (0.001s - 2s)
    - Left = Fast decay
    - Right = Slow decay to sustain
  - **Right half:** Sustain level (0 - 100%)
    - Left = Low sustain volume
    - Right = High sustain volume

**How it works:**
1. When hand is detected and wave activated:
   - **Attack:** Sound fades in over attack time
   - **Decay:** Sound drops from peak to sustain level over decay time
   - **Sustain:** Sound maintains at sustain level while hand is active
   
2. When hand/wave is lost:
   - **Release:** Sound fades out over release time

**Typical ADSR patterns:**
- **Plucked/Percussive:** Short attack, short decay, low sustain, short release
- **Pad/Ambient:** Long attack, long decay, high sustain, long release
- **Organ-like:** Short attack, no decay, full sustain, short release
- **String-like:** Medium attack, medium decay, medium sustain, medium release

## Implementation Details

### State Management
Added to `thereminState`:
```javascript
mappingMode: 'pitch-volume',  // 'pitch-volume', 'filter-resonance', 'adsr'
adsr: {
    attack: 0.01,   // Attack time in seconds
    decay: 0.1,     // Decay time in seconds
    sustain: 0.7,   // Sustain level (0-1)
    release: 0.3    // Release time in seconds
}
```

### Key Functions

**`setThereminMappingMode(mode)`**
- Sets the current mapping mode
- Updates UI labels dynamically
- Updates help text

**`updateThereminSound(position, confidence)`**
- Enhanced with switch statement for different modes
- Applies appropriate parameter mapping based on mode
- Calls `applyADSREnvelope()` in ADSR mode

**`applyADSREnvelope(startTime)`**
- Schedules gain envelope using Web Audio API
- Implements attack → decay → sustain phases
- Release handled by `fadeOutThereminSound()`

**`fadeOutThereminSound()`**
- Enhanced to use ADSR release time in ADSR mode
- Quick fade (0.2s) for other modes

**`updateDisplayValues(value1, value2, label1, label2)`**
- Enhanced to support dynamic labels
- Shows different parameters based on mode:
  - Pitch/Volume mode: "Freq" / "Vol"
  - Filter/Resonance mode: "Filter" / "Q"
  - ADSR mode: "A" / "D"

### UI Components

**HTML Elements:**
```html
<select id="thereminMappingMode">
    <option value="pitch-volume">Pitch & Volume (Classic)</option>
    <option value="filter-resonance">Filter & Resonance</option>
    <option value="adsr">ADSR Envelope</option>
</select>
<div class="theremin-mapping-help">
    <!-- Dynamic help text based on mode -->
</div>
```

**Dynamic Labels:**
- `#thereminFreqLabel` - Shows "Freq", "Filter", or "A"
- `#thereminVolLabel` - Shows "Vol", "Q", or "D"
- `#thereminFreqDisplay` - Shows corresponding value
- `#thereminVolDisplay` - Shows corresponding value with units

### Event Handlers

**app.js:**
```javascript
thereminMappingMode.addEventListener('change', (e) => {
    setThereminMappingMode(e.target.value);
    // Update help text
    // Update main description
});
```

## Usage Tips

### Pitch & Volume Mode
- Best for: Melodic playing, traditional theremin sounds
- Works with: All audio sources
- Tip: Use with sine/triangle waveforms for smooth tones

### Filter & Resonance Mode
- Best for: Sweeping filter effects, dub-style sounds, experimental textures
- Works with: All audio sources (especially effective with tracks)
- Tip: High resonance (far right) can create self-oscillating whistles
- Warning: High Q values can be very loud - adjust master volume accordingly

### ADSR Mode
- Best for: Creating evolving textures, pads, experimental envelopes
- Works with: All audio sources
- Tips:
  - Start with hand centered to hear default envelope (A=0.01s, D=0.1s, S=0.7, R=0.3s)
  - Move slowly to fine-tune envelope parameters
  - Experiment with extreme settings for unique effects
  - Combine with filter/resonance by switching modes during playback

## Technical Notes

### Web Audio API Usage
- Uses `linearRampToValueAtTime()` for smooth parameter transitions
- ADSR envelope uses `setValueAtTime()` + `linearRampToValueAtTime()` chains
- `cancelScheduledValues()` prevents envelope conflicts

### Performance
- Real-time parameter calculation at ~60fps
- Smooth ramping (50ms) prevents audio artifacts
- Efficient switching between modes (no audio glitches)

### Compatibility
- Works with oscillator synthesis
- Works with external sources (Track 1/Track 2)
- Compatible with wave detection activation
- Compatible with all other theremin settings (waveform, range, vibrato, reverb)

## Future Enhancements

Potential additions:
- LFO modulation mode (rate/depth control)
- Delay/Echo parameters (time/feedback)
- Distortion/Saturation (amount/tone)
- Preset saving/loading for mapping configurations
- Visual display of ADSR envelope shape
- MIDI output of envelope parameters
- Multi-parameter mode (control 4 parameters with quadrants)

## Files Modified

1. **app/static/js/modules/theremin.js**
   - Added `mappingMode` and `adsr` to state
   - Enhanced `updateThereminSound()` with mode switching
   - Added `applyADSREnvelope()` function
   - Enhanced `fadeOutThereminSound()` to use ADSR release
   - Enhanced `updateDisplayValues()` with dynamic labels
   - Added `setThereminMappingMode()` export

2. **app/static/js/app.js**
   - Imported `setThereminMappingMode`
   - Added event listener for mapping mode selector
   - Added dynamic help text updates

3. **app/templates/index.html**
   - Added mapping mode selector dropdown
   - Added help text container with dynamic content
   - Added label span elements for dynamic display

4. **app/static/css/style.css**
   - Added `.theremin-mapping-help` styling
   - Styled help text with subtle background and border

## Testing Checklist

- [x] Mode switching works smoothly without audio glitches
- [x] Pitch & Volume mode functions as before
- [x] Filter & Resonance mode controls filter correctly
- [x] ADSR mode creates proper envelopes
- [x] Display labels update when switching modes
- [x] Help text updates appropriately
- [x] Works with oscillator source
- [x] Works with track sources (Track 1/Track 2)
- [x] Wave detection still functions correctly
- [x] No JavaScript errors in console

## Known Limitations

1. **ADSR Mode:**
   - Sustain phase doesn't automatically "hold" - requires continuous hand detection
   - Release phase only triggers when hand/wave is lost
   - No visual representation of current envelope shape

2. **Filter & Resonance Mode:**
   - Very high Q values (>15) can be extremely loud
   - Self-oscillation at high Q may overpower input signal
   - Fixed volume may need adjustment for different use cases

3. **General:**
   - Display only shows 2 parameters at a time (primary use case)
   - No preset/snapshot system for parameter configurations
   - Envelope curves are linear (no exponential options)
