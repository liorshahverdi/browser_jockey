// Keyboard sampler functionality
import { scales, keyboardMap } from './constants.js';

// Play a sampler note
export function playSamplerNote(samplerAudioBuffer, scaleIndex, isUpperOctave, samplerScale, samplerRoot, samplerVolume, audioContext, recordingDestination, noteNames) {
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
    noteGain.gain.setValueAtTime(samplerVolume, audioContext.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + samplerAudioBuffer.duration);
    
    // Connect: source -> gain -> destination (speakers)
    source.connect(noteGain);
    noteGain.connect(audioContext.destination);
    
    // Also connect to recording destination if it exists
    if (recordingDestination) {
        noteGain.connect(recordingDestination);
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
