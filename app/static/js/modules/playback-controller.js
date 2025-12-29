/**
 * Playback Controller
 * 
 * Manages switching between normal playback (MediaElementSourceNode) 
 * and reverse playback (AudioBufferSourceNode) to eliminate aliasing.
 */

export class PlaybackController {
    constructor(audioContext, audioElement, effectChainInput, trackId) {
        this.audioContext = audioContext;
        this.audioElement = audioElement;
        this.effectChainInput = effectChainInput; // The first node in the effects chain to connect to
        this.trackId = trackId;
        
        // Audio nodes
        this.bufferSource = null; // For reverse playback
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = 1.0;
        
        // State
        this.mode = 'normal'; // 'normal' or 'reverse'
        this.isPlaying = false;
        this.loopStart = null;
        this.loopEnd = null;
        this.currentPositionInLoop = 0; // Track position within loop for seamless switching
        
        // References (set externally)
        this.bufferManager = null;
        
        // For tracking playback position in reverse mode
        this.reverseStartTime = null;
        this.reverseStartOffset = 0;
        
        console.log(`✅ PlaybackController initialized for ${trackId}`);
    }

    /**
     * Switch to normal playback mode (MediaElementSourceNode)
     */
    switchToNormalMode() {
        if (this.mode === 'normal') {
            console.log(`Already in normal mode for ${this.trackId}`);
            return;
        }
        
        console.log(`Switching to normal playback mode for ${this.trackId}`);
        
        // Calculate current position before stopping buffer source
        let currentPosition = this.loopStart;
        if (this.reverseStartTime && this.bufferSource && this.bufferSource.buffer) {
            // Calculate how much time has elapsed since we started reverse playback
            const elapsedTime = this.audioContext.currentTime - this.reverseStartTime;
            const loopDuration = this.loopEnd - this.loopStart;
            
            // In reverse mode, we're moving backwards from our start offset
            // Wrap around if we've looped
            const reversePosition = (this.reverseStartOffset - elapsedTime) % loopDuration;
            currentPosition = this.loopStart + (reversePosition < 0 ? loopDuration + reversePosition : reversePosition);
        }
        
        // Stop buffer source if playing
        if (this.bufferSource) {
            try {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
            } catch (e) {
                console.warn('Error stopping buffer source:', e);
            }
            this.bufferSource = null;
        }
        
        // Resume media element at the calculated position
        if (this.audioElement) {
            this.audioElement.currentTime = currentPosition;
            if (this.isPlaying) {
                this.audioElement.play().catch(e => {
                    console.error('Error resuming audio element:', e);
                });
            }
        }
        
        this.mode = 'normal';
        console.log(`✅ Switched to normal mode at position ${currentPosition.toFixed(2)}s`);
    }

    /**
     * Switch to reverse playback mode (AudioBufferSourceNode)
     */
    switchToReverseMode() {
        if (this.mode === 'reverse') {
            console.log(`Already in reverse mode for ${this.trackId}`);
            return;
        }
        
        console.log(`Switching to reverse playback mode for ${this.trackId}`);
        
        // Validate loop points
        if (this.loopStart === null || this.loopEnd === null) {
            console.error('Cannot switch to reverse mode: no loop points set');
            return;
        }
        
        // Store current playback state
        this.isPlaying = !this.audioElement.paused;
        const currentTime = this.audioElement.currentTime;
        
        // Pause media element (we'll use buffer source instead)
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        // Calculate position within loop
        let positionInLoop = currentTime - this.loopStart;
        const loopDuration = this.loopEnd - this.loopStart;
        
        // Ensure position is within loop bounds
        if (positionInLoop < 0) {
            positionInLoop = 0;
        } else if (positionInLoop > loopDuration) {
            positionInLoop = positionInLoop % loopDuration;
        }
        
        // Start buffer source with reversed audio
        this.startReversePlayback(positionInLoop);
        
        this.mode = 'reverse';
        console.log(`✅ Switched to reverse mode at loop position ${positionInLoop.toFixed(2)}s`);
    }

