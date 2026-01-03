# Sequencer Clip Effects Feature

## Overview
The sequencer now supports individual clip effects, allowing you to apply different audio processing to each clip on the timeline independently from the main DJ mixer tracks.

## Features

### Per-Clip Effects Panel
- **Click any clip** on the sequencer timeline to open the effects panel
- Effects panel slides in from the right side of the workspace
- Selected clip is highlighted with a golden border
- Effects are saved per-clip and persist during playback

### Available Effects

#### 1. **Volume (0-150%)**
- Control the loudness of individual clips
- Range: 0% (silent) to 150% (amplified)
- Default: 100%

#### 2. **Pitch (-12 to +12 semitones)**
- Shift the pitch up or down by up to one octave
- Uses playback rate modulation
- Default: 0 (no pitch shift)

#### 3. **Filter (20Hz - 20kHz)**
- Three filter types:
  - **Low Pass**: Cuts high frequencies
  - **High Pass**: Cuts low frequencies  
  - **Band Pass**: Allows only middle frequencies
- Default: 20kHz (no filtering)

#### 4. **Reverb (0-100%)**
- Add spatial depth and ambience
- Wet/dry mix control
- Default: 0% (no reverb)

#### 5. **Delay (0-100%)**
- Echo effect with feedback
- Mix level controls intensity
- Default: 0% (no delay)

#### 6. **Delay Time (50-2000ms)**
- Control the time between delay repeats
- Works in conjunction with Delay amount
- Default: 300ms

### How to Use

1. **Load Tracks**: Load audio files in the DJ Mixer tab
2. **Switch to Sequencer**: Click the "Sequencer" tab
3. **Arrange Clips**: Drag clips from the Available Clips panel onto the timeline
4. **Select Clip**: Click on any clip in the timeline to open the effects panel
5. **Adjust Effects**: Use the sliders to apply effects to the selected clip
6. **Play**: Hit the Play button to hear your clips with effects applied
7. **Reset**: Click "Reset All Effects" to return a clip to default settings

### Effects Chain Architecture

Each clip during playback uses this signal flow:
```
AudioBufferSource 
  → BiquadFilter (filter type & frequency)
  → GainNode (volume)
  → Delay Branch (wet/dry mix with feedback)
  → Sequencer Output Gain
  → Master Routing
```

### Key Features

- ✅ **Independent Effects**: Each clip has its own effect settings
- ✅ **Real-time Updates**: Effects are applied when you hit play
- ✅ **Visual Feedback**: Selected clip highlighted in gold
- ✅ **Persistent Settings**: Effects are remembered per clip
- ✅ **Easy Reset**: One-click reset to default values
- ✅ **Separate from DJ Mixer**: Sequencer effects don't affect Track 1/2 effects

### UI Layout

The workspace automatically adjusts when effects panel is open:
- **Closed**: 2 columns (Clips Panel | Timeline)
- **Open**: 3 columns (Clips Panel | Timeline | Effects Panel)

### Tips

1. **Layering**: Apply different reverb amounts to clips to create depth
2. **Rhythmic Delays**: Use delay on percussive clips for rhythmic effects
3. **Filter Sweeps**: Combine filter with different types for creative transitions
4. **Pitch Stacking**: Duplicate clips and pitch shift for harmonies
5. **Volume Automation**: Use volume to create dynamic mixes

### Differences from DJ Mixer Effects

| Feature | DJ Mixer Effects | Sequencer Clip Effects |
|---------|-----------------|----------------------|
| Scope | Entire Track 1 or Track 2 | Individual clips |
| Visibility | Always visible | Opens on clip selection |
| Persistence | Per track | Per clip instance |
| Integration | Affects live playback | Applied during sequencer playback |

## Technical Details

- Effects are stored in a Map structure keyed by clip ID
- Effects chain created dynamically during playback scheduling
- Uses Web Audio API nodes: BiquadFilter, GainNode, DelayNode
- Pitch shifting via `playbackRate` property
- Reverb implemented as simplified wet/dry mix (could be enhanced with convolver)

## Future Enhancements

Potential improvements:
- Visual EQ spectrum per clip
- Automation curves for effects over time
- Effect presets/templates
- Copy/paste effects between clips
- Real-time effect updates during playback (would require different architecture)

---

**Version**: 3.16  
**Created**: 2025-10-26  
**Feature Type**: Audio Effects & Processing
