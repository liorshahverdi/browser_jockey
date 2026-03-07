/**
 * Vocoder Module
 * Implements a vocoder effect using band-pass filters and envelope followers
 *
 * BUG-003 FIX: Added lowpass smoothing filter after each WaveShaper envelope follower.
 *   Without smoothing the "envelope" was instantaneous absolute value → AM distortion.
 *   Also fixed bandGain.gain.value: was 1.0 (base) so modulator drove gain 1→2 instead
 *   of 0→1. Now set to 0 so envelope drives gain from silence to full amplitude.
 *
 * BUG-009 FIX: mixGain node created for 'mix' carrier type is now stored in the returned
 *   state object so disableVocoder() can disconnect and release it.
 */

/**
 * Enable vocoder effect
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {AudioNode} modulatorSource - Modulator source node (mic, track1, or track2)
 * @param {AudioNode} carrierSource - Carrier signal source (track or mic)
 * @param {ChannelMergerNode} merger - Output merger node
 * @param {number} numBands - Number of vocoder bands
 * @returns {Object} Vocoder state object
 */
export function enableVocoder(audioContext, modulatorSource, carrierSource, merger, numBands = 16) {
    if (!modulatorSource || !audioContext) {
        throw new Error('Modulator source and audio context required');
    }

    if (!carrierSource) {
        throw new Error('Carrier source required');
    }

    try {
        const vocoderBands = [];

        // Frequency range for vocoder bands (200Hz to 5000Hz typical for voice)
        const minFreq = 200;
        const maxFreq = 5000;

        // Create gain nodes for carrier and modulator input
        const vocoderCarrierGain = audioContext.createGain();
        const vocoderModulatorGain = audioContext.createGain();
        const vocoderOutputGain = audioContext.createGain();

        // Connect sources
        if (carrierSource) {
            carrierSource.connect(vocoderCarrierGain);
        }
        modulatorSource.connect(vocoderModulatorGain);

        // Create vocoder bands
        for (let i = 0; i < numBands; i++) {
            // Calculate band frequency (logarithmic distribution)
            const freqRatio = Math.pow(maxFreq / minFreq, i / (numBands - 1));
            const frequency = minFreq * freqRatio;
            const bandwidth = frequency * 0.15; // 15% bandwidth

            // Create filters for carrier (bandpass)
            const carrierFilter = audioContext.createBiquadFilter();
            carrierFilter.type = 'bandpass';
            carrierFilter.frequency.value = frequency;
            carrierFilter.Q.value = frequency / bandwidth;

            // Create filters for modulator (bandpass)
            const modulatorFilter = audioContext.createBiquadFilter();
            modulatorFilter.type = 'bandpass';
            modulatorFilter.frequency.value = frequency;
            modulatorFilter.Q.value = frequency / bandwidth;

            // Create envelope follower using waveshaper (full-wave rectification)
            const envelopeFollower = audioContext.createWaveShaper();
            const curve = new Float32Array(256);
            for (let j = 0; j < 256; j++) {
                curve[j] = Math.abs(j / 128 - 1); // Absolute value: maps [-1,1] → [0,1]
            }
            envelopeFollower.curve = curve;

            // BUG-003 FIX: Add lowpass smoothing filter after the rectifier.
            // Without this, the "envelope" is the instantaneous absolute sample value
            // at audio frequency → harsh AM distortion instead of smooth vocoding.
            // A ~15Hz lowpass extracts the slowly-varying amplitude shape (attack/release).
            const smoothingFilter = audioContext.createBiquadFilter();
            smoothingFilter.type = 'lowpass';
            smoothingFilter.frequency.value = 15; // Hz — controls envelope attack/release speed
            smoothingFilter.Q.value = 0.5;         // Maximally flat (Butterworth-like)

            // Create gain node for this band
            // BUG-003 FIX: Set base gain to 0 (not 1.0).
            // Previously: base=1.0 → modulator adds to base → gain oscillates 1→2 instead of 0→1.
            // Carrier band was never silent even when modulator energy was zero.
            const bandGain = audioContext.createGain();
            bandGain.gain.value = 0;

            // Connect the vocoder band
            // Carrier path: vocoderCarrierGain → carrierFilter → bandGain → vocoderOutputGain
            // Modulator path: vocoderModulatorGain → modulatorFilter → envelopeFollower
            //                 → smoothingFilter → bandGain.gain (AudioParam)
            vocoderCarrierGain.connect(carrierFilter);
            vocoderModulatorGain.connect(modulatorFilter);
            modulatorFilter.connect(envelopeFollower);
            envelopeFollower.connect(smoothingFilter);
            smoothingFilter.connect(bandGain.gain); // Smoothed envelope drives gain 0→1
            carrierFilter.connect(bandGain);
            bandGain.connect(vocoderOutputGain);

            vocoderBands.push({
                carrierFilter,
                modulatorFilter,
                envelopeFollower,
                smoothingFilter,
                bandGain,
                frequency
            });
        }

        // Connect vocoder output to merger
        vocoderOutputGain.connect(merger);

        console.log(`Vocoder enabled with ${numBands} bands`);

        return {
            vocoderBands,
            vocoderCarrierGain,
            vocoderModulatorGain,
            vocoderOutputGain,
            mixGainNode: null  // BUG-009: populated by getVocoderCarrierSource when type='mix'
        };
    } catch (error) {
        console.error('Error enabling vocoder:', error);
        throw new Error('Error enabling vocoder. Please try again.');
    }
}

