# Additional Critical Fix: Microphone Audio Routing

## Issue
After previous fixes, mic + mic vocoder and autotune on mic were still giving errors.

## Root Cause

### Using micSource Instead of micGain for Vocoder Modulator

**Problem:** The vocoder was using `micState.micSource` (MediaStreamSourceNode) for the modulator when mic was selected, but using `micState.micGain` (GainNode) for everything else.

**Why This Failed:**
- `micSource` is the raw MediaStreamSourceNode created from getUserMedia
- `micGain` is the GainNode that includes volume control
- The microphone chain is: `micSource → micGain → merger`
- For effects like vocoder/autotune, we should tap from `micGain`, not `micSource`
- Using `micSource` caused routing conflicts

**Audio Chain:**
```
Microphone Hardware
    ↓
MediaStream (getUserMedia)
    ↓
micSource (MediaStreamSourceNode) ← Raw mic input
    ↓
micGain (GainNode) ← Volume controlled mic ✅ Use this!
    ↓
micAnalyser (for visualization)
    ↓
merger (output)
```

## The Fix

### Changed Vocoder Modulator from micSource to micGain

**File:** `app/static/js/visualizer-dual.js` - `enableVocoder()` function

**Before:**
```javascript
if (modulatorType === 'mic') {
    if (!micState || !micState.micSource) {
        alert('Please enable microphone first to use it as modulator!');
        return;
    }
    modulatorSource = micState.micSource;  // ❌ Wrong node!
}
```

**After:**
```javascript
if (modulatorType === 'mic') {
    if (!micEnabled || !micState || !micState.micGain) {
        alert('Please enable microphone first to use it as modulator!');
        return;
    }
    // Verify micGain is a valid audio node
    if (typeof micState.micGain.connect !== 'function') {
        alert('Microphone audio node is invalid. Please disable and re-enable the microphone.');
        return;
    }
    // Use micGain for modulator (includes volume control and can connect to multiple destinations)
    modulatorSource = micState.micGain;  // ✅ Correct node!
}
```

### Updated Carrier Source Reference

**File:** `app/static/js/visualizer-dual.js` - `enableVocoder()` function

Changed the carrier source getter to also use `micGain`:

**Before:**
```javascript
carrierSourceForVocoder = getVocoderCarrierSource(
    carrier, gain1, gain2, 
    micState ? micState.micSource : null,  // ❌ Wrong
    audioContext
);
```

**After:**
```javascript
carrierSourceForVocoder = getVocoderCarrierSource(
    carrier, gain1, gain2, 
    micState ? micState.micGain : null,  // ✅ Correct
    audioContext
);
```

### Mic-to-Mic Vocoder Now Uses Same Node

**Result:** When both modulator and carrier are set to "Microphone":
- Modulator: `micState.micGain`
- Carrier: `micState.micGain`
- Same node connected to both vocoder inputs (creates feedback effect)

This is valid in Web Audio API - you CAN connect the same node to multiple destinations.

```javascript
micGain.connect(vocoderModulatorGain);  // For voice analysis
micGain.connect(vocoderCarrierGain);    // For modulation carrier
```

### Added Safety Checks

**1. Verify merger exists:**
```javascript
if (!merger) {
    alert('Audio output not initialized. Please reload the page.');
    return;
}
```

**2. Verify micGain is valid audio node:**
```javascript
if (typeof micState.micGain.connect !== 'function') {
    alert('Microphone audio node is invalid. Please disable and re-enable the microphone.');
    return;
}
```

## Why This Matters

### Consistency
- **Tracks:** Use `gain1`/`gain2` (GainNodes) ✅
- **Microphone:** Use `micGain` (GainNode) ✅
- **NOT:** Use `source1`/`source2`/`micSource` (raw source nodes) ❌

### Audio Routing Best Practices

**Rule:** Always tap from GainNodes for effects, not from raw source nodes.

**Why?**
1. GainNodes can connect to multiple destinations
2. GainNodes include volume control
3. GainNodes are the proper point in the signal chain
4. Raw source nodes are meant to be connected once in the main chain

