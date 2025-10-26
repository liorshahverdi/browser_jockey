# Tab Audio Capture - Quick Reference Card

## 🚀 Quick Start (30 seconds)

1. Click **"🎵 Capture Tab Audio"** button
2. Select a tab playing audio
3. ✅ Check **"Share audio"**
4. Click **Share**
5. **Done!** Audio is now streaming to your track

---

## ✅ Checklist

**Before clicking Share:**
- [ ] Selected the correct **tab** (not window/screen)
- [ ] Tab is **playing audio**
- [ ] **"Share audio" checkbox is CHECKED** ← Most important!
- [ ] Ready to click "Share"

---

## 🎛️ What Works

| Feature | Works? |
|---------|--------|
| Volume control | ✅ Yes |
| Pan control | ✅ Yes |
| Filter effects | ✅ Yes |
| Reverb effects | ✅ Yes |
| Delay effects | ✅ Yes |
| Crossfader mixing | ✅ Yes |
| Master effects | ✅ Yes |
| Visualization | ✅ Yes |
| Play/Pause | ❌ No (live stream) |
| Looping | ❌ No (live stream) |
| Waveform | ❌ No (live stream) |
| Export | ❌ No (use recording) |

---

## 🔧 Controls When Active

```
Play:    [▶️] ❌ Disabled (live stream)
Pause:   [⏸️] ❌ Disabled (live stream)
Stop:    [⏹️] ✅ Enabled (stops capture)
Loop:    [🔁] ❌ Disabled (N/A for live)
Volume:  [🔊] ✅ Enabled (works!)
Effects: [🎚️] ✅ Enabled (works!)
```

---

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Edge | ✅ Full |
| Opera | ✅ Full |
| Brave | ✅ Full |
| Firefox | ⚠️ Limited |
| Safari | ❌ None |
| Mobile | ❌ None |

---

## ⚠️ Most Common Mistakes

### #1: Forgot to check "Share audio"
**Fix:** Click capture button again, CHECK the box!

### #2: Selected window instead of tab
**Fix:** Select "Chrome Tab" in the dialog

### #3: Tab has no audio playing
**Fix:** Start playing audio in the source tab first

---

## 🎯 Best Use Cases

✅ **Great for:**
- DJ mixing with YouTube/Spotify
- Adding effects to podcasts
- Mixing web synths with tracks
- Live streaming with effects
- Creative sound design

❌ **Not ideal for:**
- Recording (use recording feature instead)
- Looping specific sections
- Offline playback
- Low-latency needs (50-200ms typical)

---

## 🔊 Audio Path

```
Browser Tab
    ↓
Capture
    ↓
Track Effects
    ↓
Crossfader
    ↓
Master Output
```

---

## 🛑 How to Stop

1. Click **Stop button** [⏹️]
2. Or close the source tab
3. Or end sharing from browser menu

**Result:** Capture ends, controls reset

---

## 💡 Pro Tips

**Tip 1:** Set source tab volume to 70-80%  
**Tip 2:** Use track volume for fine control  
**Tip 3:** Apply effects gradually  
**Tip 4:** Mix smoothly with crossfader  
**Tip 5:** Close other tabs for best performance

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| No audio | Check "Share audio" box |
| Choppy | Close heavy tabs |
| Can't find button | Look next to "Choose Audio" |
| Wrong browser | Use Chrome/Edge |
| Stopped working | Source tab closed? |

---

## 📞 Error Messages Decoded

**"No audio was captured"**  
→ You forgot to check "Share audio"

**"Not supported in your browser"**  
→ Use Chrome or Edge

**"Permission denied"**  
→ Click "Allow" in the permission dialog

**"Tab capture ended"**  
→ Source tab was closed or stopped

---

## 🎓 Learning Path

**Beginner:**
1. Capture YouTube to Track 1
2. Apply volume and pan
3. Practice with Stop button

**Intermediate:**
4. Load file to Track 2
5. Mix with crossfader
6. Add filter and reverb

**Advanced:**
7. Capture two tabs (one per track)
8. Complex effect chains
9. Mix with microphone

---

## 📊 Technical Specs

**API:** `getDisplayMedia()`  
**Source:** `MediaStreamSource`  
**Latency:** 50-200ms typical  
**Quality:** Same as source tab  
**Channels:** Stereo (2)  
**Processing:** Real-time

---

## ✨ Success Indicators

**You're doing it right if:**
- ✅ Filename shows "🎵 Tab Audio (Live)"
- ✅ Visualization moves with audio
- ✅ Volume slider affects output
- ✅ Effects work in real-time
- ✅ Can mix with other tracks
- ✅ Stop button ends cleanly

---

## 🎵 Example Workflow

```
1. Open YouTube in new tab
2. Play a song
3. Return to Browser Jockey
4. Click "🎵 Capture Tab Audio"
5. Select YouTube tab
6. ✅ Check "Share audio"
7. Click Share
8. Adjust volume to 60%
9. Add reverb (30%)
10. Mix with Track 2 using crossfader
```

**Time:** ~30 seconds  
**Result:** Professional DJ mix! 🎧

---

## 📝 Remember

- ✅ **Always check "Share audio"**
- ✅ Select a **tab**, not window
- ✅ Use **Chrome or Edge**
- ✅ Source tab must be **playing audio**
- ✅ Click **Stop** when done

---

**Happy mixing! 🎵🎧🎉**

---

*For full documentation, see:*
- TAB_AUDIO_CAPTURE_FEATURE.md (technical details)
- TAB_CAPTURE_TESTING_GUIDE.md (testing steps)
- TAB_CAPTURE_VISUAL_GUIDE.md (visual walkthrough)
