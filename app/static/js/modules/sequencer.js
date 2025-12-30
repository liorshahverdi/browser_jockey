/**
 * Sequencer Module
 * Provides drag-and-drop sequencer functionality for arranging audio clips
 */

import { detectBPM } from './audio-utils.js';
import { IndexedDBManager } from './indexeddb-manager.js';

export class Sequencer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.clips = new Map(); // Available clips from loaded tracks
        this.sequencerTracks = []; // Sequencer tracks with clips
        this.currentBPM = 120;
        this.numberOfBars = 8;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.playheadInterval = null;
        this.barWidth = 150; // pixels per bar (base value)
        this.baseBarWidth = 150; // Store base value for zoom calculations
        this.zoomLevel = 1.0; // Zoom multiplier (1.0 = 100%)
        
        // Panning state
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartScrollLeft = 0;
        
        // Timeline loop state
        this.loopEnabled = false;
        this.loopStartBar = 0; // 0-indexed: 0 = bar 1
        this.loopEndBar = null; // 0-indexed: 7 = bar 8 (null means loop to end)
        this.loopTimeout = null;
        
        // Playhead position when stopped (in bars)
        this.playheadPosition = 0;
        this.playheadManuallySet = false; // Track if user manually dragged playhead
        
        // Playback state for live loop updates
        this.playbackStartTime = null;
        this.playbackStartBar = 0;
        this.playbackEndBar = 0;
        
        // Effects panel state
        this.effectsPanelVisible = true; // Start visible by default
        
        // Audio routing
        this.outputGain = null;
        this.routingGain = null;
        
        // Background rendering queue
        this.renderQueue = []; // FIFO queue for clips to process
        this.isRendering = false;
        this.currentRenderingClip = null;
        this.renderedClipsCount = 0;
        this.totalClipsToRender = 0;
        
        // Auto-timestretch settings
        this.autoTimestretachEnabled = false;
        this.projectBPM = 120; // Default project tempo
        
        // IndexedDB for project persistence
        this.dbManager = new IndexedDBManager();
        this.currentProjectId = 'autosave'; // Default project
        this.dbManager.init().catch(err => console.error('Failed to initialize IndexedDB:', err));
        
        this.initializeElements();
        this.initializeAudioRouting(); // Initialize audio routing BEFORE timeline
        this.initializeEventListeners();
        this.initializeTimeline(); // Timeline creates Track 1, which needs outputGain
    }
    
    initializeAudioRouting() {
        if (!this.audioContext) return;
        
        // Disconnect old nodes if they exist
        if (this.routingGain) {
            try {
                this.routingGain.disconnect();
            } catch (e) {
                // Already disconnected
            }
        }
        if (this.outputGain) {
            try {
                this.outputGain.disconnect();
            } catch (e) {
                // Already disconnected
            }
        }
        
        // Create output gain node for sequencer
        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.value = 1.0;
        
        // Create routing gain for master output
        this.routingGain = this.audioContext.createGain();
        this.routingGain.gain.value = 1.0;
        
        // Connect output to routing
        this.outputGain.connect(this.routingGain);
        
        // Reconnect all existing tracks to the new outputGain
        this.sequencerTracks.forEach(track => {
            if (track.gainNode) {
                try {
                    track.gainNode.disconnect();
                } catch (e) {
                    // Already disconnected
                }
                // Recreate track gain node with new audio context
                const volume = track.volume || 0.8;
                track.gainNode = this.audioContext.createGain();
                track.gainNode.gain.value = volume;
                track.gainNode.connect(this.outputGain);
                console.log(`✅ Reconnected track: ${track.name} to new audio context`);
            }
        });
        
        console.log('✅ Sequencer audio routing initialized');
    }
    
    initializeElements() {
        // Sequencer controls
        this.playBtn = document.getElementById('sequencerPlayBtn');
        this.pauseBtn = document.getElementById('sequencerPauseBtn');
        this.stopBtn = document.getElementById('sequencerStopBtn');
        this.loopToggleBtn = document.getElementById('sequencerLoopToggleBtn');
        this.loopRangeControl = document.getElementById('loopRangeControl');
        this.loopStartBarInput = document.getElementById('loopStartBar');
        this.loopEndBarInput = document.getElementById('loopEndBar');
        this.addBarBtn = document.getElementById('addBarBtn');
        this.removeBarBtn = document.getElementById('removeBarBtn');
        this.bpmInput = document.getElementById('sequencerBPM');
        this.autoTimestretchBtn = document.getElementById('sequencerAutoTimestrechBtn');
        this.cacheStatus = document.getElementById('cacheStatus');
        this.cacheSize = document.getElementById('cacheSize');
        this.clearCacheBtn = document.getElementById('clearCacheBtn');
        this.saveProjectBtn = document.getElementById('saveProjectBtn');
        this.loadProjectBtn = document.getElementById('loadProjectBtn');
        this.exportProjectBtn = document.getElementById('exportProjectBtn');
        this.importProjectBtn = document.getElementById('importProjectBtn');
        this.importProjectInput = document.getElementById('importProjectInput');
        this.zoomSlider = document.getElementById('sequencerZoom');
        this.zoomValue = document.getElementById('zoomValue');
        
        // Workspace elements
        this.clipsList = document.getElementById('clipsList');
        this.timelineRuler = document.getElementById('timelineRuler');
        this.sequencerTracksContainer = document.getElementById('sequencerTracks');
        this.sequencerAudioUpload = document.getElementById('sequencerAudioUpload');
        
        // Effects panel elements
        this.effectsPanel = document.getElementById('sequencerEffectsPanel');
        this.selectedClipName = document.getElementById('selectedClipName');
        this.closeEffectsBtn = document.getElementById('closeClipEffects');
        this.deleteClipBtn = document.getElementById('deleteClipBtn');
        this.resetEffectsBtn = document.getElementById('resetClipEffects');
        
        // Recording elements
        this.recordBtn = document.getElementById('sequencerRecordBtn');
        this.stopRecordBtn = document.getElementById('stopSequencerRecordBtn');
        this.recordingSection = document.getElementById('sequencerRecordingSection');
        this.recordingTime = document.getElementById('sequencerRecordingTime');
        this.downloadBtn = document.getElementById('downloadSequencerBtn');
        this.loadToTrack1Btn = document.getElementById('loadSequencerToTrack1Btn');
        this.loadToTrack2Btn = document.getElementById('loadSequencerToTrack2Btn');
        this.exportGroup = document.getElementById('sequencerExportGroup');
        this.sequencerLoopBtn = document.getElementById('sequencerLoopBtn');
        this.sequencerClearLoopBtn = document.getElementById('sequencerClearLoopBtn');
        
        // Selected clip tracking
        this.selectedClip = null;
        this.clipEffects = new Map(); // Store effects per clip
        
        // Recording state
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordedBlob = null;
        this.recordingStartTime = 0;
        this.recordedAudioBuffer = null;
        this.recordingAutoStopTimeout = null;
        this.recordingDestination = null; // MediaStreamDestination for recording
        
        // Loop state for recorded audio
        this.recordingLoopStart = null;
        this.recordingLoopEnd = null;
        this.recordingLoopMarkerCount = 0;
    }
    
    initializeEventListeners() {
        // Playback controls
        this.playBtn?.addEventListener('click', () => this.play());
        this.pauseBtn?.addEventListener('click', () => this.pause());
        this.stopBtn?.addEventListener('click', () => this.stop());
        
        // Loop controls
        this.loopToggleBtn?.addEventListener('click', () => this.toggleTimelineLoop());
        this.loopStartBarInput?.addEventListener('change', (e) => {
            this.loopStartBar = Math.max(0, parseInt(e.target.value) - 1); // Convert to 0-indexed
            this.updateTimelineLoopMarkers();
            
            // If playing in loop mode, restart playback with new loop boundaries
            if (this.isPlaying && this.loopEnabled) {
                console.log('🔄 Loop start changed during playback - restarting...');
                this.restartPlaybackWithNewLoop();
            }
        });
        this.loopEndBarInput?.addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            this.loopEndBar = value > 0 ? value - 1 : this.numberOfBars - 1; // Convert to 0-indexed
            this.updateTimelineLoopMarkers();
            
            // If playing in loop mode, restart playback with new loop boundaries
            if (this.isPlaying && this.loopEnabled) {
                console.log('🔄 Loop end changed during playback - restarting...');
                this.restartPlaybackWithNewLoop();
            }
        });
        
        // Bar controls
        this.addBarBtn?.addEventListener('click', () => this.addBar());
        this.removeBarBtn?.addEventListener('click', () => this.removeBar());
        
        // BPM control
        this.bpmInput?.addEventListener('change', (e) => {
            this.currentBPM = parseInt(e.target.value);
        });
        
        // Zoom control
        this.zoomSlider?.addEventListener('input', (e) => {
            const zoomPercent = parseInt(e.target.value);
            this.zoomLevel = zoomPercent / 100;
            this.barWidth = this.baseBarWidth * this.zoomLevel;
            if (this.zoomValue) {
                this.zoomValue.textContent = `${zoomPercent}%`;
            }
            this.updateTimelineRuler();
            this.updateAllTracksForZoom();
        });
        
        // Fullscreen toggle
        const fullscreenBtn = document.getElementById('sequencerFullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        
        // Effects Panel toggle
        const toggleEffectsPanelBtn = document.getElementById('toggleEffectsPanelBtn');
        if (toggleEffectsPanelBtn) {
            toggleEffectsPanelBtn.addEventListener('click', () => this.toggleEffectsPanel());
        }
        
        // Auto-timestretch toggle
        this.autoTimestretchBtn?.addEventListener('click', () => this.toggleAutoTimestretch());
        
        // Clear cache button
        this.clearCacheBtn?.addEventListener('click', () => this.clearTimestretchCache());
        
        // Save/Load project buttons
        this.saveProjectBtn?.addEventListener('click', () => this.saveProject());
        this.loadProjectBtn?.addEventListener('click', () => this.showLoadProjectDialog());
        this.exportProjectBtn?.addEventListener('click', () => this.exportProject());
        this.importProjectBtn?.addEventListener('click', () => this.importProjectInput?.click());
        this.importProjectInput?.addEventListener('change', (e) => this.importProject(e));
        
        // Project BPM change
        this.bpmInput?.addEventListener('change', (e) => {
            this.projectBPM = parseInt(e.target.value) || 120;
            console.log(`🎵 Project BPM updated: ${this.projectBPM}`);
            if (this.autoTimestretachEnabled) {
                this.applyAutoTimestretchToAllClips();
            }
        });
        
        // ESC key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const container = document.getElementById('sequencerContainer');
                if (container && container.classList.contains('fullscreen')) {
                    this.toggleFullscreen();
                }
            }
        });
        
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Effects panel controls
        this.closeEffectsBtn?.addEventListener('click', () => this.closeEffectsPanel());
        this.deleteClipBtn?.addEventListener('click', () => this.deleteSelectedClip());
        this.resetEffectsBtn?.addEventListener('click', () => this.resetClipEffects());
        
        // Recording controls
        this.recordBtn?.addEventListener('click', () => this.startRecording());
        this.stopRecordBtn?.addEventListener('click', () => this.stopRecording());
        this.downloadBtn?.addEventListener('click', () => this.downloadRecording());
        this.loadToTrack1Btn?.addEventListener('click', () => this.loadToTrack(1));
        this.loadToTrack2Btn?.addEventListener('click', () => this.loadToTrack(2));
        this.sequencerLoopBtn?.addEventListener('click', () => this.toggleRecordingLoop());
        this.sequencerClearLoopBtn?.addEventListener('click', () => this.clearRecordingLoop());
        
        // File upload
        this.sequencerAudioUpload?.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Drag and drop for clips panel
        this.setupDragAndDrop();
        
        // Effect sliders
        this.setupEffectControls();
        
        // Setup resize observer for responsive waveforms
        this.setupResizeObserver();
        
        // Setup panning for zoomed timeline
        this.setupTimelinePanning();
        
        // Setup click-to-set loop markers
        this.setupTimelineLoopMarkerClicks();
    }
    
    setupTimelinePanning() {
        // Get the timeline container (the scrollable parent)
        const timelineContainer = document.querySelector('.sequencer-timeline-container');
        if (!timelineContainer) return;
        
        let isDragging = false;
        
        // Mouse down - start panning
        timelineContainer.addEventListener('mousedown', (e) => {
            // Don't pan if clicking on interactive elements
            if (e.target.closest('.timeline-clip') || 
                e.target.closest('.clip-item') ||
                e.target.closest('button') ||
                e.target.closest('input') ||
                e.target.closest('canvas')) { // Don't interfere with canvas clicks (loop markers, etc.)
                return;
            }
            
            // Only pan with middle mouse button or left button when holding shift
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                isDragging = true;
                this.isPanning = true;
                this.panStartX = e.clientX;
                this.panStartScrollLeft = timelineContainer.scrollLeft;
                timelineContainer.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        // Mouse move - perform panning
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !this.isPanning) return;
            
            const deltaX = e.clientX - this.panStartX;
            timelineContainer.scrollLeft = this.panStartScrollLeft - deltaX;
        });
        
        // Mouse up - stop panning
        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                this.isPanning = false;
                timelineContainer.style.cursor = '';
            }
        });
        
        // Prevent text selection while panning
        timelineContainer.addEventListener('selectstart', (e) => {
            if (this.isPanning) {
                e.preventDefault();
            }
        });
        
        console.log('✅ Timeline panning enabled (Shift+Drag or Middle Mouse Button)');
    }
    
    setupTimelineLoopMarkerClicks() {
        const timelineHeader = document.querySelector('.timeline-header');
        if (!timelineHeader) return;
        
        // Track how many clicks for setting markers (0 = none, 1 = start set, 2 = both set)
        let markerClickCount = 0;
        let isDraggingMarker = false;
        let clickTimer = null; // Timer to prevent click after double-click
        
        // Listen for marker drag start
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.timeline-loop-marker')) {
                isDraggingMarker = true;
            }
        });
        
        // Listen for marker drag end
        document.addEventListener('mouseup', () => {
            // Small delay to ensure click event doesn't fire after drag
            setTimeout(() => {
                isDraggingMarker = false;
            }, 10);
        });
        
        // Double-click handler - move the closer marker to clicked position
        timelineHeader.addEventListener('dblclick', (e) => {
            console.log('🖱️ Double-click detected on timeline');
            
            // Cancel any pending single-click
            if (clickTimer) {
                clearTimeout(clickTimer);
                clickTimer = null;
            }
            
            // Only allow when loop is enabled and both markers are set
            if (!this.loopEnabled || this.loopStartBar === null || this.loopEndBar === null) {
                console.log(`⚠️ Double-click ignored: loopEnabled=${this.loopEnabled}, loopStartBar=${this.loopStartBar}, loopEndBar=${this.loopEndBar}`);
                return;
            }
            
            // Don't interfere with clips, loop markers, buttons, or inputs
            // BUT allow clicking on bar markers (the ruler) - that's the whole point!
            if (e.target.closest('.timeline-loop-marker') ||
                e.target.closest('.timeline-clip') ||
                e.target.closest('button') ||
                e.target.closest('input')) {
                console.log('⚠️ Double-click on interactive element, skipping');
                return;
            }
            
            // Calculate click position relative to timeline
            const rect = timelineHeader.getBoundingClientRect();
            const timelineContainer = document.querySelector('.sequencer-timeline-container');
            const scrollLeft = timelineContainer ? timelineContainer.scrollLeft : 0;
            
            // Get click position in pixels (accounting for scroll)
            const clickX = e.clientX - rect.left + scrollLeft;
            
            // Convert to bar position (fractional)
            const barPosition = clickX / this.barWidth;
            
            // Constrain to valid range
            const constrainedPosition = Math.max(0, Math.min(barPosition, this.numberOfBars));
            
            console.log(`📍 Double-click position: ${constrainedPosition.toFixed(3)} bars (loop range: ${this.loopStartBar.toFixed(3)} to ${this.loopEndBar.toFixed(3)})`);
            
            // Check if position is within the loop range
            if (constrainedPosition >= this.loopStartBar && constrainedPosition <= this.loopEndBar) {
                // Position is within loop - determine which marker is closer
                const distToStart = Math.abs(constrainedPosition - this.loopStartBar);
                const distToEnd = Math.abs(constrainedPosition - this.loopEndBar);
                
                console.log(`📏 Distance to START: ${distToStart.toFixed(3)}, Distance to END: ${distToEnd.toFixed(3)}`);
                
                if (distToStart < distToEnd) {
                    // Start marker is closer - move it
                    console.log(`➡️ START marker is closer, attempting to move...`);
                    // But ensure it doesn't move past end marker
                    if (constrainedPosition < this.loopEndBar - 0.1) {
                        this.loopStartBar = constrainedPosition;
                        
                        if (this.loopStartBarInput) {
                            this.loopStartBarInput.value = Math.round(constrainedPosition) + 1;
                        }
                        
                        const barNum = Math.floor(constrainedPosition);
                        const fraction = ((constrainedPosition % 1) * 100).toFixed(0);
                        console.log(`🎯 Double-click moved loop START to bar ${barNum + 1}.${fraction}%`);
                        
                        this.updateTimelineLoopMarkers();
                    } else {
                        console.log(`⚠️ Cannot move START: would be too close to END (${constrainedPosition.toFixed(3)} >= ${(this.loopEndBar - 0.1).toFixed(3)})`);
                    }
                } else {
                    // End marker is closer - move it
                    console.log(`⬅️ END marker is closer, attempting to move...`);
                    // But ensure it doesn't move before start marker
                    if (constrainedPosition > this.loopStartBar + 0.1) {
                        this.loopEndBar = constrainedPosition;
                        
                        if (this.loopEndBarInput) {
                            this.loopEndBarInput.value = Math.round(constrainedPosition) + 1;
                        }
                        
                        const barNum = Math.floor(constrainedPosition);
                        const fraction = ((constrainedPosition % 1) * 100).toFixed(0);
                        console.log(`🎯 Double-click moved loop END to bar ${barNum + 1}.${fraction}%`);
                        
                        this.updateTimelineLoopMarkers();
                    } else {
                        console.log(`⚠️ Cannot move END: would be too close to START (${constrainedPosition.toFixed(3)} <= ${(this.loopStartBar + 0.1).toFixed(3)})`);
                    }
                }
            } else {
                console.log('⚠️ Double-click outside loop range - no marker moved');
            }
        });
        
        timelineHeader.addEventListener('click', (e) => {
            // Delay single-click handler to check if it's part of a double-click
            if (clickTimer) {
                clearTimeout(clickTimer);
            }
            
            clickTimer = setTimeout(() => {
                clickTimer = null;
                
                // Only allow setting markers when loop is enabled
                if (!this.loopEnabled) return;
                
                // Don't interfere with marker dragging
                if (isDraggingMarker) {
                    console.log('🚫 Skipping click - marker was being dragged');
                    return;
                }
                
                // Don't interfere with other interactive elements
                if (e.target.closest('.timeline-loop-marker') ||
                    e.target.closest('.timeline-clip') ||
                    e.target.closest('button') ||
                    e.target.closest('input') ||
                    e.target.closest('.bar-marker')) { // Don't override bar marker clicks
                    return;
                }
                
                // Don't set markers if user was panning
                if (this.isPanning) {
                    console.log('🚫 Skipping click - was panning timeline');
                    return;
                }
                
                // Calculate click position relative to timeline
                const rect = timelineHeader.getBoundingClientRect();
                const timelineContainer = document.querySelector('.sequencer-timeline-container');
                const scrollLeft = timelineContainer ? timelineContainer.scrollLeft : 0;
                
                // Get click position in pixels (accounting for scroll)
                const clickX = e.clientX - rect.left + scrollLeft;
                
                // Convert to bar position (fractional)
                const barPosition = clickX / this.barWidth;
                
                // Constrain to valid range
                const constrainedPosition = Math.max(0, Math.min(barPosition, this.numberOfBars));
                
                // Determine whether to set start or end marker based on current state
                if (markerClickCount === 0) {
                    // First click - set start marker
                    this.loopStartBar = constrainedPosition;
                    markerClickCount = 1;
                    
                    if (this.loopStartBarInput) {
                        this.loopStartBarInput.value = Math.round(constrainedPosition) + 1;
                    }
                    
                    const barNum = Math.floor(constrainedPosition);
                    const fraction = ((constrainedPosition % 1) * 100).toFixed(0);
                    console.log(`🎯 Click-set loop START to bar ${barNum + 1}.${fraction}%`);
                    
                    this.updateTimelineLoopMarkers();
                    
                    // If playing in loop mode, restart playback with new loop boundaries
                    if (this.isPlaying && this.loopEnabled) {
                        console.log('🔄 Loop start changed during playback - restarting...');
                        this.restartPlaybackWithNewLoop();
                    }
                } else if (markerClickCount === 1) {
                    // Second click - set end marker
                    // Make sure end is after start
                    if (constrainedPosition > this.loopStartBar + 0.1) {
                        this.loopEndBar = constrainedPosition;
                        markerClickCount = 2;
                        
                        if (this.loopEndBarInput) {
                            this.loopEndBarInput.value = Math.round(constrainedPosition) + 1; // Convert to 1-indexed
                        }
                        
                        const barNum = Math.floor(constrainedPosition);
                        const fraction = ((constrainedPosition % 1) * 100).toFixed(0);
                        console.log(`🎯 Click-set loop END to bar ${barNum + 1}.${fraction}%`);
                        console.log(`✅ Loop markers set! Click again to reset.`);
                        
                        this.updateTimelineLoopMarkers();
                        
                        // If playing in loop mode, restart playback with new loop boundaries
                        if (this.isPlaying && this.loopEnabled) {
                            console.log('🔄 Loop end changed during playback - restarting...');
                            this.restartPlaybackWithNewLoop();
                        }
                    } else {
                        console.log(`⚠️ End marker must be after start marker`);
                    }
                } else {
                    // Third click - reset and start over
                    markerClickCount = 0;
                    this.loopStartBar = constrainedPosition;
                    markerClickCount = 1;
                    
                    if (this.loopStartBarInput) {
                        this.loopStartBarInput.value = Math.round(constrainedPosition) + 1;
                    }
                    
                    const barNum = Math.floor(constrainedPosition);
                    const fraction = ((constrainedPosition % 1) * 100).toFixed(0);
                    console.log(`🔄 Resetting loop markers...`);
                    console.log(`🎯 Click-set loop START to bar ${barNum + 1}.${fraction}%`);
                    
                    this.updateTimelineLoopMarkers();
                    
                    // If playing in loop mode, restart playback with new loop boundaries
                    if (this.isPlaying && this.loopEnabled) {
                        console.log('🔄 Loop markers reset during playback - restarting...');
                        this.restartPlaybackWithNewLoop();
                    }
                }
            }, 250); // 250ms delay to distinguish between click and double-click
        });
        
        console.log('✅ Timeline click-to-set loop markers enabled');
    }
    
    setupResizeObserver() {
        // Observe the sequencer tracks container for size changes
        if (this.sequencerTracksContainer && typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                // Redraw all waveforms when container resizes
                this.redrawAllWaveforms();
            });
            this.resizeObserver.observe(this.sequencerTracksContainer);
        }
    }
    
    redrawAllWaveforms() {
        // Redraw waveforms for all clips
        this.sequencerTracks.forEach(track => {
            track.clips.forEach(placedClip => {
                const clipElement = placedClip.element;
                const sourceClip = placedClip.sourceClip;
                const clipWidthPx = parseFloat(clipElement.style.width);
                
                if (sourceClip && sourceClip.audioBuffer && clipWidthPx > 0) {
                    this.drawWaveform(clipElement, sourceClip.audioBuffer, clipWidthPx);
                }
            });
        });
    }
    
    setupEffectControls() {
        // Volume
        const volumeSlider = document.getElementById('clipVolumeSlider');
        const volumeValue = document.getElementById('clipVolumeValue');
        volumeSlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            volumeValue.textContent = `${value}%`;
            this.updateClipEffect('volume', parseFloat(value) / 100);
        });
        
        // Pitch
        const pitchSlider = document.getElementById('clipPitchSlider');
        const pitchValue = document.getElementById('clipPitchValue');
        pitchSlider?.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            pitchValue.textContent = value > 0 ? `+${value}` : value;
            this.updateClipEffect('pitch', value);
        });
        
        // Filter
        const filterSlider = document.getElementById('clipFilterSlider');
        const filterValue = document.getElementById('clipFilterValue');
        const filterType = document.getElementById('clipFilterType');
        
        filterSlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            filterValue.textContent = value >= 1000 ? `${(value / 1000).toFixed(1)}kHz` : `${value}Hz`;
            this.updateClipEffect('filterFreq', parseFloat(value));
        });
        
        filterType?.addEventListener('change', (e) => {
            this.updateClipEffect('filterType', e.target.value);
        });
        
        // Reverb
        const reverbSlider = document.getElementById('clipReverbSlider');
        const reverbValue = document.getElementById('clipReverbValue');
        reverbSlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            reverbValue.textContent = `${value}%`;
            this.updateClipEffect('reverb', parseFloat(value) / 100);
        });
        
        // Delay
        const delaySlider = document.getElementById('clipDelaySlider');
        const delayValue = document.getElementById('clipDelayValue');
        delaySlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            delayValue.textContent = `${value}%`;
            this.updateClipEffect('delay', parseFloat(value) / 100);
        });
        
        // Delay Time
        const delayTimeSlider = document.getElementById('clipDelayTimeSlider');
        const delayTimeValue = document.getElementById('clipDelayTimeValue');
        delayTimeSlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            delayTimeValue.textContent = `${value}ms`;
            this.updateClipEffect('delayTime', parseFloat(value) / 1000);
        });
        
        // ADSR Controls
        const adsrAttackSlider = document.getElementById('clipAdsrAttackSlider');
        const adsrAttackValue = document.getElementById('clipAdsrAttackValue');
        adsrAttackSlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            adsrAttackValue.textContent = `${value}ms`;
            this.updateClipEffect('adsrAttack', parseFloat(value) / 1000);
        });
        
        const adsrDecaySlider = document.getElementById('clipAdsrDecaySlider');
        const adsrDecayValue = document.getElementById('clipAdsrDecayValue');
        adsrDecaySlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            adsrDecayValue.textContent = `${value}ms`;
            this.updateClipEffect('adsrDecay', parseFloat(value) / 1000);
        });
        
        const adsrSustainSlider = document.getElementById('clipAdsrSustainSlider');
        const adsrSustainValue = document.getElementById('clipAdsrSustainValue');
        adsrSustainSlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            adsrSustainValue.textContent = `${value}%`;
            this.updateClipEffect('adsrSustain', parseFloat(value) / 100);
        });
        
        const adsrReleaseSlider = document.getElementById('clipAdsrReleaseSlider');
        const adsrReleaseValue = document.getElementById('clipAdsrReleaseValue');
        adsrReleaseSlider?.addEventListener('input', (e) => {
            const value = e.target.value;
            adsrReleaseValue.textContent = `${value}ms`;
            this.updateClipEffect('adsrRelease', parseFloat(value) / 1000);
        });
        
        // ADSR Trigger button
        const adsrTrigger = document.getElementById('clipAdsrTrigger');
        adsrTrigger?.addEventListener('click', () => {
            console.log('🎛️ ADSR Trigger clicked for clip effects');
            // Note: ADSR trigger will be applied during playback
        });
    }
    
    setupDragAndDrop() {
        const clipsPanel = this.clipsList?.parentElement;
        if (!clipsPanel) return;
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            clipsPanel.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            clipsPanel.addEventListener(eventName, () => {
                clipsPanel.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            clipsPanel.addEventListener(eventName, () => {
                clipsPanel.classList.remove('drag-over');
            }, false);
        });
        
        // Handle dropped files
        clipsPanel.addEventListener('drop', async (e) => {
            const dt = e.dataTransfer;
            const files = [...dt.files].filter(file => file.type.startsWith('audio/'));
            
            if (files.length === 0) {
                console.log('No audio files detected in drop');
                return;
            }
            
            console.log(`📁 ${files.length} audio file(s) dropped into sequencer`);
            
            for (let file of files) {
                try {
                    console.log('Loading dropped audio file:', file.name);
                    
                    // Read and decode audio file
                    const arrayBuffer = await file.arrayBuffer();
                    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
                    tempContext.close();
                    
                    // Add clip to sequencer
                    const clipId = `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const clipName = file.name;
                    const duration = audioBuffer.duration;
                    
                    this.addClip(clipId, clipName, audioBuffer, duration);
                    
                    console.log(`✅ Added dropped file to sequencer: ${clipName} (${this.formatDuration(duration)})`);
                    
                } catch (error) {
                    console.error('Error loading dropped audio file:', error);
                    alert(`Failed to load ${file.name}: ${error.message}`);
                }
            }
        }, false);
        
        console.log('✅ Drag and drop enabled for clips panel');
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }
    
    initializeTimeline() {
        this.updateTimelineRuler();
        this.addSequencerTrack('Track 1');
    }
    
    updateTimelineRuler() {
        if (!this.timelineRuler) return;
        
        // Set explicit width for ruler to match timeline
        const totalWidth = this.numberOfBars * this.barWidth;
        this.timelineRuler.style.width = `${totalWidth}px`;
        
        this.timelineRuler.innerHTML = '';
        for (let i = 1; i <= this.numberOfBars; i++) {
            const barMarker = document.createElement('div');
            barMarker.className = 'bar-marker';
            barMarker.textContent = `Bar ${i}`;
            barMarker.style.width = `${this.barWidth}px`;
            this.timelineRuler.appendChild(barMarker);
        }
    }
    
    addBar() {
        this.numberOfBars++;
        this.updateTimelineRuler();
        this.updateAllTrackTimelines();
        
        // Update loop controls max values
        if (this.loopStartBarInput) {
            this.loopStartBarInput.max = this.numberOfBars;
        }
        if (this.loopEndBarInput) {
            this.loopEndBarInput.max = this.numberOfBars;
            // If loop is enabled and at max, extend it
            if (this.loopEnabled && this.loopEndBar === this.numberOfBars - 1) {
                this.loopEndBar = this.numberOfBars;
                this.loopEndBarInput.value = this.numberOfBars;
            }
        }
    }
    
    removeBar() {
        if (this.numberOfBars > 1) {
            this.numberOfBars--;
            this.updateTimelineRuler();
            this.updateAllTrackTimelines();
            
            // Update loop controls max values
            if (this.loopStartBarInput) {
                this.loopStartBarInput.max = this.numberOfBars;
            }
            if (this.loopEndBarInput) {
                this.loopEndBarInput.max = this.numberOfBars;
                // Adjust loop end if it exceeds new max
                if (this.loopEndBar > this.numberOfBars) {
                    this.loopEndBar = this.numberOfBars;
                    this.loopEndBarInput.value = this.numberOfBars;
                }
            }
        }
    }
    
    updateAllTrackTimelines() {
        this.sequencerTracks.forEach(track => {
            const timeline = track.element.querySelector('.track-timeline');
            if (timeline) {
                this.updateTrackTimeline(timeline);
            }
        });
    }
    
    updateAllTracksForZoom() {
        // Update timeline bars width
        this.updateAllTrackTimelines();
        
        // Update all placed clips positions and widths
        this.sequencerTracks.forEach(track => {
            track.clips.forEach(placedClip => {
                const clipElement = placedClip.element;
                const sourceClip = placedClip.sourceClip;
                
                // Recalculate position and width based on new zoom
                const pixelPosition = placedClip.pixelPosition || (placedClip.barPosition * this.baseBarWidth);
                const newLeft = (pixelPosition / this.baseBarWidth) * this.barWidth;
                
                // Recalculate width
                const secondsPerBar = (60 / this.currentBPM) * 4;
                const clipWidthInBars = sourceClip.duration / secondsPerBar;
                const clipWidthPx = clipWidthInBars * this.barWidth;
                
                clipElement.style.left = `${newLeft}px`;
                clipElement.style.width = `${clipWidthPx}px`;
                
                // Redraw waveform with new size
                this.drawWaveform(clipElement, sourceClip.audioBuffer, clipWidthPx);
            });
            
            // Expand timeline to fit all clips after zoom
            const timeline = track.element.querySelector('.track-timeline');
            this.expandTimelineToFitClips(timeline);
        });
        
        // Update timeline loop markers if loop is enabled
        this.updateTimelineLoopMarkers();
    }

    autoZoomToFitLongestTrack() {
        // Find the rightmost edge of all clips across all tracks
        let maxRight = 0;
        
        this.sequencerTracks.forEach(track => {
            track.clips.forEach(placedClip => {
                const clipElement = placedClip.element;
                const left = parseFloat(clipElement.style.left) || 0;
                const width = parseFloat(clipElement.style.width) || 0;
                const clipRight = left + width;
                maxRight = Math.max(maxRight, clipRight);
            });
        });
        
        // If no clips, nothing to do
        if (maxRight === 0) return;
        
        // Get the timeline container's visible width
        const timelineContainer = document.querySelector('.sequencer-timeline-container');
        if (!timelineContainer) return;
        
        const containerWidth = timelineContainer.clientWidth;
        
        // Add some padding (10% of container) for breathing room
        const padding = containerWidth * 0.1;
        const targetWidth = containerWidth - padding;
        
        // Calculate the required zoom level to fit the longest content
        // maxRight is currently sized at this.zoomLevel, we need to fit it in targetWidth
        // newZoomLevel = targetWidth / (maxRight / this.zoomLevel)
        const requiredZoomLevel = (targetWidth / maxRight) * this.zoomLevel;
        
        // Only auto-zoom out (make things smaller), never auto-zoom in
        // Also set a minimum zoom level of 10% to prevent too-small view
        if (requiredZoomLevel < this.zoomLevel && requiredZoomLevel >= 0.1) {
            this.zoomLevel = requiredZoomLevel;
            this.barWidth = this.baseBarWidth * this.zoomLevel;
            
            // Update the zoom slider UI
            const zoomPercent = Math.round(this.zoomLevel * 100);
            if (this.zoomSlider) {
                this.zoomSlider.value = zoomPercent;
            }
            if (this.zoomValue) {
                this.zoomValue.textContent = `${zoomPercent}%`;
            }
            
            // Update all tracks and clips to reflect new zoom
            this.updateTimelineRuler();
            this.updateAllTracksForZoom();
        }
    }
    
    updateTrackTimeline(timeline) {
        // Update the background pattern to match current zoom
        const barWidth = this.barWidth;
        timeline.style.background = `repeating-linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0px,
            rgba(0, 0, 0, 0.2) ${barWidth}px,
            rgba(0, 0, 0, 0.3) ${barWidth}px,
            rgba(0, 0, 0, 0.3) ${barWidth + 1}px
        )`;
        
        // Update the timeline bars to match number of bars
        const existingBars = timeline.querySelectorAll('.timeline-bar');
        const currentBars = existingBars.length;
        
        if (currentBars < this.numberOfBars) {
            // Add more bars
            for (let i = currentBars; i < this.numberOfBars; i++) {
                const bar = document.createElement('div');
                bar.className = 'timeline-bar';
                bar.dataset.barIndex = i;
                bar.style.width = `${this.barWidth}px`;
                timeline.appendChild(bar);
            }
        } else if (currentBars > this.numberOfBars) {
            // Remove excess bars
            for (let i = currentBars - 1; i >= this.numberOfBars; i--) {
                existingBars[i].remove();
            }
        }
        
        // Update existing bar widths for zoom
        timeline.querySelectorAll('.timeline-bar').forEach(bar => {
            bar.style.width = `${this.barWidth}px`;
        });
    }
    
    addSequencerTrack(name) {
        const trackElement = document.createElement('div');
        trackElement.className = 'sequencer-track';
        
        const trackId = `seq-track-${Date.now()}`;
        trackElement.dataset.trackId = trackId;
        
        trackElement.innerHTML = `
            <div class="track-header">
                <span class="track-name">${name}</span>
                <div class="track-controls">
                    <div class="track-volume-control">
                        <label>Vol</label>
                        <input type="range" class="track-volume-slider" min="0" max="100" value="80" />
                        <span class="track-volume-value">80%</span>
                    </div>
                    <button class="track-control-btn mute-btn">🔇 Mute</button>
                    <button class="track-control-btn solo-btn">🎯 Solo</button>
                    <button class="track-control-btn delete-btn">🗑️ Delete</button>
                </div>
            </div>
            <div class="track-timeline"></div>
        `;
        
        const timeline = trackElement.querySelector('.track-timeline');
        this.updateTrackTimeline(timeline);
        
        // Set up drop zone for clips
        this.setupDropZone(timeline, trackId);
        
        // Create audio gain node for this track
        const trackGain = this.audioContext ? this.audioContext.createGain() : null;
        if (trackGain) {
            trackGain.gain.value = 0.8; // Default 80% volume
            trackGain.connect(this.outputGain); // Connect to sequencer output
            console.log(`✅ Created gain node for track: ${name}`);
        }
        
        // Track controls
        const deleteBtn = trackElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.deleteTrack(trackId));
        
        const muteBtn = trackElement.querySelector('.mute-btn');
        muteBtn.addEventListener('click', (e) => this.toggleMute(trackId, e.target));
        
        const soloBtn = trackElement.querySelector('.solo-btn');
        soloBtn.addEventListener('click', (e) => this.toggleSolo(trackId, e.target));
        
        // Volume control
        const volumeSlider = trackElement.querySelector('.track-volume-slider');
        const volumeValue = trackElement.querySelector('.track-volume-value');
        volumeSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            volumeValue.textContent = `${value}%`;
            if (trackGain) {
                trackGain.gain.value = value / 100;
            }
        });
        
        this.sequencerTracksContainer?.appendChild(trackElement);
        
        const track = {
            id: trackId,
            name: name,
            element: trackElement,
            clips: [],
            muted: false,
            solo: false,
            gainNode: trackGain, // Store the gain node
            volume: 0.8
        };
        
        this.sequencerTracks.push(track);
        
        return track;
    }
    
    deleteTrack(trackId) {
        const index = this.sequencerTracks.findIndex(t => t.id === trackId);
        if (index !== -1) {
            const track = this.sequencerTracks[index];
            
            // Disconnect and clean up the gain node
            if (track.gainNode) {
                track.gainNode.disconnect();
                console.log(`🗑️ Disconnected gain node for track: ${track.name}`);
            }
            
            track.element.remove();
            this.sequencerTracks.splice(index, 1);
        }
    }
    
    toggleMute(trackId, btn) {
        const track = this.sequencerTracks.find(t => t.id === trackId);
        if (track) {
            track.muted = !track.muted;
            btn.textContent = track.muted ? '🔊 Unmute' : '🔇 Mute';
            btn.style.background = track.muted ? 'rgba(255, 100, 100, 0.3)' : '';
        }
    }
    
    toggleSolo(trackId, btn) {
        const track = this.sequencerTracks.find(t => t.id === trackId);
        if (track) {
            track.solo = !track.solo;
            btn.style.background = track.solo ? 'rgba(100, 255, 100, 0.3)' : '';
        }
    }
    
    setupDropZone(timeline, trackId) {
        timeline.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        timeline.addEventListener('drop', (e) => {
            e.preventDefault();
            const clipId = e.dataTransfer.getData('text/plain');
            const clip = this.clips.get(clipId);
            
            if (clip) {
                // Calculate position in bars based on drop location
                const rect = timeline.getBoundingClientRect();
                const x = e.clientX - rect.left;
                
                // Get track to check for adjacent clips
                const track = this.sequencerTracks.find(t => t.id === trackId);
                const pixelPosition = this.snapToGridOrClip(x, track);
                
                this.addClipToTrack(trackId, clip, pixelPosition);
            }
        });
    }
    
    addClipToTrack(trackId, clip, pixelPosition) {
        const track = this.sequencerTracks.find(t => t.id === trackId);
        if (!track) return;
        
        const timeline = track.element.querySelector('.track-timeline');
        
        // Calculate clip width based on duration and BPM
        const secondsPerBar = (60 / this.currentBPM) * 4; // Assuming 4/4 time
        const clipWidthInBars = clip.duration / secondsPerBar;
        const clipWidthPx = clipWidthInBars * this.barWidth;
        
        // No constraints - track extends infinitely
        const clipElement = document.createElement('div');
        clipElement.className = 'timeline-clip';
        clipElement.style.left = `${pixelPosition}px`;
        clipElement.style.width = `${clipWidthPx}px`;
        
        const clipId = `placed-clip-${Date.now()}`;
        clipElement.dataset.clipId = clipId;
        clipElement.dataset.sourceClipId = clip.id;
        
        // Create waveform canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'timeline-clip-waveform';
        clipElement.appendChild(canvas);
        
        // Create content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'timeline-clip-content';
        contentDiv.textContent = clip.name;
        clipElement.appendChild(contentDiv);
        
        // Draw waveform with actual clip width
        this.drawWaveform(clipElement, clip.audioBuffer, clipWidthPx);
        
        // Add click handler for selecting clip to apply effects
        clipElement.addEventListener('click', (e) => {
            // Don't trigger during drag
            if (!clipElement.classList.contains('dragging')) {
                const clipData = {
                    id: clipId,
                    name: clip.name,
                    duration: clip.duration,
                    sourceClipId: clip.id
                };
                this.selectClip(clipElement, clipData);
                e.stopPropagation();
            }
        });
        
        // Make clip draggable within timeline
        this.makeClipDraggable(clipElement, timeline);
        
        timeline.appendChild(clipElement);
        
        // Ensure timeline is wide enough to contain this clip
        this.expandTimelineToFitClips(timeline);
        
        // Auto-zoom to fit the longest track if this clip is long
        this.autoZoomToFitLongestTrack();
        
        // Store pixel position for accurate sequencing
        const barPosition = pixelPosition / this.barWidth;
        track.clips.push({
            id: clipId,
            sourceClip: clip,
            barPosition: barPosition,
            pixelPosition: pixelPosition,
            element: clipElement,
            trimStart: 0, // Trim from start in seconds
            trimEnd: 0    // Trim from end in seconds
        });
    }
    
    expandTimelineToFitClips(timeline) {
        // Find the rightmost edge of all clips
        const clips = timeline.querySelectorAll('.timeline-clip');
        let maxRight = this.numberOfBars * this.barWidth; // Minimum width (numbered bars)
        
        clips.forEach(clip => {
            const left = parseInt(clip.style.left) || 0;
            const width = parseFloat(clip.style.width) || 0;
            const right = left + width;
            if (right > maxRight) {
                maxRight = right;
            }
        });
        
        // Calculate how many bars we need to accommodate all clips
        const barsNeeded = Math.ceil(maxRight / this.barWidth);
        
        // Auto-expand bars if clips extend beyond current bar count
        if (barsNeeded > this.numberOfBars) {
            const barsToAdd = barsNeeded - this.numberOfBars;
            console.log(`📊 Auto-expanding timeline: adding ${barsToAdd} bars to fit clips (from ${this.numberOfBars} to ${barsNeeded})`);
            
            // Update number of bars
            this.numberOfBars = barsNeeded;
            
            // Update the timeline ruler and all track timelines
            this.updateTimelineRuler();
            this.updateAllTrackTimelines();
            
            // Update loop controls max values
            if (this.loopStartBarInput) {
                this.loopStartBarInput.max = this.numberOfBars;
            }
            if (this.loopEndBarInput) {
                this.loopEndBarInput.max = this.numberOfBars;
                // If loop end was at the old max, extend it (0-indexed comparison)
                if (this.loopEnabled && this.loopEndBar < barsNeeded - 1) {
                    this.loopEndBar = barsNeeded - 1; // 0-indexed
                    this.loopEndBarInput.value = barsNeeded; // Display 1-indexed
                    this.updateTimelineLoopMarkers();
                }
            }
        }
        
        // Add some padding to the right
        const minWidth = maxRight + (this.barWidth * 2); // Extra 2 bars of space
        timeline.style.minWidth = `${minWidth}px`;
        
        // Also ensure parent track expands
        const track = timeline.closest('.sequencer-track');
        if (track) {
            track.style.minWidth = `${minWidth}px`;
        }
        
        console.log(`Expanded timeline to ${minWidth}px (maxRight: ${maxRight})`);
    }
    
    makeClipDraggable(clipElement, timeline) {
        let isDragging = false;
        let isResizing = false;
        let resizeDirection = null; // 'left' or 'right'
        let startX = 0;
        let startLeft = 0;
        let startWidth = 0;
        let startTrimStart = 0; // Store initial trim values
        let startTrimEnd = 0;
        
        // Detect if mouse is over resize handle
        const isOverResizeHandle = (e) => {
            const rect = clipElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const handleWidth = 8; // Match CSS ::before/::after width
            
            if (x <= handleWidth) return 'left';
            if (x >= rect.width - handleWidth) return 'right';
            return null;
        };
        
        // Update cursor based on position
        clipElement.addEventListener('mousemove', (e) => {
            if (isDragging || isResizing) return;
            
            const handle = isOverResizeHandle(e);
            if (handle) {
                clipElement.style.cursor = 'ew-resize';
            } else {
                clipElement.style.cursor = 'move';
            }
        });
        
        clipElement.addEventListener('mousedown', (e) => {
            const handle = isOverResizeHandle(e);
            
            if (handle) {
                // Start resizing
                isResizing = true;
                resizeDirection = handle;
                startX = e.clientX;
                startLeft = parseInt(clipElement.style.left) || 0;
                startWidth = parseFloat(clipElement.style.width) || 0;
                
                // Store initial trim values
                const track = this.sequencerTracks.find(t => 
                    t.element.querySelector('.track-timeline') === timeline
                );
                const placedClip = track?.clips.find(c => c.element === clipElement);
                if (placedClip) {
                    startTrimStart = placedClip.trimStart || 0;
                    startTrimEnd = placedClip.trimEnd || 0;
                }
                
                clipElement.classList.add('resizing');
                e.preventDefault();
                e.stopPropagation();
            } else {
                // Start dragging
                isDragging = true;
                startX = e.clientX;
                startLeft = parseInt(clipElement.style.left) || 0;
                clipElement.classList.add('dragging');
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isResizing) {
                const deltaX = e.clientX - startX;
                const track = this.sequencerTracks.find(t => 
                    t.element.querySelector('.track-timeline') === timeline
                );
                const placedClip = track?.clips.find(c => c.element === clipElement);
                if (!placedClip) return;
                
                const sourceClip = placedClip.sourceClip;
                const secondsPerBar = (60 / this.currentBPM) * 4;
                const pixelsPerSecond = this.barWidth / secondsPerBar;
                
                if (resizeDirection === 'left') {
                    // Resize from left (trim start)
                    // Calculate how much trim to add based on total pixel movement from start
                    const trimSeconds = deltaX / pixelsPerSecond;
                    const maxTrim = sourceClip.duration - startTrimEnd - 0.1; // Leave at least 0.1s
                    
                    // Calculate new trim based on initial trim + change
                    const newTrimStart = Math.max(0, Math.min(startTrimStart + trimSeconds, maxTrim));
                    const actualTrimChange = newTrimStart - startTrimStart;
                    
                    placedClip.trimStart = newTrimStart;
                    
                    // Update visual position and width
                    // Position moves right as we trim from start
                    const newLeft = startLeft + (actualTrimChange * pixelsPerSecond);
                    const newWidth = startWidth - (actualTrimChange * pixelsPerSecond);
                    
                    // Ensure minimum width
                    if (newWidth >= 20) {
                        clipElement.style.left = `${newLeft}px`;
                        clipElement.style.width = `${newWidth}px`;
                    } else {
                        // Cap at minimum width
                        const maxAllowedTrim = (startWidth - 20) / pixelsPerSecond;
                        placedClip.trimStart = startTrimStart + maxAllowedTrim;
                        clipElement.style.left = `${startLeft + maxAllowedTrim * pixelsPerSecond}px`;
                        clipElement.style.width = '20px';
                    }
                    
                } else if (resizeDirection === 'right') {
                    // Resize from right (trim end)
                    // Calculate how much trim to add based on total pixel movement from start
                    // Negative deltaX = trimming more, positive = restoring
                    const trimSeconds = -deltaX / pixelsPerSecond;
                    const maxTrim = sourceClip.duration - startTrimStart - 0.1; // Leave at least 0.1s
                    
                    // Calculate new trim based on initial trim + change
                    const newTrimEnd = Math.max(0, Math.min(startTrimEnd + trimSeconds, maxTrim));
                    const actualTrimChange = newTrimEnd - startTrimEnd;
                    
                    placedClip.trimEnd = newTrimEnd;
                    
                    // Update visual width
                    // Width decreases as we trim from end
                    const newWidth = startWidth - (actualTrimChange * pixelsPerSecond);
                    
                    // Ensure minimum width
                    if (newWidth >= 20) {
                        clipElement.style.width = `${newWidth}px`;
                    } else {
                        // Cap at minimum width
                        const maxAllowedTrim = (startWidth - 20) / pixelsPerSecond;
                        placedClip.trimEnd = startTrimEnd + maxAllowedTrim;
                        clipElement.style.width = '20px';
                    }
                }
                
                // Redraw waveform with new dimensions
                const newWidth = parseFloat(clipElement.style.width);
                this.drawWaveform(clipElement, sourceClip.audioBuffer, newWidth, placedClip.trimStart, placedClip.trimEnd);
                
            } else if (isDragging) {
                const deltaX = e.clientX - startX;
                const newLeft = Math.max(0, startLeft + deltaX);
                
                // Get current track
                const track = this.sequencerTracks.find(t => 
                    t.element.querySelector('.track-timeline') === timeline
                );
                
                // Snap to grid or adjacent clips (no boundary constraints - track extends infinitely)
                const snappedLeft = this.snapToGridOrClip(newLeft, track, clipElement);
                clipElement.style.left = `${snappedLeft}px`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeDirection = null;
                clipElement.classList.remove('resizing');
                clipElement.style.cursor = 'move';
                
                // Update stored position
                const track = this.sequencerTracks.find(t => 
                    t.element.querySelector('.track-timeline') === timeline
                );
                if (track) {
                    const placedClip = track.clips.find(c => c.element === clipElement);
                    if (placedClip) {
                        placedClip.pixelPosition = parseInt(clipElement.style.left);
                        placedClip.barPosition = placedClip.pixelPosition / this.barWidth;
                        console.log(`✂️ Clip trimmed - Start: ${placedClip.trimStart.toFixed(2)}s, End: ${placedClip.trimEnd.toFixed(2)}s`);
                    }
                }
                
                // Ensure timeline expands to fit
                this.expandTimelineToFitClips(timeline);
                
            } else if (isDragging) {
                isDragging = false;
                clipElement.classList.remove('dragging');
                
                // Ensure timeline expands to fit new position
                this.expandTimelineToFitClips(timeline);
                
                // Update clip position
                const pixelPosition = parseInt(clipElement.style.left);
                const barPosition = pixelPosition / this.barWidth;
                const track = this.sequencerTracks.find(t => 
                    t.element.querySelector('.track-timeline') === timeline
                );
                
                if (track) {
                    const placedClip = track.clips.find(c => c.element === clipElement);
                    if (placedClip) {
                        placedClip.barPosition = barPosition;
                        placedClip.pixelPosition = pixelPosition;
                    }
                }
            }
        });
        
        // Delete clip on double-click
        clipElement.addEventListener('dblclick', () => {
            clipElement.remove();
            const track = this.sequencerTracks.find(t => 
                t.element.querySelector('.track-timeline') === timeline
            );
            if (track) {
                track.clips = track.clips.filter(c => c.element !== clipElement);
            }
        });
    }
    
    /**
     * Draw waveform visualization on a clip
     * @param {HTMLElement} clipElement - The clip element containing the canvas
     * @param {AudioBuffer} audioBuffer - The audio buffer to visualize
     * @param {number} width - The width of the clip in pixels
     * @param {number} trimStart - Seconds to trim from start (default 0)
     * @param {number} trimEnd - Seconds to trim from end (default 0)
     */
    drawWaveform(clipElement, audioBuffer, width, trimStart = 0, trimEnd = 0) {
        if (!audioBuffer) return;
        
        const canvas = clipElement.querySelector('.timeline-clip-waveform');
        if (!canvas) return;
        
        // Get the actual rendered height of the clip element
        const clipHeight = clipElement.offsetHeight || 50;
        
        // Use device pixel ratio for sharp rendering on high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        
        // Set canvas display size (CSS pixels)
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        // Set canvas actual size in memory (scaled to account for device pixel ratio)
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(clipHeight * dpr);
        
        const ctx = canvas.getContext('2d');
        
        // Scale context to match device pixel ratio
        ctx.scale(dpr, dpr);
        
        const data = audioBuffer.getChannelData(0); // Get first channel
        const sampleRate = audioBuffer.sampleRate;
        
        // Calculate the original untrimmed width for proper scaling
        const originalDuration = audioBuffer.duration;
        const trimmedDuration = originalDuration - trimStart - trimEnd;
        const secondsPerBar = (60 / this.currentBPM) * 4;
        const pixelsPerSecond = this.barWidth / secondsPerBar;
        const originalWidth = originalDuration * pixelsPerSecond;
        
        // Calculate the range of samples to display based on trim
        const totalSamples = data.length;
        const startSample = Math.floor(trimStart * sampleRate);
        const endSample = Math.floor((audioBuffer.duration - trimEnd) * sampleRate);
        const trimmedLength = endSample - startSample;
        
        // Use original width for step calculation to maintain waveform scale
        const step = Math.ceil(trimmedLength / originalWidth);
        const amp = clipHeight / 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.clearRect(0, 0, width, clipHeight);
        
        // Draw waveform using original scale
        // We draw as if it's the full width, which makes the visible portion show correct detail
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            
            // Find min and max in this segment
            for (let j = 0; j < step; j++) {
                const sampleIndex = startSample + (i * step) + j;
                if (sampleIndex >= endSample) break;
                
                const datum = data[sampleIndex];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            // Draw vertical line for this sample
            const yMin = (1 + min) * amp;
            const yMax = (1 + max) * amp;
            const lineHeight = Math.max(1, yMax - yMin); // Ensure minimum 1px height
            ctx.fillRect(i, yMin, 1, lineHeight);
        }
    }
    
    /**
     * Smart snapping: snaps to grid OR to the end of adjacent clips
     * @param {number} position - The target pixel position
     * @param {object} track - The track object containing clips
     * @param {HTMLElement} currentClip - The clip being dragged (to exclude from snapping)
     * @returns {number} - The snapped pixel position
     */
    snapToGridOrClip(position, track, currentClip = null) {
        const snapThreshold = 20; // pixels - how close to snap to adjacent clips
        
        // Default: snap to bar grid
        let snappedPosition = Math.round(position / this.barWidth) * this.barWidth;
        
        if (!track || !track.clips || track.clips.length === 0) {
            return snappedPosition;
        }
        
        // Find the nearest clip edge (start or end)
        let nearestEdge = null;
        let nearestDistance = snapThreshold;
        
        for (const clip of track.clips) {
            // Skip the current clip being dragged
            if (currentClip && clip.element === currentClip) continue;
            
            const clipLeft = parseInt(clip.element.style.left);
            const clipWidth = parseFloat(clip.element.style.width);
            const clipRight = clipLeft + clipWidth;
            
            // Check distance to clip's start
            const distanceToStart = Math.abs(position - clipLeft);
            if (distanceToStart < nearestDistance) {
                nearestDistance = distanceToStart;
                nearestEdge = clipLeft;
            }
            
            // Check distance to clip's end
            const distanceToEnd = Math.abs(position - clipRight);
            if (distanceToEnd < nearestDistance) {
                nearestDistance = distanceToEnd;
                nearestEdge = clipRight;
            }
        }
        
        // If we found a nearby clip edge, snap to it
        if (nearestEdge !== null) {
            return nearestEdge;
        }
        
        // Otherwise, snap to grid
        return snappedPosition;
    }
    
    addClip(id, name, audioBuffer, duration, startTime = 0, endTime = null) {
        // Detect BPM
        const detectedBPM = detectBPM(audioBuffer);
        
        const clip = {
            id: id,
            name: name,
            audioBuffer: audioBuffer,
            duration: endTime ? (endTime - startTime) : duration,
            startTime: startTime,
            endTime: endTime || duration,
            fullBuffer: audioBuffer,
            detectedBPM: detectedBPM || 0,
            appliedStretchRatio: 1.0,
            manualStretch: 1.0,
            manualPitch: 0,
            autoTimestretched: false,
            renderingStatus: 'pending'
        };
        
        this.clips.set(id, clip);
        this.updateClipsList();
        
        console.log(`📋 Added clip: ${name}, BPM: ${detectedBPM || 'unknown'}`);
    }
    
    addLoopClip(trackNumber, audioBuffer, loopStart, loopEnd, fileName) {
        const loopDuration = loopEnd - loopStart;
        const clipId = `track${trackNumber}-loop-${Date.now()}`;
        const clipName = `Track ${trackNumber} Loop: ${fileName} (${this.formatDuration(loopStart)} - ${this.formatDuration(loopEnd)})`;
        
        this.addClip(clipId, clipName, audioBuffer, loopDuration, loopStart, loopEnd);
        console.log('Added loop clip to sequencer:', clipName);
    }
    
    async handleFileUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        for (let file of files) {
            try {
                console.log('Loading audio file to sequencer:', file.name);
                
                // Read and decode audio file
                const arrayBuffer = await file.arrayBuffer();
                const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
                tempContext.close();
                
                // Add clip to sequencer
                const clipId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const clipName = file.name;
                const duration = audioBuffer.duration;
                
                this.addClip(clipId, clipName, audioBuffer, duration);
                
                console.log(`✅ Added uploaded file to sequencer: ${clipName} (${this.formatDuration(duration)})`);
                
            } catch (error) {
                console.error('Error loading audio file:', error);
                alert(`Failed to load ${file.name}: ${error.message}`);
            }
        }
        
        // Reset input so the same file can be selected again
        event.target.value = '';
    }
    
    updateClipsList() {
        if (!this.clipsList) return;
        
        this.clipsList.innerHTML = '';
        
        if (this.clips.size === 0) {
            // Show help text when no clips
            const helpText = document.createElement('div');
            helpText.className = 'clip-help-text';
            helpText.textContent = 'Load tracks in the DJ Mixer tab to create clips';
            this.clipsList.appendChild(helpText);
        } else {
            // Add all clips
            this.clips.forEach((clip, id) => {
                const clipElement = document.createElement('div');
                clipElement.className = 'clip-item';
                clipElement.draggable = true;
                clipElement.dataset.clipId = id;
                
                clipElement.innerHTML = `
                    <span class="clip-name">${clip.name}</span>
                    <span class="clip-duration">${this.formatDuration(clip.duration)}</span>
                `;
                
                // Drag events
                clipElement.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', id);
                    clipElement.classList.add('dragging');
                });
                
                clipElement.addEventListener('dragend', () => {
                    clipElement.classList.remove('dragging');
                });
                
                this.clipsList.appendChild(clipElement);
            });
        }
        
        // Always add "Add Track" button at the end (even when no clips)
        const addTrackBtn = document.createElement('button');
        addTrackBtn.className = 'clip-item add-track-btn';
        addTrackBtn.style.cursor = 'pointer';
        addTrackBtn.innerHTML = `<span class="clip-name">➕ Add New Track</span>`;
        addTrackBtn.addEventListener('click', () => {
            const trackNumber = this.sequencerTracks.length + 1;
            this.addSequencerTrack(`Track ${trackNumber}`);
        });
        this.clipsList.appendChild(addTrackBtn);
    }
    
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    play() {
        if (this.isPlaying) {
            console.log('⚠️ Already playing');
            return;
        }
        
        console.log('▶️ Play button clicked');
        
        // Dispatch event to ensure main audio context is initialized
        document.dispatchEvent(new CustomEvent('sequencerPlayRequested'));
        
        this.isPlaying = true;
        
        // Update activity indicator
        document.dispatchEvent(new CustomEvent('sequencerPlaying'));
        
        const secondsPerBar = (60 / this.currentBPM) * 4;
        
        // Determine playback range based on pause state first, then loop settings
        let startBar, endBar;
        if (this.isPaused && this.playheadPosition > 0) {
            // Resume from paused position (works in both loop and non-loop mode)
            startBar = this.playheadPosition;
            if (this.loopEnabled) {
                endBar = this.loopEndBar || this.numberOfBars;
            } else {
                endBar = this.numberOfBars;
            }
            console.log(`▶️ Resuming from bar ${(startBar + 1).toFixed(2)}`);
        } else if (this.loopEnabled) {
            startBar = this.loopStartBar || 0;
            endBar = this.loopEndBar || this.numberOfBars;
        } else {
            // Use playhead position as start if it's been set and we're not looping
            startBar = this.playheadPosition || 0;
            endBar = this.numberOfBars;
        }
        
        // Clear pause state when playing
        this.isPaused = false;
        
        // Store playback state for live loop updates
        this.playbackStartBar = startBar;
        this.playbackEndBar = endBar;
        
        const playbackDuration = (endBar - startBar) * secondsPerBar;
        const playbackStartOffset = startBar * secondsPerBar;
        
        // Format bar positions for display
        const formatBarPos = (barPos) => {
            const barNum = Math.floor(barPos);
            const fraction = barPos % 1;
            if (fraction < 0.01) {
                return `${barNum + 1}`;
            } else {
                return `${barNum + 1}.${((fraction * 100).toFixed(0)).padStart(2, '0')}`;
            }
        };
        
        console.log(`▶️ Playing sequencer: Bars ${formatBarPos(startBar)} to ${formatBarPos(endBar)} (${playbackDuration.toFixed(2)}s)`);
        
        // Ensure audio routing is initialized
        if (!this.outputGain) {
            this.initializeAudioRouting();
        }
        
        // Schedule all clips
        const startTime = this.audioContext.currentTime;
        
        this.sequencerTracks.forEach(track => {
            if (track.muted) return;
            
            // Check if any track is soloed
            const hasSolo = this.sequencerTracks.some(t => t.solo);
            if (hasSolo && !track.solo) return;
            
            track.clips.forEach(placedClip => {
                const clipStartTime = placedClip.barPosition * secondsPerBar;
                const clipEndTime = clipStartTime + (placedClip.sourceClip.duration || 0);
                
                // Only play clips that fall within the playback range
                if (clipStartTime >= playbackStartOffset + playbackDuration) return; // Clip starts after loop end
                if (clipEndTime <= playbackStartOffset) return; // Clip ends before loop start
                
                // Calculate when to start playing this clip
                let scheduleTime = startTime + clipStartTime - playbackStartOffset;
                let clipOffset = 0;
                
                // If clip starts before loop start, we need to offset into the clip
                if (clipStartTime < playbackStartOffset) {
                    clipOffset = playbackStartOffset - clipStartTime;
                    scheduleTime = startTime;
                }
                
                const source = this.audioContext.createBufferSource();
                source.buffer = placedClip.sourceClip.fullBuffer || placedClip.sourceClip.audioBuffer;
                
                // Get effects for this clip
                const effects = this.getClipEffects(placedClip.id);
                
                // Create effects chain for this clip
                const clipGain = this.audioContext.createGain();
                clipGain.gain.value = effects.volume;
                
                // Apply ADSR envelope
                const now = this.audioContext.currentTime;
                const startEnvelope = scheduleTime;
                const clipDuration = placedClip.sourceClip.duration || source.buffer.duration;
                
                // Store base volume for dynamic updates (before ADSR)
                const baseVolume = effects.volume;
                
                // Set initial volume to 0 for envelope
                clipGain.gain.setValueAtTime(0, startEnvelope);
                
                // Attack phase
                clipGain.gain.linearRampToValueAtTime(
                    effects.volume,
                    startEnvelope + effects.adsrAttack
                );
                
                // Decay phase to sustain level
                clipGain.gain.linearRampToValueAtTime(
                    effects.volume * effects.adsrSustain,
                    startEnvelope + effects.adsrAttack + effects.adsrDecay
                );
                
                // Hold at sustain level
                const sustainEnd = startEnvelope + clipDuration - effects.adsrRelease;
                if (sustainEnd > startEnvelope + effects.adsrAttack + effects.adsrDecay) {
                    clipGain.gain.setValueAtTime(
                        effects.volume * effects.adsrSustain,
                        sustainEnd
                    );
                }
                
                // Release phase
                clipGain.gain.linearRampToValueAtTime(
                    0,
                    startEnvelope + clipDuration
                );
                
                // Apply pitch shift via playback rate
                source.playbackRate.value = Math.pow(2, effects.pitch / 12);
                
                // Create filter
                const filter = this.audioContext.createBiquadFilter();
                filter.type = effects.filterType;
                filter.frequency.value = effects.filterFreq;
                filter.Q.value = 1.0;
                
                // Create convolver for reverb (simplified - using dry/wet mix)
                const reverbGain = this.audioContext.createGain();
                const dryGain = this.audioContext.createGain();
                reverbGain.gain.value = effects.reverb;
                dryGain.gain.value = 1 - effects.reverb;
                
                // Create delay
                const delay = this.audioContext.createDelay();
                delay.delayTime.value = effects.delayTime;
                const delayFeedback = this.audioContext.createGain();
                delayFeedback.gain.value = effects.delay * 0.5;
                const delayMix = this.audioContext.createGain();
                delayMix.gain.value = effects.delay;
                const delayDry = this.audioContext.createGain();
                delayDry.gain.value = 1 - effects.delay;
                
                // Connect effects chain:
                // source -> filter -> clipGain
                source.connect(filter);
                filter.connect(clipGain);
                
                // Split for delay wet/dry
                clipGain.connect(delayDry);
                clipGain.connect(delay);
                delay.connect(delayFeedback);
                delayFeedback.connect(delay); // feedback loop
                delay.connect(delayMix);
                
                // Merge delay paths
                const delayMerger = this.audioContext.createGain();
                delayDry.connect(delayMerger);
                delayMix.connect(delayMerger);
                
                // Connect to track's gain node, then to sequencer output
                if (track.gainNode) {
                    delayMerger.connect(track.gainNode);
                } else {
                    // Fallback to direct connection if track has no gain node
                    delayMerger.connect(this.outputGain);
                }
                
                // Store effect nodes for real-time updates
                placedClip.activeEffectNodes = {
                    source: source,
                    gainNode: clipGain,
                    filter: filter,
                    delayNode: delay,
                    delayFeedback: delayFeedback,
                    delayMix: delayMix,
                    delayDry: delayDry,
                    baseVolume: baseVolume,
                    envelopeStartTime: startEnvelope,
                    clipDuration: clipDuration
                };
                
                // If clip has start/end times (loop region), use offset and duration
                if (placedClip.sourceClip.startTime !== undefined && placedClip.sourceClip.startTime > 0) {
                    // Account for both trim and loop region start
                    const trimStart = placedClip.trimStart || 0;
                    const trimEnd = placedClip.trimEnd || 0;
                    const offset = placedClip.sourceClip.startTime + clipOffset + trimStart;
                    const duration = placedClip.sourceClip.duration - trimEnd;
                    
                    // Calculate how much of the clip to play within the loop range
                    const clipMaxDuration = Math.min(
                        duration - trimStart,
                        playbackDuration - (clipStartTime - playbackStartOffset - clipOffset)
                    );
                    
                    source.start(scheduleTime, offset, clipMaxDuration);
                } else {
                    // Account for trim points
                    const trimStart = placedClip.trimStart || 0;
                    const trimEnd = placedClip.trimEnd || 0;
                    const clipDuration = source.buffer.duration;
                    const trimmedDuration = clipDuration - trimStart - trimEnd;
                    
                    const maxDuration = playbackDuration - (clipStartTime - playbackStartOffset - clipOffset);
                    const playDuration = Math.min(trimmedDuration - clipOffset, maxDuration);
                    
                    const startOffset = trimStart + clipOffset;
                    
                    if (startOffset > 0 || playDuration < clipDuration) {
                        source.start(scheduleTime, startOffset, playDuration);
                    } else {
                        source.start(scheduleTime);
                    }
                }
                
                // Store source for stopping
                placedClip.sourceNode = source;
            });
        });
        
        // Update playhead
        this.startPlayhead(playbackDuration, startBar, endBar);
    }
    
    pause() {
        console.log('⏸️ Pause button clicked');
        this.isPlaying = false;
        this.isPaused = true;
        
        // Update activity indicator
        document.dispatchEvent(new CustomEvent('sequencerStopped'));
        
        // Stop the playhead interval but DON'T remove the playhead visual
        if (this.playheadInterval) {
            clearInterval(this.playheadInterval);
            this.playheadInterval = null;
        }
        
        // Save current playhead position by reading from the DOM
        const firstTimeline = this.sequencerTracks[0]?.element.querySelector('.track-timeline');
        const playhead = firstTimeline?.querySelector('.playhead');
        if (playhead) {
            const currentPosition = parseFloat(playhead.style.left) || 0;
            this.playheadPosition = currentPosition / this.barWidth;
            // Don't mark as manually set - this is just a pause position
            console.log(`⏸️ Paused at bar ${(this.playheadPosition + 1).toFixed(2)}`);
        }
        
        // Clear loop timeout if exists
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
        
        // Stop all playing audio sources
        this.sequencerTracks.forEach(track => {
            track.clips.forEach(clip => {
                if (clip.sourceNode) {
                    try {
                        clip.sourceNode.stop();
                    } catch (e) {
                        // Already stopped
                    }
                    clip.sourceNode = null;
                }
                // Clear active effect nodes
                if (clip.activeEffectNodes) {
                    clip.activeEffectNodes = null;
                }
            });
        });
    }
    
    stop() {
        console.log('⏹️ Stop button clicked');
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.stopPlayhead();
        
        // Update activity indicator
        document.dispatchEvent(new CustomEvent('sequencerStopped'));
        
        // Clear loop timeout if exists
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
        
        // Stop all playing sources
        this.sequencerTracks.forEach(track => {
            track.clips.forEach(clip => {
                if (clip.sourceNode) {
                    try {
                        clip.sourceNode.stop();
                    } catch (e) {
                        // Already stopped
                    }
                    clip.sourceNode = null;
                }
                // Clear active effect nodes
                if (clip.activeEffectNodes) {
                    clip.activeEffectNodes = null;
                }
            });
        });
        
        // Restore playhead to manually set position, or reset to start
        if (this.playheadManuallySet && this.playheadPosition > 0) {
            // Restore to where user manually dragged it
            const position = this.playheadPosition * this.barWidth;
            this.updatePlayheadPosition(position);
        } else {
            // Reset to beginning
            this.playheadPosition = 0;
            this.playheadManuallySet = false;
        }
        
        console.log('⏹️ Sequencer stopped');
    }
    
    startPlayhead(duration, startBar = 0, endBar = null) {
        const startTime = Date.now();
        this.playbackStartTime = startTime; // Store for live loop updates
        const secondsPerBar = (60 / this.currentBPM) * 4;
        const startPosition = startBar * this.barWidth;
        
        this.playheadInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const currentBarPosition = startBar + (elapsed / secondsPerBar);
            
            // Check if loop boundaries changed and playhead is outside new range
            if (this.loopEnabled && this.isPlaying) {
                if (currentBarPosition >= this.loopEndBar) {
                    // Reached or passed loop end - restart loop
                    this.stop();
                    setTimeout(() => this.play(), 10);
                    return;
                }
            }
            
            if (elapsed >= duration) {
                if (this.loopEnabled) {
                    // Loop back to start
                    this.stop();
                    setTimeout(() => this.play(), 10); // Small delay to prevent audio glitches
                } else {
                    this.stop();
                }
                return;
            }
            
            // Update playhead position (relative to loop start)
            const position = startPosition + (elapsed / secondsPerBar) * this.barWidth;
            this.updatePlayheadPosition(position);
        }, 16); // ~60fps
    }
    
    stopPlayhead() {
        if (this.playheadInterval) {
            clearInterval(this.playheadInterval);
            this.playheadInterval = null;
        }
        this.removePlayhead();
    }
    
    restartPlaybackWithNewLoop() {
        // Get current playhead position
        const firstTimeline = this.sequencerTracks[0]?.element.querySelector('.track-timeline');
        const playhead = firstTimeline?.querySelector('.playhead');
        let currentPosition = 0;
        if (playhead) {
            currentPosition = parseFloat(playhead.style.left) || 0;
        }
        const currentBarPosition = currentPosition / this.barWidth;
        
        // Stop current playback
        this.stop();
        
        // If current position is within new loop range, resume from there
        // Otherwise start from loop start
        if (currentBarPosition >= this.loopStartBar && currentBarPosition < this.loopEndBar) {
            this.playheadPosition = currentBarPosition;
            this.isPaused = true; // Trick to make it resume from current position
        } else {
            this.playheadPosition = 0;
            this.isPaused = false;
        }
        
        // Restart playback after brief delay
        setTimeout(() => this.play(), 50);
    }
    
    updatePlayheadPosition(position) {
        this.sequencerTracks.forEach(track => {
            const timeline = track.element.querySelector('.track-timeline');
            let playhead = timeline.querySelector('.playhead');
            
            if (!playhead) {
                playhead = document.createElement('div');
                playhead.className = 'playhead';
                timeline.appendChild(playhead);
                
                // Make playhead draggable
                this.makePlayheadDraggable(playhead, timeline);
            }
            
            playhead.style.left = `${position}px`;
        });
    }
    
    removePlayhead() {
        this.sequencerTracks.forEach(track => {
            const timeline = track.element.querySelector('.track-timeline');
            const playhead = timeline.querySelector('.playhead');
            if (playhead) {
                playhead.remove();
            }
        });
    }
    
    restartPlaybackWithNewLoop() {
        // Get current playhead position
        const firstTimeline = this.sequencerTracks[0]?.element.querySelector('.track-timeline');
        const playhead = firstTimeline?.querySelector('.playhead');
        let currentPosition = 0;
        if (playhead) {
            currentPosition = parseFloat(playhead.style.left) || 0;
        }
        const currentBarPosition = currentPosition / this.barWidth;
        
        // Stop current playback
        this.stop();
        
        // If current position is within new loop range, resume from there
        // Otherwise start from loop start
        if (currentBarPosition >= this.loopStartBar && currentBarPosition < this.loopEndBar) {
            this.playheadPosition = currentBarPosition;
            this.isPaused = true; // Trick to make it resume from current position
        } else {
            this.playheadPosition = 0;
            this.isPaused = false;
        }
        
        // Restart playback after brief delay
        setTimeout(() => this.play(), 50);
    }
    
    makePlayheadDraggable(playhead, timeline) {
        let isDragging = false;
        let startX = 0;
        
        playhead.addEventListener('mousedown', (e) => {
            // Only allow dragging when not playing
            if (this.isPlaying) return;
            
            isDragging = true;
            startX = e.clientX;
            playhead.style.opacity = '0.6';
            e.preventDefault();
            e.stopPropagation();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = timeline.getBoundingClientRect();
            const timelineContainer = document.querySelector('.sequencer-timeline-container');
            const scrollLeft = timelineContainer ? timelineContainer.scrollLeft : 0;
            
            // Calculate position in pixels (account for scroll)
            let position = e.clientX - rect.left + scrollLeft;
            
            // Constrain to timeline bounds
            const maxPosition = this.numberOfBars * this.barWidth;
            position = Math.max(0, Math.min(position, maxPosition));
            
            // Update all playheads
            this.sequencerTracks.forEach(track => {
                const tl = track.element.querySelector('.track-timeline');
                const ph = tl.querySelector('.playhead');
                if (ph) {
                    ph.style.left = `${position}px`;
                }
            });
            
            // Store position in bars
            this.playheadPosition = position / this.barWidth;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                playhead.style.opacity = '1';
                this.playheadManuallySet = true; // Mark as manually set
                console.log(`🎯 Playhead set to bar ${(this.playheadPosition + 1).toFixed(2)}`);
            }
        });
    }
    
    toggleTimelineLoop() {
        this.loopEnabled = !this.loopEnabled;
        
        if (this.loopEnabled) {
            // Show loop range controls
            if (this.loopRangeControl) {
                this.loopRangeControl.style.display = 'block';
            }
            // Set default loop range (entire timeline)
            if (this.loopEndBar === null) {
                this.loopEndBar = this.numberOfBars - 1; // 0-indexed
                if (this.loopEndBarInput) {
                    this.loopEndBarInput.value = this.numberOfBars; // Display 1-indexed
                }
            }
            if (this.loopToggleBtn) {
                this.loopToggleBtn.style.background = 'linear-gradient(135deg, rgba(100, 255, 100, 0.6), rgba(50, 200, 50, 0.6))';
                this.loopToggleBtn.style.borderColor = 'rgba(100, 255, 100, 0.8)';
            }
            // Show visual loop markers
            this.updateTimelineLoopMarkers();
            console.log(`🔁 Timeline loop enabled: Bar ${this.loopStartBar + 1} to ${this.loopEndBar + 1}`);
        } else {
            // Hide loop range controls
            if (this.loopRangeControl) {
                this.loopRangeControl.style.display = 'none';
            }
            if (this.loopToggleBtn) {
                this.loopToggleBtn.style.background = '';
                this.loopToggleBtn.style.borderColor = '';
            }
            // Hide visual loop markers
            this.hideTimelineLoopMarkers();
            console.log('🔁 Timeline loop disabled');
        }
    }
    
    updateTimelineLoopMarkers() {
        if (!this.loopEnabled) return;
        
        const startMarker = document.getElementById('timelineLoopMarkerStart');
        const endMarker = document.getElementById('timelineLoopMarkerEnd');
        const loopRegion = document.getElementById('timelineLoopRegion');
        
        if (!startMarker || !endMarker || !loopRegion) return;
        
        // Setup drag functionality on first call
        if (!startMarker.dataset.dragSetup) {
            this.makeTimelineLoopMarkerDraggable(startMarker, 'start');
            startMarker.dataset.dragSetup = 'true';
        }
        if (!endMarker.dataset.dragSetup) {
            this.makeTimelineLoopMarkerDraggable(endMarker, 'end');
            endMarker.dataset.dragSetup = 'true';
        }
        
        // Calculate pixel positions
        const startPos = this.loopStartBar * this.barWidth;
        const endPos = this.loopEndBar * this.barWidth;
        
        // Position markers
        startMarker.style.left = `${startPos}px`;
        startMarker.style.display = 'block';
        
        endMarker.style.left = `${endPos}px`;
        endMarker.style.display = 'block';
        
        // Position loop region
        loopRegion.style.left = `${startPos}px`;
        loopRegion.style.width = `${endPos - startPos}px`;
        loopRegion.style.display = 'block';
        
        console.log(`📍 Updated timeline loop markers: ${startPos}px to ${endPos}px`);
    }
    
    makeTimelineLoopMarkerDraggable(marker, type) {
        let isDragging = false;
        let startX = 0;
        let startLeft = 0;
        
        marker.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startLeft = parseInt(marker.style.left) || 0;
            marker.style.cursor = 'grabbing';
            e.preventDefault();
            e.stopPropagation(); // Prevent timeline panning
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            let newLeft = startLeft + deltaX;
            
            // Constrain within bounds (no snapping - free positioning)
            if (type === 'start') {
                // Get end marker position in pixels
                const endMarker = document.getElementById('timelineLoopMarkerEnd');
                const endPos = parseInt(endMarker.style.left) || (this.loopEndBar * this.barWidth);
                const minGap = this.barWidth * 0.1; // Minimum 10% of a bar gap
                
                const maxPos = endPos - minGap;
                newLeft = Math.max(0, Math.min(newLeft, maxPos));
                
                // Update loop start bar (as fractional bar position)
                const newBar = newLeft / this.barWidth;
                this.loopStartBar = newBar;
                
                // Update input to show nearest bar
                if (this.loopStartBarInput) {
                    this.loopStartBarInput.value = Math.round(newBar) + 1; // Convert to 1-indexed for display
                }
                
            } else { // end
                // Get start marker position in pixels
                const startMarker = document.getElementById('timelineLoopMarkerStart');
                const startPos = parseInt(startMarker.style.left) || (this.loopStartBar * this.barWidth);
                const minGap = this.barWidth * 0.1; // Minimum 10% of a bar gap
                
                const minPos = startPos + minGap;
                const maxPos = this.numberOfBars * this.barWidth;
                newLeft = Math.max(minPos, Math.min(newLeft, maxPos));
                
                // Update loop end bar (as fractional bar position)
                const newBar = newLeft / this.barWidth;
                this.loopEndBar = newBar;
                
                // Update input to show nearest bar (1-indexed for display)
                if (this.loopEndBarInput) {
                    this.loopEndBarInput.value = Math.round(newBar) + 1; // Convert to 1-indexed
                }
            }
            
            // Update marker position immediately for smooth dragging
            marker.style.left = `${newLeft}px`;
            
            // Update loop region
            this.updateTimelineLoopRegion();
        });
        
        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                marker.style.cursor = 'ew-resize';
                
                // Log the precise position
                const barPos = type === 'start' ? this.loopStartBar : this.loopEndBar;
                const barNum = Math.floor(barPos);
                const fraction = ((barPos % 1) * 100).toFixed(0);
                console.log(`🔄 Dragged loop ${type} to bar ${barNum + 1}.${fraction}% (${barPos.toFixed(3)} bars)`);
                
                // Final update of markers
                this.updateTimelineLoopMarkers();
                
                // If playing in loop mode, restart playback with new loop boundaries
                if (this.isPlaying && this.loopEnabled) {
                    console.log('🔄 Loop marker dragged during playback - restarting...');
                    this.restartPlaybackWithNewLoop();
                }
            }
        });
    }
    
    updateTimelineLoopRegion() {
        const loopRegion = document.getElementById('timelineLoopRegion');
        if (!loopRegion) return;
        
        const startPos = this.loopStartBar * this.barWidth;
        const endPos = this.loopEndBar * this.barWidth;
        
        loopRegion.style.left = `${startPos}px`;
        loopRegion.style.width = `${endPos - startPos}px`;
    }
    
    hideTimelineLoopMarkers() {
        const startMarker = document.getElementById('timelineLoopMarkerStart');
        const endMarker = document.getElementById('timelineLoopMarkerEnd');
        const loopRegion = document.getElementById('timelineLoopRegion');
        
        if (startMarker) startMarker.style.display = 'none';
        if (endMarker) endMarker.style.display = 'none';
        if (loopRegion) loopRegion.style.display = 'none';
    }
    
    toggleFullscreen() {
        const container = document.getElementById('sequencerContainer');
        const fullscreenBtn = document.getElementById('sequencerFullscreenBtn');
        
        if (!container) return;
        
        if (container.classList.contains('fullscreen')) {
            container.classList.remove('fullscreen');
            document.body.classList.remove('sequencer-fullscreen');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '⛶ Fullscreen';
            }
            console.log('🖥️ Exited fullscreen mode');
        } else {
            container.classList.add('fullscreen');
            document.body.classList.add('sequencer-fullscreen');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '⛶ Exit Fullscreen';
            }
            console.log('🖥️ Entered fullscreen mode');
        }
    }
    
    toggleEffectsPanel() {
        const effectsPanel = document.getElementById('sequencerEffectsPanel');
        const toggleBtn = document.getElementById('toggleEffectsPanelBtn');
        
        if (!effectsPanel) return;
        
        this.effectsPanelVisible = !this.effectsPanelVisible;
        
        if (this.effectsPanelVisible) {
            // Only show if there's a selected clip
            const selectedClip = document.querySelector('.timeline-clip.selected');
            if (selectedClip) {
                effectsPanel.style.display = 'block';
            }
            if (toggleBtn) {
                toggleBtn.innerHTML = '🎛️ Hide Effects';
                toggleBtn.classList.add('active');
            }
            console.log('🎛️ Effects panel shown');
        } else {
            effectsPanel.style.display = 'none';
            if (toggleBtn) {
                toggleBtn.innerHTML = '🎛️ Show Effects';
                toggleBtn.classList.remove('active');
            }
            console.log('🎛️ Effects panel hidden');
        }
    }
    
    // Get the routing gain node for master output connection
    getRoutingGain() {
        if (!this.routingGain && this.audioContext) {
            this.initializeAudioRouting();
        }
        return this.routingGain;
    }
    
    // Get the output gain node for sampler/theremin connection
    getOutputGain() {
        if (!this.outputGain && this.audioContext) {
            this.initializeAudioRouting();
        }
        return this.outputGain;
    }
    
    // Clip Effects Methods
    selectClip(clipElement, clipData) {
        // Deselect previous clip
        if (this.selectedClip) {
            this.selectedClip.element.classList.remove('selected');
        }
        
        // Select new clip
        this.selectedClip = {
            element: clipElement,
            data: clipData
        };
        
        clipElement.classList.add('selected');
        
        // Initialize effects for this clip if not already done
        if (!this.clipEffects.has(clipData.id)) {
            this.clipEffects.set(clipData.id, {
                volume: 1.0,
                pitch: 0,
                filterFreq: 20000,
                filterType: 'lowpass',
                adsrAttack: 0.01,
                adsrDecay: 0.1,
                adsrSustain: 0.8,
                adsrRelease: 0.3,
                reverb: 0,
                delay: 0,
                delayTime: 0.3
            });
        }
        
        // Show effects panel
        this.showEffectsPanel(clipData);
    }
    
    showEffectsPanel(clipData) {
        if (!this.effectsPanel) return;
        
        // Update clip name
        if (this.selectedClipName) {
            this.selectedClipName.textContent = clipData.name || 'Clip';
        }
        
        // Get current effects for this clip
        const effects = this.clipEffects.get(clipData.id);
        
        // Update all sliders to reflect current values
        const volumeSlider = document.getElementById('clipVolumeSlider');
        const volumeValue = document.getElementById('clipVolumeValue');
        if (volumeSlider && effects) {
            volumeSlider.value = effects.volume * 100;
            volumeValue.textContent = `${Math.round(effects.volume * 100)}%`;
        }
        
        const pitchSlider = document.getElementById('clipPitchSlider');
        const pitchValue = document.getElementById('clipPitchValue');
        if (pitchSlider && effects) {
            pitchSlider.value = effects.pitch;
            pitchValue.textContent = effects.pitch > 0 ? `+${effects.pitch}` : effects.pitch;
        }
        
        const filterSlider = document.getElementById('clipFilterSlider');
        const filterValue = document.getElementById('clipFilterValue');
        const filterType = document.getElementById('clipFilterType');
        if (filterSlider && effects) {
            filterSlider.value = effects.filterFreq;
            const freq = effects.filterFreq;
            filterValue.textContent = freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq}Hz`;
            if (filterType) filterType.value = effects.filterType;
        }
        
        const reverbSlider = document.getElementById('clipReverbSlider');
        const reverbValue = document.getElementById('clipReverbValue');
        if (reverbSlider && effects) {
            reverbSlider.value = effects.reverb * 100;
            reverbValue.textContent = `${Math.round(effects.reverb * 100)}%`;
        }
        
        const delaySlider = document.getElementById('clipDelaySlider');
        const delayValue = document.getElementById('clipDelayValue');
        if (delaySlider && effects) {
            delaySlider.value = effects.delay * 100;
            delayValue.textContent = `${Math.round(effects.delay * 100)}%`;
        }
        
        const delayTimeSlider = document.getElementById('clipDelayTimeSlider');
        const delayTimeValue = document.getElementById('clipDelayTimeValue');
        if (delayTimeSlider && effects) {
            delayTimeSlider.value = effects.delayTime * 1000;
            delayTimeValue.textContent = `${Math.round(effects.delayTime * 1000)}ms`;
        }
        
        // ADSR values
        const adsrAttackSlider = document.getElementById('clipAdsrAttackSlider');
        const adsrAttackValue = document.getElementById('clipAdsrAttackValue');
        if (adsrAttackSlider && effects) {
            adsrAttackSlider.value = effects.adsrAttack * 1000;
            adsrAttackValue.textContent = `${Math.round(effects.adsrAttack * 1000)}ms`;
        }
        
        const adsrDecaySlider = document.getElementById('clipAdsrDecaySlider');
        const adsrDecayValue = document.getElementById('clipAdsrDecayValue');
        if (adsrDecaySlider && effects) {
            adsrDecaySlider.value = effects.adsrDecay * 1000;
            adsrDecayValue.textContent = `${Math.round(effects.adsrDecay * 1000)}ms`;
        }
        
        const adsrSustainSlider = document.getElementById('clipAdsrSustainSlider');
        const adsrSustainValue = document.getElementById('clipAdsrSustainValue');
        if (adsrSustainSlider && effects) {
            adsrSustainSlider.value = effects.adsrSustain * 100;
            adsrSustainValue.textContent = `${Math.round(effects.adsrSustain * 100)}%`;
        }
        
        const adsrReleaseSlider = document.getElementById('clipAdsrReleaseSlider');
        const adsrReleaseValue = document.getElementById('clipAdsrReleaseValue');
        if (adsrReleaseSlider && effects) {
            adsrReleaseSlider.value = effects.adsrRelease * 1000;
            adsrReleaseValue.textContent = `${Math.round(effects.adsrRelease * 1000)}ms`;
        }
        
        // Show panel and update workspace layout
        // Only show if effects panel is not manually hidden
        if (this.effectsPanelVisible) {
            this.effectsPanel.style.display = 'block';
            const workspace = document.querySelector('.sequencer-workspace');
            if (workspace) {
                workspace.classList.add('effects-visible');
            }
            
            // Update toggle button state
            const toggleBtn = document.getElementById('toggleEffectsPanelBtn');
            if (toggleBtn) {
                toggleBtn.innerHTML = '🎛️ Hide Effects';
                toggleBtn.classList.add('active');
            }
        }
    }
    
    closeEffectsPanel() {
        if (this.effectsPanel) {
            this.effectsPanel.style.display = 'none';
        }
        
        // Remove selection highlight
        if (this.selectedClip) {
            this.selectedClip.element.classList.remove('selected');
            this.selectedClip = null;
        }
        
        const workspace = document.querySelector('.sequencer-workspace');
        if (workspace) {
            workspace.classList.remove('effects-visible');
        }
        
        // Update toggle button state
        const toggleBtn = document.getElementById('toggleEffectsPanelBtn');
        if (toggleBtn) {
            toggleBtn.innerHTML = '🎛️ Show Effects';
            toggleBtn.classList.remove('active');
        }
    }
    
    deleteSelectedClip() {
        if (!this.selectedClip) {
            console.warn('⚠️ No clip selected to delete');
            return;
        }
        
        const clipData = this.selectedClip.data;
        const clipElement = this.selectedClip.element;
        
        // Confirm deletion
        if (!confirm(`Delete clip "${clipData.name}"?`)) {
            return;
        }
        
        // Find the track that contains this clip
        const trackElement = clipElement.closest('.track-lane');
        const trackIndex = Array.from(document.querySelectorAll('.track-lane')).indexOf(trackElement);
        
        if (trackIndex !== -1 && this.sequencerTracks[trackIndex]) {
            const track = this.sequencerTracks[trackIndex];
            
            // Remove clip from track's clips array
            const clipIndex = track.clips.findIndex(c => c.id === clipData.id);
            if (clipIndex !== -1) {
                track.clips.splice(clipIndex, 1);
                console.log(`🗑️ Removed clip "${clipData.name}" from track ${trackIndex + 1}`);
            }
            
            // Remove clip element from DOM
            clipElement.remove();
            
            // Remove clip effects from map
            if (this.clipEffects.has(clipData.id)) {
                this.clipEffects.delete(clipData.id);
            }
            
            // Close effects panel
            this.closeEffectsPanel();
            
            console.log(`✅ Deleted clip: ${clipData.name}`);
        } else {
            console.error('❌ Could not find track for clip');
        }
    }
    
    updateClipEffect(effectName, value) {
        if (!this.selectedClip) return;
        
        const clipId = this.selectedClip.data.id;
        const effects = this.clipEffects.get(clipId);
        
        if (effects) {
            effects[effectName] = value;
            console.log(`🎛️ Updated ${effectName} for clip ${clipId}:`, value);
            
            // Apply effect changes to currently playing clips in real-time
            if (this.isPlaying) {
                this.applyEffectToPlayingClips(clipId, effectName, value, effects);
            }
        }
    }
    
    applyEffectToPlayingClips(clipId, effectName, value, allEffects) {
        // Find all instances of this clip across all tracks
        this.sequencerTracks.forEach(track => {
            track.clips.forEach(placedClip => {
                // Check if this is the same source clip and if it has active effect nodes
                if (placedClip.id === clipId && placedClip.activeEffectNodes) {
                    const nodes = placedClip.activeEffectNodes;
                    const now = this.audioContext.currentTime;
                    
                    try {
                        switch(effectName) {
                            case 'volume':
                                // Update gain while preserving ADSR envelope shape
                                // Cancel scheduled values and recalculate envelope with new volume
                                nodes.gainNode.gain.cancelScheduledValues(now);
                                
                                // Calculate current position in ADSR envelope
                                const timeSinceStart = now - nodes.envelopeStartTime;
                                const attackTime = allEffects.adsrAttack;
                                const decayTime = allEffects.adsrDecay;
                                const releaseStart = nodes.clipDuration - allEffects.adsrRelease;
                                
                                if (timeSinceStart < attackTime) {
                                    // Still in attack phase
                                    const attackProgress = timeSinceStart / attackTime;
                                    nodes.gainNode.gain.setValueAtTime(value * attackProgress, now);
                                    nodes.gainNode.gain.linearRampToValueAtTime(value, nodes.envelopeStartTime + attackTime);
                                    nodes.gainNode.gain.linearRampToValueAtTime(value * allEffects.adsrSustain, nodes.envelopeStartTime + attackTime + decayTime);
                                } else if (timeSinceStart < attackTime + decayTime) {
                                    // In decay phase
                                    const decayProgress = (timeSinceStart - attackTime) / decayTime;
                                    const currentLevel = value - (value - value * allEffects.adsrSustain) * decayProgress;
                                    nodes.gainNode.gain.setValueAtTime(currentLevel, now);
                                    nodes.gainNode.gain.linearRampToValueAtTime(value * allEffects.adsrSustain, nodes.envelopeStartTime + attackTime + decayTime);
                                } else if (timeSinceStart < releaseStart) {
                                    // In sustain phase
                                    nodes.gainNode.gain.setValueAtTime(value * allEffects.adsrSustain, now);
                                } else {
                                    // In release phase
                                    const releaseProgress = (timeSinceStart - releaseStart) / allEffects.adsrRelease;
                                    const currentLevel = value * allEffects.adsrSustain * (1 - releaseProgress);
                                    nodes.gainNode.gain.setValueAtTime(currentLevel, now);
                                }
                                
                                // Schedule release
                                const sustainEndTime = nodes.envelopeStartTime + releaseStart;
                                if (sustainEndTime > now) {
                                    nodes.gainNode.gain.setValueAtTime(value * allEffects.adsrSustain, sustainEndTime);
                                    nodes.gainNode.gain.linearRampToValueAtTime(0, nodes.envelopeStartTime + nodes.clipDuration);
                                }
                                
                                nodes.baseVolume = value;
                                break;
                                
                            case 'pitch':
                                // Update playback rate
                                nodes.source.playbackRate.setValueAtTime(Math.pow(2, value / 12), now);
                                break;
                                
                            case 'filterFreq':
                                // Update filter frequency
                                nodes.filter.frequency.setValueAtTime(value, now);
                                break;
                                
                            case 'filterType':
                                // Update filter type
                                nodes.filter.type = value;
                                break;
                                
                            case 'delay':
                                // Update delay wet/dry mix
                                nodes.delayMix.gain.setValueAtTime(value, now);
                                nodes.delayDry.gain.setValueAtTime(1 - value, now);
                                nodes.delayFeedback.gain.setValueAtTime(value * 0.5, now);
                                break;
                                
                            case 'delayTime':
                                // Update delay time
                                nodes.delayNode.delayTime.setValueAtTime(value, now);
                                break;
                                
                            case 'adsrAttack':
                            case 'adsrDecay':
                            case 'adsrSustain':
                            case 'adsrRelease':
                                // ADSR changes require recalculating the entire envelope
                                // This is complex during playback, so we'll apply it on next play
                                console.log(`⚠️ ADSR parameter ${effectName} will apply on next playback`);
                                break;
                                
                            case 'reverb':
                                // Note: Reverb implementation would need more complex setup for real-time changes
                                console.log(`⚠️ Reverb changes will apply on next playback`);
                                break;
                        }
                        
                        console.log(`🔄 Applied ${effectName}=${value} to playing clip ${clipId}`);
                    } catch (error) {
                        console.warn(`Failed to apply ${effectName} to playing clip:`, error);
                    }
                }
            });
        });
    }
    
    resetClipEffects() {
        if (!this.selectedClip) return;
        
        const clipId = this.selectedClip.data.id;
        
        // Reset to default values
        this.clipEffects.set(clipId, {
            volume: 1.0,
            pitch: 0,
            filterFreq: 20000,
            filterType: 'lowpass',
            adsrAttack: 0.01,
            adsrDecay: 0.1,
            adsrSustain: 0.8,
            adsrRelease: 0.3,
            reverb: 0,
            delay: 0,
            delayTime: 0.3
        });
        
        // Refresh the panel to show reset values
        this.showEffectsPanel(this.selectedClip.data);
        
        console.log('🔄 Reset all effects for clip', clipId);
    }
    
    getClipEffects(clipId) {
        return this.clipEffects.get(clipId) || {
            volume: 1.0,
            pitch: 0,
            filterFreq: 20000,
            filterType: 'lowpass',
            adsrAttack: 0.01,
            adsrDecay: 0.1,
            adsrSustain: 0.8,
            adsrRelease: 0.3,
            reverb: 0,
            delay: 0,
            delayTime: 0.3
        };
    }
    
    // Recording Methods
    startRecording() {
        console.log('🔴 startRecording() called - NEW VERSION with 300ms delay');
        console.log('🔴 Sequencer tracks:', this.sequencerTracks.length);
        console.log('🔴 Total clips:', this.sequencerTracks.reduce((sum, t) => sum + (t.clips?.length || 0), 0));
        
        if (!this.outputGain) {
            alert('Sequencer audio not initialized. Please load some clips first.');
            return;
        }
        
        // Ensure audio context is running
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('✅ Audio context resumed for recording');
            });
        }
        
        // Auto-start sequencer playback FIRST
        // This ensures the audio context is initialized before we create the MediaRecorder
        if (!this.isPlaying) {
            console.log('🎵 Auto-starting sequencer playback for recording');
            this.play();
        }
        
        // Wait for audio context initialization to complete before creating MediaRecorder
        // The sequencerPlayRequested event triggers audio context recreation
        setTimeout(() => {
            this._setupMediaRecorder();
        }, 150); // Wait for audio context to be recreated and routing established
    }
    
    _setupMediaRecorder() {
        try {
            // NOW create MediaStreamDestination with the correct audio context
            const dest = this.audioContext.createMediaStreamDestination();
            
            // Connect sequencer output to the destination
            this.outputGain.connect(dest);
            
            // Store destination for cleanup
            this.recordingDestination = dest;
            
            console.log('🔗 Sequencer output connected to recording destination');
            console.log('📊 Stream tracks:', dest.stream.getTracks().length);
            console.log('📊 Stream active:', dest.stream.active);
            console.log('📊 AudioContext state:', this.audioContext.state);
            console.log('📊 AudioContext time:', this.audioContext.currentTime.toFixed(3));
            
            // Create MediaRecorder with explicit audio codec
            // Try to use Opus codec in WebM container for better compatibility
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                // Fallback to default WebM audio
                mimeType = 'audio/webm';
                console.warn('⚠️ Opus codec not supported, using default WebM audio');
            }
            
            this.mediaRecorder = new MediaRecorder(dest.stream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000 // 128 kbps for good quality
            });
            this.recordedChunks = [];
            
            console.log(`🎙️ Recording with MIME type: ${mimeType}`);
            
            this.mediaRecorder.ondataavailable = (e) => {
                console.log('📦 ondataavailable fired, data size:', e.data.size);
                if (e.data.size > 0) {
                    console.log(`📦 Recorded chunk: ${e.data.size} bytes`);
                    this.recordedChunks.push(e.data);
                } else {
                    console.warn('⚠️ Received empty data chunk');
                }
            };
            
            this.mediaRecorder.onstop = () => {
                console.log(`📦 Total chunks: ${this.recordedChunks.length}`);
                const totalSize = this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
                console.log(`📦 Total size: ${totalSize} bytes`);
                
                // Use the same MIME type for the blob
                this.recordedBlob = new Blob(this.recordedChunks, { type: mimeType });
                console.log(`💾 Created blob: ${this.recordedBlob.size} bytes`);
                
                this.showRecordedAudio();
                
                // Disconnect recording
                if (this.outputGain && this.recordingDestination) {
                    try {
                        this.outputGain.disconnect(this.recordingDestination);
                        console.log('🔌 Disconnected recording destination');
                    } catch (e) {
                        // Already disconnected
                    }
                }
            };
            
            this.mediaRecorder.onerror = (e) => {
                console.error('❌ MediaRecorder error:', e);
            };
            
            // Critical: Wait for audio to actually start flowing through the stream
            // The sequencer schedules clips to play at audioContext.currentTime + offset
            // We need to wait until the scheduled time arrives and audio starts
            const waitForAudio = () => {
                // Check if we have any scheduled sources playing
                const hasActiveSources = this.sequencerTracks.some(track => 
                    track.clips && track.clips.length > 0
                );
                
                console.log('🔴 Checking for clips to record...');
                console.log('🔴 Has active sources:', hasActiveSources);
                console.log('🔴 Tracks with clips:', this.sequencerTracks.filter(t => t.clips?.length > 0).length);
                
                if (!hasActiveSources) {
                    console.warn('⚠️ No clips to record - sequencer is empty');
                    this.stopRecording();
                    return;
                }
                
                console.log('🔴 Waiting 500ms before starting MediaRecorder...');
                
                // Start recording after a delay to let the first scheduled clips begin
                // 500ms is conservative to ensure audio is definitely flowing
                setTimeout(() => {
                    console.log('🔴 500ms elapsed, starting MediaRecorder now...');
                    
                    if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
                        // Don't use timeslice - let it collect until stop
                        this.mediaRecorder.start();
                        this.recordingStartTime = Date.now();
                        
                        console.log('🎙️ MediaRecorder started (state:', this.mediaRecorder.state, ')');
                        console.log('🎙️ AudioContext time:', this.audioContext.currentTime.toFixed(3));
                        console.log('🎙️ Sequencer playing:', this.isPlaying);
                        console.log('🎙️ Stream active:', this.recordingDestination?.stream.active);
                        console.log('🎙️ Stream tracks:', this.recordingDestination?.stream.getTracks().length);
                    } else {
                        console.error('❌ MediaRecorder not in inactive state:', this.mediaRecorder?.state);
                    }
                }, 500); // 500ms delay - more conservative
            };
            
            waitForAudio();
            
            // Update UI
            if (this.recordingSection) {
                this.recordingSection.style.display = 'block';
            }
            if (this.recordBtn) {
                this.recordBtn.disabled = true;
            }
            if (this.stopRecordBtn) {
                this.stopRecordBtn.disabled = false;
            }
            
            // Start recording timer
            this.recordingTimerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                if (this.recordingTime) {
                    this.recordingTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            }, 1000);
            
            // If not in loop mode, auto-stop recording when playback ends
            if (!this.loopEnabled) {
                const secondsPerBar = (60 / this.currentBPM) * 4;
                const duration = this.numberOfBars * secondsPerBar;
                const recordingDuration = duration * 1000; // Convert to milliseconds
                
                this.recordingAutoStopTimeout = setTimeout(() => {
                    console.log('🎙️ Auto-stopping recording at end of timeline');
                    this.stopRecording();
                }, recordingDuration + 400); // Add 400ms buffer (300ms for recording start + 100ms for safety)
                
                console.log(`🎙️ Recording will auto-stop after ${duration.toFixed(1)} seconds (${this.numberOfBars} bars)`);
            } else {
                console.log('🎙️ Loop mode enabled - recording will continue until manually stopped');
            }
            
            console.log('🎙️ Started recording sequencer output');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Failed to start recording: ' + error.message);
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            
            // Stop timer
            if (this.recordingTimerInterval) {
                clearInterval(this.recordingTimerInterval);
                this.recordingTimerInterval = null;
            }
            
            // Clear auto-stop timeout
            if (this.recordingAutoStopTimeout) {
                clearTimeout(this.recordingAutoStopTimeout);
                this.recordingAutoStopTimeout = null;
            }
            
            // Update UI - DON'T hide the recording section, just update controls
            // The section needs to stay visible to show the recorded audio
            
            // Disable stop button (re-enabled on next record)
            if (this.stopRecordBtn) {
                this.stopRecordBtn.disabled = true;
            }
            
            // Re-enable record button
            if (this.recordBtn) {
                this.recordBtn.disabled = false;
            }
            
            console.log('⏹️ Stopped recording sequencer output');
        }
    }
    
    async showRecordedAudio() {
        console.log('🎵 Showing recorded audio...');
        
        const audioElement = document.getElementById('sequencerRecordedAudio');
        const waveformCanvas = document.getElementById('sequencerRecordingWaveform');
        
        if (audioElement && this.recordedBlob) {
            console.log(`🎵 Setting up audio playback (blob size: ${this.recordedBlob.size} bytes)`);
            
            const url = URL.createObjectURL(this.recordedBlob);
            audioElement.src = url;
            
            // Setup A-B loop functionality
            audioElement.addEventListener('timeupdate', () => {
                if (this.recordingLoopStart !== null && this.recordingLoopEnd !== null) {
                    if (audioElement.currentTime >= this.recordingLoopEnd) {
                        audioElement.currentTime = this.recordingLoopStart;
                    }
                    if (audioElement.currentTime < this.recordingLoopStart) {
                        audioElement.currentTime = this.recordingLoopStart;
                    }
                }
            });
            
            // Show export controls
            if (this.exportGroup) {
                this.exportGroup.style.display = 'flex';
                console.log('✅ Export controls shown');
            } else {
                console.warn('⚠️ Export group element not found');
            }
            
            const waveformContainer = audioElement.parentElement;
            if (waveformContainer) {
                waveformContainer.style.display = 'block';
                console.log('✅ Waveform container shown');
            } else {
                console.warn('⚠️ Waveform container not found');
            }
            
            // Decode audio for waveform visualization
            try {
                const arrayBuffer = await this.recordedBlob.arrayBuffer();
                const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                this.recordedAudioBuffer = await tempContext.decodeAudioData(arrayBuffer);
                tempContext.close();
                
                // Draw proper waveform
                if (waveformCanvas) {
                    this.drawRecordedWaveform(waveformCanvas);
                }
                
                // Setup loop marker clicking
                this.setupRecordingWaveformClick(waveformCanvas);
                
                // Enable loop button
                if (this.sequencerLoopBtn) {
                    this.sequencerLoopBtn.disabled = false;
                }
                
            } catch (error) {
                console.error('Error decoding recorded audio:', error);
                // Fall back to simple placeholder
                if (waveformCanvas) {
                    this.drawRecordedWaveformPlaceholder(waveformCanvas);
                }
            }
        }
    }
    
    drawRecordedWaveform(canvas) {
        if (!this.recordedAudioBuffer) {
            this.drawRecordedWaveformPlaceholder(canvas);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw waveform
        const data = this.recordedAudioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
        ctx.lineWidth = 1;
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
    
    drawRecordedWaveformPlaceholder(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Recorded Sequencer Output', width / 2, height / 2 - 20);
    }
    
    async downloadRecording() {
        if (!this.recordedBlob) {
            alert('No recording available');
            return;
        }
        
        const formatSelect = document.getElementById('sequencerExportFormat');
        const format = formatSelect ? formatSelect.value : 'webm';
        
        try {
            let blob, extension, filename;
            
            if (format === 'webm') {
                blob = this.recordedBlob;
                extension = 'webm';
            } else if (format === 'wav') {
                const arrayBuffer = await this.recordedBlob.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                const wav = this.audioBufferToWav(audioBuffer);
                blob = new Blob([wav], { type: 'audio/wav' });
                extension = 'wav';
            } else if (format === 'mp3') {
                // Check if lamejs is available
                if (typeof lamejs === 'undefined') {
                    alert('MP3 encoder not loaded. Please use WAV or WebM format.');
                    return;
                }
                const arrayBuffer = await this.recordedBlob.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                blob = this.audioBufferToMp3(audioBuffer);
                extension = 'mp3';
            } else {
                alert(`Unsupported format: ${format}`);
                return;
            }
            
            filename = `sequencer-recording-${Date.now()}.${extension}`;
            
            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            console.log(`💾 Downloaded sequencer recording as ${extension.toUpperCase()}`);
        } catch (error) {
            console.error('Error downloading recording:', error);
            alert('Error downloading recording. Please try again.');
        }
    }
    
    // Convert AudioBuffer to WAV format
    audioBufferToWav(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        
        const data = [];
        for (let i = 0; i < numChannels; i++) {
            data.push(audioBuffer.getChannelData(i));
        }
        
        const length = audioBuffer.length * numChannels * bytesPerSample;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        let offset = 0;
        writeString(offset, 'RIFF'); offset += 4;
        view.setUint32(offset, 36 + length, true); offset += 4;
        writeString(offset, 'WAVE'); offset += 4;
        writeString(offset, 'fmt '); offset += 4;
        view.setUint32(offset, 16, true); offset += 4;
        view.setUint16(offset, format, true); offset += 2;
        view.setUint16(offset, numChannels, true); offset += 2;
        view.setUint32(offset, sampleRate, true); offset += 4;
        view.setUint32(offset, sampleRate * blockAlign, true); offset += 4;
        view.setUint16(offset, blockAlign, true); offset += 2;
        view.setUint16(offset, bitDepth, true); offset += 2;
        writeString(offset, 'data'); offset += 4;
        view.setUint32(offset, length, true); offset += 4;
        
        const volume = 0.8;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                let sample = Math.max(-1, Math.min(1, data[channel][i]));
                sample = sample * volume;
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return buffer;
    }
    
    // Convert AudioBuffer to MP3 format using lamejs
    audioBufferToMp3(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const kbps = 128;
        const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);
        
        const samples = [];
        for (let i = 0; i < numChannels; i++) {
            const channelData = audioBuffer.getChannelData(i);
            const int16 = new Int16Array(channelData.length);
            for (let j = 0; j < channelData.length; j++) {
                const s = Math.max(-1, Math.min(1, channelData[j]));
                int16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            samples.push(int16);
        }
        
        const mp3Data = [];
        const sampleBlockSize = 1152;
        
        for (let i = 0; i < samples[0].length; i += sampleBlockSize) {
            const left = samples[0].subarray(i, i + sampleBlockSize);
            const right = numChannels > 1 ? samples[1].subarray(i, i + sampleBlockSize) : left;
            const mp3buf = mp3encoder.encodeBuffer(left, right);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        
        const end = mp3encoder.flush();
        if (end.length > 0) {
            mp3Data.push(end);
        }
        
        return new Blob(mp3Data, { type: 'audio/mp3' });
    }
    
    async loadToTrack(trackNumber) {
        if (!this.recordedBlob) {
            alert('No recording available');
            return;
        }
        
        try {
            // Convert blob to array buffer
            const arrayBuffer = await this.recordedBlob.arrayBuffer();
            
            // Get the MIME type from the blob
            const mimeType = this.recordedBlob.type || 'audio/webm;codecs=opus';
            
            // Trigger file load on main visualizer
            // This needs to call the loadAudioFile method in app.js
            const event = new CustomEvent('loadSequencerRecording', {
                detail: {
                    trackNumber: trackNumber,
                    arrayBuffer: arrayBuffer,
                    filename: `sequencer-recording-${Date.now()}.webm`,
                    mimeType: mimeType  // Pass MIME type to ensure proper handling
                }
            });
            
            window.dispatchEvent(event);
            
            console.log(`📥 Loading sequencer recording to Track ${trackNumber} (${mimeType})`);
            
        } catch (error) {
            console.error('Error loading to track:', error);
            alert('Failed to load recording to track: ' + error.message);
        }
    }
    
    // Recording Loop Markers
    setupRecordingWaveformClick(canvas) {
        if (!canvas) return;
        
        canvas.addEventListener('click', (e) => {
            if (!this.recordedAudioBuffer) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const time = percentage * this.recordedAudioBuffer.duration;
            
            if (this.recordingLoopMarkerCount === 0) {
                // Set start marker
                this.recordingLoopStart = time;
                this.recordingLoopMarkerCount = 1;
                this.updateRecordingLoopMarkers();
                console.log('🅰️ Set loop start at', time.toFixed(3), 'seconds');
            } else if (this.recordingLoopMarkerCount === 1) {
                // Set end marker
                this.recordingLoopEnd = time;
                this.recordingLoopMarkerCount = 2;
                
                // Ensure start is before end
                if (this.recordingLoopStart > this.recordingLoopEnd) {
                    [this.recordingLoopStart, this.recordingLoopEnd] = [this.recordingLoopEnd, this.recordingLoopStart];
                }
                
                this.updateRecordingLoopMarkers();
                console.log('🅱️ Set loop end at', time.toFixed(3), 'seconds');
                console.log('Loop region:', this.recordingLoopStart.toFixed(3), '-', this.recordingLoopEnd.toFixed(3));
            }
        });
    }
    
    updateRecordingLoopMarkers() {
        const canvas = document.getElementById('sequencerRecordingWaveform');
        const startMarker = document.getElementById('sequencerLoopMarkerStart');
        const endMarker = document.getElementById('sequencerLoopMarkerEnd');
        const loopRegion = document.getElementById('sequencerLoopRegion');
        
        if (!canvas || !this.recordedAudioBuffer) return;
        
        const duration = this.recordedAudioBuffer.duration;
        const canvasWidth = canvas.offsetWidth;
        
        if (this.recordingLoopStart !== null) {
            const startPercent = (this.recordingLoopStart / duration) * 100;
            startMarker.style.left = `${startPercent}%`;
            startMarker.style.display = 'block';
        }
        
        if (this.recordingLoopEnd !== null) {
            const endPercent = (this.recordingLoopEnd / duration) * 100;
            endMarker.style.left = `${endPercent}%`;
            endMarker.style.display = 'block';
            
            // Show loop region
            if (this.recordingLoopStart !== null) {
                const startPercent = (this.recordingLoopStart / duration) * 100;
                loopRegion.style.left = `${startPercent}%`;
                loopRegion.style.width = `${endPercent - startPercent}%`;
                loopRegion.style.display = 'block';
            }
        }
        
        // Enable clear button if we have markers
        if (this.sequencerClearLoopBtn) {
            this.sequencerClearLoopBtn.disabled = this.recordingLoopMarkerCount === 0;
        }
    }
    
    toggleRecordingLoop() {
        if (this.recordingLoopMarkerCount < 2) {
            alert('Please click the waveform twice to set loop points A and B');
            return;
        }
        
        const audioElement = document.getElementById('sequencerRecordedAudio');
        if (!audioElement) return;
        
        // Toggle loop attribute
        audioElement.loop = !audioElement.loop;
        
        // Update button appearance
        if (this.sequencerLoopBtn) {
            if (audioElement.loop) {
                this.sequencerLoopBtn.classList.add('active');
                this.sequencerLoopBtn.title = 'Loop enabled - will repeat A-B section';
            } else {
                this.sequencerLoopBtn.classList.remove('active');
                this.sequencerLoopBtn.title = 'Enable loop';
            }
        }
        
        console.log('🔁 Loop toggled:', audioElement.loop);
    }
    
    clearRecordingLoop() {
        this.recordingLoopStart = null;
        this.recordingLoopEnd = null;
        this.recordingLoopMarkerCount = 0;
        
        // Hide markers
        const startMarker = document.getElementById('sequencerLoopMarkerStart');
        const endMarker = document.getElementById('sequencerLoopMarkerEnd');
        const loopRegion = document.getElementById('sequencerLoopRegion');
        
        if (startMarker) startMarker.style.display = 'none';
        if (endMarker) endMarker.style.display = 'none';
        if (loopRegion) loopRegion.style.display = 'none';
        
        // Disable loop
        const audioElement = document.getElementById('sequencerRecordedAudio');
        if (audioElement) {
            audioElement.loop = false;
        }
        
        // Update button
        if (this.sequencerLoopBtn) {
            this.sequencerLoopBtn.classList.remove('active');
        }
        
        if (this.sequencerClearLoopBtn) {
            this.sequencerClearLoopBtn.disabled = true;
        }
        
        console.log('❌ Cleared loop markers');
    }

    /**
     * Auto-Timestretch System
     */

    /**
     * Toggle auto-timestretch mode
     */
    toggleAutoTimestretch() {
        this.autoTimestretachEnabled = !this.autoTimestretachEnabled;
        
        if (this.autoTimestretchBtn) {
            if (this.autoTimestretachEnabled) {
                this.autoTimestretchBtn.classList.add('active');
                this.autoTimestretchBtn.title = 'Auto-timestretch enabled - clips will match project BPM';
            } else {
                this.autoTimestretchBtn.classList.remove('active');
                this.autoTimestretchBtn.title = 'Auto-timestretch disabled';
            }
        }

        if (this.autoTimestretachEnabled) {
            console.log(`🎵 Auto-timestretch enabled (Project BPM: ${this.projectBPM})`);
            this.applyAutoTimestretchToAllClips();
        } else {
            console.log('🎵 Auto-timestretch disabled');
            this.clearAllTimestretchBadges();
        }
    }

    /**
     * Apply auto-timestretch to all clips based on their detected BPM
     */
    applyAutoTimestretchToAllClips() {
        this.clips.forEach((clip) => {
            if (clip.detectedBPM && clip.detectedBPM > 0) {
                const stretchRatio = clip.detectedBPM / this.projectBPM;
                clip.appliedStretchRatio = stretchRatio;
                clip.autoTimestretched = true;

                // Queue for rendering
                this.queueClipForRendering({
                    clip,
                    name: clip.name,
                    stretchRatio,
                    pitchShift: 0,
                    reverse: false
                });

                // Update visual badge
                this.updateClipBadge(clip);
            }
        });
    }

    /**
     * Update visual badge on clip to show timestretch status
     * @param {Object} clip - The clip object
     */
    updateClipBadge(clip) {
        if (!this.autoTimestretachEnabled) {
            return;
        }

        const clipElement = document.querySelector(`[data-clip-id="${clip.id}"]`);
        if (!clipElement) {
            return;
        }

        let badge = clipElement.querySelector('.timestretch-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'timestretch-badge';
            clipElement.appendChild(badge);
        }

        if (clip.detectedBPM && clip.detectedBPM > 0) {
            const targetBPM = this.projectBPM;
            const change = ((targetBPM - clip.detectedBPM) / clip.detectedBPM * 100).toFixed(1);
            const sign = change >= 0 ? '+' : '';
            badge.textContent = `${clip.detectedBPM}→${targetBPM} BPM (${sign}${change}%)`;
            badge.style.background = 'rgba(76, 175, 80, 0.9)'; // Green for auto-stretched
        } else {
            badge.textContent = `⚠️ BPM unknown`;
            badge.style.background = 'rgba(255, 152, 0, 0.9)'; // Orange warning
        }
    }

    /**
     * Clear all timestretch badges
     */
    clearAllTimestretchBadges() {
        const badges = document.querySelectorAll('.timestretch-badge');
        badges.forEach(badge => badge.remove());
    }

    /**
     * Cache Management System
     */

    /**
     * Update cache size display
     */
    updateCacheSize() {
        let totalSize = 0;

        this.clips.forEach((clip) => {
            if (clip.renderedBuffer) {
                const samples = clip.renderedBuffer.length * clip.renderedBuffer.numberOfChannels;
                totalSize += samples * 4; // Float32 = 4 bytes per sample
            }
        });

        const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);
        
        if (this.cacheSize) {
            this.cacheSize.textContent = `${sizeMB} MB`;
        }

        // Warn if cache is getting large
        const cacheLimit = 200; // 200 MB
        if (parseFloat(sizeMB) > cacheLimit * 0.9) {
            if (this.cacheStatus) {
                this.cacheStatus.style.color = '#ff9800'; // Orange warning
            }
        } else {
            if (this.cacheStatus) {
                this.cacheStatus.style.color = ''; // Reset to default
            }
        }

        // Apply LRU eviction if over limit
        if (parseFloat(sizeMB) > cacheLimit) {
            this.applyLRUEviction(cacheLimit);
        }
    }

    /**
     * Apply LRU (Least Recently Used) eviction to keep cache under limit
     * @param {number} limitMB - Cache size limit in MB
     */
    applyLRUEviction(limitMB) {
        console.log(`⚠️ Cache over limit (${limitMB} MB), applying LRU eviction...`);

        // Create array of clips with rendered buffers and timestamps
        const renderedClips = [];
        this.clips.forEach((clip) => {
            if (clip.renderedBuffer) {
                renderedClips.push({
                    clip,
                    lastUsed: clip.lastUsedTimestamp || 0,
                    size: (clip.renderedBuffer.length * clip.renderedBuffer.numberOfChannels * 4) / (1024 * 1024)
                });
            }
        });

        // Sort by lastUsed (oldest first)
        renderedClips.sort((a, b) => a.lastUsed - b.lastUsed);

        // Remove oldest buffers until under limit
        let currentSize = renderedClips.reduce((sum, item) => sum + item.size, 0);
        let evicted = 0;

        for (const item of renderedClips) {
            if (currentSize <= limitMB) {
                break;
            }

            delete item.clip.renderedBuffer;
            item.clip.renderingStatus = 'pending';
            currentSize -= item.size;
            evicted++;
        }

        console.log(`🗑️ Evicted ${evicted} buffers to free space`);
        this.updateCacheSize();
    }

    /**
     * Clear the timestretch cache
     */
    clearTimestretchCache() {
        let cleared = 0;

        this.clips.forEach((clip) => {
            if (clip.renderedBuffer) {
                delete clip.renderedBuffer;
                clip.renderingStatus = 'pending';
                cleared++;
            }
        });

        console.log(`🗑️ Cleared cache: ${cleared} buffers removed`);
        this.updateCacheSize();
        this.clearAllTimestretchBadges();

        // Re-render if auto-timestretch is enabled
        if (this.autoTimestretachEnabled) {
            this.applyAutoTimestretchToAllClips();
        }
    }

    /**
     * Background Rendering System for Timestretching
     */

    /**
     * Queue a clip for timestretched rendering
     * @param {Object} clipData - Clip data with timestretch parameters
     */
    queueClipForRendering(clipData) {
        this.renderQueue.push(clipData);
        console.log(`📥 Queued clip for rendering: ${clipData.name} (Queue size: ${this.renderQueue.length})`);
        
        // Start processing if not already rendering
        if (!this.isRendering) {
            this.processRenderQueue();
        }
    }

    /**
     * Process the render queue (FIFO)
     */
    async processRenderQueue() {
        if (this.isRendering || this.renderQueue.length === 0) {
            return;
        }

        this.isRendering = true;
        this.totalClipsToRender = this.renderQueue.length;
        this.renderedClipsCount = 0;

        this.updateRenderProgress();

        while (this.renderQueue.length > 0) {
            const clipData = this.renderQueue.shift(); // FIFO: take first item
            this.currentRenderingClip = clipData;

            console.log(`🎵 Rendering clip ${this.renderedClipsCount + 1}/${this.totalClipsToRender}: ${clipData.name}`);

            try {
                await this.renderTimestretchedClip(clipData);
                this.renderedClipsCount++;
                this.updateRenderProgress();
            } catch (error) {
                console.error(`❌ Error rendering clip ${clipData.name}:`, error);
                // Continue with next clip even if one fails
            }
        }

        this.isRendering = false;
        this.currentRenderingClip = null;
        this.hideRenderProgress();

        console.log(`✅ Render queue complete: ${this.renderedClipsCount} clips processed`);
    }

    /**
     * Render a timestretched version of a clip using offline processing
     * @param {Object} clipData - Clip data with buffer, tempo, pitch, etc.
     */
    async renderTimestretchedClip(clipData) {
        const { clip, stretchRatio, pitchShift, reverse } = clipData;

        if (!clip || !clip.audioBuffer) {
            console.error('Invalid clip data for rendering');
            return;
        }

        // Show "rendering" overlay on the clip element if it exists
        if (clip.element) {
            this.showClipRenderingState(clip.element, true);
        }

        const audioBuffer = clip.audioBuffer;
        const duration = audioBuffer.duration;
        const outputDuration = duration / (stretchRatio || 1.0);

        try {
            // Use Tone.Offline for offline rendering
            const renderedBuffer = await Tone.Offline(async ({ Transport }) => {
                const player = new Tone.Player(audioBuffer).toDestination();
                player.playbackRate = stretchRatio || 1.0;

                // Add pitch shifting if needed
                if (pitchShift && pitchShift !== 0) {
                    const pitchShifter = new Tone.PitchShift({
                        pitch: pitchShift
                    });
                    player.disconnect();
                    player.connect(pitchShifter);
                    pitchShifter.toDestination();
                }

                player.start(0);
            }, outputDuration);

            // Store the rendered buffer
            clip.renderedBuffer = renderedBuffer;
            clip.renderingStatus = 'complete';
            clip.lastUsedTimestamp = Date.now(); // Track when buffer was created/used

            // If reverse is needed, apply it
            if (reverse) {
                clip.renderedBuffer = this.reverseBuffer(renderedBuffer);
            }

            console.log(`✅ Clip rendered successfully: ${clip.name} (${outputDuration.toFixed(2)}s)`);
            
            // Update cache size display
            this.updateCacheSize();
        } catch (error) {
            clip.renderingStatus = 'error';
            console.error(`❌ Rendering failed for ${clip.name}:`, error);
            throw error;
        } finally {
            // Hide "rendering" overlay
            if (clip.element) {
                this.showClipRenderingState(clip.element, false);
            }
        }
    }

    /**
     * Reverse an AudioBuffer
     * @param {AudioBuffer} buffer - Buffer to reverse
     * @returns {AudioBuffer} Reversed buffer
     */
    reverseBuffer(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;

        const reversedBuffer = this.audioContext.createBuffer(
            numberOfChannels,
            length,
            sampleRate
        );

        for (let channel = 0; channel < numberOfChannels; channel++) {
            const originalData = buffer.getChannelData(channel);
            const reversedData = reversedBuffer.getChannelData(channel);

            for (let i = 0; i < length; i++) {
                reversedData[i] = originalData[length - 1 - i];
            }
        }

        return reversedBuffer;
    }

    /**
     * Show/hide rendering state on a clip element
     * @param {HTMLElement} clipElement - The clip DOM element
     * @param {boolean} isRendering - Whether to show or hide rendering state
     */
    showClipRenderingState(clipElement, isRendering) {
        let overlay = clipElement.querySelector('.rendering-overlay');
        
        if (isRendering) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'rendering-overlay';
                overlay.innerHTML = '<span>⏳ Rendering...</span>';
                clipElement.appendChild(overlay);
            }
            overlay.style.display = 'flex';
        } else {
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }

    /**
     * Update the global rendering progress bar
     */
    updateRenderProgress() {
        let progressContainer = document.getElementById('sequencerRenderProgress');
        
        if (!progressContainer) {
            // Create progress bar if it doesn't exist
            progressContainer = document.createElement('div');
            progressContainer.id = 'sequencerRenderProgress';
            progressContainer.className = 'sequencer-render-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progressText = document.createElement('div');
            progressText.className = 'progress-text';
            
            progressContainer.appendChild(progressBar);
            progressContainer.appendChild(progressText);
            
            // Add to sequencer controls area
            const controlsContainer = document.querySelector('.sequencer-controls');
            if (controlsContainer) {
                controlsContainer.appendChild(progressContainer);
            }
        }

        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressText = progressContainer.querySelector('.progress-text');
        
        const percentage = this.totalClipsToRender > 0 
            ? (this.renderedClipsCount / this.totalClipsToRender) * 100 
            : 0;

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `Processing ${this.renderedClipsCount}/${this.totalClipsToRender} clips... ${percentage.toFixed(0)}%`;
        }

        progressContainer.style.display = 'block';
    }

    /**
     * Hide the rendering progress bar
     */
    hideRenderProgress() {
        const progressContainer = document.getElementById('sequencerRenderProgress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    /**
     * Project Save/Load System
     */

    /**
     * Serialize current sequencer state to JSON
     * @returns {object} Serialized project data
     */
    serializeProject() {
        const projectData = {
            version: '1.0',
            name: this.currentProjectId,
            bpm: this.currentBPM,
            numberOfBars: this.numberOfBars,
            zoomLevel: this.zoomLevel,
            autoTimestretachEnabled: this.autoTimestretachEnabled,
            projectBPM: this.projectBPM,
            clips: [],
            tracks: []
        };

        // Serialize clips
        this.clips.forEach((clip, id) => {
            projectData.clips.push({
                id: clip.id,
                name: clip.name,
                duration: clip.duration,
                startTime: clip.startTime,
                endTime: clip.endTime,
                detectedBPM: clip.detectedBPM,
                appliedStretchRatio: clip.appliedStretchRatio,
                manualStretch: clip.manualStretch,
                manualPitch: clip.manualPitch,
                autoTimestretched: clip.autoTimestretched,
                renderingStatus: clip.renderingStatus
            });
        });

        // Serialize tracks with clip placements
        this.sequencerTracks.forEach((track, index) => {
            const trackData = {
                id: track.id,
                index: index,
                clips: []
            };

            track.clips.forEach(placedClip => {
                trackData.clips.push({
                    clipId: placedClip.id,
                    startBar: placedClip.startBar,
                    duration: placedClip.duration,
                    trimStart: placedClip.trimStart || 0,
                    trimEnd: placedClip.trimEnd || placedClip.duration
                });
            });

            projectData.tracks.push(trackData);
        });

        return projectData;
    }

    /**
     * Save project to IndexedDB
     */
    async saveProject() {
        try {
            console.log('💾 Saving project...');

            // Serialize project data
            const projectData = this.serializeProject();

            // Save all audio buffers to IndexedDB
            for (const [id, clip] of this.clips) {
                if (clip.audioBuffer) {
                    await this.dbManager.saveAudioBuffer(
                        clip.id,
                        clip.audioBuffer,
                        this.currentProjectId,
                        {
                            name: clip.name,
                            detectedBPM: clip.detectedBPM
                        }
                    );
                }
            }

            // Save project metadata
            await this.dbManager.saveProject(this.currentProjectId, projectData);

            console.log('✅ Project saved successfully');
            alert(`✅ Project "${this.currentProjectId}" saved!`);

        } catch (error) {
            console.error('❌ Failed to save project:', error);
            alert('Failed to save project: ' + error.message);
        }
    }

    /**
     * Load project from IndexedDB
     * @param {string} projectId - Project ID to load
     */
    async loadProject(projectId) {
        try {
            console.log(`📂 Loading project: ${projectId}...`);

            // Load project metadata
            const projectData = await this.dbManager.loadProject(projectId);

            // Clear current state
            this.clips.clear();
            this.sequencerTracks = [];
            this.updateClipsList();

            // Restore project settings
            this.currentBPM = projectData.bpm || 120;
            this.numberOfBars = projectData.numberOfBars || 8;
            this.zoomLevel = projectData.zoomLevel || 1.0;
            this.autoTimestretachEnabled = projectData.autoTimestretachEnabled || false;
            this.projectBPM = projectData.projectBPM || 120;

            if (this.bpmInput) this.bpmInput.value = this.currentBPM;
            if (this.zoomSlider) this.zoomSlider.value = this.zoomLevel * 100;

            // Load audio buffers and restore clips
            for (const clipData of projectData.clips) {
                try {
                    const audioBuffer = await this.dbManager.loadAudioBuffer(clipData.id, this.audioContext);
                    
                    const clip = {
                        id: clipData.id,
                        name: clipData.name,
                        audioBuffer: audioBuffer,
                        duration: clipData.duration,
                        startTime: clipData.startTime || 0,
                        endTime: clipData.endTime || clipData.duration,
                        fullBuffer: audioBuffer,
                        detectedBPM: clipData.detectedBPM || 0,
                        appliedStretchRatio: clipData.appliedStretchRatio || 1.0,
                        manualStretch: clipData.manualStretch || 1.0,
                        manualPitch: clipData.manualPitch || 0,
                        autoTimestretched: clipData.autoTimestretched || false,
                        renderingStatus: clipData.renderingStatus || 'pending'
                    };

                    this.clips.set(clip.id, clip);
                } catch (error) {
                    console.error(`Failed to load clip ${clipData.id}:`, error);
                }
            }

            this.updateClipsList();

            // Restore tracks and clip placements
            // (Track restoration would require recreating track DOM elements)
            this.initializeTimeline(); // Reinitialize timeline

            this.currentProjectId = projectId;

            console.log('✅ Project loaded successfully');
            alert(`✅ Project "${projectId}" loaded!`);

        } catch (error) {
            console.error('❌ Failed to load project:', error);
            alert('Failed to load project: ' + error.message);
        }
    }

    /**
     * Show load project dialog
     */
    async showLoadProjectDialog() {
        try {
            const projects = await this.dbManager.listProjects();

            if (projects.length === 0) {
                alert('No saved projects found.');
                return;
            }

            let message = 'Select a project to load:\n\n';
            projects.forEach((project, index) => {
                const date = new Date(project.savedAt).toLocaleString();
                message += `${index + 1}. ${project.name} (saved: ${date})\n`;
            });

            const choice = prompt(message + '\nEnter project number:');
            const index = parseInt(choice) - 1;

            if (index >= 0 && index < projects.length) {
                await this.loadProject(projects[index].id);
            }
        } catch (error) {
            console.error('Failed to list projects:', error);
            alert('Failed to load projects list.');
        }
    }

    /**
     * Export project as JSON file
     */
    exportProject() {
        try {
            const projectData = this.serializeProject();
            const json = JSON.stringify(projectData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.currentProjectId}_${Date.now()}.json`;
            a.click();

            URL.revokeObjectURL(url);
            console.log('📥 Project exported');
        } catch (error) {
            console.error('Failed to export project:', error);
            alert('Failed to export project: ' + error.message);
        }
    }

    /**
     * Import project from JSON file
     * @param {Event} event - File input change event
     */
    async importProject(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const projectData = JSON.parse(text);

            console.log('📤 Importing project:', projectData.name);

            // Note: Audio buffers are NOT included in JSON export
            // User would need to re-upload audio files or load from IndexedDB
            alert('⚠️ Note: Audio files are not included in JSON export.\nPlease load the project from browser storage or re-upload audio files.');

            // Could implement partial restore of settings without audio
            this.currentBPM = projectData.bpm || 120;
            this.numberOfBars = projectData.numberOfBars || 8;
            this.projectBPM = projectData.projectBPM || 120;

            if (this.bpmInput) this.bpmInput.value = this.currentBPM;

        } catch (error) {
            console.error('Failed to import project:', error);
            alert('Failed to import project: ' + error.message);
        }

        // Reset file input
        event.target.value = '';
    }
}
