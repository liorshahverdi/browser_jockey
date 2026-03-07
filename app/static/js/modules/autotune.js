/**
 * Autotune Module
 * Implements pitch correction/auto-tune effect using pitch detection and correction
 *
 * BUG-001 FIX (primary — pitch shifter):
 *   The original implementation used 12× {delay: 20ms, allpass filter, gain} nodes.
 *   A fixed 20ms delay does NOT shift pitch; it produces AM distortion on the wet signal.
 *   Replaced with Tone.js PitchShift, which uses a proper phase-vocoder pitch shifter.
 *   Falls back to dry-signal-only wet path if Tone.js is unavailable.
 *
 * BUG-001 FIX (secondary — scale lookup in findNearestNoteInScale):
 *   musicScales[scaleKey] with scaleKey='C' → undefined (musicScales is keyed by scale
 *   *type*, not note name). Fixed to musicScales[scaleType]. Also added root-key offset
 *   calculation so notes are correctly placed within the chosen key.
 *
 * BUG-006 FIX (duplicate of above): findNearestNoteInScale now correctly returns a
 *   scale-snapped frequency instead of always returning the original frequency.
 */

import { musicScales } from './constants.js';

// Chromatic note names in semitone order from C (MIDI offset 0)
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Enable auto-tune effect
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {AudioNode} audioSource - Audio source node (mic, track1, or track2)
 * @param {ChannelMergerNode} merger - Output merger node
 * @param {number} strength - Auto-tune strength (0-100)
 * @returns {Object} Auto-tune state object
 */
export function enableAutotune(audioContext, audioSource, merger, strength = 50) {
    if (!audioSource || !audioContext) {
        throw new Error('Audio source and audio context required');
    }

    try {
        // Create analyser for pitch detection
        const autotuneAnalyser = audioContext.createAnalyser();
        autotuneAnalyser.fftSize = 4096;

        // Create gain nodes for wet/dry mix
        const dryGain = audioContext.createGain();
        const wetGain = audioContext.createGain();

        const normalizedStrength = strength / 100;
        dryGain.gain.value = 1 - normalizedStrength;
        wetGain.gain.value = normalizedStrength;

        // BUG-001 FIX: Replace the non-functional delay-node chain with Tone.PitchShift.
        // Tone.PitchShift uses a phase-vocoder algorithm and correctly transposes pitch.
        // We ensure Tone.js uses the same AudioContext as the app before creating the node.
        let pitchShifter = null;

        if (typeof Tone !== 'undefined') {
            try {
                // Sync Tone.js to use the same AudioContext as the main audio graph.
                // Tone.getContext().rawContext is the underlying native AudioContext.
                const toneCtx = Tone.getContext();
                if (toneCtx.rawContext !== audioContext) {
                    // Wrap the existing AudioContext in a Tone.Context so Tone.js nodes
                    // are registered in the same context as the rest of the audio graph.
                    Tone.setContext(audioContext);
                }
                pitchShifter = new Tone.PitchShift({
                    pitch: 0,          // semitones; updated in real-time by correctPitchToTarget
                    windowSize: 0.1,   // phase vocoder window (seconds)
                    delayTime: 0,
                    feedback: 0
                });
            } catch (e) {
                console.warn('⚠️ Tone.PitchShift unavailable, autotune wet path will be dry:', e);
            }
        } else {
            console.warn('⚠️ Tone.js not loaded — autotune pitch shifting disabled');
        }

        // Connect audio graph for pitch detection (shared between dry and wet paths)
        audioSource.connect(autotuneAnalyser);

        // Dry signal path: source → dryGain → merger
        audioSource.connect(dryGain);
        dryGain.connect(merger);

        if (pitchShifter) {
            // Wet signal path: source → Tone.PitchShift → wetGain → merger
            // In Tone.js v15, pitchShifter.input is a Tone.js Gain *wrapper* (not a
            // native AudioNode), so nativeNode.connect(pitchShifter.input) throws
            // "Overload resolution failed". We go one level deeper:
            //   pitchShifter.input        → Tone.js Gain (ToneAudioNode)
            //   pitchShifter.input.input  → native GainNode  ← valid connect target
            const nativePitchInput = pitchShifter.input.input || pitchShifter.input;
            audioSource.connect(nativePitchInput);
            // pitchShifter.connect() is Tone.js's overridden method; it resolves native
            // AudioNode destinations internally so wetGain (native GainNode) works here.
            pitchShifter.connect(wetGain);
            wetGain.connect(merger);
        } else {
            // Fallback: wet path is identical to dry (no correction, but no distortion)
            audioSource.connect(wetGain);
            wetGain.connect(merger);
        }

        console.log('Auto-tune enabled with', pitchShifter ? 'Tone.PitchShift' : 'bypass (no Tone.js)');

        return {
            autotuneAnalyser,
            dryGain,
            wetGain,
            pitchShifter  // Tone.js PitchShift node (or null if unavailable)
        };
    } catch (error) {
        console.error('Error enabling auto-tune:', error);
        throw new Error('Error enabling auto-tune. Please try again.');
    }
}

/**
 * Disable auto-tune effect and cleanup resources
 * @param {Object} autotuneState - Auto-tune state object from enableAutotune
 */
export function disableAutotune(autotuneState) {
    const { autotuneAnalyser, dryGain, wetGain, pitchShifter } = autotuneState;

    if (dryGain) {
        try { dryGain.disconnect(); } catch (e) { /* already disconnected */ }
    }

    if (wetGain) {
        try { wetGain.disconnect(); } catch (e) { /* already disconnected */ }
    }

    if (pitchShifter) {
        try {
            pitchShifter.disconnect();
            // Tone.js nodes must be disposed to release AudioWorklet resources
            if (typeof pitchShifter.dispose === 'function') {
                pitchShifter.dispose();
            }
        } catch (e) { /* already disconnected */ }
    }

    if (autotuneAnalyser) {
        try { autotuneAnalyser.disconnect(); } catch (e) { /* already disconnected */ }
    }

    console.log('Auto-tune disabled');
}

