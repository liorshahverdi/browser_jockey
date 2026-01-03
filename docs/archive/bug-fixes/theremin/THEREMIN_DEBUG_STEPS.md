# Quick Debug Steps for Theremin

## Open Browser Console

1. **Open the app**: http://localhost:5001
2. **Open Developer Tools**:
   - **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
   - **Firefox**: Press `F12` or `Cmd+Option+K` (Mac) or `Ctrl+Shift+K` (Windows)
3. **Go to Console tab**

## What to Look For

### On Page Load

You should see these messages:
```
🎵 Browser Jockey initialized successfully
Theremin button element: <button id="enableThereminBtn">...</button>
Theremin elements initialization: { enableBtn: true, disableBtn: true, ... }
```

If you see:
- ❌ `Theremin button element: null` → The HTML didn't load properly
- ❌ `enableBtn: false` → Button not found in DOM
- ❌ Any red errors → There's a JavaScript error

### When You Click "Enable Theremin"

You should see:
```
Enable theremin button clicked
Elements found: { enableBtn: true, disableBtn: true, ... }
Calling enableTheremin with audioContext: [AudioContext object]
enableTheremin called, current state: false
Initializing camera...
Requesting camera access...
```

Then you'll get a camera permission prompt.

After allowing camera:
```
Camera access granted
Video metadata loaded: 640 x 480
Video playing
Camera initialized for theremin
Setting up audio nodes...
Connecting audio nodes...
Starting oscillators...
Starting motion tracking...
Theremin enabled successfully
enableTheremin returned: true
```

## Common Issues

### Issue: Nothing happens when clicking button

**Check Console For**:
- Any errors in red?
- Did you see "Enable theremin button clicked"?
  - ❌ **NO**: Event listener not attached, check element IDs
  - ✅ **YES**: Go to next step

### Issue: "Enable theremin button clicked" but nothing else

**Check Console For**:
- Is audioContext defined?
  - Look for: `Calling enableTheremin with audioContext:`
  - Should show an AudioContext object
  - If it says `undefined`, audio context not initialized yet

**Solution**: Try playing a track first to initialize audio context

### Issue: Camera permission denied

**Check Console For**:
```
Error accessing camera: NotAllowedError: Permission denied
```

**Solution**: 
- Click the camera icon in browser address bar
- Allow camera access
- Refresh page and try again

### Issue: Video container doesn't show

**Check Console For**:
```
Theremin enabled successfully
```

If you see this but no video, check:
1. Is `thereminVideoContainer` element found?
2. Run in console:
```javascript
document.getElementById('thereminVideoContainer').style.display
```
Should return "block", not "none"

## Manual Tests in Console

### Test 1: Check Elements
```javascript
console.log('Enable button:', document.getElementById('enableThereminBtn'));
console.log('Video container:', document.getElementById('thereminVideoContainer'));
console.log('Video element:', document.getElementById('thereminVideo'));
console.log('Canvas element:', document.getElementById('thereminCanvas'));
```

### Test 2: Check Video Container Display
```javascript
const container = document.getElementById('thereminVideoContainer');
console.log('Container display:', container.style.display);
console.log('Container computed style:', window.getComputedStyle(container).display);
```

### Test 3: Manually Show Video Container
```javascript
document.getElementById('thereminVideoContainer').style.display = 'block';
```

### Test 4: Check if Module Loaded
```javascript
// This won't work directly but check if error appears
import { enableTheremin } from './modules/theremin.js';
```

## Quick Fix Attempts

### If Button Exists But Doesn't Respond

Try running this in console to manually trigger:
```javascript
enableThereminBtn.click();
```

### If Video Container Stuck Hidden

Run in console:
```javascript
document.getElementById('thereminVideoContainer').style.display = 'block';
document.getElementById('thereminSettings').style.display = 'block';
document.getElementById('enableThereminBtn').style.display = 'none';
document.getElementById('disableThereminBtn').style.display = 'inline-block';
```

## Report Back

Please check the console and report:
1. Do you see "🎵 Browser Jockey initialized successfully"?
2. Do you see "Theremin button element: ..." with actual button or null?
3. When you click the button, do you see "Enable theremin button clicked"?
4. Do you see any red errors?
5. What's the last message you see in the console?

This will help me pinpoint exactly where the issue is!
