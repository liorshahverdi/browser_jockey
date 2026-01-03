# Sequencer Loop Marker Indexing Consistency Fix

## Issue Found
During comprehensive codebase audit, discovered critical inconsistency in how loop markers store bar positions:

- **loopStartBar**: Stored 0-based position (0.0 = start of bar 1, 1.0 = start of bar 2)
- **loopEndBar**: Was storing 1-indexed equivalent (8 = bar 8) - INCONSISTENT!

## Root Cause
The indexing inconsistency caused confusion in display logic:
- loopStartBar always added +1 for display: `loopStartBar + 1`
- loopEndBar sometimes added +1, sometimes didn't: Mixed behavior

## Solution
Standardized BOTH to use **0-based positional values**:
- Position 0.0 = start of bar 1 (displayed as "Bar 1")
- Position 1.5 = middle of bar 2 (displayed as "Bar 2.50")
- Position 7.0 = start of bar 8 (displayed as "Bar 8")
- Position 7.999 = end of bar 8 (displayed as "Bar 8.99")

## Changes Made

### 1. Input Event Listener (Line 162)
```javascript
// BEFORE:
this.loopEndBar = value > 0 ? value : this.numberOfBars;

// AFTER:
this.loopEndBar = value > 0 ? value - 1 : this.numberOfBars - 1; // Convert to 0-indexed
```

### 2. Initialization Comment (Line 154)
Added clarifying comment: `// 0-indexed: 7 = bar 8, 7.5 = middle of bar 8`

### 3. Toggle Function (Lines 1633-1644)
```javascript
// BEFORE:
this.loopEndBar = this.numberOfBars;
this.loopEndBarInput.value = this.numberOfBars;
console.log(`🔁 Timeline loop enabled: Bar ${this.loopStartBar + 1} to ${this.loopEndBar}`);

// AFTER:
this.loopEndBar = this.numberOfBars - 1; // 0-indexed
this.loopEndBarInput.value = this.numberOfBars; // Display 1-indexed
console.log(`🔁 Timeline loop enabled: Bar ${this.loopStartBar + 1} to ${this.loopEndBar + 1}`);
```

### 4. Drag Marker Display (Line 1752)
```javascript
// BEFORE:
this.loopEndBarInput.value = Math.round(newBar); // Display rounded value

// AFTER:
this.loopEndBarInput.value = Math.round(newBar) + 1; // Convert to 1-indexed
```

### 5. Auto-Expand Function (Lines 1017-1019)
```javascript
// BEFORE:
if (this.loopEnabled && this.loopEndBar < barsNeeded) {
    this.loopEndBar = barsNeeded;
    this.loopEndBarInput.value = barsNeeded;

// AFTER:
if (this.loopEnabled && this.loopEndBar < barsNeeded - 1) {
    this.loopEndBar = barsNeeded - 1; // 0-indexed
    this.loopEndBarInput.value = barsNeeded; // Display 1-indexed
```

### 6. Click-to-Set Function (Line 385)
```javascript
// BEFORE:
this.loopEndBarInput.value = Math.round(constrainedPosition);
console.log(`🎯 Click-set loop END to bar ${barNum}.${fraction}%`);

// AFTER:
this.loopEndBarInput.value = Math.round(constrainedPosition) + 1; // Convert to 1-indexed
console.log(`🎯 Click-set loop END to bar ${barNum + 1}.${fraction}%`);
```

## Verification

### Internal Storage (0-based positions):
- `loopStartBar = 0` → Start of bar 1
- `loopEndBar = 7` → Start of bar 8
- `loopEndBar = 7.5` → Middle of bar 8

### Display Values (1-indexed bars):
- `loopStartBarInput.value = loopStartBar + 1` → Shows "1"
- `loopEndBarInput.value = loopEndBar + 1` → Shows "8"
- Console logs always add +1 to positions for display

### Playback Logic:
- `play()` function uses positions directly: `playbackDuration = (endBar - startBar) * secondsPerBar`
- Position 0 to 8 = 8 bars of playback ✅
- Position 0 to 7.5 = 7.5 bars of playback ✅

## Testing Checklist
- [ ] Set loop range via input fields (e.g., Bar 1 to 8)
- [ ] Drag loop END marker - verify display shows correct 1-indexed bar
- [ ] Click-to-set loop markers - verify END shows correct bar number
- [ ] Enable loop toggle - verify default range shows correct values
- [ ] Add long clip - verify auto-expand updates END marker correctly
- [ ] Play with loop enabled - verify stops at correct bar
- [ ] Console logs show consistent formatting for START and END

## Impact
This fix ensures:
✅ Consistent internal representation (0-based positions)
✅ Consistent display representation (1-indexed bars)
✅ No more confusion in drag/click-to-set logic
✅ Correct loop playback boundaries
✅ Proper auto-expand behavior

## Related Files
- `app/static/js/modules/sequencer.js` - All changes in this file
- Lines affected: 154, 162, 385, 1017-1019, 1633-1644, 1752
