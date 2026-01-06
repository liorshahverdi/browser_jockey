# Changelog

All notable changes to Browser Jockey are documented here.

## [v3.27.8] - Current Release

### Fixed
- **Audio element volume restoration after buffer playback** - Fixed critical bug where audio would play silently after using timestretched loop or reverse mode. The audio element volume is now properly restored when switching back to normal playback. See [current-release/RELEASE_NOTES_v3.27.8.md](current-release/RELEASE_NOTES_v3.27.8.md)

## [v3.27.7]

### Fixed
- **Position continuity when disabling reverse mode** - Fixed playback jump when toggling from reverse to forward mode. Both enabling and disabling reverse mode now continue from current position for seamless DJ performance. See [current-release/RELEASE_NOTES_v3.27.7.md](current-release/RELEASE_NOTES_v3.27.7.md)

## [v3.27.6]

### Fixed
- **Buffer source stop() error fix** - Eliminated `InvalidStateError` exceptions when stopping playback after switching to reverse mode while paused. Added lifecycle tracking to prevent invalid API calls.

## [v3.27.5]

### Fixed
- **Reverse mode position tracking with timestretch** - Fixed critical bug where switching to reverse mode with timestretching would use stale audio element position instead of actual buffer position.

## [v3.27.4]

### Fixed
- **Reverse playback double-call bugfix** - Fixed issue where switching to reverse mode would start buffer playback twice, causing position jumps and incorrect behavior.

## [v3.27.3]

### Fixed
- **Reverse playback start position bugfix** - Fixed issue where clicking the reverse loop button would jump to the end of loop before starting, instead of starting from current position.

## [v3.27.2]

### Fixed
- **Loop boundary enforcement bugfix** - Fixed issue where loop boundaries wouldn't update immediately when dragging the end marker backward during playback.

## [v3.27.1]

### Fixed
- **Loop state persistence bugfix** - Fixed critical issue where loop markers would be lost when toggling the loop button off and on, causing silent playback.

## [v3.27.0]

### Added
- **Drag & drop track loading** - Drag audio files from your file system directly onto Track 1 or Track 2 containers
  - Visual glow feedback
  - Seamless loading during playback/recording
  - Works with all file formats
  - Professional DJ workflow

See [docs/features/DRAG_DROP_TRACK_LOADING.md](docs/features/DRAG_DROP_TRACK_LOADING.md)

## [v3.26.2]

### Fixed
- **Critical theremin bug fixes**
  - Fixed track modulation (disconnect issue)
  - Simplified activation (hand detection only for tracks)
  - Improved playback reliability (stop button cleanup, loop disable, marker dragging)
  - Camera theremin now properly modulates Track 1/Track 2 audio signals

## [v3.26.0]

### Added
- **Professional constant-power stereo panning**
  - Fixed critical signal chain disconnection bug
  - Implemented 4-gain routing matrix with sine/cosine curves
  - Smooth L-R transitions
  - Preserves stereo quality
  - Works flawlessly with timestretching and all effects

See [docs/features/PANNING_RESOLUTION_SUMMARY.md](docs/features/PANNING_RESOLUTION_SUMMARY.md)

## [v3.25.0]

### Added
- **Sequencer fullscreen toggle**
  - Live fullscreen mode with instant switching
  - Keyboard shortcut (ESC)
  - Smooth fade-in animation
  - Expanded panels (100vw × 100vh)
  - Dark overlay for focus

See [docs/features/SEQUENCER_FULLSCREEN_TOGGLE.md](docs/features/SEQUENCER_FULLSCREEN_TOGGLE.md)

## [v3.24.0]

### Added
- **Sequencer zoom & pan with waveform visualization**
  - Zoom 50%-200% for detailed editing
  - Shift+drag or middle-mouse panning
  - Mini waveforms on clips
  - High-DPI canvas rendering
  - Intelligent panning that doesn't interfere with clip dragging

See [docs/features/SEQUENCER_ZOOM_PAN_FEATURE.md](docs/features/SEQUENCER_ZOOM_PAN_FEATURE.md)

## [v3.23.0]

