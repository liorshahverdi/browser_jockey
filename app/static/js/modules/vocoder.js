/**
 * Vocoder Module
 * Implements a vocoder effect using band-pass filters and envelope followers
 */

/**
 * Enable vocoder effect
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {MediaStreamAudioSourceNode} micSource - Microphone source node
 * @param {AudioNode} carrierSource - Carrier signal source (track or mic)
 * @param {ChannelMergerNode} merger - Output merger node
 * @param {number} numBands - Number of vocoder bands
 * @returns {Object} Vocoder state object
 */
export function enableVocoder(audioContext, micSource, carrierSource, merger, numBands = 16) {
    if (!micSource || !audioContext) {
        throw new Error('Microphone source and audio context required');
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
        micSource.connect(vocoderModulatorGain);
        
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
            
            // Create envelope follower using waveshaper
            const envelopeFollower = audioContext.createWaveShaper();
            const curve = new Float32Array(256);
            for (let j = 0; j < 256; j++) {
                curve[j] = Math.abs(j / 128 - 1); // Absolute value for envelope
            }
            envelopeFollower.curve = curve;
            
            // Create gain node for this band
            const bandGain = audioContext.createGain();
            bandGain.gain.value = 1.0;
            
            // Connect the vocoder band
            vocoderCarrierGain.connect(carrierFilter);
            vocoderModulatorGain.connect(modulatorFilter);
            modulatorFilter.connect(envelopeFollower);
            envelopeFollower.connect(bandGain.gain); // Modulate the gain
            carrierFilter.connect(bandGain);
            bandGain.connect(vocoderOutputGain);
            
            vocoderBands.push({
                carrierFilter,
                modulatorFilter,
                envelopeFollower,
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
            vocoderOutputGain
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
    const { vocoderBands, vocoderCarrierGain, vocoderModulatorGain, vocoderOutputGain } = vocoderState;
    
    // Disconnect all bands
    if (vocoderBands) {
        vocoderBands.forEach(band => {
            try {
                band.carrierFilter.disconnect();
                band.modulatorFilter.disconnect();
                band.envelopeFollower.disconnect();
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
 * @param {string} carrierType - Type of carrier ('track1', 'track2', 'mic')
 * @param {AudioNode} source1 - Track 1 source
 * @param {AudioNode} source2 - Track 2 source
 * @param {MediaStreamAudioSourceNode} micSource - Microphone source
 * @returns {AudioNode|null} Carrier source node
 */
export function getVocoderCarrierSource(carrierType, source1, source2, micSource) {
    switch (carrierType) {
        case 'track1':
            return source1;
        case 'track2':
            return source2;
        case 'mic':
            return micSource;
        default:
            return null;
    }
}
