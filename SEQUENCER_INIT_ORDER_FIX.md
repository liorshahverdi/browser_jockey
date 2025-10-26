# Sequencer Initialization Order Fix

## Issue
**Error Message:**
```
Uncaught TypeError: Failed to execute 'connect' on 'AudioNode': 
Overload resolution failed.
    at Sequencer.addSequencerTrack (sequencer.js:425:23)
    at Sequencer.initializeTimeline (sequencer.js:332:14)
```

**Symptom:** Could not load clips onto the sequencer - tracks failed to initialize properly.

## Root Cause

The sequencer constructor had initialization methods called in the wrong order:

```javascript
// WRONG ORDER (before fix):
this.initializeElements();
this.initializeEventListeners();
this.initializeTimeline();        // Creates Track 1
this.initializeAudioRouting();    // Creates outputGain
```

**Problem:** When `initializeTimeline()` runs, it calls `addSequencerTrack('Track 1')`, which tries to connect the track's gain node to `this.outputGain`. However, `this.outputGain` is still `null` because `initializeAudioRouting()` hasn't been called yet.

The failing line in `addSequencerTrack()`:
```javascript
trackGain.connect(this.outputGain); // ❌ this.outputGain is null!
```

## Solution

Reordered the initialization methods to ensure audio routing is set up BEFORE creating tracks:

```javascript
// CORRECT ORDER (after fix):
this.initializeElements();
this.initializeAudioRouting();    // ✅ Creates outputGain FIRST
this.initializeEventListeners();
this.initializeTimeline();        // ✅ Now Track 1 can connect to outputGain
```

## Changes Made

**File:** `app/static/js/modules/sequencer.js`  
**Lines:** 21-24

**Before:**
```javascript
this.initializeElements();
this.initializeEventListeners();
this.initializeTimeline();
this.initializeAudioRouting();
```

**After:**
```javascript
this.initializeElements();
this.initializeAudioRouting(); // Moved up
this.initializeEventListeners();
this.initializeTimeline(); // Moved down
```

## Why This Works

### Dependency Chain
```
initializeTimeline()
  ↓
addSequencerTrack('Track 1')
  ↓
trackGain.connect(this.outputGain) ← Needs outputGain to exist!
  ↑
this.outputGain created in initializeAudioRouting()
```

By calling `initializeAudioRouting()` before `initializeTimeline()`, we ensure:
1. `this.outputGain` is created
2. `this.routingGain` is created
3. They are properly connected
4. When Track 1 is created, `trackGain.connect(this.outputGain)` succeeds

## Testing

### Before Fix
```
✅ Drag and drop enabled for clips panel
❌ Uncaught TypeError: Failed to execute 'connect' on 'AudioNode'
```

### After Fix
```
✅ Sequencer audio routing initialized
✅ Created gain node for track: Track 1
✅ Drag and drop enabled for clips panel
✅ Added uploaded file to sequencer: track.wav (0:06)
```

## Impact

- ✅ Tracks now initialize properly
- ✅ Clips can be loaded onto sequencer
- ✅ Audio routing works correctly
- ✅ No breaking changes to other functionality

## Lessons Learned

**Key Principle:** Always initialize dependencies before the code that uses them.

In this case:
- **Dependency:** `outputGain` (audio node)
- **Dependent:** Track creation (needs to connect to outputGain)
- **Solution:** Initialize outputGain before creating tracks

---

**Version**: 3.21.1  
**Type**: Bug Fix  
**Severity**: Critical (blocking feature)  
**Status**: ✅ Fixed  
**Date**: October 26, 2025
