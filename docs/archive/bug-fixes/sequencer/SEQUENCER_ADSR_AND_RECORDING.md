# Sequencer ADSR & Recording Features

## Overview
Enhanced the sequencer with ADSR envelope shaping for individual clips and full recording/export capabilities.

## New Features

### 🎛️ ADSR Envelope per Clip

Each clip in the sequencer now has its own ADSR (Attack, Decay, Sustain, Release) envelope that shapes the volume over time during playback.

#### ADSR Parameters

1. **Attack (1-2000ms)**
   - Time to reach full volume from silence
   - Default: 10ms
   - Fast attack for punchy sounds, slow attack for swells

2. **Decay (1-2000ms)**
   - Time to transition from peak to sustain level
   - Default: 100ms
   - Short decay for percussive sounds, long decay for smooth transitions

3. **Sustain (0-100%)**
   - Level held during the main portion of the clip
   - Default: 80%
   - Percentage of the full volume

4. **Release (1-5000ms)**
   - Time to fade to silence after clip ends
   - Default: 300ms
   - Short release for abrupt stops, long release for smooth tails

#### How ADSR Works

```
Volume
  ^
  |     /\___________
  |    /  \          \
  |   /    \          \___
  |  /      \              \
  | /        \              \
  |/          \              \
  +----------------------------> Time
     A    D      S        R

A = Attack
D = Decay  
S = Sustain (level)
R = Release
```

During playback, each clip's volume follows this envelope:
1. Starts at 0
2. Ramps up to full volume (Attack)
3. Drops to sustain level (Decay)
4. Holds at sustain level (Sustain)
5. Fades to 0 (Release)

#### Creative Uses

- **Percussion**: Fast attack (1-10ms), short decay (50ms), low sustain (20%), short release (50ms)
- **Pads**: Slow attack (500-1000ms), long decay (500ms), high sustain (80%), long release (1000ms)
- **Plucks**: Very fast attack (1ms), medium decay (200ms), low sustain (10%), short release (100ms)
- **Swells**: Very slow attack (1000-2000ms), long decay (500ms), high sustain (90%), long release (2000ms)

### 📹 Sequencer Recording & Export

Record the sequencer output and export or load it directly into Track 1 or Track 2.

#### Recording Controls

**Record Button** (`⏺️ Record`)
- Starts recording the sequencer output
- Automatically begins sequencer playback if not already playing
- Shows recording section with timer

**Stop Recording Button** (`⏹️ Stop Recording`)
- Stops the current recording
- Makes recorded audio available for playback and export

#### Export Options

Once a recording is complete, you can:

1. **Download Recording** (`💾 Download Recording`)
   - Save the recording to your computer
   - Format options:
     - **WebM** (original, best quality)
     - **WAV** (lossless, future feature)
     - **MP3** (compressed, future feature)

2. **Load to Track 1** (`📥 Load to Track 1`)
   - Automatically loads the sequencer recording into DJ Mixer Track 1
   - Replaces any current track
   - Recording becomes available for mixing, effects, looping

3. **Load to Track 2** (`📥 Load to Track 2`)
   - Loads the recording into DJ Mixer Track 2
   - Same functionality as Track 1
   - Allows you to mix sequencer output with other tracks

#### Recording Workflow

1. **Arrange Your Sequence**
   - Add clips to sequencer timeline
   - Apply effects to individual clips
   - Set BPM and arrange bars

2. **Start Recording**
   - Click `⏺️ Record` button
   - Sequencer starts playing automatically
   - Recording timer shows elapsed time

3. **Stop When Done**
   - Click `⏹️ Stop Recording`
   - Recorded audio appears in the recording section

4. **Export or Use**
   - Choose format and download, OR
   - Load directly to Track 1 or 2 for further mixing

#### Technical Details

**Recording Method**
- Uses Web Audio API `MediaStreamDestination`
- Records sequencer output with all effects applied
- Captures the actual audio output, not MIDI-style data

**Audio Routing**
```
Sequencer Clips (with effects) 
  → Sequencer Output Gain
  → MediaStreamDestination
  → MediaRecorder
  → Blob (WebM)
```

**File Format**
- Primary format: WebM (browser native)
- Future: WAV conversion (lossless)
- Future: MP3 conversion (compressed)

## Complete Effects Suite per Clip

Each sequencer clip now has these effects available:

| Effect | Range | Default | Purpose |
|--------|-------|---------|---------|
| Volume | 0-150% | 100% | Loudness control |
| Pitch | -12 to +12 semitones | 0 | Pitch shifting |
| Filter | 20Hz-20kHz | 20kHz | Frequency filtering |
| **ADSR Attack** | 1-2000ms | 10ms | Volume ramp-up time |
| **ADSR Decay** | 1-2000ms | 100ms | Transition to sustain |
| **ADSR Sustain** | 0-100% | 80% | Held volume level |
| **ADSR Release** | 1-5000ms | 300ms | Fade-out time |
| Reverb | 0-100% | 0% | Spatial depth |
| Delay | 0-100% | 0% | Echo effect |
| Delay Time | 50-2000ms | 300ms | Echo timing |

## Use Cases

### 1. Build Complex Arrangements
- Layer multiple clips with different ADSR envelopes
- Create dynamic builds and breakdowns
- Record the final arrangement

### 2. Sound Design
- Shape individual clip envelopes for unique textures
- Combine effects with ADSR for complex sounds
- Export for use in other projects

### 3. Live Performance Prep
- Arrange your DJ set in the sequencer
- Apply effects and envelopes
- Record the performance
- Load to tracks for live manipulation

### 4. Sampling Workflow
- Create custom loops in sequencer
- Apply effects and envelopes
- Record the output
- Use as sample in Track 1 or 2

### 5. Layering Technique
- Record sequencer output to Track 1
- Create different arrangement
- Record to Track 2
- Mix both recordings together

## Integration with DJ Mixer

**Sequencer → Track Workflow:**
1. Create arrangement in sequencer
2. Apply per-clip effects (including ADSR)
3. Record sequencer output
4. Load to Track 1 or 2
5. Apply track-level effects
6. Mix with other tracks
7. Apply master effects
8. Record final mix

This creates a powerful multi-stage production workflow entirely in the browser!

## Tips & Best Practices

### ADSR Tips
- Use similar ADSR settings on clips that play together
- Vary attack times to create depth (some clips fade in while others punch through)
- Long release times can create smooth transitions between clips
- Fast attack + short release = tight, punchy sound
- Slow attack + long release = ambient, atmospheric

### Recording Tips
- Let the sequencer play through at least once before recording
- Leave some silence at the end (use Release to fade out)
- Record longer than needed, you can trim in the DJ mixer
- Test your arrangement before recording
- Check the recording playback before exporting

### Performance Tips
- Record variations of your sequence to different tracks
- Use crossfader to transition between recorded versions
- Apply different master effects to live-mix recordings
- Build up layers by recording multiple times to different tracks

## Future Enhancements

Planned improvements:
- **Real-time ADSR visualization** on timeline
- **WAV/MP3 export** with format conversion
- **ADSR presets** (Pluck, Pad, Percussion, etc.)
- **Per-clip ADSR curves** visualization
- **ADSR automation** over time
- **Multi-track recording** (stems export)

---

**Version**: 3.17  
**Release Date**: October 26, 2025  
**Previous Version**: 3.16 (Sequencer Clip Effects)
