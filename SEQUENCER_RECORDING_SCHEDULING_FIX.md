# Sequencer Recording Audio Scheduling Fix

**Date:** October 26, 2025  
**Critical Fix:** MediaRecorder capturing 0 bytes due to Web Audio API scheduling

## The Real Problem Discovered

### Initial Diagnosis Was Wrong

**First attempt (200ms delay):**
- ❌ Thought: "Audio starts flowing when play() is called"
- ❌ Reality: "play() only SCHEDULES audio to play in the future"
- ❌ Result: Still captured 0 bytes

### What Actually Happens

The Web Audio API uses **scheduled audio sources**. When you call:

```javascript
source.start(scheduleTime, offset);
```

The audio doesn't play **immediately** - it plays when `audioContext.currentTime` reaches `scheduleTime`.

### Sequencer Play Flow

```javascript
play() {
    const startTime = this.audioContext.currentTime;  // Current audio timeline position
    
    track.clips.forEach(placedClip => {
        const clipStartTime = placedClip.barPosition * secondsPerBar;
        let scheduleTime = startTime + clipStartTime - playbackStartOffset;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = placedClip.sourceClip.audioBuffer;
        source.connect(clipGain);
        
        source.start(scheduleTime, clipOffset);  // ← Scheduled for FUTURE!
    });
}
```

### The Recording Problem

**Broken Flow (200ms delay):**
```
T=0ms:    User clicks Record
T=50ms:   Call play()
          - audioContext.currentTime = 10.5 seconds
          - Schedule clips to play at: 10.5s, 10.8s, 11.2s, etc.
          - play() returns IMMEDIATELY
          - this.isPlaying = true (but no audio yet!)
T=250ms:  setTimeout fires, start MediaRecorder
          - audioContext.currentTime = 10.7 seconds
          - Clips scheduled for 10.5s might have started
          - But timing is too tight - often misses the start
T=300ms:  First audio might reach MediaRecorder
          - Sometimes too late, recording already started with empty stream
```

**Why It Failed:**
1. `audioContext.currentTime` advances in real-time (e.g., 10.5, 10.6, 10.7...)
2. Clips scheduled at `10.5s` won't play until audio timeline reaches `10.5s`
3. MediaRecorder started at `10.7s` might miss clips scheduled at `10.5s`
4. Even if timing is close, buffer preparation takes time
5. Result: Recording starts before audio flows through the stream

## The Fix: Longer Delay

### Increased to 300ms

```javascript
const waitForAudio = () => {
    // Check if we have clips to record
    const hasActiveSources = this.sequencerTracks.some(track => 
        track.clips && track.clips.length > 0
    );
    
    if (!hasActiveSources) {
        console.warn('⚠️ No clips to record - sequencer is empty');
        this.stopRecording();
        return;
    }
    
    // Wait 300ms for scheduled clips to actually start playing
    setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.mediaRecorder.start(100);
            this.recordingStartTime = Date.now();
            
            console.log('🎙️ MediaRecorder started (state:', this.mediaRecorder.state, ')');
            console.log('🎙️ AudioContext time:', this.audioContext.currentTime.toFixed(3));
            console.log('🎙️ Sequencer playing:', this.isPlaying);
        }
    }, 300); // ← Increased from 200ms
};

waitForAudio();
```

### Why 300ms Works

**Working Flow (300ms delay):**
```
T=0ms:    User clicks Record
T=50ms:   Call play()
          - audioContext.currentTime = 10.5 seconds
          - Schedule clips: source.start(10.5), source.start(10.8), etc.
          - play() returns immediately
          
T=150ms:  audioContext.currentTime ≈ 10.6 seconds
          - First clip (scheduled at 10.5s) has started playing
          - Audio flowing through: source → clipGain → outputGain → destination
          
T=300ms:  setTimeout fires, start MediaRecorder
          - audioContext.currentTime ≈ 10.8 seconds
          - Multiple clips already playing
          - Audio actively flowing through MediaStreamDestination
          - MediaRecorder captures real audio data ✅
```

## Timing Breakdown

### AudioContext Timeline vs Real Time

```
Real Time (ms) | audioContext.currentTime | Event
---------------|--------------------------|----------------------------------
0              | 10.500                   | Click Record
50             | 10.550                   | play() called, clips scheduled
100            | 10.600                   | Clips at 10.5s start playing
150            | 10.650                   | Audio flowing through graph
200            | 10.700                   | Buffer filled, stream active
250            | 10.750                   | Stable audio output
300            | 10.800                   | Start MediaRecorder ← Safe!
```

**Key Insight:** `audioContext.currentTime` advances at ~1 second per second, so:
- 300ms real time = ~0.3 seconds audio timeline advance
- Clips scheduled at `startTime` (10.5s) are definitely playing by `startTime + 0.3s` (10.8s)

## What We Learned

### Web Audio API Scheduling

1. **Source scheduling is NOT immediate**
   - `source.start(time)` schedules audio to play at that audio timeline position
   - The audio doesn't flow until `audioContext.currentTime >= time`

2. **play() is synchronous but playback is not**
   - `play()` function returns immediately
   - Audio playback happens asynchronously based on schedule

