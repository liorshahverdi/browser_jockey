# Release Notes - Tab Audio Capture Feature

**Version:** 3.13  
**Date:** October 26, 2025  
**Feature:** Browser Tab Audio Capture

## 🎵 New Feature: Capture Audio from Browser Tabs

You can now capture audio from any browser tab and route it to Track 1 or Track 2 in real-time!

### What's New

✨ **"Capture Tab Audio" Button** on both Track 1 and Track 2
- Click to select a browser tab playing audio
- Audio streams in real-time through your track effects
- Apply reverb, delay, filter, and all other effects to live audio

### How to Use

1. **Click** the "🎵 Capture Tab Audio" button on Track 1 or Track 2
2. **Select** a browser tab that's playing audio (YouTube, Spotify, etc.)
3. **Check** the "Share audio" checkbox in the browser dialog
4. **Click** Share
5. The audio now streams to your track - apply effects and mix!

### Use Cases

🎧 **DJ Sets with Streaming Music**
- Mix YouTube videos with local files
- Apply effects to Spotify Web Player tracks
- Create mashups with SoundCloud tracks

🎙️ **Podcast Production**
- Add effects to live podcasts
- Layer commentary over streams
- Mix multiple audio sources

🎹 **Live Performance**
- Route web synthesizers through effects
- Layer browser-based instruments
- Mix web apps with traditional tracks

### Browser Requirements

✅ **Supported:**
- Google Chrome (desktop)
- Microsoft Edge (desktop)
- Opera, Brave, and other Chromium browsers

❌ **Not Supported:**
- Firefox (limited audio capture)
- Safari (no tab audio)
- Mobile browsers

### Important Notes

⚠️ **Remember to check "Share audio"** in the browser dialog!

📌 **Limitations when using tab capture:**
- No waveform display (live stream)
- No looping (A-B points)
- No BPM/key detection
- Cannot export directly (use master recording instead)
- Play/Pause buttons disabled (live stream is always playing)

🎚️ **Full effects support:**
- ✅ Volume, Pan, Filter
- ✅ Reverb, Delay
- ✅ Crossfader mixing
- ✅ Master effects
- ✅ Real-time visualization

### Files Changed

**HTML:**
- `app/templates/index.html` - Added capture buttons for both tracks

**JavaScript:**
- `app/static/js/visualizer-dual.js` - Added tab capture functionality
  - New function: `captureTabAudio(trackNumber)`
  - New state variables for tab capture streams
  - Enhanced stop button to clean up captures
  - Event listeners for capture buttons

**Documentation:**
- `TAB_AUDIO_CAPTURE_FEATURE.md` - Complete feature documentation

### Testing Performed

- ✅ Capture from YouTube
- ✅ Capture from Spotify Web Player
- ✅ Capture from SoundCloud
- ✅ Apply all effects to captured audio
- ✅ Mix with file-based tracks
- ✅ Crossfader functionality
- ✅ Stop/cleanup functionality
- ✅ Error handling and user feedback
- ✅ Browser compatibility detection

### Known Limitations

1. **Audio latency** - Some delay (50-200ms) is normal for browser tab capture
2. **No offline export** - Can only record the master output, not the tab source directly
3. **Stream stability** - Depends on source tab (closing or navigating away stops the capture)

### Tips for Best Results

💡 **For lowest latency:**
- Use a wired internet connection
- Close unnecessary browser tabs
- Use Chrome or Edge for best performance

💡 **For best audio quality:**
- Ensure source tab volume is adequate
- Adjust track volume rather than source volume
- Use filters and effects tastefully

💡 **Troubleshooting:**
- If no audio captured → Make sure to check "Share audio" checkbox
- If capture stops → Check that source tab is still open and playing
- If browser not supported → Switch to Chrome or Edge

### What's Next?

Future enhancements being considered:
- Record captured tab audio
- Auto-reconnect if stream drops
- Buffer and loop support for captured audio
- Real-time BPM detection on live streams
- Visual audio level meter for captured streams

---

**Enjoy mixing with live browser audio! 🎵🎧**
