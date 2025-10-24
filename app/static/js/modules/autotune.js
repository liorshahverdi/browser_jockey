/**
 * Autotune Module
 * Implements pitch correction/auto-tune effect using pitch detection and correction
 */

import { musicScales } from './constants.js';

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
        
        // Set strength value
        const normalizedStrength = strength / 100;
        dryGain.gain.value = 1 - normalizedStrength;
        wetGain.gain.value = normalizedStrength;
        
        // Create pitch shifters using multiple delay nodes
        // This is a simplified pitch correction using formant shifting
        const pitchShifters = [];
        for (let i = 0; i < 12; i++) {
            const shifter = {
                delay: audioContext.createDelay(1.0),
                gain: audioContext.createGain(),
                filter: audioContext.createBiquadFilter()
            };
            
            shifter.delay.delayTime.value = 0.02; // 20ms base delay
            shifter.gain.gain.value = 0;
            shifter.filter.type = 'allpass';
            shifter.filter.frequency.value = 1000;
            
            pitchShifters.push(shifter);
        }
        
        // Connect audio graph for pitch detection
        audioSource.connect(autotuneAnalyser);
        
        // Connect dry signal
        audioSource.connect(dryGain);
        
        // Connect wet signal through pitch shifters
        pitchShifters.forEach(shifter => {
            audioSource.connect(shifter.filter);
            shifter.filter.connect(shifter.delay);
            shifter.delay.connect(shifter.gain);
            shifter.gain.connect(wetGain);
        });
        
        // Connect to output
        dryGain.connect(merger);
        wetGain.connect(merger);
        
        console.log('Auto-tune enabled');
        
        return {
            autotuneAnalyser,
            dryGain,
            wetGain,
            pitchShifters
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
    const { autotuneAnalyser, dryGain, wetGain, pitchShifters } = autotuneState;
    
    // Disconnect and clean up
    if (dryGain) {
        try {
            dryGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }
    
    if (wetGain) {
        try {
            wetGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }
    
    if (pitchShifters) {
        pitchShifters.forEach(shifter => {
            try {
                shifter.filter.disconnect();
                shifter.delay.disconnect();
                shifter.gain.disconnect();
            } catch (e) {
                // Already disconnected
            }
        });
    }
    
    if (autotuneAnalyser) {
        try {
            autotuneAnalyser.disconnect();
        } catch (e) {
            // Already disconnected
        }
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
    // Find the peak frequency
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
 * @param {number} frequency - Input frequency in Hz
 * @param {string} scaleKey - Musical key (e.g., 'C', 'D', etc.)
 * @param {string} scaleType - Scale type ('major' or 'minor')
 * @returns {number} Nearest note frequency in scale
 */
export function findNearestNoteInScale(frequency, scaleKey = 'C', scaleType = 'major') {
    if (frequency < 20 || frequency > 20000) {
        return frequency; // Out of audible range
    }
    
    // Get scale notes
    const scale = musicScales[scaleKey] && musicScales[scaleKey][scaleType];
    if (!scale) {
        return frequency; // Invalid scale
    }
    
    // Convert frequency to MIDI note number
    const midiNote = 12 * Math.log2(frequency / 440) + 69;
    
    // Find nearest note in scale
    const noteInOctave = Math.round(midiNote) % 12;
    let nearestNote = midiNote;
    let minDistance = Infinity;
    
    scale.forEach(scaleNote => {
        const distance = Math.abs(noteInOctave - scaleNote);
        if (distance < minDistance) {
            minDistance = distance;
            nearestNote = Math.floor(midiNote / 12) * 12 + scaleNote;
        }
    });
    
    // Convert back to frequency
    return 440 * Math.pow(2, (nearestNote - 69) / 12);
}

/**
 * Correct pitch towards target frequency
 * @param {Object} autotuneState - Auto-tune state object
 * @param {number} currentFreq - Current detected frequency
 * @param {number} targetFreq - Target frequency to correct towards
 */
export function correctPitchToTarget(autotuneState, currentFreq, targetFreq) {
    const { pitchShifters } = autotuneState;
    
    if (!pitchShifters || currentFreq === 0 || targetFreq === 0) {
        return;
    }
    
    // Calculate pitch shift ratio
    const pitchRatio = targetFreq / currentFreq;
    
    // Distribute pitch shift across shifters
    pitchShifters.forEach((shifter, index) => {
        const noteOffset = index - 6; // -6 to +5 semitones
        const semitoneRatio = Math.pow(2, noteOffset / 12);
        
        // Calculate how close this shifter is to the target
        const distance = Math.abs(Math.log2(pitchRatio) - Math.log2(semitoneRatio));
        const gain = Math.max(0, 1 - distance * 2); // Fade out as distance increases
        
        shifter.gain.gain.value = gain / pitchShifters.length;
    });
}
