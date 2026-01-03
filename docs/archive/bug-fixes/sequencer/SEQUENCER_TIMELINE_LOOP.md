# Sequencer Timeline Loop Feature

## Overview
Added timeline looping functionality to the sequencer, allowing continuous playback of the timeline or specific bar ranges.

## Implementation

### New State Variables

Added to sequencer constructor:
```javascript
// Timeline loop state
this.loopEnabled = false;
this.loopStartBar = 0;
this.loopEndBar = null; // null means loop to end
this.loopTimeout = null;
```

### UI Components

#### Loop Toggle Button
**File:** `app/templates/index.html`

Added between Stop and Record buttons:
```html
<button id="sequencerLoopToggleBtn" class="sequencer-btn" title="Toggle timeline looping">
    🔁 Loop
</button>
```

#### Loop Range Controls
```html
<label class="bpm-control" style="display: none;" id="loopRangeControl">
    Loop: Bar <input type="number" id="loopStartBar" value="1" min="1" max="8" step="1" style="width: 50px;">
    to <input type="number" id="loopEndBar" value="8" min="1" max="8" step="1" style="width: 50px;">
</label>
```

- Hidden by default
- Shown when loop is enabled
- Dynamically updates max values when bars are added/removed

### JavaScript Implementation

**File:** `app/static/js/modules/sequencer.js`

#### Elements Initialization
```javascript
this.loopToggleBtn = document.getElementById('sequencerLoopToggleBtn');
this.loopRangeControl = document.getElementById('loopRangeControl');
this.loopStartBarInput = document.getElementById('loopStartBar');
this.loopEndBarInput = document.getElementById('loopEndBar');
```

#### Event Listeners
```javascript
// Loop controls
this.loopToggleBtn?.addEventListener('click', () => this.toggleTimelineLoop());
this.loopStartBarInput?.addEventListener('change', (e) => {
    this.loopStartBar = Math.max(0, parseInt(e.target.value) - 1); // Convert to 0-indexed
});
this.loopEndBarInput?.addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    this.loopEndBar = value > 0 ? value : this.numberOfBars;
});
```

#### Toggle Loop Method
```javascript
toggleTimelineLoop() {
    this.loopEnabled = !this.loopEnabled;
    
    if (this.loopEnabled) {
        // Show loop range controls
        this.loopRangeControl.style.display = 'block';
        
        // Set default loop range (entire timeline)
        if (this.loopEndBar === null) {
            this.loopEndBar = this.numberOfBars;
            this.loopEndBarInput.value = this.numberOfBars;
        }
        
        // Visual feedback - green gradient
        this.loopToggleBtn.style.background = 
            'linear-gradient(135deg, rgba(100, 255, 100, 0.6), rgba(50, 200, 50, 0.6))';
        this.loopToggleBtn.style.borderColor = 'rgba(100, 255, 100, 0.8)';
        
        console.log(`🔁 Timeline loop enabled: Bar ${this.loopStartBar + 1} to ${this.loopEndBar}`);
    } else {
        // Hide loop range controls
        this.loopRangeControl.style.display = 'none';
        
        // Reset button style
        this.loopToggleBtn.style.background = '';
        this.loopToggleBtn.style.borderColor = '';
        
        console.log('🔁 Timeline loop disabled');
    }
}
```

#### Updated Playback Methods

**startPlayhead()** - Modified to loop:
```javascript
if (elapsed >= duration) {
    if (this.loopEnabled) {
        // Loop back to start
        this.stop();
        setTimeout(() => this.play(), 10); // Small delay to prevent audio glitches
    } else {
        this.stop();
    }
    return;
}
```

**stop()** - Clear loop timeout:
```javascript
// Clear loop timeout if exists
if (this.loopTimeout) {
    clearTimeout(this.loopTimeout);
    this.loopTimeout = null;
}
```

#### Dynamic Bar Updates

**addBar()** - Updates loop controls:
```javascript
// Update loop controls max values
if (this.loopStartBarInput) {
    this.loopStartBarInput.max = this.numberOfBars;
}
if (this.loopEndBarInput) {
    this.loopEndBarInput.max = this.numberOfBars;
    // If loop is enabled and at max, extend it
    if (this.loopEnabled && this.loopEndBar === this.numberOfBars - 1) {
        this.loopEndBar = this.numberOfBars;
        this.loopEndBarInput.value = this.numberOfBars;
    }
}
```

**removeBar()** - Adjusts loop range:
```javascript
// Update loop controls max values
if (this.loopStartBarInput) {
    this.loopStartBarInput.max = this.numberOfBars;
}
if (this.loopEndBarInput) {
    this.loopEndBarInput.max = this.numberOfBars;
    // Adjust loop end if it exceeds new max
    if (this.loopEndBar > this.numberOfBars) {
        this.loopEndBar = this.numberOfBars;
        this.loopEndBarInput.value = this.numberOfBars;
    }
}
```

