# Independent Pitch & Tone Controls - Release Notes

## Overview
Added independent pitch and tone controls to both DJ tracks, with Tone.js integration for true pitch shifting without tempo changes.

## New Features

### 1. **Four Independent Track Controls**
Each DJ track now has four vertical sliders (left to right):
- **Volume** - Control overall track volume (0-100%)
- **Tempo** - Adjust playback speed (0.25x - 2.0x)
- **Tone** - Shape frequency content with low-pass filter (20Hz - 20kHz)
  - Default: 10kHz (middle position)
  - Decrease for darker/warmer sound
  - Increase for brighter/crisper sound
- **Pitch** - True pitch shifting (-12 to +12 semitones)
  - Independent of tempo (doesn't affect playback speed)
  - Powered by Tone.js PitchShift effect

### 2. **Tone.js Integration**
- Added Tone.js library (v14.8.49) via CDN
- Integrated with existing Web Audio API pipeline
- PitchShift effect with optimized settings:
  - Window size: 0.1 for better quality
  - Zero feedback and delay time for clean output
  - Real-time pitch adjustment during playback

### 3. **Audio Signal Chain**
Updated effects chain for each track:
```
source → gain → panner → pitchShifter → filter (tone) → reverb → delay → merger
```

### 4. **Smart Fallback**
- If Tone.js fails to load, pitch control falls back to vinyl-style pitch shifting
- Fallback mode links pitch and tempo (traditional turntable behavior)
- Graceful degradation ensures functionality in all scenarios

## Technical Implementation

### Files Modified
1. **`app/templates/index.html`**
   - Added Tone.js CDN script
   - Reordered sliders: Volume → Tempo → Tone → Pitch
   - Set tone default to 10kHz (middle position)

2. **`app/static/js/modules/audio-effects.js`**
   - Added `pitchShifter` creation in `initAudioEffects()`
   - Integrated Tone.js context with Web Audio API
   - Updated `connectEffectsChain()` to include pitch shifter in signal path

3. **`app/static/js/app.js`**
   - Added `pitchShifter1` and `pitchShifter2` variables
   - Updated pitch slider event listeners to use Tone.js
   - Modified tempo sliders to work independently when pitch shifter is available
   - Added fallback logic for environments without Tone.js

### CSS Updates
- Standardized all slider sizes (8px × 150px)
- Normalized thumb sizes to 18px × 18px
- Added hover effects (1.2× scale with enhanced glow)
- Updated tempo slider styling to match other controls

## User Benefits

### Creative Possibilities
1. **Harmonic Mixing** - Match keys between tracks without affecting tempo
2. **Key Changing** - Transpose songs up or down while maintaining groove
3. **Tonal Shaping** - Adjust brightness/darkness independent of pitch
4. **Professional DJ Workflow** - All essential controls in one place

### Real-Time Control
- All sliders are draggable during playback
- Smooth, glitch-free parameter changes
- Instant visual feedback on labels
- Professional DJ mixer experience

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may have slight differences in pitch shifting quality)
- Requires modern browsers with Web Audio API support

## Performance Notes
- Pitch shifting is CPU-intensive
- Window size optimized for quality/performance balance
- May impact performance on lower-end devices when both tracks use pitch shifting
- Monitor CPU usage when using extreme pitch shifts (±10 semitones or more)

## Future Enhancements
- Add formant preservation option for vocal tracks
- Implement pitch quantization/snap-to-scale
- Add pitch bend automation/LFO
- Visual feedback for pitch/key relationships between tracks

## Testing Recommendations
1. Load audio to both tracks
2. Test pitch shifting: ±1, ±3, ±6, ±12 semitones
3. Verify tempo independence (change tempo, pitch should remain)
4. Test tone control from min (20Hz) to max (20kHz)
5. Combine pitch and tone for creative effects
6. Monitor CPU usage with both effects active

---

**Version**: 3.21
**Date**: October 28, 2025
**Category**: Audio Effects Enhancement
