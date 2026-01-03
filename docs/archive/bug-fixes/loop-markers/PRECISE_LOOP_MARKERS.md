# Precise Loop Marker Controls

## Overview
Added precise numeric input controls and enhanced clicking functionality for loop markers to enable accurate positioning of loop points, especially useful when working with zoomed waveforms and small audio segments.

## Problem Solved
When zoomed 10x or more on recorded audio (e.g., tab capture), manually setting loop markers by clicking on the waveform was imprecise, making it difficult to chop very small segments of audio accurately.

## Solution
Added **Precise Loop Points** input fields and **enhanced clicking modes** that allow:
- Viewing exact loop marker times in seconds with millisecond precision (0.001s)
- Manually typing exact time values
- Fine-tuning with arrow keys (0.001s increments)
- **Shift+Click** to set A and B markers independently
- **Alt+Click** to directly set the B marker
- **Hover tooltip** showing exact time position before clicking
- Real-time synchronization between visual markers and numeric inputs

## Features

### New UI Elements
Each track now has a "Precise Loop Points" section that appears when loop mode is enabled:
- **A (Start) Input**: Set loop start point in seconds (3 decimal places)
- **B (End) Input**: Set loop end point in seconds (3 decimal places)
- **Helpful Hint**: Visual reminder of keyboard shortcuts (💡 **Shift+Click** to set A and B independently • Hover to see time)
- **Time Tooltip**: Floating tooltip showing exact time as you hover over the waveform
- **Hover Time Display**: Shows current time in the zoom info area

### Functionality
1. **Auto-Population**: When you click on the waveform to set loop markers, the inputs automatically update with the exact time values
2. **Manual Input**: Type exact times (e.g., `1.234`) to position markers precisely
3. **Keyboard Shortcuts**:
   - **Shift+Click**: Set A (start) marker directly at click position
   - **Alt+Click**: Set B (end) marker directly at click position  
   - **Normal Click**: Alternates between A and B (standard behavior)
   - **Arrow Keys**: Fine-tune input values (±0.001s per press)
4. **Hover Tooltip**: See exact time position before clicking (displays over waveform)
5. **Validation**: 
   - Start point cannot exceed end point (auto-corrects)
   - End point cannot precede start point (auto-corrects)
   - Values are constrained to audio duration
6. **Visual Sync**: Markers on waveform update in real-time as you adjust input values
7. **Works with Zoom**: Fully compatible with waveform zoom feature
8. **Helpful Hint Label**: In-app reminder of keyboard shortcuts

### Visual Styling
- Cyan-themed to match the waveform colors
- Monospace font for clear number display
- Disabled state when loop mode is off
- Glowing border on focus

## Usage Workflow

### For Tab Capture Loop Chopping:
1. **Capture tab audio** to Track 1
2. **Zoom 10x** (or more) using the zoom controls
3. **Pan** the waveform by dragging to find your desired segment
4. **Enable loop mode** (🔁 button) - You'll see the helpful hint: "💡 **Shift+Click** to set A and B independently • Hover to see time"
5. **Set loop points** using one of these methods:
   - **Method 1 (Normal)**: Click twice on waveform (first = A, second = B)
   - **Method 2 (Precise)**: Shift+Click for A, then Shift+Click for B
   - **Method 3 (Ultra-precise)**: Type exact values in the input fields
6. **Fine-tune** using:
   - Arrow keys in input fields for 0.001s adjustments
   - Hover tooltip to preview exact times before clicking
   - Direct number input for millisecond precision
7. **Test the loop** by playing
8. **Export** the loop segment when satisfied

### Example:
```
Precise Loop Points (seconds):
A: [1.234] ←→
B: [1.567] ←→
💡 Shift+Click to set A and B independently • Hover to see time
```
This creates a 333ms loop segment starting at 1.234 seconds.

### Keyboard Shortcuts Quick Reference:
- **Shift+Click on waveform**: Set A marker at that position
- **Alt+Click on waveform**: Set B marker at that position
- **Normal Click on waveform**: Toggle between A and B (standard mode)
- **Arrow ↑↓ in inputs**: Adjust time by ±0.001 seconds
- **Hover over waveform**: See exact time position in tooltip

## Technical Implementation

### HTML Changes
- Added `preciseLoopSection1` and `preciseLoopSection2` containers
- Added `loopStartInput1`, `loopEndInput1`, `loopStartInput2`, `loopEndInput2` number inputs
- Set `step="0.001"` for millisecond precision

### CSS Changes
- `.precise-loop-section`: Container styling
- `.precise-loop-inputs`: Flexbox layout for inputs
- `.precise-loop-input-group`: Individual input wrapper
- `.loop-time-input`: Styled input field with focus effects

### JavaScript Changes
1. **New DOM References**: Added input element references
2. **Helper Function**: `updatePreciseLoopInputs(trackNumber)` - Updates inputs from loop state
3. **Event Listeners**: 
   - Input change handlers for both tracks
   - Validation and sync with loop state
4. **Integration Points**:
   - Waveform click handlers call `updatePreciseLoopInputs()`
   - Quick loop function calls `updatePreciseLoopInputs()`
   - Loop enable/disable shows/hides section
   - Clear loop button resets inputs

## Files Modified
- `app/templates/index.html` - Added precise loop input UI
- `app/static/css/style.css` - Added styling for inputs
- `app/static/js/app.js` - Added functionality and event handlers

## Benefits
1. **Precision**: Millisecond-accurate loop point placement
2. **Ease of Use**: Keyboard and numeric input alongside visual controls
3. **Workflow Speed**: Quickly fine-tune after rough positioning
4. **Accessibility**: Works well with screen readers and keyboard navigation
5. **Professional**: Matches DAW-style loop point controls

## Future Enhancements
Potential improvements:
- Timecode display format (MM:SS.mmm)
- Snap-to-zero-crossing for seamless loops
- Loop length calculator/adjuster
- Preset loop lengths (e.g., 0.5s, 1s, 2s)
- Copy/paste loop points between tracks
