// Camera-based Theremin instrument
import { noteFrequencies } from './constants.js';

let thereminState = {
    enabled: false,
    oscillator: null,
    gainNode: null,
    routingGain: null,  // For master routing control
    masterVolume: 0.5,  // Master volume multiplier (0-1)
    videoStream: null,
    videoElement: null,
    canvasElement: null,
    canvasContext: null,
    animationFrame: null,
    lastHandPosition: { x: 0.5, y: 0.5 },
    smoothedPosition: { x: 0.5, y: 0.5 },
    previousFrame: null,  // For motion detection
    minFreq: 200,  // Low C
    maxFreq: 2000, // High C
    audioContext: null,
    waveform: 'sine',
    filterNode: null,
    vibratoLFO: null,
    vibratoGain: null,
    reverbNode: null,
    trackingMode: 'motion',  // 'motion' or 'brightness'
    audioSource: 'oscillator',  // 'oscillator', 'track1', or 'track2'
    externalSource: null,  // Reference to external audio source node
    sourceGain: null,  // Gain node for external source routing
    handDetected: false,  // Whether a hand is currently detected
    handConfidence: 0,  // Confidence level (0-1) that a hand is present
    detectionThreshold: 0.6,  // Minimum confidence to trigger modulation
    detectionSensitivity: 1.5,  // Sensitivity multiplier (1.0 = normal, 2.0 = more sensitive, 0.5 = less sensitive)
    requireHandDetection: false,  // If false, only wave detection is needed (easier in varied lighting)
    baselineScore: 0,  // Baseline motion score (no hand)
    calibrationFrames: 0,  // Frame counter for calibration
    maxScoreHistory: [],  // Track recent max scores for adaptive thresholding
    // Wave detection state
    positionHistory: [],  // Track X positions over time
    waveDetected: false,  // Whether waving motion is detected
    lastWaveTime: 0,  // Timestamp of last detected wave
    waveActive: false,  // Whether we're in "active" mode from waving
    lastSoundUpdateState: false,  // Track state transitions for logging
    externalSourceLogCounter: 0,  // Counter for periodic logging
    // Mapping mode for motion control
    mappingMode: 'pitch-volume',  // 'pitch-volume', 'filter-resonance', 'adsr'
    // ADSR envelope parameters
    adsr: {
        attack: 0.01,   // Attack time in seconds (0.001 to 2)
        decay: 0.1,     // Decay time in seconds (0.001 to 2)
        sustain: 0.7,   // Sustain level (0 to 1)
        release: 0.3    // Release time in seconds (0.001 to 5)
    }
};

// Initialize theremin
export async function initializeThereminCamera(audioContext, thereminElements, recordingDestination) {
    try {
        console.log('Requesting camera access...');
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            } 
        });
        
        console.log('Camera access granted');
        
        thereminState.videoStream = stream;
        thereminState.audioContext = audioContext;
        
        // Set up video element
        thereminState.videoElement = thereminElements.videoElement;
        thereminState.videoElement.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            thereminState.videoElement.onloadedmetadata = () => {
                console.log('Video metadata loaded:', thereminState.videoElement.videoWidth, 'x', thereminState.videoElement.videoHeight);
                resolve();
            };
        });
        
        await thereminState.videoElement.play();
        console.log('Video playing');
        
        // Set up canvas for motion detection
        thereminState.canvasElement = thereminElements.canvasElement;
        thereminState.canvasContext = thereminState.canvasElement.getContext('2d');
        
        console.log('Camera initialized for theremin');
        return true;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Camera access denied. Please allow camera access to use the theremin.');
        return false;
    }
}