### Added
- **Seamless timestretching + reverse mode integration**
  - Dual buffer storage for forward/reversed timestretched audio
  - Unified rendering strategy
  - Instant mode switching without regeneration
  - Maintains audio quality when toggling reverse button

See [docs/features/SEAMLESS_TIMESTRETCH_REVERSE.md](docs/features/SEAMLESS_TIMESTRETCH_REVERSE.md)

## [v3.22.0]

### Added
- **Sequencer per-track mixer**
  - Independent volume control per track with gain nodes (0-100%)
  - Proper audio routing through track → sequencer output → master
  - Visual volume sliders in track headers
  - Fixed no-audio-output bug

## [v3.21.0]

### Added
- **Independent pitch & tone controls**
  - Dedicated Pitch (±12 semitones) and Tone (20Hz-20kHz filter) sliders
  - Tone.js integration for professional pitch shifting without tempo changes
  - Reordered UI for logical workflow (Volume → Tempo → Tone → Pitch)
  - Live draggable controls
  - Fallback to vinyl-style if Tone.js unavailable

See [docs/features/PITCH_TONE_IMPLEMENTATION_SUMMARY.md](docs/features/PITCH_TONE_IMPLEMENTATION_SUMMARY.md)

## [v3.20.0]

### Added
- **Major sequencer enhancements**
  - Non-destructive clip trimming by dragging edges
  - Real-time effect updates during playback (volume, pitch, filter, delay)
  - Toggleable effects panel to maximize workspace
  - Automatic timeline resize based on track count
  - Timeline expansion when effects hidden
  - Auto-zoom to fit long clips

## [v3.14.0]

### Added
- **Precise Loop Markers with millisecond accuracy**
  - Set loop points with numeric inputs (0.001s precision)
  - Interactive time tooltip on hover
  - Intelligent marker adjustment
  - Fixed zoom click detection
  - Perfect for chopping tiny segments from tab-captured audio

## [v3.13.0]

### Added
- **Browser tab audio capture**
  - Capture audio from any browser tab (YouTube, Spotify, etc.)
  - Route to Track 1, Track 2, or Microphone input
  - Full effects support
  - Record tab capture to master output
  - Mix with other tracks
  - Apply vocoder/auto-tune

See [docs/features/TAB_AUDIO_CAPTURE_FEATURE.md](docs/features/TAB_AUDIO_CAPTURE_FEATURE.md)

## [v3.12.0]

### Added
- **ADSR Envelope effects**
  - Attack, Decay, Sustain, Release controls
  - Available for Track 1, Track 2, Master output, and Keyboard Sampler
  - Manual trigger buttons
  - Integrated into drag-and-drop effect chains

See [docs/features/ADSR_ENVELOPE_EFFECT.md](docs/features/ADSR_ENVELOPE_EFFECT.md)

## [v3.11.0]

### Added
- **Camera Theremin**
  - Motion-controlled instrument using webcam
  - Wave detection with adjustable sensitivity
  - Three control modes (Pitch & Volume, Filter & Resonance, ADSR Envelope)
  - Audio sources (oscillator, Track 1, Track 2)
  - Adaptive motion detection
  - Wave-only mode

See [docs/features/CAMERA_THEREMIN_FEATURE.md](docs/features/CAMERA_THEREMIN_FEATURE.md)

## [v3.10.0]

### Added
- **Professional DJ crossfader**
  - Three modes (Track1↔Track2, Track1↔Mic, Track2↔Mic)
  - Equal-power crossfade curves
  - Dynamic mode switching
  - Full three-column DJ layout

See [docs/features/CROSSFADER_FEATURE.md](docs/features/CROSSFADER_FEATURE.md)

## [v3.9.0]

### Added
- **Major microphone and effects routing enhancements**
  - Standalone microphone recording
  - Flexible vocoder/auto-tune routing (use mic OR tracks as sources)
  - Load microphone recordings to tracks
  - Master output routing toggles

See [docs/features/MICROPHONE_STANDALONE_RECORDING.md](docs/features/MICROPHONE_STANDALONE_RECORDING.md)

## Earlier Versions

See [docs/archive/releases/](docs/archive/releases/) for detailed release notes of versions v3.3 through v3.9.

---

**Current Version:** v3.27.7  
**Last Updated:** January 3, 2026