/**
 * Update auto-tune strength
 * @param {GainNode} dryGain - Dry signal gain node
 * @param {GainNode} wetGain - Wet signal gain node
 * @param {number} strength - Auto-tune strength (0-100)
 */
export function updateAutotuneStrength(dryGain, wetGain, strength) {
    const normalizedStrength = strength / 100;
    if (dryGain) {
        dryGain.gain.value = 1 - normalizedStrength;
    }
    if (wetGain) {
        wetGain.gain.value = normalizedStrength;
    }
}

/**
 * Detect pitch from frequency data
 * @param {Uint8Array} frequencyData - Frequency data from analyser
 * @param {number} sampleRate - Audio context sample rate
 * @param {number} fftSize - FFT size of analyser
 * @returns {number} Detected frequency in Hz
 */
export function detectPitch(frequencyData, sampleRate, fftSize) {
    // Find the peak frequency bin
    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxValue) {
            maxValue = frequencyData[i];
            maxIndex = i;
        }
    }

    // Convert bin index to frequency
    const nyquist = sampleRate / 2;
    const frequency = (maxIndex * nyquist) / (fftSize / 2);

    return frequency;
}

/**
 * Find nearest note frequency in scale
 *
 * BUG-001 / BUG-006 FIX:
 *   - Was: musicScales[scaleKey] where scaleKey='C' → undefined (wrong key type)
 *   - Now: musicScales[scaleType] → correct interval array
 *   - Added root-key offset: scale intervals are relative to the chosen root note,
 *     so we compute absolute chromatic positions before finding the nearest.
 *
 * @param {number} frequency - Input frequency in Hz
 * @param {string} scaleKey  - Root note name (e.g. 'C', 'G#', 'Bb'). Must match a
 *                             key in NOTE_NAMES: 'C','C#','D','D#','E','F','F#','G','G#','A','A#','B'
 * @param {string} scaleType - Scale type: 'major','minor','chromatic','pentatonic'
 * @returns {number} Frequency of nearest note in the specified scale and key
 */
export function findNearestNoteInScale(frequency, scaleKey = 'C', scaleType = 'major') {
    if (frequency < 20 || frequency > 20000) {
        return frequency; // Out of audible range
    }

    // BUG-001 FIX: use scaleType (e.g. 'major'), not scaleKey (e.g. 'C') to index musicScales.
    // musicScales = { chromatic:[...], major:[...], minor:[...], pentatonic:[...] }
    const scale = musicScales[scaleType];
    if (!scale || scale.length === 0) {
        return frequency; // Unknown scale type
    }

    // Determine the root note's chromatic offset (0=C … 11=B)
    const rootOffset = NOTE_NAMES.indexOf(scaleKey);
    if (rootOffset === -1) {
        return frequency; // Unknown key name
    }

    // Convert input frequency to MIDI note number (A4=440Hz → MIDI 69)
    const midiNote = 12 * Math.log2(frequency / 440) + 69;

    // Chromatic position of the input note within an octave (0–11, where 0=C)
    const noteInOctave = ((Math.round(midiNote) % 12) + 12) % 12;

    let nearestMidi = Math.round(midiNote);
    let minDistance = Infinity;

    scale.forEach(interval => {
        // Absolute chromatic position of this scale tone (relative to C=0)
        const scaleTone = (rootOffset + interval) % 12;

        // Circular distance on the chromatic circle (max 6 semitones)
        let distance = Math.abs(noteInOctave - scaleTone);
        if (distance > 6) distance = 12 - distance;

        if (distance < minDistance) {
            minDistance = distance;

            // Place the scale tone in the octave nearest to midiNote
            const baseOctave = Math.floor(midiNote / 12) * 12;
            let candidate = baseOctave + scaleTone;

            // Check adjacent octaves and pick the closest in MIDI space
            if (Math.abs(candidate + 12 - midiNote) < Math.abs(candidate - midiNote)) {
                candidate += 12;
            } else if (Math.abs(candidate - 12 - midiNote) < Math.abs(candidate - midiNote)) {
                candidate -= 12;
            }

            nearestMidi = candidate;
        }
    });

    // Convert MIDI note number back to frequency
    return 440 * Math.pow(2, (nearestMidi - 69) / 12);
}

/**
 * Correct pitch towards target frequency by updating the Tone.PitchShift node.
 *
 * BUG-001 FIX: Previously, this function manipulated gain values on 12 delay nodes
 * (which do not shift pitch). Now it sets pitchShifter.pitch in semitones, which
 * drives the Tone.js phase-vocoder pitch shifter.
 *
 * @param {Object} autotuneState - Auto-tune state object from enableAutotune
 * @param {number} currentFreq   - Current detected frequency in Hz
 * @param {number} targetFreq    - Target (scale-snapped) frequency in Hz
 */
export function correctPitchToTarget(autotuneState, currentFreq, targetFreq) {
    const { pitchShifter } = autotuneState;

    if (!pitchShifter || currentFreq <= 0 || targetFreq <= 0) {
        return;
    }

    // Pitch shift in semitones: positive = up, negative = down
    const semitones = 12 * Math.log2(targetFreq / currentFreq);

    // Clamp to ±12 semitones to avoid extreme (audible glitch) corrections
    pitchShifter.pitch = Math.max(-12, Math.min(12, semitones));
}
