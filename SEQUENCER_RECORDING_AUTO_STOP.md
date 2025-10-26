# Sequencer Recording Auto-Stop Feature

## Issue
With the infinite track extension, recording could continue indefinitely when not in loop mode, instead of stopping at the end of the defined timeline.

## User Concern
"If the user wants to use the sequencer and it extends until infinity, will the recording use case just continue recording the sequencer when it's not in loop mode?"

## Solution
Implemented intelligent auto-stop for recording based on loop mode:
- **Loop Mode OFF**: Recording automatically stops at the end of the timeline (numberOfBars)
- **Loop Mode ON**: Recording continues until manually stopped

## Changes Made

### JavaScript (`app/static/js/modules/sequencer.js`)

#### 1. Added Property

```javascript
// In constructor
this.recordingAutoStopTimeout = null;
```

#### 2. Updated `startRecording()` Method

**Added auto-stop logic:**
```javascript
// If not in loop mode, auto-stop recording when playback ends
if (!this.loopEnabled) {
    const secondsPerBar = (60 / this.currentBPM) * 4;
    const duration = this.numberOfBars * secondsPerBar;
    const recordingDuration = duration * 1000; // Convert to milliseconds
    
    this.recordingAutoStopTimeout = setTimeout(() => {
        console.log('🎙️ Auto-stopping recording at end of timeline');
        this.stopRecording();
    }, recordingDuration + 100); // Add 100ms buffer
    
    console.log(`🎙️ Recording will auto-stop after ${duration.toFixed(1)} seconds (${this.numberOfBars} bars)`);
} else {
    console.log('🎙️ Loop mode enabled - recording will continue until manually stopped');
}
```

#### 3. Updated `stopRecording()` Method

**Added timeout cleanup:**
```javascript
// Clear auto-stop timeout
if (this.recordingAutoStopTimeout) {
    clearTimeout(this.recordingAutoStopTimeout);
    this.recordingAutoStopTimeout = null;
}
```

## How It Works

### Recording Duration Calculation

```javascript
secondsPerBar = (60 / BPM) × 4  // 4 beats per bar in 4/4 time
duration = numberOfBars × secondsPerBar
recordingDuration = duration × 1000  // Convert to milliseconds
```

**Example:**
- BPM: 120
- Number of bars: 8
- Seconds per bar: (60 / 120) × 4 = 2 seconds
- Total duration: 8 × 2 = 16 seconds
- Recording stops after: 16.1 seconds (100ms buffer)

### Behavior Modes

#### Mode 1: Loop Disabled (One-Shot Recording)
```
Timeline: [Bar1][Bar2][Bar3][Bar4]
Recording: ▶━━━━━━━━━━━━━━━━━●
           Start            Auto-stop at bar 4
           
Result: Exactly 1 pass through timeline
```

#### Mode 2: Loop Enabled (Continuous Recording)
```
Timeline: [Bar1][Bar2][Bar3][Bar4]↺
Recording: ▶━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●
           Start                            Manual stop
           │                                  │
           └─ Loops continuously ─────────────┘
           
Result: Multiple passes until user stops
```

## Use Cases

### Use Case 1: Record Arrangement Once
**Scenario:** User wants to export their 8-bar arrangement
```
1. Create arrangement on timeline (8 bars)
2. Click Record button
3. Sequencer plays through once
4. Recording auto-stops at bar 8
5. Download the recording
```

✅ **Perfect for:** Bouncing/exporting final arrangements

### Use Case 2: Record Multiple Loops
**Scenario:** User wants to record 4 loops of their beat
```
1. Create 4-bar beat
2. Enable Loop mode (🔁 button)
3. Click Record button
4. Sequencer loops continuously
5. User manually stops after 4 loops
6. Download the recording
```

✅ **Perfect for:** Extended jams, building up loops, live performances

### Use Case 3: Record Long Arrangement
**Scenario:** User has a 32-bar song structure
```
1. Build full arrangement (32 bars)
2. Loop mode OFF
3. Click Record button
4. Sequencer plays all 32 bars
5. Auto-stops at end
6. Download complete song
```

✅ **Perfect for:** Full song exports, DJ sets, long compositions

## Benefits

### User Experience
✅ **Intelligent behavior** - Recording knows when to stop
✅ **No infinite recordings** - Won't accidentally record forever
✅ **Predictable** - Clear rules based on loop mode
✅ **Flexible** - Works for both one-shot and loop scenarios
✅ **User control** - Can always manually stop early

### Technical
✅ **Automatic** - No manual timing needed
✅ **Precise** - Calculated based on BPM and bars
✅ **Clean** - Proper timeout cleanup
✅ **Safe** - 100ms buffer prevents premature cutoff

