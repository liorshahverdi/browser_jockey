# ADSR Envelope Effect Integration

## Overview
Added comprehensive ADSR (Attack, Decay, Sustain, Release) envelope functionality across the entire Browser Jockey application, including:
- Track 1 & Track 2 effect chains
- Master output effect chain
- Keyboard sampler with optional ADSR
- Full drag-and-drop effect chain integration

## Implementation Date
October 25, 2025

## What is ADSR?

ADSR is a classic synthesis envelope that shapes how sound evolves over time:

- **Attack (A)**: Time for sound to ramp from 0 to maximum volume
- **Decay (D)**: Time for sound to drop from peak to sustain level
- **Sustain (S)**: Level at which sound holds (0-100% of peak)
- **Release (R)**: Time for sound to fade to silence after release

```
Volume
  ^
  |     /\
  |    /  \___________
  |   /    D    S     \
  |  /                 \
  | /  A                R\
  |/_____________________\___> Time
```

## Features

### 1. Track ADSR Effects (Track 1 & Track 2)

**Location:** Track effect sections (below filter controls)

**Controls:**
- **Attack Slider**: 1ms - 2000ms (2 seconds)
- **Decay Slider**: 1ms - 2000ms
- **Sustain Slider**: 0% - 100%
- **Release Slider**: 1ms - 5000ms (5 seconds)
- **Trigger Button**: Manually trigger the envelope

**Behavior:**
- Hidden by default (enable via effect chain drag-and-drop)
- When enabled, applies gain envelope to track audio
- Click "⚡ Trigger" button to manually start attack phase
- Envelope affects all audio passing through the track

**Use Cases:**
- Create rhythmic gating effects
- Add percussive attack to sustained sounds
- Shape loops with dynamic envelopes
- Create swells and fades

### 2. Master ADSR Effect

**Location:** Master channel effects section

**Same controls as track ADSR**

**Behavior:**
- Affects the final mixed output of all tracks
- Can be used to create master fade-ins/fade-outs
- Useful for live performance transitions

### 3. Keyboard Sampler ADSR

**Location:** Keyboard Sampler section (below volume control)

**Controls:**
- **Enable Checkbox**: Toggle ADSR on/off for sampler
- **Attack, Decay, Sustain, Release sliders** (same ranges as tracks)

**Behavior:**
- **Disabled (default)**: Sampler uses exponential decay (original behavior)
- **Enabled**: Each key press triggers ADSR envelope
  - Attack: Fade in from silence
  - Decay: Drop to sustain level
  - Sustain: Hold at level while playing
  - Release: Fade out when sample ends

**Differences from Track ADSR:**
- Automatically triggers on each note (no manual trigger button)
- Envelope is applied per-note (each key press gets its own envelope)
- Release starts automatically when sample finishes playing

### 4. Effect Chain Integration

**Drag & Drop Support:**
- ADSR appears in effect chain with 📊 icon
- Can be reordered with other effects (filter, reverb, delay)
- Toggle on/off via effect chain UI
- Default position: Between filter and reverb (disabled)

**Signal Flow Examples:**

**Track with ADSR enabled:**
```
Audio Source → Gain → Panner → Filter → ADSR Envelope → Reverb → Delay → Output
```

**Track with ADSR disabled:**
```
Audio Source → Gain → Panner → Filter → Reverb → Delay → Output
```

**Effect Order Matters:**
- ADSR before reverb: Envelope shapes dry signal, reverb tail continues
- ADSR after reverb: Envelope shapes wet signal including reverb tail
- ADSR before delay: Creates rhythmic delay patterns
- ADSR after delay: Shapes entire delay feedback

## Technical Implementation

### Core Functions

**`createADSREnvelope(context)`**
```javascript
// Creates ADSR effect nodes
Returns: {
    envelope: GainNode,  // The gain node that applies envelope
    parameters: {
        attack: 0.01,    // seconds
        decay: 0.1,      // seconds  
        sustain: 0.8,    // 0-1
        release: 0.3,    // seconds
        enabled: false,
        targetGain: 1.0
    }
}
```

**`triggerADSRAttack(adsrEffect, audioContext, targetGain)`**
```javascript
// Starts the ADSR envelope cycle
// 1. Cancels any ongoing envelopes
// 2. Schedules attack ramp
// 3. Schedules decay to sustain
// 4. Sets enabled flag
```

**`triggerADSRRelease(adsrEffect, audioContext)`**
```javascript
// Triggers release phase
// 1. Cancels scheduled values
// 2. Starts from current gain
// 3. Ramps to zero over release time
```

**`updateADSRParameters(adsrEffect, attack, decay, sustain, release)`**
```javascript
// Updates ADSR parameters
// Use undefined to skip updating a parameter
// Example: updateADSRParameters(adsr, 0.05, undefined, undefined, undefined)
//          ^ Only updates attack time
```

