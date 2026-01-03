# Sequencer Zoom & Pan - Quick Reference

## 🔍 Zoom Controls

### Zoom Slider
```
50% ←——————[●]——————→ 200%
        Zoom Level
```

**Effects:**
- **50%** - See more bars, smaller clips (overview mode)
- **100%** - Default view (150px per bar)
- **200%** - See details, larger clips (editing mode)

---

## 🖱️ Panning Methods

### Method 1: Shift + Drag
```
1. Hold [Shift]
2. Click & Drag ←→ on timeline
3. Timeline scrolls
```

### Method 2: Middle Mouse Button
```
1. Click [Middle Button]
2. Drag ←→ on timeline  
3. Timeline scrolls
```

---

## 📊 Waveform Display

### Automatic Waveforms
```
┌─────────────────────────────┐
│ ╱╲  ╱╲   ╱╲  ╱╲   ╱╲  ╱╲   │ ← Waveform (canvas)
│  ╲╱    ╲╱    ╲╱    ╲╱    ╲╱ │
│  Track 1 - Drum Loop.mp3    │ ← Text overlay
└─────────────────────────────┘
```

**Benefits:**
- Visual alignment
- Beat detection
- Silence identification
- Better clip positioning

---

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Pan Timeline | `Shift` + Drag |
| Exit Fullscreen | `Esc` |

*More shortcuts coming in future updates*

---

## 💡 Tips & Tricks

### When to Zoom In (150-200%)
- ✅ Precise clip alignment
- ✅ Finding exact beat positions
- ✅ Trimming clip start/end points
- ✅ Seeing waveform details

### When to Zoom Out (50-75%)
- ✅ Overview of entire arrangement
- ✅ Moving clips large distances
- ✅ Planning track structure
- ✅ Seeing all clips at once

### Efficient Workflow
```
1. Zoom OUT → Arrange clips roughly
2. Zoom IN → Fine-tune positions
3. Pan → Navigate while zoomed
4. Repeat as needed
```

---

## 🎯 Smart Behaviors

### Panning Won't Interfere With:
- ✅ Dragging clips from sidebar
- ✅ Moving clips on timeline
- ✅ Clicking controls/buttons
- ✅ Selecting/editing clips

### Waveforms Auto-Update When:
- ✅ Zooming in/out
- ✅ Resizing window
- ✅ Placing new clips
- ✅ Moving clips

---

## 🚀 Quick Start

### First Time Setup
1. Load some audio clips
2. Add a track to sequencer
3. Drop clips onto timeline
4. **See waveforms appear automatically**

### Try Zooming
1. Find zoom slider in controls
2. Drag right to zoom in (200%)
3. Notice: clips get bigger, more bars visible
4. Drag left to zoom out (50%)

### Try Panning
1. Zoom to 150% or higher
2. Hold `Shift` + Click & Drag timeline
3. Timeline scrolls horizontally
4. Release to stop panning

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't see waveforms | Check if clips have audio loaded |
| Can't pan | Zoom in first (>100%) |
| Waveforms blurry | Already auto-handled by device pixel ratio |
| Lag when zooming | Reduce number of clips |

---

## 📐 Zoom Level Guide

| Zoom | Bar Width | Best For |
|------|-----------|----------|
| 50% | 75px | Full arrangement overview |
| 75% | 112px | General editing |
| 100% | 150px | Default (balanced view) |
| 125% | 188px | Detailed editing |
| 150% | 225px | Precise alignment |
| 200% | 300px | Maximum detail |

---

## 🎨 Visual Indicators

### Cursor States
- `grab` 👆 - Hovering over timeline (can pan)
- `grabbing` ✊ - Currently panning
- `default` ↖️ - Over clips/controls (normal interaction)

### Waveform Colors
- White semi-transparent (`rgba(255, 255, 255, 0.7)`)
- Overlays clip background color
- Text shadow for readability

---

**Pro Tip:** Use zoom + pan together for the best editing experience! Zoom in to see details, pan to navigate, zoom out to see the big picture.

---

**Created:** October 26, 2025  
**Version:** 1.0