// Enable theremin
export async function enableTheremin(audioContext, thereminElements, recordingDestination, merger = null) {
    console.log('enableTheremin called, current state:', thereminState.enabled);
    
    if (thereminState.enabled) {
        console.log('Theremin already enabled, returning');
        return true;
    }
    
    // Initialize camera if not already done
    if (!thereminState.videoStream) {
        console.log('Initializing camera...');
        const success = await initializeThereminCamera(audioContext, thereminElements, recordingDestination);
        if (!success) {
            console.error('Camera initialization failed');
            return false;
        }
    }
    
    console.log('Setting up audio nodes...');
    thereminState.enabled = true;
    thereminState.audioContext = audioContext;
    
    // Reset hand detection state
    thereminState.handDetected = false;
    thereminState.handConfidence = 0;
    thereminState.baselineScore = 0;
    thereminState.calibrationFrames = 0;
    thereminState.maxScoreHistory = [];
    console.log('Hand detection calibration reset');
    
    // Create audio nodes
    thereminState.oscillator = audioContext.createOscillator();
    thereminState.gainNode = audioContext.createGain();
    thereminState.filterNode = audioContext.createBiquadFilter();
    thereminState.routingGain = audioContext.createGain();  // For routing control
    
    // Create vibrato (LFO)
    thereminState.vibratoLFO = audioContext.createOscillator();
    thereminState.vibratoGain = audioContext.createGain();
    
    // Configure vibrato
    thereminState.vibratoLFO.frequency.value = 5; // 5 Hz vibrato
    thereminState.vibratoGain.gain.value = 10; // Vibrato depth in Hz
    
    // Create simple reverb using convolver
    thereminState.reverbNode = audioContext.createConvolver();
    const reverbBuffer = createReverbImpulse(audioContext, 2, 2);
    thereminState.reverbNode.buffer = reverbBuffer;
    
    // Set up filter
    thereminState.filterNode.type = 'lowpass';
    thereminState.filterNode.frequency.value = 2000;
    thereminState.filterNode.Q.value = 1;
    
    // Set waveform
    thereminState.oscillator.type = thereminState.waveform;
    
    // Initial frequency and volume
    thereminState.oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    thereminState.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    
    console.log('Connecting audio nodes...');
    
    // Connect vibrato: vibratoLFO -> vibratoGain -> oscillator.frequency
    thereminState.vibratoLFO.connect(thereminState.vibratoGain);
    thereminState.vibratoGain.connect(thereminState.oscillator.frequency);
    
    // Create dry/wet mixer for reverb
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    dryGain.gain.value = 0.7;
    wetGain.gain.value = 0.3;
    
    // Connect audio chain: oscillator -> filter -> gain -> [dry/wet] -> routingGain
    thereminState.oscillator.connect(thereminState.filterNode);
    thereminState.filterNode.connect(thereminState.gainNode);
    
    // Dry path
    thereminState.gainNode.connect(dryGain);
    dryGain.connect(thereminState.routingGain);
    
    // Wet path (reverb)
    thereminState.gainNode.connect(thereminState.reverbNode);
    thereminState.reverbNode.connect(wetGain);
    wetGain.connect(thereminState.routingGain);
    
    // Connect routing gain to destination and merger (if available)
    thereminState.routingGain.connect(audioContext.destination);
    
    if (merger) {
        thereminState.routingGain.connect(merger);
        console.log('Theremin connected to master mixer');
    }
    
    // Connect to recording destination if available
    if (recordingDestination) {
        thereminState.routingGain.connect(recordingDestination);
    }
    
    console.log('Starting oscillators...');
    
    // Start oscillators
    thereminState.oscillator.start(0);
    thereminState.vibratoLFO.start(0);
    
    console.log('Starting motion tracking...');
    
    // Start motion tracking
    startMotionTracking();
    
    // Update UI
    if (thereminElements.enableBtn) {
        thereminElements.enableBtn.style.display = 'none';
    }
    if (thereminElements.disableBtn) {
        thereminElements.disableBtn.style.display = 'inline-block';
    }
    if (thereminElements.videoContainer) {
        thereminElements.videoContainer.style.display = 'block';
    }
    if (thereminElements.settingsContainer) {
        thereminElements.settingsContainer.style.display = 'block';
    }
    
    console.log('Theremin enabled successfully');
    return true;
}

// Disable theremin
export function disableTheremin(thereminElements) {
    if (!thereminState.enabled) return;
    
    thereminState.enabled = false;
    
    // Stop motion tracking
    if (thereminState.animationFrame) {
        cancelAnimationFrame(thereminState.animationFrame);
        thereminState.animationFrame = null;
    }
    
    // Stop and disconnect audio nodes
    if (thereminState.oscillator) {
        thereminState.oscillator.stop();
        thereminState.oscillator.disconnect();
        thereminState.oscillator = null;
    }
    
    if (thereminState.vibratoLFO) {
        thereminState.vibratoLFO.stop();
        thereminState.vibratoLFO.disconnect();
        thereminState.vibratoLFO = null;
    }
    
    if (thereminState.sourceGain) {
        thereminState.sourceGain.disconnect();
        thereminState.sourceGain = null;
    }
    
    if (thereminState.gainNode) {
        thereminState.gainNode.disconnect();
        thereminState.gainNode = null;
    }
    
    if (thereminState.routingGain) {
        thereminState.routingGain.disconnect();
        thereminState.routingGain = null;
    }
    
    if (thereminState.filterNode) {
        thereminState.filterNode.disconnect();
        thereminState.filterNode = null;
    }
    
    // Clear external source reference
    thereminState.externalSource = null;
    
    // Update UI
    if (thereminElements.enableBtn) {
        thereminElements.enableBtn.style.display = 'inline-block';
    }
    if (thereminElements.disableBtn) {
        thereminElements.disableBtn.style.display = 'none';
    }
    if (thereminElements.settingsContainer) {
        thereminElements.settingsContainer.style.display = 'none';
    }
    
    console.log('Theremin disabled');
}

