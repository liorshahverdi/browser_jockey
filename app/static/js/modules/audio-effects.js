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
export async function initAudioEffects(context, trackNumber) {
    // Create gain node (for volume control)
    const gain = context.createGain();
    gain.gain.value = 1.0;
    
    // Simple stereo panning using splitter/merger with gain nodes
    // Route BOTH input channels to BOTH output channels for proper stereo panning
    
    // First, ensure mono sources are upmixed to stereo
    const monoToStereo = context.createGain();
    monoToStereo.channelCount = 2;
    monoToStereo.channelCountMode = 'explicit';
    monoToStereo.channelInterpretation = 'speakers';
    
    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);
    
    // Create 4 gain nodes for routing both inputs to both outputs
    const leftToLeftGain = context.createGain();
    const leftToRightGain = context.createGain();
    const rightToLeftGain = context.createGain();
    const rightToRightGain = context.createGain();
    
    leftToLeftGain.gain.value = 1.0;
    leftToRightGain.gain.value = 1.0;
    rightToLeftGain.gain.value = 1.0;
    rightToRightGain.gain.value = 1.0;
    
    // Connect upmixer to splitter
    monoToStereo.connect(splitter);
    
    // Route: input → splitter → [4 gain paths] → merger → output
    // Left input to both outputs
    splitter.connect(leftToLeftGain, 0);
    splitter.connect(leftToRightGain, 0);
    // Right input to both outputs  
    splitter.connect(rightToLeftGain, 1);
    splitter.connect(rightToRightGain, 1);
    
    // Connect to output channels (multiple sources sum)
    leftToLeftGain.connect(merger, 0, 0);     // → left output
    rightToLeftGain.connect(merger, 0, 0);    // → left output
    leftToRightGain.connect(merger, 0, 1);    // → right output
    rightToRightGain.connect(merger, 0, 1);   // → right output
    
    // Pan control object
    const panControl = {
        _value: 0,
        get value() { return this._value; },
        set value(val) {
            this._value = Math.max(-1, Math.min(1, val));
            // When pan = 1 (right): left output muted, right output full
            // When pan = -1 (left): left output full, right output muted
            const leftOut = 1.0 - Math.max(0, this._value);  // 1.0 at center/left, 0.0 at right
            const rightOut = 1.0 + Math.min(0, this._value); // 1.0 at center/right, 0.0 at left
            
            // Apply same gain to both input channels for each output
            leftToLeftGain.gain.value = leftOut;
            rightToLeftGain.gain.value = leftOut;
            leftToRightGain.gain.value = rightOut;
            rightToRightGain.gain.value = rightOut;
        }
    };
    
    // Panner wrapper object
    const pannerWrapper = {
        input: monoToStereo,  // Accept mono or stereo, upmix to stereo
        output: merger,
        pan: panControl,
        connect(destination) {
            this.output.connect(destination);
        },
        disconnect() {
            this.output.disconnect();
        }
    };
    
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
    
    // Create 3-band EQ filters
    const eqLow = context.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 250; // Low shelf at 250Hz
    eqLow.gain.value = 0; // 0dB by default
    
    const eqMid = context.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000; // Mid peak at 1kHz
    eqMid.Q.value = 1.0; // Moderate Q for smooth curve
    eqMid.gain.value = 0; // 0dB by default
    
    const eqHigh = context.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 4000; // High shelf at 4kHz
    eqHigh.gain.value = 0; // 0dB by default
    
    // Create filter (low-pass by default) for existing filter slider functionality
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000; // Fully open by default
    filter.Q.value = 1.0;
    
    // Create ADSR envelope
    const adsr = createADSREnvelope(context);
    
    // Create pitch shifter using Tone.js if available
    let pitchShifter = null;
    if (typeof Tone !== 'undefined') {
        try {
            // Initialize Tone.js properly before use
            if (!Tone.context) {
                // Start Tone.js audio system first
                await Tone.start();
                console.log('✅ Tone.js initialized');
            }
            
            // Set Tone to use our existing AudioContext
            if (Tone.context.rawContext !== context) {
                Tone.setContext(context);
                console.log('✅ Tone.js context synchronized with Web Audio API');
            }
            
            // Create pitch shifter
            pitchShifter = new Tone.PitchShift({
                pitch: 0, // No pitch shift by default (in semitones)
                windowSize: 0.1, // Smaller window for better quality
                delayTime: 0, // No additional delay
                feedback: 0 // No feedback
            });
            console.log(`✅ Pitch shifter created for track ${trackNumber}`);
        } catch (err) {
            console.error('❌ Error creating Tone.js pitch shifter:', err);
            pitchShifter = null;
        }
    }
    
    return { 
        gain, 
        panner: pannerWrapper,
        reverb: { convolver: reverb, wet: reverbWet, dry: reverbDry }, 
        delay: { node: delay, feedback, wet: delayWet, dry: delayDry }, 
        filter,
        eqLow,
        eqMid,
        eqHigh,
        adsr,
        pitchShifter
    };
}

