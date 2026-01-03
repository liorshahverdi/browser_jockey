# Release Notes - v3.9.0

**Release Date**: October 24, 2025  
**Focus**: Microphone Enhancements, Flexible Audio Routing, Critical Bug Fixes

---

## 🎤 Major Features

### 1. Standalone Microphone Recording
Record directly from your microphone without needing any tracks loaded!

**Features**:
- ⏺️ Record button starts standalone mic recording
- 🎵 Real-time waveform visualization while recording
- ⏱️ Recording timer with pulse animation
- 🎧 Playback controls for recorded audio
- 💾 Export as WAV (lossless) or MP3 (compressed)
- 📥 Load recordings to Track 1 or Track 2

**Use Cases**:
- Voice memos and vocal recordings
- Podcast recording
- Live performance capture
- Sample creation for remixing

---

### 2. Flexible Vocoder/Autotune Routing
Use microphone OR tracks as sources for effects!

**Vocoder**:
- **Modulator (Voice)**: Choose Microphone, Track 1, or Track 2
- **Carrier Source**: Choose Microphone (Feedback), Track 1, Track 2, or Both Tracks (Mix)
- **Mic-to-Mic Mode**: Create feedback robotic effects

**Auto-Tune**:
- **Audio Source**: Choose Microphone, Track 1, or Track 2
- Works standalone or with tracks
- Pitch correction on any audio source

**Benefits**:
- Apply vocoder to track audio (not just voice)
- Auto-tune your tracks live
- Creative routing combinations

---

### 3. Load Microphone Recordings to Tracks
Transform your mic recordings into DJ track material!

**Features**:
- "Load to Track 1" button
- "Load to Track 2" button
- Enables layering and remixing
- Full integration with loop markers, effects, and tempo control

**Workflow**:
1. Record vocals/sounds with microphone
2. Load to Track 1 or Track 2
3. Apply loops, effects, tempo changes
4. Mix with other tracks
5. Record final mix

---

### 4. Master Output Routing Controls
Precise control over what goes to master output!

**Controls**:
- ✓/✗ Route Track 1 to Master
- ✓/✗ Route Track 2 to Master
- ✓/✗ Route Keyboard Sampler to Master

**Use Cases**:
- Solo individual tracks
- Mute tracks without stopping playback
- Complex routing for advanced mixing

---

### 5. Compact Layout - Side-by-Side Controls
More screen space for your mixing workflow!

**Improvement**:
- Tempo and Volume sliders now placed horizontally (side-by-side)
- Saves ~200px vertical space per track
- Maintains vertical slider orientation for intuitive DJ control
- Cleaner, more professional look

---

## 🐛 Critical Bug Fixes

### Audio Routing Fixes

**Issue #1: Track Source Node Errors**
- **Problem**: Vocoder/autotune failed when using tracks (node already connected)
- **Root Cause**: Using `source1`/`source2` (MediaElementSource) instead of `gain1`/`gain2` (GainNode)
- **Fix**: Changed all track references to use GainNodes (proper tap points)
- **Impact**: All track-based effects now work correctly

**Issue #2: Microphone Source Node Errors**
- **Problem**: Mic-to-mic vocoder and autotune failed
- **Root Cause**: Using `micSource` (raw MediaStreamSource) instead of `micGain` (GainNode)
- **Fix**: Use `micGain` for all mic effect routing
- **Impact**: Mic effects work reliably with proper volume control

### Initialization Fixes

**Issue #3: Audio Output Not Initialized**
- **Problem**: "Audio output not initialized" error when enabling effects after mic
- **Root Cause**: `merger` node not created when mic enabled first
- **Fix**: Call `initAudioContext()` for complete initialization
- **Impact**: Effects work regardless of initialization order

**Issue #4: AudioContext Suspended**
- **Problem**: Vocoder enabled but produced no sound
- **Root Cause**: Modern browsers start AudioContext in suspended state
- **Fix**: Call `audioContext.resume()` after enabling effects
- **Impact**: Effects produce audible output immediately

### Runtime Fixes

**Issue #5: autotuneAnalyser Undefined**
- **Problem**: ReferenceError when enabling auto-tune
- **Root Cause**: Accessing `autotuneAnalyser` as global instead of `autotuneState.autotuneAnalyser`
- **Fix**: Use proper state object reference
- **Impact**: Auto-tune pitch detection works correctly

### UI/Logic Fixes

**Issue #6: Effect Section Visibility**
- **Problem**: Vocoder/autotune sections hidden when mic disabled (even with tracks loaded)
- **Root Cause**: Hard-coded visibility tied only to microphone state
- **Fix**: Created `updateVocoderAutotuneVisibility()` function (checks all sources)
- **Impact**: Sections visible whenever ANY source is available

**Issue #7: Source Selector Accessibility**
- **Problem**: Couldn't change vocoder/autotune sources before enabling
- **Root Cause**: Selectors hidden inside effect settings
- **Fix**: Moved source selectors outside hidden sections
- **Impact**: Users can configure before clicking enable

