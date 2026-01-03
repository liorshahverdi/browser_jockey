# Sequencer Feature

## Overview

The sequencer feature allows you to arrange and layer audio clips from your loaded tracks in a timeline-based interface. You can create multi-track compositions by dragging and dropping clips onto a grid-based sequencer.

## Features

### Tab Navigation
- **DJ Mixer Tab**: The original dual-track DJ interface
- **Sequencer Tab**: The new sequencer interface for arranging clips

### Sequencer Controls
- **Play/Pause/Stop**: Control playback of the sequencer arrangement
- **Add/Remove Bars**: Dynamically adjust the length of your composition (each bar represents a musical measure)
- **BPM Control**: Set the tempo (60-200 BPM) to match your composition

### Available Clips Panel
- Automatically populated when you load tracks in the DJ Mixer tab
- Each loaded track becomes an available clip
- Shows clip name and duration
- **Add New Track** button to create additional sequencer tracks

### Sequencer Timeline
- **Timeline Ruler**: Shows bar numbers for easy reference
- **Multiple Tracks**: Layer unlimited tracks on top of each other
- **Drag and Drop**: Drag clips from the available clips panel to any track
- **Snap to Grid**: Clips automatically snap to bar boundaries
- **Move Clips**: Click and drag clips within a track to reposition them
- **Delete Clips**: Double-click a clip to remove it from the timeline

### Track Controls
- **Mute**: Silence a specific track during playback
- **Solo**: Play only this track (mutes all other tracks)
- **Delete**: Remove a track from the sequencer

## How to Use

### 1. Load Audio Files
1. Switch to the **DJ Mixer** tab
2. Load audio files into Track 1 and/or Track 2 using the file upload buttons
3. The loaded tracks will automatically appear as clips in the sequencer

### 2. Switch to Sequencer
1. Click the **🎼 Sequencer** tab button
2. You'll see your loaded clips in the "Available Clips" panel on the left

### 3. Create Tracks
1. Click the **➕ Add New Track** button in the clips panel
2. Additional tracks will be added to the sequencer timeline

### 4. Arrange Clips
1. Drag a clip from the Available Clips panel
2. Drop it onto any track at your desired position
3. The clip will snap to the nearest bar
4. Clips show the track name on the timeline
5. Move clips by clicking and dragging them within the track
6. Double-click a clip to delete it

### 5. Adjust Timeline
1. Use **➕ Add Bar** to extend your composition
2. Use **➖ Remove Bar** to shorten it
3. Set the **BPM** to match your desired tempo

### 6. Control Playback
1. Click **▶️ Play** to start playback from the beginning
2. A red playhead will move across the timeline showing the current position
3. Click **⏸️ Pause** to pause playback
4. Click **⏹️ Stop** to stop and reset to the beginning

### 7. Mix and Layer
1. Use **🔇 Mute** to temporarily silence tracks
2. Use **🎯 Solo** to hear only specific tracks
3. Layer multiple clips on different tracks for complex arrangements

## Technical Details

### Grid System
- Each bar is 150 pixels wide
- Clips automatically snap to bar boundaries when placed
- Time signature: 4/4 (default)
- Bar duration calculated as: (60 / BPM) × 4 seconds

### Audio Playback
- Uses Web Audio API for precise timing
- All clips are scheduled at the correct time positions
- Playback syncs to the BPM setting
- Audio buffers are reused from loaded tracks for efficiency

### Drag and Drop
- Native HTML5 drag and drop API
- Visual feedback when dragging
- Drop indicators show valid drop zones
- Grid snapping for easy alignment

## Keyboard Shortcuts

Currently, there are no keyboard shortcuts specific to the sequencer. This is a potential future enhancement.

## Limitations

1. **Fixed Time Signature**: Currently supports 4/4 time only
2. **No Clip Editing**: Clips cannot be trimmed or edited within the sequencer
3. **No MIDI Support**: Audio clips only, no MIDI sequencing
4. **No Volume Automation**: Track volume/mute/solo are global, not automated over time
5. **No Export**: The sequencer arrangement cannot be exported directly (use master recording in DJ Mixer tab)

## Future Enhancements

Potential improvements for future versions:
- [ ] Clip trimming and time-stretching
- [ ] Volume and pan automation lanes
- [ ] MIDI sequencing support
- [ ] Export sequencer arrangement to audio file
- [ ] Copy/paste clips
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts for common actions
- [ ] Zoom controls for timeline
- [ ] Multiple time signature support
- [ ] Click track / metronome
- [ ] Loop region playback
- [ ] Markers and regions

## Integration with DJ Mixer

The sequencer is fully integrated with the main DJ application:
- Clips use the same audio buffers as the DJ mixer tracks
- The same AudioContext is shared between both features
- Switch seamlessly between DJ Mixer and Sequencer tabs
- Load files in DJ Mixer, arrange them in Sequencer

## Browser Compatibility

The sequencer uses:
- Web Audio API (all modern browsers)
- HTML5 Drag and Drop (all modern browsers)
- ES6 Modules (all modern browsers)
- CSS Grid (all modern browsers)

Tested on:
- Chrome/Edge (Recommended)
- Firefox
- Safari

## Code Structure

### Files Modified
- `app/templates/index.html` - Added tab navigation and sequencer UI
- `app/static/css/style.css` - Added sequencer and tab navigation styles
- `app/static/js/app.js` - Integrated sequencer into main app
- `app/static/js/modules/sequencer.js` - New sequencer module

### Key Classes
- `Sequencer` - Main sequencer class managing state and interactions
  - `clips` - Map of available audio clips
  - `sequencerTracks` - Array of sequencer tracks with placed clips
  - `currentBPM` - Tempo setting
  - `numberOfBars` - Length of composition

### Key Methods
- `addClip()` - Add a new clip to the available clips library
- `addSequencerTrack()` - Create a new track in the timeline
- `addClipToTrack()` - Place a clip instance on a track
- `play()` - Start sequencer playback
- `stop()` - Stop playback and reset

## Tips

1. **Start Simple**: Begin with 4-8 bars and add more as needed
2. **Use Multiple Tracks**: Create separate tracks for different elements (drums, melody, etc.)
3. **Experiment**: Try different clip positions and combinations
4. **Mute/Solo**: Use these to focus on specific parts of your arrangement
5. **BPM Matching**: Set the sequencer BPM to match your loaded tracks for best results

## Troubleshooting

**Clips not appearing?**
- Make sure you've loaded tracks in the DJ Mixer tab first
- Check that the audio files loaded successfully

**Can't drag clips?**
- Ensure you're clicking and holding on the clip item
- Try refreshing the page if drag and drop stops working

**Playback not working?**
- Check browser console for errors
- Ensure audio context is initialized (load a track first)
- Try clicking play again

**Clips not aligned properly?**
- Clips snap to bar boundaries automatically
- Adjust BPM if timing seems off

---

**Made by Lior Shahverdi and Claude Sonnet 4.5 in VS Code**