// Connect effects chain for a track
export function connectEffectsChain(source, effects, merger, audioContext, timestretchNode = null) {
    const { gain, panner, filter, eqLow, eqMid, eqHigh, reverb, delay, pitchShifter } = effects;
    
    // Effects chain:
    // source -> gain -> panner -> timestretch (if available) -> pitchShifter (if available) -> eqLow -> eqMid -> eqHigh -> filter -> reverb (wet/dry) -> delay (wet/dry) -> merger
    
    // Wrap all connections in try-catch to make this function idempotent (safe to call multiple times)
    try { source.connect(gain); } catch (e) { /* Already connected */ }
    // Custom panner has input/output properties
    try { 
        if (panner.input) {
            gain.connect(panner.input);
        } else {
            gain.connect(panner);
        }
    } catch (e) { /* Already connected */ }
    
    // Insert timestretch node if available
    let currentNode = panner.output || panner;
    if (timestretchNode) {
        try {
            panner.disconnect();
            if (panner.output) {
                panner.output.disconnect();
            }
            (panner.output || panner).connect(timestretchNode);
            currentNode = timestretchNode;
            console.log('✅ Timestretch node connected in chain');
        } catch (err) {
            console.warn('⚠️ Timestretch node connection failed:', err.message);
            currentNode = panner;
        }
    }
    
    // Insert pitch shifter if available
    // Tone.js v15+ nodes need special connection handling
    let pitchShifterConnected = false;
    if (pitchShifter) {
        try {
            // Disconnect currentNode first to avoid conflicts
            try { currentNode.disconnect(); } catch (e) { /* not connected yet */ }
            
            // Connect using Tone.js's connect method which handles Web Audio bridging
            // currentNode (Web Audio) → pitchShifter.input (Tone.js wraps Web Audio Gain)
            currentNode.connect(pitchShifter.input.input || pitchShifter.input);
            
            // pitchShifter.output (Tone.js CrossFade) → eqLow (Web Audio)
            // Use the internal Web Audio node from the Tone output
            const outputNode = pitchShifter.output.output || pitchShifter.output;
            outputNode.connect(eqLow);
            
            console.log('✅ ' + (timestretchNode ? 'Timestretch → ' : '') + 'Pitch Shifter → 3-Band EQ connected');
            pitchShifterConnected = true;
        } catch (err) {
            console.warn('⚠️ Pitch shifter connection failed:', err.message);
            pitchShifterConnected = false;
        }
    }
    
    // If pitch shifter didn't connect successfully, connect currentNode directly to EQ
    if (!pitchShifterConnected) {
        try { 
            currentNode.connect(eqLow);
            console.log('✅ ' + (timestretchNode ? 'Timestretch → ' : 'Panner → ') + '3-Band EQ direct connection' + (pitchShifter ? ' (pitch shifter failed, using fallback)' : ' (no pitch shifter)'));
        } catch (e) { 
            console.log('ℹ️ ' + (timestretchNode ? 'Timestretch' : 'Panner') + ' → 3-Band EQ: already connected');
        }
    }
    
    // Connect 3-band EQ chain: eqLow -> eqMid -> eqHigh -> filter
    try { eqLow.connect(eqMid); } catch (e) { /* Already connected */ }
    try { eqMid.connect(eqHigh); } catch (e) { /* Already connected */ }
    try { eqHigh.connect(filter); } catch (e) { /* Already connected */ }
    
    // Reverb path
    try { filter.connect(reverb.convolver); } catch (e) { /* Already connected */ }
    try { reverb.convolver.connect(reverb.wet); } catch (e) { /* Already connected */ }
    
    // Dry path
    try { filter.connect(reverb.dry); } catch (e) { /* Already connected */ }
    
    // Merge reverb wet and dry
    const reverbMix = audioContext.createGain();
    try { reverb.wet.connect(reverbMix); } catch (e) { /* Already connected */ }
    try { reverb.dry.connect(reverbMix); } catch (e) { /* Already connected */ }
    
    // Delay path
    try { reverbMix.connect(delay.node); } catch (e) { /* Already connected */ }
    try { delay.node.connect(delay.wet); } catch (e) { /* Already connected */ }
    
    // Dry path
    try { reverbMix.connect(delay.dry); } catch (e) { /* Already connected */ }
    
    // Final merge and connect to mixer
    const finalMix = audioContext.createGain();
    try { delay.wet.connect(finalMix); } catch (e) { /* Already connected */ }
    try { delay.dry.connect(finalMix); } catch (e) { /* Already connected */ }
    
    // Connect to merger - let the panner's stereo output go through naturally
    try { finalMix.connect(merger); } catch (e) { /* Already connected */ }
    
    return { reverbMix, finalMix };
}