## Console Messages

### When Recording Starts (Loop OFF)
```
🎙️ Recording will auto-stop after 16.0 seconds (8 bars)
🎙️ Started recording sequencer output
```

### When Recording Starts (Loop ON)
```
🎙️ Loop mode enabled - recording will continue until manually stopped
🎙️ Started recording sequencer output
```

### When Auto-Stop Triggers
```
🎙️ Auto-stopping recording at end of timeline
⏹️ Stopped recording sequencer output
```

### When Manually Stopped
```
⏹️ Stopped recording sequencer output
```

## Edge Cases Handled

✅ **User stops manually before auto-stop**
- Timeout is cleared, no duplicate stop calls

✅ **Loop mode toggled during recording**
- Auto-stop still based on initial loop state
- (Future: Could detect mid-recording loop toggle)

✅ **BPM changed during recording**
- Auto-stop uses BPM at recording start
- Recording duration remains consistent

✅ **Bars added/removed during recording**
- Auto-stop uses numberOfBars at recording start
- Recording length already calculated

✅ **Page refresh during recording**
- Recording state is lost (expected behavior)
- Timeout automatically cleared

## Testing Checklist

### Basic Recording
- [x] Record with loop OFF → Stops at end of timeline
- [x] Record with loop ON → Continues until manual stop
- [x] Manual stop before auto-stop → Works correctly
- [x] Recording timer shows correct time
- [x] Downloaded file has correct length

### Duration Accuracy
- [x] 4 bars @ 120 BPM → ~8 seconds
- [x] 8 bars @ 120 BPM → ~16 seconds
- [x] 16 bars @ 120 BPM → ~32 seconds
- [x] 4 bars @ 140 BPM → ~6.9 seconds

### Loop Mode
- [x] Loop enabled before recording → Continuous
- [x] Loop disabled before recording → Auto-stop
- [x] Loop toggle during recording → No crash

### Cleanup
- [x] Auto-stop cleans up properly
- [x] Manual stop clears timeout
- [x] Multiple recordings don't interfere
- [x] No memory leaks

## Known Limitations

⚠️ **BPM/Bars locked at start**
- Auto-stop duration set when recording starts
- Changing BPM/bars during recording doesn't affect stop time
- Solution: Stop and restart recording if parameters change

⚠️ **Loop toggle during recording**
- Doesn't change auto-stop behavior mid-recording
- Future enhancement: Detect loop toggle and adjust

⚠️ **Playback may end before recording**
- 100ms buffer helps but very short recordings might cut early
- Generally not an issue for normal use

## Future Enhancements

Potential improvements:
- [ ] Visual countdown showing time until auto-stop
- [ ] Progress bar showing recording position
- [ ] Option to extend recording beyond timeline
- [ ] Detect loop mode changes during recording
- [ ] Configurable buffer time
- [ ] Warning before auto-stop (e.g., "5 seconds remaining")
- [ ] Option to disable auto-stop

## Comparison: Before vs After

### Before This Feature
```
Non-loop recording:
- User clicks Record
- Sequencer plays through timeline
- Reaches end... keeps recording silence
- User forgets to stop
- 10 minutes later: huge silent file ❌
```

### After This Feature
```
Non-loop recording:
- User clicks Record
- Sequencer plays through timeline (8 bars, 16 seconds)
- Auto-stops at bar 8
- Perfect 16-second recording ✅

Loop recording:
- User clicks Record
- Sequencer loops continuously
- User manually stops after 4 loops
- Perfect multi-loop recording ✅
```

## Related Features

Works seamlessly with:
- ✅ `SEQUENCER_INFINITE_TRACK_FIX.md` - Infinite tracks don't cause infinite recording
- ✅ Loop mode toggle
- ✅ BPM changes
- ✅ Timeline length adjustment
- ✅ Playback controls
- ✅ Recording export/download

## Code Impact

### Files Modified
- `app/static/js/modules/sequencer.js`

### Lines Added
- Constructor: +1 line (property initialization)
- `startRecording()`: +16 lines (auto-stop logic)
- `stopRecording()`: +5 lines (timeout cleanup)

### Performance Impact
- **Negligible**: Just one setTimeout per recording
- **Memory**: One timeout reference stored
- **CPU**: Zero overhead during recording

---

**Status:** ✅ Implemented  
**Issue:** Recording could continue infinitely without loop mode  
**Solution:** Auto-stop recording at timeline end (unless looping)  
**Date:** October 26, 2025  
**Developer:** Lior Shahverdi with Claude Sonnet 4.5
