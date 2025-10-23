/**
 * Microphone Module
 * Handles microphone input, monitoring, and waveform visualization
 */

/**
 * Enable microphone input
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {ChannelMergerNode} merger - Audio merger node to connect to
 * @returns {Promise<Object>} Microphone state object
 */
export async function enableMicrophone(audioContext, merger) {
    try {
        // Request microphone access
        const micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false
            } 
        });
        
        // Create microphone source
        const micSource = audioContext.createMediaStreamSource(micStream);
        
        // Create gain node for volume control
        const micGain = audioContext.createGain();
        micGain.gain.value = 1.0; // 100%
        
        // Create analyser for visualization
        const micAnalyser = audioContext.createAnalyser();
        micAnalyser.fftSize = 2048;
        
        // Connect: mic -> gain -> analyser
        micSource.connect(micGain);
        micGain.connect(micAnalyser);
        
        // Connect to merger/destination if available
        if (merger) {
            micGain.connect(merger);
        }
        
        console.log('Microphone enabled successfully');
        
        return {
            micStream,
            micSource,
            micGain,
            micAnalyser
        };
    } catch (error) {
        console.error('Error enabling microphone:', error);
        throw new Error('Could not access microphone. Please check your permissions.');
    }
}

/**
 * Disable microphone input and cleanup resources
 * @param {Object} micState - Microphone state object from enableMicrophone
 */
export function disableMicrophone(micState) {
    const { micStream, micSource, micGain, micAnalyser } = micState;
    
    if (micStream) {
        // Stop all tracks
        micStream.getTracks().forEach(track => track.stop());
    }
    
    if (micSource) {
        micSource.disconnect();
    }
    
    if (micGain) {
        micGain.disconnect();
    }
    
    console.log('Microphone disabled');
}

/**
 * Draw microphone waveform visualization
 * @param {HTMLCanvasElement} canvas - Canvas element to draw on
 * @param {AnalyserNode} micAnalyser - Microphone analyser node
 * @param {boolean} enabled - Whether microphone is enabled
 * @returns {number} Animation frame ID
 */
export function drawMicWaveform(canvas, micAnalyser, enabled) {
    if (!micAnalyser || !enabled) {
        return null;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    const bufferLength = micAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        if (!enabled) return;
        
        const animationId = requestAnimationFrame(draw);
        
        micAnalyser.getByteTimeDomainData(dataArray);
        
        // Clear canvas
        ctx.fillStyle = 'rgba(20, 20, 30, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw waveform
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.strokeStyle = '#00ff88';
        ctx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        return animationId;
    }
    
    return draw();
}

/**
 * Update microphone volume
 * @param {GainNode} micGain - Microphone gain node
 * @param {number} volume - Volume value (0-100)
 */
export function updateMicVolume(micGain, volume) {
    if (micGain) {
        micGain.gain.value = volume / 100;
    }
}