**Issue #8: ArrayBuffer/Blob Type Mismatch**
- **Problem**: Mic WAV export failed
- **Root Cause**: `audioBufferToWav()` returns ArrayBuffer but code expected Blob
- **Fix**: Wrapped ArrayBuffer in Blob constructor
- **Impact**: Mic recording WAV export works correctly

**Issue #9: Mix Carrier Not Implemented**
- **Problem**: Vocoder failed when carrier set to "Both Tracks (Mix)"
- **Root Cause**: `getVocoderCarrierSource()` didn't handle 'mix' case
- **Fix**: Added mixer GainNode creation for mix case
- **Impact**: Can use both tracks as vocoder carrier

---

## 📚 Documentation

### New Documentation Files
- `MICROPHONE_STANDALONE_RECORDING.md` - Standalone recording feature details
- `LAYOUT_AND_LOAD_TO_TRACK.md` - Layout improvements and load to track feature
- `VOCODER_AUTOTUNE_ROUTING_FEATURES.md` - Flexible routing architecture
- `BUG_FIXES_SUMMARY.md` - Initial bug fixes and validation improvements
- `VOCODER_MIC_FEEDBACK_FIX.md` - Mic-to-mic vocoder feedback routing
- `CRITICAL_VOCODER_AUTOTUNE_FIXES.md` - Track source node fixes
- `MIC_AUDIO_ROUTING_FIX.md` - Microphone audio node routing fixes
- `AUDIO_CONTEXT_INIT_FIX.md` - Audio context initialization fixes
- `VOCODER_AUTOTUNE_RUNTIME_FIXES.md` - Runtime error fixes

---

## 🔧 Technical Details

### Architecture Improvements

**Audio Routing Best Practices**:
- ✅ Always use GainNodes for effect routing (not source nodes)
- ✅ GainNodes can connect to multiple destinations
- ✅ GainNodes include volume control
- ✅ Source nodes should only connect once in main chain

**Proper Node Types**:
- `gain1`, `gain2`, `micGain` → Use for effects ✅
- `source1`, `source2`, `micSource` → Main chain only ❌

**Initialization Pattern**:
- Always call `initAudioContext()` (not `new AudioContext()`)
- Ensures all nodes created: audioContext, merger, analyser, etc.
- Resume AudioContext when enabling user-triggered effects

**State Management**:
- Effects return state objects with all necessary nodes
- Access via `state.property` not global variables
- Proper null checking before accessing state

---

## 🎯 Key Learnings

### For Developers

1. **Audio Node Hierarchy**: Understand source nodes vs. processing nodes
2. **Connection Limits**: MediaElementSource can only connect once
3. **GainNode Flexibility**: Use for all tap points and routing
4. **State Encapsulation**: Don't assume global variables for module data
5. **AudioContext Lifecycle**: Modern browsers require resume() for user-triggered audio

### For Users

1. **Flexible Routing**: Mix and match any audio sources with any effects
2. **Standalone Recording**: Mic works independently of tracks
3. **Professional Workflow**: Record → Load → Mix → Process → Record final
4. **Creative Effects**: Mic-to-mic vocoder, track auto-tune, complex routing

---

## 🚀 Upgrade Path

### From v3.8.0

**New Features Available**:
- Standalone mic recording
- Load mic recordings to tracks
- Flexible vocoder/autotune routing
- Master output routing controls
- Compact side-by-side controls

**Breaking Changes**: None - Fully backward compatible

**Recommended Actions**:
1. Try standalone mic recording
2. Experiment with vocoder on tracks
3. Use auto-tune for pitch correction
4. Explore routing combinations

---

## 🎉 What's Next?

### Potential Future Features
- MIDI controller support
- More effect types (chorus, flanger, phaser)
- Preset save/load system
- Cloud storage for recordings
- Collaborative mixing sessions

---

## 📊 Statistics

- **Files Modified**: 7 core files
- **Bug Fixes**: 9 critical issues resolved
- **New Functions**: 15+ new functions added
- **Documentation**: 9 comprehensive docs created
- **Lines of Code**: ~500 lines added/modified

---

## 🙏 Acknowledgments

Special thanks to the testing and feedback that helped identify and resolve these critical audio routing issues. The flexible routing system and comprehensive bug fixes make Browser Jockey significantly more robust and versatile!

---

## 📝 Full Changelog

See individual documentation files for detailed technical implementation notes:
- [MICROPHONE_STANDALONE_RECORDING.md](MICROPHONE_STANDALONE_RECORDING.md)
- [LAYOUT_AND_LOAD_TO_TRACK.md](LAYOUT_AND_LOAD_TO_TRACK.md)
- [VOCODER_AUTOTUNE_ROUTING_FEATURES.md](VOCODER_AUTOTUNE_ROUTING_FEATURES.md)
- [CRITICAL_VOCODER_AUTOTUNE_FIXES.md](CRITICAL_VOCODER_AUTOTUNE_FIXES.md)
- [MIC_AUDIO_ROUTING_FIX.md](MIC_AUDIO_ROUTING_FIX.md)
- [AUDIO_CONTEXT_INIT_FIX.md](AUDIO_CONTEXT_INIT_FIX.md)
- [VOCODER_AUTOTUNE_RUNTIME_FIXES.md](VOCODER_AUTOTUNE_RUNTIME_FIXES.md)