// Start motion tracking
function startMotionTracking() {
    if (!thereminState.enabled || !thereminState.videoElement) return;
    
    console.log('🎬 Starting motion tracking loop...');
    
    const canvas = thereminState.canvasElement;
    const ctx = thereminState.canvasContext;
    const video = thereminState.videoElement;
    
    // Create a temporary canvas for motion detection
    const detectionCanvas = document.createElement('canvas');
    const detectionCtx = detectionCanvas.getContext('2d', { willReadFrequently: true });
    
    function detectMotion() {
        if (!thereminState.enabled) return;
        
        // Log every 120 frames (2 seconds at 60fps) to confirm loop is running
        if (!thereminState.motionDetectionFrameCounter) thereminState.motionDetectionFrameCounter = 0;
        thereminState.motionDetectionFrameCounter++;
        if (thereminState.motionDetectionFrameCounter % 120 === 1) {
            console.log('📹 Motion detection loop running (frame ' + thereminState.motionDetectionFrameCounter + ')');
        }
        
        // Ensure video is ready
        if (video.readyState < 2) {
            thereminState.animationFrame = requestAnimationFrame(detectMotion);
            return;
        }
        
        // Set canvas sizes to match video dimensions
        const vWidth = video.videoWidth || 640;
        const vHeight = video.videoHeight || 480;
        
        detectionCanvas.width = vWidth;
        detectionCanvas.height = vHeight;
        canvas.width = vWidth;
        canvas.height = vHeight;
        
        // Draw video frame to detection canvas
        detectionCtx.drawImage(video, 0, 0, vWidth, vHeight);
        
        // Get image data
        const imageData = detectionCtx.getImageData(0, 0, vWidth, vHeight);
        const data = imageData.data;
        
        // Enhanced motion detection: combine brightness, contrast, and motion
        let maxScore = 0;
        let bestX = vWidth / 2;
        let bestY = vHeight / 2;
        
        const blockSize = 12; // Smaller blocks for better precision
        const gridCols = Math.floor(vWidth / blockSize);
        const gridRows = Math.floor(vHeight / blockSize);
        
        // Analyze each block
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const x = col * blockSize;
                const y = row * blockSize;
                
                let brightness = 0;
                let variance = 0;
                let edgeStrength = 0;
                let pixelCount = 0;
                
                // Sample pixels in this block
                for (let dy = 0; dy < blockSize && y + dy < vHeight; dy++) {
                    for (let dx = 0; dx < blockSize && x + dx < vWidth; dx++) {
                        const i = ((y + dy) * vWidth + (x + dx)) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        
                        // Calculate brightness
                        const pixelBrightness = (r + g + b) / 3;
                        brightness += pixelBrightness;
                        
                        // Calculate color variance (edge detection)
                        variance += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
                        
                        // Simple edge detection (compare with neighbor)
                        if (dx > 0 && dy > 0) {
                            const prevI = ((y + dy - 1) * vWidth + (x + dx - 1)) * 4;
                            const prevR = data[prevI];
                            const prevG = data[prevI + 1];
                            const prevB = data[prevI + 2];
                            edgeStrength += Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
                        }
                        
                        pixelCount++;
                    }
                }
                
                if (pixelCount > 0) {
                    brightness /= pixelCount;
                    variance /= pixelCount;
                    edgeStrength /= pixelCount;
                    
                    // Weighted score: favor areas with high variance (color changes) and moderate brightness
                    // This tends to detect hands/movement better than pure brightness
                    const brightnessScore = brightness > 50 && brightness < 200 ? brightness : 0;
                    const score = variance * 2.0 + edgeStrength * 1.5 + brightnessScore * 0.3;
                    
                    if (score > maxScore) {
                        maxScore = score;
                        bestX = x + blockSize / 2;
                        bestY = y + blockSize / 2;
                    }
                }
            }
        }
        
        // Hand presence detection with adaptive thresholding
        // Calibrate baseline during first 30 frames (about 0.5 seconds)
        if (thereminState.calibrationFrames < 30) {
            thereminState.baselineScore = Math.max(thereminState.baselineScore, maxScore * 0.5);
            thereminState.calibrationFrames++;
        }
        
        // Track score history for adaptive threshold
        thereminState.maxScoreHistory.push(maxScore);
        if (thereminState.maxScoreHistory.length > 10) {
            thereminState.maxScoreHistory.shift();
        }
        
        // Calculate average recent score
        const avgRecentScore = thereminState.maxScoreHistory.reduce((a, b) => a + b, 0) / thereminState.maxScoreHistory.length;
        
        // Adaptive threshold: hand must be significantly above baseline
        // Use sensitivity multiplier to adjust threshold
        const baseMultiplier = 2.0 / thereminState.detectionSensitivity; // Higher sensitivity = lower multiplier
        const dynamicThreshold = Math.max(
            thereminState.baselineScore * baseMultiplier,
            avgRecentScore * (0.6 / thereminState.detectionSensitivity)
        );
        
        // Update hand confidence based on score
        if (maxScore > dynamicThreshold) {
            // Hand likely present - increase confidence
            thereminState.handConfidence = Math.min(1.0, thereminState.handConfidence + 0.15);
        } else {
            // No clear hand - decrease confidence
            thereminState.handConfidence = Math.max(0.0, thereminState.handConfidence - 0.08);
        }
        
        // Determine if hand is detected based on confidence threshold
        const wasDetected = thereminState.handDetected;
        thereminState.handDetected = thereminState.handConfidence >= thereminState.detectionThreshold;
        
        // Log state changes for debugging
        if (wasDetected !== thereminState.handDetected) {
            console.log(`Hand ${thereminState.handDetected ? 'DETECTED' : 'LOST'} (confidence: ${thereminState.handConfidence.toFixed(2)}, score: ${maxScore.toFixed(0)}, threshold: ${dynamicThreshold.toFixed(0)})`);
        }
        
        // Periodic logging to show detection status (every 3 seconds)
        if (thereminState.motionDetectionFrameCounter % 180 === 0) {
            console.log(`🔍 Detection status: confidence=${thereminState.handConfidence.toFixed(2)}, maxScore=${maxScore.toFixed(0)}, threshold=${dynamicThreshold.toFixed(0)}, baseline=${thereminState.baselineScore.toFixed(0)}`);
        }
        
        // Normalize coordinates (0 to 1)
        // Mirror X coordinate because video is mirrored with scaleX(-1) in CSS
        // This ensures the crosshair and sound control match what you see
        const normalizedX = 1 - (bestX / vWidth);  // Mirrored
        const normalizedY = bestY / vHeight;
        
        // Check for waving motion (only if hand is detected)
        if (thereminState.handDetected) {
            detectWave(normalizedX);
        }
        
        // Improved smoothing with momentum
        const smoothing = 0.75; // Slightly less smoothing for more responsiveness
        const momentum = 0.05; // Small momentum factor
        
        const targetX = normalizedX;
        const targetY = normalizedY;
        const currentX = thereminState.smoothedPosition.x;
        const currentY = thereminState.smoothedPosition.y;
        const lastX = thereminState.lastHandPosition.x;
        const lastY = thereminState.lastHandPosition.y;
        
        // Calculate velocity
        const velocityX = lastX - currentX;
        const velocityY = lastY - currentY;
        
        // Apply smoothing with momentum
        thereminState.smoothedPosition.x = currentX * smoothing + targetX * (1 - smoothing) + velocityX * momentum;
        thereminState.smoothedPosition.y = currentY * smoothing + targetY * (1 - smoothing) + velocityY * momentum;
        
        // Clamp to valid range
        thereminState.smoothedPosition.x = Math.max(0, Math.min(1, thereminState.smoothedPosition.x));
        thereminState.smoothedPosition.y = Math.max(0, Math.min(1, thereminState.smoothedPosition.y));
        
        // Store current as last for next frame
        thereminState.lastHandPosition.x = currentX;
        thereminState.lastHandPosition.y = currentY;
        
        // Update theremin parameters based on detection mode
        // If requireHandDetection is false, only wave detection is needed
        const shouldPlaySound = thereminState.requireHandDetection 
            ? (thereminState.handDetected && thereminState.waveActive)
            : thereminState.waveActive;
        
        if (shouldPlaySound) {
            updateThereminSound(thereminState.smoothedPosition, thereminState.handConfidence);
        } else {
            // Fade out when conditions not met
            // Log why we're fading out (only when we transition from active to inactive)
            if (thereminState.lastSoundUpdateState === true) {
                if (thereminState.requireHandDetection) {
                    console.log(`🔇 Fading out theremin: handDetected=${thereminState.handDetected}, waveActive=${thereminState.waveActive}`);
                } else {
                    console.log(`🔇 Fading out theremin: waveActive=${thereminState.waveActive}`);
                }
                thereminState.lastSoundUpdateState = false;
            }
            fadeOutThereminSound();
        }
        
        // Clear overlay canvas and draw indicator
        // Mirror the X coordinate for drawing to match the mirrored video display
        const mirroredX = vWidth - bestX;
        ctx.clearRect(0, 0, vWidth, vHeight);
        drawMotionIndicator(ctx, mirroredX, bestY, vWidth, vHeight, thereminState.handDetected, thereminState.handConfidence, thereminState.waveActive);
        
        thereminState.animationFrame = requestAnimationFrame(detectMotion);
    }
    
    detectMotion();
}

