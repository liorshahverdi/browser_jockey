// Get DOM elements for Track 1
const audioFile1 = document.getElementById('audioFile1');
const fileName1 = document.getElementById('fileName1');
const audioElement1 = document.getElementById('audioElement1');
const playBtn1 = document.getElementById('playBtn1');
const pauseBtn1 = document.getElementById('pauseBtn1');
const stopBtn1 = document.getElementById('stopBtn1');
const loopBtn1 = document.getElementById('loopBtn1');
const clearLoopBtn1 = document.getElementById('clearLoopBtn1');
const tempoSlider1 = document.getElementById('tempoSlider1');
const tempoValue1 = document.getElementById('tempoValue1');
const volumeSlider1 = document.getElementById('volumeSlider1');
const volumeValue1 = document.getElementById('volumeValue1');
const waveform1 = document.getElementById('waveform1');
const waveformProgress1 = document.getElementById('waveformProgress1');
const loopMarkerStart1 = document.getElementById('loopMarkerStart1');
const loopMarkerEnd1 = document.getElementById('loopMarkerEnd1');
const loopRegion1 = document.getElementById('loopRegion1');
const bpm1Display = document.getElementById('bpm1');
const key1Display = document.getElementById('key1');
const currentTime1Display = document.getElementById('currentTime1');
const duration1Display = document.getElementById('duration1');
const zoomInBtn1 = document.getElementById('zoomInBtn1');
const zoomOutBtn1 = document.getElementById('zoomOutBtn1');
const zoomResetBtn1 = document.getElementById('zoomResetBtn1');
const zoomLevel1Display = document.getElementById('zoomLevel1');
const filterSlider1 = document.getElementById('filterSlider1');
const filterValue1 = document.getElementById('filterValue1');
const filterType1 = document.getElementById('filterType1');
const reverbSlider1 = document.getElementById('reverbSlider1');
const reverbValue1 = document.getElementById('reverbValue1');
const delaySlider1 = document.getElementById('delaySlider1');
const delayValue1 = document.getElementById('delayValue1');
const delayTimeSlider1 = document.getElementById('delayTimeSlider1');
const delayTimeValue1 = document.getElementById('delayTimeValue1');
const exportStem1 = document.getElementById('exportStem1');
const exportLoop1 = document.getElementById('exportLoop1');

// Get DOM elements for Track 2
const audioFile2 = document.getElementById('audioFile2');
const fileName2 = document.getElementById('fileName2');
const audioElement2 = document.getElementById('audioElement2');
const playBtn2 = document.getElementById('playBtn2');
const pauseBtn2 = document.getElementById('pauseBtn2');
const stopBtn2 = document.getElementById('stopBtn2');
const loopBtn2 = document.getElementById('loopBtn2');
const clearLoopBtn2 = document.getElementById('clearLoopBtn2');
const tempoSlider2 = document.getElementById('tempoSlider2');
const tempoValue2 = document.getElementById('tempoValue2');
const volumeSlider2 = document.getElementById('volumeSlider2');
const volumeValue2 = document.getElementById('volumeValue2');
const waveform2 = document.getElementById('waveform2');
const waveformProgress2 = document.getElementById('waveformProgress2');
const loopMarkerStart2 = document.getElementById('loopMarkerStart2');
const loopMarkerEnd2 = document.getElementById('loopMarkerEnd2');
const loopRegion2 = document.getElementById('loopRegion2');
const bpm2Display = document.getElementById('bpm2');
const key2Display = document.getElementById('key2');
const currentTime2Display = document.getElementById('currentTime2');
const duration2Display = document.getElementById('duration2');
const zoomInBtn2 = document.getElementById('zoomInBtn2');
const zoomOutBtn2 = document.getElementById('zoomOutBtn2');
const zoomResetBtn2 = document.getElementById('zoomResetBtn2');
const zoomLevel2Display = document.getElementById('zoomLevel2');
const filterSlider2 = document.getElementById('filterSlider2');
const filterValue2 = document.getElementById('filterValue2');
const filterType2 = document.getElementById('filterType2');
const reverbSlider2 = document.getElementById('reverbSlider2');
const reverbValue2 = document.getElementById('reverbValue2');
const delaySlider2 = document.getElementById('delaySlider2');
const delayValue2 = document.getElementById('delayValue2');
const delayTimeSlider2 = document.getElementById('delayTimeSlider2');
const delayTimeValue2 = document.getElementById('delayTimeValue2');
const exportStem2 = document.getElementById('exportStem2');
const exportLoop2 = document.getElementById('exportLoop2');

// Shared visualizer elements
const container = document.getElementById('visualizer-container');
const placeholder = document.getElementById('placeholder');
const modeCircleBtn = document.getElementById('modeCircle');
const modeBarsBtn = document.getElementById('modeBars');
const modeSphereBtn = document.getElementById('modeSphere');

// Recording elements
const recordBtn = document.getElementById('recordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const downloadBtn = document.getElementById('downloadBtn');
const recordingTime = document.getElementById('recordingTime');
const recordingWaveform = document.getElementById('recordingWaveform');
const recordingWaveformContainer = document.querySelector('.recording-waveform-container');
const recordedAudio = document.getElementById('recordedAudio');

// Audio context and analysers
let audioContext;
let analyser;
let source1, source2;
let merger; // To mix both tracks
let dataArray;
let bufferLength;
let animationId;

// Audio effects nodes for Track 1
let gain1, reverb1, delay1, filter1;
let reverbWet1, delayWet1;

// Audio effects nodes for Track 2
let gain2, reverb2, delay2, filter2;
let reverbWet2, delayWet2;

// Three.js variables
let scene, camera, renderer;
let visualizationObjects = [];
let currentMode = 'circle';
let particles = [];
let particleSystem;
let cameraRotation = { x: 0, y: 0 };
let bassLevel = 0;
let trebleLevel = 0;

// Loop state for both tracks
let loopState1 = { enabled: false, start: null, end: null, settingPoint: 'start' };
let loopState2 = { enabled: false, start: null, end: null, settingPoint: 'start' };

// Zoom state for both tracks
let zoomState1 = { level: 1.0, offset: 0.0, audioBuffer: null, isDragging: false, dragStartX: 0, dragStartOffset: 0 };
let zoomState2 = { level: 1.0, offset: 0.0, audioBuffer: null, isDragging: false, dragStartX: 0, dragStartOffset: 0 };

// Recording state
let mediaRecorder;
let recordedChunks = [];
let recordingStartTime = 0;
let recordingInterval;
let recordingDestination;
let recordingAnalyser;
let recordingAnimationId;

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Musical key detection
let currentKey = 'C';
let currentKeyColor = { h: 0, s: 100, l: 50 };

// Map musical notes to frequencies and colors
const noteFrequencies = {
    'C': { freq: 261.63, color: { h: 0, s: 100, l: 50 } },
    'C#': { freq: 277.18, color: { h: 30, s: 100, l: 50 } },
    'D': { freq: 293.66, color: { h: 60, s: 100, l: 50 } },
    'D#': { freq: 311.13, color: { h: 90, s: 100, l: 50 } },
    'E': { freq: 329.63, color: { h: 120, s: 100, l: 50 } },
    'F': { freq: 349.23, color: { h: 150, s: 100, l: 50 } },
    'F#': { freq: 369.99, color: { h: 180, s: 100, l: 50 } },
    'G': { freq: 392.00, color: { h: 210, s: 100, l: 50 } },
    'G#': { freq: 415.30, color: { h: 240, s: 100, l: 50 } },
    'A': { freq: 440.00, color: { h: 270, s: 100, l: 50 } },
    'A#': { freq: 466.16, color: { h: 300, s: 100, l: 50 } },
    'B': { freq: 493.88, color: { h: 330, s: 100, l: 50 } }
};

// Helper function to format time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update loop region display
function updateLoopRegion(loopState, loopRegion, loopMarkerStart, loopMarkerEnd, duration, zoomState) {
    if (loopState.start !== null && loopState.end !== null) {
        // Calculate visible time window based on zoom
        const visibleDuration = duration / zoomState.level;
        const visibleStartTime = zoomState.offset * duration;
        const visibleEndTime = visibleStartTime + visibleDuration;
        
        // Check if loop points are within visible range
        const startVisible = loopState.start >= visibleStartTime && loopState.start <= visibleEndTime;
        const endVisible = loopState.end >= visibleStartTime && loopState.end <= visibleEndTime;
        
        if (startVisible || endVisible) {
            // Calculate percentages relative to visible window
            const startPercent = ((loopState.start - visibleStartTime) / visibleDuration) * 100;
            const endPercent = ((loopState.end - visibleStartTime) / visibleDuration) * 100;
            
            // Clamp to viewport boundaries (0-100%)
            const clampedStartPercent = Math.max(0, Math.min(100, startPercent));
            const clampedEndPercent = Math.max(0, Math.min(100, endPercent));
            
            loopRegion.style.left = clampedStartPercent + '%';
            loopRegion.style.width = (clampedEndPercent - clampedStartPercent) + '%';
            loopRegion.style.display = 'block';
            
            // Show/hide start marker based on visibility
            if (startVisible && startPercent >= 0 && startPercent <= 100) {
                loopMarkerStart.style.left = startPercent + '%';
                loopMarkerStart.style.display = 'flex';
                loopMarkerStart.setAttribute('data-time', formatTime(loopState.start));
            } else {
                loopMarkerStart.style.display = 'none';
            }
            
            // Show/hide end marker based on visibility
            if (endVisible && endPercent >= 0 && endPercent <= 100) {
                loopMarkerEnd.style.left = endPercent + '%';
                loopMarkerEnd.style.display = 'flex';
                loopMarkerEnd.setAttribute('data-time', formatTime(loopState.end));
            } else {
                loopMarkerEnd.style.display = 'none';
            }
        } else {
            // Both markers outside visible range, hide everything
            loopRegion.style.display = 'none';
            loopMarkerStart.style.display = 'none';
            loopMarkerEnd.style.display = 'none';
        }
    }
}

// Clear loop points
function clearLoopPoints(loopState, loopRegion, loopMarkerStart, loopMarkerEnd) {
    loopState.start = null;
    loopState.end = null;
    loopState.settingPoint = 'start';
    loopRegion.style.display = 'none';
    loopMarkerStart.style.display = 'none';
    loopMarkerEnd.style.display = 'none';
}

// Check and handle loop playback
function handleLoopPlayback(audioElement, loopState, isDraggingMarker) {
    if (loopState.enabled && loopState.start !== null && loopState.end !== null) {
        // Adjust tolerance based on playback rate to catch loop point reliably
        // Higher playback rate = larger tolerance needed
        const tolerance = 0.1 * audioElement.playbackRate;
        
        // Handle end of loop - always enforce this
        if (audioElement.currentTime >= loopState.end - tolerance) {
            console.log('Looping: currentTime', audioElement.currentTime, 'jumping to', loopState.start);
            const wasPlaying = !audioElement.paused;
            audioElement.currentTime = loopState.start;
            
            // Ensure playback continues after jumping
            if (wasPlaying && audioElement.paused) {
                audioElement.play().catch(e => console.error('Error resuming playback:', e));
            }
        }
        // Only enforce start boundary when not dragging markers
        // This allows seamless marker adjustment while playing
        else if (!isDraggingMarker && audioElement.currentTime < loopState.start) {
            audioElement.currentTime = loopState.start;
        }
    }
}

// Start recording the mixed audio output
function startRecording() {
    if (!audioContext || !recordingDestination) {
        alert('Please load at least one audio file first!');
        return;
    }
    
    if (!recordingAnalyser) {
        console.error('Recording analyser not initialized!');
        alert('Recording analyser not ready. Please try again.');
        return;
    }
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    console.log('Starting recording with analyser connected:', recordingAnalyser);
    console.log('Audio context state:', audioContext.state);
    
    recordedChunks = [];
    
    // Create MediaRecorder from the destination stream
    const options = { mimeType: 'audio/webm' };
    try {
        mediaRecorder = new MediaRecorder(recordingDestination.stream, options);
    } catch (e) {
        console.error('MediaRecorder error:', e);
        alert('Recording not supported in this browser');
        return;
    }
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        recordedAudio.src = url;
        
        // Decode and draw waveform
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                drawWaveform(recordingWaveform, audioBuffer);
                recordingWaveformContainer.style.display = 'block';
            } catch (err) {
                console.error('Error decoding recorded audio:', err);
            }
        };
        reader.readAsArrayBuffer(blob);
        
        // Enable download button
        downloadBtn.disabled = false;
        downloadBtn.style.display = 'inline-block';
    };
    
    mediaRecorder.start();
    recordingStartTime = Date.now();
    
    // Update recording time
    recordingInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        recordingTime.textContent = formatTime(elapsed);
    }, 100);
    
    // Show waveform container and start real-time drawing
    recordingWaveformContainer.style.display = 'block';
    drawRecordingWaveform();
    
    // Update UI
    recordBtn.style.display = 'none';
    stopRecordBtn.disabled = false;
    stopRecordBtn.style.display = 'inline-block';
    recordingTime.style.display = 'inline-block';
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(recordingInterval);
        
        // Stop real-time waveform animation
        if (recordingAnimationId) {
            cancelAnimationFrame(recordingAnimationId);
            recordingAnimationId = null;
        }
        
        // Update UI
        stopRecordBtn.style.display = 'none';
        recordBtn.style.display = 'inline-block';
        recordingTime.style.display = 'none';
    }
}

