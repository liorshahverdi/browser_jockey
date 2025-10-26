// Recording functionality
import { drawWaveform } from './audio-utils.js';
import { formatTime } from './loop-controls.js';

// Start recording the master output
export function startRecording(audioContext, recordingDestination, recordingAnalyser, recordingElements, recordingState) {
    if (!audioContext || !recordingDestination) {
        alert('Please load at least one audio file first!');
        return false;
    }
    
    if (!recordingAnalyser) {
        console.error('Recording analyser not initialized!');
        alert('Recording analyser not ready. Please try again.');
        return false;
    }
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    console.log('Starting recording with analyser connected:', recordingAnalyser);
    console.log('Recording destination stream:', recordingDestination.stream);
    console.log('Stream tracks:', recordingDestination.stream.getTracks());
    
    recordingState.chunks = [];
    recordingState.blob = null;
    
    // Hide export group until recording is stopped
    if (recordingElements.exportGroup) {
        recordingElements.exportGroup.style.display = 'none';
    }
    
    // Try different MIME types to find one that works (similar to microphone recording)
    const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
    ];
    
    let selectedMimeType = null;
    for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType;
            console.log('Using MIME type for master recording:', mimeType);
            break;
        }
    }
    
    // Create MediaRecorder from the destination stream
    let options = {};
    if (selectedMimeType) {
        options = { mimeType: selectedMimeType };
    } else {
        console.warn('No preferred MIME type supported, using browser default');
    }
    
    try {
        recordingState.mediaRecorder = new MediaRecorder(recordingDestination.stream, options);
        console.log('MediaRecorder created successfully with mimeType:', recordingState.mediaRecorder.mimeType);
    } catch (e) {
        console.error('MediaRecorder error:', e);
        alert('Recording not supported in this browser');
        return false;
    }
    
    recordingState.mediaRecorder.ondataavailable = (event) => {
        console.log('MediaRecorder data available, size:', event.data.size);
        if (event.data.size > 0) {
            recordingState.chunks.push(event.data);
            console.log('Chunk added, total chunks:', recordingState.chunks.length);
        } else {
            console.warn('Received empty data chunk');
        }
    };
    
    recordingState.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks:', recordingState.chunks.length);
        
        // Calculate total size
        let totalSize = 0;
        recordingState.chunks.forEach((chunk, index) => {
            totalSize += chunk.size;
            console.log(`  Chunk ${index}: ${chunk.size} bytes, type: ${chunk.type}`);
        });
        console.log('Total data size:', totalSize, 'bytes');
        
        if (totalSize === 0) {
            console.error('⚠️ WARNING: No audio data was recorded! The chunks are empty.');
            alert('Recording completed but no audio data was captured. This can happen if:\n\n1. The audio source is not connected to the master output\n2. The volume is muted\n3. The audio stream is paused in the source tab\n\nTry:\n- Make sure audio is playing in the source tab\n- Check master volume is not at 0\n- Verify the track is not muted');
        }
        
        const blob = new Blob(recordingState.chunks, { type: 'audio/webm' });
        console.log('Created blob, size:', blob.size, 'type:', blob.type);
        recordingState.blob = blob;
        const url = URL.createObjectURL(blob);
        
        if (recordingElements.audio) {
            recordingElements.audio.src = url;
        }
        
        // Only try to decode if we have data
        if (totalSize > 0) {
            // Decode and draw waveform
            console.log('Starting to decode audio for waveform...');
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    console.log('FileReader loaded, arrayBuffer size:', e.target.result.byteLength);
                    const arrayBuffer = e.target.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    console.log('Audio decoded successfully, duration:', audioBuffer.duration, 'channels:', audioBuffer.numberOfChannels);
                    if (recordingElements.waveform) {
                        console.log('Drawing waveform to canvas...');
                        drawWaveform(recordingElements.waveform, audioBuffer);
                        console.log('Waveform drawn successfully');
                    }
                    if (recordingElements.waveformContainer) {
                        recordingElements.waveformContainer.style.display = 'block';
                    }
                } catch (err) {
                    console.error('Error decoding recorded audio:', err);
                    console.error('Error name:', err.name, 'Error message:', err.message);
                    alert(`Could not decode recording: ${err.message}\n\nThe recording file may be corrupted or in an unsupported format.`);
                }
            };
            reader.onerror = (err) => {
                console.error('FileReader error:', err);
            };
            reader.readAsArrayBuffer(blob);
        } else {
            console.log('Skipping waveform decode since no audio data was captured');
        }
        
        // Show export group
        if (recordingElements.exportGroup) {
            recordingElements.exportGroup.style.display = 'flex';
        }
    };
    
    // Add error handler
    recordingState.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error event:', event);
        console.error('Error:', event.error);
    };
    
    // Add start handler
    recordingState.mediaRecorder.onstart = () => {
        console.log('MediaRecorder started, state:', recordingState.mediaRecorder.state);
    };
    
    // Start recording
    recordingState.mediaRecorder.start();
    console.log('MediaRecorder.start() called, initial state:', recordingState.mediaRecorder.state);
    recordingState.startTime = Date.now();
    
    // Monitor audio levels to detect if any audio is flowing
    const monitorAudioLevel = () => {
        const dataArray = new Uint8Array(recordingAnalyser.frequencyBinCount);
        recordingAnalyser.getByteTimeDomainData(dataArray);
        
        // Calculate RMS (Root Mean Square) to detect audio level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const dbLevel = 20 * Math.log10(rms);
        
        console.log('🎵 Audio level check - RMS:', rms.toFixed(4), 'dB:', dbLevel.toFixed(1), 'Raw sample:', dataArray[0]);
        
        if (rms < 0.001) {
            console.warn('⚠️ WARNING: Audio level is extremely low or silent!');
            console.warn('   This means no audio is flowing to the recording destination.');
            console.warn('   Check that your tab capture audio is playing and connected properly.');
        }
    };
    
    // Check audio level after 1 second
    setTimeout(monitorAudioLevel, 1000);
    
    // Update recording time
    recordingState.interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingState.startTime) / 1000);
        if (recordingElements.time) {
            recordingElements.time.textContent = formatTime(elapsed);
        }
    }, 100);
    
    // Show waveform container and start real-time drawing
    if (recordingElements.waveformContainer) {
        recordingElements.waveformContainer.style.display = 'block';
    }
    
    // Start real-time waveform drawing
    drawRecordingWaveform(recordingAnalyser, recordingElements.waveform, recordingState);
    
    // Update UI
    if (recordingElements.recordBtn) {
        recordingElements.recordBtn.style.display = 'none';
    }
    if (recordingElements.stopBtn) {
        recordingElements.stopBtn.disabled = false;
        recordingElements.stopBtn.style.display = 'inline-block';
    }
    if (recordingElements.time) {
        recordingElements.time.style.display = 'inline-block';
    }
    
    return true;
}

