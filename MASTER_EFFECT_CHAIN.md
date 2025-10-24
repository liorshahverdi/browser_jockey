# Master Effect Chain Feature

## Overview
Added a **Master Effect Chain** that applies effects to the final mixed output of both tracks before sending to speakers/recording.

## What's New

### 🎚️ Master Output Section
A new **golden-themed** section has been added between the track controls and the visualizer:

- **Master Effect Chain** - Drag and drop interface (gold theme)
- **Master Effects Controls** - Filter, Reverb, Delay with parameters
- **Master Volume** - Overall output level control

### Signal Flow

```
Track 1 Effects → ┐
                  ├→ Merger → Master Effects → Master Volume → Output
Track 2 Effects → ┘
```

**Complete Signal Path:**
1. Track 1: Source → Gain → Filter → Reverb → Delay → Merger
2. Track 2: Source → Gain → Filter → Reverb → Delay → Merger
3. **Master**: Merger → Filter → Reverb → Delay → Master Gain → Speakers/Recording

### ✨ Features

#### 1. Master Effect Chain (Gold Theme)
- Drag and drop to reorder master effects
- Toggle individual effects on/off
- Same functionality as track effect chains but applied to final mix
- Distinctive gold color scheme to distinguish from track effects

#### 2. Master Effects
- **Filter**: Apply EQ to the final mix
  - Low Pass, High Pass, or Band Pass
  - 20Hz to 20kHz range
  
- **Reverb**: Add space to the overall mix
  - 0-100% wet/dry mix
  - Applied after both tracks are mixed
  
- **Delay**: Echo effect on the master output
  - 0-100% wet/dry mix
  - Delay time: 50ms to 2000ms

#### 3. Master Volume
- Control the final output level
- 0-100% range
- Applied after all effects
- Prevents clipping when using heavy effects

### 🎨 Visual Design

**Gold Theme Elements:**
- Border: Golden (#ffd700)
- Background: Warm gold gradient
- Effect chain items: Golden highlights when enabled
- Master title: Large golden text with glow effect
- Clear visual distinction from purple track effect chains

### 🎛️ How to Use

1. **Load tracks** into Track 1 and/or Track 2
2. **Scroll down** to find the **Master Output** section (gold border)
3. **Adjust master effects**:
   - Use sliders to add filter, reverb, or delay to the final mix
   - Toggle effects on/off in the effect chain
   - Drag to reorder master effects
4. **Set master volume** to control overall output level
5. **Play both tracks** to hear the master effects applied to the mixed output

### 💡 Use Cases

#### Professional Mixing
- Add a **subtle reverb** to glue both tracks together
- Apply a **low-pass filter** for a warm, radio-ready sound
- Use **master volume** to prevent digital clipping

#### Creative Effects
- **Heavy delay** on the master for dub-style effects
- **High-pass filter** to create lo-fi or telephone effects
- **Toggle effects** on/off for dramatic transitions

#### Live Performance
- **Master effects** stay consistent while switching between tracks
- **Quick toggle** for instant effect changes
- **Drag reorder** to experiment with different effect chains

### 🔧 Technical Implementation

#### Files Modified

**HTML** (`app/templates/index.html`):
- Added master effects section with gold styling
- Master effect chain container
- Master effect controls (filter, reverb, delay, delay time)
- Master volume slider

**CSS** (`app/static/css/style.css`):
- `.master-effects-section` - Main container with gold theme
- `.master-effects-header` - Golden title styling
- `.master-volume-control` - Volume control styling
- `#effectChainMaster` - Gold-themed effect chain overrides

**JavaScript** (`app/static/js/visualizer-dual.js`):
- Added master effect nodes: `gainMaster`, `filterMaster`, `reverbMaster`, `delayMaster`
- Created master effect chain manager: `effectChainMaster`
- Rerouted audio: Merger → Master Effects → Output
- Added event listeners for master effect controls
- Master volume control implementation

**JavaScript** (`app/static/js/modules/effect-chain.js`):
- Added `isMaster` flag to detect master channel
- Support for 'Master' as trackNumber parameter
- Proper ID generation for master controls

#### Audio Routing Changes

**Before:**
```
Merger → Analyser → Destination
       → Recording Destination
       → Recording Analyser
```

**After:**
```
Merger → Master Filter → Master Reverb → Master Delay → Master Gain → Analyser → Destination
                                                                      → Recording Destination
                                                                      → Recording Analyser
```

### 🎯 Benefits

1. **Professional Sound**: Apply mastering-style effects to final mix
2. **Consistent Processing**: Effects apply to both tracks equally
3. **CPU Efficient**: One effect chain for final output vs. per-track duplication
4. **Creative Control**: Experiment with master effects while tracks play
5. **Visual Clarity**: Gold theme clearly identifies master controls
6. **Flexible Routing**: Can be disabled by toggling effects off

### 🔄 Effect Chain Interaction

- **Track Effects**: Applied individually to each track before mixing
- **Master Effects**: Applied to the mixed output of both tracks
- **Independent Control**: Toggle master effects without affecting track effects
- **Order Matters**: Master effect order can dramatically change the sound

### Example Workflows

**Clean Professional Mix:**
1. Track effects: Minimal (just volume/tempo)
2. Master filter: Slight high-pass at 30Hz (remove rumble)
3. Master reverb: 5-10% (subtle space)
4. Master volume: 90% (headroom for peaks)

**Dub/Reggae Style:**
1. Track 1: Drums with minimal effects
2. Track 2: Bass with track-level delay
3. Master delay: High feedback, rhythmic echo
4. Master filter: Sweeping low-pass for movement
5. Toggle master effects on/off for drops

**Lo-Fi/Experimental:**
1. Both tracks: Clean
2. Master filter: Heavy low-pass (telephone effect)
3. Master reverb: High amount (washy sound)
4. Master delay: Short delay for texture
5. Master volume: Lower to prevent distortion

### 📊 Control Reference

| Control | Range | Default | Purpose |
|---------|-------|---------|---------|
| Master Filter | 20Hz - 20kHz | 20kHz | EQ the final mix |
| Master Reverb | 0-100% | 0% | Add space to mix |
| Master Delay | 0-100% | 0% | Echo on output |
| Delay Time | 50-2000ms | 300ms | Echo timing |
| Master Volume | 0-100% | 100% | Final output level |

---

**The Master Effect Chain gives you professional-level control over your final mix! 🎚️✨**
