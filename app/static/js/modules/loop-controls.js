// Loop control utilities

// Format time in M:SS format
export function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

// Reverse playback animation function
export function animateReversePlayback(audioElement, loopState) {
    if (!loopState.reverse || !loopState.enabled || audioElement.paused) {
        return;
    }
    
    const now = performance.now();
    const deltaTime = (now - (loopState.lastReverseTime || now)) / 1000; // Convert to seconds
    loopState.lastReverseTime = now;
    
    // Decrease currentTime based on playback rate
    const playbackRate = Math.abs(audioElement.playbackRate || 1.0);
    const newTime = audioElement.currentTime - (deltaTime * playbackRate);
    
    // Check if we've reached the start of the loop
    if (newTime <= loopState.start) {
        audioElement.currentTime = loopState.end;
        loopState.lastReverseTime = performance.now(); // Reset timing after loop
    } else if (newTime > loopState.end) {
        // If we're somehow past the end, wrap to end (handles edge case)
        audioElement.currentTime = loopState.end;
        loopState.lastReverseTime = performance.now();
    } else {
        audioElement.currentTime = newTime;
    }
    
    // Continue animation
    loopState.reverseAnimationId = requestAnimationFrame(() => animateReversePlayback(audioElement, loopState));
}

// Stop reverse playback animation
export function stopReversePlayback(loopState) {
    if (loopState.reverseAnimationId) {
        cancelAnimationFrame(loopState.reverseAnimationId);
        loopState.reverseAnimationId = null;
    }
    loopState.lastReverseTime = 0;
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
            if (now - loopState.lastSeekTime >= minSeekInterval) {
                if (audioElement.readyState >= 2) {
                    const wasPlaying = !audioElement.paused;
                    
                    try {
                        audioElement.currentTime = loopState.start;
                        loopState.lastSeekTime = now;
                        
                        if (wasPlaying && audioElement.paused) {
                            audioElement.play().catch(e => console.error('Error resuming playback:', e));
                        }
                    } catch (e) {
                        console.error('Error seeking during loop:', e);
                    }
                }
            }
        }
        // Enforce start boundary
        else if (audioElement.currentTime < loopState.start) {
            if (now - loopState.lastSeekTime >= minSeekInterval) {
                if (audioElement.readyState >= 2) {
                    try {
                        audioElement.currentTime = loopState.start;
                        loopState.lastSeekTime = now;
                    } catch (e) {
                        console.error('Error seeking to loop start:', e);
                    }
                }
            }
        }
    }
}
