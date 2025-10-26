# Release Notes - Version 3.17

## Sequencer ADSR Envelope & Recording Features

**Release Date**: October 26, 2025

### 🎛️ New Feature: ADSR Envelope per Clip

Every clip in the sequencer now has its own ADSR (Attack, Decay, Sustain, Release) envelope control, giving you professional-level control over how each sound evolves over time.

#### What's New

**ADSR Parameters (per clip)**
- **Attack** (1-2000ms): Control how quickly sound fades in from silence
- **Decay** (1-2000ms): Control transition time from peak to sustain level  
- **Sustain** (0-100%): Set the held volume level during playback
- **Release** (1-5000ms): Control how long sound takes to fade out

**Real-time Envelope Shaping**
- Each clip can have completely different ADSR settings
- Envelopes applied automatically during sequencer playback
- No limit to creative sound design possibilities

**ADSR Trigger Button**
- Manual trigger option in effects panel
- Preview envelope shapes before playback

### 📹 New Feature: Sequencer Recording & Export

Record your sequencer arrangements and export them or load them directly into DJ Mixer tracks for further processing.

#### What's New

**Recording Controls**
- **Record Button** (`⏺️`): Start recording sequencer output
- **Auto-start Playback**: Sequencer begins playing when you hit record
- **Live Timer**: See recording duration in real-time
- **Stop Recording**: Click to finish and save recording

**Export Options**
- **Download Recording** (`💾`): Save to your computer
  - WebM format (current)
  - WAV/MP3 formats (coming soon)
  
**Load to Tracks**
- **Load to Track 1** (`📥`): Put recording directly into DJ Mixer Track 1
- **Load to Track 2** (`📥`): Put recording directly into DJ Mixer Track 2
- Seamless integration with existing mixer workflow

**Recording UI**
- Dedicated recording section appears when recording
- Waveform visualization of recorded audio
- Playback controls to preview before exporting
- Format selector for future export options

### Combined Power

These features work together to create a complete production workflow:

1. **Arrange** clips in sequencer
2. **Shape** each clip with ADSR envelopes
3. **Apply** other effects (filter, reverb, delay, etc.)
4. **Record** the sequencer output
5. **Load** to Track 1 or 2
6. **Mix** with other tracks using crossfader
7. **Apply** master effects
8. **Record** final mix

### Use Cases

**Sound Design**
- Create custom envelopes for percussive sounds (fast attack, short release)
- Design pad sounds with slow attack and long release
- Shape individual clips for unique textures

**Live Performance Prep**
- Arrange complete sets in sequencer
- Record different variations to different tracks
- Use crossfader to transition between versions

**Layering Workflow**
- Record sequencer to Track 1
- Create different arrangement
- Record to Track 2  
- Mix both together with effects

**Sampling**
- Create custom loops in sequencer with effects
- Record the output
- Use as sample material in tracks

### Technical Improvements

**ADSR Implementation**
- Uses Web Audio API `AudioParam` automation
- Per-clip envelope scheduling during playback
- Zero-latency envelope application
- Smooth linear ramping for all ADSR stages

**Recording Architecture**
```
Sequencer Output (with all effects + ADSR)
  → MediaStreamDestination
  → MediaRecorder
  → Blob
  → File (for track loading)
```

**Memory Efficient**
- Envelopes calculated at schedule time
- No additional audio buffers needed
- Recording streams directly to blob

### Updated Effects Panel

The sequencer clip effects panel now includes:
1. Volume (0-150%)
2. Pitch (-12 to +12 semitones)
3. Filter (20Hz-20kHz, 3 types)
4. **ADSR Attack** (1-2000ms) ⭐ NEW
5. **ADSR Decay** (1-2000ms) ⭐ NEW
6. **ADSR Sustain** (0-100%) ⭐ NEW
7. **ADSR Release** (1-5000ms) ⭐ NEW
8. Reverb (0-100%)
9. Delay (0-100%)
10. Delay Time (50-2000ms)

### UI Enhancements

**Sequencer Header**
- Added Record button to main controls
- Visual consistency with DJ Mixer recording

**Recording Section** (appears when recording)
- Clean, organized layout
- Timer display
- Export controls grouped logically
- Waveform preview canvas

**Effects Panel**
- ADSR section with trigger button
- Collapsible controls for clean interface
- Real-time value displays

### Files Modified

- `app/templates/index.html`:
  - Added ADSR controls to clip effects panel
  - Added sequencer recording section UI
  - Added record button to sequencer header

- `app/static/js/modules/sequencer.js`:
  - Added ADSR effect controls setup (~40 lines)
  - Added ADSR to default effects object
  - Added ADSR envelope application in play() method (~40 lines)
  - Added recording methods: startRecording(), stopRecording(), downloadRecording(), loadToTrack() (~200 lines)
  - Updated showEffectsPanel() to display ADSR values
  - Updated resetClipEffects() and getClipEffects() to include ADSR

- `app/static/js/visualizer-dual.js`:
  - Added event listener for 'loadSequencerRecording' event (~20 lines)
  
- `app/static/css/style.css`:
  - Added sequencer recording section styles

### Breaking Changes

None - purely additive features.

### Known Limitations

**ADSR**
- Envelope is applied at playback schedule time (not real-time modifiable during playback)
- Release phase ends at clip duration (long clips may need adjustment)

**Recording**
- Currently outputs WebM format only
- WAV/MP3 conversion planned for future release
- Cannot record individual tracks (stems) separately
- Recording includes all sequencer output (no track isolation)

### Compatibility

- ✅ Works with all existing sequencer features
- ✅ Compatible with all clip effects
- ✅ Integrates with DJ Mixer tracks seamlessly
- ✅ Works with master effects chain
- ✅ Sampler and Theremin can still use sequencer as source

### Performance

- Minimal performance impact
- ADSR automation uses native Web Audio API scheduling
- Recording uses MediaRecorder API (hardware accelerated in most browsers)
- No additional CPU overhead during non-recording playback

### Getting Started

**Try ADSR:**
1. Load tracks and create clips in sequencer
2. Click a clip to open effects panel
3. Scroll down to ADSR Envelope section
4. Adjust Attack, Decay, Sustain, Release sliders
5. Hit Play to hear the envelope shape

**Try Recording:**
1. Arrange clips in sequencer timeline
2. Apply desired effects and ADSR to clips
3. Click `⏺️ Record` button
4. Let sequencer play through your arrangement
5. Click `⏹️ Stop Recording`
6. Use Download or Load to Track buttons

### Future Roadmap

**Short-term:**
- Visual ADSR curve display
- ADSR presets (Pluck, Pad, Percussion, Bass, etc.)
- WAV/MP3 export format conversion

**Long-term:**
- Per-clip ADSR automation (curves over time)
- Multi-track/stem export
- ADSR curve drawing interface
- Import recorded audio as new clips

---

**Full Documentation**: See [SEQUENCER_ADSR_AND_RECORDING.md](SEQUENCER_ADSR_AND_RECORDING.md)

**Version**: 3.17  
**Previous Version**: 3.16 (Sequencer Clip Effects)

### Summary

This release transforms the sequencer from a basic arrangement tool into a complete music production environment. The combination of per-clip ADSR envelopes and recording/export functionality enables complex sound design, arrangement, and integration workflows entirely within the browser. You can now create, shape, record, and mix music without leaving the application!
