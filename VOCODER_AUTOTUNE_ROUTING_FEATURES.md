# Flexible Vocoder/Autotune & Master Routing Features

## Overview
Two major feature enhancements to the Browser Jockey application:
1. **Flexible Vocoder/Autotune**: Use microphone OR tracks as audio sources
2. **Master Output Routing**: Toggle individual tracks and sampler to master output

---

## Part 1: Flexible Vocoder & Auto-Tune

### Problem
Previously:
- Vocoder only worked with microphone as modulator
- Auto-Tune only worked with microphone
- Limited creative possibilities

### Solution
Now you can use:
- **Vocoder**: Any combination of mic/track as modulator and carrier
- **Auto-Tune**: Microphone, Track 1, or Track 2 as audio source

---

### Vocoder Changes

#### HTML Changes (`app/templates/index.html`)
**Added Modulator Source Selection:**
```html
<div class="vocoder-control">
    <label>Modulator (Voice):</label>
    <select id="vocoderModulator">
        <option value="mic" selected>Microphone</option>
        <option value="track1">Track 1</option>
        <option value="track2">Track 2</option>
    </select>
</div>
```

**Existing Carrier Source (unchanged):**
- Track 1
- Track 2
- Both Tracks (Mix)
- Microphone (Feedback)

#### JavaScript Changes (`app/static/js/visualizer-dual.js`)

**Added DOM Reference:**
```javascript
const vocoderModulator = document.getElementById('vocoderModulator');
```

**Added Event Listener:**
```javascript
vocoderModulator.addEventListener('change', updateVocoderModulator);
```

**Updated `enableVocoder()` Function:**
- Checks which modulator source is selected (mic, track1, track2)
- Validates that source is available before enabling
- Supports any valid modulator + carrier combination
- Only disconnects modulator from direct output if it's the microphone
- Improved error messages for better user feedback

**Added `updateVocoderModulator()` Function:**
- Rebuilds vocoder when modulator source changes
- Seamless switching between sources

---

### Auto-Tune Changes

#### HTML Changes (`app/templates/index.html`)
**Added Audio Source Selection:**
```html
<div class="autotune-control">
    <label>Audio Source:</label>
    <select id="autotuneSource">
        <option value="mic" selected>Microphone</option>
        <option value="track1">Track 1</option>
        <option value="track2">Track 2</option>
    </select>
</div>
```

#### JavaScript Changes (`app/static/js/visualizer-dual.js`)

**Added DOM Reference:**
```javascript
const autotuneSource = document.getElementById('autotuneSource');
```

**Added Event Listener:**
```javascript
autotuneSource.addEventListener('change', updateAutotuneSource);
```

**Updated `enableAutotune()` Function:**
- Checks which audio source is selected (mic, track1, track2)
- Validates that source is available before enabling
- Disconnects appropriate source from direct output
- Works independently or alongside vocoder

**Updated `disableAutotune()` Function:**
- Reconnects correct source based on source type
- Handles track1 and track2 reconnection properly

**Added `updateAutotuneSource()` Function:**
- Rebuilds auto-tune when audio source changes
- Smooth transitions between sources

---

### Creative Use Cases

#### Vocoder Combinations:
1. **Classic Robot Voice**: Mic (modulator) + Track 1 (carrier)
2. **Harmony Generator**: Track 1 (modulator) + Track 2 (carrier)
3. **Self-Vocoding**: Mic (modulator) + Mic (carrier) - creates feedback effects
4. **Talking Instrument**: Track 1 (modulator) + Track 2 (carrier)

#### Auto-Tune Applications:
1. **Live Vocal Correction**: Mic source
2. **Fix Recorded Vocals**: Load vocal recording to Track 1, apply auto-tune
3. **Creative Pitch Effects**: Apply auto-tune to instrumental tracks
4. **Real-time Harmony**: Auto-tune Track 1 while DJing with Track 2

---

## Part 2: Master Output Routing

