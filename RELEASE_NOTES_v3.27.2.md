# Release Notes - v3.27.2

## Loop Boundary Enforcement Bugfix

**Release Date**: January 3, 2026

---

## 🐛 Bug Fix

### Immediate Loop Boundary Enforcement After Marker Drag

Fixed bug where loop boundaries wouldn't update immediately when dragging the end marker backward while playback was active, causing audio to continue playing past the new loop end point.

#### Problem
- User sets loop markers (A-B) and starts playback
- While playing, user drags the B (end) marker backward (shortening the loop)
- Playback position is now between the NEW end marker and the OLD end marker
- **Result**: Audio continues playing past the new loop end point
- **Cause**: Mouseup handler only enforced boundaries if playhead was "way outside" the loop (more than full loop duration away)

#### Scenario Example
```
Original loop: 10s → 20s (10 second loop)
Playback at: 18s (playing)
User drags B marker to: 15s (new end point)

Old behavior:
- Check: Is 18s > 15s + 10s (25s)? NO
- Action: Don't adjust, let handleLoopPlayback catch it later
- Result: Audio keeps playing until 20s (old boundary)

New behavior:
- Check: Is 18s > 15s? YES
- Action: Immediately seek to 10s (loop start)
- Result: Loop enforced instantly ✅
```

#### Solution
Modified the `mouseup` event handler in `app.js` for both tracks:

**Before**: Only adjusted playhead if it was significantly outside the loop
```javascript
const loopDuration = loopState1.end - loopState1.start;
if (currentTime < loopState1.start - loopDuration || 
    currentTime > loopState1.end + loopDuration) {
    // Seek back (only if WAY outside)
}
```

**After**: Immediately enforces loop boundaries
```javascript
// Check if playhead is simply outside the loop bounds
if (currentTime < loopState1.start || currentTime > loopState1.end) {
    audioElement1.currentTime = loopState1.start;
    console.log(`🔄 Playhead adjusted to loop start after marker drag`);
}
```

#### Benefits
- ✅ Loop boundaries enforced **immediately** when releasing dragged marker
- ✅ No audio plays past the new loop end point
- ✅ Smooth user experience when adjusting loop on the fly
- ✅ Works for both shortening and lengthening loops
- ✅ Handles both start (A) and end (B) marker adjustments

#### User Workflow Improvements
Users can now:
- **Drag loop markers while playing** and boundaries are enforced instantly
- **Shorten loops dynamically** without audio bleeding past the new end point
- **Fine-tune loop points in real-time** during live performance
- **Trust that loop boundaries are precise** and responsive

#### Technical Details
- Modified: `app/static/js/app.js` (mouseup event handler for both tracks)
- Changed: Loop boundary check from "way outside" to "simply outside"
- Removed: Buffer zone logic that was too conservative
- Maintained: Debounce mechanism in `handleLoopPlayback` for ongoing loop monitoring
- Impact: Immediate enforcement on marker release + continuous monitoring during playback

---

## Files Changed
- `app/static/js/app.js` - Mouseup handler for loop marker dragging (Track 1 and Track 2)

---

## Upgrade Notes
No breaking changes. Loop marker dragging now more responsive and accurate.

---

## Testing
Tested scenario:
1. Load audio to Track 1
2. Set loop markers (e.g., 10s - 20s)
3. Start playback
4. While playing at 18s, drag B marker to 15s
5. Release mouse
6. ✅ Playback immediately jumps to 10s (previously would continue to 20s)
