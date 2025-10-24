// Audio effects (reverb, delay, filter)

// Create reverb effect using convolution
export function createReverb(context) {
    const convolver = context.createConvolver();
    
    // Create impulse response for reverb
    const sampleRate = context.sampleRate;
    const length = sampleRate * 2; // 2 seconds reverb
    const impulse = context.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        const n = length - i;
        impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
    
    convolver.buffer = impulse;
    return convolver;
}

// Create delay effect
export function createDelay(context) {
    const delay = context.createDelay(5.0); // Max 5 seconds delay
    delay.delayTime.value = 0.3; // Default 300ms
    
    const feedback = context.createGain();
    feedback.gain.value = 0.3; // 30% feedback
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    return { delay, feedback };
}

// Initialize audio effects for a track
export function initAudioEffects(context, trackNumber) {
    // Create gain node (for volume control)
    const gain = context.createGain();
    gain.gain.value = 1.0;
    
    // Create stereo panner (for left/right panning)
    const panner = context.createStereoPanner();
    panner.pan.value = 0; // Center by default
    
    // Create reverb
    const reverb = createReverb(context);
    const reverbWet = context.createGain();
    reverbWet.gain.value = 0; // Dry by default
    const reverbDry = context.createGain();
    reverbDry.gain.value = 1.0;
    
    // Create delay
    const { delay, feedback } = createDelay(context);
    const delayWet = context.createGain();
    delayWet.gain.value = 0; // Dry by default
    const delayDry = context.createGain();
    delayDry.gain.value = 1.0;
    
    // Create filter (low-pass by default)
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000; // Wide open by default
    filter.Q.value = 1.0;
    
    return { 
        gain, 
        panner,
        reverb: { convolver: reverb, wet: reverbWet, dry: reverbDry }, 
        delay: { node: delay, feedback, wet: delayWet, dry: delayDry }, 
        filter 
    };
}

// Connect effects chain for a track
export function connectEffectsChain(source, effects, merger, audioContext) {
    const { gain, panner, filter, reverb, delay } = effects;
    
    // Effects chain:
    // source -> gain -> panner -> filter -> reverb (wet/dry) -> delay (wet/dry) -> merger
    
    source.connect(gain);
    gain.connect(panner);
    panner.connect(filter);
    
    // Reverb path
    filter.connect(reverb.convolver);
    reverb.convolver.connect(reverb.wet);
    
    // Dry path
    filter.connect(reverb.dry);
    
    // Merge reverb wet and dry
    const reverbMix = audioContext.createGain();
    reverb.wet.connect(reverbMix);
    reverb.dry.connect(reverbMix);
    
    // Delay path
    reverbMix.connect(delay.node);
    delay.node.connect(delay.wet);
    
    // Dry path
    reverbMix.connect(delay.dry);
    
    // Final merge and connect to mixer
    const finalMix = audioContext.createGain();
    delay.wet.connect(finalMix);
    delay.dry.connect(finalMix);
    
    // Connect to merger - let the panner's stereo output go through naturally
    finalMix.connect(merger);
    
    return { reverbMix, finalMix };
}