### Problem
Previously:
- All active sources automatically sent to master output
- No way to solo or mute individual components
- Limited mixing control

### Solution
Toggle routing for:
- 🎵 Track 1
- 🎵 Track 2
- 🎹 Keyboard Sampler

---

### HTML Changes (`app/templates/index.html`)

**Added Master Routing Section:**
```html
<div class="master-routing-section">
    <div class="routing-header">🎛️ Routing</div>
    <div class="routing-controls">
        <label class="routing-toggle">
            <input type="checkbox" id="routeTrack1" checked>
            <span>🎵 Track 1</span>
        </label>
        <label class="routing-toggle">
            <input type="checkbox" id="routeTrack2" checked>
            <span>🎵 Track 2</span>
        </label>
        <label class="routing-toggle">
            <input type="checkbox" id="routeSampler" checked>
            <span>🎹 Sampler</span>
        </label>
    </div>
</div>
```

**Location**: Top of Master Output section, above effect chain

---

### CSS Changes (`app/static/css/style.css`)

**Added Routing Styles:**
```css
.master-routing-section
.routing-header
.routing-controls
.routing-toggle
```

**Features:**
- Dark background with gold borders (matches master theme)
- Interactive hover effects
- Checkbox accent color matches gold theme
- Visual feedback when checked (gold glow on text)
- Responsive flex layout with wrapping

---

### JavaScript Changes (`app/static/js/visualizer-dual.js`)

**Added DOM References:**
```javascript
const routeTrack1 = document.getElementById('routeTrack1');
const routeTrack2 = document.getElementById('routeTrack2');
const routeSampler = document.getElementById('routeSampler');
```

**Added Event Listeners:**
```javascript
routeTrack1.addEventListener('change', (e) => {
    toggleTrackRouting(1, e.target.checked);
});

routeTrack2.addEventListener('change', (e) => {
    toggleTrackRouting(2, e.target.checked);
});

routeSampler.addEventListener('change', (e) => {
    toggleSamplerRouting(e.target.checked);
});
```

**Added Functions:**

#### `toggleTrackRouting(trackNumber, enabled)`
- Connects/disconnects track gain node from merger
- Parameter: `trackNumber` (1 or 2)
- Parameter: `enabled` (true to route, false to disconnect)
- Error handling with automatic reconnection on failure
- Console logging for debugging

#### `toggleSamplerRouting(enabled)`
- Connects/disconnects sampler gain node from merger
- Parameter: `enabled` (true to route, false to disconnect)
- Error handling with automatic reconnection on failure
- Console logging for debugging

---

### Use Cases

#### Live Performance:
1. **Solo Track**: Uncheck Track 2 to solo Track 1
2. **A/B Comparison**: Toggle between tracks to compare mixes
3. **Layer Sampler**: Add sampler on top of tracks, toggle on/off

#### Mixing:
1. **Build Up**: Start with Track 1, gradually add Track 2 and Sampler
2. **Break Down**: Remove elements one by one
3. **Clean Recordings**: Disable unwanted sources before recording

#### Sound Design:
1. **Isolate Effects**: Route only one track to hear effect chain clearly
2. **Layer Testing**: Test sampler sounds without background tracks
3. **Creative Muting**: Create dynamic arrangements by toggling sources

---

## Technical Details

### Audio Routing Architecture

#### Before:
```
Track 1 Gain ──────────┐
Track 2 Gain ──────────┤──> Merger ──> Master Effects ──> Output
Sampler Gain ──────────┘
```

#### After (with routing controls):
```
Track 1 Gain ──[Toggle]──┐
Track 2 Gain ──[Toggle]──┤──> Merger ──> Master Effects ──> Output
Sampler Gain ──[Toggle]──┘
```

### Connection Management
- Uses Web Audio API `connect()` and `disconnect()` methods
- Maintains proper audio graph integrity
- Graceful error handling prevents audio glitches
- All checkboxes default to checked (all sources enabled)

### State Preservation
- Track playback state unchanged when routing toggled
- Effects remain active on disconnected tracks
- Volume and pan settings preserved
- Seamless reconnection when re-enabled

