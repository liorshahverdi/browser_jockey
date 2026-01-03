# Release Notes - v3.27.0

## Drag & Drop Track Loading + Loop Fix

**Release Date**: January 3, 2026

---

## 🎯 New Features

### Drag & Drop Track Loading

Drag audio files from your file system directly onto Track 1 or Track 2 containers for instant loading!

#### Features
- **📁 Direct File Drop**: Drag files onto track containers instead of clicking "Choose Audio"
- **✨ Visual Feedback**: Track containers glow cyan (Track 1) or magenta (Track 2) when dragging files
- **🎵 Live Loading**: Load new files while the other track is playing - no interruption
- **⏺️ Recording Compatible**: Load files during master recording without stopping the recording
- **🎨 Scale Animation**: Containers scale up (1.02x) when files are dragged over
- **🔍 Smart Validation**: Automatically validates file types (audio/video only)
- **📦 All Formats**: MP3, WAV, OGG, FLAC, M4A, AAC, WEBM, MP4, AVI, MOV, etc.

#### UX Improvements
- **Faster Workflow**: No dialog boxes - drag and drop instantly
- **Professional DJ Feel**: Matches behavior of professional DJ software
- **Visual Confirmation**: See which track will receive the file before dropping
- **No Playback Interruption**: Playing track continues seamlessly
- **Works During Recording**: Master recording never stops or restarts

#### Technical Details
- Uses HTML5 Drag and Drop API
- Programmatically triggers existing file upload logic (no code duplication)
- Prevents default browser behavior (no opening files in browser)
- Validates files by MIME type and extension
- Console logging confirms recording continuation

---

## 🐛 Bug Fixes

### Loop Playback Fix

Fixed issue where loops would stop at the end instead of continuing.

#### Problem
- Loops would detect the end point correctly
- Track would jump back to loop start
- But playback would stop instead of continuing
- Caused by audio element getting paused during seek operation

#### Solution
- Updated loop control logic to always resume playback after seeking
- Changed condition from `if (wasPlaying && audioElement.paused)` to `if (wasPlaying || audioElement.paused)`
- Ensures seamless loop continuation regardless of pause state
- Handles edge cases where audio might pause during seek

#### Impact
- ✅ Loops now continue playing indefinitely
- ✅ Works with timestretched audio
- ✅ Works with reverse loops
- ✅ Works when loading new files during playback

### File Loading Fix

Fixed issue where drag-and-drop files wouldn't play audio.

#### Problem
- `loadAudioFile` function had logic to skip updating audio source if already set
- Prevented new files from being loaded when dragging onto tracks
- Files would appear to load but no audio would play

#### Solution
- Removed redundant source-setting logic from `loadAudioFile`
- Audio element source is already set by file upload handlers
- New files now properly replace old sources
- Simplified code and removed unnecessary checks

---

## 📁 Files Modified

### JavaScript
- `app/static/js/app.js`
  - Added drag-and-drop event handlers for Track 1 and Track 2 containers (lines ~8150-8265)
  - Added console logging for recording status during file uploads
  - Fixed `loadAudioFile` to not skip source updates

### CSS
- `app/static/css/style.css`
  - Added `.track-upload.drag-over` base styles
  - Added `.track-upload:first-child.drag-over` (cyan theme for Track 1)
  - Added `.track-upload:last-child.drag-over` (magenta theme for Track 2)
  - Smooth transitions, scale transforms, enhanced glows

### Modules
- `app/static/js/modules/loop-controls.js`
  - Fixed loop continuation logic in `handleLoopPlayback`

### Documentation
- `DRAG_DROP_TRACK_LOADING.md` - Complete feature documentation
- `README.md` - Updated with drag & drop feature

---

## 🎨 Visual Design

### Drag-Over Effects

**Track 1 (Cyan)**:
```css
- Border: rgba(0, 255, 255, 0.8)
- Background: rgba(0, 255, 255, 0.15)
- Glow: 40px cyan shadow
- Scale: 1.02x
- Transition: 0.3s ease
```

**Track 2 (Magenta)**:
```css
- Border: rgba(255, 0, 255, 0.8)
- Background: rgba(255, 0, 255, 0.15)
- Glow: 40px magenta shadow
- Scale: 1.02x
- Transition: 0.3s ease
```

---

## 🧪 Testing

### Drag & Drop
- ✅ Drag audio file to Track 1 → File loads successfully
- ✅ Drag audio file to Track 2 → File loads successfully
- ✅ Drag non-audio file → Alert shown, no loading
- ✅ Drag while Track 1 playing → Track 2 loads without interruption
- ✅ Drag while Track 2 playing → Track 1 loads without interruption
- ✅ Drag while recording → File loads, recording continues
- ✅ Visual feedback appears/disappears correctly
- ✅ Works with all supported formats

### Loop Fix
- ✅ Loop continues playing after reaching end point
- ✅ Works with timestretched audio
- ✅ Works with reverse loops
- ✅ Works when loading new files during playback

### Integration
- ✅ Drag-dropped files work with all effects
- ✅ Waveform analysis works (BPM, key detection)
- ✅ Buffer management works (reverse playback)
- ✅ Tab capture cleanup works
- ✅ All track features work normally

---

## 💡 Usage

### Drag & Drop Workflow

1. **Open File Manager**: Open Finder (Mac) or File Explorer (Windows)
2. **Select Audio File**: Find an audio file you want to load
3. **Drag to Track**: Drag the file over Track 1 or Track 2
4. **See Feedback**: Track container glows and scales up
5. **Drop File**: Release mouse to load the file
6. **Play**: File loads with full waveform analysis and all features

### Professional DJ Workflow

```
Scenario: Live DJ set with track swapping

Track 1: Playing current song
↓
Drag new song to Track 2
↓
Track 2 loads in background (Track 1 keeps playing)
↓
Crossfade from Track 1 to Track 2
↓
While Track 2 plays, drag next song to Track 1
↓
Repeat indefinitely!
```

---

## 🔧 Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

All modern browsers support:
- HTML5 Drag and Drop API
- DataTransfer API
- File API
- CSS transforms and transitions

---

## 📊 Performance

- **No Memory Leaks**: Uses existing cleanup logic
- **No Additional Context**: Same audio context management
- **Same Performance**: Identical to button-based file loading
- **Minimal Overhead**: Lightweight event handlers only

---

## 🎯 Future Enhancements

Potential improvements for future versions:
- [ ] Multi-file queue for rapid track switching
- [ ] Drag-and-drop from browser (e.g., SoundCloud, YouTube)
- [ ] Drop preview (show filename before confirming)
- [ ] Cue point preservation when replacing tracks
- [ ] Visual progress indicator for large file loading
- [ ] Keyboard shortcut to toggle drag-drop zones

---

**Version**: 3.27.0  
**Status**: ✅ Complete and Working  
**Previous Version**: 3.26.2  
**Next Version**: TBD