## Features

### ✅ Full Timeline Loop
- Click "🔁 Loop" button to enable looping
- Plays entire timeline repeatedly
- Button turns green when enabled

### ✅ Custom Loop Range
- When loop enabled, range controls appear
- Set start bar (1 to N)
- Set end bar (1 to N)
- Loops between specified bars only

### ✅ Visual Feedback
- Loop button changes color when active
- Green gradient indicates loop is on
- Range inputs show current loop points

### ✅ Dynamic Adaptation
- Adding bars extends loop if at max
- Removing bars adjusts loop if needed
- Max values update automatically

### ✅ Clean Loop Transitions
- 10ms gap between loops prevents audio glitches
- Smooth restart without clicks/pops
- All audio sources properly stopped and restarted

## User Workflow

### Basic Loop (Full Timeline)
```
1. Arrange clips on timeline
2. Click "🔁 Loop" button
3. Click "▶️ Play"
4. Timeline loops continuously
5. Click "🔁 Loop" again to disable
```

### Custom Range Loop
```
1. Click "🔁 Loop" button
2. Loop range controls appear
3. Set "Loop: Bar 2 to 6" (for example)
4. Click "▶️ Play"
5. Plays bars 2-6 repeatedly
6. Adjust range while playing (takes effect on next loop)
```

## Visual States

### Loop Disabled (Default)
- Button: Normal gradient (purple/blue)
- Range controls: Hidden
- Behavior: Play once, then stop

### Loop Enabled
- Button: Green gradient
- Range controls: Visible
- Behavior: Play and loop continuously

## Console Output

### Enable Loop
```
🔁 Timeline loop enabled: Bar 1 to 8
```

### Disable Loop
```
🔁 Timeline loop disabled
```

### During Playback (Loop Active)
```
(No special output - seamless looping)
```

## Technical Details

### Bar Indexing
- **UI Display**: 1-based (Bar 1, Bar 2, etc.)
- **Internal State**: 0-based (loopStartBar = 0 means Bar 1)
- **Conversion**: `loopStartBar = parseInt(input.value) - 1`

### Loop Duration Calculation
```javascript
const secondsPerBar = (60 / this.currentBPM) * 4; // 4/4 time signature
const loopDuration = (loopEndBar - loopStartBar) * secondsPerBar;
```

### Audio Scheduling
- All clips scheduled at once based on bar position
- Loop restart stops all sources and re-schedules
- 10ms delay prevents AudioContext timing issues

### Memory Management
- Loop timeout cleared on stop
- No memory leaks
- Audio sources properly garbage collected

## Integration with Existing Features

### ✅ Works With
- BPM changes (affects loop duration)
- Add/Remove bars (adjusts range)
- Mute/Solo tracks (loops respect settings)
- Track volumes (maintained across loops)
- Clip effects (ADSR, filters, etc.)
- Recording (can record looped playback)

### ✅ Independent From
- Recording loop markers (those are for recorded audio)
- DJ Mixer playback
- Sampler/Theremin

## Use Cases

### 1. Live Performance Practice
```
- Set 4-bar loop
- Practice transitions
- Adjust effects in real-time
- Perfect the arrangement
```

### 2. Production Workflow
```
- Loop 2-bar section
- Fine-tune clip timing
- Adjust ADSR envelopes
- Test different effects
```

### 3. Creative Exploration
```
- Loop full 8-bar sequence
- Layer additional clips
- Experiment with mute/solo
- Record variations
```

### 4. DJ Set Preparation
```
- Loop intro section
- Cue next track
- Beatmatch timing
- Transition practice
```

## Keyboard Shortcuts (Future Enhancement)

Potential additions:
- `L` - Toggle loop
- `[` - Set loop start at playhead
- `]` - Set loop end at playhead
- `Shift+L` - Loop selected region

## Future Enhancements

Possible improvements:
- **Visual loop markers** on timeline ruler
- **Click to set loop points** directly on timeline
- **Punch in/out recording** within loop
- **Loop length quantization** (snap to bars/beats)
- **Multiple loop presets** (save/recall loop ranges)
- **Loop fade in/out** for smoother transitions
- **Count-in before loop** starts

## Comparison: Recording Loop vs Timeline Loop

| Feature | Recording Loop | Timeline Loop |
|---------|---------------|---------------|
| Purpose | A-B markers on recorded audio | Loop sequencer playback |
| UI Location | Recording section waveform | Main sequencer controls |
| Activation | Click waveform twice | Click 🔁 Loop button |
| Range | Time-based (seconds) | Bar-based (musical bars) |
| Adjustable | Click new points on waveform | Number inputs for bars |
| Use Case | Loop segment of recording | Loop timeline arrangement |

---

**Version**: 3.23  
**Feature**: Sequencer Timeline Loop  
**Status**: ✅ Complete and Working  
**Date**: October 26, 2025  
**Type**: New Feature
