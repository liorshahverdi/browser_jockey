# Browser Jockey v3.14.0 - Precise Loop Markers & Small Segment Chopping

**Release Date:** October 26, 2025

## 🎯 Overview

Version 3.14 introduces a complete overhaul of the loop marking system, enabling millisecond-precision loop point control for chopping tiny audio segments. This release is specifically designed for producers who need to capture tab audio and create precise, small loops from any segment of their tracks.

## ✨ Major Features

### 1. Precise Loop Marker Inputs
**Set loop points with millisecond accuracy**

- **Numeric Input Fields**: Display exact loop times in seconds with 3 decimal precision (0.001s)
- **Manual Entry**: Type exact time values for pixel-perfect placement
- **Arrow Key Fine-Tuning**: Adjust loop points by ±0.001s increments
- **Real-Time Sync**: Visual markers and inputs stay synchronized
- **Works at Any Zoom**: Full functionality from 1x to 20x zoom

**Benefits:**
- Create 100ms loops with precision
- Chop tiny segments from tab-captured audio
- Fine-tune after rough positioning
- Professional DAW-style workflow

### 2. Interactive Time Tooltip
**See exact time positions before clicking**

- **Hover Preview**: Floating tooltip shows exact time as you hover
- **MM:SS.mmm Format**: Clear, readable time display with milliseconds
- **Zoom-Aware**: Accurate at all zoom levels
- **Follows Mouse**: Tooltip tracks your cursor position

**Benefits:**
- Know exactly where you're clicking
- No guesswork when setting markers
- Faster, more confident workflow

### 3. Intelligent Loop Marker System
**Smart marker placement and adjustment**

- **Initial Setup**: First click sets A, second click sets B
- **After Setup**: Click moves the nearest marker to new position
- **Distance-Based**: System intelligently chooses which marker to move
- **Marker Swapping**: Auto-swaps if start > end
- **Works with Quick Loop**: Adjust quick loop markers manually

**Benefits:**
- Intuitive two-click workflow
- Easy adjustments without clearing
- Works seamlessly with quick loop presets
- Natural, predictable behavior

### 4. Fixed Zoom Click Detection
**Clicks work perfectly at any zoom level**

- **Smart Drag Detection**: Only treats as drag if mouse moves >3px
- **No False Drags**: Clicks are clicks, drags are drags
- **Pan Still Works**: Dragging to pan still functions normally
- **Zoom Independent**: Works from 1x to 20x zoom

**Benefits:**
- Set markers while zoomed 16x+
- No more ignored clicks
- Smooth panning when needed
- Reliable marker placement

### 5. Helpful In-App Hints
**Clear guidance without reading docs**

- **Hint Label**: "💡 Click to set A and B • Click again to adjust nearest marker • Hover to see time"
- **Always Visible**: Appears when loop mode enabled
- **Concise**: Quick reference without clutter
- **Cyan Theme**: Matches app design language

**Benefits:**
- Self-documenting interface
- No manual reading required
- Quick keyboard shortcut reminder
- Professional presentation

## 🎨 Visual Enhancements

### Precise Loop Section Styling
- **Cyan Theme**: Matches waveform colors
- **Dark Background**: Subtle, non-intrusive
- **Monospace Inputs**: Clear number display
- **Glowing Focus**: Cyan border on active input
- **Left Accent Border**: Visual hierarchy

### Time Tooltip Design
- **Dark Semi-Transparent**: Easy to read, doesn't obscure waveform
- **Cyan Border**: Consistent with theme
- **Monospace Font**: Clear time display
- **Smooth Positioning**: Follows mouse naturally

## 📊 Technical Improvements

### Code Quality
- Modular helper functions (`updatePreciseLoopInputs`, `formatTimeWithMs`)
- Clean event handling with validation
- Efficient DOM updates
- No performance impact on playback

### Browser Compatibility
- Works in all modern browsers
- CSS Grid and Flexbox layout
- HTML5 number inputs with step precision
- Standard Web Audio API

### Performance
- Lightweight tooltip updates
- Minimal DOM manipulation
- No audio processing overhead
- Smooth at high zoom levels

## 🔧 Bug Fixes

### Loop Marker Click Detection
**Issue:** When zoomed in, clicks were being treated as drag attempts and ignored.

**Fix:** Changed drag detection to require >3px mouse movement before considering it a drag. Now clicks work perfectly at any zoom level.

**Impact:** Users can now set loop markers while zoomed 16x or higher without clicks being ignored.

### Loop State After Quick Loop
**Issue:** After using quick loop, couldn't manually adjust markers - would start new loop instead.

**Fix:** Added intelligent behavior - if both markers exist, clicking moves the nearest one instead of starting over.

**Impact:** Quick loop can now be used as a starting point, then refined manually.

### Input Validation
**Issue:** Could set end marker before start marker, causing confusion.

**Fix:** Auto-validation ensures start < end, swaps if needed, prevents invalid ranges.

**Impact:** Loop points are always valid and logical.

## 📝 Usage Examples

### Example 1: Tab Capture Loop Chopping
```
1. Capture tab audio to Track 1
2. Zoom 10x to see details
3. Click loop button 🔁
4. Click on waveform → A marker appears
5. Click 100ms later → B marker appears
6. Fine-tune in inputs: A: 2.100, B: 2.200
7. Export perfect 100ms loop!
```