### Integration Points

**audio-effects.js:**
- Added ADSR creation in `initAudioEffects()`
- Exported ADSR helper functions
- ADSR node included in returned effects object

**effect-chain.js:**
- Added ADSR to available effects list
- Added ADSR case in `connectEffectsInOrder()`
- ADSR connects as simple gain node in chain

**sampler.js:**
- Modified `playSamplerNote()` to accept ADSR parameters
- Conditional envelope application based on `adsrEnabled` flag
- Smart release timing (starts before sample ends)

**app.js:**
- Declared ADSR variables for tracks and master
- Added event listeners for all ADSR controls
- Integrated ADSR trigger buttons
- Pass ADSR params to sampler

### HTML Structure

```html
<div id="adsrControl1" class="effect-control" style="display: none;">
    <div class="adsr-header">
        <label>📊 ADSR Envelope</label>
        <button id="adsrTrigger1" class="adsr-trigger-btn">⚡ Trigger</button>
    </div>
    <div class="adsr-controls">
        <div class="adsr-param">
            <label>Attack: <span id="adsrAttackValue1">10ms</span></label>
            <input type="range" id="adsrAttackSlider1" min="1" max="2000" value="10">
        </div>
        <!-- Decay, Sustain, Release params... -->
    </div>
</div>
```

**Sampler variant:**
```html
<div class="sampler-adsr-control">
    <div class="adsr-header">
        <label>📊 ADSR Envelope</label>
        <input type="checkbox" id="samplerADSREnable">
        <label for="samplerADSREnable">Enable</label>
    </div>
    <div class="adsr-controls" id="samplerADSRControls" style="display: none;">
        <!-- ADSR param sliders... -->
    </div>
</div>
```

### CSS Styling

**Key classes:**
- `.adsr-header` - Header with label and trigger/enable controls
- `.adsr-trigger-btn` - Orange gradient trigger button with glow
- `.adsr-controls` - Container for parameter sliders
- `.adsr-param` - Individual parameter control
- `.sampler-adsr-control` - Special styling for sampler section

