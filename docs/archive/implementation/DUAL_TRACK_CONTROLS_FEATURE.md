# Dual Track Controls Feature

## Summary
Added two new buttons to the Browser Jockey UI that enable simultaneous control of both audio tracks:

1. **Play Both Tracks** - Plays both Track 1 and Track 2 simultaneously
2. **Play Both & Record** - Plays both tracks simultaneously and starts recording at the same time

## Changes Made

### 1. HTML (`app/templates/index.html`)
- Added a new "Dual Track Controls" section between the track controls and microphone section
- Includes two new buttons with appropriate styling and icons:
  - `playBothBtn` - Play Both Tracks button
  - `playBothRecordBtn` - Play Both & Record button
- Both buttons are disabled by default until both tracks are loaded

### 2. CSS (`app/static/css/style.css`)
- Added `.dual-track-controls-section` styling with cyan theme to match the app aesthetic
- Added `.dual-controls-header` with glowing text effect
- Added `.dual-controls-buttons` flex layout for button arrangement
- Added `.dual-control-btn` styling with gradient backgrounds and hover effects
- Added `.dual-icon` styling for the emoji icons

### 3. JavaScript (`app/static/js/app.js`)

#### New DOM Elements
- `playBothBtn` - Reference to the Play Both Tracks button
- `playBothRecordBtn` - Reference to the Play Both & Record button

#### New Functions

**`checkDualTrackButtonsState()`**
- Helper function that checks if both tracks are loaded
- Enables/disables the dual track buttons accordingly
- Called whenever a track is loaded (file upload or recording load)

**`playBothTracks()`**
- Initializes audio context if needed
- Plays both `audioElement1` and `audioElement2` simultaneously
- Handles reverse loop animations if enabled on either track
- Starts the visualization if not already running

**`playBothAndRecord()`**
- Checks if recording is already in progress
- Starts recording first
- Then plays both tracks simultaneously
- Handles reverse loop animations if needed
- Starts the visualization if not already running

#### Integration Points
- Event listeners added for both new buttons
- `checkDualTrackButtonsState()` called in:
  - `audioFile1` change event handler
  - `audioFile2` change event handler
  - `loadRecordingToTrack1()` function
  - `loadRecordingToTrack2()` function

## Features

### Smart Button State Management
- Buttons are disabled until both tracks have audio loaded
- Automatically enabled when both Track 1 and Track 2 are ready
- Works with both file uploads and loaded recordings

### Synchronized Playback
- Both tracks start playing at exactly the same time
- Maintains any individual track settings (loops, effects, tempo, etc.)
- Respects reverse loop settings on each track independently

### Recording Integration
- "Play Both & Record" button combines playback and recording seamlessly
- Prevents duplicate recordings if already in progress
- Records the mixed output of both tracks with all effects applied

## User Experience
- Clear visual separation with its own section
- Cyan color theme distinguishes it from other controls
- Icon-rich buttons (▶️▶️ and ▶️⏺️) make functionality immediately clear
- Disabled state provides visual feedback when tracks aren't ready
- Responsive layout adapts to different screen sizes

## Technical Notes
- No changes to existing functionality
- Maintains compatibility with all existing features (effects, loops, etc.)
- Uses existing audio context and recording infrastructure
- Properly handles edge cases (no recording duplication, checking track states)