    /**
     * Start reverse playback using AudioBufferSourceNode
     * @param {number} positionInLoop - Current position within the loop (0 = loop start)
     */
    startReversePlayback(positionInLoop = 0) {
        if (!this.bufferManager) {
            console.error('BufferManager not set');
            return;
        }
        
        // Get reversed loop buffer
        const reversedBuffer = this.bufferManager.createLoopBuffer(
            this.trackId,
            this.loopStart,
            this.loopEnd
        );
        
        if (!reversedBuffer) {
            console.error('Failed to create reversed buffer');
            return;
        }
        
        // Stop any existing buffer source
        if (this.bufferSource) {
            try {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
            } catch (e) {
                // Ignore errors from already-stopped sources
            }
        }
        
        // Create new buffer source
        this.bufferSource = this.audioContext.createBufferSource();
        this.bufferSource.buffer = reversedBuffer;
        this.bufferSource.loop = true; // Enable seamless looping!
        this.bufferSource.loopStart = 0;
        this.bufferSource.loopEnd = reversedBuffer.duration;
        
        // Connect to gain node, which connects to effects chain
        this.bufferSource.connect(this.gainNode);
        
        // The reversed buffer plays from end to start
        // If we're at position 2s in a 10s loop, in the reversed buffer
        // we want to start at (10 - 2) = 8s
        const loopDuration = this.loopEnd - this.loopStart;
        const reverseOffset = loopDuration - positionInLoop;
        
        // Store timing info for position tracking
        this.reverseStartTime = this.audioContext.currentTime;
        this.reverseStartOffset = reverseOffset;
        
        // Start playback at the calculated offset
        // The buffer will loop seamlessly thanks to buffer.loop = true
        if (this.isPlaying) {
            this.bufferSource.start(0, reverseOffset);
            console.log(`🎵 Reverse playback started at offset ${reverseOffset.toFixed(2)}s with seamless looping`);
        }
    }

    /**
     * Play (or resume) current mode
     */
    play() {
        this.isPlaying = true;
        
        if (this.mode === 'normal') {
            this.audioElement.play().catch(e => {
                console.error('Error playing audio element:', e);
            });
        } else {
            // In reverse mode, we need to start a new buffer source if not already playing
            if (!this.bufferSource || !this.bufferSource.buffer) {
                const loopDuration = this.loopEnd - this.loopStart;
                this.startReversePlayback(loopDuration * 0.5); // Start from middle if no current position
            } else {
                // Already have a source, just ensure it's started
                try {
                    this.bufferSource.start(0, this.reverseStartOffset);
                } catch (e) {
                    // If already started, create a new one
                    this.startReversePlayback(this.currentPositionInLoop);
                }
            }
        }
    }

    /**
     * Pause current mode
     */
    pause() {
        this.isPlaying = false;
        
        if (this.mode === 'normal') {
            this.audioElement.pause();
        } else {
            // For buffer source, we need to stop and remember position
            if (this.bufferSource) {
                try {
                    // Calculate current position before stopping
                    if (this.reverseStartTime) {
                        const elapsedTime = this.audioContext.currentTime - this.reverseStartTime;
                        const loopDuration = this.loopEnd - this.loopStart;
                        const reversePosition = (this.reverseStartOffset - elapsedTime) % loopDuration;
                        this.currentPositionInLoop = reversePosition < 0 ? loopDuration + reversePosition : reversePosition;
                    }
                    
                    this.bufferSource.stop();
                    this.bufferSource.disconnect();
                    this.bufferSource = null;
                } catch (e) {
                    console.warn('Error stopping buffer source:', e);
                }
            }
        }
    }

    /**
     * Stop all playback
     */
    stop() {
        this.pause();
        
        if (this.mode === 'normal') {
            this.audioElement.currentTime = this.loopStart || 0;
        } else {
            this.currentPositionInLoop = 0;
        }
    }

    /**
     * Set loop points
     * @param {number} start - Loop start time in seconds
     * @param {number} end - Loop end time in seconds
     */
    setLoopPoints(start, end) {
        this.loopStart = start;
        this.loopEnd = end;
        
        console.log(`Loop points set for ${this.trackId}: ${start.toFixed(2)}s - ${end.toFixed(2)}s`);
        
        // If in reverse mode and playing, recreate the loop buffer with new points
        if (this.mode === 'reverse' && this.isPlaying) {
            console.log('Recreating reverse buffer with new loop points...');
            const wasPlaying = this.isPlaying;
            this.pause();
            if (wasPlaying) {
                this.startReversePlayback(0); // Restart from beginning of new loop
                this.isPlaying = true;
            }
        }
    }

    /**
     * Connect the gain node to the effects chain
     * This should be called after initialization to set up the audio routing
     * @param {AudioNode} destination - The first node in the effects chain
     */
    connectToEffectsChain(destination) {
        this.gainNode.connect(destination);
        console.log(`✅ PlaybackController for ${this.trackId} connected to effects chain`);
    }

    /**
     * Get current playback position (works in both modes)
     * @returns {number} Current position in seconds
     */
    getCurrentTime() {
        if (this.mode === 'normal') {
            return this.audioElement.currentTime;
        } else {
            // Calculate position in reverse mode
            if (this.reverseStartTime && this.bufferSource) {
                const elapsedTime = this.audioContext.currentTime - this.reverseStartTime;
                const loopDuration = this.loopEnd - this.loopStart;
                const reversePosition = (this.reverseStartOffset - elapsedTime) % loopDuration;
                const positionInLoop = reversePosition < 0 ? loopDuration + reversePosition : reversePosition;
                return this.loopStart + (loopDuration - positionInLoop);
            }
            return this.loopStart;
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.bufferSource) {
            try {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
            } catch (e) {
                // Ignore
            }
            this.bufferSource = null;
        }
        
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        
        console.log(`🗑️ PlaybackController for ${this.trackId} destroyed`);
    }
}
