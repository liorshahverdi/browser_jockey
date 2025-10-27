# Sequencer Effects Panel Toggle Feature

## Overview
Added the ability to toggle (show/hide) the sequencer effects panel to save screen space when the user doesn't need to edit clip effects.

## Motivation
The effects panel can take up significant screen space, especially on smaller displays. Users may want to hide it when:
- Working with many tracks and need more vertical space
- Not actively editing effects
- Focusing on arrangement and timing
- Using fullscreen mode with limited space

## Features

### Toggle Button
- **Location**: In the sequencer controls bar, between "Loop" controls and "Fullscreen"
- **Label**: "🎛️ Effects Panel" (changes to "🎛️ Hide Effects" when visible)
- **Visual State**: Button highlights with active state when panel is visible

### Behavior

#### Default State
- Panel is **visible by default** when you select a clip
- Toggle button shows "🎛️ Hide Effects"
- Button has active styling (highlighted)

#### Hidden State
- Panel is completely hidden from view
- Toggle button shows "🎛️ Show Effects"
- Button returns to normal styling
- Frees up screen space for timeline and tracks

#### Smart Visibility
- When panel is hidden and you click a clip, it remains hidden
- Panel only shows when:
  1. Effects panel visibility is enabled (via toggle button)
  2. A clip is selected

### Visual Feedback

#### Active Button State
```css
.sequencer-btn.active {
    background: linear-gradient(135deg, rgba(118, 75, 162, 0.9), rgba(102, 126, 234, 0.9));
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 15px rgba(102, 126, 234, 0.6);
}
```

#### Console Messages
- `🎛️ Effects panel shown` - When panel is revealed
- `🎛️ Effects panel hidden` - When panel is hidden

## Implementation Details

### HTML Changes (`index.html`)

Added toggle button to sequencer controls:
```html
<button id="toggleEffectsPanelBtn" class="sequencer-btn" title="Toggle effects panel">
    🎛️ Effects Panel
</button>
```

### JavaScript Changes (`sequencer.js`)

#### 1. State Variable
```javascript
// Constructor
this.effectsPanelVisible = true; // Start visible by default
```

#### 2. Toggle Method
```javascript
toggleEffectsPanel() {
    this.effectsPanelVisible = !this.effectsPanelVisible;
    
    if (this.effectsPanelVisible) {
        // Show only if there's a selected clip
        const selectedClip = document.querySelector('.timeline-clip.selected');
        if (selectedClip) {
            effectsPanel.style.display = 'block';
        }
        toggleBtn.innerHTML = '🎛️ Hide Effects';
        toggleBtn.classList.add('active');
    } else {
        effectsPanel.style.display = 'none';
        toggleBtn.innerHTML = '🎛️ Show Effects';
        toggleBtn.classList.remove('active');
    }
}
```

#### 3. Updated `showEffectsPanel()`
```javascript
// Only show if effects panel is not manually hidden
if (this.effectsPanelVisible) {
    this.effectsPanel.style.display = 'block';
    // Update button state
    toggleBtn.innerHTML = '🎛️ Hide Effects';
    toggleBtn.classList.add('active');
}
```

#### 4. Updated `closeEffectsPanel()`
```javascript
// Update toggle button state when closing
toggleBtn.innerHTML = '🎛️ Show Effects';
toggleBtn.classList.remove('active');
```

#### 5. Event Listener
```javascript
// Effects Panel toggle
const toggleEffectsPanelBtn = document.getElementById('toggleEffectsPanelBtn');
if (toggleEffectsPanelBtn) {
    toggleEffectsPanelBtn.addEventListener('click', () => this.toggleEffectsPanel());
}
```

### CSS Changes (`style.css`)

Added active state styling:
```css
.sequencer-btn.active {
    background: linear-gradient(135deg, rgba(118, 75, 162, 0.9), rgba(102, 126, 234, 0.9));
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 15px rgba(102, 126, 234, 0.6);
}
```

## User Workflow

### Show/Hide Panel
1. Click "🎛️ Effects Panel" button in sequencer controls
2. Panel toggles between visible and hidden
3. Button text changes to reflect current state
4. Button highlights when panel is visible

### With Selected Clip
1. Select a clip by clicking it
2. If effects panel is enabled, it shows with clip's effects
3. If effects panel is disabled, clip is selected but panel stays hidden
4. Click toggle button to reveal panel with current clip's effects

### Close Button (×)
- Clicking the × button in the panel header:
  - Closes the panel
  - Deselects the clip
  - Updates toggle button to "Show Effects"
  - Does NOT change the effectsPanelVisible state

## Use Cases

### Maximize Timeline Space
```
Before (with effects panel):
┌─────────────────────────────────┐
│ Sequencer Controls              │
├─────────────┬───────────────────┤
│ Clips Panel │ Timeline (small)  │
│             │                   │
│             ├───────────────────┤
│             │ Effects Panel     │
└─────────────┴───────────────────┘

After (effects panel hidden):
┌─────────────────────────────────┐
│ Sequencer Controls              │
├─────────────┬───────────────────┤
│ Clips Panel │ Timeline (large!) │
│             │                   │
│             │                   │
│             │                   │
└─────────────┴───────────────────┘
```

### Quick Arrangement Mode
1. Hide effects panel
2. Focus on dragging and arranging clips
3. Maximize visible tracks and timeline
4. Show panel when ready to edit effects

### Mobile/Small Screen
- Hide panel by default on small screens
- More room for timeline interaction
- Show only when specifically editing effects

## Testing Checklist

### Basic Functionality
- [ ] Toggle button appears in controls
- [ ] Clicking button shows/hides panel
- [ ] Button text updates correctly
- [ ] Button styling shows active state

### Clip Selection
- [ ] Panel shows when clip selected (if visible mode)
- [ ] Panel stays hidden when clip selected (if hidden mode)
- [ ] Toggle works with selected clip
- [ ] Effects persist when toggling

### Integration
- [ ] Works with close button (×)
- [ ] Works with delete clip button
- [ ] Works with fullscreen mode
- [ ] Effects apply correctly regardless of visibility
- [ ] Multiple clips can be selected/deselected

### Visual
- [ ] Active state styling visible
- [ ] Button label changes appropriately
- [ ] Layout adjusts when panel hidden
- [ ] No visual glitches

## Benefits

1. **Space Efficiency**: Reclaim vertical space for more tracks
2. **Focus**: Reduce visual clutter when not editing effects
3. **Flexibility**: User controls what they see
4. **Workflow**: Separate arrangement from effect editing phases
5. **Accessibility**: Better for small screens and tablets

## Keyboard Shortcut (Future)
Potential enhancement:
- `E` key to toggle effects panel
- `Ctrl/Cmd + E` to toggle and select last clip

## Version
- **Added in**: v3.20.2
- **Status**: Production Ready
- **Dependencies**: Requires sequencer effects panel feature