// Detect waving motion (repeated left-right movement)
function detectWave(currentX) {
    // Add current position to history
    thereminState.positionHistory.push({
        x: currentX,
        timestamp: Date.now()
    });
    
    // Keep only last 30 frames (0.5 seconds at 60fps)
    if (thereminState.positionHistory.length > 30) {
        thereminState.positionHistory.shift();
    }
    
    // Need at least 20 frames to detect a wave
    if (thereminState.positionHistory.length < 20) {
        return false;
    }
    
    // Detect oscillation by finding direction changes
    let directionChanges = 0;
    let lastDirection = 0; // 0 = none, 1 = right, -1 = left
    let totalMovement = 0;
    
    for (let i = 1; i < thereminState.positionHistory.length; i++) {
        const current = thereminState.positionHistory[i];
        const previous = thereminState.positionHistory[i - 1];
        const movement = current.x - previous.x;
        
        // Track total movement amount
        totalMovement += Math.abs(movement);
        
        // Determine direction (with threshold to ignore tiny movements)
        if (Math.abs(movement) > 0.02) { // Significant movement
            const currentDirection = movement > 0 ? 1 : -1;
            
            // Count direction change
            if (lastDirection !== 0 && currentDirection !== lastDirection) {
                directionChanges++;
            }
            
            lastDirection = currentDirection;
        }
    }
    
    // Calculate movement range
    const xPositions = thereminState.positionHistory.map(p => p.x);
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);
    const range = maxX - minX;
    
    // Wave detected if:
    // - At least 2 direction changes (back and forth motion) - RELAXED from 3
    // - Range of movement is significant (at least 15% of screen) - RELAXED from 20%
    // - Total movement indicates active motion - RELAXED from 0.5
    const waveDetected = directionChanges >= 2 && range > 0.15 && totalMovement > 0.3;
    
    // Debug logging every 30 frames (0.5 seconds) when hand detected but wave not active
    if (thereminState.positionHistory.length === 30 && !thereminState.waveActive && thereminState.handDetected) {
        console.log(`🔍 Wave check: changes=${directionChanges}, range=${(range*100).toFixed(0)}%, movement=${totalMovement.toFixed(2)} | Need: changes≥2, range≥15%, movement≥0.3`);
    }
    
    if (waveDetected && !thereminState.waveDetected) {
        console.log(`👋 WAVE DETECTED! (changes: ${directionChanges}, range: ${(range*100).toFixed(0)}%, movement: ${totalMovement.toFixed(2)})`);
        thereminState.lastWaveTime = Date.now();
        thereminState.waveActive = true;
    }
    
    thereminState.waveDetected = waveDetected;
    
    // Deactivate after 10 seconds of no waving
    if (Date.now() - thereminState.lastWaveTime > 10000) {
        if (thereminState.waveActive) {
            console.log('🛑 Wave mode deactivated (timeout)');
            thereminState.waveActive = false;
        }
    }
    
    return thereminState.waveActive;
}