---

## User Interface

### Vocoder UI
```
┌─────────────────────────────────┐
│ 🤖 Vocoder Effect              │
├─────────────────────────────────┤
│ Modulator (Voice):              │
│ [Microphone ▼]                  │
│                                 │
│ Carrier Source:                 │
│ [Both Tracks (Mix) ▼]          │
│                                 │
│ Dry/Wet Mix: 100%               │
│ Bands: 16                       │
└─────────────────────────────────┘
```

### Auto-Tune UI
```
┌─────────────────────────────────┐
│ 🎵 Auto-Tune Effect            │
├─────────────────────────────────┤
│ Audio Source:                   │
│ [Microphone ▼]                  │
│                                 │
│ Key: [A ▼]  Scale: [Major ▼]   │
│ Correction Speed: 50ms          │
│ Strength: 100%                  │
└─────────────────────────────────┘
```

### Master Routing UI
```
┌─────────────────────────────────┐
│ 🎛️ Routing                     │
├─────────────────────────────────┤
│ [✓] 🎵 Track 1                 │
│ [✓] 🎵 Track 2                 │
│ [✓] 🎹 Sampler                 │
└─────────────────────────────────┘
```

---

## Benefits

### Vocoder/Auto-Tune Flexibility:
- ✅ **More Creative Options**: 9+ vocoder combinations instead of 4
- ✅ **Fix Recorded Audio**: Apply effects to pre-recorded tracks
- ✅ **Live Experimentation**: Switch sources on the fly
- ✅ **Studio-Quality**: Professional vocal processing on any source
- ✅ **Unique Sounds**: Create impossible-to-record effects

### Master Routing:
- ✅ **Precise Control**: Solo/mute individual components
- ✅ **Cleaner Mixes**: Remove unwanted elements easily
- ✅ **Better Workflows**: Test and compare tracks efficiently
- ✅ **Live Performance**: Dynamic arrangement control
- ✅ **Professional Features**: Industry-standard routing capabilities

---

## Compatibility Notes

### Browser Requirements:
- Web Audio API support (all modern browsers)
- Audio node connection/disconnection support
- No additional dependencies required

### Backward Compatibility:
- All controls default to previous behavior (all enabled)
- Existing recordings/sessions work without modification
- No breaking changes to existing features

---

## Future Enhancements

### Vocoder/Auto-Tune:
- [ ] Multiple simultaneous auto-tune instances
- [ ] Vocoder formant preservation
- [ ] Custom pitch correction curves
- [ ] MIDI control for pitch targets

### Routing:
- [ ] Visual meters for each routed source
- [ ] Pre/post-fader routing options
- [ ] Solo-in-place (SIP) functionality
- [ ] Routing presets/templates
- [ ] Send/Return auxiliary routing
- [ ] Sidechain compression routing

---

## Testing Checklist

### Vocoder:
- [x] Mic → Track 1 (classic robot voice)
- [x] Mic → Track 2
- [x] Track 1 → Track 2 (harmony generator)
- [x] Track 2 → Track 1
- [x] Mic → Mic (feedback effects)
- [x] Source switching without crashes
- [x] Proper cleanup on disable

### Auto-Tune:
- [x] Mic source (live vocal correction)
- [x] Track 1 source (recorded audio)
- [x] Track 2 source
- [x] Source switching without artifacts
- [x] Works alongside vocoder
- [x] Proper reconnection on disable

### Master Routing:
- [x] Track 1 toggle (connect/disconnect)
- [x] Track 2 toggle
- [x] Sampler toggle
- [x] All combinations (solo, pairs, all)
- [x] No audio glitches on toggle
- [x] State preserved when disconnected
- [x] Recording captures only routed sources

---

## Performance Considerations

- Minimal CPU overhead (just connection changes)
- No additional DSP processing for routing
- Vocoder/auto-tune use existing optimization
- Memory usage unchanged
- Smooth real-time operation