// Draw real-time recording waveform
function drawRecordingWaveform() {
    if (!recordingAnalyser) {
        console.warn('Recording analyser not initialized');
        return;
    }
    
    const canvas = recordingWaveform;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    const bufferLength = recordingAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        recordingAnimationId = requestAnimationFrame(draw);
        
        recordingAnalyser.getByteTimeDomainData(dataArray);
        
        // Clear with slight trail for smoother animation
        ctx.fillStyle = 'rgba(10, 10, 10, 0.3)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.lineWidth = 3 * window.devicePixelRatio;
        ctx.strokeStyle = 'rgba(255, 0, 100, 1)';
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
        
        // Add center line for reference
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }
    
    draw();
}

// Download recorded audio
function downloadRecording() {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `mix_recording_${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Draw waveform on canvas with zoom support
function drawWaveform(canvas, audioBuffer, zoomLevel = 1.0, zoomOffset = 0.0) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    const data = audioBuffer.getChannelData(0);
    
    // Calculate zoom window
    const totalSamples = data.length;
    const visibleSamples = Math.floor(totalSamples / zoomLevel);
    const startSample = Math.floor(zoomOffset * totalSamples);
    const endSample = Math.min(startSample + visibleSamples, totalSamples);
    
    const step = Math.max(1, Math.ceil((endSample - startSample) / width));
    const amp = height / 2;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.beginPath();
    
    for (let i = 0; i < width; i++) {
        const sampleIndex = startSample + (i * step);
        if (sampleIndex >= endSample) break;
        
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < step && sampleIndex + j < endSample; j++) {
            const datum = data[sampleIndex + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    
    ctx.stroke();
}

// Redraw waveform with zoom
function redrawWaveformWithZoom(canvas, zoomState, zoomLevelDisplay) {
    if (!zoomState.audioBuffer) return;
    
    drawWaveform(canvas, zoomState.audioBuffer, zoomState.level, zoomState.offset);
    zoomLevelDisplay.textContent = zoomState.level.toFixed(1) + 'x';
}

// Draw waveform on canvas (old signature for compatibility)
function drawWaveformSimple(canvas, audioBuffer) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    ctx.fillStyle = 'rgba(10, 10, 10, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.beginPath();
    
    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    
    ctx.stroke();
}

// Detect BPM using autocorrelation
function detectBPM(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Analyze first 30 seconds of audio
    const samplesPerAnalysis = Math.min(sampleRate * 30, data.length);
    const samples = data.slice(0, samplesPerAnalysis);
    
    // Calculate energy in windows
    const energyBuffer = [];
    const windowSize = 2048;
    const hopSize = 512; // Overlap windows
    
    for (let i = 0; i < samples.length - windowSize; i += hopSize) {
        let energy = 0;
        for (let j = 0; j < windowSize; j++) {
            const sample = samples[i + j];
            energy += sample * sample; // RMS energy
        }
        energyBuffer.push(Math.sqrt(energy / windowSize));
    }
    
    // Find dynamic threshold (mean + std dev)
    const mean = energyBuffer.reduce((sum, val) => sum + val, 0) / energyBuffer.length;
    const variance = energyBuffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / energyBuffer.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + stdDev * 0.5;
    
    // Find peaks above threshold
    const peaks = [];
    for (let i = 1; i < energyBuffer.length - 1; i++) {
        if (energyBuffer[i] > threshold &&
            energyBuffer[i] > energyBuffer[i - 1] && 
            energyBuffer[i] > energyBuffer[i + 1]) {
            peaks.push(i);
        }
    }
    
    if (peaks.length < 4) return 0;
    
    // Calculate intervals between consecutive peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    // Use histogram to find most common interval with tolerance
    const histogram = {};
    const tolerance = 3; // Allow slight variations
    
    intervals.forEach(interval => {
        let found = false;
        for (const key in histogram) {
            if (Math.abs(interval - parseInt(key)) <= tolerance) {
                histogram[key]++;
                found = true;
                break;
            }
        }
        if (!found) {
            histogram[interval] = 1;
        }
    });
    
    // Find interval with highest count
    let maxCount = 0;
    let mostCommonInterval = 0;
    for (const interval in histogram) {
        if (histogram[interval] > maxCount) {
            maxCount = histogram[interval];
            mostCommonInterval = parseInt(interval);
        }
    }
    
    if (mostCommonInterval === 0) return 0;
    
    // Convert interval to BPM
    const secondsPerBeat = (mostCommonInterval * hopSize) / sampleRate;
    let bpm = 60 / secondsPerBeat;
    
    // Normalize to typical BPM range (60-180)
    while (bpm < 60) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    
    return Math.round(bpm);
}

// Detect musical key from audio buffer
function detectKey(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const data = audioBuffer.getChannelData(0);
    
    // Analyze first 10 seconds
    const analysisLength = Math.min(sampleRate * 10, data.length);
    const samples = data.slice(0, analysisLength);
    
    // Simple FFT-like approach: detect dominant frequency
    const fftSize = 8192;
    const chromaProfile = new Array(12).fill(0); // 12 chromatic notes
    
    // Process windows
    for (let i = 0; i < samples.length - fftSize; i += fftSize / 2) {
        const window = samples.slice(i, i + fftSize);
        
        // Calculate energy for each chromatic note
        Object.keys(noteFrequencies).forEach((note, noteIndex) => {
            for (let octave = 1; octave < 5; octave++) {
                const freq = noteFrequencies[note].freq * Math.pow(2, octave);
                const k = Math.round((freq * fftSize) / sampleRate);
                
                if (k < window.length) {
                    let real = 0, imag = 0;
                    for (let n = 0; n < window.length; n++) {
                        const angle = (2 * Math.PI * k * n) / fftSize;
                        real += window[n] * Math.cos(angle);
                        imag += window[n] * Math.sin(angle);
                    }
                    const magnitude = Math.sqrt(real * real + imag * imag);
                    chromaProfile[noteIndex] += magnitude;
                }
            }
        });
    }
    
    // Find note with highest energy
    let maxEnergy = 0;
    let detectedNote = 'C';
    Object.keys(noteFrequencies).forEach((note, index) => {
        if (chromaProfile[index] > maxEnergy) {
            maxEnergy = chromaProfile[index];
            detectedNote = note;
        }
    });
    
    return detectedNote;
}

// Load audio file and draw waveform
async function loadAudioFile(file, canvas, bpmDisplay, audioElement, zoomState, keyDisplay) {
    const arrayBuffer = await file.arrayBuffer();
    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
    
    // Store audio buffer for zoom
    if (zoomState) {
        zoomState.audioBuffer = audioBuffer;
        zoomState.level = 1.0;
        zoomState.offset = 0.0;
    }
    
    drawWaveform(canvas, audioBuffer);
    
    const bpm = detectBPM(audioBuffer);
    bpmDisplay.textContent = bpm > 0 ? bpm : '--';
    
    const key = detectKey(audioBuffer);
    if (keyDisplay) {
        keyDisplay.textContent = key;
    }
    
    tempContext.close();
}

// Detect musical key from frequency data
function detectMusicalKey() {
    if (!analyser || !dataArray) return;
    
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    let maxValue = 0;
    let maxIndex = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxValue) {
            maxValue = frequencyData[i];
            maxIndex = i;
        }
    }
    
    const nyquist = audioContext.sampleRate / 2;
    const dominantFreq = (maxIndex * nyquist) / analyser.frequencyBinCount;
    
    let closestNote = 'C';
    let minDiff = Infinity;
    
    Object.keys(noteFrequencies).forEach(note => {
        for (let octave = 0; octave < 5; octave++) {
            const freq = noteFrequencies[note].freq * Math.pow(2, octave);
            const diff = Math.abs(dominantFreq - freq);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        }
    });
    
    if (closestNote !== currentKey) {
        currentKey = closestNote;
        currentKeyColor = noteFrequencies[closestNote].color;
        updateVisualizationColors();
    }
}

function updateVisualizationColors() {
    const baseHue = currentKeyColor.h;
    visualizationObjects.forEach((obj, i) => {
        const hueOffset = (i / visualizationObjects.length) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        obj.material.color.setHSL(hue / 360, 1, 0.5);
        obj.material.emissive.setHSL(hue / 360, 1, 0.3);
    });
}

// Create reverb effect using convolution
function createReverb(context) {
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
function createDelay(context) {
    const delay = context.createDelay(5.0); // Max 5 seconds delay
    delay.delayTime.value = 0.3; // Default 300ms
    
    const feedback = context.createGain();
    feedback.gain.value = 0.3; // 30% feedback
    
    delay.connect(feedback);
    feedback.connect(delay);
    
    return { delay, feedback };
}

// Initialize audio effects for a track
function initAudioEffects(context, trackNumber) {
    // Create gain node (for volume control)
    const gain = context.createGain();
    gain.gain.value = 1.0;
    
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
    
    // Store effects for this track
    if (trackNumber === 1) {
        gain1 = gain;
        reverb1 = { convolver: reverb, wet: reverbWet, dry: reverbDry };
        delay1 = { node: delay, feedback, wet: delayWet, dry: delayDry };
        filter1 = filter;
    } else {
        gain2 = gain;
        reverb2 = { convolver: reverb, wet: reverbWet, dry: reverbDry };
        delay2 = { node: delay, feedback, wet: delayWet, dry: delayDry };
        filter2 = filter;
    }
    
    return { gain, reverb: { convolver: reverb, wet: reverbWet, dry: reverbDry }, delay: { node: delay, feedback, wet: delayWet, dry: delayDry }, filter };
}

// Initialize audio context and connect both tracks
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Create merger to combine both tracks
        merger = audioContext.createChannelMerger(2);
        
        // Create destination for recording
        recordingDestination = audioContext.createMediaStreamDestination();
        
        // Create analyser for recording visualization
        recordingAnalyser = audioContext.createAnalyser();
        recordingAnalyser.fftSize = 2048;
        recordingAnalyser.smoothingTimeConstant = 0.8;
        
        // Connect merger to analyser, recording destination, and recording analyser
        merger.connect(analyser);
        merger.connect(recordingDestination);
        merger.connect(recordingAnalyser);
        analyser.connect(audioContext.destination);
        
        // Initialize effects for both tracks
        initAudioEffects(audioContext, 1);
        initAudioEffects(audioContext, 2);
    }
    
    // Connect track 1 if it exists and isn't already connected
    if (audioElement1.src && !source1) {
        source1 = audioContext.createMediaElementSource(audioElement1);
        
        // Effects chain for Track 1:
        // source1 -> gain1 -> filter1 -> reverb (wet/dry) -> delay (wet/dry) -> merger
        
        source1.connect(gain1);
        gain1.connect(filter1);
        
        // Reverb path: filter1 -> reverb -> reverbWet --\
        filter1.connect(reverb1.convolver);                // |
        reverb1.convolver.connect(reverb1.wet);            // |
                                                            // v
        // Dry path: filter1 -> reverbDry ---------------> merge point
        filter1.connect(reverb1.dry);                       //
                                                            //
        // Merge reverb wet and dry                         //
        const reverbMix1 = audioContext.createGain();       //
        reverb1.wet.connect(reverbMix1);                    //
        reverb1.dry.connect(reverbMix1);                    //
        
        // Delay path: reverbMix1 -> delay -> delayWet --\
        reverbMix1.connect(delay1.node);                    // |
        delay1.node.connect(delay1.wet);                    // |
                                                            // v
        // Dry path: reverbMix1 -> delayDry -------------> final merge
        reverbMix1.connect(delay1.dry);                     //
                                                            //
        // Final merge and connect to mixer                //
        const finalMix1 = audioContext.createGain();        //
        delay1.wet.connect(finalMix1);                      //
        delay1.dry.connect(finalMix1);                      //
        
        finalMix1.connect(merger, 0, 0);
        finalMix1.connect(merger, 0, 1);
    }
    
    // Connect track 2 if it exists and isn't already connected
    if (audioElement2.src && !source2) {
        source2 = audioContext.createMediaElementSource(audioElement2);
        
        // Effects chain for Track 2 (same as Track 1)
        source2.connect(gain2);
        gain2.connect(filter2);
        
        filter2.connect(reverb2.convolver);
        reverb2.convolver.connect(reverb2.wet);
        filter2.connect(reverb2.dry);
        
        const reverbMix2 = audioContext.createGain();
        reverb2.wet.connect(reverbMix2);
        reverb2.dry.connect(reverbMix2);
        
        reverbMix2.connect(delay2.node);
        delay2.node.connect(delay2.wet);
        reverbMix2.connect(delay2.dry);
        
        const finalMix2 = audioContext.createGain();
        delay2.wet.connect(finalMix2);
        delay2.dry.connect(finalMix2);
        
        finalMix2.connect(merger, 0, 0);
        finalMix2.connect(merger, 0, 1);
    }
}

// Initialize Three.js
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.z = 50;
    camera.position.y = 10;
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight2.position.set(-20, -20, 20);
    scene.add(pointLight2);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);
    
    createParticleSystem();
    
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
    
    let mouseX = 0, mouseY = 0;
    container.addEventListener('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;
        cameraRotation.x = mouseY * 0.3;
        cameraRotation.y = mouseX * 0.3;
        
        mouse.x = mouseX;
        mouse.y = mouseY;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(visualizationObjects);
        container.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    });
    
    container.addEventListener('click', onVisualizerClick);
}

// Handle clicks on visualization objects
function onVisualizerClick(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;
    
    console.log('Click detected! Mouse:', mouse.x, mouse.y);
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(visualizationObjects);
    
    console.log('Intersects:', intersects.length, 'objects');
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        console.log('Clicked object:', clickedObject.userData.index);
        
        if (selectedObject && selectedObject !== clickedObject) {
            selectedObject.userData.isSelected = false;
        }
        
        clickedObject.userData.isSelected = !clickedObject.userData.isSelected;
        selectedObject = clickedObject.userData.isSelected ? clickedObject : null;
        
        console.log('Selected:', clickedObject.userData.isSelected);
        
        if (clickedObject.userData.isSelected) {
            clickedObject.userData.explosionForce = 1.5;
            clickedObject.userData.explosionTime = Date.now();
            clickedObject.userData.spinBoost = 0.3;
            
            console.log('Explosion triggered!');
            
            const hue = Math.random() * 360;
            clickedObject.material.color.setHSL(hue / 360, 1, 0.5);
            clickedObject.material.emissive.setHSL(hue / 360, 1, 0.3);
            
            visualizationObjects.forEach((obj) => {
                if (obj !== clickedObject) {
                    const distance = clickedObject.position.distanceTo(obj.position);
                    if (distance < 15) {
                        const delay = distance * 20;
                        setTimeout(() => {
                            obj.userData.rippleForce = 0.3 * (1 - distance / 15);
                        }, delay);
                    }
                }
            });
        }
    }
}

// Create particle system for background
function createParticleSystem() {
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;
        
        colors[i] = Math.random();
        colors[i + 1] = Math.random();
        colors[i + 2] = Math.random();
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

// Clear visualization
function clearVisualization() {
    visualizationObjects.forEach(obj => scene.remove(obj));
    visualizationObjects = [];
}

// Visualization creation functions (same as before)
function createCircleVisualization() {
    clearVisualization();
    const numBars = 128;
    const radius = 20;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numBars; i++) {
        const randomHeight = 0.8 + Math.random() * 0.4;
        const geometry = new THREE.BoxGeometry(0.5, 1 * randomHeight, 0.5);
        const hueOffset = (i / numBars) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 100,
            transparent: true,
            opacity: 0.85 + Math.random() * 0.15
        });
        const bar = new THREE.Mesh(geometry, material);
        
        const angle = (i / numBars) * Math.PI * 2;
        bar.position.x = Math.cos(angle) * radius;
        bar.position.z = Math.sin(angle) * radius;
        bar.rotation.y = -angle;
        bar.userData = { 
            angle: angle, 
            baseX: Math.cos(angle) * radius,
            baseZ: Math.sin(angle) * radius,
            targetScale: 1,
            velocity: 0,
            rotationSpeed: 0,
            index: i,
            randomPhase: Math.random() * Math.PI * 2,
            randomSpeed: 0.8 + Math.random() * 0.4,
            randomAmplitude: 0.7 + Math.random() * 0.6,
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(bar);
        visualizationObjects.push(bar);
    }
}

function createBarsVisualization() {
    clearVisualization();
    const numBars = 64;
    const spacing = 1.2;
    const startX = -(numBars * spacing) / 2;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numBars; i++) {
        const randomWidth = 0.8 + Math.random() * 0.4;
        const randomDepth = 0.8 + Math.random() * 0.4;
        const geometry = new THREE.BoxGeometry(randomWidth, 1, randomDepth);
        const hueOffset = (i / numBars) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 80 + Math.random() * 40,
            transparent: true,
            opacity: 0.85 + Math.random() * 0.15
        });
        const bar = new THREE.Mesh(geometry, material);
        
        bar.position.x = startX + i * spacing;
        bar.position.y = 0;
        bar.userData = { 
            targetScale: 1, 
            pulsePhase: i * 0.1 + Math.random() * 0.5,
            baseX: startX + i * spacing,
            velocity: 0,
            rotationVelocity: 0,
            tiltX: 0,
            tiltZ: 0,
            index: i,
            randomBounce: 0.7 + Math.random() * 0.6,
            randomSpin: 0.5 + Math.random() * 1.0,
            randomWave: Math.random() * Math.PI * 2,
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(bar);
        visualizationObjects.push(bar);
    }
}

function createSphereVisualization() {
    clearVisualization();
    const numSpheres = 100;
    const radius = 25;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numSpheres; i++) {
        const randomSize = 0.3 + Math.random() * 0.4;
        const geometry = new THREE.SphereGeometry(randomSize, 16, 16);
        const hueOffset = (i / numSpheres) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 50 + Math.random() * 100,
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        const phi = Math.acos(1 - 2 * (i + 0.5) / numSpheres);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        
        const radiusVariation = radius * (0.9 + Math.random() * 0.2);
        sphere.position.x = Math.cos(theta) * Math.sin(phi) * radiusVariation;
        sphere.position.y = Math.sin(theta) * Math.sin(phi) * radiusVariation;
        sphere.position.z = Math.cos(phi) * radiusVariation;
        
        sphere.userData = { 
            baseX: sphere.position.x,
            baseY: sphere.position.y,
            baseZ: sphere.position.z,
            targetScale: 0.5,
            pulseSpeed: 0.015 + Math.random() * 0.04,
            rotationSpeed: (Math.random() - 0.5) * 0.08,
            velocity: 0,
            index: i,
            randomFloat: Math.random() * Math.PI * 2,
            randomOrbit: (Math.random() - 0.5) * 0.02,
            randomGlow: 0.5 + Math.random() * 0.5,
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(sphere);
        visualizationObjects.push(sphere);
    }
}

// File upload handlers for Track 1
audioFile1.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        audioElement1.src = url;
        fileName1.textContent = file.name;
        playBtn1.disabled = false;
        pauseBtn1.disabled = false;
        stopBtn1.disabled = false;
        loopBtn1.disabled = false;
        clearLoopBtn1.disabled = false;
        exportStem1.disabled = false;
        recordBtn.disabled = false;
        
        // Load and draw waveform
        await loadAudioFile(file, waveform1, bpm1Display, audioElement1, zoomState1, key1Display);
        
        if (!scene) {
            initThreeJS();
            createCircleVisualization();
        }
        
        if (placeholder && !audioElement2.src) {
            placeholder.classList.add('hidden');
        }
        
        // Reset source1 to reconnect
        source1 = null;
    }
});

// File upload handlers for Track 2
audioFile2.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        console.log('Track 2 file selected:', file.name);
        const url = URL.createObjectURL(file);
        audioElement2.src = url;
        fileName2.textContent = file.name;
        
        // Enable all buttons
        console.log('Enabling Track 2 buttons...');
        playBtn2.disabled = false;
        pauseBtn2.disabled = false;
        stopBtn2.disabled = false;
        loopBtn2.disabled = false;
        clearLoopBtn2.disabled = false;
        exportStem2.disabled = false;
        recordBtn.disabled = false;
        console.log('Track 2 buttons enabled:', {
            play: !playBtn2.disabled,
            pause: !pauseBtn2.disabled,
            stop: !stopBtn2.disabled
        });
        
        // Load and draw waveform
        await loadAudioFile(file, waveform2, bpm2Display, audioElement2, zoomState2, key2Display);
        
        if (!scene) {
            initThreeJS();
            createCircleVisualization();
        }
        
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
        
        // Reset source2 to reconnect
        source2 = null;
    }
});

// Waveform click for Track 1 - set loop points or seek
waveform1.parentElement.addEventListener('click', (e) => {
    // Don't handle click if we were dragging
    if (zoomState1.isDragging) {
        zoomState1.isDragging = false;
        return;
    }
    
    // Don't set loop points if clicking on markers
    if (e.target.classList.contains('loop-marker')) return;
    
    const rect = waveform1.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    // Adjust for zoom: map click position to actual time considering zoom and offset
    const visibleDuration = audioElement1.duration / zoomState1.level;
    const startTime = zoomState1.offset * audioElement1.duration;
    const time = startTime + (percentage * visibleDuration);
    
    // If a marker is active, move it to clicked position
    if (activeMarker1 && loopState1.enabled) {
        if (activeMarker1 === 'start') {
            loopState1.start = Math.min(time, loopState1.end || audioElement1.duration);
            loopMarkerStart1.style.filter = ''; // Remove highlight
            console.log('Track 1 Start marker moved to:', formatTime(time));
        } else if (activeMarker1 === 'end') {
            loopState1.end = Math.max(time, loopState1.start || 0);
            loopMarkerEnd1.style.filter = ''; // Remove highlight
            console.log('Track 1 End marker moved to:', formatTime(time));
        }
        activeMarker1 = null; // Deactivate after moving
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
        return;
    }
    
    if (loopState1.enabled) {
        // Setting loop points
        if (loopState1.settingPoint === 'start') {
            loopState1.start = time;
            loopState1.settingPoint = 'end';
            console.log('Loop start set at:', formatTime(time));
        } else {
            loopState1.end = time;
            loopState1.settingPoint = 'start';
            
            // Ensure start < end
            if (loopState1.start > loopState1.end) {
                [loopState1.start, loopState1.end] = [loopState1.end, loopState1.start];
            }
            console.log('Loop end set at:', formatTime(time));
            // Enable export loop button when both points are set
            exportLoop1.disabled = false;
        }
        
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
    } else {
        // Regular seek
        if (audioElement1.duration) {
            audioElement1.currentTime = time;
        }
    }
});

// Waveform drag for Track 1 (pan when zoomed)
waveform1.parentElement.addEventListener('mousedown', (e) => {
    if (zoomState1.level > 1 && !e.target.classList.contains('loop-marker')) {
        zoomState1.isDragging = true;
        zoomState1.dragStartX = e.clientX;
        zoomState1.dragStartOffset = zoomState1.offset;
        waveform1.parentElement.style.cursor = 'grabbing';
        e.preventDefault();
    }
});

waveform1.parentElement.addEventListener('mousemove', (e) => {
    if (zoomState1.isDragging && zoomState1.level > 1) {
        const rect = waveform1.getBoundingClientRect();
        const deltaX = e.clientX - zoomState1.dragStartX;
        const deltaPercent = -(deltaX / rect.width) / zoomState1.level;
        
        zoomState1.offset = Math.max(0, Math.min(1 - (1 / zoomState1.level), zoomState1.dragStartOffset + deltaPercent));
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display);
        updateLoopMarkersAfterZoom(1);
    }
});

waveform1.parentElement.addEventListener('mouseup', () => {
    if (zoomState1.isDragging) {
        setTimeout(() => {
            zoomState1.isDragging = false;
            waveform1.parentElement.style.cursor = zoomState1.level > 1 ? 'grab' : 'pointer';
        }, 10);
    }
});

waveform1.parentElement.addEventListener('mouseleave', () => {
    if (zoomState1.isDragging) {
        zoomState1.isDragging = false;
        waveform1.parentElement.style.cursor = zoomState1.level > 1 ? 'grab' : 'pointer';
    }
});

// Waveform click for Track 2 - set loop points or seek
waveform2.parentElement.addEventListener('click', (e) => {
    // Don't handle click if we were dragging
    if (zoomState2.isDragging) {
        zoomState2.isDragging = false;
        return;
    }
    
    // Don't set loop points if clicking on markers
    if (e.target.classList.contains('loop-marker')) return;
    
    const rect = waveform2.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    // Adjust for zoom: map click position to actual time considering zoom and offset
    const visibleDuration = audioElement2.duration / zoomState2.level;
    const startTime = zoomState2.offset * audioElement2.duration;
    const time = startTime + (percentage * visibleDuration);
    
    // If a marker is active, move it to clicked position
    if (activeMarker2 && loopState2.enabled) {
        if (activeMarker2 === 'start') {
            loopState2.start = Math.min(time, loopState2.end || audioElement2.duration);
            loopMarkerStart2.style.filter = ''; // Remove highlight
            console.log('Track 2 Start marker moved to:', formatTime(time));
        } else if (activeMarker2 === 'end') {
            loopState2.end = Math.max(time, loopState2.start || 0);
            loopMarkerEnd2.style.filter = ''; // Remove highlight
            console.log('Track 2 End marker moved to:', formatTime(time));
        }
        activeMarker2 = null; // Deactivate after moving
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
        return;
    }
    
    if (loopState2.enabled) {
        // Setting loop points
        if (loopState2.settingPoint === 'start') {
            loopState2.start = time;
            loopState2.settingPoint = 'end';
            console.log('Loop start set at:', formatTime(time));
        } else {
            loopState2.end = time;
            loopState2.settingPoint = 'start';
            
            // Ensure start < end
            if (loopState2.start > loopState2.end) {
                [loopState2.start, loopState2.end] = [loopState2.end, loopState2.start];
            }
            console.log('Loop end set at:', formatTime(time));
            // Enable export loop button when both points are set
            exportLoop2.disabled = false;
        }
        
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
    } else {
        // Regular seek
        if (audioElement2.duration) {
            audioElement2.currentTime = time;
        }
    }
});

// Waveform drag for Track 2 (pan when zoomed)
waveform2.parentElement.addEventListener('mousedown', (e) => {
    if (zoomState2.level > 1 && !e.target.classList.contains('loop-marker')) {
        zoomState2.isDragging = true;
        zoomState2.dragStartX = e.clientX;
        zoomState2.dragStartOffset = zoomState2.offset;
        waveform2.parentElement.style.cursor = 'grabbing';
        e.preventDefault();
    }
});

waveform2.parentElement.addEventListener('mousemove', (e) => {
    if (zoomState2.isDragging && zoomState2.level > 1) {
        const rect = waveform2.getBoundingClientRect();
        const deltaX = e.clientX - zoomState2.dragStartX;
        const deltaPercent = -(deltaX / rect.width) / zoomState2.level;
        
        zoomState2.offset = Math.max(0, Math.min(1 - (1 / zoomState2.level), zoomState2.dragStartOffset + deltaPercent));
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display);
        updateLoopMarkersAfterZoom(2);
    }
});

waveform2.parentElement.addEventListener('mouseup', () => {
    if (zoomState2.isDragging) {
        setTimeout(() => {
            zoomState2.isDragging = false;
            waveform2.parentElement.style.cursor = zoomState2.level > 1 ? 'grab' : 'pointer';
        }, 10);
    }
});

waveform2.parentElement.addEventListener('mouseleave', () => {
    if (zoomState2.isDragging) {
        zoomState2.isDragging = false;
        waveform2.parentElement.style.cursor = zoomState2.level > 1 ? 'grab' : 'pointer';
    }
});

// Drag loop markers for Track 1
let isDraggingMarker1 = false;
let draggedMarker1 = null;
let activeMarker1 = null; // For click-to-move mode

loopMarkerStart1.addEventListener('mousedown', (e) => {
    isDraggingMarker1 = true;
    draggedMarker1 = 'start';
    e.stopPropagation();
});

loopMarkerEnd1.addEventListener('mousedown', (e) => {
    isDraggingMarker1 = true;
    draggedMarker1 = 'end';
    e.stopPropagation();
});

// Click on marker to activate it for repositioning
loopMarkerStart1.addEventListener('click', (e) => {
    if (!isDraggingMarker1) {
        activeMarker1 = activeMarker1 === 'start' ? null : 'start';
        loopMarkerStart1.style.filter = activeMarker1 === 'start' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))' : '';
        console.log('Track 1 Start marker', activeMarker1 === 'start' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});

loopMarkerEnd1.addEventListener('click', (e) => {
    if (!isDraggingMarker1) {
        activeMarker1 = activeMarker1 === 'end' ? null : 'end';
        loopMarkerEnd1.style.filter = activeMarker1 === 'end' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))' : '';
        console.log('Track 1 End marker', activeMarker1 === 'end' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});


waveform1.parentElement.addEventListener('mousemove', (e) => {
    if (isDraggingMarker1 && draggedMarker1) {
        const rect = waveform1.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        
        // Adjust for zoom: map drag position to actual time considering zoom and offset
        const visibleDuration = audioElement1.duration / zoomState1.level;
        const startTime = zoomState1.offset * audioElement1.duration;
        const time = startTime + (percentage * visibleDuration);
        
        if (draggedMarker1 === 'start') {
            loopState1.start = Math.min(time, loopState1.end || audioElement1.duration);
        } else {
            loopState1.end = Math.max(time, loopState1.start || 0);
        }
        
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
    }
});

document.addEventListener('mouseup', () => {
    // When finishing dragging Track 1 markers, adjust playhead if needed
    if (isDraggingMarker1 && loopState1.enabled && !audioElement1.paused) {
        const currentTime = audioElement1.currentTime;
        // If playhead is now outside the loop, move it to the nearest edge
        if (currentTime < loopState1.start) {
            audioElement1.currentTime = loopState1.start;
            console.log('Adjusted playhead to loop start after marker drag');
        } else if (currentTime > loopState1.end) {
            audioElement1.currentTime = loopState1.start; // Jump to start for seamless loop
            console.log('Adjusted playhead to loop start after marker drag');
        }
    }
    
    // When finishing dragging Track 2 markers, adjust playhead if needed
    if (isDraggingMarker2 && loopState2.enabled && !audioElement2.paused) {
        const currentTime = audioElement2.currentTime;
        // If playhead is now outside the loop, move it to the nearest edge
        if (currentTime < loopState2.start) {
            audioElement2.currentTime = loopState2.start;
            console.log('Adjusted playhead to loop start after marker drag');
        } else if (currentTime > loopState2.end) {
            audioElement2.currentTime = loopState2.start; // Jump to start for seamless loop
            console.log('Adjusted playhead to loop start after marker drag');
        }
    }
    
    isDraggingMarker1 = false;
    draggedMarker1 = null;
    isDraggingMarker2 = false;
    draggedMarker2 = null;
});

// Drag loop markers for Track 2
let isDraggingMarker2 = false;
let draggedMarker2 = null;
let activeMarker2 = null; // For click-to-move mode

loopMarkerStart2.addEventListener('mousedown', (e) => {
    isDraggingMarker2 = true;
    draggedMarker2 = 'start';
    e.stopPropagation();
});

loopMarkerEnd2.addEventListener('mousedown', (e) => {
    isDraggingMarker2 = true;
    draggedMarker2 = 'end';
    e.stopPropagation();
});

// Click on marker to activate it for repositioning
loopMarkerStart2.addEventListener('click', (e) => {
    if (!isDraggingMarker2) {
        activeMarker2 = activeMarker2 === 'start' ? null : 'start';
        loopMarkerStart2.style.filter = activeMarker2 === 'start' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))' : '';
        console.log('Track 2 Start marker', activeMarker2 === 'start' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});

loopMarkerEnd2.addEventListener('click', (e) => {
    if (!isDraggingMarker2) {
        activeMarker2 = activeMarker2 === 'end' ? null : 'end';
        loopMarkerEnd2.style.filter = activeMarker2 === 'end' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))' : '';
        console.log('Track 2 End marker', activeMarker2 === 'end' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});


waveform2.parentElement.addEventListener('mousemove', (e) => {
    if (isDraggingMarker2 && draggedMarker2) {
        const rect = waveform2.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        
        // Adjust for zoom: map drag position to actual time considering zoom and offset
        const visibleDuration = audioElement2.duration / zoomState2.level;
        const startTime = zoomState2.offset * audioElement2.duration;
        const time = startTime + (percentage * visibleDuration);
        
        if (draggedMarker2 === 'start') {
            loopState2.start = Math.min(time, loopState2.end || audioElement2.duration);
        } else {
            loopState2.end = Math.max(time, loopState2.start || 0);
        }
        
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
    }
});

// Update time and progress for Track 1
audioElement1.addEventListener('loadedmetadata', () => {
    duration1Display.textContent = formatTime(audioElement1.duration);
});

audioElement1.addEventListener('timeupdate', () => {
    currentTime1Display.textContent = formatTime(audioElement1.currentTime);
    if (audioElement1.duration) {
        // Calculate progress relative to visible waveform when zoomed
        const currentTime = audioElement1.currentTime;
        const duration = audioElement1.duration;
        
        // Calculate visible time window based on zoom
        const visibleDuration = duration / zoomState1.level;
        const visibleStartTime = zoomState1.offset * duration;
        const visibleEndTime = visibleStartTime + visibleDuration;
        
        // Check if current time is within visible range
        if (currentTime >= visibleStartTime && currentTime <= visibleEndTime) {
            // Map current time to visible waveform position
            const percentage = ((currentTime - visibleStartTime) / visibleDuration) * 100;
            waveformProgress1.style.width = Math.max(0, Math.min(100, percentage)) + '%';
        } else if (currentTime < visibleStartTime) {
            // Playhead is before visible range
            waveformProgress1.style.width = '0%';
        } else {
            // Playhead is after visible range
            waveformProgress1.style.width = '100%';
        }
        
        // Handle loop playback
        handleLoopPlayback(audioElement1, loopState1, isDraggingMarker1);
    }
});

// Update time and progress for Track 2
audioElement2.addEventListener('loadedmetadata', () => {
    duration2Display.textContent = formatTime(audioElement2.duration);
});

audioElement2.addEventListener('timeupdate', () => {
    currentTime2Display.textContent = formatTime(audioElement2.currentTime);
    if (audioElement2.duration) {
        // Calculate progress relative to visible waveform when zoomed
        const currentTime = audioElement2.currentTime;
        const duration = audioElement2.duration;
        
        // Calculate visible time window based on zoom
        const visibleDuration = duration / zoomState2.level;
        const visibleStartTime = zoomState2.offset * duration;
        const visibleEndTime = visibleStartTime + visibleDuration;
        
        // Check if current time is within visible range
        if (currentTime >= visibleStartTime && currentTime <= visibleEndTime) {
            // Map current time to visible waveform position
            const percentage = ((currentTime - visibleStartTime) / visibleDuration) * 100;
            waveformProgress2.style.width = Math.max(0, Math.min(100, percentage)) + '%';
        } else if (currentTime < visibleStartTime) {
            // Playhead is before visible range
            waveformProgress2.style.width = '0%';
        } else {
            // Playhead is after visible range
            waveformProgress2.style.width = '100%';
        }
        
        // Handle loop playback
        handleLoopPlayback(audioElement2, loopState2, isDraggingMarker2);
    }
});

// Play button handlers
playBtn1.addEventListener('click', () => {
    initAudioContext();
    audioContext.resume().then(() => {
        audioElement1.play();
        if (!animationId) draw();
    });
});

playBtn2.addEventListener('click', () => {
    initAudioContext();
    audioContext.resume().then(() => {
        audioElement2.play();
        if (!animationId) draw();
    });
});

// Pause button handlers
pauseBtn1.addEventListener('click', () => {
    audioElement1.pause();
});

pauseBtn2.addEventListener('click', () => {
    audioElement2.pause();
});

// Stop button handlers
stopBtn1.addEventListener('click', () => {
    audioElement1.pause();
    audioElement1.currentTime = 0;
});

stopBtn2.addEventListener('click', () => {
    audioElement2.pause();
    audioElement2.currentTime = 0;
});

// Loop button handlers
loopBtn1.addEventListener('click', () => {
    loopState1.enabled = !loopState1.enabled;
    loopBtn1.classList.toggle('active');
    
    // Show/hide quick loop section
    const quickLoopSection = document.getElementById('quickLoopSection1');
    if (quickLoopSection) {
        quickLoopSection.style.display = loopState1.enabled ? 'block' : 'none';
    }
    
    if (!loopState1.enabled) {
        clearLoopPoints(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1);
    }
});

loopBtn2.addEventListener('click', () => {
    loopState2.enabled = !loopState2.enabled;
    loopBtn2.classList.toggle('active');
    
    // Show/hide quick loop section
    const quickLoopSection = document.getElementById('quickLoopSection2');
    if (quickLoopSection) {
        quickLoopSection.style.display = loopState2.enabled ? 'block' : 'none';
    }
    
    if (!loopState2.enabled) {
        clearLoopPoints(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2);
    }
});

// Clear loop button handlers
clearLoopBtn1.addEventListener('click', () => {
    clearLoopPoints(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1);
});

clearLoopBtn2.addEventListener('click', () => {
    clearLoopPoints(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2);
});

// Quick loop functionality
function createQuickLoop(trackNumber, numBars) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const loopState = trackNumber === 1 ? loopState1 : loopState2;
    const bpmDisplay = trackNumber === 1 ? bpm1Display : bpm2Display;
    const loopRegion = trackNumber === 1 ? loopRegion1 : loopRegion2;
    const loopMarkerStart = trackNumber === 1 ? loopMarkerStart1 : loopMarkerStart2;
    const loopMarkerEnd = trackNumber === 1 ? loopMarkerEnd1 : loopMarkerEnd2;
    const zoomState = trackNumber === 1 ? zoomState1 : zoomState2;
    const autoZoomCheckbox = trackNumber === 1 ? document.getElementById('autoZoom1') : document.getElementById('autoZoom2');
    const waveform = trackNumber === 1 ? waveform1 : waveform2;
    const zoomLevelDisplay = trackNumber === 1 ? zoomLevel1Display : zoomLevel2Display;
    
    if (!audioElement.duration) {
        alert('Please load an audio file first!');
        return;
    }
    
    const bpm = parseFloat(bpmDisplay.textContent);
    if (isNaN(bpm) || bpm === 0) {
        alert('BPM not detected. Please load an audio file with a clear beat.');
        return;
    }
    
    // Calculate loop duration: 4 beats per bar, 60 seconds per minute
    const beatsPerBar = 4;
    const totalBeats = numBars * beatsPerBar;
    const loopDuration = (totalBeats / bpm) * 60;
    
    // Create loop starting from current playback position
    const startTime = audioElement.currentTime;
    const endTime = Math.min(startTime + loopDuration, audioElement.duration);
    
    // Enable loop if not already enabled
    if (!loopState.enabled) {
        loopState.enabled = true;
        const loopBtn = trackNumber === 1 ? loopBtn1 : loopBtn2;
        loopBtn.classList.add('active');
    }
    
    // Set loop points
    loopState.start = startTime;
    loopState.end = endTime;
    loopState.settingPoint = 'start';
    
    console.log(`Quick loop: ${numBars} bar(s) = ${loopDuration.toFixed(2)}s (${totalBeats} beats at ${bpm} BPM)`);
    
    // Enable export loop button
    const exportLoopBtn = trackNumber === 1 ? exportLoop1 : exportLoop2;
    exportLoopBtn.disabled = false;
    
    // Update loop markers
    updateLoopRegion(loopState, loopRegion, loopMarkerStart, loopMarkerEnd, audioElement.duration, zoomState);
    
    // Auto-zoom to loop if enabled
    if (autoZoomCheckbox && autoZoomCheckbox.checked) {
        zoomToLoop(trackNumber);
    }
}

function zoomToLoop(trackNumber) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const loopState = trackNumber === 1 ? loopState1 : loopState2;
    const zoomState = trackNumber === 1 ? zoomState1 : zoomState2;
    const waveform = trackNumber === 1 ? waveform1 : waveform2;
    const zoomLevelDisplay = trackNumber === 1 ? zoomLevel1Display : zoomLevel2Display;
    
    if (loopState.start === null || loopState.end === null) {
        return;
    }
    
    const duration = audioElement.duration;
    const loopDuration = loopState.end - loopState.start;
    const loopCenter = (loopState.start + loopState.end) / 2;
    
    // Calculate zoom level to fit the loop with some padding
    const paddingFactor = 1.5; // Show 50% extra context around the loop
    const targetVisibleDuration = loopDuration * paddingFactor;
    const targetZoomLevel = Math.min(20, Math.max(1, duration / targetVisibleDuration));
    
    // Calculate offset to center the loop
    const visibleDuration = duration / targetZoomLevel;
    const targetOffset = Math.max(0, Math.min(1 - (1 / targetZoomLevel), 
        (loopCenter / duration) - (0.5 / targetZoomLevel)));
    
    // Apply zoom
    zoomState.level = targetZoomLevel;
    zoomState.offset = targetOffset;
    
    // Redraw waveform
    redrawWaveformWithZoom(waveform, zoomState, zoomLevelDisplay);
    updateLoopMarkersAfterZoom(trackNumber);
    
    // Update cursor style
    waveform.parentElement.style.cursor = targetZoomLevel > 1 ? 'grab' : 'pointer';
}

// Quick loop button handlers
document.querySelectorAll('.quick-loop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const bars = parseInt(btn.getAttribute('data-bars'));
        const track = parseInt(btn.getAttribute('data-track'));
        createQuickLoop(track, bars);
    });
});

// Recording button handlers
recordBtn.addEventListener('click', startRecording);
stopRecordBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', downloadRecording);

// Tempo sliders
tempoSlider1.addEventListener('input', (e) => {
    const tempo = parseFloat(e.target.value);
    audioElement1.playbackRate = tempo;
    tempoValue1.textContent = tempo.toFixed(2) + 'x';
});

tempoSlider2.addEventListener('input', (e) => {
    const tempo = parseFloat(e.target.value);
    audioElement2.playbackRate = tempo;
    tempoValue2.textContent = tempo.toFixed(2) + 'x';
});

// Volume sliders
volumeSlider1.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    if (gain1) {
        gain1.gain.value = volume / 100;
    }
    audioElement1.volume = volume / 100; // Fallback for when effects not initialized
    volumeValue1.textContent = volume + '%';
});

volumeSlider2.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    if (gain2) {
        gain2.gain.value = volume / 100;
    }
    audioElement2.volume = volume / 100; // Fallback for when effects not initialized
    volumeValue2.textContent = volume + '%';
});

// Effects controls for Track 1
filterSlider1.addEventListener('input', (e) => {
    const freq = parseInt(e.target.value);
    if (filter1) {
        filter1.frequency.value = freq;
    }
    if (freq >= 1000) {
        filterValue1.textContent = (freq / 1000).toFixed(1) + 'kHz';
    } else {
        filterValue1.textContent = freq + 'Hz';
    }
});

filterType1.addEventListener('change', (e) => {
    if (filter1) {
        filter1.type = e.target.value;
    }
});

reverbSlider1.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (reverb1) {
        reverb1.wet.gain.value = wetAmount;
        reverb1.dry.gain.value = 1 - wetAmount;
    }
    reverbValue1.textContent = e.target.value + '%';
});

delaySlider1.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (delay1) {
        delay1.wet.gain.value = wetAmount;
        delay1.dry.gain.value = 1 - wetAmount;
    }
    delayValue1.textContent = e.target.value + '%';
});

delayTimeSlider1.addEventListener('input', (e) => {
    const delayTime = parseInt(e.target.value) / 1000;
    if (delay1) {
        delay1.node.delayTime.value = delayTime;
    }
    delayTimeValue1.textContent = e.target.value + 'ms';
});

// Effects controls for Track 2
filterSlider2.addEventListener('input', (e) => {
    const freq = parseInt(e.target.value);
    if (filter2) {
        filter2.frequency.value = freq;
    }
    if (freq >= 1000) {
        filterValue2.textContent = (freq / 1000).toFixed(1) + 'kHz';
    } else {
        filterValue2.textContent = freq + 'Hz';
    }
});

filterType2.addEventListener('change', (e) => {
    if (filter2) {
        filter2.type = e.target.value;
    }
});

reverbSlider2.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (reverb2) {
        reverb2.wet.gain.value = wetAmount;
        reverb2.dry.gain.value = 1 - wetAmount;
    }
    reverbValue2.textContent = e.target.value + '%';
});

delaySlider2.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (delay2) {
        delay2.wet.gain.value = wetAmount;
        delay2.dry.gain.value = 1 - wetAmount;
    }
    delayValue2.textContent = e.target.value + '%';
});

delayTimeSlider2.addEventListener('input', (e) => {
    const delayTime = parseInt(e.target.value) / 1000;
    if (delay2) {
        delay2.node.delayTime.value = delayTime;
    }
    delayTimeValue2.textContent = e.target.value + 'ms';
});

// Zoom controls for Track 1
zoomInBtn1.addEventListener('click', () => {
    if (zoomState1.level < 20) {
        const centerTime = zoomState1.offset + (0.5 / zoomState1.level);
        zoomState1.level = Math.min(20, zoomState1.level * 2);
        zoomState1.offset = Math.max(0, Math.min(1 - (1 / zoomState1.level), centerTime - (0.5 / zoomState1.level)));
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display);
        updateLoopMarkersAfterZoom(1);
        waveform1.parentElement.style.cursor = 'grab';
    }
});

zoomOutBtn1.addEventListener('click', () => {
    if (zoomState1.level > 1) {
        const centerTime = zoomState1.offset + (0.5 / zoomState1.level);
        zoomState1.level = Math.max(1, zoomState1.level / 2);
        zoomState1.offset = Math.max(0, Math.min(1 - (1 / zoomState1.level), centerTime - (0.5 / zoomState1.level)));
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display);
        updateLoopMarkersAfterZoom(1);
        waveform1.parentElement.style.cursor = zoomState1.level > 1 ? 'grab' : 'pointer';
    }
});

zoomResetBtn1.addEventListener('click', () => {
    zoomState1.level = 1.0;
    zoomState1.offset = 0.0;
    redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display);
    updateLoopMarkersAfterZoom(1);
    waveform1.parentElement.style.cursor = 'pointer';
});

// Zoom controls for Track 2
zoomInBtn2.addEventListener('click', () => {
    if (zoomState2.level < 20) {
        const centerTime = zoomState2.offset + (0.5 / zoomState2.level);
        zoomState2.level = Math.min(20, zoomState2.level * 2);
        zoomState2.offset = Math.max(0, Math.min(1 - (1 / zoomState2.level), centerTime - (0.5 / zoomState2.level)));
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display);
        updateLoopMarkersAfterZoom(2);
        waveform2.parentElement.style.cursor = 'grab';
    }
});

zoomOutBtn2.addEventListener('click', () => {
    if (zoomState2.level > 1) {
        const centerTime = zoomState2.offset + (0.5 / zoomState2.level);
        zoomState2.level = Math.max(1, zoomState2.level / 2);
        zoomState2.offset = Math.max(0, Math.min(1 - (1 / zoomState2.level), centerTime - (0.5 / zoomState2.level)));
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display);
        updateLoopMarkersAfterZoom(2);
        waveform2.parentElement.style.cursor = zoomState2.level > 1 ? 'grab' : 'pointer';
    }
});

zoomResetBtn2.addEventListener('click', () => {
    zoomState2.level = 1.0;
    zoomState2.offset = 0.0;
    redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display);
    updateLoopMarkersAfterZoom(2);
    waveform2.parentElement.style.cursor = 'pointer';
});

// Helper function to update loop marker positions after zoom
function updateLoopMarkersAfterZoom(trackNumber) {
    if (trackNumber === 1 && loopState1.start !== null && loopState1.end !== null) {
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
    } else if (trackNumber === 2 && loopState2.start !== null && loopState2.end !== null) {
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
    }
}

// Export stem (full track with effects)
async function exportStem(trackNumber) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const fileName = trackNumber === 1 ? fileName1.textContent : fileName2.textContent;
    
    if (!audioElement.src || fileName === 'No file selected') {
        alert('Please load an audio file first!');
        return;
    }
    
    try {
        // Create offline context for rendering
        const duration = audioElement.duration;
        const sampleRate = audioContext.sampleRate;
        const offlineContext = new OfflineAudioContext(2, duration * sampleRate, sampleRate);
        
        // Get the audio buffer from zoom state
        const audioBuffer = trackNumber === 1 ? zoomState1.audioBuffer : zoomState2.audioBuffer;
        
        if (!audioBuffer) {
            alert('Audio not loaded properly. Please reload the file.');
            return;
        }
        
        // Create source from buffer
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Recreate effects chain in offline context
        const gain = offlineContext.createGain();
        const filter = offlineContext.createBiquadFilter();
        const convolver = offlineContext.createConvolver();
        const delay = offlineContext.createDelay(5.0);
        const feedback = offlineContext.createGain();
        
        // Copy current settings
        const currentGain = trackNumber === 1 ? gain1 : gain2;
        const currentFilter = trackNumber === 1 ? filter1 : filter2;
        const currentReverb = trackNumber === 1 ? reverb1 : reverb2;
        const currentDelay = trackNumber === 1 ? delay1 : delay2;
        
        gain.gain.value = currentGain.gain.value;
        filter.type = currentFilter.type;
        filter.frequency.value = currentFilter.frequency.value;
        filter.Q.value = currentFilter.Q.value;
        
        // Create reverb impulse
        convolver.buffer = currentReverb.convolver.buffer;
        
        delay.delayTime.value = currentDelay.node.delayTime.value;
        feedback.gain.value = currentDelay.feedback.gain.value;
        
        // Create wet/dry gains
        const reverbWet = offlineContext.createGain();
        const reverbDry = offlineContext.createGain();
        const delayWet = offlineContext.createGain();
        const delayDry = offlineContext.createGain();
        
        reverbWet.gain.value = currentReverb.wet.gain.value;
        reverbDry.gain.value = currentReverb.dry.gain.value;
        delayWet.gain.value = currentDelay.wet.gain.value;
        delayDry.gain.value = currentDelay.dry.gain.value;
        
        // Connect effects chain
        source.connect(gain);
        gain.connect(filter);
        
        filter.connect(convolver);
        convolver.connect(reverbWet);
        filter.connect(reverbDry);
        
        const reverbMix = offlineContext.createGain();
        reverbWet.connect(reverbMix);
        reverbDry.connect(reverbMix);
        
        reverbMix.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayWet);
        reverbMix.connect(delayDry);
        
        const finalMix = offlineContext.createGain();
        delayWet.connect(finalMix);
        delayDry.connect(finalMix);
        
        finalMix.connect(offlineContext.destination);
        
        // Start rendering
        source.start(0);
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to WAV and download
        const wav = audioBufferToWav(renderedBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Track${trackNumber}_with_effects.wav`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('Stem exported successfully!');
    } catch (error) {
        console.error('Error exporting stem:', error);
        alert('Error exporting stem. Please try again.');
    }
}