// Update theremin sound based on hand position
function updateThereminSound(position, confidence = 1.0) {
    if (!thereminState.enabled || !thereminState.gainNode) return;
    
    // Log state change when we start updating sound
    if (thereminState.lastSoundUpdateState === false) {
        console.log(`🔊 Theremin sound active! Source: ${thereminState.audioSource}, Mode: ${thereminState.mappingMode}`);
        thereminState.lastSoundUpdateState = true;
    }
    
    const now = thereminState.audioContext.currentTime;
    
    if (thereminState.audioSource === 'oscillator') {
        // Oscillator mode with different mapping options
        if (!thereminState.oscillator) return;
        
        switch (thereminState.mappingMode) {
            case 'pitch-volume':
                // Y axis controls pitch (inverted: top = high, bottom = low)
                const pitchNormalized = 1 - position.y;
                const frequency = thereminState.minFreq + (thereminState.maxFreq - thereminState.minFreq) * pitchNormalized;
                
                // X axis controls volume (left = quiet, right = loud)
                const baseVolume = position.x * 0.5; // Max 0.5 to prevent clipping
                const volume = baseVolume * thereminState.masterVolume * confidence;
                
                // Smooth transitions
                thereminState.oscillator.frequency.linearRampToValueAtTime(frequency, now + 0.05);
                thereminState.gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
                
                // Update filter cutoff based on position
                const filterFreq1 = 500 + position.x * 3500;
                thereminState.filterNode.frequency.linearRampToValueAtTime(filterFreq1, now + 0.05);
                
                updateDisplayValues(frequency, baseVolume);
                break;
                
            case 'filter-resonance':
                // Y axis controls filter cutoff (top = bright, bottom = dark)
                const filterNormalized = 1 - position.y;
                const filterFreq2 = 100 + filterNormalized * 10000; // 100Hz to 10kHz
                
                // X axis controls filter resonance (Q)
                const filterQ = 0.5 + position.x * 20; // 0.5 to 20.5
                
                // Fixed volume based on master
                const fixedVolume = 0.3 * thereminState.masterVolume * confidence;
                
                thereminState.filterNode.frequency.linearRampToValueAtTime(filterFreq2, now + 0.05);
                thereminState.filterNode.Q.linearRampToValueAtTime(filterQ, now + 0.05);
                thereminState.gainNode.gain.linearRampToValueAtTime(fixedVolume, now + 0.05);
                
                updateDisplayValues(filterFreq2, filterQ, 'Filter', 'Q');
                break;
                
            case 'adsr':
                // Y axis controls Attack (top) to Release (bottom)
                // X axis controls Decay (left) to Sustain (right)
                
                // Map Y: 0 (top) to 1 (bottom)
                const yParam = position.y;
                
                // Map X: 0 (left) to 1 (right)
                const xParam = position.x;
                
                // Y controls Attack (top half) and Release (bottom half)
                if (yParam < 0.5) {
                    // Top half: control attack (0.001s to 2s)
                    thereminState.adsr.attack = 0.001 + (yParam * 2) * 1.999;
                } else {
                    // Bottom half: control release (0.001s to 5s)
                    thereminState.adsr.release = 0.001 + ((yParam - 0.5) * 2) * 4.999;
                }
                
                // X controls Decay (left half) and Sustain (right half)
                if (xParam < 0.5) {
                    // Left half: control decay (0.001s to 2s)
                    thereminState.adsr.decay = 0.001 + (xParam * 2) * 1.999;
                } else {
                    // Right half: control sustain (0 to 1)
                    thereminState.adsr.sustain = (xParam - 0.5) * 2;
                }
                
                // Apply ADSR envelope to current note
                applyADSREnvelope(now);
                
                updateDisplayValues(
                    thereminState.adsr.attack.toFixed(3), 
                    thereminState.adsr.decay.toFixed(3),
                    'A',
                    'D'
                );
                break;
        }
        
    } else {
        // External source mode (track1/track2)
        
        // Log every 60 frames (once per second at 60fps) to show values being applied
        if (!thereminState.externalSourceLogCounter) thereminState.externalSourceLogCounter = 0;
        thereminState.externalSourceLogCounter++;
        const shouldLog = thereminState.externalSourceLogCounter % 60 === 0;
        
        switch (thereminState.mappingMode) {
            case 'pitch-volume':
            case 'filter-resonance':
                // Y axis controls filter cutoff (top = bright, bottom = dark)
                const filterNormalized = 1 - position.y;
                const filterFreq = 100 + filterNormalized * 10000; // 100Hz to 10kHz
                
                // X axis controls volume
                const baseVolume = position.x; // 0 to 1
                const volume = baseVolume * thereminState.masterVolume * confidence;
                
                if (shouldLog) {
                    console.log(`🎛️ External source: Filter=${filterFreq.toFixed(0)}Hz, Volume=${(volume*100).toFixed(0)}%`);
                }
                
                // Smooth transitions
                thereminState.filterNode.frequency.linearRampToValueAtTime(filterFreq, now + 0.05);
                thereminState.gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
                
                // Adjust filter Q (resonance) based on Y position for more dramatic effect
                const filterQ = 0.5 + position.y * 10; // Lower when hand is high, higher when low
                thereminState.filterNode.Q.linearRampToValueAtTime(filterQ, now + 0.05);
                
                updateDisplayValues(filterFreq, baseVolume);
                break;
                
            case 'adsr':
                // For external sources, ADSR affects the gain envelope
                const yParam = position.y;
                const xParam = position.x;
                
                if (yParam < 0.5) {
                    thereminState.adsr.attack = 0.001 + (yParam * 2) * 1.999;
                } else {
                    thereminState.adsr.release = 0.001 + ((yParam - 0.5) * 2) * 4.999;
                }
                
                if (xParam < 0.5) {
                    thereminState.adsr.decay = 0.001 + (xParam * 2) * 1.999;
                } else {
                    thereminState.adsr.sustain = (xParam - 0.5) * 2;
                }
                
                // Apply ADSR to external source gain
                applyADSREnvelope(now);
                
                updateDisplayValues(
                    thereminState.adsr.attack.toFixed(3), 
                    thereminState.adsr.decay.toFixed(3),
                    'A',
                    'D'
                );
                break;
        }
    }
}