### Correct Signal Flow

**Microphone → Vocoder → Output:**
```
Mic Input
    ↓
micSource (MediaStreamSource)
    ↓
micGain (GainNode) ──┐
    ↓                ├→ vocoderModulatorGain (analyze voice)
    X (disconnected) ├→ vocoderCarrierGain (modulation carrier)
                     ↓
              Vocoder Processing
                     ↓
           vocoderOutputGain
                     ↓
                  merger
                     ↓
              Master Output
```

**Microphone → Auto-Tune → Output:**
```
Mic Input
    ↓
micSource (MediaStreamSource)
    ↓
micGain (GainNode) ──→ Auto-Tune Input
    ↓                       ↓
    X (disconnected)    Pitch Analysis
                            ↓
                    Dry/Wet Mix (pitch corrected)
                            ↓
                         merger
                            ↓
                     Master Output
```

## Testing Verification

### Mic + Mic Vocoder ✅
```
1. Enable microphone
2. Set Modulator: "Microphone"
3. Set Carrier: "Microphone (Feedback)"
4. Click "Enable Vocoder"
5. Should work without errors
6. Console shows:
   "Using micGain for both modulator and carrier (mic-to-mic feedback)"
   "Vocoder enabled with 16 bands (Modulator: mic, Carrier: mic)"
```

### Auto-Tune on Mic ✅
```
1. Enable microphone
2. Set Audio Source: "Microphone"
3. Click "Enable Auto-Tune"
4. Should work without errors
5. Console shows:
   "Enabling auto-tune with source: mic, strength: 50%"
   "Auto-tune enabled on mic"
```

### Mic + Track Vocoder ✅
```
1. Enable microphone
2. Load Track 1
3. Set Modulator: "Microphone"
4. Set Carrier: "Track 1"
5. Click "Enable Vocoder"
6. Should work - voice modulates the track
```

### Track + Mic Vocoder ✅
```
1. Load Track 1
2. Enable microphone
3. Set Modulator: "Track 1"
4. Set Carrier: "Microphone (Feedback)"
5. Click "Enable Vocoder"
6. Should work - track modulates the mic
```

## Summary of All Mic-Related Fixes

### Fix #1: Changed Vocoder Track Modulators
- FROM: `source1`/`source2` (MediaElementSource)
- TO: `gain1`/`gain2` (GainNode)

### Fix #2: Changed Vocoder Mic Modulator
- FROM: `micState.micSource` (MediaStreamSource)
- TO: `micState.micGain` (GainNode)

### Fix #3: Changed Vocoder Mic Carrier Reference
- FROM: `micState.micSource` in getVocoderCarrierSource call
- TO: `micState.micGain` in getVocoderCarrierSource call

### Fix #4: Added Safety Validations
- Check `merger` exists
- Check `micGain.connect` is a function
- Check `micEnabled` flag

### Fix #5: Updated Console Logging
- Shows when using mic-to-mic feedback
- Shows source types clearly
- Helps with debugging

## Files Modified

1. **app/static/js/visualizer-dual.js**
   - Line ~1051: Changed `micSource` → `micGain` for modulator
   - Line ~1051: Added validation for `micGain.connect` function
   - Line ~1103: Changed `micSource` → `micGain` in carrier getter
   - Line ~1099: Updated console log for mic-to-mic
   - Line ~1037: Added merger validation
   - Line ~1227: Added merger validation (autotune)

## The Golden Rule

**🏆 For Effects Processing: Always Use GainNodes**

- ✅ `gain1`, `gain2`, `micGain` (GainNodes)
- ❌ `source1`, `source2`, `micSource` (Source Nodes)

Source nodes are the raw audio inputs. GainNodes are the controllable, connectable points in your audio graph.

---

## Related Documentation
- See `CRITICAL_VOCODER_AUTOTUNE_FIXES.md` for track source fixes
- See `VOCODER_MIC_FEEDBACK_FIX.md` for original mic-to-mic routing
- See `AUTOTUNE_MIC_SUPPORT_FIX.md` for auto-tune enhancements
