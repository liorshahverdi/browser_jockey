// Keyboard sampler functionality
import { scales, keyboardMap } from './constants.js';

export const MAX_VOICES = 16;

// Play a sampler note
// voiceRegistry: optional Map owned by the caller for voice-stealing. When the
// Map reaches MAX_VOICES the oldest (first-inserted) voice is stopped before the
// new one starts, bounding the number of concurrent AudioBufferSourceNodes.
export function playSamplerNote(samplerAudioBuffer, scaleIndex, isUpperOctave, samplerScale, samplerRoot, samplerVolume, audioContext, recordingDestination, noteNames, merger = null, adsrEnabled = false, adsrParams = null, voiceRegistry = null) {
    if (!samplerAudioBuffer) return;
    
    // Get the scale intervals
    const scaleIntervals = scales[samplerScale];
    if (scaleIndex >= scaleIntervals.length) return;
    
    // Calculate semitone offset
    let semitoneOffset = scaleIntervals[scaleIndex];
    
    // Add octave if upper octave
    if (isUpperOctave && samplerScale !== 'chromatic') {
        semitoneOffset += 12; // One octave up
    }
    
    // Adjust for root note
    const rootNoteIndex = noteNames.indexOf(samplerRoot);
    semitoneOffset += rootNoteIndex;
    
    // Calculate playback rate (each semitone is 2^(1/12))
    const playbackRate = Math.pow(2, semitoneOffset / 12);
    
    // Create buffer source
    const source = audioContext.createBufferSource();
    source.buffer = samplerAudioBuffer;
    source.playbackRate.value = playbackRate;
    
    // Create gain for this note
    const noteGain = audioContext.createGain();
    
    // Apply ADSR envelope if enabled
    if (adsrEnabled && adsrParams) {
        const now = audioContext.currentTime;
        
        // Attack phase
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(samplerVolume, now + adsrParams.attack);
        
        // Decay phase
        const sustainLevel = samplerVolume * adsrParams.sustain;
        noteGain.gain.linearRampToValueAtTime(sustainLevel, now + adsrParams.attack + adsrParams.decay);
        
        // Calculate when to start release. Clamp so it never falls before attack+decay
        // completes — if release > buffer.duration the raw value would be in the past,
        // causing Web Audio to skip attack/decay entirely (BUG-005).
        const minReleaseStart = now + adsrParams.attack + adsrParams.decay;
        const naturalRelease = now + samplerAudioBuffer.duration - adsrParams.release;
        const releaseStartTime = Math.max(minReleaseStart, naturalRelease);
        
        // Sustain (hold at sustain level until release)
        noteGain.gain.setValueAtTime(sustainLevel, releaseStartTime);
        
        // Release phase
        noteGain.gain.linearRampToValueAtTime(0.001, releaseStartTime + adsrParams.release);
        
        console.log(`Playing note with ADSR: A=${adsrParams.attack}s D=${adsrParams.decay}s S=${adsrParams.sustain} R=${adsrParams.release}s`);
    } else {
        // Standard exponential decay (original behavior)
        noteGain.gain.setValueAtTime(samplerVolume, audioContext.currentTime);
        // 0.0001 = −80 dBFS ≈ perceptual silence; 0.01 (−40 dBFS) left an audible
        // discontinuity click when the source stopped abruptly (BUG-012).
        noteGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + samplerAudioBuffer.duration);
    }
    
    // Connect: source -> gain -> merger (master output)
    source.connect(noteGain);
    
    // Route through merger for master output if available
    if (merger) {
        noteGain.connect(merger);
    } else {
        // Fallback to direct destination if merger not available
        noteGain.connect(audioContext.destination);
    }
    
    // Also connect to recording destination if it exists
    if (recordingDestination) {
        noteGain.connect(recordingDestination);
    }
    
    // Voice stealing: evict the oldest voice when at the polyphony limit
    if (voiceRegistry) {
        if (voiceRegistry.size >= MAX_VOICES) {
            const oldestId = voiceRegistry.keys().next().value;
            const oldestSource = voiceRegistry.get(oldestId);
            try { oldestSource.stop(); } catch (e) { /* already stopped */ }
            voiceRegistry.delete(oldestId);
        }
        const voiceId = `${scaleIndex}-${isUpperOctave ? 1 : 0}-${audioContext.currentTime.toFixed(6)}`;
        voiceRegistry.set(voiceId, source);
        source.onended = () => voiceRegistry.delete(voiceId);
    }

    // Play
    source.start(0);

    console.log(`Playing note: scale index ${scaleIndex}, semitone offset ${semitoneOffset}, rate ${playbackRate.toFixed(3)}`);
}

// Handle keyboard down event
export function handleKeyDown(event, samplerEnabled, activeKeys, playSamplerCallback) {
    if (!samplerEnabled) return;
    
    const key = event.key.toUpperCase();
    
    // Prevent default for our keys
    if (key in keyboardMap) {
        event.preventDefault();
        
        // Check if already pressed (prevent key repeat)
        if (activeKeys.has(key)) return;
        activeKeys.add(key);
        
        // Determine if upper or lower octave
        const isUpperOctave = 'QWERTYUI'.includes(key);
        const scaleIndex = keyboardMap[key];
        
        // Play the note
        playSamplerCallback(scaleIndex, isUpperOctave);
        
        // Visual feedback
        const keyElement = document.querySelector(`.key-indicator[data-key="${key}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
        }
    }
}

// Handle keyboard up event
export function handleKeyUp(event, samplerEnabled, activeKeys) {
    if (!samplerEnabled) return;
    
    const key = event.key.toUpperCase();
    
    if (key in keyboardMap) {
        event.preventDefault();
        activeKeys.delete(key);
        
        // Remove visual feedback
        const keyElement = document.querySelector(`.key-indicator[data-key="${key}"]`);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
    }
}

// Enable sampler
export function enableSampler(samplerAudioBuffer, audioContext, samplerElements, samplerState) {
    if (!samplerAudioBuffer) {
        alert('Please select and load a sample source first');
        return false;
    }
    
    samplerState.enabled = true;
    
    // Update UI
    if (samplerElements.enableBtn) {
        samplerElements.enableBtn.style.display = 'none';
    }
    if (samplerElements.disableBtn) {
        samplerElements.disableBtn.style.display = 'inline-block';
    }
    if (samplerElements.keyboardVisual) {
        samplerElements.keyboardVisual.style.display = 'block';
    }
    if (samplerElements.sourceSelect) {
        samplerElements.sourceSelect.disabled = true;
    }
    
    console.log('Keyboard sampler enabled');
    console.log('Scale:', samplerState.scale, 'Root:', samplerState.root);
    
    return true;
}

// Disable sampler
export function disableSampler(activeKeys, samplerElements, samplerState) {
    samplerState.enabled = false;
    activeKeys.clear();
    
    // Update UI
    if (samplerElements.enableBtn) {
        samplerElements.enableBtn.style.display = 'inline-block';
    }
    if (samplerElements.disableBtn) {
        samplerElements.disableBtn.style.display = 'none';
    }
    if (samplerElements.keyboardVisual) {
        samplerElements.keyboardVisual.style.display = 'none';
    }
    if (samplerElements.sourceSelect) {
        samplerElements.sourceSelect.disabled = false;
    }
    
    // Remove active classes from keys
    document.querySelectorAll('.key-indicator').forEach(key => {
        key.classList.remove('active');
    });
    
    console.log('Keyboard sampler disabled');
}