/**
 * Disable vocoder effect and cleanup resources
 * @param {Object} vocoderState - Vocoder state object from enableVocoder
 */
export function disableVocoder(vocoderState) {
    const { vocoderBands, vocoderCarrierGain, vocoderModulatorGain, vocoderOutputGain, mixGainNode } = vocoderState;

    // Disconnect all bands (including the new smoothingFilter)
    if (vocoderBands) {
        vocoderBands.forEach(band => {
            try {
                band.carrierFilter.disconnect();
                band.modulatorFilter.disconnect();
                band.envelopeFollower.disconnect();
                if (band.smoothingFilter) {
                    band.smoothingFilter.disconnect();
                }
                band.bandGain.disconnect();
            } catch (e) {
                // Already disconnected
            }
        });
    }

    // Disconnect main nodes
    if (vocoderCarrierGain) {
        try {
            vocoderCarrierGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }

    if (vocoderModulatorGain) {
        try {
            vocoderModulatorGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }

    if (vocoderOutputGain) {
        try {
            vocoderOutputGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }

    // BUG-009 FIX: Disconnect the mixGain node created for 'mix' carrier type.
    // Previously this node was created but never stored, so it leaked on every
    // enable/disable cycle.
    if (mixGainNode) {
        try {
            mixGainNode.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }

    console.log('Vocoder disabled');
}

/**
 * Update vocoder mix level
 * @param {GainNode} vocoderOutputGain - Vocoder output gain node
 * @param {number} mixValue - Mix value (0-100)
 */
export function updateVocoderMix(vocoderOutputGain, mixValue) {
    if (vocoderOutputGain) {
        vocoderOutputGain.gain.value = mixValue / 100;
    }
}

/**
 * Get carrier source node for vocoder
 * @param {string} carrierType - Type of carrier ('track1', 'track2', 'mic', 'mix')
 * @param {AudioNode} source1 - Track 1 source
 * @param {AudioNode} source2 - Track 2 source
 * @param {MediaStreamAudioSourceNode} micSource - Microphone source
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Object|null} vocoderState - Existing vocoder state to store mixGain reference.
 *   Pass null when calling before enableVocoder; caller must set vocoderState.mixGainNode
 *   after enableVocoder returns.
 * @returns {AudioNode|null} Carrier source node
 */
export function getVocoderCarrierSource(carrierType, source1, source2, micSource, audioContext, vocoderState = null) {
    switch (carrierType) {
        case 'track1':
            return source1;
        case 'track2':
            return source2;
        case 'mic':
            return micSource;
        case 'mix':
            // BUG-009 FIX: Store the created mixGain in vocoderState so disableVocoder()
            // can disconnect it. Each enable/disable cycle previously orphaned this node.
            if (source1 && source2 && audioContext) {
                const mixGain = audioContext.createGain();
                source1.connect(mixGain);
                source2.connect(mixGain);
                // Store reference for cleanup — caller sets vocoderState.mixGainNode = mixGain
                // if vocoderState is provided; otherwise caller is responsible.
                if (vocoderState) {
                    vocoderState.mixGainNode = mixGain;
                }
                return mixGain;
            } else if (source1) {
                return source1;
            } else if (source2) {
                return source2;
            }
            return null;
        default:
            return null;
    }
}
