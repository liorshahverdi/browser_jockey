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
        this.currentPlaybackRate = 1.0; // Store current tempo for reverse mode
        
        // References (set externally)
        this.bufferManager = null;
        this.timestretchedBuffer = null; // Store pre-rendered timestretched buffer (forward)
        this.timestretchedBufferReversed = null; // Store pre-rendered timestretched buffer (reversed)
        
        // For tracking playback position in reverse mode
        this.reverseStartTime = null;
        this.reverseStartOffset = 0;
        
        console.log(`✅ PlaybackController initialized for ${trackId}`);
    }

    /**
     * Switch to normal playback mode (MediaElementSourceNode or BufferSourceNode if timestretched)
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
            
            // Account for playback rate in position calculation
            const effectiveElapsed = elapsedTime * (this.playbackRate || 1.0);
            
            // As time elapsed, we moved forward through the reversed buffer
            // So reversePosition increases from reverseStartOffset
            const reversePosition = (this.reverseStartOffset + effectiveElapsed) % loopDuration;
            // Convert to actual track time (decreasing as we go backwards)
            currentPosition = this.loopEnd - reversePosition;
            
            console.log(`📍 Calculated position: reversePos=${reversePosition.toFixed(2)}s, actualTime=${currentPosition.toFixed(2)}s`);
        }
        
        // Stop buffer source if playing
        if (this.bufferSource) {
            try {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
                console.log('⏹️ Buffer source stopped and disconnected');
            } catch (e) {
                console.warn('Error stopping buffer source:', e);
            }
            this.bufferSource = null;
        }
        
        // Clear reverse state
        this.reverseStartTime = null;
        this.reverseStartOffset = null;
        
        // If timestretched buffer exists, use forward buffer source mode
        // Otherwise use media element
        if (this.timestretchedBuffer && this.isPlaying) {
            console.log('🎵 Using timestretched buffer for forward playback');
            this.startForwardBufferPlayback(currentPosition);
        } else {
            // Resume media element at the calculated position
            if (this.audioElement) {
                this.audioElement.currentTime = currentPosition;
                // Restore volume
                this.audioElement.volume = 1;
                console.log('🔊 Audio element volume restored');
                if (this.isPlaying) {
                    this.audioElement.play().catch(e => {
                        console.error('Error resuming audio element:', e);
                    });
                }
            }
        }
        
        this.mode = 'normal';
        console.log(`✅ Switched to normal mode at position ${currentPosition.toFixed(2)}s, isPlaying=${this.isPlaying}`);
    }

    /**
     * Switch to reverse playback mode (AudioBufferSourceNode)
     * @param {boolean} wasPlaying - Optional override for playing state (useful when switching from buffer playback)
     */
    switchToReverseMode(wasPlaying = null) {
        console.log(`🔄 switchToReverseMode called for ${this.trackId}, current mode: ${this.mode}`);
        
        if (this.mode === 'reverse') {
            console.log(`Already in reverse mode for ${this.trackId}`);
            return;
        }
        
        console.log(`Switching to reverse playback mode for ${this.trackId}`);
        
        // Validate loop points
        if (this.loopStart === null || this.loopEnd === null) {
            console.error('❌ Cannot switch to reverse mode: no loop points set');
            console.error(`   loopStart: ${this.loopStart}, loopEnd: ${this.loopEnd}`);
            return;
        }
        
        console.log(`✅ Loop points validated: start=${this.loopStart.toFixed(2)}s, end=${this.loopEnd.toFixed(2)}s`);
        
        // Store current playback state (use override if provided, otherwise detect from audio element)
        this.isPlaying = wasPlaying !== null ? wasPlaying : !this.audioElement.paused;
        const currentTime = this.audioElement.currentTime;
        
        console.log(`📊 Audio element state: paused=${this.audioElement.paused}, currentTime=${currentTime.toFixed(2)}s`);
        console.log(`📊 Will play in reverse: ${this.isPlaying}`);
        
        // Pause media element (we'll use buffer source instead)
        if (this.audioElement) {
            this.audioElement.pause();
            console.log('⏸️ Audio element paused for reverse playback');
        }
        
        // Mute the audio element's volume to ensure no forward audio plays
        // (MediaElementSource may still output even when paused)
        if (this.audioElement) {
            this.audioElement.volume = 0;
            console.log('🔇 Audio element volume muted');
        }
        
        // Calculate position within loop
        let positionInLoop = currentTime - this.loopStart;
        const loopDuration = this.loopEnd - this.loopStart;
        
        console.log(`📊 Position calculation: currentTime=${currentTime.toFixed(2)}s, loopStart=${this.loopStart.toFixed(2)}s`);
        console.log(`📊 Position in loop (before bounds check): ${positionInLoop.toFixed(2)}s`);
        
        // Ensure position is within loop bounds
        if (positionInLoop < 0) {
            positionInLoop = 0;
        } else if (positionInLoop > loopDuration) {
            positionInLoop = positionInLoop % loopDuration;
        }
        
        console.log(`📊 Final position in loop: ${positionInLoop.toFixed(2)}s (loop duration: ${loopDuration.toFixed(2)}s)`);
        
        // Start buffer source with reversed audio
        // Use reversed timestretched buffer if available, otherwise generate standard reversed buffer
        const bufferToUse = this.timestretchedBufferReversed || null;
        this.startReversePlayback(positionInLoop, bufferToUse);
        
        this.mode = 'reverse';
        console.log(`✅ Mode set to 'reverse' for ${this.trackId}`);
    }

    /**
     * Start reverse playback using AudioBufferSourceNode
     * @param {number} positionInLoop - Current position within the loop (0 = loop start)
     * @param {AudioBuffer} preRenderedBuffer - Optional pre-rendered buffer (e.g. timestretched)
     */
    startReversePlayback(positionInLoop = 0, preRenderedBuffer = null) {
        console.log(`🔧 startReversePlayback called for ${this.trackId}, positionInLoop: ${positionInLoop.toFixed(2)}s`);
        
        let reversedBuffer;
        
        if (preRenderedBuffer) {
            // Use pre-rendered buffer (e.g. timestretched)
            console.log(`🎵 Using pre-rendered buffer (timestretched)`);
            reversedBuffer = preRenderedBuffer;
        } else {
            if (!this.bufferManager) {
                console.error('❌ BufferManager not set and no pre-rendered buffer provided');
                return;
            }
            
            // Get reversed loop buffer
            console.log(`🔧 Creating loop buffer: start=${this.loopStart}, end=${this.loopEnd}`);
            reversedBuffer = this.bufferManager.createLoopBuffer(
                this.trackId,
                this.loopStart,
                this.loopEnd
            );
        }
        
        if (!reversedBuffer) {
            console.error('❌ Failed to create reversed buffer');
            return;
        }
        
        console.log(`✅ Got reversed buffer: duration=${reversedBuffer.duration.toFixed(2)}s, channels=${reversedBuffer.numberOfChannels}`);
        
        // Stop any existing buffer source
        if (this.bufferSource) {
            try {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
                console.log('🛑 Stopped previous buffer source');
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
        this.bufferSource.playbackRate.value = this.currentPlaybackRate; // Apply current tempo
        
        console.log(`🔧 Buffer source created with loop: ${this.bufferSource.loop}, loopEnd: ${this.bufferSource.loopEnd.toFixed(2)}s, playbackRate: ${this.currentPlaybackRate.toFixed(2)}x`);
        
        // Connect to gain node, which connects to effects chain
        this.bufferSource.connect(this.gainNode);
        console.log(`🔌 Buffer source connected to gainNode`);
        console.log(`🔌 GainNode connected to effects chain: ${this.effectChainInput ? 'YES' : 'NO'}`);
        
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
            console.log(`🎵 Reverse playback STARTED at offset ${reverseOffset.toFixed(2)}s with seamless looping`);
        } else {
            console.log(`⏸️ Reverse playback created but NOT started (isPlaying=false)`);
        }
    }

    /**
     * Start forward playback using AudioBufferSourceNode (for timestretched audio)
     * @param {number} positionInLoop - Current position within the loop (0 = loop start)
     */
    startForwardBufferPlayback(positionInLoop = 0) {
        console.log(`🔧 startForwardBufferPlayback called for ${this.trackId}, positionInLoop: ${positionInLoop.toFixed(2)}s`);
        
        if (!this.timestretchedBuffer) {
            console.error('❌ No timestretched buffer available for forward playback');
            return;
        }
        
        // Validate it's actually an AudioBuffer
        if (!(this.timestretchedBuffer instanceof AudioBuffer)) {
            console.error('❌ timestretchedBuffer is not an AudioBuffer:', this.timestretchedBuffer);
            console.error('Type:', typeof this.timestretchedBuffer);
            console.error('Constructor:', this.timestretchedBuffer?.constructor?.name);
            return;
        }
        
        console.log(`✅ Using timestretched forward buffer: duration=${this.timestretchedBuffer.duration.toFixed(2)}s`);
        
        // Stop any existing buffer source
        if (this.bufferSource) {
            try {
                this.bufferSource.stop();
                this.bufferSource.disconnect();
                console.log('🛑 Stopped previous buffer source');
            } catch (e) {
                // Ignore errors from already-stopped sources
            }
        }
        
        // Mute media element since we're using buffer source
        if (this.audioElement) {
            this.audioElement.volume = 0;
        }
        
        // Create new buffer source for forward playback
        this.bufferSource = this.audioContext.createBufferSource();
        this.bufferSource.buffer = this.timestretchedBuffer;
        this.bufferSource.loop = true; // Enable seamless looping
        this.bufferSource.loopStart = 0;
        this.bufferSource.loopEnd = this.timestretchedBuffer.duration;
        this.bufferSource.playbackRate.value = this.currentPlaybackRate; // Apply current tempo
        
        console.log(`🔧 Forward buffer source created with loop, duration: ${this.bufferSource.loopEnd.toFixed(2)}s, playbackRate: ${this.currentPlaybackRate.toFixed(2)}x`);
        
        // Connect to gain node, which connects to effects chain
        this.bufferSource.connect(this.gainNode);
        console.log(`🔌 Buffer source connected to gainNode`);
        
        // Store timing info for position tracking
        this.reverseStartTime = this.audioContext.currentTime;
        this.reverseStartOffset = positionInLoop;
        
        // Start playback at the calculated offset
        if (this.isPlaying) {
            this.bufferSource.start(0, positionInLoop);
            console.log(`🎵 Forward buffer playback STARTED at offset ${positionInLoop.toFixed(2)}s with seamless looping`);
        } else {
            console.log(`⏸️ Forward buffer playback created but NOT started (isPlaying=false)`);
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
            console.log(`⏸️ Normal playback paused for ${this.trackId}`);
        } else {
            // For buffer source, we need to stop and remember position
            if (this.bufferSource) {
                try {
                    // Calculate current position before stopping
                    let currentPosition = this.loopStart;
                    if (this.reverseStartTime) {
                        const elapsedTime = this.audioContext.currentTime - this.reverseStartTime;
                        const loopDuration = this.loopEnd - this.loopStart;
                        // Account for playback rate when calculating position
                        const reversePosition = (this.reverseStartOffset - (elapsedTime * this.currentPlaybackRate)) % loopDuration;
                        this.currentPositionInLoop = reversePosition < 0 ? loopDuration + reversePosition : reversePosition;
                        currentPosition = this.loopEnd - this.currentPositionInLoop;
                    }
                    
                    console.log(`⏸️ Stopping reverse playback for ${this.trackId} at position ${currentPosition.toFixed(2)}s`);
                    
                    this.bufferSource.stop();
                    this.bufferSource.disconnect();
                    this.bufferSource = null;
                    
                    // Update audio element to match current position
                    this.audioElement.currentTime = currentPosition;
                    
                    // Restore volume
                    this.audioElement.volume = 1;
                    
                    // Switch back to normal mode
                    this.mode = 'normal';
                    this.reverseStartTime = null;
                    this.reverseStartOffset = null;
                    
                    console.log(`✅ Switched back to normal mode at ${currentPosition.toFixed(2)}s`);
                } catch (e) {
                    console.error(`❌ Error stopping buffer source for ${this.trackId}:`, e);
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
        
        // Clear timestretched buffers when loop points change
        // They'll need to be regenerated for the new loop range
        this.timestretchedBuffer = null;
        this.timestretchedBufferReversed = null;
        
        console.log(`Loop points set for ${this.trackId}: ${start.toFixed(2)}s - ${end.toFixed(2)}s`);
        
        // If in reverse mode and playing, recreate the loop buffer with new points
        if (this.mode === 'reverse' && this.isPlaying) {
            console.log('Recreating reverse buffer with new loop points...');
            const wasPlaying = this.isPlaying;
            
            // Stop the current buffer source without switching mode
            if (this.bufferSource) {
                try {
                    this.bufferSource.stop();
                    this.bufferSource.disconnect();
                    this.bufferSource = null;
                } catch (e) {
                    console.warn('Error stopping buffer source:', e);
                }
            }
            
            // Clear cached buffers so they get regenerated with new loop points
            this.timestretchedBuffer = null;
            this.timestretchedBufferReversed = null;
            
            // Recreate and start the reverse playback with new loop points
            // startReversePlayback will check isPlaying and start the buffer if needed
            this.startReversePlayback(0);
            
            console.log('✅ Reverse playback recreated with new loop boundaries');
        }
    }

    /**
     * Set playback rate (tempo) for both normal and reverse modes
     * @param {number} rate - Playback rate (1.0 = normal speed)
     */
    setPlaybackRate(rate) {
        this.currentPlaybackRate = rate;
        
        // Apply to buffer source if it exists (both forward and reverse modes)
        if (this.bufferSource) {
            this.bufferSource.playbackRate.value = rate;
            console.log(`🎵 ${this.trackId} buffer playback rate set to ${rate.toFixed(2)}x`);
        }
        // Note: MediaElement tempo is handled via audioElement.playbackRate in app.js
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
        // If using buffer source (timestretched or reverse)
        if (this.bufferSource && this.reverseStartTime && this.loopStart !== null && this.loopEnd !== null) {
            const currentTime = this.audioContext.currentTime;
            const elapsedTime = currentTime - this.reverseStartTime;
            const loopDuration = this.loopEnd - this.loopStart;
            
            if (this.mode === 'reverse') {
                // Reverse mode: buffer plays forward but time moves backward
                let reversePosition = (this.reverseStartOffset + (elapsedTime * this.currentPlaybackRate)) % loopDuration;
                const actualTime = this.loopEnd - reversePosition;
                
                // Debug logging every 0.5 seconds
                if (!this._lastLogTime || (currentTime - this._lastLogTime) > 0.5) {
                    console.log(`⏱️ ${this.trackId} Reverse Position: elapsed=${elapsedTime.toFixed(2)}s, rate=${this.currentPlaybackRate.toFixed(2)}x, reversePos=${reversePosition.toFixed(2)}s, actualTime=${actualTime.toFixed(2)}s`);
                    this._lastLogTime = currentTime;
                }
                
                return actualTime;
            } else {
                // Forward buffer mode (timestretched): buffer plays forward, time moves forward
                let positionInLoop = (this.reverseStartOffset + (elapsedTime * this.currentPlaybackRate)) % loopDuration;
                const actualTime = this.loopStart + positionInLoop;
                
                return actualTime;
            }
        }
        
        // Normal mode: use MediaElement time
        if (this.mode === 'normal' && this.audioElement) {
            return this.audioElement.currentTime;
        }
        
        return this.loopStart || 0;
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