**Color scheme:**
- Orange/amber theme (#ff8c00, #ffa500, #ffb732)
- Glowing effects on trigger button
- Distinct from other effects (cyan/blue)

## Usage Guide

### Track ADSR

1. **Enable ADSR in effect chain:**
   - Drag ADSR effect in chain UI
   - Or click toggle to enable
   - Controls appear in effects section

2. **Adjust parameters:**
   - Attack: How quickly sound fades in
   - Decay: How quickly it drops to sustain
   - Sustain: Level to hold at
   - Release: How quickly it fades out

3. **Trigger envelope:**
   - Click "⚡ Trigger" button
   - Or trigger via automation (future feature)

### Sampler ADSR

1. **Enable ADSR:**
   - Check "Enable" checkbox in sampler section
   - ADSR controls appear

2. **Adjust envelope:**
   - Set Attack for key fade-in (0-2s)
   - Set Decay for drop to sustain (0-2s)
   - Set Sustain level (0-100%)
   - Set Release for fade-out (0-5s)

3. **Play notes:**
   - Press sampler keys (Q-I, A-K)
   - Each note triggers its own envelope
   - Envelopes overlap for polyphony

### Creative Applications

**Gated Reverb Effect:**
1. Enable ADSR after reverb in chain
2. Set: A=1ms, D=200ms, S=0%, R=50ms
3. Trigger manually for 80s-style gated reverb

**Reverse Swell:**
1. Set: A=2000ms, D=0ms, S=100%, R=500ms
2. Creates slow fade-in effect

**Percussive Stabs:**
1. Set: A=1ms, D=100ms, S=20%, R=200ms
2. Creates punchy, decaying hits

**Pad Swell:**
1. Set: A=500ms, D=500ms, S=70%, R=1000ms
2. Creates smooth, evolving textures

**Sampler Piano-like:**
1. Enable sampler ADSR
2. Set: A=10ms, D=300ms, S=50%, R=800ms
3. Notes have natural attack and decay

## Parameter Ranges

| Parameter | Min | Max | Default | Unit |
|-----------|-----|-----|---------|------|
| Attack | 1ms | 2000ms | 10ms | milliseconds |
| Decay | 1ms | 2000ms | 100ms | milliseconds |
| Sustain | 0% | 100% | 80% | percentage |
| Release | 1ms | 5000ms | 300ms | milliseconds |

**Note:** All time values are converted to seconds internally (ms / 1000)

## Known Limitations

1. **Manual Triggering Only (Tracks/Master):**
   - No automatic triggering based on audio detection
   - No MIDI/external trigger support yet
   - Requires manual button click

2. **No Envelope Visualization:**
   - No graphical display of envelope shape
   - No real-time envelope progress indicator

3. **Linear Ramps Only:**
   - Uses `linearRampToValueAtTime()`
   - No exponential or logarithmic curves
   - May sound less natural than analog envelopes

4. **Sampler Release Timing:**
   - Release phase starts before sample ends (to fit within duration)
   - Very short samples may not have full release
   - Long releases may be cut off by sample end

5. **No Loop Integration:**
   - ADSR doesn't auto-trigger on loop points
   - No per-loop envelope triggering
   - Manual triggering only

## Future Enhancements

Potential improvements:
- [ ] Audio-reactive triggering (transient detection)
- [ ] Envelope follower mode (track input amplitude)
- [ ] Visual envelope graph display
- [ ] Envelope curve types (exponential, logarithmic, s-curve)
- [ ] MIDI note-on/note-off triggering
- [ ] Per-loop-marker triggering
- [ ] Envelope presets (piano, organ, strings, brass, etc.)
- [ ] Inverted envelopes (for ducking effects)
- [ ] Multi-stage envelopes (AHDSR, etc.)
- [ ] Tempo-synced envelope times

## Files Modified

1. **app/static/js/modules/audio-effects.js**
   - Added `createADSREnvelope()`
   - Added `triggerADSRAttack()`
   - Added `triggerADSRRelease()`
   - Added `updateADSRParameters()`
   - Integrated ADSR into `initAudioEffects()`

2. **app/static/js/modules/effect-chain.js**
   - Added ADSR to available effects (📊 icon)
   - Added ADSR case in `connectEffectsInOrder()`
   - Updated default chain (ADSR disabled by default)

3. **app/static/js/modules/sampler.js**
   - Enhanced `playSamplerNote()` with ADSR support
   - Added conditional envelope vs. exponential decay
   - Smart release timing for sample duration

4. **app/static/js/app.js**
   - Imported ADSR functions
   - Declared ADSR variables (adsr1, adsr2, adsrMaster)
   - Declared sampler ADSR state
   - Initialized ADSR from effects
   - Added 60+ lines of event listeners
   - Updated sampler note wrapper

5. **app/templates/index.html**
   - Added ADSR controls for Track 1
   - Added ADSR controls for Track 2
   - Added ADSR controls for Master
   - Added ADSR controls for Sampler (with enable checkbox)

6. **app/static/css/style.css**
   - Added `.adsr-header` styling
   - Added `.adsr-trigger-btn` with orange gradient
   - Added `.adsr-controls` container styling
   - Added `.adsr-param` styling
   - Added `.sampler-adsr-control` styling
   - Added checkbox and label styling

## Testing Checklist

- [x] Track 1 ADSR parameters update correctly
- [x] Track 1 ADSR trigger button works
- [x] Track 2 ADSR parameters update correctly
- [x] Track 2 ADSR trigger button works
- [x] Master ADSR parameters update correctly
- [x] Master ADSR trigger button works
- [x] Sampler ADSR enable/disable toggle works
- [x] Sampler ADSR parameters update correctly
- [x] Sampler notes trigger ADSR when enabled
- [x] Sampler uses exponential decay when ADSR disabled
- [x] ADSR appears in effect chain UI
- [x] ADSR can be dragged/reordered in chain
- [x] ADSR can be toggled on/off in chain
- [x] ADSR signal routing works correctly
- [x] No JavaScript errors in console
- [x] UI displays all controls correctly

## Example Configurations

### 1. Classic Synthesizer Pad
**Track ADSR:**
- Attack: 800ms
- Decay: 600ms
- Sustain: 70%
- Release: 1200ms

**Effect Chain:** Filter → ADSR → Reverb → Delay

### 2. Percussive Gated Effect
**Track ADSR:**
- Attack: 1ms
- Decay: 150ms
- Sustain: 0%
- Release: 50ms

**Effect Chain:** Filter → ADSR (enable) → Reverb (high)

### 3. Piano-like Sampler
**Sampler ADSR (enabled):**
- Attack: 5ms
- Decay: 300ms
- Sustain: 40%
- Release: 800ms

### 4. Ambient Swell
**Master ADSR:**
- Attack: 2000ms
- Decay: 1000ms
- Sustain: 80%
- Release: 1500ms

Trigger at start of performance for gradual fade-in.

## Conclusion

The ADSR envelope effect adds powerful sound-shaping capabilities to Browser Jockey, enabling everything from subtle dynamic control to dramatic rhythmic effects. The integration with the drag-and-drop effect chain provides flexible signal routing, while the sampler ADSR opens up expressive keyboard performance possibilities.