// Export loop region
async function exportLoop(trackNumber) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const loopState = trackNumber === 1 ? loopState1 : loopState2;
    const fileName = trackNumber === 1 ? fileName1.textContent : fileName2.textContent;
    
    if (!audioElement.src || fileName === 'No file selected') {
        alert('Please load an audio file first!');
        return;
    }
    
    if (loopState.start === null || loopState.end === null) {
        alert('Please set loop points first!');
        return;
    }
    
    try {
        const audioBuffer = trackNumber === 1 ? zoomState1.audioBuffer : zoomState2.audioBuffer;
        
        if (!audioBuffer) {
            alert('Audio not loaded properly. Please reload the file.');
            return;
        }
        
        // Calculate loop samples
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(loopState.start * sampleRate);
        const endSample = Math.floor(loopState.end * sampleRate);
        const loopLength = endSample - startSample;
        
        // Create new buffer with just the loop
        const loopBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            loopLength,
            sampleRate
        );
        
        // Copy loop data to new buffer
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const sourceData = audioBuffer.getChannelData(channel);
            const loopData = loopBuffer.getChannelData(channel);
            for (let i = 0; i < loopLength; i++) {
                loopData[i] = sourceData[startSample + i];
            }
        }
        
        // Create offline context for rendering with effects
        const offlineContext = new OfflineAudioContext(
            loopBuffer.numberOfChannels,
            loopLength,
            sampleRate
        );
        
        // Create source from loop buffer
        const source = offlineContext.createBufferSource();
        source.buffer = loopBuffer;
        
        // Recreate effects (same as exportStem)
        const gain = offlineContext.createGain();
        const filter = offlineContext.createBiquadFilter();
        const convolver = offlineContext.createConvolver();
        const delay = offlineContext.createDelay(5.0);
        const feedback = offlineContext.createGain();
        
        const currentGain = trackNumber === 1 ? gain1 : gain2;
        const currentFilter = trackNumber === 1 ? filter1 : filter2;
        const currentReverb = trackNumber === 1 ? reverb1 : reverb2;
        const currentDelay = trackNumber === 1 ? delay1 : delay2;
        
        gain.gain.value = currentGain.gain.value;
        filter.type = currentFilter.type;
        filter.frequency.value = currentFilter.frequency.value;
        filter.Q.value = currentFilter.Q.value;
        convolver.buffer = currentReverb.convolver.buffer;
        delay.delayTime.value = currentDelay.node.delayTime.value;
        feedback.gain.value = currentDelay.feedback.gain.value;
        
        const reverbWet = offlineContext.createGain();
        const reverbDry = offlineContext.createGain();
        const delayWet = offlineContext.createGain();
        const delayDry = offlineContext.createGain();
        
        reverbWet.gain.value = currentReverb.wet.gain.value;
        reverbDry.gain.value = currentReverb.dry.gain.value;
        delayWet.gain.value = currentDelay.wet.gain.value;
        delayDry.gain.value = currentDelay.dry.gain.value;
        
        // Connect chain
        source.connect(gain);
        gain.connect(filter);
        filter.connect(convolver);
        convolver.connect(reverbWet);
        filter.connect(reverbDry);
        
        const reverbMix = offlineContext.createGain();
        reverbWet.connect(reverbMix);
        reverbDry.connect(reverbMix);
        
        reverbMix.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayWet);
        reverbMix.connect(delayDry);
        
        const finalMix = offlineContext.createGain();
        delayWet.connect(finalMix);
        delayDry.connect(finalMix);
        finalMix.connect(offlineContext.destination);
        
        source.start(0);
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to WAV and download
        const wav = audioBufferToWav(renderedBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Track${trackNumber}_loop_${formatTime(loopState.start)}-${formatTime(loopState.end)}.wav`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log('Loop exported successfully!');
    } catch (error) {
        console.error('Error exporting loop:', error);
        alert('Error exporting loop. Please try again.');
    }
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = [];
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            data.push(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        }
    }
    
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
        view.setInt16(offset, data[i], true);
        offset += 2;
    }
    
    return arrayBuffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Export button handlers
exportStem1.addEventListener('click', () => exportStem(1));
exportLoop1.addEventListener('click', () => exportLoop(1));
exportStem2.addEventListener('click', () => exportStem(2));
exportLoop2.addEventListener('click', () => exportLoop(2));

// Mode buttons
modeCircleBtn.addEventListener('click', () => {
    currentMode = 'circle';
    createCircleVisualization();
    updateModeButtons();
});

modeBarsBtn.addEventListener('click', () => {
    currentMode = 'bars';
    createBarsVisualization();
    updateModeButtons();
});

modeSphereBtn.addEventListener('click', () => {
    currentMode = 'sphere';
    createSphereVisualization();
    updateModeButtons();
});

function updateModeButtons() {
    [modeCircleBtn, modeBarsBtn, modeSphereBtn].forEach(btn => btn.classList.remove('active'));
    if (currentMode === 'circle') modeCircleBtn.classList.add('active');
    if (currentMode === 'bars') modeBarsBtn.classList.add('active');
    if (currentMode === 'sphere') modeSphereBtn.classList.add('active');
}

// Animation function (reused from original but uses merged audio)
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        
        const bassSum = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
        const trebleSum = dataArray.slice(dataArray.length - 16).reduce((a, b) => a + b, 0) / 16;
        bassLevel = bassSum / 255;
        trebleLevel = trebleSum / 255;
        
        detectMusicalKey();
        
        if (currentMode === 'circle') {
            visualizationObjects.forEach((bar, i) => {
                const dataIndex = Math.min(
                    Math.floor((i / visualizationObjects.length) * (bufferLength - 1)),
                    bufferLength - 1
                );
                const audioValue = dataArray[dataIndex] || dataArray[i % bufferLength] || 0;
                const scale = (audioValue / 255) * 15 * bar.userData.randomAmplitude + 1;
                bar.userData.targetScale = scale;
                
                bar.userData.velocity += (bar.userData.targetScale - bar.scale.y) * (0.2 * bar.userData.randomSpeed);
                bar.userData.velocity *= 0.85;
                bar.scale.y += bar.userData.velocity;
                bar.position.y = (bar.scale.y - 1) * 0.5;
                
                const radiusOffset = bassLevel * 8 * bar.userData.randomAmplitude;
                const currentRadius = 1 + radiusOffset / 20;
                bar.position.x = bar.userData.baseX * currentRadius;
                bar.position.z = bar.userData.baseZ * currentRadius;
                
                const wave1 = Math.sin(Date.now() * 0.003 * bar.userData.randomSpeed + i * 0.1 + bar.userData.randomPhase) * trebleLevel * 3 * bar.userData.randomAmplitude;
                const wave2 = Math.cos(Date.now() * 0.005 * bar.userData.randomSpeed + i * 0.15 + bar.userData.randomPhase) * bassLevel * 2;
                const wave3 = Math.sin(Date.now() * 0.004 + bar.userData.randomPhase) * (audioValue / 255) * 2;
                bar.position.y += wave1 + wave2 + wave3;
                
                const twist = Math.sin(Date.now() * 0.002 + i * 0.05 + bar.userData.randomPhase) * bassLevel * 0.3 * bar.userData.randomAmplitude;
                bar.rotation.z = twist;
                
                bar.userData.rotationSpeed += (audioValue / 255) * 0.05 * bar.userData.randomSpeed;
                bar.userData.rotationSpeed *= 0.95;
                bar.rotation.x += bar.userData.rotationSpeed;
                
                const widthScale = 1 + (audioValue / 255) * 0.5 * bar.userData.randomAmplitude;
                bar.scale.x = widthScale;
                bar.scale.z = widthScale;
                
                bar.material.opacity = 0.7 + (audioValue / 255) * 0.3 + Math.sin(Date.now() * 0.002 + bar.userData.randomPhase) * 0.1;
                
                if (bar.userData.explosionForce > 0) {
                    const timeSinceExplosion = (Date.now() - bar.userData.explosionTime) / 1000;
                    const explosionScale = Math.max(0, bar.userData.explosionForce * (1 - timeSinceExplosion));
                    bar.scale.y *= (1 + explosionScale * 2);
                    bar.scale.x *= (1 + explosionScale);
                    bar.scale.z *= (1 + explosionScale);
                    bar.userData.rotationSpeed += bar.userData.spinBoost;
                    bar.userData.spinBoost *= 0.95;
                    bar.userData.explosionForce *= 0.9;
                }
                
                if (bar.userData.rippleForce > 0) {
                    bar.scale.y *= (1 + bar.userData.rippleForce);
                    bar.userData.rippleForce *= 0.9;
                }
                
                if (bar.userData.isSelected) {
                    bar.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    bar.material.emissiveIntensity = 1 + glowPulse;
                }
            });
            
            scene.rotation.y += 0.002 + bassLevel * 0.005 + Math.sin(Date.now() * 0.001) * 0.001;
            scene.rotation.z = Math.sin(Date.now() * 0.001) * trebleLevel * 0.03;
            scene.rotation.x = Math.cos(Date.now() * 0.0008) * bassLevel * 0.02;
            
        } else if (currentMode === 'bars') {
            visualizationObjects.forEach((bar, i) => {
                const audioValue = dataArray[i * 2] || 0;
                const scale = (audioValue / 255) * 20 * bar.userData.randomBounce + 1;
                bar.userData.targetScale = scale;
                
                bar.userData.velocity += (bar.userData.targetScale - bar.scale.y) * (0.25 * bar.userData.randomBounce);
                bar.userData.velocity *= 0.8;
                bar.scale.y += bar.userData.velocity;
                bar.position.y = (bar.scale.y - 1) * 0.5;
                
                const pulse = Math.sin(Date.now() * 0.005 + bar.userData.pulsePhase) * bassLevel * 1.5 * bar.userData.randomBounce;
                bar.scale.x = 1 + pulse + (audioValue / 255) * 0.8;
                bar.scale.z = 1 + pulse + (audioValue / 255) * 0.8;
                
                const waveX = Math.sin(Date.now() * 0.004 + i * 0.2 + bar.userData.randomWave) * bassLevel * 5 * bar.userData.randomBounce;
                bar.position.x = bar.userData.baseX + waveX;
                
                const jump = Math.abs(Math.sin(Date.now() * 0.006 + i * 0.15 + bar.userData.randomWave)) * trebleLevel * 4 * bar.userData.randomBounce;
                bar.position.y += jump;
                
                const waveZ = Math.cos(Date.now() * 0.003 + i * 0.25 + bar.userData.randomWave) * trebleLevel * 2;
                bar.position.z = waveZ;
                
                bar.userData.tiltX += ((audioValue / 255) * 0.5 * bar.userData.randomBounce - bar.userData.tiltX) * 0.2;
                bar.userData.tiltZ += (Math.sin(Date.now() * 0.003 + i * 0.1) * bassLevel * 0.5 - bar.userData.tiltZ) * 0.2;
                bar.rotation.x = bar.userData.tiltX;
                bar.rotation.z = bar.userData.tiltZ;
                
                bar.userData.rotationVelocity += (audioValue / 255) * 0.08 * bar.userData.randomSpin;
                bar.userData.rotationVelocity *= 0.92;
                bar.rotation.y += bar.userData.rotationVelocity + trebleLevel * 0.05 * bar.userData.randomSpin;
                
                bar.material.opacity = 0.75 + (audioValue / 255) * 0.25 + Math.sin(Date.now() * 0.003 + bar.userData.randomWave) * 0.1;
                
                if (bar.userData.explosionForce > 0) {
                    const timeSinceExplosion = (Date.now() - bar.userData.explosionTime) / 1000;
                    const explosionScale = Math.max(0, bar.userData.explosionForce * (1 - timeSinceExplosion));
                    bar.scale.y *= (1 + explosionScale * 3);
                    bar.scale.x *= (1 + explosionScale * 0.5);
                    bar.scale.z *= (1 + explosionScale * 0.5);
                    bar.position.y += explosionScale * 10;
                    bar.userData.rotationVelocity += bar.userData.spinBoost;
                    bar.userData.spinBoost *= 0.95;
                    bar.userData.explosionForce *= 0.9;
                }
                
                if (bar.userData.rippleForce > 0) {
                    bar.scale.y *= (1 + bar.userData.rippleForce * 2);
                    bar.position.y += bar.userData.rippleForce * 3;
                    bar.userData.rippleForce *= 0.9;
                }
                
                if (bar.userData.isSelected) {
                    bar.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    bar.material.emissiveIntensity = 1 + glowPulse;
                }
            });
            
            scene.rotation.y += 0.001 + bassLevel * 0.004 + Math.sin(Date.now() * 0.0005) * 0.001;
            scene.rotation.x = Math.sin(Date.now() * 0.002) * 0.05 + trebleLevel * 0.03 + Math.cos(Date.now() * 0.0007) * 0.02;
            scene.rotation.z = Math.cos(Date.now() * 0.0015) * 0.04 + bassLevel * 0.02;
            
        } else if (currentMode === 'sphere') {
            visualizationObjects.forEach((sphere, i) => {
                const dataIndex = Math.floor((i / visualizationObjects.length) * bufferLength);
                const audioValue = dataArray[dataIndex] || 0;
                const scale = (audioValue / 255) * 3 * sphere.userData.randomGlow + 0.5;
                sphere.userData.targetScale = scale;
                
                sphere.userData.velocity += (sphere.userData.targetScale - sphere.scale.x) * 0.3;
                sphere.userData.velocity *= 0.85;
                const newScale = sphere.scale.x + sphere.userData.velocity;
                sphere.scale.set(newScale, newScale, newScale);
                
                const pulseAmount = 1 + bassLevel * 0.5 * sphere.userData.randomGlow + (audioValue / 255) * 0.3;
                sphere.position.x = sphere.userData.baseX * pulseAmount;
                sphere.position.y = sphere.userData.baseY * pulseAmount;
                sphere.position.z = sphere.userData.baseZ * pulseAmount;
                
                const float1 = Math.sin(Date.now() * sphere.userData.pulseSpeed + sphere.userData.randomFloat) * trebleLevel * 4 * sphere.userData.randomGlow;
                const float2 = Math.cos(Date.now() * sphere.userData.pulseSpeed * 0.7 + sphere.userData.randomFloat) * trebleLevel * 3;
                const float3 = Math.sin(Date.now() * sphere.userData.pulseSpeed * 1.3 + sphere.userData.randomFloat) * bassLevel * 3;
                const float4 = Math.cos(Date.now() * sphere.userData.pulseSpeed * 0.5 + sphere.userData.randomFloat) * (audioValue / 255) * 2;
                
                sphere.position.x += float1 + float4;
                sphere.position.y += float2 + float4 * 0.7;
                sphere.position.z += float3 + float4 * 0.5;
                
                const orbitAngle = Date.now() * sphere.userData.randomOrbit;
                sphere.position.x += Math.cos(orbitAngle) * bassLevel * 3;
                sphere.position.z += Math.sin(orbitAngle) * bassLevel * 3;
                
                sphere.rotation.x += sphere.userData.rotationSpeed * (1 + trebleLevel) * sphere.userData.randomGlow;
                sphere.rotation.y += sphere.userData.rotationSpeed * 0.7 * (1 + bassLevel);
                sphere.rotation.z += sphere.userData.rotationSpeed * 0.5;
                
                const wobble = Math.sin(Date.now() * 0.004 + i * 0.2 + sphere.userData.randomFloat) * bassLevel * 0.3 * sphere.userData.randomGlow;
                sphere.rotation.x += wobble;
                
                sphere.material.opacity = 0.5 + (audioValue / 255) * 0.4 * sphere.userData.randomGlow + Math.sin(Date.now() * sphere.userData.pulseSpeed) * 0.2;
                
                const glowIntensity = (audioValue / 255) * sphere.userData.randomGlow;
                sphere.material.emissiveIntensity = 0.3 + glowIntensity * 0.7;
                
                if (sphere.userData.explosionForce > 0) {
                    const timeSinceExplosion = (Date.now() - sphere.userData.explosionTime) / 1000;
                    const explosionScale = Math.max(0, sphere.userData.explosionForce * (1 - timeSinceExplosion * 0.7));
                    const currentScale = sphere.scale.x * (1 + explosionScale * 2);
                    sphere.scale.set(currentScale, currentScale, currentScale);
                    sphere.userData.rotationSpeed += sphere.userData.spinBoost;
                    sphere.userData.spinBoost *= 0.95;
                    sphere.userData.explosionForce *= 0.92;
                    
                    const pushAmount = 1 + explosionScale;
                    sphere.position.x = sphere.userData.baseX * pulseAmount * pushAmount;
                    sphere.position.y = sphere.userData.baseY * pulseAmount * pushAmount;
                    sphere.position.z = sphere.userData.baseZ * pulseAmount * pushAmount;
                }
                
                if (sphere.userData.rippleForce > 0) {
                    const rippleScale = sphere.scale.x * (1 + sphere.userData.rippleForce);
                    sphere.scale.set(rippleScale, rippleScale, rippleScale);
                    sphere.userData.rippleForce *= 0.92;
                }
                
                if (sphere.userData.isSelected) {
                    sphere.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    sphere.material.emissiveIntensity = 2 + glowPulse * 2;
                }
            });
            
            scene.rotation.x += 0.001 + trebleLevel * 0.002 + Math.sin(Date.now() * 0.0006) * 0.001;
            scene.rotation.y += 0.001 + bassLevel * 0.003 + Math.cos(Date.now() * 0.0004) * 0.001;
            scene.rotation.z = Math.sin(Date.now() * 0.002) * bassLevel * 0.05 + Math.cos(Date.now() * 0.0008) * trebleLevel * 0.03;
        }
        
        // Update particles
        if (particleSystem) {
            particleSystem.rotation.y += 0.0005;
            particleSystem.rotation.x += 0.0002;
            
            const positions = particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01 * bassLevel;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    // Smooth camera movement
    camera.position.x += (cameraRotation.y - camera.position.x) * 0.05;
    camera.position.y = 10 + cameraRotation.x * 10;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

// For audio drawing
function draw() {
    animate();
}
