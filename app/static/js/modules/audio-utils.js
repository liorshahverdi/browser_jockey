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

// Detect BPM using energy-envelope peak picking with half/double-tempo disambiguation
export function detectBPM(audioBuffer) {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Preferred BPM range for DJ / dance music (configurable)
    const BPM_MIN = 70;
    const BPM_MAX = 180;

    // Analyse up to 60 s — a longer window gives more peaks and reduces the
    // chance of a half-time groove producing too few intervals to disambiguate.
    const samplesPerAnalysis = Math.min(sampleRate * 60, data.length);
    const samples = data.slice(0, samplesPerAnalysis);

    // RMS energy envelope
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

    // Dynamic threshold
    const mean = energyBuffer.reduce((sum, val) => sum + val, 0) / energyBuffer.length;
    const variance = energyBuffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / energyBuffer.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + stdDev * 0.5;

    // Minimum frame distance between accepted peaks: beats cannot exceed 240 BPM.
    // Without this constraint, sub-beat energy spikes (hi-hats, transients) create
    // very short intervals that pollute the histogram and skew the tempo estimate.
    const minPeakDistance = Math.ceil((sampleRate / hopSize) * (60 / 240));

    // Find local-maximum peaks above threshold, enforcing minimum spacing.
    // When two candidate peaks are closer than minPeakDistance, keep the stronger one.
    const peaks = [];
    for (let i = 1; i < energyBuffer.length - 1; i++) {
        if (energyBuffer[i] > threshold &&
            energyBuffer[i] > energyBuffer[i - 1] &&
            energyBuffer[i] > energyBuffer[i + 1]) {
            if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minPeakDistance) {
                peaks.push(i);
            } else if (energyBuffer[i] > energyBuffer[peaks[peaks.length - 1]]) {
                // Closer than min distance but stronger — replace
                peaks[peaks.length - 1] = i;
            }
        }
    }

    if (peaks.length < 4) return 0;

    // Inter-peak intervals (in energy-frame units)
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
    }

    // Histogram: bin intervals within ±3 frames as the same beat period
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

    // Primary candidate: interval with the highest count
    let maxCount = 0;
    let mostCommonInterval = 0;
    for (const interval in histogram) {
        if (histogram[interval] > maxCount) {
            maxCount = histogram[interval];
            mostCommonInterval = parseInt(interval);
        }
    }

    if (mostCommonInterval === 0) return 0;

    // Half/double-tempo disambiguation:
    // A half-time groove (heavy transient every 2 beats) can make the detector lock
    // onto an interval 2× the true beat period (reporting half the real BPM).
    // Check whether half the detected interval also has significant histogram support —
    // if ≥ 40 % as many intervals cluster there, the true beat is at the shorter period.
    const halfInterval = Math.round(mostCommonInterval / 2);
    if (halfInterval >= minPeakDistance) {
        let halfCount = 0;
        for (const key in histogram) {
            if (Math.abs(parseInt(key) - halfInterval) <= tolerance) {
                halfCount += histogram[key];
            }
        }
        if (halfCount >= maxCount * 0.4) {
            mostCommonInterval = halfInterval;
        }
    }

    // Convert to BPM
    const secondsPerBeat = (mostCommonInterval * hopSize) / sampleRate;
    let bpm = 60 / secondsPerBeat;

    // Normalise to preferred range.
    // BPM_MIN = 70 (not 60) so a half-time misdetection at 64 BPM is doubled to 128.
    while (bpm < BPM_MIN) bpm *= 2;
    while (bpm > BPM_MAX) bpm /= 2;

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
