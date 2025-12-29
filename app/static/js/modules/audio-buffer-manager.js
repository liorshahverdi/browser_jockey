/**
 * Audio Buffer Manager
 * 
 * Manages AudioBuffer creation and reversal for smooth reverse playback.
 * Uses loop-only buffer reversal to minimize memory usage while providing
 * professional-quality reverse playback for DJ use case.
 */

export class AudioBufferManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.buffers = new Map(); // trackId -> { original: AudioBuffer, loopBuffers: Map }
    }

    /**
     * Load and decode an audio file into an AudioBuffer
     * @param {File|Blob} file - The audio file to load
     * @param {string} trackId - Unique identifier for this track
     * @returns {Promise<AudioBuffer>} The decoded audio buffer
     */
    async loadAudioBuffer(file, trackId) {
        console.log(`Loading audio buffer for track ${trackId}...`);
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        // Store original buffer with empty loop cache
        this.buffers.set(trackId, {
            original: audioBuffer,
            loopBuffers: new Map() // Cache for pre-rendered loop sections
        });
        
        console.log(`✅ Audio buffer loaded for track ${trackId}: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels`);
        return audioBuffer;
    }

    /**
     * Create a reversed version of an AudioBuffer
     * @param {AudioBuffer} audioBuffer - The buffer to reverse
     * @returns {AudioBuffer} A new reversed buffer
     */
    reverseAudioBuffer(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        
        // Create a new buffer with same properties
        const reversedBuffer = this.audioContext.createBuffer(
            numberOfChannels,
            length,
            sampleRate
        );
        
        // Reverse each channel
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const originalData = audioBuffer.getChannelData(channel);
            const reversedData = reversedBuffer.getChannelData(channel);
            
            // Copy data in reverse order
            for (let i = 0; i < length; i++) {
                reversedData[i] = originalData[length - 1 - i];
            }
        }
        
        return reversedBuffer;
    }

    /**
     * Extract and reverse a loop section for seamless playback
     * This is the key optimization - only reverse the loop section, not the entire track
     * @param {string} trackId - The track to extract from
     * @param {number} startTime - Loop start time in seconds
     * @param {number} endTime - Loop end time in seconds
     * @returns {AudioBuffer|null} Reversed loop buffer
     */
    createLoopBuffer(trackId, startTime, endTime) {
        const bufferData = this.buffers.get(trackId);
        if (!bufferData) {
            console.error(`No buffer found for track ${trackId}`);
            return null;
        }
        
        // Check cache first
        const loopKey = `${startTime.toFixed(3)}-${endTime.toFixed(3)}`;
        if (bufferData.loopBuffers.has(loopKey)) {
            console.log(`♻️ Using cached loop buffer for ${trackId}: ${loopKey}`);
            return bufferData.loopBuffers.get(loopKey);
        }
        
        const originalBuffer = bufferData.original;
        const sampleRate = originalBuffer.sampleRate;
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        const loopLength = endSample - startSample;
        
        if (loopLength <= 0) {
            console.error(`Invalid loop range: ${startTime} - ${endTime}`);
            return null;
        }
        
        console.log(`Creating reversed loop buffer for ${trackId}: ${startTime.toFixed(2)}s - ${endTime.toFixed(2)}s (${loopLength} samples)`);
        
        // Create loop buffer (forward)
        const loopBuffer = this.audioContext.createBuffer(
            originalBuffer.numberOfChannels,
            loopLength,
            sampleRate
        );
        
        // Copy loop section
        for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
            const originalData = originalBuffer.getChannelData(channel);
            const loopData = loopBuffer.getChannelData(channel);
            
            for (let i = 0; i < loopLength; i++) {
                loopData[i] = originalData[startSample + i];
            }
        }
        
        // Reverse the loop buffer
        const reversedLoopBuffer = this.reverseAudioBuffer(loopBuffer);
        
        // Cache it for future use
        bufferData.loopBuffers.set(loopKey, reversedLoopBuffer);
        
        const memoryMB = (loopLength * originalBuffer.numberOfChannels * 4 / (1024 * 1024)).toFixed(2);
        console.log(`✅ Reversed loop buffer created and cached: ${memoryMB} MB`);
        
        return reversedLoopBuffer;
    }

    /**
     * Clear cached loop buffers for a track
     * @param {string} trackId - Track to clear cache for
     */
    clearLoopCache(trackId) {
        const bufferData = this.buffers.get(trackId);
        if (bufferData) {
            bufferData.loopBuffers.clear();
            console.log(`🗑️ Cleared loop cache for track ${trackId}`);
        }
    }

    /**
     * Clear all buffers to free memory
     * @param {string} [trackId] - Optional specific track to clear, or clear all if not provided
     */
    clearBuffers(trackId) {
        if (trackId) {
            this.buffers.delete(trackId);
            console.log(`🗑️ Cleared buffers for track ${trackId}`);
        } else {
            this.buffers.clear();
            console.log(`🗑️ Cleared all buffers`);
        }
    }

    /**
     * Get memory usage statistics
     * @returns {Object} Memory usage information
     */
    getMemoryStats() {
        let totalSamples = 0;
        let totalLoopSamples = 0;
        let trackCount = 0;
        
        this.buffers.forEach((bufferData, trackId) => {
            trackCount++;
            if (bufferData.original) {
                totalSamples += bufferData.original.length * bufferData.original.numberOfChannels;
            }
            bufferData.loopBuffers.forEach((loopBuffer) => {
                totalLoopSamples += loopBuffer.length * loopBuffer.numberOfChannels;
            });
        });
        
        // Float32 = 4 bytes per sample
        const originalMB = (totalSamples * 4 / (1024 * 1024)).toFixed(2);
        const loopMB = (totalLoopSamples * 4 / (1024 * 1024)).toFixed(2);
        const totalMB = ((totalSamples + totalLoopSamples) * 4 / (1024 * 1024)).toFixed(2);
        
        return {
            trackCount,
            originalBuffersMB: originalMB,
            loopBuffersMB: loopMB,
            totalMB
        };
    }
}