// Stop recording
export function stopRecording(recordingState, recordingElements) {
    if (recordingState.mediaRecorder && recordingState.mediaRecorder.state !== 'inactive') {
        recordingState.mediaRecorder.stop();
        clearInterval(recordingState.interval);
        
        // Stop real-time waveform animation
        if (recordingState.animationId) {
            cancelAnimationFrame(recordingState.animationId);
            recordingState.animationId = null;
        }
        
        // Update UI
        if (recordingElements.stopBtn) {
            recordingElements.stopBtn.style.display = 'none';
        }
        if (recordingElements.recordBtn) {
            recordingElements.recordBtn.style.display = 'inline-block';
        }
        if (recordingElements.time) {
            recordingElements.time.style.display = 'none';
        }
    }
}

// Draw real-time recording waveform
export function drawRecordingWaveform(recordingAnalyser, canvas, recordingState) {
    if (!recordingAnalyser || !canvas) {
        console.warn('Recording analyser or canvas not initialized');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    const bufferLength = recordingAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        recordingState.animationId = requestAnimationFrame(draw);
        
        recordingAnalyser.getByteTimeDomainData(dataArray);
        
        // Clear with slight trail
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
        
        // Add center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }
    
    draw();
}

// Convert AudioBuffer to WAV format
export function audioBufferToWav(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        data.push(audioBuffer.getChannelData(i));
    }
    
    const dataLength = audioBuffer.length * numberOfChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    
    // Write WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write interleaved audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, data[channel][i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return buffer;
}

// Convert AudioBuffer to MP3 using lamejs
export function audioBufferToMp3(audioBuffer) {
    const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);
    const samples = [];
    
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        const int16Array = new Int16Array(channelData.length);
        for (let j = 0; j < channelData.length; j++) {
            const s = Math.max(-1, Math.min(1, channelData[j]));
            int16Array[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        samples.push(int16Array);
    }
    
    const mp3Data = [];
    const sampleBlockSize = 1152;
    
    for (let i = 0; i < samples[0].length; i += sampleBlockSize) {
        const leftChunk = samples[0].subarray(i, i + sampleBlockSize);
        const rightChunk = audioBuffer.numberOfChannels > 1 ? samples[1].subarray(i, i + sampleBlockSize) : leftChunk;
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }
    
    return new Blob(mp3Data, { type: 'audio/mp3' });
}

// Download recording in specified format
export async function downloadRecording(recordedBlob, format, audioContext) {
    if (!recordedBlob) {
        alert('No recording available');
        return;
    }
    
    try {
        let blob, extension, filename;
        
        if (format === 'webm') {
            blob = recordedBlob;
            extension = 'webm';
        } else if (format === 'wav') {
            const arrayBuffer = await recordedBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const wav = audioBufferToWav(audioBuffer);
            blob = new Blob([wav], { type: 'audio/wav' });
            extension = 'wav';
        } else if (format === 'mp3') {
            // Check if lamejs is available
            if (typeof lamejs === 'undefined') {
                alert('MP3 encoder not loaded. Please use WAV or WebM format.');
                return false;
            }
            const arrayBuffer = await recordedBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            blob = audioBufferToMp3(audioBuffer);
            extension = 'mp3';
        } else {
            alert(`Unsupported format: ${format}`);
            return false;
        }
        
        filename = `mix_recording_${new Date().getTime()}.${extension}`;
        
        // Download the file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`Recording downloaded as ${extension.toUpperCase()}`);
        return true;
    } catch (error) {
        console.error('Error downloading recording:', error);
        alert('Error downloading recording. Please try again.');
        return false;
    }
}