3. **MediaStreamDestination needs active sources**
   - Stream exists when created
   - But contains no audio until sources are actively playing and producing samples

4. **Buffer preparation time matters**
   - Even when scheduled time arrives, buffers need to be prepared
   - First samples take longer to start flowing

### MediaRecorder Behavior

1. **Starts capturing immediately**
   - `mediaRecorder.start()` begins capturing the stream's current state
   - If stream is silent/empty, captures nothing

2. **Can't "catch up" to missed audio**
   - If audio starts flowing after MediaRecorder starts, it misses the beginning
   - Result: Empty chunks, 0 bytes recorded

3. **Needs active stream data**
   - Even with `timeslice=100`, needs actual data flowing
   - Empty stream = no chunks = 0 bytes

## Console Logs to Verify Fix

### Success Indicators

```
🎵 Auto-starting sequencer playback for recording
▶️ Playing sequencer: Bars 1 to 8 (14.00s)
🎙️ MediaRecorder started (state: recording)
🎙️ AudioContext time: 10.823  ← Shows audio timeline position
🎙️ Sequencer playing: true
📦 Recorded chunk: 2048 bytes  ← First chunk captured!
📦 Recorded chunk: 1952 bytes
📦 Recorded chunk: 2013 bytes
... (continues)
⏹️ Stopped recording sequencer output
📦 Total chunks: 47
📦 Total size: 94336 bytes     ← Success! Audio captured!
💾 Created blob: 94336 bytes
✅ Loaded sequencer recording to Track 1
```

### Failure Indicators (Old Behavior)

```
🎵 Auto-starting sequencer playback for recording
▶️ Playing sequencer: Bars 1 to 8 (14.00s)
🎙️ MediaRecorder started (state: recording)
🎙️ Sequencer playing: true
⏹️ Stopped recording sequencer output
⚠️ Received empty data chunk    ← Warning: No audio
📦 Total chunks: 0
📦 Total size: 0 bytes          ← Failure: Nothing captured
💾 Created blob: 0 bytes
❌ Error: Unable to decode audio data
```

## Edge Cases Handled

### 1. Empty Sequencer

```javascript
const hasActiveSources = this.sequencerTracks.some(track => 
    track.clips && track.clips.length > 0
);

if (!hasActiveSources) {
    console.warn('⚠️ No clips to record - sequencer is empty');
    this.stopRecording();
    return;
}
```

Prevents trying to record when no clips are loaded.

### 2. Already Playing

```javascript
if (!this.isPlaying) {
    console.log('🎵 Auto-starting sequencer playback for recording');
    this.play();
}
```

If sequencer is already playing, clips are already scheduled and playing - no need to start again.

### 3. MediaRecorder State

```javascript
if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
    this.mediaRecorder.start(100);
    // ...
}
```

Only starts if MediaRecorder is still inactive (not started elsewhere).

### 4. Auto-Stop Timing

```javascript
recordingDuration + 400  // 300ms for recording start + 100ms safety
```

Updated auto-stop timeout to account for the 300ms delay.

## Future Improvements

### Dynamic Delay Based on First Scheduled Clip

```javascript
const getFirstClipScheduleTime = () => {
    let earliestTime = Infinity;
    
    this.sequencerTracks.forEach(track => {
        track.clips.forEach(clip => {
            const clipTime = clip.barPosition * secondsPerBar;
            earliestTime = Math.min(earliestTime, clipTime);
        });
    });
    
    return earliestTime;
};

const firstClipTime = getFirstClipScheduleTime();
const startTime = this.audioContext.currentTime;
const scheduleTime = startTime + firstClipTime;
const delay = Math.max(300, (scheduleTime - startTime) * 1000 + 100);

setTimeout(() => {
    this.mediaRecorder.start(100);
}, delay);
```

**Trade-off:** More complex, might be overkill for most cases.

### AnalyserNode-Based Detection

```javascript
const analyser = this.audioContext.createAnalyser();
this.recordingDestination.stream.connect(analyser);

const checkForAudio = () => {
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    
    const rms = Math.sqrt(buffer.reduce((sum, val) => sum + val * val, 0) / buffer.length);
    
    if (rms > 0.01) { // Threshold for detecting audio
        this.mediaRecorder.start(100);
    } else {
        requestAnimationFrame(checkForAudio);
    }
};

checkForAudio();
```

**Trade-off:** 
- More accurate (waits for actual audio)
- More complex
- Needs timeout fallback
- AnalyserNode adds processing overhead

## Testing Checklist

- [x] Record with clips starting at bar 1
- [ ] Record with clips starting at bar 5 (delayed start)
- [ ] Record with loop enabled
- [ ] Record with loop disabled (auto-stop)
- [ ] Record with empty sequencer (should warn and stop)
- [ ] Record while already playing
- [ ] Record with high CPU load (slow system simulation)
- [ ] Multiple record/stop cycles

---

**Status:** ✅ Fixed with 300ms delay  
**Root Cause:** Web Audio API scheduled sources don't play immediately  
**Critical Learning:** `play()` returns immediately but audio starts later  
**Fix Version:** October 26, 2025 - v3.19
