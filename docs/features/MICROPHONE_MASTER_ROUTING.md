# Microphone Master Routing Feature

## Overview
Added microphone to the master output routing controls, allowing users to toggle whether the microphone is routed to the master output.

## Changes Made

### 1. HTML Updates (`app/templates/index.html`)

**Added Microphone Routing Checkbox:**
```html
<label class="routing-toggle">
    <input type="checkbox" id="routeMicrophone" checked>
    <span>🎤 Microphone</span>
</label>
```

**Location:** Master Output section, in the routing controls alongside Track 1, Track 2, and Sampler toggles.

**Default State:** Checked (microphone routed to master by default)

---

### 2. JavaScript Updates (`app/static/js/app.js`)

#### Added DOM Reference
```javascript
const routeMicrophone = document.getElementById('routeMicrophone');
```

#### Added Toggle Function
```javascript
function toggleMicRouting(enabled) {
    if (!micState || !micState.micGain || !merger) {
        console.warn('Microphone or merger not initialized');
        return;
    }
    
    try {
        if (enabled) {
            // Connect microphone to merger
            micState.micGain.connect(merger);
            console.log('Microphone routed to master');
        } else {
            // Disconnect microphone from merger
            micState.micGain.disconnect(merger);
            console.log('Microphone disconnected from master');
        }
    } catch (error) {
        console.error('Error toggling microphone routing:', error);
        // Reconnect on error
        if (enabled) {
            try {
                micState.micGain.connect(merger);
            } catch (e) {
                // Already connected or other error
            }
        }
    }
}
```

#### Added Event Listener
```javascript
routeMicrophone.addEventListener('change', (e) => {
    toggleMicRouting(e.target.checked);
});
```

#### Updated enableMicrophone Function
Modified to respect the routing toggle state when enabling microphone:
```javascript
// Check if microphone should be routed to master output
const shouldRoute = routeMicrophone.checked;

// Use module to enable microphone
micState = await enableMicrophoneModule(audioContext, merger, shouldRoute);
```

---

### 3. Microphone Module Updates (`app/static/js/modules/microphone.js`)

#### Updated Function Signature
Added optional `connectToMerger` parameter:
```javascript
export async function enableMicrophone(audioContext, merger, connectToMerger = true)
```

#### Conditional Connection
```javascript
// Connect to merger/destination if available and requested
if (merger && connectToMerger) {
    micGain.connect(merger);
}
```

---

## Features

### User Control
- **Toggle On (✓):** Microphone audio is routed to master output and can be heard/recorded
- **Toggle Off (✗):** Microphone is active but not routed to master (useful for effects-only processing)

### Use Cases

1. **Solo Recording:** Disable Track 1/2 routing, enable only microphone routing for pure vocal recording
2. **Background Vocals:** Mix mic with tracks by controlling individual routing
3. **Effects Processing:** Use mic with vocoder/autotune without routing to master
4. **Complex Mixing:** Precise control over which sources contribute to master output

### Integration Points

- Works seamlessly with existing crossfader (when microphone is in crossfader mode)
- Compatible with vocoder/autotune (effects can process mic even when not routed to master)
- Respects microphone volume controls and monitoring settings
- Integrates with master recording (only routed sources are recorded)

---

## Audio Signal Flow

### When Routing Enabled (✓)
```
Microphone Hardware
    ↓
MediaStream (getUserMedia)
    ↓
micSource (MediaStreamSourceNode)
    ↓
micGain (GainNode)
    ↓
micAnalyser (visualization)
    ↓
merger (master output) ← Connected
    ↓
Master Effects Chain
    ↓
Master Output
```

### When Routing Disabled (✗)
```
Microphone Hardware
    ↓
MediaStream (getUserMedia)
    ↓
micSource (MediaStreamSourceNode)
    ↓
micGain (GainNode)
    ↓
micAnalyser (visualization)
    ↓
merger (master output) ← Disconnected
    ↓
(Can still connect to effects like vocoder/autotune)
```

---

## Testing

### Basic Routing Test
1. Enable microphone
2. Speak into microphone - should hear yourself in master output
3. Uncheck "🎤 Microphone" routing toggle
4. Speak into microphone - should NOT hear yourself in master output
5. Check routing toggle again - should hear yourself again

### Effects Test (Routing Disabled)
1. Enable microphone
2. Disable microphone routing
3. Enable vocoder with mic as modulator or carrier
4. Vocoder should still work (effects processing independent of master routing)

### Integration Test
1. Load Track 1 and Track 2
2. Enable microphone
3. Toggle different combinations of routing (T1, T2, Mic, Sampler)
4. Verify only routed sources are heard in master output

---

## Technical Notes

- Microphone routing state is checked when microphone is first enabled
- Routing can be toggled on/off at any time while microphone is active
- Uses same robust disconnect/reconnect pattern as track and sampler routing
- Error handling ensures routing can't get into invalid state
- Console logging for debugging routing changes

---

## Version
Added in: v3.10.4

## Related Features
- Master Output Routing (v3.9.0)
- Microphone Input (v3.8.0)
- Crossfader with Microphone (v3.9.0)
- Vocoder/Autotune with Microphone (v3.9.0)