// Apply ADSR envelope to the gain node
function applyADSREnvelope(startTime) {
    if (!thereminState.gainNode) return;
    
    const gain = thereminState.gainNode.gain;
    const now = startTime || thereminState.audioContext.currentTime;
    const targetVolume = 0.4 * thereminState.masterVolume; // Max volume for ADSR mode
    
    // Cancel any scheduled changes
    gain.cancelScheduledValues(now);
    
    // Attack: ramp from 0 to full volume
    gain.setValueAtTime(0, now);
    gain.linearRampToValueAtTime(targetVolume, now + thereminState.adsr.attack);
    
    // Decay: ramp to sustain level
    const sustainVolume = targetVolume * thereminState.adsr.sustain;
    gain.linearRampToValueAtTime(sustainVolume, now + thereminState.adsr.attack + thereminState.adsr.decay);
    
    // Sustain is maintained until release (handled in fadeOutThereminSound)
}

// Fade out theremin sound when no hand detected
function fadeOutThereminSound() {
    if (!thereminState.enabled || !thereminState.gainNode) return;
    
    const now = thereminState.audioContext.currentTime;
    
    // Use ADSR release time in ADSR mode, otherwise quick fade
    const fadeTime = thereminState.mappingMode === 'adsr' ? thereminState.adsr.release : 0.2;
    
    // Fade to zero
    thereminState.gainNode.gain.cancelScheduledValues(now);
    thereminState.gainNode.gain.setValueAtTime(thereminState.gainNode.gain.value, now);
    thereminState.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
}

