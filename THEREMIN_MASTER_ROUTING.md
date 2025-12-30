# Theremin Master Routing Feature - October 25, 2025

## Feature Added

Added the Camera Theremin to the Master Output Routing controls, allowing users to toggle whether the theremin audio is sent to the master output or not.

## Changes Made

### 1. HTML - Added Routing Checkbox

**File**: `/app/templates/index.html`

Added theremin routing checkbox to the Master Routing section:

```html
<label class="routing-toggle">
    <input type="checkbox" id="routeTheremin" checked>
    <span>🎥 Theremin</span>
</label>
```

**Location**: Master Effects Section → Routing Controls

**Default State**: Checked (enabled)

### 2. JavaScript - DOM Element

**File**: `/app/static/js/app.js`

Added DOM element reference:
```javascript
const routeTheremin = document.getElementById('routeTheremin');
```

### 3. Theremin Module - Routing Gain Node

**File**: `/app/static/js/modules/theremin.js`

**Added to thereminState**:
```javascript
routingGain: null  // For master routing control
```

**Updated enableTheremin function**:
- Added `merger` parameter
- Create `routingGain` node
- Route audio through: oscillator → filter → gain → [dry/wet mix] → routingGain
- Connect routingGain to:
  - `audioContext.destination` (direct output)
  - `merger` (master mixer, if available)
  - `recordingDestination` (for recording)

**Added export function**:
```javascript
export function getThereminRoutingGain() {
    return thereminState.routingGain;
}
```

### 4. Routing Toggle Function

**File**: `/app/static/js/app.js`

Added `toggleThereminRouting` function:

```javascript
function toggleThereminRouting(enabled) {
    const thereminGain = getThereminRoutingGain();
    
    if (!thereminGain || !merger) {
        console.warn('Theremin or merger not initialized');
        return;
    }
    
    try {
        if (enabled) {
            thereminGain.connect(merger);
            console.log('Theremin routed to master');
        } else {
            thereminGain.disconnect(merger);
            console.log('Theremin disconnected from master');
        }
    } catch (error) {
        console.error('Error toggling theremin routing:', error);
    }
}
```

### 5. Event Listener

**File**: `/app/static/js/app.js`

Added event listener for routing checkbox:

```javascript
routeTheremin.addEventListener('change', (e) => {
    toggleThereminRouting(e.target.checked);
});
```

## Audio Routing Architecture

### Before (Direct Output Only)
```
Theremin → [Dry/Wet Mix] → audioContext.destination
                         → recordingDestination
```

### After (With Routing Control)
```
Theremin → [Dry/Wet Mix] → routingGain → audioContext.destination (always)
                                       → merger (toggleable) → Master Effects
                                       → recordingDestination (always)
```

### Key Points

1. **Direct Output**: Theremin always outputs directly to speakers (can't be muted via routing)
2. **Master Mix**: Routing checkbox controls whether theremin goes through master effects chain
3. **Recording**: Theremin always routes to recording destination

## Usage

### Enable/Disable Master Routing

**Location**: Master Effects Section → Routing Controls

**Checkbox**: 🎥 Theremin (checked by default)

**When Checked**:
- Theremin audio → Master mixer
- Affected by master volume
- Affected by master effects (filter, reverb, delay)
- Included in master output recording

**When Unchecked**:
- Theremin audio still plays directly
- NOT affected by master volume
- NOT affected by master effects
- Still included in recording (direct signal)

## Testing

1. **Enable Theremin**: Click "Enable Theremin" and allow camera
2. **Test Direct Output**: Move hand, hear theremin
3. **Uncheck Routing**: Uncheck "🎥 Theremin" in Routing section
   - Theremin should still play
   - Master volume should NOT affect theremin
4. **Check Routing**: Check "🎥 Theremin" again
   - Master volume should now affect theremin
   - Master effects should affect theremin

## Console Messages

When toggling routing:
- **Enabled**: `"Theremin routed to master"`
- **Disabled**: `"Theremin disconnected from master"`
- **Error**: `"Theremin or merger not initialized"` (if theremin not enabled)

## Integration with Other Features

The theremin routing now follows the same pattern as:
- 🎵 Track 1 routing
- 🎵 Track 2 routing
- 🎤 Microphone routing
- 🎹 Sampler routing

All routing controls work independently and can be mixed as desired.

## Future Enhancements

Potential improvements:
1. Add theremin-specific gain control (separate from hand motion volume)
2. Add theremin-specific effects chain
3. Add pre/post master effects routing option
4. Add dry/wet mix control for master effects on theremin
5. Option to disable direct output (route only to master)

## Files Modified

1. `/app/templates/index.html` - Added routing checkbox
2. `/app/static/js/app.js` - Added DOM element, function, and event listener
3. `/app/static/js/modules/theremin.js` - Added routing gain node and export function

## Credits

Master routing feature for Camera Theremin implemented by Lior Shahverdi and Claude Sonnet 4.5, October 25, 2025.
