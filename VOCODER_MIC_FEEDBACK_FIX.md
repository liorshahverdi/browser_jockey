# Vocoder Mic-to-Mic Feedback Fix

## Issue
When selecting microphone for both the vocoder modulator (voice) and carrier source, clicking "Enable Vocoder" resulted in an error: "Error enabling vocoder. Please try again."

## Root Causes

### 1. Same Audio Node Used Twice
When both modulator and carrier were set to 'mic', the code was passing `micState.micSource` to both parameters of the vocoder module. While Web Audio API allows connecting the same node to multiple destinations, using the exact same node reference for both the modulator and carrier could cause issues in the vocoder's internal routing.

### 2. Missing 'mix' Carrier Support
The `getVocoderCarrierSource()` function in `vocoder.js` only handled 'track1', 'track2', and 'mic' cases. When carrier was set to 'mix' (Both Tracks), it returned `null`, causing the vocoder to fail with "Carrier source required" error.

### 3. UI/UX Issue
The carrier and modulator dropdowns were hidden inside the vocoder settings, only visible AFTER enabling the vocoder. This prevented users from configuring these settings before clicking "Enable Vocoder", leading to confusing errors.

## Solutions Implemented

### Fix #1: Use Different Nodes for Mic-to-Mic Feedback ✅

**File:** `app/static/js/app.js`

Added special handling when both modulator and carrier are set to 'mic':
- Uses `micState.micSource` for the modulator (the voice input)
- Uses `micState.micGain` for the carrier (creates feedback effect)
- This avoids passing the exact same audio node twice while maintaining the mic-to-mic feedback routing

**Code:**
```javascript
// If both modulator and carrier are mic, use micGain for carrier to avoid using same node twice
let carrierSourceForVocoder;
if (carrier === 'mic' && modulatorType === 'mic' && micState) {
    carrierSourceForVocoder = micState.micGain;
} else {
    carrierSourceForVocoder = getVocoderCarrierSource(carrier, gain1, gain2, micState ? micState.micSource : null, audioContext);
}
```

### Fix #2: Add 'mix' Carrier Support ✅

**File:** `app/static/js/modules/vocoder.js`

Enhanced `getVocoderCarrierSource()` to handle the 'mix' case:
- Creates a new GainNode to mix both tracks
- Connects both track sources to the mix gain
- Falls back to single track if only one is available
- Returns null if no tracks are available

**Code:**
```javascript
case 'mix':
    // Create a mixer for both tracks
    if (source1 && source2 && audioContext) {
        const mixGain = audioContext.createGain();
        source1.connect(mixGain);
        source2.connect(mixGain);
        return mixGain;
    } else if (source1) {
        return source1;
    } else if (source2) {
        return source2;
    }
    return null;
```

### Fix #3: Improved Error Messages ✅

**File:** `app/static/js/app.js`

Added clearer error message that shows which carrier type failed:
```javascript
if (!carrierSourceForVocoder) {
    throw new Error(`Unable to get carrier source for: ${carrier}`);
}
```

### Fix #4: UI Improvements (Previous Fix) ✅

**File:** `app/templates/index.html`

Moved modulator and carrier dropdowns outside of the hidden `vocoderSettings` div, making them always visible when the vocoder section is shown. This allows users to configure these settings BEFORE clicking "Enable Vocoder".

## Technical Details

### Mic-to-Mic Feedback Audio Routing

When using microphone for both modulator and carrier:

```
Microphone Stream
    ↓
micSource (MediaStreamSource)
    ├→ (modulator) → Vocoder Modulator Chain
    │                 ↓
    │              Band-pass filters
    │                 ↓
    │              Envelope followers
    │                 ↓
    │              Gain modulators
    │
    └→ micGain
        ↓
    (carrier) → Vocoder Carrier Chain
                  ↓
               Band-pass filters
                  ↓
               Modulated by envelopes
                  ↓
               Vocoder Output
```

This creates a feedback vocoder effect where the microphone modulates itself.

### Mix Carrier Audio Routing

When using 'mix' as carrier with both tracks loaded:

```
Track 1 Source → ┐
                 ├→ Mix Gain Node → Vocoder Carrier
Track 2 Source → ┘
```

## Testing Checklist

### Mic-to-Mic Vocoder ✅
- [x] Enable microphone
- [x] Set modulator to "Microphone"
- [x] Set carrier to "Microphone (Feedback)"
- [x] Enable vocoder → Should work without errors
- [x] Creates feedback effect

### Mix Carrier ✅
- [x] Load Track 1 and Track 2
- [x] Set modulator to "Microphone" (with mic enabled)
- [x] Set carrier to "Both Tracks (Mix)"
- [x] Enable vocoder → Should work without errors
- [x] Voice modulates mixed tracks

### Single Track Carriers ✅
- [x] Carrier "Track 1" with Track 1 loaded
- [x] Carrier "Track 2" with Track 2 loaded
- [x] Proper error messages when track not loaded

### Edge Cases ✅
- [x] Carrier "mix" with only Track 1 → Uses Track 1
- [x] Carrier "mix" with only Track 2 → Uses Track 2
- [x] Carrier "mix" with no tracks → Shows error before enabling

## Files Modified

1. **app/static/js/app.js**
   - Added mic-to-mic special handling
   - Added audioContext parameter to getVocoderCarrierSource call
   - Improved error messages

2. **app/static/js/modules/vocoder.js**
   - Added audioContext parameter to getVocoderCarrierSource function
   - Implemented 'mix' carrier case with GainNode mixer
   - Added fallback logic for single track scenarios

3. **app/templates/index.html** (Previous fix)
   - Moved modulator/carrier dropdowns outside hidden settings

## Benefits

1. **Mic Feedback Effects Now Work** 🎤
   - Can create interesting robot/feedback vocoder effects
   - Mic modulates itself through the vocoder

2. **Mix Carrier Support** 🎚️
   - Can use both tracks as carrier simultaneously
   - More flexibility in sound design

3. **Better UX** ✨
   - Can configure settings before enabling
   - Clear, specific error messages
   - Guides users to exactly what's needed

4. **Robust Error Handling** 🛡️
   - Validates each carrier type specifically
   - Helpful error messages for missing sources
   - Prevents cryptic "please try again" errors

## Known Behavior

- **Mic-to-Mic feedback** can create interesting effects but may be loud - adjust levels carefully
- **Mix carrier** creates a new gain node each time vocoder is enabled - this is intentional for clean routing
- **Changing carrier/modulator while vocoder is active** requires disabling and re-enabling (existing behavior)

---

## Related Documentation
- See `BUG_FIXES_SUMMARY.md` for validation logic fixes
- See `VOCODER_AUTOTUNE_ROUTING_FEATURES.md` for overall routing architecture
