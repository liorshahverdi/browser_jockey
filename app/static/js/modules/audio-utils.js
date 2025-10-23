// Audio analysis and waveform utilities
import { noteFrequencies } from './constants.js';

// Draw waveform on canvas with zoom support
export function drawWaveform(canvas, audioBuffer, zoomLevel = 1.0, zoomOffset = 0.0, color = 'rgba(0, 255, 255, 0.8)') {
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
    ctx.strokeStyle = color;
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
export function redrawWaveformWithZoom(canvas, zoomState, zoomLevelDisplay, trackNumber, waveformColors) {
    if (!zoomState.audioBuffer) return;
    
    const color = trackNumber === 1 ? waveformColors.track1 : waveformColors.track2;
    drawWaveform(canvas, zoomState.audioBuffer, zoomState.level, zoomState.offset, color);
    zoomLevelDisplay.textContent = zoomState.level.toFixed(1) + 'x';
}

// Draw waveform on canvas (simple version)
export function drawWaveformSimple(canvas, audioBuffer) {
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
export function detectBPM(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Analyze first 30 seconds of audio
    const samplesPerAnalysis = Math.min(sampleRate * 30, data.length);
    const samples = data.slice(0, samplesPerAnalysis);
    
    // Calculate energy in windows
    const energyBuffer = [];
    const windowSize = 2048;
    const hopSize = 512;
    
    for (let i = 0; i < samples.length - windowSize; i += hopSize) {
        let energy = 0;
        for (let j = 0; j < windowSize; j++) {
            const sample = samples[i + j];
            energy += sample * sample;
        }
        energyBuffer.push(Math.sqrt(energy / windowSize));
    }
    
    // Find dynamic threshold
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
    
    // Use histogram to find most common interval
    const histogram = {};
    const tolerance = 3;
    
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
export function detectKey(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const data = audioBuffer.getChannelData(0);
    
    // Analyze first 10 seconds
    const analysisLength = Math.min(sampleRate * 10, data.length);
    const samples = data.slice(0, analysisLength);
    
    const fftSize = 8192;
    const chromaProfile = new Array(12).fill(0);
    
    // Process windows
    for (let i = 0; i < samples.length - fftSize; i += fftSize / 2) {
        const window = samples.slice(i, i + fftSize);
        
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

// Detect musical key from real-time frequency data
export function detectMusicalKey(analyser, dataArray, audioContext) {
    if (!analyser || !dataArray) return null;
    
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
    
    return closestNote;
}

// Load audio file and perform analysis
export async function loadAudioFile(file, canvas, bpmDisplay, audioElement, zoomState, keyDisplay) {
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
    
    return audioBuffer;
}
