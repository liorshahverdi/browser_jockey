# Sequencer Loop Clips Feature

## Enhancement: Automatic Loop Clip Creation

### What Changed

The sequencer now automatically creates clips when you set loop markers (A-B points) on tracks in the DJ Mixer tab.

### How It Works

1. **Load a track** in the DJ Mixer (Track 1 or Track 2)
2. **Enable loop mode** by clicking the 🔁 button
3. **Set loop points** by clicking on the waveform:
   - First click sets the **A (start)** point
   - Second click sets the **B (end)** point
4. **A loop clip is automatically created** and appears in the Sequencer's Available Clips panel

### What You Get

#### Full Track Clips
When you load a track, a full-length clip is created:
- **Name**: "Track 1: filename.mp3" or "Track 2: filename.mp3"
- **Duration**: Full track duration

#### Loop Region Clips
When you set loop points, an additional loop clip is created:
- **Name**: "Track 1 Loop: filename.mp3 (0:30.500 - 1:45.250)"
- **Duration**: Only the looped section
- **Timing**: Shows exact start and end times

### Benefits

1. **Quick Loop Access**: Loop regions become reusable clips
2. **Multiple Loops**: Create different loop clips from the same track
3. **Precision**: Loop clips preserve exact timing from the DJ mixer
4. **Organization**: Each loop is labeled with its time range

### Example Workflow

```
DJ Mixer Tab:
1. Load "drums.wav" to Track 1
   → Creates: "Track 1: drums.wav" (full track)

2. Set loop from 0:08.000 to 0:16.000
   → Creates: "Track 1 Loop: drums.wav (0:08.000 - 0:16.000)"

3. Clear loop, set new loop from 0:32.000 to 0:48.000
   → Creates: "Track 1 Loop: drums.wav (0:32.000 - 0:48.000)"

Sequencer Tab:
Available Clips:
- Track 1: drums.wav (full track)
- Track 1 Loop: drums.wav (0:08.000 - 0:16.000)
- Track 1 Loop: drums.wav (0:32.000 - 0:48.000)
```

### Technical Details

#### Clip Storage
Loop clips store additional metadata:
```javascript
{
    id: "track1-loop-1234567890",
    name: "Track 1 Loop: song.mp3 (0:15.500 - 0:30.750)",
    audioBuffer: <full audio buffer>,
    duration: 15.25,        // Loop duration
    startTime: 15.5,        // Loop start in full track
    endTime: 30.75,         // Loop end in full track
    fullBuffer: <reference to full buffer>
}
```

#### Playback
When a loop clip plays in the sequencer:
- Uses `AudioBufferSourceNode.start(when, offset, duration)`
- `offset`: The loop start time in the full track
- `duration`: The loop region length
- Only the selected portion plays

### Code Changes

**Files Modified:**
1. `app/static/js/modules/sequencer.js`
   - Updated `addClip()` to support startTime/endTime
   - Added `addLoopClip()` method
   - Updated `play()` to handle offset and duration

2. `app/static/js/visualizer-dual.js`
   - Added loop clip creation when both A and B points are set
   - Integrated for both Track 1 and Track 2

### Usage Tips

1. **Create Multiple Loops**: Set different loop regions on the same track to create multiple clips
2. **Experiment**: Try different loop points to find the perfect section
3. **Mix Full and Loops**: Use both full tracks and loop clips in your arrangement
4. **Clear Loops**: Click the ❌ button to clear loop points before setting new ones

### Known Behavior

- Each time you complete a loop (set both A and B points), a new clip is created
- If you set the exact same loop again, you'll get duplicate clips (this is intentional for flexibility)
- Loop clips are independent - changing the loop in DJ mixer doesn't affect existing clips

### Future Enhancements

Potential improvements:
- [ ] Option to update existing loop clip instead of creating new one
- [ ] Visual indication in clips panel showing which clips are loops vs full tracks
- [ ] Ability to edit loop boundaries in the sequencer
- [ ] Delete individual clips from the available clips panel

---

**Version**: 3.15.1
**Enhancement Date**: October 26, 2025
**Made by**: Lior Shahverdi and Claude Sonnet 4.5 in VS Code
