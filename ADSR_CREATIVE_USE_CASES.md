# ADSR Envelope - Creative Use Cases & Sound Design Guide

## Overview
This guide provides practical examples and creative applications for the ADSR envelope effects in Browser Jockey. Whether you're producing music, performing live, or just experimenting with sound, these use cases will help you unlock the full potential of envelope shaping.

## Date Created
October 25, 2025

---

## Table of Contents
1. [Keyboard Sampler Techniques](#keyboard-sampler-techniques)
2. [Track Effect Techniques](#track-effect-techniques)
3. [Master Output Techniques](#master-output-techniques)
4. [Genre-Specific Applications](#genre-specific-applications)
5. [Live Performance Tips](#live-performance-tips)
6. [Advanced Combinations](#advanced-combinations)

---

## Keyboard Sampler Techniques

The keyboard sampler's ADSR allows you to transform any sample into an expressive instrument.

### 1. Piano-like Response 🎹

**Settings:**
- Attack: 5-10ms (quick but not instant)
- Decay: 200-400ms
- Sustain: 40-60%
- Release: 600-1000ms

**What it does:**
- Fast attack simulates hammer strike
- Decay mimics string resonance drop
- Mid-level sustain creates natural held notes
- Long release simulates string damping

**Best with:**
- Melodic samples
- Clean instrument recordings
- Short percussive sounds from tracks

**Tip:** Use lower root notes (C, D, E) for more realistic piano behavior

---

### 2. Organ-like Sustain 🎺

**Settings:**
- Attack: 1-20ms
- Decay: 1-50ms (minimal)
- Sustain: 95-100%
- Release: 50-200ms (short)

**What it does:**
- Instant/near-instant attack
- Minimal decay keeps sound at full level
- High sustain maintains constant volume
- Short release for clean note cutoffs

**Best with:**
- Sustained samples (vocal holds, synth pads)
- Harmonic-rich sources
- Samples with little natural decay

**Tip:** Works great for bass lines and chord stabs

---

### 3. Reverse Swell Effect 🌊

**Settings:**
- Attack: 1000-2000ms (very slow)
- Decay: 0-100ms (minimal)
- Sustain: 100%
- Release: 500-1000ms

**What it does:**
- Slow fade-in creates reverse/swell effect
- No decay means it reaches full volume
- High sustain maintains that volume
- Release creates smooth fade-out

**Best with:**
- Cymbal samples
- Noise/texture samples
- Any sample you want to "grow" into

**Tip:** Great for building tension before drops

---

### 4. Percussive/Plucked Sounds 🥁

**Settings:**
- Attack: 1-5ms (nearly instant)
- Decay: 80-150ms (quick)
- Sustain: 0-20% (very low)
- Release: 100-300ms

**What it does:**
- Instant attack for sharp transient
- Fast decay to low sustain = quick volume drop
- Low sustain creates "pluck" character
- Release smooths the tail

**Best with:**
- Drum samples
- Bass hits
- Short melodic stabs

**Tip:** Perfect for trap hi-hats, snares, and pluck basses

---

### 5. String-like Bowing 🎻

**Settings:**
- Attack: 200-500ms
- Decay: 300-600ms
- Sustain: 60-80%
- Release: 400-800ms

**What it does:**
- Medium attack simulates bow starting motion
- Gradual decay to sustain mimics string settling
- Mid-high sustain for held notes
- Smooth release like bow lifting

**Best with:**
- Sustained harmonic samples
- Vocal samples
- Synth pad sounds

**Tip:** Combine with reverb effect for orchestral ambience

---

### 6. Brass Stabs 🎺

**Settings:**
- Attack: 10-30ms
- Decay: 150-300ms
- Sustain: 70-85%
- Release: 200-400ms

**What it does:**
- Quick attack with slight ramp (breath/blow)
- Moderate decay to sustain
- High sustain for punchy sound
- Clean release

**Best with:**
- Bright, harmonic samples
- Short vocal stabs
- Synth leads

**Tip:** Layer multiple notes for horn section effect

---

## Track Effect Techniques

Use track ADSR to shape entire loops and audio files dynamically.

### 7. Gated Reverb (80s Drums) 💥

**Setup:**
1. Load drum loop on Track 1
2. Add high reverb (70-100%)
3. Enable ADSR in effect chain **after** reverb
4. Set ADSR before delay (or disable delay)

**ADSR Settings:**
- Attack: 1ms
- Decay: 100-200ms
- Sustain: 0%
- Release: 30-80ms

**What it does:**
- Reverb creates long tail
- ADSR gates/cuts the reverb tail sharply
- Classic 80s snare sound (Phil Collins, etc.)

**Trigger timing:** Hit trigger on each snare hit or kick

**Tip:** Use BPM detection to time triggers with beat

---

### 8. Sidechain Pumping Effect 🎧

**Setup:**
1. Load track on Track 1
2. Enable ADSR effect (position doesn't matter much)
3. Sync trigger to kick drum rhythm

**ADSR Settings:**
- Attack: 1-10ms
- Decay: 100-400ms (adjust to tempo)
- Sustain: 0-30%
- Release: 50-200ms

**What it does:**
- Simulates sidechain compression
- Volume ducks on each trigger
- Creates rhythmic pumping

**Trigger rhythm:** 
- 4/4 time: Trigger on beats 1, 2, 3, 4
- Double-time: Trigger on 1-and, 2-and, 3-and, 4-and

**Tip:** Use with basslines under kick drums for EDM pumping

---

### 9. Tremolo/Stutter Effect 🔄

**Setup:**
1. Enable ADSR on track
2. Prepare to trigger repeatedly at rhythm

**ADSR Settings:**
- Attack: 1ms
- Decay: 50-150ms
- Sustain: 0%
- Release: 20-50ms

**What it does:**
- Each trigger creates volume pulse
- Rapid triggering creates tremolo/stutter
- Rhythmic variation creates glitch effects

**Trigger pattern:** 1/16th notes or faster

**Tip:** Combine with delay for complex rhythmic patterns

---

### 10. Dynamic Swell Transitions 🌅

**Setup:**
1. Enable ADSR on track playing sustained sound
2. Position ADSR before reverb for clean effect

**ADSR Settings:**
- Attack: 1000-3000ms (very slow)
- Decay: 500-1000ms
- Sustain: 80-100%
- Release: 1000-2000ms

**What it does:**
- Slow fade-in from silence
- Gradual settling to sustain
- Smooth fade-out on release

**Use for:**
- Song intros
- Build-ups to drops
- Transitioning between sections

**Tip:** Trigger at start of new loop/section

---

### 11. Rhythmic Gating 🎚️

**ADSR Settings:**
- Attack: 1-5ms
- Decay: 100-300ms (match tempo)
- Sustain: 0%
- Release: 50-100ms

**Trigger pattern:** On-beat or off-beat

**What it does:**
- Creates rhythmic choppy effect
- Transforms sustained sounds into rhythmic patterns
- Like a noise gate but more musical

**Best with:**
- Pad sounds
- Sustained vocals
- Ambient textures

**Tip:** Use quarter notes for sparse grooves, eighth notes for busy patterns

---

## Master Output Techniques

Master ADSR affects the entire mix - use carefully but creatively!

### 12. Live Performance Fade-In 🎭

**Setup:**
- Start set with master ADSR triggered

**ADSR Settings:**
- Attack: 3000-8000ms (very slow)
- Decay: 1000-2000ms
- Sustain: 100%
- Release: 2000-4000ms

**What it does:**
- Professional fade-in from silence
- Gradual reveal of full mix
- Smooth entry into performance

**When to use:**
- Start of DJ set
- After a complete breakdown
- Transitioning from ambient intro

---

### 13. Emergency Fadeout/Kill Switch 🚨

**ADSR Settings:**
- Attack: (doesn't matter, won't be used)
- Decay: (doesn't matter)
- Sustain: 0%
- Release: 500-2000ms (adjust for fade speed)

**How to use:**
1. Set ADSR to these settings
2. When you need to cut audio:
3. Trigger ADSR, then immediately disable it
4. Release phase fades everything out

**What it does:**
- Emergency fade-out of entire mix
- More graceful than hard stop
- Useful for technical issues or set ending

**Tip:** Keep this preset ready for emergencies

---

### 14. Master Pumping/Dynamics 🔊

**ADSR Settings:**
- Attack: 10-50ms
- Decay: 200-600ms
- Sustain: 80-95%
- Release: 100-300ms

**Trigger rhythm:** On kick drum hits (4/4 beat)

**What it does:**
- Adds master compression-like pumping
- Creates cohesive "breathing" feel
- Glues mix together dynamically

**Best for:**
- House/Techno
- EDM genres
- Rhythmic electronic music

**Warning:** Can be tiring over long sets - use sparingly

---

### 15. Breakdown to Drop Transition 💎

**Phase 1 - Breakdown ADSR:**
- Attack: 100ms
- Decay: 500ms
- Sustain: 0%
- Release: 3000ms (long)

**Phase 2 - Drop ADSR:**
- Attack: 1ms
- Decay: 100ms
- Sustain: 100%
- Release: 500ms

**Execution:**
1. At breakdown, trigger Phase 1 (fades out over 3s)
2. At drop, trigger Phase 2 (instant impact)

**What it does:**
- Smooth transition from full mix to silence
- Then explosive return with impact
- Classic EDM drop technique

---

## Genre-Specific Applications

### House Music 🏠

**Track ADSR:**
- Use subtle pumping (Sustain: 85-95%)
- Trigger on kicks for groove
- Keep attack short (5-20ms)

**Sampler ADSR:**
- Piano-like for keys (Use Case #1)
- Organ-like for bass (Use Case #2)

---

### Ambient/Experimental 🌌

**Track ADSR:**
- Long attacks (1-3 seconds)
- Long releases (1-5 seconds)
- High sustain (80-100%)
- Use for evolving textures

**Master ADSR:**
- Slow fade-ins/outs for smooth transitions
- Create breathing, organic dynamics

---

### Hip-Hop/Trap 🎤

**Track ADSR:**
- Gated effects on hi-hats
- Stutter effects on vocals
- Quick, punchy envelopes

**Sampler ADSR:**
- Percussive settings (Use Case #4)
- Fast attack, low sustain for 808s
- Experiment with pitched samples

---

### Techno 🤖

**Track ADSR:**
- Aggressive gating
- Sidechain pumping
- Rhythmic modulation

**Master ADSR:**
- Subtle pumping for groove
- Build-up swells before drops

---

### Dub/Reggae 🌴

**Track ADSR:**
- Delay + ADSR for rhythmic delays
- Reverb + ADSR for space effects
- Trigger on off-beats

**Effect Chain:** Filter → ADSR → Reverb → Delay (heavy)

---

## Live Performance Tips

### Tip 1: Pre-Program Your Triggers 📝
- Set up ADSR presets for different song sections
- Know which effects are ADSR-enabled before performing
- Practice trigger timing with your tracks

### Tip 2: Use Master ADSR Sparingly ⚠️
- Master ADSR affects everything
- Use for major transitions only
- Have a "neutral" preset ready (A=1ms, D=1ms, S=100%, R=100ms)

### Tip 3: Layer ADSR Effects 🎚️
- Track 1 ADSR + Track 2 ADSR = Complex rhythms
- Offset trigger timings for polyrhythmic effects
- Experiment with different envelope shapes per track

### Tip 4: Record Your ADSR Performances 🎬
- Enable recording before triggering ADSR
- Capture happy accidents
- Export and reuse interesting patterns

### Tip 5: Combine with Other Effects 🔗
**Before reverb:** Clean envelope, reverb tail continues
**After reverb:** Envelope shapes wet signal including tails
**Before delay:** Creates rhythmic delay patterns
**After delay:** Shapes entire delay feedback

---

## Advanced Combinations

### Combo 1: Infinite Reverse Reverb ♾️

**Setup:**
1. Enable reverb (80-100%)
2. Enable ADSR after reverb
3. Set: A=2000ms, D=0ms, S=100%, R=3000ms
4. Trigger, wait for attack, then stop playback
5. Reverb tail continues with envelope shape

**Result:** Ethereal, growing reverb swells

---

### Combo 2: Rhythmic Filter Pumping 🎛️

**Setup:**
1. Enable filter (set to low-pass, ~500Hz)
2. Enable ADSR after filter
3. Set: A=1ms, D=200ms, S=40%, R=100ms
4. Trigger on beat

**Result:** Filter + volume pumping creates deep groove

---

### Combo 3: Stutter-Delay Madness 🌀

**Setup:**
1. Enable delay (60-80%, short delay time ~100ms)
2. Enable ADSR before delay
3. Set: A=1ms, D=50ms, S=0%, R=20ms
4. Trigger rapidly (1/16 notes or faster)

**Result:** Glitchy, stuttering delay patterns

---

### Combo 4: Sampler Orchestral Swell 🎻

**Setup:**
1. Enable sampler ADSR
2. Set: A=500ms, D=800ms, S=70%, R=1000ms
3. Use vocal or synth pad sample
4. Play chords (hold multiple keys)

**Result:** Orchestra-like swelling chords

---

### Combo 5: Crossfader + ADSR Transitions 🔀

**Setup:**
1. Enable ADSR on Track 1 and Track 2
2. Different settings for each track
3. Use crossfader to blend
4. Trigger envelopes at different times

**Result:** Complex, morphing transitions between tracks

---

## Sound Design Formulas

### Formula 1: The "Punch" Formula
```
Attack: < 5ms
Decay: 50-200ms
Sustain: 0-30%
Release: 50-300ms
```
**Use for:** Drums, bass hits, stabs

---

### Formula 2: The "Pad" Formula
```
Attack: 300-1000ms
Decay: 500-1500ms
Sustain: 60-90%
Release: 800-2000ms
```
**Use for:** Ambient textures, backgrounds, swells

---

### Formula 3: The "Gate" Formula
```
Attack: 1ms
Decay: 100-400ms (tempo-synced)
Sustain: 0%
Release: 20-100ms
```
**Use for:** Rhythmic gating, tremolo, sidechaining

---

### Formula 4: The "Natural" Formula
```
Attack: 5-50ms
Decay: 200-600ms
Sustain: 40-70%
Release: 300-1000ms
```
**Use for:** Realistic instruments, musical samples

---

## Troubleshooting Common Issues

### Issue: "ADSR trigger doesn't seem to do anything"
**Solution:** 
- Check that ADSR is enabled in effect chain
- Ensure sustain isn't at 100% with no attack time
- Verify audio is actually playing through the track

### Issue: "Sound cuts off too quickly"
**Solution:**
- Increase release time
- Increase sustain level
- Check if other effects are cutting the sound

### Issue: "ADSR makes clicking sounds"
**Solution:**
- Increase attack time (min 1-5ms to avoid clicks)
- Increase release time
- Avoid 0ms attack on percussive content

### Issue: "Can't hear the envelope on sampler"
**Solution:**
- Enable ADSR checkbox (it's disabled by default)
- Try more extreme settings to hear the effect
- Check that sample is long enough for envelope

### Issue: "Timing feels off"
**Solution:**
- Use BPM detection to match your track tempo
- Adjust decay/release times to match beat divisions
- Practice trigger timing before live performance

---

## Conclusion

The ADSR envelope is one of the most powerful and versatile tools in sound design. From subtle dynamics to dramatic effects, from realistic instruments to experimental textures, the possibilities are endless. 

**Remember:**
- Start with presets and modify
- Extreme settings create extreme sounds
- Subtle settings add musical dynamics
- Experiment and record your discoveries
- Have fun! 🎵

**Next Steps:**
1. Try each use case in order
2. Modify settings to taste
3. Combine techniques
4. Create your own signature sounds
5. Share your discoveries!

---

## Quick Reference Chart

| Sound Type | Attack | Decay | Sustain | Release | Use Case # |
|------------|--------|-------|---------|---------|------------|
| Piano | 5-10ms | 200-400ms | 40-60% | 600-1000ms | #1 |
| Organ | 1-20ms | 1-50ms | 95-100% | 50-200ms | #2 |
| Reverse Swell | 1-2s | 0-100ms | 100% | 0.5-1s | #3 |
| Percussion | 1-5ms | 80-150ms | 0-20% | 100-300ms | #4 |
| Strings | 200-500ms | 300-600ms | 60-80% | 400-800ms | #5 |
| Brass | 10-30ms | 150-300ms | 70-85% | 200-400ms | #6 |
| Gated Reverb | 1ms | 100-200ms | 0% | 30-80ms | #7 |
| Sidechain | 1-10ms | 100-400ms | 0-30% | 50-200ms | #8 |
| Tremolo | 1ms | 50-150ms | 0% | 20-50ms | #9 |
| Swell | 1-3s | 0.5-1s | 80-100% | 1-2s | #10 |
| Gate | 1-5ms | 100-300ms | 0% | 50-100ms | #11 |

---

**Happy Sound Designing! 🎛️🎵**
