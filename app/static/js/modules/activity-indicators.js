/**
 * Activity Indicators Manager
 * Manages visual feedback for active audio sources in the master output routing
 */

class ActivityIndicators {
    constructor() {
        this.indicators = {
            track1: document.getElementById('activityTrack1'),
            track2: document.getElementById('activityTrack2'),
            microphone: document.getElementById('activityMicrophone'),
            sampler: document.getElementById('activitySampler'),
            theremin: document.getElementById('activityTheremin'),
            sequencer: document.getElementById('activitySequencer')
        };
        
        this.activeStates = {
            track1: false,
            track2: false,
            microphone: false,
            sampler: false,
            theremin: false,
            sequencer: false
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for custom events from various modules
        document.addEventListener('track1Playing', () => this.setActive('track1', true));
        document.addEventListener('track1Paused', () => this.setActive('track1', false));
        document.addEventListener('track1Stopped', () => this.setActive('track1', false));
        
        document.addEventListener('track2Playing', () => this.setActive('track2', true));
        document.addEventListener('track2Paused', () => this.setActive('track2', false));
        document.addEventListener('track2Stopped', () => this.setActive('track2', false));
        
        document.addEventListener('microphoneActive', () => this.setActive('microphone', true));
        document.addEventListener('microphoneInactive', () => this.setActive('microphone', false));
        
        document.addEventListener('samplerPlaying', () => this.setActive('sampler', true));
        document.addEventListener('samplerStopped', () => this.setActive('sampler', false));
        
        document.addEventListener('thereminActive', () => this.setActive('theremin', true));
        document.addEventListener('thereminInactive', () => this.setActive('theremin', false));
        
        document.addEventListener('sequencerPlaying', () => this.setActive('sequencer', true));
        document.addEventListener('sequencerStopped', () => this.setActive('sequencer', false));
    }
    
    setActive(source, isActive) {
        if (!this.indicators[source]) return;
        
        this.activeStates[source] = isActive;
        
        if (isActive) {
            this.indicators[source].classList.add('active');
        } else {
            this.indicators[source].classList.remove('active');
        }
        
        console.log(`🎵 Activity indicator ${source}: ${isActive ? 'ON' : 'OFF'}`);
    }
    
    isActive(source) {
        return this.activeStates[source];
    }
    
    reset() {
        Object.keys(this.indicators).forEach(source => {
            this.setActive(source, false);
        });
    }
}

// Initialize globally
let activityIndicators;
document.addEventListener('DOMContentLoaded', () => {
    activityIndicators = new ActivityIndicators();
});

export { ActivityIndicators, activityIndicators };
