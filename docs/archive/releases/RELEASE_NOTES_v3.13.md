# Browser Jockey v3.13.0 - Tab Capture Feature

## Release Date
October 26, 2025

## Major New Feature: Browser Tab Audio Capture

Capture audio from any browser tab (YouTube, Spotify, SoundCloud, etc.) and route it through Browser Jockey's professional effect chains and mixing system!

### Key Features

#### 🎵 **Tab Capture to Tracks**
- Capture audio from any open browser tab to Track 1 or Track 2
- Full real-time effects processing (volume, pan, filter, reverb, delay)
- Mix captured audio with loaded files
- Route through professional crossfader
- Apply master effects to final output

#### 🎤 **Tab Capture to Microphone**
- Capture tab audio as microphone input
- Use with vocoder and auto-tune effects
- Process through microphone effect chain
- Mix with crossfader (Track1↔Mic or Track2↔Mic modes)

#### ⏺️ **Master Recording with Tab Capture**
- Record your live mixes with tab audio
- Captures all effects, mixing, and processing
- Export as WebM, WAV, or MP3
- Load recordings back to tracks for layering

#### 🔧 **Technical Improvements**
- Intelligent MIME type detection for cross-browser compatibility
- Proper audio graph routing through effect chains
- Audio level monitoring during recording
- Automatic cleanup when switching between tab capture and files

### How to Use

#### Capture Tab to Track:
1. Open YouTube/Spotify/etc in another tab and play audio
2. Click "Capture Tab Audio" button on Track 1 or Track 2
3. Select the tab with audio (ensure "Share audio" is checked)
4. Audio streams through your track effects in real-time
5. Mix with other tracks, apply effects, crossfade, etc.
6. Control playback (play/pause) in the source tab

#### Capture Tab as Microphone:
1. Click "Capture Tab Audio" in Microphone section
2. Select tab with audio
3. Use with vocoder/autotune effects
4. Mix using crossfader
5. Apply microphone effects

#### Record Tab Capture:
1. Capture tab audio to track(s)
2. Start master recording
3. Mix live with effects and crossfader
4. Stop recording and export or load to track

### Browser Compatibility

| Browser | Tab Capture | Effects | Recording |
|---------|-------------|---------|-----------|
| Chrome  | ✅ Full     | ✅ Full | ✅ Full   |
| Edge    | ✅ Full     | ✅ Full | ✅ Full   |
| Firefox | ⚠️ Limited  | ✅ Full | ✅ Full   |
| Safari  | ❌ No       | N/A     | N/A       |

### Important Notes

- **Playback Control**: You must control play/pause in the source tab, not in Browser Jockey
- **Tempo Control**: Not available for live streams (tempo slider disabled)
- **Loop Markers**: Cannot set loop markers on live tab capture
- **Audio Quality**: Depends on source tab audio quality

### Bug Fixes & Improvements

#### Audio Routing Fixes
- Fixed variable shadowing in effect chain setup
- Corrected delay and reverb routing paths
- Implemented proper `connectEffectsChain()` usage
- Ensured `finalMix` nodes connect to merger

#### Recording Enhancements
- Added intelligent MIME type detection
- Implemented audio level monitoring
- Enhanced error messages with troubleshooting tips
- Added empty recording detection

#### UX Improvements
- Automatic tab capture cleanup when loading files
- Smooth transitions between tab capture and file playback
- Clear console logging for debugging
- Helpful tooltips and error messages

### Technical Documentation

See comprehensive documentation:
- `TAB_CAPTURE_COMPLETE_SUMMARY.md` - Full feature overview
- `TAB_CAPTURE_IMPLEMENTATION_SUMMARY.md` - Technical implementation
- `TAB_CAPTURE_TESTING_GUIDE.md` - Testing procedures
- `TAB_CAPTURE_QUICK_REFERENCE.md` - Quick reference guide
- `TAB_CAPTURE_FINAL_FIX.md` - Audio routing fix details
- `TAB_CAPTURE_CLEANUP_ON_FILE_LOAD.md` - UX improvements
- `MASTER_RECORDING_TAB_CAPTURE_FIX.md` - Recording button fix
- `MASTER_RECORDING_DEBUG_ENHANCEMENT.md` - Debugging improvements

### Use Cases

1. **DJ Mixing**: Mix YouTube tracks with your uploaded files
2. **Podcast Production**: Capture online audio and mix with commentary
3. **Live Performance**: Use streaming services through professional effects
4. **Sound Design**: Process web audio through complex effect chains
5. **Recording**: Capture and save your mixes with web audio sources
6. **Mashups**: Mix tracks from different streaming platforms
7. **Education**: Demonstrate audio processing on web content

### Known Limitations

- Cannot control playback speed/tempo of tab capture
- Cannot set loop markers on live streams
- Recording quality depends on source
- Browser security prevents direct tab control
- Safari doesn't support tab capture API

### Migration Notes

No breaking changes. Existing features work exactly as before. New tab capture buttons added to each track section and microphone section.

## Upgrade Instructions

1. Pull latest code from repository
2. No dependency changes required
3. Clear browser cache for updated JavaScript
4. Refresh Browser Jockey page
5. Look for new "Capture Tab Audio" buttons

## Contributors

- Lior Shahverdi (@liorshahverdi)

---

**Full Changelog**: v3.12.0...v3.13.0
