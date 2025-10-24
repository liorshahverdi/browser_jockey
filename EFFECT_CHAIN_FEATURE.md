# Effect Chain Feature - Drag and Drop

## Overview
A new drag-and-drop effect chain feature has been added to Browser Jockey, allowing users to visually reorder audio effects before routing to the output.

## Features

### 🔗 Effect Chain Panel
Each track now has an **Effect Chain** panel that displays all available effects in a draggable list:

- **Filter** 🎚️
- **Reverb** 🌊  
- **Delay** ⏱️

### ✨ Key Functionality

#### 1. **Drag and Drop Reordering**
- Click and drag the effect items to reorder them
- Visual feedback during dragging (drag handle with ⋮⋮ icon)
- Drop zones highlight when hovering
- The effect chain shows the signal flow from top to bottom

#### 2. **Toggle Effects On/Off**
- Click the toggle button (✓/✗) on each effect to enable or disable it
- Enabled effects show in green with a checkmark (✓)
- Disabled effects show in red/gray with an X (✗) and reduced opacity
- **NEW**: Effect sliders automatically show/hide based on toggle state
  - When enabled (✓): Effect sliders are visible
  - When disabled (✗): Effect sliders are hidden with smooth fade animation
- Disabled effects are bypassed in the signal chain

#### 3. **Reset to Default**
- Click the "↺ Reset" button to restore the default effect order:
  1. Filter
  2. Reverb
  3. Delay

### 🎨 Visual Design

The effect chain panel features:
- **Purple theme** to distinguish it from the effect controls
- **Drag handle** (⋮⋮) for easy grabbing
- **Effect icons** for quick visual identification
- **Color-coded status**: Green for enabled, red/gray for disabled
- **Smooth animations** and hover effects

### 🎛️ How It Works

1. **Load an audio file** into Track 1 or Track 2
2. **Locate the Effect Chain panel** (above the Effects section)
3. **Drag effects** up or down to change their order
4. **Click toggle buttons** to enable/disable individual effects
   - Enabled effects (✓) show their sliders in the Effects section below
   - Disabled effects (✗) hide their sliders with a smooth animation
5. **Adjust effect parameters** using the visible sliders in the Effects section
6. **Experiment** with different orders and combinations!

### 📊 Signal Flow

The audio signal flows through the effects in the order shown in the effect chain (top to bottom):

```
Audio Source
    ↓
[Effect 1] ← Can be dragged to change position
    ↓
[Effect 2] ← Can be enabled/disabled
    ↓
[Effect 3] ← Independent per track
    ↓
Output Mixer
```

### 🔧 Technical Details

#### Files Added
- **`app/static/js/modules/effect-chain.js`** - Main effect chain module
  - `EffectChain` class for managing the UI and state
  - Drag and drop event handlers
  - Effect order management
  - `connectEffectsInOrder()` function for dynamic routing

#### Files Modified
- **`app/templates/index.html`** - Added effect chain containers for both tracks
- **`app/static/css/style.css`** - Added styling for effect chain UI
- **`app/static/js/visualizer-dual.js`** - Integrated effect chain managers

#### Key Components

**EffectChain Class**:
```javascript
- constructor(trackNumber, audioContext)
- initializeUI() - Creates the drag-drop interface
- render() - Updates the visual representation
- handleDragStart/End/Over/Drop() - Drag and drop logic
- toggleEffect(index) - Enable/disable effects
- updateEffectControlsVisibility() - Show/hide effect sliders
- getEffectControlIds(effectId) - Map effects to control elements
- resetToDefault() - Restore default order
- notifyOrderChange() - Dispatch custom event
```

**Event System**:
- Custom `effectChainChanged` event dispatched when order changes
- Includes track number and current effect configuration
- Allows main visualizer to respond to changes

### 🚀 Future Enhancements

The current implementation provides the UI for effect chain management. Future enhancements could include:

1. **Dynamic Audio Graph Reconnection**
   - Currently, the visual order is tracked but audio routing follows a fixed order
   - Full implementation would dynamically reconnect Web Audio API nodes

2. **More Effect Types**
   - Distortion, Chorus, Flanger, etc.
   - User-defined effect parameters

3. **Save/Load Presets**
   - Save favorite effect chain configurations
   - Quick preset switching

4. **Per-Effect Bypass**
   - Individual bypass buttons for A/B comparison
   - Dry/wet mix per effect

5. **Effect Chain Templates**
   - Pre-configured chains for different genres
   - "Dub", "Lo-fi", "Clean", etc.

### 💡 Usage Tips

- **Experiment with order**: The order of effects can dramatically change the sound
  - Filter → Reverb → Delay creates a clean, ambient sound
  - Reverb → Filter → Delay creates a more experimental, atmospheric sound
  
- **Use the toggle**: Disable effects you're not using to save CPU and reduce visual clutter
  - Disabled effect sliders are hidden automatically for a cleaner interface
  
- **Visual feedback**: Watch for the drag-over highlight to know where effects will land

- **Reset anytime**: If you get lost, use the Reset button to return to defaults

- **Clean workflow**: Only the sliders for enabled effects are shown, keeping your workspace organized

### 🐛 Known Limitations

- The effect chain UI is currently a visual representation
- Audio routing still follows the implementation in `audio-effects.js`
- Full dynamic reconnection requires additional Web Audio API graph management

### 📝 Example Workflows

**Clean Vocal Sound**:
1. Filter (High Pass) → Remove low rumble
2. Reverb (Small amount) → Add space
3. Delay (Disabled) → Not needed

**Dub/Reggae Effect**:
1. Filter (Low Pass sweep) → Create movement
2. Delay (High feedback) → Classic dub echo
3. Reverb (Light) → Final ambience

**Experimental Sound Design**:
1. Delay (Short, high feedback) → Rhythmic texture
2. Reverb (Large room) → Smear the delays
3. Filter (Resonant sweep) → Shape the frequency content

---

**Enjoy creating unique effect chains with Browser Jockey! 🎧🎚️**
