// Loop control utilities

// Format time in M:SS format
export function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update progress display for reverse playback using buffer-based controller
 * This provides smooth visual feedback without manual currentTime manipulation
 * @param {PlaybackController} playbackController - The playback controller instance
 * @param {Function} updateProgressCallback - Callback to update the UI progress
 */
export function updateReverseProgress(playbackController, updateProgressCallback) {
    if (!playbackController || playbackController.mode !== 'reverse') {
        return;
    }
    
    // Get current time from playback controller (it calculates based on buffer position)
    const currentTime = playbackController.getCurrentTime();
    
    // Update UI
    if (updateProgressCallback) {
        updateProgressCallback(currentTime);
    }
    
    // Continue updating
    requestAnimationFrame(() => updateReverseProgress(playbackController, updateProgressCallback));
}

// Update loop region display
export function updateLoopRegion(loopState, loopRegion, loopMarkerStart, loopMarkerEnd, duration, zoomState) {
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
export function clearLoopPoints(loopState, loopRegion, loopMarkerStart, loopMarkerEnd) {
    loopState.start = null;
    loopState.end = null;
    loopState.settingPoint = 'start';
    loopRegion.style.display = 'none';
    loopMarkerStart.style.display = 'none';
    loopMarkerEnd.style.display = 'none';
}

// Reverse playback animation function with maximum smoothness
export function animateReversePlayback(audioElement, loopState, updateProgressCallback = null) {
    if (!loopState.reverse || !loopState.enabled || audioElement.paused) {
        return;
    }
    
    const now = performance.now();
    
    // Initialize timing on first run
    if (!loopState.lastReverseTime) {
        loopState.lastReverseTime = now;
        loopState.reverseAccumulator = 0;
    }
    
    const deltaTime = (now - loopState.lastReverseTime) / 1000; // Convert to seconds
    loopState.lastReverseTime = now;
    
    // Use accumulator to handle fractional time updates for smoothness
    const playbackRate = Math.abs(audioElement.playbackRate || 1.0);
    loopState.reverseAccumulator = (loopState.reverseAccumulator || 0) + (deltaTime * playbackRate);
    
    // Adaptive update frequency: faster playback = more frequent updates
    // This balances smoothness with performance
    const MIN_TIME_STEP = Math.max(0.005, 0.015 / playbackRate); // 5-15ms range based on speed
    
    if (loopState.reverseAccumulator >= MIN_TIME_STEP) {
        const currentTime = audioElement.currentTime;
        const timeStep = loopState.reverseAccumulator;
        loopState.reverseAccumulator = 0;
        
        // Calculate new position
        let newTime = currentTime - timeStep;
        
        // Check if we've reached or passed the start of the loop
        if (newTime <= loopState.start) {
            // Calculate overshoot to maintain perfect timing and avoid gaps
            const overshoot = loopState.start - newTime;
            const loopDuration = loopState.end - loopState.start;
            
            // Wrap to end, accounting for overshoot for seamless looping
            newTime = loopState.end - (overshoot % loopDuration);
            
            // Ensure we stay within bounds
            if (newTime > loopState.end || newTime < loopState.start) {
                newTime = loopState.end - 0.001; // Small offset to prevent immediate re-trigger
            }
            
            // Only seek if the media is ready to prevent buffer issues
            if (audioElement.readyState >= audioElement.HAVE_CURRENT_DATA) {
                try {
                    audioElement.currentTime = newTime;
                    // Update progress bar immediately after seeking
                    if (updateProgressCallback) {
                        updateProgressCallback();
                    }
                } catch (e) {
                    console.warn('Reverse loop seek failed:', e);
                }
            }
        } else if (newTime > loopState.end) {
            // If we're somehow past the end, clamp to end (handles edge case)
            if (audioElement.readyState >= audioElement.HAVE_CURRENT_DATA) {
                try {
                    audioElement.currentTime = loopState.end - 0.001;
                    // Update progress bar
                    if (updateProgressCallback) {
                        updateProgressCallback();
                    }
                } catch (e) {
                    console.warn('Reverse loop clamp failed:', e);
                }
            }
        } else {
            // Normal reverse playback - only update if media is ready
            if (audioElement.readyState >= audioElement.HAVE_CURRENT_DATA) {
                try {
                    audioElement.currentTime = newTime;
                    // Update progress bar for smooth visual feedback
                    if (updateProgressCallback) {
                        updateProgressCallback();
                    }
                } catch (e) {
                    console.warn('Reverse playback update failed:', e);
                }
            }
        }
    }
    
    // Continue animation
    loopState.reverseAnimationId = requestAnimationFrame(() => animateReversePlayback(audioElement, loopState, updateProgressCallback));
}

// Stop reverse playback animation
export function stopReversePlayback(loopState) {
    if (loopState.reverseAnimationId) {
        cancelAnimationFrame(loopState.reverseAnimationId);
        loopState.reverseAnimationId = null;
    }
    loopState.lastReverseTime = 0;
    loopState.reverseAccumulator = 0; // Clear accumulator
}

// Check and handle loop playback
export function handleLoopPlayback(audioElement, loopState, isDraggingMarker) {
    if (loopState.enabled && loopState.start !== null && loopState.end !== null) {
        // Don't enforce loop boundaries while dragging markers
        if (isDraggingMarker) {
            return;
        }
        
        // Reverse mode is handled by animateReversePlayback() - skip enforcement here
        if (loopState.reverse) {
            return;
        }
        
        // Adjust tolerance based on playback rate
        const tolerance = 0.1 * Math.abs(audioElement.playbackRate);
        
        // Debounce seeking to prevent rapid seeks
        const now = Date.now();
        const minSeekInterval = 50; // Minimum 50ms between seeks
        
        // Normal forward loop
        if (audioElement.currentTime >= loopState.end - tolerance) {
            console.log(`🔁 Loop end reached! currentTime=${audioElement.currentTime.toFixed(3)}s, loopEnd=${loopState.end.toFixed(3)}s`);
            if (now - loopState.lastSeekTime >= minSeekInterval) {
                console.log(`✅ Debounce OK, seeking back to loopStart=${loopState.start.toFixed(3)}s`);
                if (audioElement.readyState >= 2) {
                    const wasPlaying = !audioElement.paused;
                    
                    try {
                        audioElement.currentTime = loopState.start;
                        loopState.lastSeekTime = now;
                        console.log(`🔄 Looped back to ${loopState.start.toFixed(3)}s, wasPlaying=${wasPlaying}`);
                        
                        if (wasPlaying && audioElement.paused) {
                            audioElement.play().catch(e => console.error('Error resuming playback:', e));
                        }
                    } catch (e) {
                        console.error('Error seeking during loop:', e);
                    }
                } else {
                    console.warn(`⚠️ Cannot loop: readyState=${audioElement.readyState} (need >= 2)`);
                }
            } else {
                console.log(`⏭️ Skipping loop seek (debounce): ${now - loopState.lastSeekTime}ms since last seek`);
            }
        }
        // Enforce start boundary
        else if (audioElement.currentTime < loopState.start) {
            if (now - loopState.lastSeekTime >= minSeekInterval) {
                if (audioElement.readyState >= 2) {
                    try {
                        audioElement.currentTime = loopState.start;
                        loopState.lastSeekTime = now;
                        console.log(`⏩ Before loop start, jumped to ${loopState.start.toFixed(3)}s`);
                    } catch (e) {
                        console.error('Error seeking to loop start:', e);
                    }
                }
            }
        }
    }
}
