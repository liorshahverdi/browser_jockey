# Theremin Audio Context Fix - October 25, 2025

## The Problem

**Error**: 
```
Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'createOscillator')
    at enableTheremin (theremin.js:96:45)
```

**Root Cause**: 
The `audioContext` was `undefined` when the theremin tried to use it. The Audio Context in Browser Jockey is initialized lazily (only when needed), and the theremin wasn't initializing it before use.

## The Solution

Added audio context initialization check to the theremin enable button event handler.

### Code Change

**File**: `/app/static/js/app.js`

**Before**:
```javascript
enableThereminBtn.addEventListener('click', async () => {
    console.log('Enable theremin button clicked');
    // ... directly calls enableTheremin with audioContext
    const success = await enableTheremin(audioContext, thereminElements, recordingDestination);
});
```

**After**:
```javascript
enableThereminBtn.addEventListener('click', async () => {
    console.log('Enable theremin button clicked');
    
    // Initialize audio context if not already done
    if (!audioContext) {
        console.log('Initializing audio context for theremin...');
        initAudioContext();
    }
    
    // ... now audioContext is guaranteed to exist
    const success = await enableTheremin(audioContext, thereminElements, recordingDestination);
});
```

## Why This Happened

Browser Jockey uses lazy initialization for the Web Audio API to:
1. Comply with browser autoplay policies (requires user interaction)
2. Reduce initial page load time
3. Only create audio resources when actually needed

Other features (tracks, microphone, sampler) all call `initAudioContext()` before using the audio context. The theremin was the only feature missing this initialization step.

## Pattern Used

This follows the same pattern used by other features:

**Microphone** (line 3398):
```javascript
enableMicBtn.addEventListener('click', async () => {
    initAudioContext();  // ← Initialize first
    // ... then use audioContext
});
```

**Vocoder** (line 3414):
```javascript
enableVocoderBtn.addEventListener('click', () => {
    initAudioContext();  // ← Initialize first
    // ... then use audioContext
});
```

**Theremin** (now fixed):
```javascript
enableThereminBtn.addEventListener('click', async () => {
    if (!audioContext) {
        initAudioContext();  // ← Initialize first
    }
    // ... then use audioContext
});
```

## What `initAudioContext()` Does

When called, it:
1. Creates the Web Audio API context
2. Creates the main analyser for visualization
3. Creates the merger node for mixing tracks
4. Creates the recording destination
5. Initializes master effects chain
6. Sets up all the core audio infrastructure

## Testing

After this fix:
1. ✅ Click "Enable Theremin" - should work on first try
2. ✅ Camera permission prompt appears
3. ✅ Video feed shows after allowing camera
4. ✅ Sound plays when moving hand
5. ✅ No audio context errors in console

## Related Files

- `/app/static/js/app.js` - Main application (fix applied here)
- `/app/static/js/modules/theremin.js` - Theremin module (expects valid audioContext)

## Browser Requirements

The fix ensures compliance with browser audio policies:
- Chrome: Requires user gesture to create AudioContext
- Firefox: Requires user gesture to create AudioContext
- Safari: Requires user gesture to create AudioContext
- Edge: Requires user gesture to create AudioContext

The button click provides the required user interaction.

## Future Considerations

All new audio features should follow this pattern:
```javascript
featureBtn.addEventListener('click', () => {
    // ALWAYS initialize audio context first
    if (!audioContext) {
        initAudioContext();
    }
    
    // Then use audio features
    enableFeature(audioContext, ...);
});
```

## Credits

Bug identified and fixed by Lior Shahverdi and Claude Sonnet 4.5, October 25, 2025.