### Example 2: Quick Loop Refinement
```
1. Load track to Track 1
2. Click loop button 🔁
3. Click "2 Bars" → Quick loop set
4. Zoom 16x for precision
5. Click near start marker → Moves A
6. Click near end marker → Moves B
7. Type exact values in inputs
8. Perfect customized loop!
```

### Example 3: Ultra-Precise Tiny Loop
```
1. Load audio file
2. Zoom 20x (maximum)
3. Enable loop mode
4. Hover to preview times
5. Click at 1.234s → A set
6. Click at 1.567s → B set
7. Result: 333ms perfect loop
```

## 🎵 Workflow Improvements

### For Electronic Music Producers
- Chop tiny percussion hits from stems
- Create micro-loops for glitch effects
- Precise breakbeat editing
- Sample-accurate loop points

### For DJs
- Isolate specific sounds from mixes
- Create perfect loop points for mixing
- Capture and chop live stream audio
- Build custom sample libraries

### For Sound Designers
- Extract exact moments from recordings
- Create seamless micro-loops
- Precise sound effect isolation
- Professional sample preparation

## 📚 New Documentation

### Added Files
- `PRECISE_LOOP_MARKERS.md` - Complete feature documentation
- `SMALL_SEGMENT_LOOP_ENHANCEMENT.md` - Technical implementation details

### Key Sections
- Step-by-step usage guides
- Keyboard shortcuts reference
- Visual examples and workflows
- Technical architecture notes

## 🔄 Updated Files

### Modified
- `app/templates/index.html` - Added precise loop inputs, tooltips, hints
- `app/static/css/style.css` - New styling for inputs and tooltips
- `app/static/js/app.js` - Loop marker logic, drag detection, helper functions

### No Breaking Changes
- All existing functionality preserved
- Backward compatible with previous workflows
- Enhanced, not replaced

## 🚀 Getting Started

### Using Precise Loop Markers

1. **Enable Loop Mode**
   - Click the 🔁 loop button on either track
   - Section appears with precise inputs

2. **Set Markers (Choose Your Method)**
   - **Method A**: Click waveform twice (A then B)
   - **Method B**: Use quick loop, then adjust
   - **Method C**: Type exact times in inputs

3. **Fine-Tune**
   - Hover to preview exact positions
   - Click to move nearest marker
   - Use arrow keys for 0.001s adjustments
   - Type exact values for precision

4. **Export**
   - Click "Export Loop" button
   - Choose format (WAV/MP3)
   - Save your perfect loop!

## 💡 Pro Tips

1. **Use Hover Preview**: Hover over waveform to see exact time before clicking
2. **Zoom First**: Zoom in before setting markers for better precision
3. **Quick Loop Base**: Use quick loop as rough position, then fine-tune
4. **Arrow Keys**: Use ↑↓ in inputs for micro-adjustments
5. **Clear Often**: Use ❌ button to start fresh if needed

## 🎯 Performance Notes

- **No Impact**: Loop marker features don't affect audio playback performance
- **Lightweight**: Minimal memory and CPU usage
- **Smooth**: Works at maximum 20x zoom without lag
- **Efficient**: Real-time updates with no stuttering

## 🐛 Known Issues

None reported. If you encounter any issues, please report them on GitHub.

## 🔮 Future Enhancements

Potential features for future releases:
- Snap-to-zero-crossing for seamless loops
- Waveform magnifier for ultra-zoom
- Sample-level display mode
- Pre-listen scrubbing on hover
- Loop length calculator/matcher
- Copy/paste loop points between tracks

## 📦 Installation

### New Installation
```bash
git clone https://github.com/liorshahverdi/browser_jockey.git
cd browser_jockey
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

### Updating from v3.13
```bash
git pull origin main
# No new dependencies, just refresh browser
```

## 🙏 Acknowledgments

This release focuses on precision and usability based on real-world producer needs. The ability to chop tiny segments with millisecond accuracy opens up new creative possibilities for electronic music production, sound design, and DJ preparation.

## 📊 Version Comparison

### v3.13 → v3.14 Changes
- ✅ Added precise loop marker inputs (3 decimal precision)
- ✅ Added time tooltip on hover
- ✅ Added helpful hint labels
- ✅ Fixed zoom click detection (>3px drag threshold)
- ✅ Improved loop marker adjustment logic
- ✅ Enhanced visual styling for loop controls
- ✅ Added comprehensive documentation

### Lines of Code Changed
- HTML: ~40 lines added
- CSS: ~80 lines added
- JavaScript: ~150 lines added/modified
- Documentation: 2 new files

## 🎊 Celebrate!

You can now chop loops on really small segments of your tracks with millisecond precision! Whether you're capturing tab audio or working with uploaded files, Browser Jockey v3.14 gives you the tools to work with surgical precision.

**Happy Looping! 🎵✨**

---

**Full Changelog:** https://github.com/liorshahverdi/browser_jockey/compare/v3.13.0...v3.14.0
**Download:** https://github.com/liorshahverdi/browser_jockey/releases/tag/v3.14.0
