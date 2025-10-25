// Audio effects (reverb, delay, filter, ADSR envelope)

// Create ADSR envelope effect
export function createADSREnvelope(context) {
    // Create nodes for ADSR envelope
    const envelope = context.createGain();
    envelope.gain.value = 0; // Start at zero
    
    // ADSR parameters (in seconds and 0-1)
    const parameters = {
        attack: 0.01,    // Attack time in seconds
        decay: 0.1,      // Decay time in seconds
        sustain: 0.8,    // Sustain level (0-1)
        release: 0.3,    // Release time in seconds
        enabled: false,  // Whether envelope is actively applied
        targetGain: 1.0  // Target gain level for sustain
    };
    
    return { envelope, parameters };
}

// Trigger ADSR envelope (start attack phase)
export function triggerADSRAttack(adsrEffect, audioContext, targetGain = 1.0) {
    const { envelope, parameters } = adsrEffect;
    const now = audioContext.currentTime;
    
    // Cancel any scheduled changes
    envelope.gain.cancelScheduledValues(now);
    
    // Start from current value
    envelope.gain.setValueAtTime(envelope.gain.value, now);
    
    // Attack: ramp to target gain
    envelope.gain.linearRampToValueAtTime(targetGain, now + parameters.attack);
    
    // Decay: ramp down to sustain level
    const sustainGain = targetGain * parameters.sustain;
    envelope.gain.linearRampToValueAtTime(sustainGain, now + parameters.attack + parameters.decay);
    
    parameters.enabled = true;
    parameters.targetGain = targetGain;
}

// Trigger ADSR release (start release phase)
export function triggerADSRRelease(adsrEffect, audioContext) {
    const { envelope, parameters } = adsrEffect;
    const now = audioContext.currentTime;
    
    // Cancel any scheduled changes
    envelope.gain.cancelScheduledValues(now);
    
    // Start release from current value
    const currentGain = envelope.gain.value;
    envelope.gain.setValueAtTime(currentGain, now);
    
    // Release: ramp to zero
    envelope.gain.linearRampToValueAtTime(0, now + parameters.release);
    
    parameters.enabled = false;
}

// Update ADSR parameters
export function updateADSRParameters(adsrEffect, attack, decay, sustain, release) {
    const { parameters } = adsrEffect;
    
    if (attack !== undefined) parameters.attack = attack;
    if (decay !== undefined) parameters.decay = decay;
    if (sustain !== undefined) parameters.sustain = sustain;
    if (release !== undefined) parameters.release = release;
}

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
    
    // Create ADSR envelope
    const adsr = createADSREnvelope(context);
    
    return { 
        gain, 
        panner,
        reverb: { convolver: reverb, wet: reverbWet, dry: reverbDry }, 
        delay: { node: delay, feedback, wet: delayWet, dry: delayDry }, 
        filter,
        adsr
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
