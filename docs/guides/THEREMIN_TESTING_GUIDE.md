# Camera Theremin Testing Guide

## Testing the Feature

### Quick Test Steps

1. **Open the Browser Jockey app**: http://localhost:5001

2. **Locate the Camera Theremin section**:
   - Scroll down past the DJ tracks
   - Look for "🎥 Camera Theremin" section
   - It's below the "🎹 Keyboard Sampler"

3. **Enable the Theremin**:
   - Click the "🎥 Enable Theremin" button
   - Allow camera permissions when prompted
   - The video feed should appear showing your webcam

4. **Test Motion Control**:
   - **Move your hand up and down** → Pitch changes (frequency)
   - **Move your hand left and right** → Volume changes
   - Watch the display overlay showing:
     - Current frequency (Hz)
     - Current volume (%)
   - Look for the cyan crosshair tracking your motion

5. **Try Different Settings**:
   - Change **Waveform**: Sine, Triangle, Sawtooth, Square
   - Change **Pitch Range**: Low, Medium, High, Wide
   - Adjust **Vibrato Rate** and **Depth** sliders

### What You Should See

#### Video Display
- ✅ Live camera feed (mirrored)
- ✅ Cyan crosshair following brightest/most active region
- ✅ Frequency and Volume values in top-left corner
- ✅ Smooth, glowing crosshair with shadow effect

#### Audio Behavior
- ✅ Sound plays when theremin is enabled
- ✅ Pitch changes when you move hand vertically
- ✅ Volume changes when you move hand horizontally
- ✅ Smooth transitions (no clicking or popping)
- ✅ Vibrato effect adds subtle pitch warble

### Debugging Steps

If the theremin doesn't work:

1. **Check Browser Console** (F12 or Cmd+Option+I):
   - Look for errors in red
   - Check for console.log messages:
     - "Requesting camera access..."
     - "Camera access granted"
     - "Video metadata loaded: 640 x 480"
     - "Video playing"
     - "Setting up audio nodes..."
     - "Theremin enabled successfully"

2. **Camera Permission**:
   - Make sure you clicked "Allow" when prompted
   - Check browser address bar for camera icon
   - Try a different browser if permissions are stuck

3. **Video Element**:
   - Video should be visible and showing live feed
   - If video is black, check camera permissions
   - If video is frozen, try disabling/enabling again

4. **Audio Context**:
   - Some browsers require user interaction before audio plays
   - Try clicking on the page first
   - Check if audio is muted in browser/system

### Common Issues & Solutions

#### Issue: No video feed appears
**Solution**: 
- Check camera permissions in browser settings
- Make sure no other app is using the camera
- Try refreshing the page

#### Issue: Video appears but no sound
**Solution**:
- Check browser console for audio context errors
- Try playing a track first to initialize audio context
- Check system volume isn't muted

#### Issue: Crosshair doesn't move
**Solution**:
- Make sure you have good lighting
- Move your hand in front of camera
- Try wearing something bright or waving a white object
- Check console for motion detection errors

#### Issue: Sound is glitchy or clicking
**Solution**:
- This might be normal if you move very quickly
- Motion smoothing should reduce this
- Try smoother, slower movements

### Browser Compatibility

**Recommended**: Chrome/Chromium browsers
- Full WebRTC support
- Best audio performance
- Reliable getUserMedia

**Also Works**:
- Firefox (good support)
- Edge (Chromium-based, excellent)
- Safari (may need extra permission prompts)

### Performance Tips

1. **Lighting**: Better lighting = better motion detection
2. **Background**: Contrasting background helps tracking
3. **Distance**: Sit 2-3 feet from camera
4. **Movement**: Smooth, deliberate movements work best

### Technical Checks

If you want to verify the implementation:

```javascript
// Open browser console and check:

// 1. Check if theremin module loaded
console.log('Theremin module:', window.thereminState);

// 2. Check video element
const video = document.getElementById('thereminVideo');
console.log('Video element:', video);
console.log('Video stream:', video.srcObject);
console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);

// 3. Check canvas element
const canvas = document.getElementById('thereminCanvas');
console.log('Canvas element:', canvas);
console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);

// 4. Check display overlay
const freqDisplay = document.getElementById('thereminFreqDisplay');
const volDisplay = document.getElementById('thereminVolDisplay');
console.log('Frequency display:', freqDisplay?.textContent);
console.log('Volume display:', volDisplay?.textContent);
```

### Expected Console Output

When enabling theremin, you should see:
```
enableTheremin called, current state: false
Initializing camera...
Requesting camera access...
Camera access granted
Video metadata loaded: 640 x 480
Video playing
Camera initialized for theremin
Setting up audio nodes...
Connecting audio nodes...
Starting oscillators...
Starting motion tracking...
Theremin enabled successfully
```

### Integration Tests

Test that theremin works with other features:

1. **With DJ Tracks**:
   - Load two tracks
   - Play them
   - Enable theremin
   - All audio should mix together

2. **With Sampler**:
   - Load a sample
   - Enable keyboard sampler
   - Enable theremin
   - Both should play simultaneously

3. **With Recording**:
   - Enable theremin
   - Start master recording
   - Play with theremin
   - Stop recording
   - Playback should include theremin audio

### Visual Improvements Made

The updated implementation now includes:

1. **Video Feed Display**: Live camera feed visible at all times
2. **Canvas Overlay**: Transparent overlay for motion tracking visualization
3. **Display Values**: Real-time frequency and volume in styled overlay box
4. **Enhanced Crosshair**: Larger, glowing crosshair with shadow effects
5. **Proper Layering**: Video, canvas, and display properly stacked

### Next Steps

If everything works:
- Try creating music with it!
- Record a performance
- Mix it with DJ tracks
- Experiment with different waveforms and ranges

If issues persist:
- Check browser console for specific errors
- Try a different browser
- Make sure camera hardware is working
- Check the documentation in CAMERA_THEREMIN_FEATURE.md