// Update display values in the UI
function updateDisplayValues(value1, value2, label1 = 'Freq', label2 = 'Vol') {
    const freqDisplay = document.getElementById('thereminFreqDisplay');
    const volDisplay = document.getElementById('thereminVolDisplay');
    const freqLabel = document.getElementById('thereminFreqLabel');
    const volLabel = document.getElementById('thereminVolLabel');
    
    if (freqLabel) {
        freqLabel.textContent = label1;
    }
    if (volLabel) {
        volLabel.textContent = label2;
    }
    
    if (freqDisplay) {
        if (typeof value1 === 'number' && value1 > 10) {
            freqDisplay.textContent = Math.round(value1);
        } else {
            freqDisplay.textContent = value1;
        }
    }
    if (volDisplay) {
        if (label2 === 'Vol') {
            volDisplay.textContent = Math.round(value2 * 200) + '%'; // Convert to percentage (0-100)
        } else if (label2 === 'Q') {
            volDisplay.textContent = value2.toFixed(1);
        } else {
            volDisplay.textContent = value2;
        }
    }
}

// Draw motion indicator on canvas
function drawMotionIndicator(ctx, x, y, width, height, handDetected = false, confidence = 0, waveActive = false) {
    // Color based on detection status
    if (waveActive) {
        // Bright green when wave is active (theremin is on)
        ctx.strokeStyle = '#00ff00';
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
    } else if (handDetected) {
        // Orange/yellow when hand is detected but waiting for wave
        ctx.strokeStyle = '#ffaa00';
        ctx.fillStyle = '#ffaa00';
        ctx.shadowColor = '#ffaa00';
    } else if (confidence > 0.3) {
        // Yellow when hand might be present but not confident enough
        ctx.strokeStyle = '#ffff00';
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
    } else {
        // Cyan when searching/no hand
        ctx.strokeStyle = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
    }
    
    ctx.lineWidth = waveActive ? 5 : (handDetected ? 3 : 2); // Thickest when active
    ctx.shadowBlur = waveActive ? 25 : (handDetected ? 15 : 10); // Most glow when active
    
    // Draw crosshair at detected position
    const crosshairSize = waveActive ? 50 : (handDetected ? 40 : 30); // Largest when active
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - crosshairSize, y);
    ctx.lineTo(x + crosshairSize, y);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - crosshairSize);
    ctx.lineTo(x, y + crosshairSize);
    ctx.stroke();
    
    // Circle
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw confidence indicator (small bar at bottom left to avoid overlay conflict)
    if (confidence > 0) {
        const barWidth = 100;
        const barHeight = 10;
        const barX = 10;
        const barY = height - 30; // Position near bottom instead of top
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Confidence level (colored based on detection)
        if (waveActive) {
            ctx.fillStyle = '#00ff00';
        } else if (handDetected) {
            ctx.fillStyle = '#ffaa00';
        } else if (confidence > 0.3) {
            ctx.fillStyle = '#ffff00';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        ctx.fillRect(barX, barY, barWidth * confidence, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Text label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.shadowBlur = 0;
        const statusText = waveActive ? 'ACTIVE ✓' : (handDetected ? 'Wave to activate 👋' : 'Searching...');
        ctx.fillText(statusText, barX + barWidth + 10, barY + 9);
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
}

// Create reverb impulse response
function createReverbImpulse(audioContext, duration, decay) {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const leftChannel = impulse.getChannelData(0);
    const rightChannel = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        const n = length - i;
        leftChannel[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
        rightChannel[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
    
    return impulse;
}

// Change waveform
export function changeThereminWaveform(waveform) {
    thereminState.waveform = waveform;
    
    if (thereminState.enabled && thereminState.oscillator) {
        thereminState.oscillator.type = waveform;
    }
}

// Change frequency range
export function changeThereminRange(minFreq, maxFreq) {
    thereminState.minFreq = minFreq;
    thereminState.maxFreq = maxFreq;
}

// Change vibrato settings
export function changeThereminVibrato(rate, depth) {
    if (thereminState.vibratoLFO) {
        thereminState.vibratoLFO.frequency.value = rate;
    }
    if (thereminState.vibratoGain) {
        thereminState.vibratoGain.gain.value = depth;
    }
}

// Change theremin master volume
export function changeThereminVolume(volume) {
    thereminState.masterVolume = volume;
}

// Set theremin audio source
export function setThereminAudioSource(sourceType, externalSourceNode = null) {
    console.log('Setting theremin audio source to:', sourceType);
    
    if (!thereminState.enabled || !thereminState.audioContext) {
        console.log('Theremin not enabled, just updating source type');
        thereminState.audioSource = sourceType;
        return;
    }
    
    const audioContext = thereminState.audioContext;
    
    // Disconnect existing connections
    if (thereminState.oscillator && thereminState.audioSource === 'oscillator') {
        thereminState.oscillator.disconnect();
    }
    
    if (thereminState.sourceGain && (thereminState.audioSource === 'track1' || thereminState.audioSource === 'track2')) {
        thereminState.sourceGain.disconnect();
    }
    
    // Update source type
    thereminState.audioSource = sourceType;
    
    if (sourceType === 'oscillator') {
        // Reconnect oscillator path
        console.log('Switching to oscillator mode');
        
        // Connect vibrato back to oscillator
        if (thereminState.vibratoGain && thereminState.oscillator) {
            thereminState.vibratoGain.disconnect();
            thereminState.vibratoGain.connect(thereminState.oscillator.frequency);
        }
        
        // Connect oscillator -> filter -> gainNode
        if (thereminState.oscillator && thereminState.filterNode) {
            thereminState.oscillator.connect(thereminState.filterNode);
        }
        
        thereminState.externalSource = null;
        
    } else if (sourceType === 'track1' || sourceType === 'track2') {
        // Use external audio source (track)
        console.log('Switching to external source mode:', sourceType);
        
        if (!externalSourceNode) {
            console.error('External source node not provided');
            return;
        }
        
        // Create a gain node for the external source if it doesn't exist
        if (!thereminState.sourceGain) {
            thereminState.sourceGain = audioContext.createGain();
        }
        
        thereminState.externalSource = externalSourceNode;
        
        // Disconnect vibrato from oscillator (not used with external sources)
        if (thereminState.vibratoGain) {
            thereminState.vibratoGain.disconnect();
        }
        
        // Connect external source through theremin effects
        // externalSource -> sourceGain -> filter -> gainNode
        try {
            externalSourceNode.connect(thereminState.sourceGain);
            thereminState.sourceGain.connect(thereminState.filterNode);
            console.log('External source connected through theremin effects');
        } catch (error) {
            console.error('Error connecting external source:', error);
        }
    }
    
    // Ensure filter is always connected to gainNode
    if (thereminState.filterNode && thereminState.gainNode) {
        try {
            thereminState.filterNode.connect(thereminState.gainNode);
        } catch (e) {
            // Already connected, ignore
        }
    }
}

// Set theremin mapping mode
export function setThereminMappingMode(mode) {
    console.log('Setting theremin mapping mode to:', mode);
    thereminState.mappingMode = mode;
    
    // Update display labels based on mode
    const freqLabel = document.getElementById('thereminFreqLabel');
    const volLabel = document.getElementById('thereminVolLabel');
    
    if (freqLabel && volLabel) {
        switch (mode) {
            case 'pitch-volume':
                freqLabel.textContent = 'Freq';
                volLabel.textContent = 'Vol';
                break;
            case 'filter-resonance':
                freqLabel.textContent = 'Filter';
                volLabel.textContent = 'Q';
                break;
            case 'adsr':
                freqLabel.textContent = 'A';
                volLabel.textContent = 'D';
                break;
        }
    }
}

// Get theremin routing gain node
export function getThereminRoutingGain() {
    return thereminState.routingGain;
}

// Change detection sensitivity
export function changeThereminSensitivity(sensitivity) {
    thereminState.detectionSensitivity = sensitivity;
    console.log(`Detection sensitivity set to ${sensitivity.toFixed(1)}x`);
}

// Change hand detection requirement
export function changeThereminHandRequirement(required) {
    thereminState.requireHandDetection = required;
    console.log(`Hand detection ${required ? 'REQUIRED' : 'NOT REQUIRED'} - ${required ? 'harder but more precise' : 'easier activation, wave only'}`);
}

// Cleanup on page unload
export function cleanupTheremin() {
    if (thereminState.videoStream) {
        thereminState.videoStream.getTracks().forEach(track => track.stop());
    }
    
    disableTheremin({});
}


