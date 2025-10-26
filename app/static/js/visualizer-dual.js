// Import modules
import { scales, keyboardMap, noteFrequencies, musicScales } from './modules/constants.js';
import { 
    formatTime, 
    updateLoopRegion, 
    clearLoopPoints, 
    animateReversePlayback, 
    stopReversePlayback, 
    handleLoopPlayback 
} from './modules/loop-controls.js';
import { 
    drawWaveform, 
    redrawWaveformWithZoom, 
    drawWaveformSimple, 
    detectBPM, 
    detectKey, 
    detectMusicalKey as detectMusicalKeyFromFrequency 
} from './modules/audio-utils.js';
import { 
    createReverb, 
    createDelay, 
    initAudioEffects, 
    connectEffectsChain,
    triggerADSRAttack,
    triggerADSRRelease,
    updateADSRParameters
} from './modules/audio-effects.js';
import { EffectChain, connectEffectsInOrder } from './modules/effect-chain.js';
import { 
    startRecording as startRecordingModule, 
    stopRecording as stopRecordingModule, 
    drawRecordingWaveform, 
    downloadRecording 
} from './modules/recording.js';
import {
    enableMicrophone as enableMicrophoneModule,
    disableMicrophone as disableMicrophoneModule,
    drawMicWaveform as drawMicWaveformModule,
    updateMicVolume,
    startMicRecording,
    stopMicRecording
} from './modules/microphone.js';
import {
    enableVocoder as enableVocoderModule,
    disableVocoder as disableVocoderModule,
    updateVocoderMix,
    getVocoderCarrierSource
} from './modules/vocoder.js';
import {
    enableAutotune as enableAutotuneModule,
    disableAutotune as disableAutotuneModule,
    updateAutotuneStrength,
    detectPitch,
    findNearestNoteInScale,
    correctPitchToTarget
} from './modules/autotune.js';
import { 
    playSamplerNote, 
    handleKeyDown as samplerHandleKeyDown, 
    handleKeyUp as samplerHandleKeyUp, 
    enableSampler, 
    disableSampler 
} from './modules/sampler.js';
import {
    enableTheremin,
    disableTheremin,
    changeThereminWaveform,
    changeThereminRange,
    changeThereminVibrato,
    changeThereminVolume,
    setThereminAudioSource,
    setThereminMappingMode,
    getThereminRoutingGain,
    changeThereminSensitivity,
    changeThereminHandRequirement,
    cleanupTheremin
} from './modules/theremin.js';

// Get DOM elements for Track 1
const audioFile1 = document.getElementById('audioFile1');
const fileName1 = document.getElementById('fileName1');
const audioElement1 = document.getElementById('audioElement1');
const playBtn1 = document.getElementById('playBtn1');
const pauseBtn1 = document.getElementById('pauseBtn1');
const stopBtn1 = document.getElementById('stopBtn1');
const captureTabAudio1 = document.getElementById('captureTabAudio1');

// Debug: Check if elements exist
console.log('DOM Elements loaded:', {
    audioFile1: !!audioFile1,
    playBtn1: !!playBtn1,
    audioElement1: !!audioElement1
});
if (!audioFile1) console.error('ERROR: audioFile1 not found!');
const loopBtn1 = document.getElementById('loopBtn1');
const reverseLoopBtn1 = document.getElementById('reverseLoopBtn1');
const clearLoopBtn1 = document.getElementById('clearLoopBtn1');
const tempoSlider1 = document.getElementById('tempoSlider1');
const tempoValue1 = document.getElementById('tempoValue1');
const volumeSlider1 = document.getElementById('volumeSlider1');
const volumeValue1 = document.getElementById('volumeValue1');
const panSlider1 = document.getElementById('panSlider1');
const panValue1 = document.getElementById('panValue1');
const waveform1 = document.getElementById('waveform1');
const waveformProgress1 = document.getElementById('waveformProgress1');
const loopMarkerStart1 = document.getElementById('loopMarkerStart1');
const loopMarkerEnd1 = document.getElementById('loopMarkerEnd1');
const loopRegion1 = document.getElementById('loopRegion1');
const bpm1Display = document.getElementById('bpm1');
const key1Display = document.getElementById('key1');
const currentTime1Display = document.getElementById('currentTime1');
const duration1Display = document.getElementById('duration1');
const zoomInBtn1 = document.getElementById('zoomInBtn1');
const zoomOutBtn1 = document.getElementById('zoomOutBtn1');
const zoomResetBtn1 = document.getElementById('zoomResetBtn1');
const zoomLevel1Display = document.getElementById('zoomLevel1');
const filterSlider1 = document.getElementById('filterSlider1');
const filterValue1 = document.getElementById('filterValue1');
const filterType1 = document.getElementById('filterType1');
const reverbSlider1 = document.getElementById('reverbSlider1');
const reverbValue1 = document.getElementById('reverbValue1');
const delaySlider1 = document.getElementById('delaySlider1');
const delayValue1 = document.getElementById('delayValue1');
const delayTimeSlider1 = document.getElementById('delayTimeSlider1');
const delayTimeValue1 = document.getElementById('delayTimeValue1');
const exportStem1 = document.getElementById('exportStem1');
const exportLoop1 = document.getElementById('exportLoop1');
const exportFormat1 = document.getElementById('exportFormat1');
const waveformColor1 = document.getElementById('waveformColor1');
const resetColor1 = document.getElementById('resetColor1');

// Get DOM elements for Track 2
const audioFile2 = document.getElementById('audioFile2');
const fileName2 = document.getElementById('fileName2');
const audioElement2 = document.getElementById('audioElement2');
const playBtn2 = document.getElementById('playBtn2');
const pauseBtn2 = document.getElementById('pauseBtn2');
const stopBtn2 = document.getElementById('stopBtn2');
const captureTabAudio2 = document.getElementById('captureTabAudio2');
const loopBtn2 = document.getElementById('loopBtn2');
const reverseLoopBtn2 = document.getElementById('reverseLoopBtn2');
const clearLoopBtn2 = document.getElementById('clearLoopBtn2');
const tempoSlider2 = document.getElementById('tempoSlider2');
const tempoValue2 = document.getElementById('tempoValue2');
const volumeSlider2 = document.getElementById('volumeSlider2');
const volumeValue2 = document.getElementById('volumeValue2');
const panSlider2 = document.getElementById('panSlider2');
const panValue2 = document.getElementById('panValue2');
const waveform2 = document.getElementById('waveform2');
const waveformProgress2 = document.getElementById('waveformProgress2');
const loopMarkerStart2 = document.getElementById('loopMarkerStart2');
const loopMarkerEnd2 = document.getElementById('loopMarkerEnd2');
const loopRegion2 = document.getElementById('loopRegion2');
const bpm2Display = document.getElementById('bpm2');
const key2Display = document.getElementById('key2');
const currentTime2Display = document.getElementById('currentTime2');
const duration2Display = document.getElementById('duration2');
const zoomInBtn2 = document.getElementById('zoomInBtn2');
const zoomOutBtn2 = document.getElementById('zoomOutBtn2');
const zoomResetBtn2 = document.getElementById('zoomResetBtn2');
const zoomLevel2Display = document.getElementById('zoomLevel2');
const filterSlider2 = document.getElementById('filterSlider2');
const filterValue2 = document.getElementById('filterValue2');
const filterType2 = document.getElementById('filterType2');
const reverbSlider2 = document.getElementById('reverbSlider2');
const reverbValue2 = document.getElementById('reverbValue2');
const delaySlider2 = document.getElementById('delaySlider2');
const delayValue2 = document.getElementById('delayValue2');
const delayTimeSlider2 = document.getElementById('delayTimeSlider2');
const delayTimeValue2 = document.getElementById('delayTimeValue2');
const exportStem2 = document.getElementById('exportStem2');
const exportLoop2 = document.getElementById('exportLoop2');
const exportFormat2 = document.getElementById('exportFormat2');
const waveformColor2 = document.getElementById('waveformColor2');
const resetColor2 = document.getElementById('resetColor2');

// Shared visualizer elements
const container = document.getElementById('visualizer-container');
const placeholder = document.getElementById('placeholder');
const modeCircleBtn = document.getElementById('modeCircle');
const modeBarsBtn = document.getElementById('modeBars');
const modeSphereBtn = document.getElementById('modeSphere');

// Recording elements
const recordBtn = document.getElementById('recordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loadToTrack1Btn = document.getElementById('loadToTrack1Btn');
const loadToTrack2Btn = document.getElementById('loadToTrack2Btn');
const recordingExportGroup = document.getElementById('recordingExportGroup');
const recordingExportFormat = document.getElementById('recordingExportFormat');
const recordingTime = document.getElementById('recordingTime');
const recordingWaveform = document.getElementById('recordingWaveform');
const recordingWaveformContainer = document.querySelector('.recording-waveform-container');
const recordedAudio = document.getElementById('recordedAudio');

// Dual Track Control elements
const playBothBtn = document.getElementById('playBothBtn');
const playBothRecordBtn = document.getElementById('playBothRecordBtn');

// Vinyl animation elements
const vinylAnimation1 = document.getElementById('vinylAnimation1');
const vinylAnimation2 = document.getElementById('vinylAnimation2');

// Crossfader elements
const crossfader = document.getElementById('crossfader');
const crossfaderValue = document.getElementById('crossfaderValue');
const crossfaderMode = document.getElementById('crossfaderMode');
const crossfaderLabelLeft = document.getElementById('crossfaderLabelLeft');
const crossfaderLabelRight = document.getElementById('crossfaderLabelRight');

// Microphone elements
const enableMicBtn = document.getElementById('enableMicBtn');
const disableMicBtn = document.getElementById('disableMicBtn');
const captureTabAudioMic = document.getElementById('captureTabAudioMic');
const micVolumeSlider = document.getElementById('micVolumeSlider');
const micVolumeValue = document.getElementById('micVolumeValue');
const micVolumeControl = document.getElementById('micVolumeControl');
const micMonitoring = document.getElementById('micMonitoring');
const micMonitorCheckbox = document.getElementById('micMonitorCheckbox');
const micWaveform = document.getElementById('micWaveform');
const micWaveformContainer = document.getElementById('micWaveformContainer');

// Microphone Recording elements
const micRecordingSection = document.getElementById('micRecordingSection');
const micRecordBtn = document.getElementById('micRecordBtn');
const micStopBtn = document.getElementById('micStopBtn');
const micRecordingTime = document.getElementById('micRecordingTime');
const micRecordingWaveformContainer = document.getElementById('micRecordingWaveformContainer');
const micRecordingWaveform = document.getElementById('micRecordingWaveform');
const micRecordingPlayback = document.getElementById('micRecordingPlayback');
const micRecordingAudio = document.getElementById('micRecordingAudio');
const micExportWavBtn = document.getElementById('micExportWavBtn');
const micExportMp3Btn = document.getElementById('micExportMp3Btn');
const micLoadToTrack1Btn = document.getElementById('micLoadToTrack1Btn');
const micLoadToTrack2Btn = document.getElementById('micLoadToTrack2Btn');

// Vocoder elements
const vocoderSection = document.getElementById('vocoderSection');
const enableVocoderBtn = document.getElementById('enableVocoderBtn');
const disableVocoderBtn = document.getElementById('disableVocoderBtn');
const vocoderSettings = document.getElementById('vocoderSettings');
const vocoderModulator = document.getElementById('vocoderModulator');
const vocoderCarrier = document.getElementById('vocoderCarrier');
const vocoderMixSlider = document.getElementById('vocoderMixSlider');
const vocoderMixValue = document.getElementById('vocoderMixValue');
const vocoderBandsSlider = document.getElementById('vocoderBandsSlider');
const vocoderBandsValue = document.getElementById('vocoderBandsValue');

// Auto-Tune elements
const autotuneSection = document.getElementById('autotuneSection');
const enableAutotuneBtn = document.getElementById('enableAutotuneBtn');
const disableAutotuneBtn = document.getElementById('disableAutotuneBtn');
const autotuneSettings = document.getElementById('autotuneSettings');
const autotuneSource = document.getElementById('autotuneSource');
const autotuneKey = document.getElementById('autotuneKey');
const autotuneScale = document.getElementById('autotuneScale');
const autotuneSpeedSlider = document.getElementById('autotuneSpeedSlider');
const autotuneSpeedValue = document.getElementById('autotuneSpeedValue');
const autotuneStrengthSlider = document.getElementById('autotuneStrengthSlider');
const autotuneStrengthValue = document.getElementById('autotuneStrengthValue');

// Keyboard Sampler elements
const samplerSourceSelect = document.getElementById('samplerSource');
const samplerScaleSelect = document.getElementById('samplerScale');
const samplerRootSelect = document.getElementById('samplerRoot');
const samplerVolumeSlider = document.getElementById('samplerVolumeSlider');
const samplerVolumeValue = document.getElementById('samplerVolumeValue');
const enableSamplerBtn = document.getElementById('enableSamplerBtn');
const disableSamplerBtn = document.getElementById('disableSamplerBtn');
const keyboardVisual = document.getElementById('keyboardVisual');

// Camera Theremin elements
const enableThereminBtn = document.getElementById('enableThereminBtn');
const disableThereminBtn = document.getElementById('disableThereminBtn');
const thereminVideoContainer = document.getElementById('thereminVideoContainer');
const thereminVideo = document.getElementById('thereminVideo');
const thereminCanvas = document.getElementById('thereminCanvas');
const thereminSettings = document.getElementById('thereminSettings');
const thereminVolumeSlider = document.getElementById('thereminVolumeSlider');
const thereminVolumeValue = document.getElementById('thereminVolumeValue');
const thereminAudioSource = document.getElementById('thereminAudioSource');
const thereminWaveform = document.getElementById('thereminWaveform');
const thereminRange = document.getElementById('thereminRange');
const thereminVibratoRate = document.getElementById('thereminVibratoRate');
const thereminVibratoRateValue = document.getElementById('thereminVibratoRateValue');
const thereminVibratoDepth = document.getElementById('thereminVibratoDepth');
const thereminVibratoDepthValue = document.getElementById('thereminVibratoDepthValue');
const thereminSensitivity = document.getElementById('thereminSensitivity');
const thereminSensitivityValue = document.getElementById('thereminSensitivityValue');
const thereminRequireHand = document.getElementById('thereminRequireHand');

// Master channel elements
const routeTrack1 = document.getElementById('routeTrack1');
const routeTrack2 = document.getElementById('routeTrack2');
const routeMicrophone = document.getElementById('routeMicrophone');
const routeSampler = document.getElementById('routeSampler');
const routeTheremin = document.getElementById('routeTheremin');
const filterSliderMaster = document.getElementById('filterSliderMaster');
const filterValueMaster = document.getElementById('filterValueMaster');
const filterTypeMaster = document.getElementById('filterTypeMaster');
const reverbSliderMaster = document.getElementById('reverbSliderMaster');
const reverbValueMaster = document.getElementById('reverbValueMaster');
const delaySliderMaster = document.getElementById('delaySliderMaster');
const delayValueMaster = document.getElementById('delayValueMaster');
const delayTimeSliderMaster = document.getElementById('delayTimeSliderMaster');
const delayTimeValueMaster = document.getElementById('delayTimeValueMaster');
const masterVolumeSlider = document.getElementById('masterVolumeSlider');
const masterVolumeValue = document.getElementById('masterVolumeValue');
const masterPanSlider = document.getElementById('masterPanSlider');
const masterPanValue = document.getElementById('masterPanValue');

// Audio context and analysers
let audioContext;
let analyser;
let source1, source2;
let merger; // To mix both tracks
let dataArray;
let bufferLength;
let animationId;

// Tab capture state
let tabCaptureStream1 = null;
let tabCaptureStream2 = null;
let tabCaptureSource1 = null;
let tabCaptureSource2 = null;

// Effect Chain managers
let effectChain1, effectChain2, effectChainMaster;

// Microphone state
let micState = null;
let micAnimationId = null;
let micEnabled = false;
let micRecordingState = null;
let micRecordingAnimationId = null;
let micRecordingInterval = null;
let micTabCaptureStream = null;
let micTabCaptureSource = null;

// Vocoder state
let vocoderEnabled = false;
let vocoderState = null;

// Auto-Tune state
let autotuneEnabled = false;
let autotuneState = null;

// Audio effects nodes for Track 1
let gain1, reverb1, delay1, filter1, panner1, adsr1;
let reverbWet1, delayWet1;
let finalMix1; // Final mixer for Track 1 effect chain

// Audio effects nodes for Track 2
let gain2, reverb2, delay2, filter2, panner2, adsr2;
let reverbWet2, delayWet2;
let finalMix2; // Final mixer for Track 2 effect chain

// Master effect nodes
let adsrMaster;

// Sampler ADSR state
let samplerADSREnabled = false;
let samplerADSRParams = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.8,
    release: 0.3
};
// Master effects nodes
let gainMaster, reverbMaster, delayMaster, filterMaster, pannerMaster;
let reverbWetMaster, delayWetMaster;

// Three.js variables
let scene, camera, renderer;
let visualizationObjects = [];
let currentMode = 'circle';
let particles = [];
let particleSystem;
let cameraRotation = { x: 0, y: 0 };
let bassLevel = 0;
let trebleLevel = 0;

// Oscilloscope variables
let oscilloscopeCanvas, oscilloscopeCtx;
let oscilloscopeAnalyser;
let oscilloscopeAnimationId;
let recordedAudioSource = null; // MediaElementSource for recorded audio playback

// Loop state for both tracks
let loopState1 = { enabled: false, start: null, end: null, settingPoint: 'start', lastSeekTime: 0, reverse: false, reverseAnimationId: null, lastReverseTime: 0 };
let loopState2 = { enabled: false, start: null, end: null, settingPoint: 'start', lastSeekTime: 0, reverse: false, reverseAnimationId: null, lastReverseTime: 0 };

// Zoom state for both tracks
let zoomState1 = { level: 1.0, offset: 0.0, audioBuffer: null, isDragging: false, dragStartX: 0, dragStartOffset: 0 };
let zoomState2 = { level: 1.0, offset: 0.0, audioBuffer: null, isDragging: false, dragStartX: 0, dragStartOffset: 0 };

// Waveform color state
let waveformColors = {
    track1: '#00ffff',  // Cyan default
    track2: '#ff00ff'   // Magenta default
};

// Recording state
let mediaRecorder;
let recordedChunks = [];
let recordedBlob = null; // Store the recorded blob for loading into tracks
let recordingStartTime = 0;
let recordingInterval;
let recordingDestination;
let recordingAnalyser;
let recordingAnimationId;

// Keyboard Sampler state
let samplerEnabled = false;
let samplerSource = null; // 'track1', 'track2', 'track1-loop', 'track2-loop', 'recording'
let samplerAudioBuffer = null;
let samplerScale = 'pentatonic-major';
let samplerRoot = 'C';
let samplerVolume = 0.6; // Default 60%
let activeKeys = new Set();

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Musical key detection
let currentKey = 'C';
let currentKeyColor = { h: 0, s: 100, l: 50 };

// === Recording State (for module) ===
const recordingState = {
    mediaRecorder: null,
    chunks: [],
    blob: null,
    startTime: 0,
    interval: null,
    animationId: null
};

const recordingElements = {
    recordBtn,
    stopBtn: stopRecordBtn,
    time: recordingTime,
    waveform: recordingWaveform,
    waveformContainer: recordingWaveformContainer,
    audio: recordedAudio,
    exportGroup: recordingExportGroup
};

// Wrapper functions
function startRecording() {
    const success = startRecordingModule(
        audioContext,
        recordingDestination,
        recordingAnalyser,
        recordingElements,
        recordingState
    );
    if (success) {
        // Keep reference for compatibility
        mediaRecorder = recordingState.mediaRecorder;
        recordedChunks = recordingState.chunks;
        recordingStartTime = recordingState.startTime;
        recordingInterval = recordingState.interval;
        recordingAnimationId = recordingState.animationId;
    }
}

function stopRecording() {
    stopRecordingModule(recordingState, recordingElements);
    // Update blob reference for compatibility
    recordedBlob = recordingState.blob;
}

async function downloadRecordingWrapper() {
    // Use recordingState.blob directly to ensure we have the latest blob
    const blob = recordingState.blob || recordedBlob;
    await downloadRecording(blob, recordingExportFormat.value, audioContext);
}

// Load recorded audio into Track 1
async function loadRecordingToTrack1() {
    console.log('loadRecordingToTrack1 called');
    const blob = recordingState.blob || recordedBlob;
    console.log('recordedBlob:', blob);
    
    if (!blob) {
        alert('No recording available to load');
        return;
    }
    
    try {
        // Clean up tab capture if Track 1 is currently capturing
        if (window.tabCaptureState1 && window.tabCaptureState1.isTabCapture) {
            console.log('Cleaning up tab capture on Track 1 before loading recording');
            
            // Stop the tab capture stream
            if (tabCaptureStream1) {
                tabCaptureStream1.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped tab capture track:', track.kind);
                });
                tabCaptureStream1 = null;
            }
            
            // Disconnect the tab capture source
            if (tabCaptureSource1) {
                try {
                    tabCaptureSource1.disconnect();
                    console.log('Disconnected tab capture source');
                } catch (e) {
                    console.log('Error disconnecting tab capture source:', e);
                }
                tabCaptureSource1 = null;
            }
            
            // Disconnect existing source1 if it's the tab capture
            if (source1) {
                try {
                    source1.disconnect();
                    console.log('Disconnected existing source1');
                } catch (e) {
                    console.log('Error disconnecting source1:', e);
                }
                source1 = null;
            }
            
            // Clear tab capture state
            window.tabCaptureState1 = null;
            
            // Reset UI elements
            fileName1.textContent = 'No file loaded';
            playBtn1.title = '';
            pauseBtn1.title = '';
            stopBtn1.title = '';
            
            console.log('✅ Track 1 tab capture cleaned up, ready for file playback');
        }
        
        // Stop any playing audio
        audioElement1.pause();
        audioElement1.currentTime = 0;
        
        console.log('Creating object URL from blob');
        const url = URL.createObjectURL(blob);
        
        console.log('Setting audio element source');
        audioElement1.src = url;
        audioElement1.type = 'audio/webm';
        
        // Wait for metadata to load before proceeding
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout waiting for audio metadata'));
            }, 5000); // 5 second timeout
            
            audioElement1.addEventListener('loadedmetadata', () => {
                clearTimeout(timeoutId);
                console.log('Track 1 metadata loaded. Duration:', audioElement1.duration);
                resolve();
            }, { once: true });
            
            audioElement1.addEventListener('error', (e) => {
                clearTimeout(timeoutId);
                reject(new Error('Error loading audio metadata: ' + e.message));
            }, { once: true });
            
            audioElement1.load(); // Explicitly load the audio
        });
        
        fileName1.textContent = `Recording_${new Date().toISOString().replace(/[:.]/g, '_')}.webm`;
        
        console.log('Enabling track 1 controls');
        playBtn1.disabled = false;
        pauseBtn1.disabled = false;
        stopBtn1.disabled = false;
        loopBtn1.disabled = false;
        reverseLoopBtn1.disabled = false;
        clearLoopBtn1.disabled = false;
        exportStem1.disabled = false;
        recordBtn.disabled = false;
        
        // Convert blob to file for waveform loading
        console.log('Converting blob to file for waveform');
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        
        console.log('Loading audio file for waveform and analysis');
        await loadAudioFile(file, waveform1, bpm1Display, audioElement1, zoomState1, key1Display);
        
        if (!scene) {
            console.log('Initializing 3D visualization');
            initThreeJS();
            initOscilloscope();
            createCircleVisualization();
        }
        
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
        
        // If audio context exists but source1 doesn't, create it now
        // This ensures the audio will play when user clicks play button
        if (audioContext && !source1 && audioElement1.src) {
            console.log('Creating MediaElementSource for Track 1');
            try {
                source1 = audioContext.createMediaElementSource(audioElement1);
                
                // Connect to the effects chain
                source1.connect(gain1);
                gain1.connect(panner1);
                panner1.connect(filter1);
                
                filter1.connect(reverb1.convolver);
                reverb1.convolver.connect(reverb1.wet);
                filter1.connect(reverb1.dry);
                
                const reverbMix1 = audioContext.createGain();
                reverb1.wet.connect(reverbMix1);
                reverb1.dry.connect(reverbMix1);
                
                reverbMix1.connect(delay1.node);
                delay1.node.connect(delay1.wet);
                reverbMix1.connect(delay1.dry);
                
                const finalMix1 = audioContext.createGain();
                delay1.wet.connect(finalMix1);
                delay1.dry.connect(finalMix1);
                
                finalMix1.connect(merger);
                
                console.log('Track 1 audio source connected successfully');
            } catch (err) {
                console.error('Error creating MediaElementSource for Track 1:', err);
            }
        }
        
        console.log('Recording successfully loaded to Track 1');
        alert('Recording loaded to Track 1! Click Play to hear it.');
        
        // Check if both tracks are loaded to enable dual buttons
        checkDualTrackButtonsState();
    } catch (err) {
        console.error('Error loading recording to Track 1:', err);
        alert('Error loading recording to Track 1: ' + err.message);
    }
}

// Load recorded audio into Track 2
async function loadRecordingToTrack2() {
    console.log('loadRecordingToTrack2 called');
    const blob = recordingState.blob || recordedBlob;
    console.log('recordedBlob:', blob);
    
    if (!blob) {
        alert('No recording available to load');
        return;
    }
    
    try {
        // Clean up tab capture if Track 2 is currently capturing
        if (window.tabCaptureState2 && window.tabCaptureState2.isTabCapture) {
            console.log('Cleaning up tab capture on Track 2 before loading recording');
            
            // Stop the tab capture stream
            if (tabCaptureStream2) {
                tabCaptureStream2.getTracks().forEach(track => {
                    track.stop();
                    console.log('Stopped tab capture track:', track.kind);
                });
                tabCaptureStream2 = null;
            }
            
            // Disconnect the tab capture source
            if (tabCaptureSource2) {
                try {
                    tabCaptureSource2.disconnect();
                    console.log('Disconnected tab capture source');
                } catch (e) {
                    console.log('Error disconnecting tab capture source:', e);
                }
                tabCaptureSource2 = null;
            }
            
            // Disconnect existing source2 if it's the tab capture
            if (source2) {
                try {
                    source2.disconnect();
                    console.log('Disconnected existing source2');
                } catch (e) {
                    console.log('Error disconnecting source2:', e);
                }
                source2 = null;
            }
            
            // Clear tab capture state
            window.tabCaptureState2 = null;
            
            // Reset UI elements
            fileName2.textContent = 'No file loaded';
            playBtn2.title = '';
            pauseBtn2.title = '';
            stopBtn2.title = '';
            
            console.log('✅ Track 2 tab capture cleaned up, ready for file playback');
        }
        
        // Stop any playing audio
        audioElement2.pause();
        audioElement2.currentTime = 0;
        
        console.log('Creating object URL from blob');
        const url = URL.createObjectURL(blob);
        
        console.log('Setting audio element source');
        audioElement2.src = url;
        audioElement2.type = 'audio/webm';
        
        // Wait for metadata to load before proceeding
        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout waiting for audio metadata'));
            }, 5000); // 5 second timeout
            
            audioElement2.addEventListener('loadedmetadata', () => {
                clearTimeout(timeoutId);
                console.log('Track 2 metadata loaded. Duration:', audioElement2.duration);
                resolve();
            }, { once: true });
            
            audioElement2.addEventListener('error', (e) => {
                clearTimeout(timeoutId);
                reject(new Error('Error loading audio metadata: ' + e.message));
            }, { once: true });
            
            audioElement2.load(); // Explicitly load the audio
        });
        
        fileName2.textContent = `Recording_${new Date().toISOString().replace(/[:.]/g, '_')}.webm`;
        
        console.log('Enabling track 2 controls');
        playBtn2.disabled = false;
        pauseBtn2.disabled = false;
        stopBtn2.disabled = false;
        loopBtn2.disabled = false;
        reverseLoopBtn2.disabled = false;
        clearLoopBtn2.disabled = false;
        exportStem2.disabled = false;
        recordBtn.disabled = false;
        
        // Convert blob to file for waveform loading
        console.log('Converting blob to file for waveform');
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        
        console.log('Loading audio file for waveform and analysis');
        await loadAudioFile(file, waveform2, bpm2Display, audioElement2, zoomState2, key2Display);
        
        if (!scene) {
            console.log('Initializing 3D visualization');
            initThreeJS();
            createCircleVisualization();
        }
        
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
        
        // If audio context exists but source2 doesn't, create it now
        // This ensures the audio will play when user clicks play button
        if (audioContext && !source2 && audioElement2.src) {
            console.log('Creating MediaElementSource for Track 2');
            try {
                source2 = audioContext.createMediaElementSource(audioElement2);
                
                // Connect to the effects chain
                source2.connect(gain2);
                gain2.connect(panner2);
                panner2.connect(filter2);
                
                filter2.connect(reverb2.convolver);
                reverb2.convolver.connect(reverb2.wet);
                filter2.connect(reverb2.dry);
                
                const reverbMix2 = audioContext.createGain();
                reverb2.wet.connect(reverbMix2);
                reverb2.dry.connect(reverbMix2);
                
                reverbMix2.connect(delay2.node);
                delay2.node.connect(delay2.wet);
                reverbMix2.connect(delay2.dry);
                
                const finalMix2 = audioContext.createGain();
                delay2.wet.connect(finalMix2);
                delay2.dry.connect(finalMix2);
                
                finalMix2.connect(merger);
                
                console.log('Track 2 audio source connected successfully');
            } catch (err) {
                console.error('Error creating MediaElementSource for Track 2:', err);
            }
        }
        
        console.log('Recording successfully loaded to Track 2');
        alert('Recording loaded to Track 2! Click Play to hear it.');
        
        // Check if both tracks are loaded to enable dual buttons
        checkDualTrackButtonsState();
    } catch (err) {
        console.error('Error loading recording to Track 2:', err);
        alert('Error loading recording to Track 2: ' + err.message);
    }
}

// Helper function to check if both tracks are loaded
function checkDualTrackButtonsState() {
    const track1Loaded = !playBtn1.disabled;
    const track2Loaded = !playBtn2.disabled;
    const bothTracksLoaded = track1Loaded && track2Loaded;
    
    playBothBtn.disabled = !bothTracksLoaded;
    playBothRecordBtn.disabled = !bothTracksLoaded;
}

// Play both tracks simultaneously
function playBothTracks() {
    initAudioContext();
    audioContext.resume().then(() => {
        // Start both tracks at the same time
        audioElement1.play();
        audioElement2.play();
        
        // Show both vinyl animations
        vinylAnimation1.style.display = 'flex';
        vinylAnimation2.style.display = 'flex';
        
        if (!animationId) draw();
        
        // Handle reverse animations if needed
        if (loopState1.reverse && loopState1.enabled) {
            stopReversePlayback(loopState1);
            loopState1.lastReverseTime = performance.now();
            animateReversePlayback(audioElement1, loopState1, updateWaveformProgress1);
        }
        
        if (loopState2.reverse && loopState2.enabled) {
            stopReversePlayback(loopState2);
            loopState2.lastReverseTime = performance.now();
            animateReversePlayback(audioElement2, loopState2, updateWaveformProgress2);
        }
    });
}

// Play both tracks and start recording
function playBothAndRecord() {
    // Check if recording is already in progress
    if (recordingState.isRecording) {
        alert('Recording already in progress!');
        return;
    }
    
    initAudioContext();
    audioContext.resume().then(() => {
        // Start recording first
        startRecording();
        
        // Then start both tracks
        audioElement1.play();
        audioElement2.play();
        
        // Show both vinyl animations
        vinylAnimation1.style.display = 'flex';
        vinylAnimation2.style.display = 'flex';
        
        if (!animationId) draw();
        
        // Handle reverse animations if needed
        if (loopState1.reverse && loopState1.enabled) {
            stopReversePlayback(loopState1);
            loopState1.lastReverseTime = performance.now();
            animateReversePlayback(audioElement1, loopState1, updateWaveformProgress1);
        }
        
        if (loopState2.reverse && loopState2.enabled) {
            stopReversePlayback(loopState2);
            loopState2.lastReverseTime = performance.now();
            animateReversePlayback(audioElement2, loopState2, updateWaveformProgress2);
        }
    });
}

// ==================== Crossfader Functions ====================

// Update crossfader labels based on mode
function updateCrossfaderMode(mode) {
    switch(mode) {
        case 'track1-track2':
            crossfaderLabelLeft.textContent = 'Track 1';
            crossfaderLabelRight.textContent = 'Track 2';
            break;
        case 'track1-mic':
            crossfaderLabelLeft.textContent = 'Track 1';
            crossfaderLabelRight.textContent = 'Microphone';
            break;
        case 'track2-mic':
            crossfaderLabelLeft.textContent = 'Track 2';
            crossfaderLabelRight.textContent = 'Microphone';
            break;
    }
    // Apply current crossfader position to new mode
    updateCrossfader(parseInt(crossfader.value));
}

// Update crossfader and adjust volumes
function updateCrossfader(value) {
    const mode = crossfaderMode.value;
    
    // Calculate fade curves (equal power crossfade)
    const leftGain = Math.cos((value / 100) * (Math.PI / 2));
    const rightGain = Math.sin((value / 100) * (Math.PI / 2));
    
    // Update display
    const leftPercent = Math.round(leftGain * 100);
    const rightPercent = Math.round(rightGain * 100);
    crossfaderValue.textContent = `${leftPercent}% / ${rightPercent}%`;
    
    // Apply gains based on mode
    switch(mode) {
        case 'track1-track2':
            // Crossfade between Track 1 and Track 2
            if (gain1) gain1.gain.value = leftGain * (volumeSlider1.value / 100);
            if (gain2) gain2.gain.value = rightGain * (volumeSlider2.value / 100);
            // Reset mic gain if it was previously affected
            if (micState && micState.micGain && micState.micStream) {
                micState.micGain.gain.value = micVolumeSlider.value / 100;
            }
            break;
            
        case 'track1-mic':
            // Crossfade between Track 1 and Microphone
            if (gain1) gain1.gain.value = leftGain * (volumeSlider1.value / 100);
            if (micState && micState.micGain && micState.micStream) {
                micState.micGain.gain.value = rightGain * (micVolumeSlider.value / 100);
            }
            // Reset Track 2 to its normal volume
            if (gain2) gain2.gain.value = volumeSlider2.value / 100;
            break;
            
        case 'track2-mic':
            // Crossfade between Track 2 and Microphone
            if (gain2) gain2.gain.value = leftGain * (volumeSlider2.value / 100);
            if (micState && micState.micGain && micState.micStream) {
                micState.micGain.gain.value = rightGain * (micVolumeSlider.value / 100);
            }
            // Reset Track 1 to its normal volume
            if (gain1) gain1.gain.value = volumeSlider1.value / 100;
            break;
    }
}

// Enable microphone input
async function enableMicrophone() {
    try {
        // Initialize audio context if not already (this also creates merger)
        if (!audioContext) {
            initAudioContext();
        }
        
        // Check if microphone should be routed to master output
        const shouldRoute = routeMicrophone.checked;
        
        // Use module to enable microphone
        micState = await enableMicrophoneModule(audioContext, merger, shouldRoute);
        micEnabled = true;
        
        // Update UI
        enableMicBtn.style.display = 'none';
        disableMicBtn.disabled = false;
        disableMicBtn.style.display = 'inline-block';
        micVolumeControl.style.display = 'flex';
        micMonitoring.style.display = 'block';
        micWaveformContainer.style.display = 'block';
        micRecordingSection.style.display = 'block';
        
        // Update vocoder/autotune visibility
        updateVocoderAutotuneVisibility();
        
        // Enable master recording button now that audio context is initialized
        if (recordBtn) {
            recordBtn.disabled = false;
        }
        
        // Start waveform visualization
        drawMicWaveform();
        
        console.log('Microphone enabled successfully');
    } catch (error) {
        console.error('Error enabling microphone:', error);
        alert(error.message || 'Could not access microphone. Please check your permissions.');
    }
}

// Disable microphone input
function disableMicrophone() {
    // Stop recording if active
    if (micRecordingState) {
        stopMicRecordingHandler();
    }
    
    if (micAnimationId) {
        cancelAnimationFrame(micAnimationId);
        micAnimationId = null;
    }
    
    // Clean up tab capture if it's active
    if (micTabCaptureStream) {
        micTabCaptureStream.getTracks().forEach(track => track.stop());
        micTabCaptureStream = null;
    }
    if (micTabCaptureSource) {
        try {
            micTabCaptureSource.disconnect();
        } catch (e) {
            console.log('Error disconnecting mic tab capture source:', e);
        }
        micTabCaptureSource = null;
    }
    
    if (micState) {
        // Only call disableMicrophoneModule if it's not a tab capture
        if (!micState.isTabCapture) {
            disableMicrophoneModule(micState);
        } else {
            // For tab capture, manually disconnect
            if (micState.micGain) {
                try {
                    micState.micGain.disconnect();
                } catch (e) {
                    console.log('Error disconnecting mic gain:', e);
                }
            }
        }
        micState = null;
    }
    
    micEnabled = false;
    
    // Disable autotune if enabled and using mic source
    if (autotuneEnabled && autotuneSource.value === 'mic') {
        disableAutotune();
    }
    
    // Disable vocoder if enabled and using mic as modulator
    if (vocoderEnabled && vocoderModulator.value === 'mic') {
        disableVocoder();
    }
    
    // Update UI
    enableMicBtn.style.display = 'inline-block';
    captureTabAudioMic.style.display = 'inline-block'; // Show tab capture button again
    disableMicBtn.style.display = 'none';
    micVolumeControl.style.display = 'none';
    micMonitoring.style.display = 'none';
    micWaveformContainer.style.display = 'none';
    micRecordingSection.style.display = 'none';
    micMonitorCheckbox.checked = false;
    
    // Update vocoder/autotune visibility based on remaining sources
    updateVocoderAutotuneVisibility();
    
    console.log('Microphone disabled');
}

// Capture tab audio as microphone input
async function captureTabAudioAsMic() {
    console.log('Capturing tab audio as microphone');
    
    try {
        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            alert('❌ Tab audio capture is not supported in your browser.\n\nPlease use Chrome, Edge, or another Chromium-based browser.');
            return;
        }
        
        // Request display media with audio
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true, // Required by some browsers even if we only want audio
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                channelCount: 2
            }
        });
        
        // Check if audio track exists
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            alert('❌ No audio was captured from the selected tab.\n\nMake sure to:\n1. Select a tab (not a window/screen)\n2. Check "Share audio" checkbox in the picker dialog\n3. Ensure the tab is playing audio');
            stream.getTracks().forEach(track => track.stop());
            return;
        }
        
        console.log(`Tab audio captured with ${audioTracks.length} audio track(s) for microphone`);
        
        // Disable regular microphone if it's enabled
        if (micEnabled) {
            disableMicrophone();
        }
        
        // Initialize audio context if not already
        if (!audioContext) {
            initAudioContext();
        }
        
        // Store the capture stream
        micTabCaptureStream = stream;
        micTabCaptureSource = audioContext.createMediaStreamSource(stream);
        
        // Use the microphone module to set up the audio routing
        // Create mic gain and analyser
        const micGain = audioContext.createGain();
        const micAnalyser = audioContext.createAnalyser();
        micAnalyser.fftSize = 2048;
        
        // Connect: tab capture source -> gain -> analyser -> merger
        micTabCaptureSource.connect(micGain);
        micGain.connect(micAnalyser);
        micGain.connect(merger);
        
        // Set initial volume
        micGain.gain.value = 1.0;
        
        // Store mic state
        micState = {
            micStream: stream,
            micSource: micTabCaptureSource,
            micGain: micGain,
            micAnalyser: micAnalyser,
            isTabCapture: true // Flag to indicate this is tab capture, not real mic
        };
        
        micEnabled = true;
        
        // Update UI
        enableMicBtn.style.display = 'none';
        captureTabAudioMic.style.display = 'none';
        disableMicBtn.style.display = 'inline-block';
        micVolumeControl.style.display = 'block';
        micMonitoring.style.display = 'none'; // Hide monitoring for tab capture (no feedback issue)
        micWaveformContainer.style.display = 'block';
        micRecordingSection.style.display = 'block';
        
        // Initialize waveform canvas if needed
        if (micWaveform) {
            const ctx = micWaveform.getContext('2d');
            micWaveform.width = micWaveform.offsetWidth;
            micWaveform.height = micWaveform.offsetHeight;
        }
        
        // Start waveform visualization
        drawMicWaveform();
        
        // Update vocoder/autotune visibility
        updateVocoderAutotuneVisibility();
        
        // Enable master recording button now that audio context is initialized
        if (recordBtn) {
            recordBtn.disabled = false;
        }
        
        // Handle when the stream ends (user stops sharing)
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            console.log('Tab capture ended for microphone');
            disableMicrophone();
            
            // Re-show the capture button
            enableMicBtn.style.display = 'inline-block';
            captureTabAudioMic.style.display = 'inline-block';
        });
        
        // Show success message
        alert(`✅ Tab audio is now streaming as microphone input!\n\n📢 Important: Control playback (play/pause) in the SOURCE TAB\n\nYou can:\n• Adjust volume with the mic volume slider\n• Use it with vocoder/autotune effects\n• Mix it using the crossfader\n\n⚠️ Note: Recording may not work with tab capture due to browser limitations. Use master output recording instead.\n\nClick "Disable Microphone" to stop.`);
        
    } catch (error) {
        console.error('Error capturing tab audio as mic:', error);
        
        if (error.name === 'NotAllowedError') {
            alert('❌ Permission denied.\n\nYou need to allow screen/tab sharing and make sure to check "Share audio" in the picker dialog.');
        } else if (error.name === 'NotFoundError') {
            alert('❌ No audio source found.\n\nMake sure the tab you selected is playing audio.');
        } else if (error.name === 'AbortError') {
            console.log('User cancelled tab selection');
        } else {
            alert(`❌ Error capturing tab audio: ${error.message}`);
        }
    }
}

// Draw microphone waveform
function drawMicWaveform() {
    if (!micState || !micEnabled) {
        return;
    }
    
    micAnimationId = drawMicWaveformModule(micWaveform, micState.micAnalyser, micEnabled);
}

// Update microphone volume
function updateMicVolumeWrapper(value) {
    if (micState && micState.micGain) {
        updateMicVolume(micState.micGain, value);
        micVolumeValue.textContent = `${value}%`;
    }
}

// Update vocoder/autotune section visibility based on available sources
function updateVocoderAutotuneVisibility() {
    // Show vocoder/autotune if microphone OR any track is available
    const hasAudioSource = micEnabled || source1 || source2;
    
    if (hasAudioSource) {
        vocoderSection.style.display = 'block';
        autotuneSection.style.display = 'block';
    } else {
        // Hide only if no sources are available
        vocoderSection.style.display = 'none';
        autotuneSection.style.display = 'none';
    }
}

// Toggle microphone monitoring (hearing yourself)
function toggleMicMonitoring(enabled) {
    if (!micState || !micState.micGain || !audioContext) return;
    
    if (enabled) {
        // Connect mic to destination (speakers)
        micState.micGain.connect(audioContext.destination);
    } else {
        // Disconnect from destination
        try {
            micState.micGain.disconnect(audioContext.destination);
        } catch (e) {
            // Already disconnected, ignore
        }
    }
}

// Start microphone recording
function startMicRecordingHandler() {
    if (!micState) {
        alert('Please enable microphone first!');
        return;
    }
    
    try {
        micRecordingState = startMicRecording(micState);
        
        // Update UI
        micRecordBtn.style.display = 'none';
        micStopBtn.disabled = false;
        micStopBtn.style.display = 'inline-block';
        micRecordingTime.style.display = 'inline-block';
        micRecordingWaveformContainer.style.display = 'block';
        micRecordingPlayback.style.display = 'none';
        
        // Start time display
        micRecordingInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - micRecordingState.startTime) / 1000);
            micRecordingTime.textContent = formatTime(elapsed);
        }, 100);
        
        // Start real-time waveform
        drawMicRecordingWaveform();
        
        console.log('Microphone recording started');
    } catch (error) {
        console.error('Error starting microphone recording:', error);
        
        let errorMessage = 'Could not start recording.';
        
        // Check if this is tab capture
        if (micState.isTabCapture) {
            errorMessage = '⚠️ Recording from tab capture is not supported in your browser.\n\n';
            errorMessage += 'Tab capture streams may use incompatible audio formats.\n\n';
            errorMessage += 'Workarounds:\n';
            errorMessage += '• Use the regular microphone for recording\n';
            errorMessage += '• Record the master output instead\n';
            errorMessage += '• Try a different browser (Chrome/Edge work best)';
        } else {
            errorMessage = error.message || errorMessage;
        }
        
        alert(errorMessage);
    }
}

// Stop microphone recording
async function stopMicRecordingHandler() {
    if (!micRecordingState) {
        return;
    }
    
    try {
        // Stop recording
        const blob = await stopMicRecording(micRecordingState);
        
        // Stop waveform animation
        if (micRecordingAnimationId) {
            cancelAnimationFrame(micRecordingAnimationId);
            micRecordingAnimationId = null;
        }
        
        // Stop time display
        if (micRecordingInterval) {
            clearInterval(micRecordingInterval);
            micRecordingInterval = null;
        }
        
        // Create playback URL
        const url = URL.createObjectURL(blob);
        micRecordingAudio.src = url;
        
        // Decode and draw final waveform
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                drawWaveformSimple(micRecordingWaveform, audioBuffer, '#ff0064');
            } catch (err) {
                console.error('Error decoding recorded audio:', err);
            }
        };
        reader.readAsArrayBuffer(blob);
        
        // Update UI
        micStopBtn.style.display = 'none';
        micRecordBtn.style.display = 'inline-block';
        micRecordingTime.style.display = 'none';
        micRecordingPlayback.style.display = 'block';
        
        console.log('Microphone recording stopped');
    } catch (error) {
        console.error('Error stopping microphone recording:', error);
        alert(error.message || 'Could not stop recording');
    }
}

// Draw real-time microphone recording waveform
function drawMicRecordingWaveform() {
    if (!micState || !micState.micAnalyser) {
        return;
    }
    
    const canvas = micRecordingWaveform;
    const analyser = micState.micAnalyser;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        micRecordingAnimationId = requestAnimationFrame(draw);
        
        analyser.getByteTimeDomainData(dataArray);
        
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

// Export microphone recording
async function exportMicRecording(format) {
    if (!micRecordingState || !micRecordingState.blob) {
        alert('No recording available to export');
        return;
    }
    
    try {
        let exportBlob = micRecordingState.blob;
        let filename = `mic-recording-${Date.now()}.webm`;
        
        if (format === 'wav' || format === 'mp3') {
            // Read the webm blob and decode it
            const arrayBuffer = await micRecordingState.blob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            if (format === 'wav') {
                // Convert to WAV
                const { audioBufferToWav } = await import('./modules/recording.js');
                const wavArrayBuffer = audioBufferToWav(audioBuffer);
                exportBlob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
                filename = `mic-recording-${Date.now()}.wav`;
            } else if (format === 'mp3') {
                // Convert to MP3
                const { audioBufferToMp3 } = await import('./modules/recording.js');
                const mp3Blob = audioBufferToMp3(audioBuffer);
                exportBlob = mp3Blob;
                filename = `mic-recording-${Date.now()}.mp3`;
            }
        }
        
        // Download the file
        const url = URL.createObjectURL(exportBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Microphone recording exported as ${format.toUpperCase()}`);
    } catch (error) {
        console.error('Error exporting microphone recording:', error);
        alert(`Could not export as ${format.toUpperCase()}: ${error.message}`);
    }
}

// Load microphone recording to a track
async function loadMicRecordingToTrack(trackNumber) {
    if (!micRecordingState || !micRecordingState.blob) {
        alert('No recording available to load');
        return;
    }
    
    try {
        // Create a File object from the blob with a proper name
        const filename = `mic-recording-${Date.now()}.webm`;
        const file = new File([micRecordingState.blob], filename, { type: 'audio/webm' });
        
        // Determine which track to load into
        const audioFile = trackNumber === 1 ? audioFile1 : audioFile2;
        const fileName = trackNumber === 1 ? fileName1 : fileName2;
        
        // Create a FileList-like object (DataTransfer is the standard way)
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // Set the files on the input element
        audioFile.files = dataTransfer.files;
        
        // Display the filename
        fileName.textContent = filename;
        
        // Trigger the change event to load the file
        const event = new Event('change', { bubbles: true });
        audioFile.dispatchEvent(event);
        
        console.log(`Microphone recording loaded to Track ${trackNumber}`);
        
        // Show success message
        const trackName = trackNumber === 1 ? 'Track 1' : 'Track 2';
        alert(`✅ Microphone recording loaded to ${trackName}!`);
        
    } catch (error) {
        console.error('Error loading microphone recording to track:', error);
        alert(`Could not load to track: ${error.message}`);
    }
}

// Capture audio from another browser tab
async function captureTabAudio(trackNumber) {
    console.log(`Capturing tab audio for Track ${trackNumber}`);
    
    try {
        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            alert('❌ Tab audio capture is not supported in your browser.\n\nPlease use Chrome, Edge, or another Chromium-based browser.');
            return;
        }
        
        // Request display media with audio
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true, // Required by some browsers even if we only want audio
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                channelCount: 2
            }
        });
        
        // Check if audio track exists
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            alert('❌ No audio was captured from the selected tab.\n\nMake sure to:\n1. Select a tab (not a window/screen)\n2. Check "Share audio" checkbox in the picker dialog\n3. Ensure the tab is playing audio');
            stream.getTracks().forEach(track => track.stop());
            return;
        }
        
        console.log(`Tab audio captured with ${audioTracks.length} audio track(s)`);
        
        // Initialize audio context if not already
        if (!audioContext) {
            initAudioContext();
        }
        
        // Determine which track we're loading to
        const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
        const fileName = trackNumber === 1 ? fileName1 : fileName2;
        const playBtn = trackNumber === 1 ? playBtn1 : playBtn2;
        const pauseBtn = trackNumber === 1 ? pauseBtn1 : pauseBtn2;
        const stopBtn = trackNumber === 1 ? stopBtn1 : stopBtn2;
        const loopBtn = trackNumber === 1 ? loopBtn1 : loopBtn2;
        const reverseLoopBtn = trackNumber === 1 ? reverseLoopBtn1 : reverseLoopBtn2;
        const clearLoopBtn = trackNumber === 1 ? clearLoopBtn1 : clearLoopBtn2;
        const exportStem = trackNumber === 1 ? exportStem1 : exportStem2;
        
        // Stop any existing tab capture for this track
        if (trackNumber === 1) {
            if (tabCaptureStream1) {
                tabCaptureStream1.getTracks().forEach(track => track.stop());
            }
            if (tabCaptureSource1) {
                try {
                    tabCaptureSource1.disconnect();
                } catch (e) {
                    console.log('Error disconnecting tab capture source 1:', e);
                }
            }
            
            // Store stream and create audio source
            tabCaptureStream1 = stream;
            tabCaptureSource1 = audioContext.createMediaStreamSource(stream);
            
            // Disconnect existing source if it exists
            if (source1) {
                try {
                    source1.disconnect();
                } catch (e) {
                    console.log('Error disconnecting existing source1:', e);
                }
            }
            
            // Use the tab capture source as the main source
            source1 = tabCaptureSource1;
            
        } else {
            if (tabCaptureStream2) {
                tabCaptureStream2.getTracks().forEach(track => track.stop());
            }
            if (tabCaptureSource2) {
                try {
                    tabCaptureSource2.disconnect();
                } catch (e) {
                    console.log('Error disconnecting tab capture source 2:', e);
                }
            }
            
            // Store stream and create audio source
            tabCaptureStream2 = stream;
            tabCaptureSource2 = audioContext.createMediaStreamSource(stream);
            
            // Disconnect existing source if it exists
            if (source2) {
                try {
                    source2.disconnect();
                } catch (e) {
                    console.log('Error disconnecting existing source2:', e);
                }
            }
            
            // Use the tab capture source as the main source
            source2 = tabCaptureSource2;
        }
        
        // Connect the source to the effect chain
        if (trackNumber === 1) {
            // Ensure effect nodes exist
            if (!gain1) {
                console.log('Creating effect chain for Track 1');
                const effects = initAudioEffects(audioContext, 1);
                gain1 = effects.gain;
                panner1 = effects.panner;
                reverb1 = effects.reverb.convolver;
                reverbWet1 = effects.reverb.wet;
                delay1 = effects.delay.node;
                delayWet1 = effects.delay.wet;
                filter1 = effects.filter;
                adsr1 = effects.adsr;
                
                // Use the proper connectEffectsChain function to set up audio routing
                const { reverbMix: reverbMix1, finalMix: fm1 } = connectEffectsChain(
                    source1,
                    effects,
                    merger,
                    audioContext
                );
                
                // Store finalMix1 globally
                finalMix1 = fm1;
                console.log('Track 1 effect chain created and connected to merger');
            } else {
                // Connect to existing chain  
                console.log('Tab capture: Reusing existing effect chain for Track 1');
                console.log('  gain1 exists:', !!gain1);
                console.log('  finalMix1 exists:', !!finalMix1);
                
                // If effects exist but finalMix1 doesn't, the chain was initialized but not connected
                // This happens when initAudioContext() creates effects but no file was loaded yet
                if (!finalMix1) {
                    console.warn('⚠️ Effect nodes exist but finalMix1 is missing - completing the chain');
                    
                    // Build the effects object from existing nodes
                    // Note: reverb1 and delay1 might be objects or just nodes depending on how they were created
                    const effects = {
                        gain: gain1,
                        panner: panner1,
                        filter: filter1,
                        reverb: reverb1.convolver ? reverb1 : { convolver: reverb1, wet: reverbWet1, dry: null },
                        delay: delay1.node ? delay1 : { node: delay1, wet: delayWet1, dry: null },
                        adsr: adsr1
                    };
                    
                    // Use connectEffectsChain to properly set up the full routing
                    const { finalMix: fm1 } = connectEffectsChain(
                        source1,
                        effects,
                        merger,
                        audioContext
                    );
                    
                    finalMix1 = fm1;
                    console.log('✅ Track 1 effect chain completed and connected to merger');
                } else {
                    // finalMix1 exists, just connect source
                    source1.connect(gain1);
                    console.log('✅ Track 1 source connected to existing chain (finalMix1 already connected to merger)');
                }
            }
        } else {
            // Ensure effect nodes exist
            if (!gain2) {
                console.log('Creating effect chain for Track 2');
                const effects = initAudioEffects(audioContext, 2);
                gain2 = effects.gain;
                panner2 = effects.panner;
                reverb2 = effects.reverb.convolver;
                reverbWet2 = effects.reverb.wet;
                delay2 = effects.delay.node;
                delayWet2 = effects.delay.wet;
                filter2 = effects.filter;
                adsr2 = effects.adsr;
                
                // Use the proper connectEffectsChain function to set up audio routing
                const { reverbMix: reverbMix2, finalMix: fm2 } = connectEffectsChain(
                    source2,
                    effects,
                    merger,
                    audioContext
                );
                
                // Store finalMix2 globally
                finalMix2 = fm2;
                console.log('Track 2 effect chain created and connected to merger');
            } else {
                // Connect to existing chain
                console.log('Tab capture: Reusing existing effect chain for Track 2');
                console.log('  gain2 exists:', !!gain2);
                console.log('  finalMix2 exists:', !!finalMix2);
                
                // If effects exist but finalMix2 doesn't, the chain was initialized but not connected
                if (!finalMix2) {
                    console.warn('⚠️ Effect nodes exist but finalMix2 is missing - completing the chain');
                    
                    // Build the effects object from existing nodes
                    const effects = {
                        gain: gain2,
                        panner: panner2,
                        filter: filter2,
                        reverb: reverb2.convolver ? reverb2 : { convolver: reverb2, wet: reverbWet2, dry: null },
                        delay: delay2.node ? delay2 : { node: delay2, wet: delayWet2, dry: null },
                        adsr: adsr2
                    };
                    
                    // Use connectEffectsChain to properly set up the full routing
                    const { finalMix: fm2 } = connectEffectsChain(
                        source2,
                        effects,
                        merger,
                        audioContext
                    );
                    
                    finalMix2 = fm2;
                    console.log('✅ Track 2 effect chain completed and connected to merger');
                } else {
                    // finalMix2 exists, just connect source
                    source2.connect(gain2);
                    console.log('✅ Track 2 source connected to existing chain (finalMix2 already connected to merger)');
                }
            }
        }
        
        // Update UI
        fileName.textContent = '🎵 Tab Audio (Live)';
        
        // Enable playback controls for better UX
        // Note: These control the visualization/mixing, user still needs to control source tab manually
        playBtn.disabled = false; // Enable for starting/resuming visualization
        playBtn.title = 'Start processing (Control playback in source tab)';
        pauseBtn.disabled = false; // Enable for pausing visualization
        pauseBtn.title = 'Pause processing (Control playback in source tab)';
        stopBtn.disabled = false; // Stop will disconnect the tab capture
        stopBtn.title = 'Stop tab capture';
        loopBtn.disabled = true;
        reverseLoopBtn.disabled = true;
        clearLoopBtn.disabled = true;
        exportStem.disabled = true; // Can't export live stream directly
        
        // Store reference to help with playback control hints
        const tabCaptureState = {
            isTabCapture: true,
            stream: stream,
            trackNumber: trackNumber
        };
        
        // Store state for this track
        if (trackNumber === 1) {
            window.tabCaptureState1 = tabCaptureState;
        } else {
            window.tabCaptureState2 = tabCaptureState;
        }
        
        // Note: Volume, tempo, pan, filter, reverb, delay sliders are NOT disabled
        // They work perfectly with live tab capture!
        
        // Initialize visualization if needed
        if (!scene) {
            initThreeJS();
            initOscilloscope();
            createCircleVisualization();
        }
        
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
        
        // Start visualization
        if (!animationId) {
            animate();
        }
        
        // Handle when the stream ends (user stops sharing)
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            console.log(`Tab capture ended for Track ${trackNumber}`);
            fileName.textContent = 'Tab capture ended';
            
            // Disconnect source
            if (trackNumber === 1 && source1) {
                try {
                    source1.disconnect();
                } catch (e) {
                    console.log('Error disconnecting source:', e);
                }
                source1 = null;
                tabCaptureSource1 = null;
                tabCaptureStream1 = null;
            } else if (trackNumber === 2 && source2) {
                try {
                    source2.disconnect();
                } catch (e) {
                    console.log('Error disconnecting source:', e);
                }
                source2 = null;
                tabCaptureSource2 = null;
                tabCaptureStream2 = null;
            }
            
            // Disable controls
            stopBtn.disabled = true;
        });
        
        // Enable master recording button now that audio context is initialized
        if (recordBtn) {
            recordBtn.disabled = false;
        }
        
        // Show success message
        const trackName = trackNumber === 1 ? 'Track 1' : 'Track 2';
        alert(`✅ Tab audio is now streaming to ${trackName}!\n\n📢 Important: Control playback (play/pause) in the SOURCE TAB\n\n• The audio streams through your track effects in real-time\n• Adjust volume, pan, filter, reverb, delay here in Browser Jockey\n• Use Play/Pause in the source tab to control the audio\n• Click Stop here to end the capture`);

        
        // Check dual track buttons state
        checkDualTrackButtonsState();
        
        // Update vocoder/autotune visibility
        updateVocoderAutotuneVisibility();
        
    } catch (error) {
        console.error('Error capturing tab audio:', error);
        
        if (error.name === 'NotAllowedError') {
            alert('❌ Permission denied.\n\nYou need to allow screen/tab sharing and make sure to check "Share audio" in the picker dialog.');
        } else if (error.name === 'NotFoundError') {
            alert('❌ No audio source found.\n\nMake sure the tab you selected is playing audio.');
        } else if (error.name === 'AbortError') {
            console.log('User cancelled tab selection');
        } else {
            alert(`❌ Error capturing tab audio: ${error.message}`);
        }
    }
}

// Enable vocoder effect
function enableVocoder() {
    // Initialize audio context if not already (this also creates merger)
    if (!audioContext) {
        initAudioContext();
    }
    
    if (!merger) {
        alert('Audio output not initialized. Please reload the page.');
        return;
    }
    
    // Get modulator source
    const modulatorType = vocoderModulator.value;
    let modulatorSource = null;
    
    if (modulatorType === 'mic') {
        if (!micEnabled || !micState || !micState.micGain) {
            alert('Please enable microphone first to use it as modulator!');
            return;
        }
        // Verify micGain is a valid audio node
        if (typeof micState.micGain.connect !== 'function') {
            alert('Microphone audio node is invalid. Please disable and re-enable the microphone.');
            return;
        }
        // Use micGain for modulator (includes volume control and can connect to multiple destinations)
        modulatorSource = micState.micGain;
    } else if (modulatorType === 'track1') {
        if (!source1) {
            alert('Please load Track 1 first to use it as modulator!');
            return;
        }
        modulatorSource = gain1;
    } else if (modulatorType === 'track2') {
        if (!source2) {
            alert('Please load Track 2 first to use it as modulator!');
            return;
        }
        modulatorSource = gain2;
    }
    
    if (!modulatorSource) {
        alert('Please select a valid modulator source!');
        return;
    }
    
    // Check if carrier source is available
    const carrier = vocoderCarrier.value;
    
    // Validate carrier availability
    if (carrier === 'track1' && !source1) {
        alert('Please load Track 1 to use it as carrier!');
        return;
    }
    if (carrier === 'track2' && !source2) {
        alert('Please load Track 2 to use it as carrier!');
        return;
    }
    if (carrier === 'mix' && !source1 && !source2) {
        alert('Please load at least one track to use mix as carrier!');
        return;
    }
    if (carrier === 'mic' && !micEnabled) {
        alert('Please enable the microphone to use it as carrier!');
        return;
    }
    
    try {
        // Get carrier source based on selection
        let carrierSourceForVocoder;
        if (carrier === 'mic' && modulatorType === 'mic' && micState) {
            // For mic-to-mic feedback, both use micGain (same node connected to both modulator and carrier)
            carrierSourceForVocoder = micState.micGain;
            console.log('Using micGain for both modulator and carrier (mic-to-mic feedback)');
        } else {
            carrierSourceForVocoder = getVocoderCarrierSource(carrier, gain1, gain2, micState ? micState.micGain : null, audioContext);
            console.log(`Got carrier source for: ${carrier}`, carrierSourceForVocoder);
        }
        
        if (!carrierSourceForVocoder) {
            throw new Error(`Unable to get carrier source for: ${carrier}`);
        }
        
        console.log(`Enabling vocoder - Modulator: ${modulatorType}, Carrier: ${carrier}, Bands: ${vocoderBandsSlider.value}`);
        
        // Get number of bands
        const numBands = parseInt(vocoderBandsSlider.value);
        
        // Use module to enable vocoder
        vocoderState = enableVocoderModule(
            audioContext,
            modulatorSource,
            carrierSourceForVocoder,
            merger,
            numBands
        );
        
        // Disconnect modulator from direct output if it's the mic
        if (modulatorType === 'mic' && micState) {
            try {
                micState.micGain.disconnect(merger);
            } catch (e) {
                // Already disconnected
            }
        }
        
        // Set initial mix level
        const mixValue = parseInt(vocoderMixSlider.value);
        updateVocoderMix(vocoderState.vocoderOutputGain, mixValue);
        
        vocoderEnabled = true;
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Update UI
        enableVocoderBtn.style.display = 'none';
        disableVocoderBtn.disabled = false;
        disableVocoderBtn.style.display = 'inline-block';
        vocoderSettings.style.display = 'flex';
        vocoderMixValue.textContent = `${mixValue}%`;
        
        console.log(`Vocoder enabled with ${numBands} bands (Modulator: ${modulatorType}, Carrier: ${carrier})`);
    } catch (error) {
        console.error('Error enabling vocoder:', error);
        alert(error.message || 'Error enabling vocoder. Please try again.');
    }
}

// Disable vocoder effect
function disableVocoder() {
    if (!vocoderEnabled || !vocoderState) return;
    
    try {
        // Use module to disable vocoder
        disableVocoderModule(vocoderState);
        
        // Reconnect modulator directly to merger if it was the mic
        const modulatorType = vocoderModulator.value;
        if (modulatorType === 'mic' && micState && micState.micGain && merger) {
            micState.micGain.connect(merger);
        }
        
        vocoderState = null;
        vocoderEnabled = false;
        
        // Update UI
        enableVocoderBtn.style.display = 'inline-block';
        disableVocoderBtn.style.display = 'none';
        vocoderSettings.style.display = 'none';
        
        console.log('Vocoder disabled');
    } catch (error) {
        console.error('Error disabling vocoder:', error);
    }
}

// Update vocoder modulator source
function updateVocoderModulator() {
    if (!vocoderEnabled) return;
    
    // Disable and re-enable to rebuild with new modulator
    disableVocoder();
    setTimeout(() => enableVocoder(), 100);
}

// Update vocoder carrier source
function updateVocoderCarrier() {
    if (!vocoderEnabled) return;
    
    // Disable and re-enable to rebuild with new carrier
    disableVocoder();
    setTimeout(() => enableVocoder(), 100);
}

// Update vocoder mix (dry/wet)
function updateVocoderMixWrapper(value) {
    if (vocoderState && vocoderState.vocoderOutputGain) {
        updateVocoderMix(vocoderState.vocoderOutputGain, value);
        vocoderMixValue.textContent = `${value}%`;
    }
}

// Update number of vocoder bands
function updateVocoderBandsCount(value) {
    vocoderBandsValue.textContent = value;
    
    if (vocoderEnabled) {
        // Rebuild vocoder with new band count
        disableVocoder();
        setTimeout(() => enableVocoder(), 100);
    }
}

// Enable auto-tune effect
function enableAutotune() {
    // Initialize audio context if not already (this also creates merger)
    if (!audioContext) {
        initAudioContext();
    }
    
    if (!merger) {
        alert('Audio output not initialized. Please reload the page.');
        return;
    }
    
    // Get audio source
    const sourceType = autotuneSource.value;
    let audioSource = null;
    
    if (sourceType === 'mic') {
        if (!micEnabled || !micState || !micState.micGain) {
            alert('Please enable microphone first to use it with auto-tune!');
            return;
        }
        audioSource = micState.micGain;
    } else if (sourceType === 'track1') {
        if (!gain1) {
            alert('Please load Track 1 first to use it with auto-tune!');
            return;
        }
        audioSource = gain1;
    } else if (sourceType === 'track2') {
        if (!gain2) {
            alert('Please load Track 2 first to use it with auto-tune!');
            return;
        }
        audioSource = gain2;
    }
    
    if (!audioSource) {
        alert('Please select a valid audio source!');
        return;
    }
    
    try {
        // Get strength value
        const strength = parseInt(autotuneStrengthSlider.value);
        
        console.log(`Enabling auto-tune with source: ${sourceType}, strength: ${strength}%`);
        
        // Use module to enable autotune
        autotuneState = enableAutotuneModule(audioContext, audioSource, merger, strength);
        
        // Disconnect source from direct path
        try {
            if (!vocoderEnabled || sourceType !== 'mic') {
                audioSource.disconnect(merger);
            }
        } catch (e) {
            // Already disconnected
        }
        
        autotuneEnabled = true;
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Start pitch correction loop
        correctPitch();
        
        // Update UI
        enableAutotuneBtn.style.display = 'none';
        disableAutotuneBtn.disabled = false;
        disableAutotuneBtn.style.display = 'inline-block';
        autotuneSettings.style.display = 'flex';
        
        console.log(`Auto-tune enabled on ${sourceType}`);
    } catch (error) {
        console.error('Error enabling auto-tune:', error);
        alert(error.message || 'Error enabling auto-tune. Please try again.');
    }
}

// Disable auto-tune effect
function disableAutotune() {
    if (!autotuneEnabled || !autotuneState) return;
    
    try {
        // Use module to disable autotune
        disableAutotuneModule(autotuneState);
        
        // Reconnect source directly based on source type
        const sourceType = autotuneSource.value;
        if (sourceType === 'mic' && micState && micState.micGain && merger && !vocoderEnabled) {
            micState.micGain.connect(merger);
        } else if (sourceType === 'track1' && gain1 && merger) {
            gain1.connect(merger);
        } else if (sourceType === 'track2' && gain2 && merger) {
            gain2.connect(merger);
        }
        
        autotuneState = null;
        autotuneEnabled = false;
        
        // Update UI
        enableAutotuneBtn.style.display = 'inline-block';
        disableAutotuneBtn.style.display = 'none';
        autotuneSettings.style.display = 'none';
        
        console.log('Auto-tune disabled');
    } catch (error) {
        console.error('Error disabling auto-tune:', error);
    }
}

// Pitch correction loop
function correctPitch() {
    if (!autotuneEnabled || !autotuneState || !autotuneState.autotuneAnalyser) return;
    
    const bufferLength = autotuneState.autotuneAnalyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    autotuneState.autotuneAnalyser.getFloatTimeDomainData(dataArray);
    
    // Detect pitch using autocorrelation
    const detectedFreq = autoCorrelate(dataArray, audioContext.sampleRate);
    
    if (detectedFreq > 0) {
        // Get target note based on key and scale
        const targetFreq = getNearestNoteFrequency(detectedFreq);
        const pitchShift = Math.log2(targetFreq / detectedFreq);
        
        // Apply pitch shift to all shifters (simplified)
        const speed = parseInt(autotuneSpeedSlider.value);
        const smoothing = speed / 1000; // Convert to seconds
        
        pitchShifters.forEach((shifter, i) => {
            const semitoneOffset = (i - 6) / 12; // Spread shifters across octave
            const shiftAmount = pitchShift + semitoneOffset;
            
            // Use delay time modulation for pitch shifting
            const delayTime = 0.02 * Math.pow(2, -shiftAmount);
            shifter.delay.delayTime.setTargetAtTime(
                Math.max(0.001, Math.min(0.5, delayTime)),
                audioContext.currentTime,
                smoothing
            );
            
            // Adjust gain for formant preservation
            const gainValue = Math.exp(-Math.abs(semitoneOffset) * 2) / pitchShifters.length;
            shifter.gain.gain.setTargetAtTime(gainValue, audioContext.currentTime, smoothing);
        });
    }
    
    // Continue loop
    setTimeout(() => correctPitch(), 20); // 50Hz update rate
}

// Autocorrelation for pitch detection
function autoCorrelate(buffer, sampleRate) {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;
    
    // Calculate RMS
    for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);
    
    // Not enough signal
    if (rms < 0.01) return -1;
    
    // Find the best correlation
    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;
        
        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs(buffer[i] - buffer[i + offset]);
        }
        
        correlation = 1 - (correlation / MAX_SAMPLES);
        
        if (correlation > 0.9 && correlation > lastCorrelation) {
            const foundGoodCorrelation = correlation > best_correlation;
            if (foundGoodCorrelation) {
                best_correlation = correlation;
                best_offset = offset;
            }
        }
        
        lastCorrelation = correlation;
    }
    
    if (best_offset === -1) return -1;
    
    return sampleRate / best_offset;
}

// Get nearest note frequency based on key and scale
function getNearestNoteFrequency(frequency) {
    const key = autotuneKey.value;
    const scale = autotuneScale.value;
    const scaleIntervals = musicScales[scale];
    
    // Get root note frequency (noteFrequencies has .freq property)
    const rootFreq = noteFrequencies[key].freq;
    
    // Find nearest note in scale
    const semitones = 12 * Math.log2(frequency / rootFreq);
    const octave = Math.floor(semitones / 12);
    const noteInOctave = Math.round(semitones) % 12;
    
    // Snap to scale
    let closestInterval = scaleIntervals[0];
    let minDistance = Math.abs(noteInOctave - closestInterval);
    
    scaleIntervals.forEach(interval => {
        const distance = Math.abs(noteInOctave - interval);
        if (distance < minDistance) {
            minDistance = distance;
            closestInterval = interval;
        }
    });
    
    // Calculate target frequency
    const targetSemitones = octave * 12 + closestInterval;
    return rootFreq * Math.pow(2, targetSemitones / 12);
}

// Update auto-tune correction speed
function updateAutotuneSpeed(value) {
    autotuneSpeedValue.textContent = `${value}ms`;
}

// Update auto-tune strength
function updateAutotuneStrengthWrapper(value) {
    autotuneStrengthValue.textContent = `${value}%`;
    
    if (autotuneState && autotuneState.dryGain && autotuneState.wetGain) {
        updateAutotuneStrength(autotuneState.dryGain, autotuneState.wetGain, value);
    }
}

// Update auto-tune source
function updateAutotuneSource() {
    if (!autotuneEnabled) return;
    
    // Disable and re-enable to rebuild with new source
    disableAutotune();
    setTimeout(() => enableAutotune(), 100);
}

// Master Routing Functions
function toggleTrackRouting(trackNumber, enabled) {
    const gain = trackNumber === 1 ? gain1 : gain2;
    
    if (!gain || !merger) {
        console.warn(`Track ${trackNumber} or merger not initialized`);
        return;
    }
    
    try {
        if (enabled) {
            // Connect track to merger
            gain.connect(merger);
            console.log(`Track ${trackNumber} routed to master`);
        } else {
            // Disconnect track from merger
            gain.disconnect(merger);
            console.log(`Track ${trackNumber} disconnected from master`);
        }
    } catch (error) {
        console.error(`Error toggling Track ${trackNumber} routing:`, error);
        // Reconnect on error
        if (enabled) {
            try {
                gain.connect(merger);
            } catch (e) {
                // Already connected or other error
            }
        }
    }
}

function toggleSamplerRouting(enabled) {
    if (!samplerGain || !merger) {
        console.warn('Sampler or merger not initialized');
        return;
    }
    
    try {
        if (enabled) {
            // Connect sampler to merger
            samplerGain.connect(merger);
            console.log('Sampler routed to master');
        } else {
            // Disconnect sampler from merger
            samplerGain.disconnect(merger);
            console.log('Sampler disconnected from master');
        }
    } catch (error) {
        console.error('Error toggling sampler routing:', error);
        // Reconnect on error
        if (enabled) {
            try {
                samplerGain.connect(merger);
            } catch (e) {
                // Already connected or other error
            }
        }
    }
}

function toggleMicRouting(enabled) {
    if (!micState || !micState.micGain || !merger) {
        console.warn('Microphone or merger not initialized');
        return;
    }
    
    try {
        if (enabled) {
            // Connect microphone to merger
            micState.micGain.connect(merger);
            console.log('Microphone routed to master');
        } else {
            // Disconnect microphone from merger
            micState.micGain.disconnect(merger);
            console.log('Microphone disconnected from master');
        }
    } catch (error) {
        console.error('Error toggling microphone routing:', error);
        // Reconnect on error
        if (enabled) {
            try {
                micState.micGain.connect(merger);
            } catch (e) {
                // Already connected or other error
            }
        }
    }
}

function toggleThereminRouting(enabled) {
    const thereminGain = getThereminRoutingGain();
    
    if (!thereminGain || !merger) {
        console.warn('Theremin or merger not initialized');
        return;
    }
    
    try {
        if (enabled) {
            // Connect theremin to merger
            thereminGain.connect(merger);
            console.log('Theremin routed to master');
        } else {
            // Disconnect theremin from merger
            thereminGain.disconnect(merger);
            console.log('Theremin disconnected from master');
        }
    } catch (error) {
        console.error('Error toggling theremin routing:', error);
        // Reconnect on error
        if (enabled) {
            try {
                thereminGain.connect(merger);
            } catch (e) {
                // Already connected or other error
            }
        }
    }
}

// Keyboard Sampler Functions
async function loadSamplerSource() {
    samplerSource = samplerSourceSelect.value;
    
    if (samplerSource === 'none') {
        samplerAudioBuffer = null;
        enableSamplerBtn.disabled = true;
        return;
    }
    
    try {
        let audioBuffer;
        
        if (samplerSource === 'track1' || samplerSource === 'track1-loop') {
            if (!audioElement1.src) {
                alert('Track 1 not loaded');
                samplerSourceSelect.value = 'none';
                return;
            }
            
            // Get audio buffer from Track 1
            if (zoomState1.audioBuffer) {
                audioBuffer = zoomState1.audioBuffer;
                
                // If loop mode, extract loop region
                if (samplerSource === 'track1-loop' && loopState1.enabled && loopState1.start !== null && loopState1.end !== null) {
                    const duration = audioBuffer.duration;
                    const startSample = Math.floor(loopState1.start * audioBuffer.sampleRate);
                    const endSample = Math.floor(loopState1.end * audioBuffer.sampleRate);
                    const loopLength = endSample - startSample;
                    
                    // Create new buffer with just the loop
                    const loopBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        loopLength,
                        audioBuffer.sampleRate
                    );
                    
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const sourceData = audioBuffer.getChannelData(channel);
                        const loopData = loopBuffer.getChannelData(channel);
                        for (let i = 0; i < loopLength; i++) {
                            loopData[i] = sourceData[startSample + i];
                        }
                    }
                    
                    audioBuffer = loopBuffer;
                }
            }
        } else if (samplerSource === 'track2' || samplerSource === 'track2-loop') {
            if (!audioElement2.src) {
                alert('Track 2 not loaded');
                samplerSourceSelect.value = 'none';
                return;
            }
            
            if (zoomState2.audioBuffer) {
                audioBuffer = zoomState2.audioBuffer;
                
                // If loop mode, extract loop region
                if (samplerSource === 'track2-loop' && loopState2.enabled && loopState2.start !== null && loopState2.end !== null) {
                    const startSample = Math.floor(loopState2.start * audioBuffer.sampleRate);
                    const endSample = Math.floor(loopState2.end * audioBuffer.sampleRate);
                    const loopLength = endSample - startSample;
                    
                    // Create new buffer with just the loop
                    const loopBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        loopLength,
                        audioBuffer.sampleRate
                    );
                    
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const sourceData = audioBuffer.getChannelData(channel);
                        const loopData = loopBuffer.getChannelData(channel);
                        for (let i = 0; i < loopLength; i++) {
                            loopData[i] = sourceData[startSample + i];
                        }
                    }
                    
                    audioBuffer = loopBuffer;
                }
            }
        } else if (samplerSource === 'recording') {
            if (!recordedBlob) {
                alert('No recording available');
                samplerSourceSelect.value = 'none';
                return;
            }
            
            // Decode recording blob
            const arrayBuffer = await recordedBlob.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        }
        
        samplerAudioBuffer = audioBuffer;
        enableSamplerBtn.disabled = false;
        console.log('Sampler source loaded:', samplerSource, 'Duration:', audioBuffer.duration);
        
    } catch (error) {
        console.error('Error loading sampler source:', error);
        alert('Error loading sampler source: ' + error.message);
        samplerSourceSelect.value = 'none';
        samplerAudioBuffer = null;
        enableSamplerBtn.disabled = true;
    }
}

// === Sampler Functions (wrappers for module functions) ===

function enableSamplerWrapper() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    samplerScale = samplerScaleSelect.value;
    samplerRoot = samplerRootSelect.value;
    
    const samplerElements = {
        enableBtn: enableSamplerBtn,
        disableBtn: disableSamplerBtn,
        keyboardVisual: keyboardVisual,
        sourceSelect: samplerSourceSelect
    };
    
    const samplerState = {
        enabled: samplerEnabled,
        scale: samplerScale,
        root: samplerRoot
    };
    
    const success = enableSampler(samplerAudioBuffer, audioContext, samplerElements, samplerState);
    if (success) {
        samplerEnabled = true;
    }
}

function disableSamplerWrapper() {
    const samplerElements = {
        enableBtn: enableSamplerBtn,
        disableBtn: disableSamplerBtn,
        keyboardVisual: keyboardVisual,
        sourceSelect: samplerSourceSelect
    };
    
    const samplerState = {
        enabled: samplerEnabled
    };
    
    disableSampler(activeKeys, samplerElements, samplerState);
    samplerEnabled = false;
}

function playSamplerNoteWrapper(scaleIndex, isUpperOctave = false) {
    playSamplerNote(
        samplerAudioBuffer,
        scaleIndex,
        isUpperOctave,
        samplerScale,
        samplerRoot,
        samplerVolume,
        audioContext,
        recordingDestination,
        noteNames,
        samplerADSREnabled,
        samplerADSRParams
    );
}

// Keyboard event handlers using module
function handleKeyDown(event) {
    samplerHandleKeyDown(event, samplerEnabled, activeKeys, playSamplerNoteWrapper);
}

function handleKeyUp(event) {
    samplerHandleKeyUp(event, samplerEnabled, activeKeys);
}

// === Audio Analysis & Waveform Functions ===
// Note: These functions are imported from modules but kept here as local wrappers
// or kept due to specific local dependencies

// Load audio file and draw waveform (uses module functions)
async function loadAudioFile(file, canvas, bpmDisplay, audioElement, zoomState, keyDisplay) {
    console.log('loadAudioFile called with:', { file: file.name, canvas, bpmDisplay, audioElement, zoomState, keyDisplay });
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('Got arrayBuffer:', arrayBuffer.byteLength, 'bytes');
    
    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
    console.log('Decoded audio:', audioBuffer.duration, 'seconds');
    
    // Store audio buffer for zoom
    if (zoomState) {
        zoomState.audioBuffer = audioBuffer;
        zoomState.level = 1.0;
        zoomState.offset = 0.0;
    }
    
    // Determine which track based on canvas element
    const trackNumber = canvas === waveform1 ? 1 : 2;
    const color = trackNumber === 1 ? waveformColors.track1 : waveformColors.track2;
    
    console.log('Drawing waveform...');
    drawWaveform(canvas, audioBuffer, 1.0, 0.0, color);
    console.log('Waveform drawn');
    
    console.log('Detecting BPM...');
    const bpm = detectBPM(audioBuffer);
    console.log('BPM detected:', bpm);
    bpmDisplay.textContent = bpm > 0 ? bpm : '--';
    
    console.log('Detecting key...');
    const key = detectKey(audioBuffer);
    console.log('Key detected:', key);
    if (keyDisplay) {
        keyDisplay.textContent = key;
    }
    
    tempContext.close();
    console.log('loadAudioFile completed successfully');
}

// Detect musical key from real-time frequency data (wrapper for module function)
function detectMusicalKey() {
    if (!analyser || !dataArray) return;
    
    const detectedNote = detectMusicalKeyFromFrequency(analyser, dataArray, audioContext);
    
    if (detectedNote && detectedNote !== currentKey) {
        currentKey = detectedNote;
        currentKeyColor = noteFrequencies[detectedNote].color;
        updateVisualizationColors();
    }
}

// Update visualization colors based on detected key
function updateVisualizationColors() {
    const baseHue = currentKeyColor.h;
    visualizationObjects.forEach((obj, i) => {
        const hueOffset = (i / visualizationObjects.length) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        obj.material.color.setHSL(hue / 360, 1, 0.5);
        obj.material.emissive.setHSL(hue / 360, 1, 0.3);
    });
}

// Handle effect chain changes
function handleEffectChainChange(event) {
    const { trackNumber, effects } = event.detail;
    console.log(`Effect chain changed for track ${trackNumber}:`, effects);
    
    // When the effect chain changes, we need to reconnect the audio routing
    // For now, we'll just log it. The actual reconnection would require
    // disconnecting and reconnecting the audio nodes in the new order.
    // This is a complex operation that would need careful management of the audio graph.
    
    // TODO: Implement dynamic audio graph reconnection based on effect order
    // For the current implementation, the effect chain UI shows the order
    // but the actual audio processing still follows the fixed order.
    // To make it fully functional, we would need to:
    // 1. Disconnect all current connections
    // 2. Reconnect in the new order specified by the effect chain
    // 3. Ensure proper wet/dry mixing for each effect
}

// === Audio Context & Effects Initialization ===

// Initialize audio context and connect both tracks
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        // Create mixer gain node to combine both stereo tracks
        // Using a GainNode instead of ChannelMerger because both tracks output stereo
        merger = audioContext.createGain();
        merger.gain.value = 1.0;
        
        // Create destination for recording
        recordingDestination = audioContext.createMediaStreamDestination();
        
        // Create analyser for recording visualization
        recordingAnalyser = audioContext.createAnalyser();
        recordingAnalyser.fftSize = 2048;
        recordingAnalyser.smoothingTimeConstant = 0.8;
        
        // Initialize master effects
        const effectsMaster = initAudioEffects(audioContext, 'Master');
        gainMaster = effectsMaster.gain;
        pannerMaster = effectsMaster.panner;
        reverbMaster = effectsMaster.reverb;
        delayMaster = effectsMaster.delay;
        filterMaster = effectsMaster.filter;
        adsrMaster = effectsMaster.adsr;
        
        // Connect merger to master effects chain
        // merger -> filterMaster -> pannerMaster -> reverbMaster -> delayMaster -> gainMaster -> analyser/destination
        merger.connect(filterMaster);
        filterMaster.connect(pannerMaster);
        
        // Reverb path
        pannerMaster.connect(reverbMaster.convolver);
        reverbMaster.convolver.connect(reverbMaster.wet);
        pannerMaster.connect(reverbMaster.dry);
        
        const reverbMixMaster = audioContext.createGain();
        reverbMaster.wet.connect(reverbMixMaster);
        reverbMaster.dry.connect(reverbMixMaster);
        
        // Delay path
        reverbMixMaster.connect(delayMaster.node);
        delayMaster.node.connect(delayMaster.wet);
        reverbMixMaster.connect(delayMaster.dry);
        
        const finalMixMaster = audioContext.createGain();
        delayMaster.wet.connect(finalMixMaster);
        delayMaster.dry.connect(finalMixMaster);
        
        // Master gain (volume control)
        finalMixMaster.connect(gainMaster);
        
        // Connect master chain to outputs
        gainMaster.connect(analyser);
        gainMaster.connect(recordingDestination);
        gainMaster.connect(recordingAnalyser);
        analyser.connect(audioContext.destination);
        
        // Connect oscilloscope to merger if it exists
        connectOscilloscopeToMerger();
        
        // Initialize effects for both tracks using module
        const effects1 = initAudioEffects(audioContext, 1);
        gain1 = effects1.gain;
        panner1 = effects1.panner;
        reverb1 = effects1.reverb;
        delay1 = effects1.delay;
        filter1 = effects1.filter;
        adsr1 = effects1.adsr;
        
        const effects2 = initAudioEffects(audioContext, 2);
        gain2 = effects2.gain;
        panner2 = effects2.panner;
        reverb2 = effects2.reverb;
        delay2 = effects2.delay;
        filter2 = effects2.filter;
        adsr2 = effects2.adsr;
        
        // Initialize effect chain managers
        effectChain1 = new EffectChain(1, audioContext);
        effectChain2 = new EffectChain(2, audioContext);
        effectChainMaster = new EffectChain('Master', audioContext);
        
        // Listen for effect chain changes
        document.addEventListener('effectChainChanged', handleEffectChainChange);
    }
    
    // Connect track 1 if it exists and isn't already connected
    if (audioElement1.src && !source1) {
        source1 = audioContext.createMediaElementSource(audioElement1);
        
        // Effects chain for Track 1:
        // source1 -> gain1 -> panner1 -> filter1 -> reverb (wet/dry) -> delay (wet/dry) -> merger
        
        source1.connect(gain1);
        gain1.connect(panner1);
        panner1.connect(filter1);
        
        // Reverb path: filter1 -> reverb -> reverbWet --\
        filter1.connect(reverb1.convolver);                // |
        reverb1.convolver.connect(reverb1.wet);            // |
                                                            // v
        // Dry path: filter1 -> reverbDry ---------------> merge point
        filter1.connect(reverb1.dry);                       //
                                                            //
        // Merge reverb wet and dry                         //
        const reverbMix1 = audioContext.createGain();       //
        reverb1.wet.connect(reverbMix1);                    //
        reverb1.dry.connect(reverbMix1);                    //
        
        // Delay path: reverbMix1 -> delay -> delayWet --\
        reverbMix1.connect(delay1.node);                    // |
        delay1.node.connect(delay1.wet);                    // |
                                                            // v
        // Dry path: reverbMix1 -> delayDry -------------> final merge
        reverbMix1.connect(delay1.dry);                     //
                                                            //
        // Final merge and connect to mixer - use global finalMix1
        if (!finalMix1) {
            finalMix1 = audioContext.createGain();
        }
        delay1.wet.connect(finalMix1);                      //
        delay1.dry.connect(finalMix1);                      //
        
        finalMix1.connect(merger);
        console.log('Track 1 file connected to effect chain and merger');
    }
    
    // Connect track 2 if it exists and isn't already connected
    if (audioElement2.src && !source2) {
        source2 = audioContext.createMediaElementSource(audioElement2);
        
        // Effects chain for Track 2 (same as Track 1)
        source2.connect(gain2);
        gain2.connect(panner2);
        panner2.connect(filter2);
        
        filter2.connect(reverb2.convolver);
        reverb2.convolver.connect(reverb2.wet);
        filter2.connect(reverb2.dry);
        
        const reverbMix2 = audioContext.createGain();
        reverb2.wet.connect(reverbMix2);
        reverb2.dry.connect(reverbMix2);
        
        reverbMix2.connect(delay2.node);
        delay2.node.connect(delay2.wet);
        reverbMix2.connect(delay2.dry);
        
        // Final merge and connect to mixer - use global finalMix2
        if (!finalMix2) {
            finalMix2 = audioContext.createGain();
        }
        delay2.wet.connect(finalMix2);
        delay2.dry.connect(finalMix2);
        
        finalMix2.connect(merger);
        console.log('Track 2 file connected to effect chain and merger');
    }
}

// Initialize Three.js
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.z = 50;
    camera.position.y = 10;
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight2.position.set(-20, -20, 20);
    scene.add(pointLight2);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);
    
    createParticleSystem();
    
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
    
    let mouseX = 0, mouseY = 0;
    container.addEventListener('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;
        cameraRotation.x = mouseY * 0.3;
        cameraRotation.y = mouseX * 0.3;
        
        mouse.x = mouseX;
        mouse.y = mouseY;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(visualizationObjects);
        container.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    });
    
    container.addEventListener('click', onVisualizerClick);
}

// Initialize Oscilloscope
function initOscilloscope() {
    oscilloscopeCanvas = document.getElementById('oscilloscope');
    if (!oscilloscopeCanvas) {
        console.error('Oscilloscope canvas not found');
        return;
    }
    
    oscilloscopeCtx = oscilloscopeCanvas.getContext('2d');
    
    // Set canvas size to match container
    const container = document.getElementById('oscilloscope-container');
    if (container) {
        oscilloscopeCanvas.width = container.offsetWidth;
        oscilloscopeCanvas.height = container.offsetHeight - 50; // Account for header
    }
    
    // Create analyser for oscilloscope only if audioContext exists
    if (audioContext && !oscilloscopeAnalyser) {
        oscilloscopeAnalyser = audioContext.createAnalyser();
        oscilloscopeAnalyser.fftSize = 2048;
        oscilloscopeAnalyser.smoothingTimeConstant = 0.3;
        
        // Connect to merger if available
        connectOscilloscopeToMerger();
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const container = document.getElementById('oscilloscope-container');
        if (container && oscilloscopeCanvas) {
            oscilloscopeCanvas.width = container.offsetWidth;
            oscilloscopeCanvas.height = container.offsetHeight - 50;
        }
    });
    
    // Start drawing if not already started
    if (!oscilloscopeAnimationId) {
        drawOscilloscope();
    }
}

// Connect oscilloscope to the audio merger
function connectOscilloscopeToMerger() {
    if (audioContext && !oscilloscopeAnalyser) {
        oscilloscopeAnalyser = audioContext.createAnalyser();
        oscilloscopeAnalyser.fftSize = 2048;
        oscilloscopeAnalyser.smoothingTimeConstant = 0.3;
    }
    
    if (oscilloscopeAnalyser && merger) {
        try {
            merger.connect(oscilloscopeAnalyser);
            console.log('Oscilloscope connected to audio merger');
        } catch (e) {
            console.error('Error connecting oscilloscope to merger:', e);
        }
    }
}

// Draw oscilloscope waveform
function drawOscilloscope() {
    oscilloscopeAnimationId = requestAnimationFrame(drawOscilloscope);
    
    if (!oscilloscopeCtx || !oscilloscopeCanvas) {
        return;
    }
    
    const width = oscilloscopeCanvas.width;
    const height = oscilloscopeCanvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas with slight trail effect for motion blur
    oscilloscopeCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    oscilloscopeCtx.fillRect(0, 0, width, height);
    
    // Draw grid centered at (0,0)
    oscilloscopeCtx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    oscilloscopeCtx.lineWidth = 1;
    
    // Horizontal grid lines
    const gridLines = 8;
    for (let i = 0; i <= gridLines; i++) {
        oscilloscopeCtx.beginPath();
        const y = (height / gridLines) * i;
        oscilloscopeCtx.moveTo(0, y);
        oscilloscopeCtx.lineTo(width, y);
        oscilloscopeCtx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= gridLines; i++) {
        oscilloscopeCtx.beginPath();
        const x = (width / gridLines) * i;
        oscilloscopeCtx.moveTo(x, 0);
        oscilloscopeCtx.lineTo(x, height);
        oscilloscopeCtx.stroke();
    }
    
    // Draw center axes (0,0) with brighter lines
    oscilloscopeCtx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    oscilloscopeCtx.lineWidth = 2;
    
    // Y-axis (vertical center line)
    oscilloscopeCtx.beginPath();
    oscilloscopeCtx.moveTo(centerX, 0);
    oscilloscopeCtx.lineTo(centerX, height);
    oscilloscopeCtx.stroke();
    
    // X-axis (horizontal center line)
    oscilloscopeCtx.beginPath();
    oscilloscopeCtx.moveTo(0, centerY);
    oscilloscopeCtx.lineTo(width, centerY);
    oscilloscopeCtx.stroke();
    
    // Draw origin marker
    oscilloscopeCtx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    oscilloscopeCtx.beginPath();
    oscilloscopeCtx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    oscilloscopeCtx.fill();
    
    // Only draw waveform if analyser exists
    if (!oscilloscopeAnalyser) {
        // Draw a small dot at center when no audio is playing
        oscilloscopeCtx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        oscilloscopeCtx.shadowBlur = 10;
        oscilloscopeCtx.shadowColor = '#00ffff';
        oscilloscopeCtx.beginPath();
        oscilloscopeCtx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        oscilloscopeCtx.fill();
        oscilloscopeCtx.shadowBlur = 0;
        return;
    }
    
    const bufferLength = oscilloscopeAnalyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    oscilloscopeAnalyser.getByteTimeDomainData(dataArray);
    
    // XY Mode: Plot samples as (x, y) coordinates
    // Use alternating samples for X and Y to create Lissajous-like patterns
    oscilloscopeCtx.lineWidth = 2;
    
    // Create dynamic gradient based on position
    const gradient = oscilloscopeCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) / 2);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(0.5, '#00ffff');
    gradient.addColorStop(1, '#ff00ff');
    
    oscilloscopeCtx.strokeStyle = gradient;
    oscilloscopeCtx.shadowBlur = 8;
    oscilloscopeCtx.shadowColor = '#00ffff';
    
    oscilloscopeCtx.beginPath();
    
    // Plot in XY mode - use phase offset for interesting patterns
    const scale = Math.min(width, height) * 0.4; // Scale to fit canvas
    const phaseOffset = Math.floor(bufferLength / 8); // Phase offset for more complex patterns
    
    for (let i = 0; i < bufferLength - phaseOffset; i += 2) {
        // Convert from 0-255 range to -1 to 1 range, centered at 0
        const x = ((dataArray[i] - 128) / 128.0) * scale;
        const y = ((dataArray[i + phaseOffset] - 128) / 128.0) * scale;
        
        // Map to canvas coordinates with (0,0) at center
        const canvasX = centerX + x;
        const canvasY = centerY + y;
        
        if (i === 0) {
            oscilloscopeCtx.moveTo(canvasX, canvasY);
        } else {
            oscilloscopeCtx.lineTo(canvasX, canvasY);
        }
    }
    
    oscilloscopeCtx.stroke();
    
    // Add some glow points for extra effect
    oscilloscopeCtx.shadowBlur = 15;
    for (let i = 0; i < bufferLength - phaseOffset; i += 32) {
        const x = ((dataArray[i] - 128) / 128.0) * scale;
        const y = ((dataArray[i + phaseOffset] - 128) / 128.0) * scale;
        const canvasX = centerX + x;
        const canvasY = centerY + y;
        
        // Vary color based on position
        const hue = ((i / bufferLength) * 120 + 180) % 360;
        oscilloscopeCtx.fillStyle = `hsla(${hue}, 100%, 50%, 0.6)`;
        oscilloscopeCtx.beginPath();
        oscilloscopeCtx.arc(canvasX, canvasY, 2, 0, Math.PI * 2);
        oscilloscopeCtx.fill();
    }
    
    // Reset shadow
    oscilloscopeCtx.shadowBlur = 0;
}

// Handle clicks on visualization objects
function onVisualizerClick(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;
    
    console.log('Click detected! Mouse:', mouse.x, mouse.y);
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(visualizationObjects);
    
    console.log('Intersects:', intersects.length, 'objects');
    
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        console.log('Clicked object:', clickedObject.userData.index);
        
        if (selectedObject && selectedObject !== clickedObject) {
            selectedObject.userData.isSelected = false;
        }
        
        clickedObject.userData.isSelected = !clickedObject.userData.isSelected;
        selectedObject = clickedObject.userData.isSelected ? clickedObject : null;
        
        console.log('Selected:', clickedObject.userData.isSelected);
        
        if (clickedObject.userData.isSelected) {
            clickedObject.userData.explosionForce = 1.5;
            clickedObject.userData.explosionTime = Date.now();
            clickedObject.userData.spinBoost = 0.3;
            
            console.log('Explosion triggered!');
            
            const hue = Math.random() * 360;
            clickedObject.material.color.setHSL(hue / 360, 1, 0.5);
            clickedObject.material.emissive.setHSL(hue / 360, 1, 0.3);
            
            visualizationObjects.forEach((obj) => {
                if (obj !== clickedObject) {
                    const distance = clickedObject.position.distanceTo(obj.position);
                    if (distance < 15) {
                        const delay = distance * 20;
                        setTimeout(() => {
                            obj.userData.rippleForce = 0.3 * (1 - distance / 15);
                        }, delay);
                    }
                }
            });
        }
    }
}

// Create particle system for background
function createParticleSystem() {
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;
        
        colors[i] = Math.random();
        colors[i + 1] = Math.random();
        colors[i + 2] = Math.random();
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

// Clear visualization
function clearVisualization() {
    visualizationObjects.forEach(obj => scene.remove(obj));
    visualizationObjects = [];
}

// Visualization creation functions (same as before)
function createCircleVisualization() {
    clearVisualization();
    const numBars = 128;
    const radius = 20;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numBars; i++) {
        const randomHeight = 0.8 + Math.random() * 0.4;
        const geometry = new THREE.BoxGeometry(0.5, 1 * randomHeight, 0.5);
        const hueOffset = (i / numBars) * 120 - 60;
        const hue = Math.round((baseHue + hueOffset + 360) % 360);
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 100,
            transparent: true,
            opacity: 0.85 + Math.random() * 0.15
        });
        const bar = new THREE.Mesh(geometry, material);
        
        const angle = (i / numBars) * Math.PI * 2;
        bar.position.x = Math.cos(angle) * radius;
        bar.position.z = Math.sin(angle) * radius;
        bar.rotation.y = -angle;
        bar.userData = { 
            angle: angle, 
            baseX: Math.cos(angle) * radius,
            baseZ: Math.sin(angle) * radius,
            targetScale: 1,
            velocity: 0,
            rotationSpeed: 0,
            index: i,
            randomPhase: Math.random() * Math.PI * 2,
            randomSpeed: 0.8 + Math.random() * 0.4,
            randomAmplitude: 0.7 + Math.random() * 0.6,
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(bar);
        visualizationObjects.push(bar);
    }
}

function createBarsVisualization() {
    clearVisualization();
    const numBars = 64;
    const spacing = 1.2;
    const startX = -(numBars * spacing) / 2;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numBars; i++) {
        const randomWidth = 0.8 + Math.random() * 0.4;
        const randomDepth = 0.8 + Math.random() * 0.4;
        const geometry = new THREE.BoxGeometry(randomWidth, 1, randomDepth);
        const hueOffset = (i / numBars) * 120 - 60;
        const hue = Math.round((baseHue + hueOffset + 360) % 360);
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 80 + Math.random() * 40,
            transparent: true,
            opacity: 0.85 + Math.random() * 0.15
        });
        const bar = new THREE.Mesh(geometry, material);
        
        bar.position.x = startX + i * spacing;
        bar.position.y = 0;
        bar.userData = { 
            targetScale: 1, 
            pulsePhase: i * 0.1 + Math.random() * 0.5,
            baseX: startX + i * spacing,
            velocity: 0,
            rotationVelocity: 0,
            tiltX: 0,
            tiltZ: 0,
            index: i,
            randomBounce: 0.7 + Math.random() * 0.6,
            randomSpin: 0.5 + Math.random() * 1.0,
            randomWave: Math.random() * Math.PI * 2,
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(bar);
        visualizationObjects.push(bar);
    }
}

function createSphereVisualization() {
    clearVisualization();
    const numSpheres = 100;
    const radius = 25;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numSpheres; i++) {
        const randomSize = 0.3 + Math.random() * 0.4;
        const geometry = new THREE.SphereGeometry(randomSize, 16, 16);
        const hueOffset = (i / numSpheres) * 120 - 60;
        const hue = Math.round((baseHue + hueOffset + 360) % 360);
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 50 + Math.random() * 100,
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        const phi = Math.acos(1 - 2 * (i + 0.5) / numSpheres);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        
        const radiusVariation = radius * (0.9 + Math.random() * 0.2);
        sphere.position.x = Math.cos(theta) * Math.sin(phi) * radiusVariation;
        sphere.position.y = Math.sin(theta) * Math.sin(phi) * radiusVariation;
        sphere.position.z = Math.cos(phi) * radiusVariation;
        
        sphere.userData = { 
            baseX: sphere.position.x,
            baseY: sphere.position.y,
            baseZ: sphere.position.z,
            targetScale: 0.5,
            pulseSpeed: 0.015 + Math.random() * 0.04,
            rotationSpeed: (Math.random() - 0.5) * 0.08,
            velocity: 0,
            index: i,
            randomFloat: Math.random() * Math.PI * 2,
            randomOrbit: (Math.random() - 0.5) * 0.02,
            randomGlow: 0.5 + Math.random() * 0.5,
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(sphere);
        visualizationObjects.push(sphere);
    }
}

// Tab capture button handlers
if (captureTabAudio1) {
    captureTabAudio1.addEventListener('click', () => captureTabAudio(1));
}

if (captureTabAudio2) {
    captureTabAudio2.addEventListener('click', () => captureTabAudio(2));
}

// File upload handlers for Track 1
audioFile1.addEventListener('change', async (e) => {
    console.log('Track 1 file upload triggered');
    const file = e.target.files[0];
    if (file) {
        console.log('Track 1 file selected:', file.name, file.type, file.size);
        
        // Clean up tab capture if Track 1 is currently capturing
        if (window.tabCaptureState1 && window.tabCaptureState1.isTabCapture) {
            console.log('Cleaning up tab capture on Track 1 before loading new file');
            
            // Stop the tab capture stream
            if (tabCaptureStream1) {
                tabCaptureStream1.getTracks().forEach(track => track.stop());
                tabCaptureStream1 = null;
            }
            
            // Disconnect the tab capture source
            if (tabCaptureSource1) {
                try {
                    tabCaptureSource1.disconnect();
                } catch (e) {
                    console.log('Error disconnecting tab capture source:', e);
                }
                tabCaptureSource1 = null;
            }
            
            // Disconnect existing source1
            if (source1) {
                try {
                    source1.disconnect();
                } catch (e) {
                    console.log('Error disconnecting source1:', e);
                }
                source1 = null;
            }
            
            // Clear tab capture state
            window.tabCaptureState1 = null;
            console.log('✅ Track 1 tab capture cleaned up');
        }
        
        // Remember if track was playing
        const wasPlaying = !audioElement1.paused;
        const currentTime = audioElement1.currentTime;
        
        const url = URL.createObjectURL(file);
        audioElement1.src = url;
        fileName1.textContent = file.name;
        
        // Set MIME type for better browser compatibility
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'oga': 'audio/ogg',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
            'aiff': 'audio/aiff',
            'aif': 'audio/aiff',
            'opus': 'audio/opus',
            'webm': 'audio/webm',
            'wma': 'audio/x-ms-wma',
            'mp4': 'video/mp4'
        };
        
        if (mimeTypes[fileExtension]) {
            audioElement1.type = mimeTypes[fileExtension];
        }
        
        // Add error handler for unsupported formats
        audioElement1.addEventListener('error', function(e) {
            let errorMessage = 'Error loading audio file for playback. ';
            if (audioElement1.error) {
                switch (audioElement1.error.code) {
                    case audioElement1.error.MEDIA_ERR_DECODE:
                        errorMessage += 'The audio file format is not supported by your browser for playback.\n\n';
                        errorMessage += 'FLAC files may not play in Safari or some browsers.\n';
                        errorMessage += 'Try converting to MP3, WAV, or OGG format for better compatibility.';
                        break;
                    case audioElement1.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage += 'The audio format or MIME type is not supported.\n\n';
                        errorMessage += 'Try converting to MP3, WAV, or OGG format.';
                        break;
                    case audioElement1.error.MEDIA_ERR_NETWORK:
                        errorMessage += 'Network error occurred.';
                        break;
                    case audioElement1.error.MEDIA_ERR_ABORTED:
                        errorMessage += 'Playback was aborted.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                        break;
                }
            }
            alert('⚠️ Track 1: ' + errorMessage);
            console.error('Track 1 audio error:', audioElement1.error);
        }, { once: true });
        
        playBtn1.disabled = false;
        pauseBtn1.disabled = false;
        stopBtn1.disabled = false;
        loopBtn1.disabled = false;
        reverseLoopBtn1.disabled = false;
        clearLoopBtn1.disabled = false;
        exportStem1.disabled = false;
        recordBtn.disabled = false;
        
        // Load and draw waveform
        try {
            await loadAudioFile(file, waveform1, bpm1Display, audioElement1, zoomState1, key1Display);
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('⚠️ Error analyzing audio file: ' + error.message + '\n\nThe file will still play, but waveform/BPM/key detection may not work.');
        }
        
        if (!scene) {
            initThreeJS();
            initOscilloscope();
            createCircleVisualization();
        }
        
        if (placeholder && !audioElement2.src) {
            placeholder.classList.add('hidden');
        }
        
        // Don't set source1 to null - it will be created/reused automatically when play is clicked
        // If audioContext exists but source1 doesn't, create it now
        if (audioContext && !source1 && audioElement1.src) {
            console.log('Creating MediaElementSource for Track 1 after file load');
            try {
                source1 = audioContext.createMediaElementSource(audioElement1);
                
                // Connect to the effects chain
                source1.connect(gain1);
                gain1.connect(panner1);
                panner1.connect(filter1);
                
                filter1.connect(reverb1.convolver);
                reverb1.convolver.connect(reverb1.wet);
                filter1.connect(reverb1.dry);
                
                const reverbMix1 = audioContext.createGain();
                reverb1.wet.connect(reverbMix1);
                reverb1.dry.connect(reverbMix1);
                
                reverbMix1.connect(delay1.node);
                delay1.node.connect(delay1.wet);
                reverbMix1.connect(delay1.dry);
                
                const finalMix1 = audioContext.createGain();
                delay1.wet.connect(finalMix1);
                delay1.dry.connect(finalMix1);
                
                finalMix1.connect(merger);
                
                console.log('Track 1 audio source connected successfully');
            } catch (err) {
                console.error('Error creating MediaElementSource for Track 1:', err);
            }
        }
        
        // Check if both tracks are loaded to enable dual buttons
        checkDualTrackButtonsState();
        
        // Update vocoder/autotune visibility now that track is available
        updateVocoderAutotuneVisibility();
    }
});

// File upload handlers for Track 2
audioFile2.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        console.log('Track 2 file selected:', file.name);
        
        // Clean up tab capture if Track 2 is currently capturing
        if (window.tabCaptureState2 && window.tabCaptureState2.isTabCapture) {
            console.log('Cleaning up tab capture on Track 2 before loading new file');
            
            // Stop the tab capture stream
            if (tabCaptureStream2) {
                tabCaptureStream2.getTracks().forEach(track => track.stop());
                tabCaptureStream2 = null;
            }
            
            // Disconnect the tab capture source
            if (tabCaptureSource2) {
                try {
                    tabCaptureSource2.disconnect();
                } catch (e) {
                    console.log('Error disconnecting tab capture source:', e);
                }
                tabCaptureSource2 = null;
            }
            
            // Disconnect existing source2
            if (source2) {
                try {
                    source2.disconnect();
                } catch (e) {
                    console.log('Error disconnecting source2:', e);
                }
                source2 = null;
            }
            
            // Clear tab capture state
            window.tabCaptureState2 = null;
            console.log('✅ Track 2 tab capture cleaned up');
        }
        
        const url = URL.createObjectURL(file);
        audioElement2.src = url;
        fileName2.textContent = file.name;
        
        // Set MIME type for better browser compatibility
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const mimeTypes = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',
            'oga': 'audio/ogg',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
            'aiff': 'audio/aiff',
            'aif': 'audio/aiff',
            'opus': 'audio/opus',
            'webm': 'audio/webm',
            'wma': 'audio/x-ms-wma',
            'mp4': 'video/mp4'
        };
        
        if (mimeTypes[fileExtension]) {
            audioElement2.type = mimeTypes[fileExtension];
        }
        
        // Add error handler for unsupported formats
        audioElement2.addEventListener('error', function(e) {
            let errorMessage = 'Error loading audio file for playback. ';
            if (audioElement2.error) {
                switch (audioElement2.error.code) {
                    case audioElement2.error.MEDIA_ERR_DECODE:
                        errorMessage += 'The audio file format is not supported by your browser for playback.\n\n';
                        errorMessage += 'FLAC files may not play in Safari or some browsers.\n';
                        errorMessage += 'Try converting to MP3, WAV, or OGG format for better compatibility.';
                        break;
                    case audioElement2.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage += 'The audio format or MIME type is not supported.\n\n';
                        errorMessage += 'Try converting to MP3, WAV, or OGG format.';
                        break;
                    case audioElement2.error.MEDIA_ERR_NETWORK:
                        errorMessage += 'Network error occurred.';
                        break;
                    case audioElement2.error.MEDIA_ERR_ABORTED:
                        errorMessage += 'Playback was aborted.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                        break;
                }
            }
            alert('⚠️ Track 2: ' + errorMessage);
            console.error('Track 2 audio error:', audioElement2.error);
        }, { once: true });
        
        // Enable all buttons
        console.log('Enabling Track 2 buttons...');
        playBtn2.disabled = false;
        pauseBtn2.disabled = false;
        stopBtn2.disabled = false;
        loopBtn2.disabled = false;
        reverseLoopBtn2.disabled = false;
        clearLoopBtn2.disabled = false;
        exportStem2.disabled = false;
        recordBtn.disabled = false;
        console.log('Track 2 buttons enabled:', {
            play: !playBtn2.disabled,
            pause: !pauseBtn2.disabled,
            stop: !stopBtn2.disabled
        });
        
        // Load and draw waveform
        try {
            await loadAudioFile(file, waveform2, bpm2Display, audioElement2, zoomState2, key2Display);
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('⚠️ Error analyzing audio file: ' + error.message + '\n\nThe file will still play, but waveform/BPM/key detection may not work.');
        }
        
        if (!scene) {
            initThreeJS();
            initOscilloscope();
            createCircleVisualization();
        }
        
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
        
        // Don't set source2 to null - it will be created/reused automatically when play is clicked
        // If audioContext exists but source2 doesn't, create it now
        if (audioContext && !source2 && audioElement2.src) {
            console.log('Creating MediaElementSource for Track 2 after file load');
            try {
                source2 = audioContext.createMediaElementSource(audioElement2);
                
                // Connect to the effects chain
                source2.connect(gain2);
                gain2.connect(panner2);
                panner2.connect(filter2);
                
                filter2.connect(reverb2.convolver);
                reverb2.convolver.connect(reverb2.wet);
                filter2.connect(reverb2.dry);
                
                const reverbMix2 = audioContext.createGain();
                reverb2.wet.connect(reverbMix2);
                reverb2.dry.connect(reverbMix2);
                
                reverbMix2.connect(delay2.node);
                delay2.node.connect(delay2.wet);
                reverbMix2.connect(delay2.dry);
                
                const finalMix2 = audioContext.createGain();
                delay2.wet.connect(finalMix2);
                delay2.dry.connect(finalMix2);
                
                finalMix2.connect(merger);
                
                console.log('Track 2 audio source connected successfully');
            } catch (err) {
                console.error('Error creating MediaElementSource for Track 2:', err);
            }
        }
        
        // Check if both tracks are loaded to enable dual buttons
        checkDualTrackButtonsState();
        
        // Update vocoder/autotune visibility now that track is available
        updateVocoderAutotuneVisibility();
    }
});

// Waveform click for Track 1 - set loop points or seek
waveform1.parentElement.addEventListener('click', (e) => {
    // Don't handle click if we were dragging
    if (zoomState1.isDragging) {
        zoomState1.isDragging = false;
        return;
    }
    
    // Don't set loop points if clicking on markers
    if (e.target.classList.contains('loop-marker')) return;
    
    // Check if duration is valid before proceeding
    if (!audioElement1.duration || isNaN(audioElement1.duration) || !isFinite(audioElement1.duration)) {
        console.warn('Cannot set loop markers: audio duration not yet available');
        return;
    }
    
    const rect = waveform1.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    // Adjust for zoom: map click position to actual time considering zoom and offset
    const visibleDuration = audioElement1.duration / zoomState1.level;
    const startTime = zoomState1.offset * audioElement1.duration;
    const time = startTime + (percentage * visibleDuration);
    
    // If a marker is active, move it to clicked position
    if (activeMarker1 && loopState1.enabled) {
        if (activeMarker1 === 'start') {
            loopState1.start = Math.min(time, loopState1.end || audioElement1.duration);
            loopMarkerStart1.style.filter = ''; // Remove highlight
            console.log('Track 1 Start marker moved to:', formatTime(time));
        } else if (activeMarker1 === 'end') {
            loopState1.end = Math.max(time, loopState1.start || 0);
            loopMarkerEnd1.style.filter = ''; // Remove highlight
            console.log('Track 1 End marker moved to:', formatTime(time));
        }
        activeMarker1 = null; // Deactivate after moving
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
        return;
    }
    
    if (loopState1.enabled) {
        // Setting loop points
        if (loopState1.settingPoint === 'start') {
            loopState1.start = time;
            loopState1.settingPoint = 'end';
            console.log('Loop start set at:', formatTime(time));
        } else {
            loopState1.end = time;
            loopState1.settingPoint = 'start';
            
            // Ensure start < end
            if (loopState1.start > loopState1.end) {
                [loopState1.start, loopState1.end] = [loopState1.end, loopState1.start];
            }
            console.log('Loop end set at:', formatTime(time));
            // Enable export loop button when both points are set
            exportLoop1.disabled = false;
        }
        
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
    } else {
        // Regular seek
        if (audioElement1.duration) {
            audioElement1.currentTime = time;
        }
    }
});

// Waveform drag for Track 1 (pan when zoomed)
waveform1.parentElement.addEventListener('mousedown', (e) => {
    if (zoomState1.level > 1 && !e.target.classList.contains('loop-marker')) {
        zoomState1.isDragging = true;
        zoomState1.dragStartX = e.clientX;
        zoomState1.dragStartOffset = zoomState1.offset;
        waveform1.parentElement.style.cursor = 'grabbing';
        e.preventDefault();
    }
});

waveform1.parentElement.addEventListener('mousemove', (e) => {
    if (zoomState1.isDragging && zoomState1.level > 1) {
        const rect = waveform1.getBoundingClientRect();
        const deltaX = e.clientX - zoomState1.dragStartX;
        const deltaPercent = -(deltaX / rect.width) / zoomState1.level;
        
        zoomState1.offset = Math.max(0, Math.min(1 - (1 / zoomState1.level), zoomState1.dragStartOffset + deltaPercent));
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display, 1, waveformColors);
        updateLoopMarkersAfterZoom(1);
    }
});

waveform1.parentElement.addEventListener('mouseup', () => {
    if (zoomState1.isDragging) {
        setTimeout(() => {
            zoomState1.isDragging = false;
            waveform1.parentElement.style.cursor = zoomState1.level > 1 ? 'grab' : 'pointer';
        }, 10);
    }
});

waveform1.parentElement.addEventListener('mouseleave', () => {
    if (zoomState1.isDragging) {
        zoomState1.isDragging = false;
        waveform1.parentElement.style.cursor = zoomState1.level > 1 ? 'grab' : 'pointer';
    }
});

// Waveform click for Track 2 - set loop points or seek
waveform2.parentElement.addEventListener('click', (e) => {
    // Don't handle click if we were dragging
    if (zoomState2.isDragging) {
        zoomState2.isDragging = false;
        return;
    }
    
    // Don't set loop points if clicking on markers
    if (e.target.classList.contains('loop-marker')) return;
    
    // Check if duration is valid before proceeding
    if (!audioElement2.duration || isNaN(audioElement2.duration) || !isFinite(audioElement2.duration)) {
        console.warn('Cannot set loop markers: audio duration not yet available');
        return;
    }
    
    const rect = waveform2.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    // Adjust for zoom: map click position to actual time considering zoom and offset
    const visibleDuration = audioElement2.duration / zoomState2.level;
    const startTime = zoomState2.offset * audioElement2.duration;
    const time = startTime + (percentage * visibleDuration);
    
    // If a marker is active, move it to clicked position
    if (activeMarker2 && loopState2.enabled) {
        if (activeMarker2 === 'start') {
            loopState2.start = Math.min(time, loopState2.end || audioElement2.duration);
            loopMarkerStart2.style.filter = ''; // Remove highlight
            console.log('Track 2 Start marker moved to:', formatTime(time));
        } else if (activeMarker2 === 'end') {
            loopState2.end = Math.max(time, loopState2.start || 0);
            loopMarkerEnd2.style.filter = ''; // Remove highlight
            console.log('Track 2 End marker moved to:', formatTime(time));
        }
        activeMarker2 = null; // Deactivate after moving
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
        return;
    }
    
    if (loopState2.enabled) {
        // Setting loop points
        if (loopState2.settingPoint === 'start') {
            loopState2.start = time;
            loopState2.settingPoint = 'end';
            console.log('Loop start set at:', formatTime(time));
        } else {
            loopState2.end = time;
            loopState2.settingPoint = 'start';
            
            // Ensure start < end
            if (loopState2.start > loopState2.end) {
                [loopState2.start, loopState2.end] = [loopState2.end, loopState2.start];
            }
            console.log('Loop end set at:', formatTime(time));
            // Enable export loop button when both points are set
            exportLoop2.disabled = false;
        }
        
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
    } else {
        // Regular seek
        if (audioElement2.duration) {
            audioElement2.currentTime = time;
        }
    }
});

// Waveform drag for Track 2 (pan when zoomed)
waveform2.parentElement.addEventListener('mousedown', (e) => {
    if (zoomState2.level > 1 && !e.target.classList.contains('loop-marker')) {
        zoomState2.isDragging = true;
        zoomState2.dragStartX = e.clientX;
        zoomState2.dragStartOffset = zoomState2.offset;
        waveform2.parentElement.style.cursor = 'grabbing';
        e.preventDefault();
    }
});

waveform2.parentElement.addEventListener('mousemove', (e) => {
    if (zoomState2.isDragging && zoomState2.level > 1) {
        const rect = waveform2.getBoundingClientRect();
        const deltaX = e.clientX - zoomState2.dragStartX;
        const deltaPercent = -(deltaX / rect.width) / zoomState2.level;
        
        zoomState2.offset = Math.max(0, Math.min(1 - (1 / zoomState2.level), zoomState2.dragStartOffset + deltaPercent));
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display, 2, waveformColors);
        updateLoopMarkersAfterZoom(2);
    }
});

waveform2.parentElement.addEventListener('mouseup', () => {
    if (zoomState2.isDragging) {
        setTimeout(() => {
            zoomState2.isDragging = false;
            waveform2.parentElement.style.cursor = zoomState2.level > 1 ? 'grab' : 'pointer';
        }, 10);
    }
});

waveform2.parentElement.addEventListener('mouseleave', () => {
    if (zoomState2.isDragging) {
        zoomState2.isDragging = false;
        waveform2.parentElement.style.cursor = zoomState2.level > 1 ? 'grab' : 'pointer';
    }
});

// Drag loop markers for Track 1
let isDraggingMarker1 = false;
let draggedMarker1 = null;
let activeMarker1 = null; // For click-to-move mode

loopMarkerStart1.addEventListener('mousedown', (e) => {
    isDraggingMarker1 = true;
    draggedMarker1 = 'start';
    e.stopPropagation();
});

loopMarkerEnd1.addEventListener('mousedown', (e) => {
    isDraggingMarker1 = true;
    draggedMarker1 = 'end';
    e.stopPropagation();
});

// Click on marker to activate it for repositioning
loopMarkerStart1.addEventListener('click', (e) => {
    if (!isDraggingMarker1) {
        activeMarker1 = activeMarker1 === 'start' ? null : 'start';
        loopMarkerStart1.style.filter = activeMarker1 === 'start' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))' : '';
        console.log('Track 1 Start marker', activeMarker1 === 'start' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});

loopMarkerEnd1.addEventListener('click', (e) => {
    if (!isDraggingMarker1) {
        activeMarker1 = activeMarker1 === 'end' ? null : 'end';
        loopMarkerEnd1.style.filter = activeMarker1 === 'end' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))' : '';
        console.log('Track 1 End marker', activeMarker1 === 'end' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});


waveform1.parentElement.addEventListener('mousemove', (e) => {
    if (isDraggingMarker1 && draggedMarker1) {
        const rect = waveform1.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        
        // Adjust for zoom: map drag position to actual time considering zoom and offset
        const visibleDuration = audioElement1.duration / zoomState1.level;
        const startTime = zoomState1.offset * audioElement1.duration;
        const time = startTime + (percentage * visibleDuration);
        
        if (draggedMarker1 === 'start') {
            loopState1.start = Math.min(time, loopState1.end || audioElement1.duration);
        } else {
            loopState1.end = Math.max(time, loopState1.start || 0);
        }
        
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
    }
});

document.addEventListener('mouseup', () => {
    // When finishing dragging Track 1 markers, only adjust playhead if it's way outside the loop
    // This prevents glitches from unnecessary seeking
    if (isDraggingMarker1 && loopState1.enabled && !audioElement1.paused) {
        const currentTime = audioElement1.currentTime;
        const loopDuration = loopState1.end - loopState1.start;
        
        // Only adjust if playhead is significantly outside the loop (more than loop duration away)
        // This gives a buffer zone to prevent jarring seeks
        if (currentTime < loopState1.start - loopDuration || currentTime > loopState1.end + loopDuration) {
            if (audioElement1.readyState >= 2) {
                try {
                    audioElement1.currentTime = loopState1.start;
                    loopState1.lastSeekTime = Date.now();
                    console.log('Adjusted playhead to loop start after marker drag (was far outside)');
                } catch (e) {
                    console.error('Error adjusting playhead after marker drag:', e);
                }
            }
        }
        // If playhead is within reasonable distance, let handleLoopPlayback handle it naturally
    }
    
    // When finishing dragging Track 2 markers, only adjust playhead if it's way outside the loop
    if (isDraggingMarker2 && loopState2.enabled && !audioElement2.paused) {
        const currentTime = audioElement2.currentTime;
        const loopDuration = loopState2.end - loopState2.start;
        
        // Only adjust if playhead is significantly outside the loop (more than loop duration away)
        if (currentTime < loopState2.start - loopDuration || currentTime > loopState2.end + loopDuration) {
            if (audioElement2.readyState >= 2) {
                try {
                    audioElement2.currentTime = loopState2.start;
                    loopState2.lastSeekTime = Date.now();
                    console.log('Adjusted playhead to loop start after marker drag (was far outside)');
                } catch (e) {
                    console.error('Error adjusting playhead after marker drag:', e);
                }
            }
        }
        // If playhead is within reasonable distance, let handleLoopPlayback handle it naturally
    }
    
    isDraggingMarker1 = false;
    draggedMarker1 = null;
    isDraggingMarker2 = false;
    draggedMarker2 = null;
});

// Drag loop markers for Track 2
let isDraggingMarker2 = false;
let draggedMarker2 = null;
let activeMarker2 = null; // For click-to-move mode

loopMarkerStart2.addEventListener('mousedown', (e) => {
    isDraggingMarker2 = true;
    draggedMarker2 = 'start';
    e.stopPropagation();
});

loopMarkerEnd2.addEventListener('mousedown', (e) => {
    isDraggingMarker2 = true;
    draggedMarker2 = 'end';
    e.stopPropagation();
});

// Click on marker to activate it for repositioning
loopMarkerStart2.addEventListener('click', (e) => {
    if (!isDraggingMarker2) {
        activeMarker2 = activeMarker2 === 'start' ? null : 'start';
        loopMarkerStart2.style.filter = activeMarker2 === 'start' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(0, 255, 0, 0.8))' : '';
        console.log('Track 2 Start marker', activeMarker2 === 'start' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});

loopMarkerEnd2.addEventListener('click', (e) => {
    if (!isDraggingMarker2) {
        activeMarker2 = activeMarker2 === 'end' ? null : 'end';
        loopMarkerEnd2.style.filter = activeMarker2 === 'end' ? 'brightness(1.5) drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))' : '';
        console.log('Track 2 End marker', activeMarker2 === 'end' ? 'activated (click waveform to move)' : 'deactivated');
        e.stopPropagation();
    }
});


waveform2.parentElement.addEventListener('mousemove', (e) => {
    if (isDraggingMarker2 && draggedMarker2) {
        const rect = waveform2.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        
        // Adjust for zoom: map drag position to actual time considering zoom and offset
        const visibleDuration = audioElement2.duration / zoomState2.level;
        const startTime = zoomState2.offset * audioElement2.duration;
        const time = startTime + (percentage * visibleDuration);
        
        if (draggedMarker2 === 'start') {
            loopState2.start = Math.min(time, loopState2.end || audioElement2.duration);
        } else {
            loopState2.end = Math.max(time, loopState2.start || 0);
        }
        
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
    }
});

// Helper function to update waveform progress for Track 1
function updateWaveformProgress1() {
    if (audioElement1.duration) {
        const currentTime = audioElement1.currentTime;
        const duration = audioElement1.duration;
        
        // Calculate visible time window based on zoom
        const visibleDuration = duration / zoomState1.level;
        const visibleStartTime = zoomState1.offset * duration;
        const visibleEndTime = visibleStartTime + visibleDuration;
        
        // Check if current time is within visible range
        if (currentTime >= visibleStartTime && currentTime <= visibleEndTime) {
            // Map current time to visible waveform position
            const percentage = ((currentTime - visibleStartTime) / visibleDuration) * 100;
            waveformProgress1.style.width = Math.max(0, Math.min(100, percentage)) + '%';
        } else if (currentTime < visibleStartTime) {
            // Playhead is before visible range
            waveformProgress1.style.width = '0%';
        } else {
            // Playhead is after visible range
            waveformProgress1.style.width = '100%';
        }
    }
}

// Helper function to update waveform progress for Track 2
function updateWaveformProgress2() {
    if (audioElement2.duration) {
        const currentTime = audioElement2.currentTime;
        const duration = audioElement2.duration;
        
        // Calculate visible time window based on zoom
        const visibleDuration = duration / zoomState2.level;
        const visibleStartTime = zoomState2.offset * duration;
        const visibleEndTime = visibleStartTime + visibleDuration;
        
        // Check if current time is within visible range
        if (currentTime >= visibleStartTime && currentTime <= visibleEndTime) {
            // Map current time to visible waveform position
            const percentage = ((currentTime - visibleStartTime) / visibleDuration) * 100;
            waveformProgress2.style.width = Math.max(0, Math.min(100, percentage)) + '%';
        } else if (currentTime < visibleStartTime) {
            // Playhead is before visible range
            waveformProgress2.style.width = '0%';
        } else {
            // Playhead is after visible range
            waveformProgress2.style.width = '100%';
        }
    }
}

// Update time and progress for Track 1
audioElement1.addEventListener('loadedmetadata', () => {
    duration1Display.textContent = formatTime(audioElement1.duration);
});

audioElement1.addEventListener('timeupdate', () => {
    currentTime1Display.textContent = formatTime(audioElement1.currentTime);
    // Update progress bar (will be smooth during reverse playback via callback)
    updateWaveformProgress1();
    
    if (audioElement1.duration) {
        // Handle loop playback
        handleLoopPlayback(audioElement1, loopState1, isDraggingMarker1);
    }
});

// Update time and progress for Track 2
audioElement2.addEventListener('loadedmetadata', () => {
    duration2Display.textContent = formatTime(audioElement2.duration);
});

audioElement2.addEventListener('timeupdate', () => {
    currentTime2Display.textContent = formatTime(audioElement2.currentTime);
    // Update progress bar (will be smooth during reverse playback via callback)
    updateWaveformProgress2();
    
    if (audioElement2.duration) {
        // Handle loop playback
        handleLoopPlayback(audioElement2, loopState2, isDraggingMarker2);
    }
});

// Play button handlers
playBtn1.addEventListener('click', () => {
    // Check if this is tab capture
    if (window.tabCaptureState1?.isTabCapture) {
        // For tab capture, show reminder to user
        console.log('Tab capture active - User should control playback in source tab');
        alert('💡 Tip: To play/pause the audio, control it in the source tab.\n\nThis button controls the audio processing in Browser Jockey, but the actual playback happens in the source tab.');
        return;
    }
    
    initAudioContext();
    audioContext.resume().then(() => {
        audioElement1.play();
        vinylAnimation1.style.display = 'flex'; // Show vinyl animation
        if (!animationId) draw();
        // Start reverse animation if in reverse mode
        if (loopState1.reverse && loopState1.enabled) {
            // Stop any existing animation first to prevent duplicates
            stopReversePlayback(loopState1);
            loopState1.lastReverseTime = performance.now();
            animateReversePlayback(audioElement1, loopState1, updateWaveformProgress1);
        }
    });
});

playBtn2.addEventListener('click', () => {
    // Check if this is tab capture
    if (window.tabCaptureState2?.isTabCapture) {
        // For tab capture, show reminder to user
        console.log('Tab capture active - User should control playback in source tab');
        alert('💡 Tip: To play/pause the audio, control it in the source tab.\n\nThis button controls the audio processing in Browser Jockey, but the actual playback happens in the source tab.');
        return;
    }
    
    initAudioContext();
    audioContext.resume().then(() => {
        audioElement2.play();
        vinylAnimation2.style.display = 'flex'; // Show vinyl animation
        if (!animationId) draw();
        // Start reverse animation if in reverse mode
        if (loopState2.reverse && loopState2.enabled) {
            // Stop any existing animation first to prevent duplicates
            stopReversePlayback(loopState2);
            loopState2.lastReverseTime = performance.now();
            animateReversePlayback(audioElement2, loopState2, updateWaveformProgress2);
        }
    });
});

// Pause button handlers
pauseBtn1.addEventListener('click', () => {
    // Check if this is tab capture
    if (window.tabCaptureState1?.isTabCapture) {
        console.log('Tab capture active - User should control playback in source tab');
        alert('💡 Tip: To play/pause the audio, control it in the source tab.\n\nThis button controls the audio processing in Browser Jockey, but the actual playback happens in the source tab.');
        return;
    }
    
    audioElement1.pause();
    vinylAnimation1.style.display = 'none'; // Hide vinyl animation
    // Stop reverse animation when pausing
    stopReversePlayback(loopState1);
});

pauseBtn2.addEventListener('click', () => {
    // Check if this is tab capture
    if (window.tabCaptureState2?.isTabCapture) {
        console.log('Tab capture active - User should control playback in source tab');
        alert('💡 Tip: To play/pause the audio, control it in the source tab.\n\nThis button controls the audio processing in Browser Jockey, but the actual playback happens in the source tab.');
        return;
    }
    
    audioElement2.pause();
    vinylAnimation2.style.display = 'none'; // Hide vinyl animation
    // Stop reverse animation when pausing
    stopReversePlayback(loopState2);
});

// Stop button handlers
stopBtn1.addEventListener('click', () => {
    audioElement1.pause();
    audioElement1.currentTime = 0;
    vinylAnimation1.style.display = 'none'; // Hide vinyl animation
    // Stop reverse animation
    stopReversePlayback(loopState1);
    
    // Stop tab capture if active
    if (tabCaptureStream1) {
        tabCaptureStream1.getTracks().forEach(track => track.stop());
        tabCaptureStream1 = null;
    }
    if (tabCaptureSource1) {
        try {
            tabCaptureSource1.disconnect();
        } catch (e) {
            console.log('Error disconnecting tab capture source:', e);
        }
        tabCaptureSource1 = null;
        source1 = null;
    }
    // Clean up tab capture state
    if (window.tabCaptureState1) {
        delete window.tabCaptureState1;
    }
    if (fileName1.textContent.includes('Tab Audio')) {
        fileName1.textContent = 'No file selected';
        stopBtn1.disabled = true;
        playBtn1.disabled = true;
        pauseBtn1.disabled = true;
        playBtn1.title = '';
        pauseBtn1.title = '';
    }
});

stopBtn2.addEventListener('click', () => {
    audioElement2.pause();
    audioElement2.currentTime = 0;
    vinylAnimation2.style.display = 'none'; // Hide vinyl animation
    // Stop reverse animation
    stopReversePlayback(loopState2);
    
    // Stop tab capture if active
    if (tabCaptureStream2) {
        tabCaptureStream2.getTracks().forEach(track => track.stop());
        tabCaptureStream2 = null;
    }
    if (tabCaptureSource2) {
        try {
            tabCaptureSource2.disconnect();
        } catch (e) {
            console.log('Error disconnecting tab capture source:', e);
        }
        tabCaptureSource2 = null;
        source2 = null;
    }
    // Clean up tab capture state
    if (window.tabCaptureState2) {
        delete window.tabCaptureState2;
    }
    if (fileName2.textContent.includes('Tab Audio')) {
        fileName2.textContent = 'No file selected';
        stopBtn2.disabled = true;
        playBtn2.disabled = true;
        pauseBtn2.disabled = true;
        playBtn2.title = '';
        pauseBtn2.title = '';
    }
});

// Loop button handlers
loopBtn1.addEventListener('click', () => {
    loopState1.enabled = !loopState1.enabled;
    loopState1.reverse = false; // Disable reverse mode for normal loop
    stopReversePlayback(loopState1); // Stop any reverse animation
    loopBtn1.classList.toggle('active');
    reverseLoopBtn1.classList.remove('active');
    
    // Show/hide quick loop section
    const quickLoopSection = document.getElementById('quickLoopSection1');
    if (quickLoopSection) {
        quickLoopSection.style.display = loopState1.enabled ? 'block' : 'none';
    }
    
    if (!loopState1.enabled) {
        // Clear loop points when disabling - use clearLoopPoints to properly reset state
        clearLoopPoints(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1);
    }
});

loopBtn2.addEventListener('click', () => {
    loopState2.enabled = !loopState2.enabled;
    loopState2.reverse = false; // Disable reverse mode for normal loop
    stopReversePlayback(loopState2); // Stop any reverse animation
    loopBtn2.classList.toggle('active');
    reverseLoopBtn2.classList.remove('active');
    
    // Show/hide quick loop section
    const quickLoopSection = document.getElementById('quickLoopSection2');
    if (quickLoopSection) {
        quickLoopSection.style.display = loopState2.enabled ? 'block' : 'none';
    }
    
    if (!loopState2.enabled) {
        // Clear loop points when disabling - use clearLoopPoints to properly reset state
        clearLoopPoints(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2);
    }
});

// Clear loop button handlers
clearLoopBtn1.addEventListener('click', () => {
    clearLoopPoints(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1);
});

clearLoopBtn2.addEventListener('click', () => {
    clearLoopPoints(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2);
});

// Reverse loop button handlers
reverseLoopBtn1.addEventListener('click', () => {
    // Check if loop points are set
    if (loopState1.start === null || loopState1.end === null) {
        alert('⚠️ Please set loop points (A-B) first by clicking on the waveform!');
        return;
    }
    
    // Toggle reverse mode (keep loop enabled)
    loopState1.reverse = !loopState1.reverse;
    loopState1.enabled = true; // Always enable loop when reverse is on
    
    reverseLoopBtn1.classList.toggle('active');
    
    // If reverse is now active, deactivate normal loop button
    if (loopState1.reverse) {
        loopBtn1.classList.remove('active');
    }
    
    // Show/hide quick loop section
    const quickLoopSection = document.getElementById('quickLoopSection1');
    if (quickLoopSection) {
        quickLoopSection.style.display = loopState1.enabled ? 'block' : 'none';
    }
    
    if (loopState1.reverse) {
        // Stop any existing animation first to prevent duplicates
        stopReversePlayback(loopState1);
        // DON'T jump to end - let it play from current position for seamless transition
        // Only start reverse animation if playing
        if (!audioElement1.paused) {
            loopState1.lastReverseTime = performance.now();
            animateReversePlayback(audioElement1, loopState1, updateWaveformProgress1);
        }
    } else {
        // Stop reverse animation but keep loop points
        stopReversePlayback(loopState1);
        // Re-enable normal loop button when turning off reverse
        loopBtn1.classList.add('active');
        // Loop remains enabled in normal mode
        // DON'T jump playhead - continue from current position
    }
});

reverseLoopBtn2.addEventListener('click', () => {
    // Check if loop points are set
    if (loopState2.start === null || loopState2.end === null) {
        alert('⚠️ Please set loop points (A-B) first by clicking on the waveform!');
        return;
    }
    
    // Toggle reverse mode (keep loop enabled)
    loopState2.reverse = !loopState2.reverse;
    loopState2.enabled = true; // Always enable loop when reverse is on
    
    reverseLoopBtn2.classList.toggle('active');
    
    // If reverse is now active, deactivate normal loop button
    if (loopState2.reverse) {
        loopBtn2.classList.remove('active');
    }
    
    // Show/hide quick loop section
    const quickLoopSection = document.getElementById('quickLoopSection2');
    if (quickLoopSection) {
        quickLoopSection.style.display = loopState2.enabled ? 'block' : 'none';
    }
    
    if (loopState2.reverse) {
        // Stop any existing animation first to prevent duplicates
        stopReversePlayback(loopState2);
        // DON'T jump to end - let it play from current position for seamless transition
        // Only start reverse animation if playing
        if (!audioElement2.paused) {
            loopState2.lastReverseTime = performance.now();
            animateReversePlayback(audioElement2, loopState2, updateWaveformProgress2);
        }
    } else {
        // Stop reverse animation but keep loop points
        stopReversePlayback(loopState2);
        // Re-enable normal loop button when turning off reverse
        loopBtn2.classList.add('active');
        // Loop remains enabled in normal mode
        // DON'T jump playhead - continue from current position
    }
});

// Quick loop functionality
function createQuickLoop(trackNumber, numBars) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const loopState = trackNumber === 1 ? loopState1 : loopState2;
    const bpmDisplay = trackNumber === 1 ? bpm1Display : bpm2Display;
    const loopRegion = trackNumber === 1 ? loopRegion1 : loopRegion2;
    const loopMarkerStart = trackNumber === 1 ? loopMarkerStart1 : loopMarkerStart2;
    const loopMarkerEnd = trackNumber === 1 ? loopMarkerEnd1 : loopMarkerEnd2;
    const zoomState = trackNumber === 1 ? zoomState1 : zoomState2;
    const autoZoomCheckbox = trackNumber === 1 ? document.getElementById('autoZoom1') : document.getElementById('autoZoom2');
    const waveform = trackNumber === 1 ? waveform1 : waveform2;
    const zoomLevelDisplay = trackNumber === 1 ? zoomLevel1Display : zoomLevel2Display;
    
    if (!audioElement.duration) {
        alert('Please load an audio file first!');
        return;
    }
    
    const bpm = parseFloat(bpmDisplay.textContent);
    if (isNaN(bpm) || bpm === 0) {
        alert('BPM not detected. Please load an audio file with a clear beat.');
        return;
    }
    
    // Calculate loop duration: 4 beats per bar, 60 seconds per minute
    const beatsPerBar = 4;
    const totalBeats = numBars * beatsPerBar;
    const loopDuration = (totalBeats / bpm) * 60;
    
    // Create loop starting from current playback position
    const startTime = audioElement.currentTime;
    const endTime = Math.min(startTime + loopDuration, audioElement.duration);
    
    // Enable loop if not already enabled
    if (!loopState.enabled) {
        loopState.enabled = true;
        const loopBtn = trackNumber === 1 ? loopBtn1 : loopBtn2;
        loopBtn.classList.add('active');
    }
    
    // Set loop points
    loopState.start = startTime;
    loopState.end = endTime;
    loopState.settingPoint = 'start';
    
    console.log(`Quick loop: ${numBars} bar(s) = ${loopDuration.toFixed(2)}s (${totalBeats} beats at ${bpm} BPM)`);
    
    // Enable export loop button
    const exportLoopBtn = trackNumber === 1 ? exportLoop1 : exportLoop2;
    exportLoopBtn.disabled = false;
    
    // Update loop markers
    updateLoopRegion(loopState, loopRegion, loopMarkerStart, loopMarkerEnd, audioElement.duration, zoomState);
    
    // Auto-zoom to loop if enabled
    if (autoZoomCheckbox && autoZoomCheckbox.checked) {
        zoomToLoop(trackNumber);
    }
}

function zoomToLoop(trackNumber) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const loopState = trackNumber === 1 ? loopState1 : loopState2;
    const zoomState = trackNumber === 1 ? zoomState1 : zoomState2;
    const waveform = trackNumber === 1 ? waveform1 : waveform2;
    const zoomLevelDisplay = trackNumber === 1 ? zoomLevel1Display : zoomLevel2Display;
    
    if (loopState.start === null || loopState.end === null) {
        return;
    }
    
    const duration = audioElement.duration;
    const loopDuration = loopState.end - loopState.start;
    const loopCenter = (loopState.start + loopState.end) / 2;
    
    // Calculate zoom level to fit the loop with some padding
    const paddingFactor = 1.5; // Show 50% extra context around the loop
    const targetVisibleDuration = loopDuration * paddingFactor;
    const targetZoomLevel = Math.min(20, Math.max(1, duration / targetVisibleDuration));
    
    // Calculate offset to center the loop
    const visibleDuration = duration / targetZoomLevel;
    const targetOffset = Math.max(0, Math.min(1 - (1 / targetZoomLevel), 
        (loopCenter / duration) - (0.5 / targetZoomLevel)));
    
    // Apply zoom
    zoomState.level = targetZoomLevel;
    zoomState.offset = targetOffset;
    
    // Redraw waveform
    redrawWaveformWithZoom(waveform, zoomState, zoomLevelDisplay, trackNumber, waveformColors);
    updateLoopMarkersAfterZoom(trackNumber);
    
    // Update cursor style
    waveform.parentElement.style.cursor = targetZoomLevel > 1 ? 'grab' : 'pointer';
}

// Quick loop button handlers
document.querySelectorAll('.quick-loop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const bars = parseInt(btn.getAttribute('data-bars'));
        const track = parseInt(btn.getAttribute('data-track'));
        createQuickLoop(track, bars);
    });
});

// Recording button handlers
recordBtn.addEventListener('click', startRecording);
stopRecordBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', downloadRecordingWrapper);
loadToTrack1Btn.addEventListener('click', loadRecordingToTrack1);
loadToTrack2Btn.addEventListener('click', loadRecordingToTrack2);

// Dual Track Control button handlers
playBothBtn.addEventListener('click', playBothTracks);
playBothRecordBtn.addEventListener('click', playBothAndRecord);

// Crossfader handlers
crossfader.addEventListener('input', (e) => {
    updateCrossfader(parseInt(e.target.value));
});

crossfaderMode.addEventListener('change', (e) => {
    updateCrossfaderMode(e.target.value);
});

// Microphone button handlers
enableMicBtn.addEventListener('click', enableMicrophone);
disableMicBtn.addEventListener('click', disableMicrophone);

if (captureTabAudioMic) {
    captureTabAudioMic.addEventListener('click', captureTabAudioAsMic);
}

micVolumeSlider.addEventListener('input', (e) => {
    updateMicVolumeWrapper(parseInt(e.target.value));
});

micMonitorCheckbox.addEventListener('change', (e) => {
    toggleMicMonitoring(e.target.checked);
});

// Microphone Recording button handlers
micRecordBtn.addEventListener('click', startMicRecordingHandler);
micStopBtn.addEventListener('click', stopMicRecordingHandler);
micExportWavBtn.addEventListener('click', () => exportMicRecording('wav'));
micExportMp3Btn.addEventListener('click', () => exportMicRecording('mp3'));
micLoadToTrack1Btn.addEventListener('click', () => loadMicRecordingToTrack(1));
micLoadToTrack2Btn.addEventListener('click', () => loadMicRecordingToTrack(2));

// Vocoder button handlers
enableVocoderBtn.addEventListener('click', enableVocoder);
disableVocoderBtn.addEventListener('click', disableVocoder);

vocoderModulator.addEventListener('change', updateVocoderModulator);
vocoderCarrier.addEventListener('change', updateVocoderCarrier);

vocoderMixSlider.addEventListener('input', (e) => {
    updateVocoderMixWrapper(parseInt(e.target.value));
});

vocoderBandsSlider.addEventListener('input', (e) => {
    updateVocoderBandsCount(parseInt(e.target.value));
});

// Auto-Tune button handlers
enableAutotuneBtn.addEventListener('click', enableAutotune);
disableAutotuneBtn.addEventListener('click', disableAutotune);

autotuneSource.addEventListener('change', updateAutotuneSource);

autotuneKey.addEventListener('change', () => {
    // Key or scale change doesn't require restart, just affects pitch correction
});

autotuneScale.addEventListener('change', () => {
    // Key or scale change doesn't require restart, just affects pitch correction
});

autotuneSpeedSlider.addEventListener('input', (e) => {
    updateAutotuneSpeed(parseInt(e.target.value));
});

autotuneStrengthSlider.addEventListener('input', (e) => {
    updateAutotuneStrengthWrapper(parseInt(e.target.value));
});

// Keyboard Sampler event handlers
samplerSourceSelect.addEventListener('change', loadSamplerSource);

samplerScaleSelect.addEventListener('change', () => {
    samplerScale = samplerScaleSelect.value;
    if (samplerEnabled) {
        console.log('Scale changed to:', samplerScale);
    }
});

samplerRootSelect.addEventListener('change', () => {
    samplerRoot = samplerRootSelect.value;
    if (samplerEnabled) {
        console.log('Root note changed to:', samplerRoot);
    }
});

enableSamplerBtn.addEventListener('click', enableSamplerWrapper);
disableSamplerBtn.addEventListener('click', disableSamplerWrapper);

// Sampler volume slider
samplerVolumeSlider.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    samplerVolume = volume / 100;
    samplerVolumeValue.textContent = volume + '%';
});

// === Sampler ADSR Controls ===
const samplerADSREnable = document.getElementById('samplerADSREnable');
const samplerADSRControls = document.getElementById('samplerADSRControls');
const samplerADSRAttackSlider = document.getElementById('samplerADSRAttackSlider');
const samplerADSRDecaySlider = document.getElementById('samplerADSRDecaySlider');
const samplerADSRSustainSlider = document.getElementById('samplerADSRSustainSlider');
const samplerADSRReleaseSlider = document.getElementById('samplerADSRReleaseSlider');

if (samplerADSREnable) {
    samplerADSREnable.addEventListener('change', (e) => {
        samplerADSREnabled = e.target.checked;
        if (samplerADSRControls) {
            samplerADSRControls.style.display = samplerADSREnabled ? 'flex' : 'none';
        }
        console.log('Sampler ADSR:', samplerADSREnabled ? 'enabled' : 'disabled');
    });
}

if (samplerADSRAttackSlider) {
    samplerADSRAttackSlider.addEventListener('input', (e) => {
        samplerADSRParams.attack = parseInt(e.target.value) / 1000;
        document.getElementById('samplerADSRAttackValue').textContent = e.target.value + 'ms';
    });
}

if (samplerADSRDecaySlider) {
    samplerADSRDecaySlider.addEventListener('input', (e) => {
        samplerADSRParams.decay = parseInt(e.target.value) / 1000;
        document.getElementById('samplerADSRDecayValue').textContent = e.target.value + 'ms';
    });
}

if (samplerADSRSustainSlider) {
    samplerADSRSustainSlider.addEventListener('input', (e) => {
        samplerADSRParams.sustain = parseInt(e.target.value) / 100;
        document.getElementById('samplerADSRSustainValue').textContent = e.target.value + '%';
    });
}

if (samplerADSRReleaseSlider) {
    samplerADSRReleaseSlider.addEventListener('input', (e) => {
        samplerADSRParams.release = parseInt(e.target.value) / 1000;
        document.getElementById('samplerADSRReleaseValue').textContent = e.target.value + 'ms';
    });
}

// Global keyboard event listeners for sampler
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// ============================================
// Camera Theremin Event Listeners
// ============================================

// Debug: Check if theremin elements exist
console.log('Theremin elements initialization:', {
    enableBtn: !!enableThereminBtn,
    disableBtn: !!disableThereminBtn,
    videoContainer: !!thereminVideoContainer,
    video: !!thereminVideo,
    canvas: !!thereminCanvas,
    settings: !!thereminSettings
});

if (!enableThereminBtn) {
    console.error('Enable theremin button not found!');
}

// Theremin enable/disable
if (enableThereminBtn) {
    enableThereminBtn.addEventListener('click', async () => {
        console.log('Enable theremin button clicked');
        
        // Initialize audio context if not already done
        if (!audioContext) {
            console.log('Initializing audio context for theremin...');
            initAudioContext();
        }
        
        console.log('Elements found:', {
            enableBtn: !!enableThereminBtn,
            disableBtn: !!disableThereminBtn,
            videoContainer: !!thereminVideoContainer,
            videoElement: !!thereminVideo,
            canvasElement: !!thereminCanvas,
            settingsContainer: !!thereminSettings
        });
        
        const thereminElements = {
            enableBtn: enableThereminBtn,
            disableBtn: disableThereminBtn,
            videoContainer: thereminVideoContainer,
            videoElement: thereminVideo,
            canvasElement: thereminCanvas,
            settingsContainer: thereminSettings
        };
        
        console.log('Calling enableTheremin with audioContext:', audioContext);
        const success = await enableTheremin(audioContext, thereminElements, recordingDestination, merger);
        console.log('enableTheremin returned:', success);
        if (!success) {
            console.error('Failed to enable theremin');
        }
    });
}

if (disableThereminBtn) {
    disableThereminBtn.addEventListener('click', () => {
        const thereminElements = {
            enableBtn: enableThereminBtn,
            disableBtn: disableThereminBtn,
            videoContainer: thereminVideoContainer,
            videoElement: thereminVideo,
            canvasElement: thereminCanvas,
            settingsContainer: thereminSettings
        };
        
        disableTheremin(thereminElements);
    });
}

// Theremin volume control
if (thereminVolumeSlider && thereminVolumeValue) {
    thereminVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100; // Convert to 0-1 range
        thereminVolumeValue.textContent = e.target.value + '%';
        changeThereminVolume(volume);
    });
}

// Theremin audio source selector
if (thereminAudioSource) {
    thereminAudioSource.addEventListener('change', (e) => {
        const sourceType = e.target.value;
        console.log('Changing theremin audio source to:', sourceType);
        
        // Get the appropriate source node based on selection
        let sourceNode = null;
        
        if (sourceType === 'track1') {
            if (source1) {
                sourceNode = source1;
                console.log('Using Track 1 as theremin source');
            } else {
                console.warn('Track 1 source not available - load a file on Track 1 first');
                alert('Please load an audio file on Track 1 first');
                thereminAudioSource.value = 'oscillator'; // Reset to oscillator
                return;
            }
        } else if (sourceType === 'track2') {
            if (source2) {
                sourceNode = source2;
                console.log('Using Track 2 as theremin source');
            } else {
                console.warn('Track 2 source not available - load a file on Track 2 first');
                alert('Please load an audio file on Track 2 first');
                thereminAudioSource.value = 'oscillator'; // Reset to oscillator
                return;
            }
        } else if (sourceType === 'oscillator') {
            console.log('Using oscillator as theremin source');
        }
        
        setThereminAudioSource(sourceType, sourceNode);
        
        // Show/hide waveform selector (only for oscillator mode)
        const waveformSetting = document.getElementById('thereminWaveformSetting');
        if (waveformSetting) {
            waveformSetting.style.display = sourceType === 'oscillator' ? 'block' : 'none';
        }
        
        // Update frequency/filter label in display
        const freqLabel = document.getElementById('thereminFreqLabel');
        if (freqLabel) {
            freqLabel.textContent = sourceType === 'oscillator' ? 'Freq' : 'Filter';
        }
        
        // Update help text to explain the mode
        const helpText = document.querySelector('.theremin-help-text');
        if (helpText) {
            if (sourceType === 'oscillator') {
                helpText.textContent = 'Use your hand motion to control the theremin! Move up/down for pitch, left/right for volume.';
            } else {
                helpText.textContent = `Modulating ${sourceType.toUpperCase()}: Move up/down to control filter brightness, left/right for volume.`;
            }
        }
    });
}

// Theremin waveform change
if (thereminWaveform) {
    thereminWaveform.addEventListener('change', (e) => {
        changeThereminWaveform(e.target.value);
        console.log('Theremin waveform changed to:', e.target.value);
    });
}

// Theremin mapping mode selector
const thereminMappingMode = document.getElementById('thereminMappingMode');
if (thereminMappingMode) {
    thereminMappingMode.addEventListener('change', (e) => {
        const mode = e.target.value;
        console.log('Changing theremin mapping mode to:', mode);
        setThereminMappingMode(mode);
        
        // Update the help text below the selector
        const helpText = document.getElementById('thereminMappingHelp');
        if (helpText) {
            const helpMessages = {
                'pitch-volume': '<small>↕️ Pitch | ↔️ Volume</small>',
                'filter-resonance': '<small>↕️ Filter Cutoff | ↔️ Resonance (Q)</small>',
                'adsr': '<small>↕️ Attack (top) / Release (bottom) | ↔️ Decay (left) / Sustain (right)</small>'
            };
            helpText.innerHTML = helpMessages[mode] || '';
        }
        
        // Update main help text
        const mainHelpText = document.querySelector('.theremin-help-text');
        if (mainHelpText) {
            const sourceType = thereminAudioSource ? thereminAudioSource.value : 'oscillator';
            const modeDescriptions = {
                'pitch-volume': sourceType === 'oscillator' 
                    ? 'Move up/down for pitch, left/right for volume.' 
                    : 'Move up/down for filter brightness, left/right for volume.',
                'filter-resonance': 'Move up/down for filter cutoff, left/right for resonance.',
                'adsr': 'Move to control envelope: Up/down for Attack/Release, Left/right for Decay/Sustain.'
            };
            mainHelpText.textContent = `Use your hand motion to control the theremin! ${modeDescriptions[mode]}`;
        }
    });
}

// Theremin range change
if (thereminRange) {
    thereminRange.addEventListener('change', (e) => {
        const rangeSettings = {
            'low': { min: 100, max: 800 },
            'medium': { min: 200, max: 2000 },
            'high': { min: 400, max: 4000 },
            'wide': { min: 100, max: 4000 }
        };
        
        const range = rangeSettings[e.target.value];
        changeThereminRange(range.min, range.max);
        console.log('Theremin range changed to:', e.target.value, range);
    });
}

// Theremin vibrato controls
if (thereminVibratoRate && thereminVibratoRateValue) {
    thereminVibratoRate.addEventListener('input', (e) => {
        const rate = parseFloat(e.target.value);
        thereminVibratoRateValue.textContent = rate.toFixed(1) + 'Hz';
        const depth = parseFloat(thereminVibratoDepth.value);
        changeThereminVibrato(rate, depth);
    });
}

if (thereminVibratoDepth && thereminVibratoDepthValue) {
    thereminVibratoDepth.addEventListener('input', (e) => {
        const depth = parseFloat(e.target.value);
        thereminVibratoDepthValue.textContent = depth.toFixed(0) + 'Hz';
        const rate = parseFloat(thereminVibratoRate.value);
        changeThereminVibrato(rate, depth);
    });
}

if (thereminSensitivity && thereminSensitivityValue) {
    thereminSensitivity.addEventListener('input', (e) => {
        const sensitivity = parseFloat(e.target.value);
        thereminSensitivityValue.textContent = sensitivity.toFixed(1) + 'x';
        changeThereminSensitivity(sensitivity);
    });
}

if (thereminRequireHand) {
    thereminRequireHand.addEventListener('change', (e) => {
        changeThereminHandRequirement(e.target.checked);
    });
}

// Cleanup theremin on page unload
window.addEventListener('beforeunload', cleanupTheremin);

// Tempo sliders
tempoSlider1.addEventListener('input', (e) => {
    const tempo = parseFloat(e.target.value);
    audioElement1.playbackRate = tempo;
    tempoValue1.textContent = tempo.toFixed(2) + 'x';
});

tempoSlider2.addEventListener('input', (e) => {
    const tempo = parseFloat(e.target.value);
    audioElement2.playbackRate = tempo;
    tempoValue2.textContent = tempo.toFixed(2) + 'x';
});

// Volume sliders
volumeSlider1.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    volumeValue1.textContent = volume + '%';
    audioElement1.volume = volume / 100; // Fallback for when effects not initialized
    // Apply volume through crossfader to maintain crossfade position
    updateCrossfader(parseInt(crossfader.value));
});

volumeSlider2.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value);
    volumeValue2.textContent = volume + '%';
    audioElement2.volume = volume / 100; // Fallback for when effects not initialized
    // Apply volume through crossfader to maintain crossfade position
    updateCrossfader(parseInt(crossfader.value));
});

// Pan sliders
panSlider1.addEventListener('input', (e) => {
    const pan = parseInt(e.target.value);
    if (panner1) {
        panner1.pan.value = pan / 100; // Convert to -1.0 to 1.0 range
    }
    // Update label
    if (pan === 0) {
        panValue1.textContent = 'Center';
    } else if (pan < 0) {
        panValue1.textContent = `L ${Math.abs(pan)}%`;
    } else {
        panValue1.textContent = `R ${pan}%`;
    }
});

panSlider2.addEventListener('input', (e) => {
    const pan = parseInt(e.target.value);
    if (panner2) {
        panner2.pan.value = pan / 100; // Convert to -1.0 to 1.0 range
    }
    // Update label
    if (pan === 0) {
        panValue2.textContent = 'Center';
    } else if (pan < 0) {
        panValue2.textContent = `L ${Math.abs(pan)}%`;
    } else {
        panValue2.textContent = `R ${pan}%`;
    }
});

// Effects controls for Track 1
filterSlider1.addEventListener('input', (e) => {
    const freq = parseInt(e.target.value);
    if (filter1) {
        filter1.frequency.value = freq;
    }
    if (freq >= 1000) {
        filterValue1.textContent = (freq / 1000).toFixed(1) + 'kHz';
    } else {
        filterValue1.textContent = freq + 'Hz';
    }
});

filterType1.addEventListener('change', (e) => {
    if (filter1) {
        filter1.type = e.target.value;
    }
});

reverbSlider1.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (reverb1) {
        reverb1.wet.gain.value = wetAmount;
        reverb1.dry.gain.value = 1 - wetAmount;
    }
    reverbValue1.textContent = e.target.value + '%';
});

delaySlider1.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (delay1) {
        delay1.wet.gain.value = wetAmount;
        delay1.dry.gain.value = 1 - wetAmount;
    }
    delayValue1.textContent = e.target.value + '%';
});

delayTimeSlider1.addEventListener('input', (e) => {
    const delayTime = parseInt(e.target.value) / 1000;
    if (delay1) {
        delay1.node.delayTime.value = delayTime;
    }
    delayTimeValue1.textContent = e.target.value + 'ms';
});

// Effects controls for Track 2
filterSlider2.addEventListener('input', (e) => {
    const freq = parseInt(e.target.value);
    if (filter2) {
        filter2.frequency.value = freq;
    }
    if (freq >= 1000) {
        filterValue2.textContent = (freq / 1000).toFixed(1) + 'kHz';
    } else {
        filterValue2.textContent = freq + 'Hz';
    }
});

filterType2.addEventListener('change', (e) => {
    if (filter2) {
        filter2.type = e.target.value;
    }
});

reverbSlider2.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (reverb2) {
        reverb2.wet.gain.value = wetAmount;
        reverb2.dry.gain.value = 1 - wetAmount;
    }
    reverbValue2.textContent = e.target.value + '%';
});

delaySlider2.addEventListener('input', (e) => {
    const wetAmount = parseInt(e.target.value) / 100;
    if (delay2) {
        delay2.wet.gain.value = wetAmount;
        delay2.dry.gain.value = 1 - wetAmount;
    }
    delayValue2.textContent = e.target.value + '%';
});

delayTimeSlider2.addEventListener('input', (e) => {
    const delayTime = parseInt(e.target.value) / 1000;
    if (delay2) {
        delay2.node.delayTime.value = delayTime;
    }
    delayTimeValue2.textContent = e.target.value + 'ms';
});

// === ADSR Controls for Track 1 ===
const adsrAttackSlider1 = document.getElementById('adsrAttackSlider1');
const adsrDecaySlider1 = document.getElementById('adsrDecaySlider1');
const adsrSustainSlider1 = document.getElementById('adsrSustainSlider1');
const adsrReleaseSlider1 = document.getElementById('adsrReleaseSlider1');
const adsrTrigger1 = document.getElementById('adsrTrigger1');

if (adsrAttackSlider1) {
    adsrAttackSlider1.addEventListener('input', (e) => {
        const attack = parseInt(e.target.value) / 1000; // Convert ms to seconds
        if (adsr1) {
            updateADSRParameters(adsr1, attack, undefined, undefined, undefined);
        }
        document.getElementById('adsrAttackValue1').textContent = e.target.value + 'ms';
    });
}

if (adsrDecaySlider1) {
    adsrDecaySlider1.addEventListener('input', (e) => {
        const decay = parseInt(e.target.value) / 1000;
        if (adsr1) {
            updateADSRParameters(adsr1, undefined, decay, undefined, undefined);
        }
        document.getElementById('adsrDecayValue1').textContent = e.target.value + 'ms';
    });
}

if (adsrSustainSlider1) {
    adsrSustainSlider1.addEventListener('input', (e) => {
        const sustain = parseInt(e.target.value) / 100;
        if (adsr1) {
            updateADSRParameters(adsr1, undefined, undefined, sustain, undefined);
        }
        document.getElementById('adsrSustainValue1').textContent = e.target.value + '%';
    });
}

if (adsrReleaseSlider1) {
    adsrReleaseSlider1.addEventListener('input', (e) => {
        const release = parseInt(e.target.value) / 1000;
        if (adsr1) {
            updateADSRParameters(adsr1, undefined, undefined, undefined, release);
        }
        document.getElementById('adsrReleaseValue1').textContent = e.target.value + 'ms';
    });
}

if (adsrTrigger1) {
    adsrTrigger1.addEventListener('click', () => {
        if (adsr1 && audioContext) {
            triggerADSRAttack(adsr1, audioContext, 1.0);
            console.log('Track 1 ADSR triggered');
        }
    });
}

// === ADSR Controls for Track 2 ===
const adsrAttackSlider2 = document.getElementById('adsrAttackSlider2');
const adsrDecaySlider2 = document.getElementById('adsrDecaySlider2');
const adsrSustainSlider2 = document.getElementById('adsrSustainSlider2');
const adsrReleaseSlider2 = document.getElementById('adsrReleaseSlider2');
const adsrTrigger2 = document.getElementById('adsrTrigger2');

if (adsrAttackSlider2) {
    adsrAttackSlider2.addEventListener('input', (e) => {
        const attack = parseInt(e.target.value) / 1000;
        if (adsr2) {
            updateADSRParameters(adsr2, attack, undefined, undefined, undefined);
        }
        document.getElementById('adsrAttackValue2').textContent = e.target.value + 'ms';
    });
}

if (adsrDecaySlider2) {
    adsrDecaySlider2.addEventListener('input', (e) => {
        const decay = parseInt(e.target.value) / 1000;
        if (adsr2) {
            updateADSRParameters(adsr2, undefined, decay, undefined, undefined);
        }
        document.getElementById('adsrDecayValue2').textContent = e.target.value + 'ms';
    });
}

if (adsrSustainSlider2) {
    adsrSustainSlider2.addEventListener('input', (e) => {
        const sustain = parseInt(e.target.value) / 100;
        if (adsr2) {
            updateADSRParameters(adsr2, undefined, undefined, sustain, undefined);
        }
        document.getElementById('adsrSustainValue2').textContent = e.target.value + '%';
    });
}

if (adsrReleaseSlider2) {
    adsrReleaseSlider2.addEventListener('input', (e) => {
        const release = parseInt(e.target.value) / 1000;
        if (adsr2) {
            updateADSRParameters(adsr2, undefined, undefined, undefined, release);
        }
        document.getElementById('adsrReleaseValue2').textContent = e.target.value + 'ms';
    });
}

if (adsrTrigger2) {
    adsrTrigger2.addEventListener('click', () => {
        if (adsr2 && audioContext) {
            triggerADSRAttack(adsr2, audioContext, 1.0);
            console.log('Track 2 ADSR triggered');
        }
    });
}

// === Master Channel Effect Controls ===

filterSliderMaster.addEventListener('input', (e) => {
    const frequency = parseInt(e.target.value);
    if (filterMaster) {
        filterMaster.frequency.value = frequency;
    }
    if (frequency >= 1000) {
        filterValueMaster.textContent = (frequency / 1000).toFixed(1) + 'kHz';
    } else {
        filterValueMaster.textContent = frequency + 'Hz';
    }
});

filterTypeMaster.addEventListener('change', (e) => {
    if (filterMaster) {
        filterMaster.type = e.target.value;
    }
});

reverbSliderMaster.addEventListener('input', (e) => {
    const wetness = parseInt(e.target.value) / 100;
    if (reverbMaster) {
        reverbMaster.wet.gain.value = wetness;
        reverbMaster.dry.gain.value = 1 - wetness;
    }
    reverbValueMaster.textContent = e.target.value + '%';
});

delaySliderMaster.addEventListener('input', (e) => {
    const wetness = parseInt(e.target.value) / 100;
    if (delayMaster) {
        delayMaster.wet.gain.value = wetness;
        delayMaster.dry.gain.value = 1 - wetness;
    }
    delayValueMaster.textContent = e.target.value + '%';
});

delayTimeSliderMaster.addEventListener('input', (e) => {
    const delayTime = parseInt(e.target.value) / 1000;
    if (delayMaster) {
        delayMaster.node.delayTime.value = delayTime;
    }
    delayTimeValueMaster.textContent = e.target.value + 'ms';
});

// === ADSR Controls for Master ===
const adsrAttackSliderMaster = document.getElementById('adsrAttackSliderMaster');
const adsrDecaySliderMaster = document.getElementById('adsrDecaySliderMaster');
const adsrSustainSliderMaster = document.getElementById('adsrSustainSliderMaster');
const adsrReleaseSliderMaster = document.getElementById('adsrReleaseSliderMaster');
const adsrTriggerMaster = document.getElementById('adsrTriggerMaster');

if (adsrAttackSliderMaster) {
    adsrAttackSliderMaster.addEventListener('input', (e) => {
        const attack = parseInt(e.target.value) / 1000;
        if (adsrMaster) {
            updateADSRParameters(adsrMaster, attack, undefined, undefined, undefined);
        }
        document.getElementById('adsrAttackValueMaster').textContent = e.target.value + 'ms';
    });
}

if (adsrDecaySliderMaster) {
    adsrDecaySliderMaster.addEventListener('input', (e) => {
        const decay = parseInt(e.target.value) / 1000;
        if (adsrMaster) {
            updateADSRParameters(adsrMaster, undefined, decay, undefined, undefined);
        }
        document.getElementById('adsrDecayValueMaster').textContent = e.target.value + 'ms';
    });
}

if (adsrSustainSliderMaster) {
    adsrSustainSliderMaster.addEventListener('input', (e) => {
        const sustain = parseInt(e.target.value) / 100;
        if (adsrMaster) {
            updateADSRParameters(adsrMaster, undefined, undefined, sustain, undefined);
        }
        document.getElementById('adsrSustainValueMaster').textContent = e.target.value + '%';
    });
}

if (adsrReleaseSliderMaster) {
    adsrReleaseSliderMaster.addEventListener('input', (e) => {
        const release = parseInt(e.target.value) / 1000;
        if (adsrMaster) {
            updateADSRParameters(adsrMaster, undefined, undefined, undefined, release);
        }
        document.getElementById('adsrReleaseValueMaster').textContent = e.target.value + 'ms';
    });
}

if (adsrTriggerMaster) {
    adsrTriggerMaster.addEventListener('click', () => {
        if (adsrMaster && audioContext) {
            triggerADSRAttack(adsrMaster, audioContext, 1.0);
            console.log('Master ADSR triggered');
        }
    });
}

// Master routing handlers
routeTrack1.addEventListener('change', (e) => {
    toggleTrackRouting(1, e.target.checked);
});

routeTrack2.addEventListener('change', (e) => {
    toggleTrackRouting(2, e.target.checked);
});

routeMicrophone.addEventListener('change', (e) => {
    toggleMicRouting(e.target.checked);
});

routeSampler.addEventListener('change', (e) => {
    toggleSamplerRouting(e.target.checked);
});

routeTheremin.addEventListener('change', (e) => {
    toggleThereminRouting(e.target.checked);
});

masterVolumeSlider.addEventListener('input', (e) => {
    const volume = parseInt(e.target.value) / 100;
    if (gainMaster) {
        gainMaster.gain.value = volume;
    }
    masterVolumeValue.textContent = e.target.value + '%';
});

masterPanSlider.addEventListener('input', (e) => {
    const pan = parseInt(e.target.value);
    if (pannerMaster) {
        pannerMaster.pan.value = pan / 100; // Convert to -1.0 to 1.0 range
    }
    // Update label
    if (pan === 0) {
        masterPanValue.textContent = 'Center';
    } else if (pan < 0) {
        masterPanValue.textContent = `L ${Math.abs(pan)}%`;
    } else {
        masterPanValue.textContent = `R ${pan}%`;
    }
});

// === Zoom Controls ===

// Zoom controls for Track 1
zoomInBtn1.addEventListener('click', () => {
    if (zoomState1.level < 20) {
        const centerTime = zoomState1.offset + (0.5 / zoomState1.level);
        zoomState1.level = Math.min(20, zoomState1.level * 2);
        zoomState1.offset = Math.max(0, Math.min(1 - (1 / zoomState1.level), centerTime - (0.5 / zoomState1.level)));
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display, 1, waveformColors);
        updateLoopMarkersAfterZoom(1);
        waveform1.parentElement.style.cursor = 'grab';
    }
});

zoomOutBtn1.addEventListener('click', () => {
    if (zoomState1.level > 1) {
        const centerTime = zoomState1.offset + (0.5 / zoomState1.level);
        zoomState1.level = Math.max(1, zoomState1.level / 2);
        zoomState1.offset = Math.max(0, Math.min(1 - (1 / zoomState1.level), centerTime - (0.5 / zoomState1.level)));
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display, 1, waveformColors);
        updateLoopMarkersAfterZoom(1);
        waveform1.parentElement.style.cursor = zoomState1.level > 1 ? 'grab' : 'pointer';
    }
});

zoomResetBtn1.addEventListener('click', () => {
    zoomState1.level = 1.0;
    zoomState1.offset = 0.0;
    redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display, 1, waveformColors);
    updateLoopMarkersAfterZoom(1);
    waveform1.parentElement.style.cursor = 'pointer';
});

// Zoom controls for Track 2
zoomInBtn2.addEventListener('click', () => {
    if (zoomState2.level < 20) {
        const centerTime = zoomState2.offset + (0.5 / zoomState2.level);
        zoomState2.level = Math.min(20, zoomState2.level * 2);
        zoomState2.offset = Math.max(0, Math.min(1 - (1 / zoomState2.level), centerTime - (0.5 / zoomState2.level)));
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display, 2, waveformColors);
        updateLoopMarkersAfterZoom(2);
        waveform2.parentElement.style.cursor = 'grab';
    }
});

zoomOutBtn2.addEventListener('click', () => {
    if (zoomState2.level > 1) {
        const centerTime = zoomState2.offset + (0.5 / zoomState2.level);
        zoomState2.level = Math.max(1, zoomState2.level / 2);
        zoomState2.offset = Math.max(0, Math.min(1 - (1 / zoomState2.level), centerTime - (0.5 / zoomState2.level)));
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display, 2, waveformColors);
        updateLoopMarkersAfterZoom(2);
        waveform2.parentElement.style.cursor = zoomState2.level > 1 ? 'grab' : 'pointer';
    }
});

zoomResetBtn2.addEventListener('click', () => {
    zoomState2.level = 1.0;
    zoomState2.offset = 0.0;
    redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display, 2, waveformColors);
    updateLoopMarkersAfterZoom(2);
    waveform2.parentElement.style.cursor = 'pointer';
});

// Helper function to update loop marker positions after zoom
function updateLoopMarkersAfterZoom(trackNumber) {
    if (trackNumber === 1 && loopState1.start !== null && loopState1.end !== null) {
        updateLoopRegion(loopState1, loopRegion1, loopMarkerStart1, loopMarkerEnd1, audioElement1.duration, zoomState1);
    } else if (trackNumber === 2 && loopState2.start !== null && loopState2.end !== null) {
        updateLoopRegion(loopState2, loopRegion2, loopMarkerStart2, loopMarkerEnd2, audioElement2.duration, zoomState2);
    }
}

// Export stem (full track with effects)
async function exportStem(trackNumber) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const fileName = trackNumber === 1 ? fileName1.textContent : fileName2.textContent;
    
    if (!audioElement.src || fileName === 'No file selected') {
        alert('Please load an audio file first!');
        return;
    }
    
    try {
        // Create offline context for rendering
        const duration = audioElement.duration;
        const sampleRate = audioContext.sampleRate;
        const offlineContext = new OfflineAudioContext(2, duration * sampleRate, sampleRate);
        
        // Get the audio buffer from zoom state
        const audioBuffer = trackNumber === 1 ? zoomState1.audioBuffer : zoomState2.audioBuffer;
        
        if (!audioBuffer) {
            alert('Audio not loaded properly. Please reload the file.');
            return;
        }
        
        // Create source from buffer
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Recreate effects chain in offline context
        const gain = offlineContext.createGain();
        const filter = offlineContext.createBiquadFilter();
        const convolver = offlineContext.createConvolver();
        const delay = offlineContext.createDelay(5.0);
        const feedback = offlineContext.createGain();
        
        // Copy current settings
        const currentGain = trackNumber === 1 ? gain1 : gain2;
        const currentFilter = trackNumber === 1 ? filter1 : filter2;
        const currentReverb = trackNumber === 1 ? reverb1 : reverb2;
        const currentDelay = trackNumber === 1 ? delay1 : delay2;
        
        gain.gain.value = currentGain.gain.value;
        filter.type = currentFilter.type;
        filter.frequency.value = currentFilter.frequency.value;
        filter.Q.value = currentFilter.Q.value;
        
        // Create reverb impulse
        convolver.buffer = currentReverb.convolver.buffer;
        
        delay.delayTime.value = currentDelay.node.delayTime.value;
        feedback.gain.value = currentDelay.feedback.gain.value;
        
        // Create wet/dry gains
        const reverbWet = offlineContext.createGain();
        const reverbDry = offlineContext.createGain();
        const delayWet = offlineContext.createGain();
        const delayDry = offlineContext.createGain();
        
        reverbWet.gain.value = currentReverb.wet.gain.value;
        reverbDry.gain.value = currentReverb.dry.gain.value;
        delayWet.gain.value = currentDelay.wet.gain.value;
        delayDry.gain.value = currentDelay.dry.gain.value;
        
        // Connect effects chain
        source.connect(gain);
        gain.connect(filter);
        
        filter.connect(convolver);
        convolver.connect(reverbWet);
        filter.connect(reverbDry);
        
        const reverbMix = offlineContext.createGain();
        reverbWet.connect(reverbMix);
        reverbDry.connect(reverbMix);
        
        reverbMix.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayWet);
        reverbMix.connect(delayDry);
        
        const finalMix = offlineContext.createGain();
        delayWet.connect(finalMix);
        delayDry.connect(finalMix);
        
        finalMix.connect(offlineContext.destination);
        
        // Start rendering
        source.start(0);
        const renderedBuffer = await offlineContext.startRendering();
        
        // Get selected export format
        const format = trackNumber === 1 ? exportFormat1.value : exportFormat2.value;
        
        // Convert to selected format and download
        let blob, extension, mimeType;
        
        if (format === 'mp3') {
            const mp3Data = audioBufferToMp3(renderedBuffer);
            blob = new Blob([mp3Data], { type: 'audio/mp3' });
            extension = 'mp3';
            mimeType = 'audio/mp3';
        } else {
            const wav = audioBufferToWav(renderedBuffer);
            blob = new Blob([wav], { type: 'audio/wav' });
            extension = 'wav';
            mimeType = 'audio/wav';
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Track${trackNumber}_with_effects.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`Stem exported successfully as ${extension.toUpperCase()}!`);
    } catch (error) {
        console.error('Error exporting stem:', error);
        alert('Error exporting stem. Please try again.');
    }
}

// Export loop region
async function exportLoop(trackNumber) {
    const audioElement = trackNumber === 1 ? audioElement1 : audioElement2;
    const loopState = trackNumber === 1 ? loopState1 : loopState2;
    const fileName = trackNumber === 1 ? fileName1.textContent : fileName2.textContent;
    
    if (!audioElement.src || fileName === 'No file selected') {
        alert('Please load an audio file first!');
        return;
    }
    
    if (loopState.start === null || loopState.end === null) {
        alert('Please set loop points first!');
        return;
    }
    
    try {
        const audioBuffer = trackNumber === 1 ? zoomState1.audioBuffer : zoomState2.audioBuffer;
        
        if (!audioBuffer) {
            alert('Audio not loaded properly. Please reload the file.');
            return;
        }
        
        // Calculate loop samples
        const sampleRate = audioBuffer.sampleRate;
        const startSample = Math.floor(loopState.start * sampleRate);
        const endSample = Math.floor(loopState.end * sampleRate);
        const loopLength = endSample - startSample;
        
        // Create new buffer with just the loop
        const loopBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            loopLength,
            sampleRate
        );
        
        // Copy loop data to new buffer
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const sourceData = audioBuffer.getChannelData(channel);
            const loopData = loopBuffer.getChannelData(channel);
            for (let i = 0; i < loopLength; i++) {
                loopData[i] = sourceData[startSample + i];
            }
        }
        
        // Create offline context for rendering with effects
        const offlineContext = new OfflineAudioContext(
            loopBuffer.numberOfChannels,
            loopLength,
            sampleRate
        );
        
        // Create source from loop buffer
        const source = offlineContext.createBufferSource();
        source.buffer = loopBuffer;
        
        // Recreate effects (same as exportStem)
        const gain = offlineContext.createGain();
        const filter = offlineContext.createBiquadFilter();
        const convolver = offlineContext.createConvolver();
        const delay = offlineContext.createDelay(5.0);
        const feedback = offlineContext.createGain();
        
        const currentGain = trackNumber === 1 ? gain1 : gain2;
        const currentFilter = trackNumber === 1 ? filter1 : filter2;
        const currentReverb = trackNumber === 1 ? reverb1 : reverb2;
        const currentDelay = trackNumber === 1 ? delay1 : delay2;
        
        gain.gain.value = currentGain.gain.value;
        filter.type = currentFilter.type;
        filter.frequency.value = currentFilter.frequency.value;
        filter.Q.value = currentFilter.Q.value;
        convolver.buffer = currentReverb.convolver.buffer;
        delay.delayTime.value = currentDelay.node.delayTime.value;
        feedback.gain.value = currentDelay.feedback.gain.value;
        
        const reverbWet = offlineContext.createGain();
        const reverbDry = offlineContext.createGain();
        const delayWet = offlineContext.createGain();
        const delayDry = offlineContext.createGain();
        
        reverbWet.gain.value = currentReverb.wet.gain.value;
        reverbDry.gain.value = currentReverb.dry.gain.value;
        delayWet.gain.value = currentDelay.wet.gain.value;
        delayDry.gain.value = currentDelay.dry.gain.value;
        
        // Connect chain
        source.connect(gain);
        gain.connect(filter);
        filter.connect(convolver);
        convolver.connect(reverbWet);
        filter.connect(reverbDry);
        
        const reverbMix = offlineContext.createGain();
        reverbWet.connect(reverbMix);
        reverbDry.connect(reverbMix);
        
        reverbMix.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(delayWet);
        reverbMix.connect(delayDry);
        
        const finalMix = offlineContext.createGain();
        delayWet.connect(finalMix);
        delayDry.connect(finalMix);
        finalMix.connect(offlineContext.destination);
        
        source.start(0);
        const renderedBuffer = await offlineContext.startRendering();
        
        // Get selected export format
        const format = trackNumber === 1 ? exportFormat1.value : exportFormat2.value;
        
        // Convert to selected format and download
        let blob, extension, mimeType;
        
        if (format === 'mp3') {
            const mp3Data = audioBufferToMp3(renderedBuffer);
            blob = new Blob([mp3Data], { type: 'audio/mp3' });
            extension = 'mp3';
            mimeType = 'audio/mp3';
        } else {
            const wav = audioBufferToWav(renderedBuffer);
            blob = new Blob([wav], { type: 'audio/wav' });
            extension = 'wav';
            mimeType = 'audio/wav';
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Track${trackNumber}_loop_${formatTime(loopState.start)}-${formatTime(loopState.end)}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`Loop exported successfully as ${extension.toUpperCase()}!`);
    } catch (error) {
        console.error('Error exporting loop:', error);
        alert('Error exporting loop. Please try again.');
    }
}

// Convert AudioBuffer to WAV format
function audioBufferToWav(buffer) {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const data = [];
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
            data.push(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        }
    }
    
    const dataLength = data.length * bytesPerSample;
    const bufferLength = 44 + dataLength;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
        view.setInt16(offset, data[i], true);
        offset += 2;
    }
    
    return arrayBuffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Convert AudioBuffer to MP3 format using lamejs
function audioBufferToMp3(buffer) {
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128); // 128 kbps
    
    const samples = [];
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < channels; channel++) {
            const sample = buffer.getChannelData(channel)[i];
            // Convert float to 16-bit PCM
            samples.push(sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
        }
    }
    
    const mp3Data = [];
    const sampleBlockSize = 1152; // Must be 1152 for MPEG1 Layer III
    
    // Encode in chunks
    for (let i = 0; i < samples.length; i += sampleBlockSize * channels) {
        const leftChannel = [];
        const rightChannel = [];
        
        for (let j = 0; j < sampleBlockSize && (i + j * channels) < samples.length; j++) {
            leftChannel.push(samples[i + j * channels] || 0);
            if (channels === 2) {
                rightChannel.push(samples[i + j * channels + 1] || 0);
            }
        }
        
        const mp3buf = channels === 2 
            ? mp3Encoder.encodeBuffer(new Int16Array(leftChannel), new Int16Array(rightChannel))
            : mp3Encoder.encodeBuffer(new Int16Array(leftChannel));
        
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    
    // Flush remaining data
    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }
    
    // Combine all MP3 chunks
    const totalLength = mp3Data.reduce((acc, buf) => acc + buf.length, 0);
    const mp3File = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of mp3Data) {
        mp3File.set(buf, offset);
        offset += buf.length;
    }
    
    return mp3File;
}

// Export button handlers
exportStem1.addEventListener('click', () => exportStem(1));
exportLoop1.addEventListener('click', () => exportLoop(1));
exportStem2.addEventListener('click', () => exportStem(2));
exportLoop2.addEventListener('click', () => exportLoop(2));

// Waveform color picker handlers
waveformColor1.addEventListener('input', (e) => {
    waveformColors.track1 = e.target.value;
    if (zoomState1.audioBuffer) {
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display, 1, waveformColors);
        updateLoopMarkersAfterZoom(1);
    }
});

waveformColor2.addEventListener('input', (e) => {
    waveformColors.track2 = e.target.value;
    if (zoomState2.audioBuffer) {
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display, 2, waveformColors);
        updateLoopMarkersAfterZoom(2);
    }
});

resetColor1.addEventListener('click', () => {
    waveformColor1.value = '#00ffff';
    waveformColors.track1 = '#00ffff';
    if (zoomState1.audioBuffer) {
        redrawWaveformWithZoom(waveform1, zoomState1, zoomLevel1Display, 1, waveformColors);
        updateLoopMarkersAfterZoom(1);
    }
});

resetColor2.addEventListener('click', () => {
    waveformColor2.value = '#ff00ff';
    waveformColors.track2 = '#ff00ff';
    if (zoomState2.audioBuffer) {
        redrawWaveformWithZoom(waveform2, zoomState2, zoomLevel2Display, 2, waveformColors);
        updateLoopMarkersAfterZoom(2);
    }
});

// Mode buttons
modeCircleBtn.addEventListener('click', () => {
    currentMode = 'circle';
    createCircleVisualization();
    updateModeButtons();
});

modeBarsBtn.addEventListener('click', () => {
    currentMode = 'bars';
    createBarsVisualization();
    updateModeButtons();
});

modeSphereBtn.addEventListener('click', () => {
    currentMode = 'sphere';
    createSphereVisualization();
    updateModeButtons();
});

function updateModeButtons() {
    [modeCircleBtn, modeBarsBtn, modeSphereBtn].forEach(btn => btn.classList.remove('active'));
    if (currentMode === 'circle') modeCircleBtn.classList.add('active');
    if (currentMode === 'bars') modeBarsBtn.classList.add('active');
    if (currentMode === 'sphere') modeSphereBtn.classList.add('active');
}

// Animation function (reused from original but uses merged audio)
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        
        const bassSum = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
        const trebleSum = dataArray.slice(dataArray.length - 16).reduce((a, b) => a + b, 0) / 16;
        bassLevel = bassSum / 255;
        trebleLevel = trebleSum / 255;
        
        detectMusicalKey();
        
        if (currentMode === 'circle') {
            visualizationObjects.forEach((bar, i) => {
                const dataIndex = Math.min(
                    Math.floor((i / visualizationObjects.length) * (bufferLength - 1)),
                    bufferLength - 1
                );
                const audioValue = dataArray[dataIndex] || dataArray[i % bufferLength] || 0;
                const scale = (audioValue / 255) * 15 * bar.userData.randomAmplitude + 1;
                bar.userData.targetScale = scale;
                
                bar.userData.velocity += (bar.userData.targetScale - bar.scale.y) * (0.2 * bar.userData.randomSpeed);
                bar.userData.velocity *= 0.85;
                bar.scale.y += bar.userData.velocity;
                bar.position.y = (bar.scale.y - 1) * 0.5;
                
                const radiusOffset = bassLevel * 8 * bar.userData.randomAmplitude;
                const currentRadius = 1 + radiusOffset / 20;
                bar.position.x = bar.userData.baseX * currentRadius;
                bar.position.z = bar.userData.baseZ * currentRadius;
                
                const wave1 = Math.sin(Date.now() * 0.003 * bar.userData.randomSpeed + i * 0.1 + bar.userData.randomPhase) * trebleLevel * 3 * bar.userData.randomAmplitude;
                const wave2 = Math.cos(Date.now() * 0.005 * bar.userData.randomSpeed + i * 0.15 + bar.userData.randomPhase) * bassLevel * 2;
                const wave3 = Math.sin(Date.now() * 0.004 + bar.userData.randomPhase) * (audioValue / 255) * 2;
                bar.position.y += wave1 + wave2 + wave3;
                
                const twist = Math.sin(Date.now() * 0.002 + i * 0.05 + bar.userData.randomPhase) * bassLevel * 0.3 * bar.userData.randomAmplitude;
                bar.rotation.z = twist;
                
                bar.userData.rotationSpeed += (audioValue / 255) * 0.05 * bar.userData.randomSpeed;
                bar.userData.rotationSpeed *= 0.95;
                bar.rotation.x += bar.userData.rotationSpeed;
                
                const widthScale = 1 + (audioValue / 255) * 0.5 * bar.userData.randomAmplitude;
                bar.scale.x = widthScale;
                bar.scale.z = widthScale;
                
                // Dynamic color based on bar height
                const normalizedHeight = Math.min(1, bar.scale.y / 15); // Normalize to 0-1
                let hue, saturation, lightness;
                
                if (normalizedHeight < 0.2) {
                    // Very small: Deep blue
                    hue = 240;
                    saturation = 80;
                    lightness = 30 + normalizedHeight * 100; // 30-50%
                } else if (normalizedHeight < 0.4) {
                    // Small-Medium: Blue to Cyan
                    const t = (normalizedHeight - 0.2) / 0.2;
                    hue = 240 - t * 60; // 240 (blue) to 180 (cyan)
                    saturation = 80 + t * 20; // 80-100%
                    lightness = 50 + t * 10; // 50-60%
                } else if (normalizedHeight < 0.6) {
                    // Medium: Cyan to Green
                    const t = (normalizedHeight - 0.4) / 0.2;
                    hue = 180 - t * 60; // 180 (cyan) to 120 (green)
                    saturation = 100;
                    lightness = 60 + t * 10; // 60-70%
                } else if (normalizedHeight < 0.8) {
                    // Medium-Large: Green to Yellow
                    const t = (normalizedHeight - 0.6) / 0.2;
                    hue = 120 - t * 60; // 120 (green) to 60 (yellow)
                    saturation = 100;
                    lightness = 70 + t * 10; // 70-80%
                } else {
                    // Large: Yellow to Red
                    const t = (normalizedHeight - 0.8) / 0.2;
                    hue = 60 - t * 60; // 60 (yellow) to 0 (red)
                    saturation = 100;
                    lightness = 80 + t * 10; // 80-90%
                }
                
                // Apply color with smooth transition
                // Round and clamp HSL values to avoid THREE.js parsing errors
                const roundedHue = Math.round(hue) % 360;
                const roundedSat = Math.round(Math.max(0, Math.min(100, saturation)));
                const roundedLight = Math.round(Math.max(0, Math.min(100, lightness)));
                const targetColor = new THREE.Color(`hsl(${roundedHue}, ${roundedSat}%, ${roundedLight}%)`);
                bar.material.color.lerp(targetColor, 0.15); // Smooth color transition
                bar.material.emissive.copy(bar.material.color).multiplyScalar(0.3);
                
                bar.material.opacity = 0.7 + (audioValue / 255) * 0.3 + Math.sin(Date.now() * 0.002 + bar.userData.randomPhase) * 0.1;
                
                if (bar.userData.explosionForce > 0) {
                    const timeSinceExplosion = (Date.now() - bar.userData.explosionTime) / 1000;
                    const explosionScale = Math.max(0, bar.userData.explosionForce * (1 - timeSinceExplosion));
                    bar.scale.y *= (1 + explosionScale * 2);
                    bar.scale.x *= (1 + explosionScale);
                    bar.scale.z *= (1 + explosionScale);
                    bar.userData.rotationSpeed += bar.userData.spinBoost;
                    bar.userData.spinBoost *= 0.95;
                    bar.userData.explosionForce *= 0.9;
                }
                
                if (bar.userData.rippleForce > 0) {
                    bar.scale.y *= (1 + bar.userData.rippleForce);
                    bar.userData.rippleForce *= 0.9;
                }
                
                if (bar.userData.isSelected) {
                    bar.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    bar.material.emissiveIntensity = 1 + glowPulse;
                }
            });
            
            scene.rotation.y += 0.002 + bassLevel * 0.005 + Math.sin(Date.now() * 0.001) * 0.001;
            scene.rotation.z = Math.sin(Date.now() * 0.001) * trebleLevel * 0.03;
            scene.rotation.x = Math.cos(Date.now() * 0.0008) * bassLevel * 0.02;
            
        } else if (currentMode === 'bars') {
            visualizationObjects.forEach((bar, i) => {
                const audioValue = dataArray[i * 2] || 0;
                const scale = (audioValue / 255) * 20 * bar.userData.randomBounce + 1;
                bar.userData.targetScale = scale;
                
                bar.userData.velocity += (bar.userData.targetScale - bar.scale.y) * (0.25 * bar.userData.randomBounce);
                bar.userData.velocity *= 0.8;
                bar.scale.y += bar.userData.velocity;
                bar.position.y = (bar.scale.y - 1) * 0.5;
                
                const pulse = Math.sin(Date.now() * 0.005 + bar.userData.pulsePhase) * bassLevel * 1.5 * bar.userData.randomBounce;
                bar.scale.x = 1 + pulse + (audioValue / 255) * 0.8;
                bar.scale.z = 1 + pulse + (audioValue / 255) * 0.8;
                
                const waveX = Math.sin(Date.now() * 0.004 + i * 0.2 + bar.userData.randomWave) * bassLevel * 5 * bar.userData.randomBounce;
                bar.position.x = bar.userData.baseX + waveX;
                
                const jump = Math.abs(Math.sin(Date.now() * 0.006 + i * 0.15 + bar.userData.randomWave)) * trebleLevel * 4 * bar.userData.randomBounce;
                bar.position.y += jump;
                
                const waveZ = Math.cos(Date.now() * 0.003 + i * 0.25 + bar.userData.randomWave) * trebleLevel * 2;
                bar.position.z = waveZ;
                
                bar.userData.tiltX += ((audioValue / 255) * 0.5 * bar.userData.randomBounce - bar.userData.tiltX) * 0.2;
                bar.userData.tiltZ += (Math.sin(Date.now() * 0.003 + i * 0.1) * bassLevel * 0.5 - bar.userData.tiltZ) * 0.2;
                bar.rotation.x = bar.userData.tiltX;
                bar.rotation.z = bar.userData.tiltZ;
                
                bar.userData.rotationVelocity += (audioValue / 255) * 0.08 * bar.userData.randomSpin;
                bar.userData.rotationVelocity *= 0.92;
                bar.rotation.y += bar.userData.rotationVelocity + trebleLevel * 0.05 * bar.userData.randomSpin;
                
                bar.material.opacity = 0.75 + (audioValue / 255) * 0.25 + Math.sin(Date.now() * 0.003 + bar.userData.randomWave) * 0.1;
                
                if (bar.userData.explosionForce > 0) {
                    const timeSinceExplosion = (Date.now() - bar.userData.explosionTime) / 1000;
                    const explosionScale = Math.max(0, bar.userData.explosionForce * (1 - timeSinceExplosion));
                    bar.scale.y *= (1 + explosionScale * 3);
                    bar.scale.x *= (1 + explosionScale * 0.5);
                    bar.scale.z *= (1 + explosionScale * 0.5);
                    bar.position.y += explosionScale * 10;
                    bar.userData.rotationVelocity += bar.userData.spinBoost;
                    bar.userData.spinBoost *= 0.95;
                    bar.userData.explosionForce *= 0.9;
                }
                
                if (bar.userData.rippleForce > 0) {
                    bar.scale.y *= (1 + bar.userData.rippleForce * 2);
                    bar.position.y += bar.userData.rippleForce * 3;
                    bar.userData.rippleForce *= 0.9;
                }
                
                if (bar.userData.isSelected) {
                    bar.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    bar.material.emissiveIntensity = 1 + glowPulse;
                }
            });
            
            scene.rotation.y += 0.001 + bassLevel * 0.004 + Math.sin(Date.now() * 0.0005) * 0.001;
            scene.rotation.x = Math.sin(Date.now() * 0.002) * 0.05 + trebleLevel * 0.03 + Math.cos(Date.now() * 0.0007) * 0.02;
            scene.rotation.z = Math.cos(Date.now() * 0.0015) * 0.04 + bassLevel * 0.02;
            
        } else if (currentMode === 'sphere') {
            visualizationObjects.forEach((sphere, i) => {
                const dataIndex = Math.floor((i / visualizationObjects.length) * bufferLength);
                const audioValue = dataArray[dataIndex] || 0;
                const scale = (audioValue / 255) * 3 * sphere.userData.randomGlow + 0.5;
                sphere.userData.targetScale = scale;
                
                sphere.userData.velocity += (sphere.userData.targetScale - sphere.scale.x) * 0.3;
                sphere.userData.velocity *= 0.85;
                const newScale = sphere.scale.x + sphere.userData.velocity;
                sphere.scale.set(newScale, newScale, newScale);
                
                const pulseAmount = 1 + bassLevel * 0.5 * sphere.userData.randomGlow + (audioValue / 255) * 0.3;
                sphere.position.x = sphere.userData.baseX * pulseAmount;
                sphere.position.y = sphere.userData.baseY * pulseAmount;
                sphere.position.z = sphere.userData.baseZ * pulseAmount;
                
                const float1 = Math.sin(Date.now() * sphere.userData.pulseSpeed + sphere.userData.randomFloat) * trebleLevel * 4 * sphere.userData.randomGlow;
                const float2 = Math.cos(Date.now() * sphere.userData.pulseSpeed * 0.7 + sphere.userData.randomFloat) * trebleLevel * 3;
                const float3 = Math.sin(Date.now() * sphere.userData.pulseSpeed * 1.3 + sphere.userData.randomFloat) * bassLevel * 3;
                const float4 = Math.cos(Date.now() * sphere.userData.pulseSpeed * 0.5 + sphere.userData.randomFloat) * (audioValue / 255) * 2;
                
                sphere.position.x += float1 + float4;
                sphere.position.y += float2 + float4 * 0.7;
                sphere.position.z += float3 + float4 * 0.5;
                
                const orbitAngle = Date.now() * sphere.userData.randomOrbit;
                sphere.position.x += Math.cos(orbitAngle) * bassLevel * 3;
                sphere.position.z += Math.sin(orbitAngle) * bassLevel * 3;
                
                sphere.rotation.x += sphere.userData.rotationSpeed * (1 + trebleLevel) * sphere.userData.randomGlow;
                sphere.rotation.y += sphere.userData.rotationSpeed * 0.7 * (1 + bassLevel);
                sphere.rotation.z += sphere.userData.rotationSpeed * 0.5;
                
                const wobble = Math.sin(Date.now() * 0.004 + i * 0.2 + sphere.userData.randomFloat) * bassLevel * 0.3 * sphere.userData.randomGlow;
                sphere.rotation.x += wobble;
                
                sphere.material.opacity = 0.5 + (audioValue / 255) * 0.4 * sphere.userData.randomGlow + Math.sin(Date.now() * sphere.userData.pulseSpeed) * 0.2;
                
                const glowIntensity = (audioValue / 255) * sphere.userData.randomGlow;
                sphere.material.emissiveIntensity = 0.3 + glowIntensity * 0.7;
                
                if (sphere.userData.explosionForce > 0) {
                    const timeSinceExplosion = (Date.now() - sphere.userData.explosionTime) / 1000;
                    const explosionScale = Math.max(0, sphere.userData.explosionForce * (1 - timeSinceExplosion * 0.7));
                    const currentScale = sphere.scale.x * (1 + explosionScale * 2);
                    sphere.scale.set(currentScale, currentScale, currentScale);
                    sphere.userData.rotationSpeed += sphere.userData.spinBoost;
                    sphere.userData.spinBoost *= 0.95;
                    sphere.userData.explosionForce *= 0.92;
                    
                    const pushAmount = 1 + explosionScale;
                    sphere.position.x = sphere.userData.baseX * pulseAmount * pushAmount;
                    sphere.position.y = sphere.userData.baseY * pulseAmount * pushAmount;
                    sphere.position.z = sphere.userData.baseZ * pulseAmount * pushAmount;
                }
                
                if (sphere.userData.rippleForce > 0) {
                    const rippleScale = sphere.scale.x * (1 + sphere.userData.rippleForce);
                    sphere.scale.set(rippleScale, rippleScale, rippleScale);
                    sphere.userData.rippleForce *= 0.92;
                }
                
                if (sphere.userData.isSelected) {
                    sphere.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    sphere.material.emissiveIntensity = 2 + glowPulse * 2;
                }
            });
            
            scene.rotation.x += 0.001 + trebleLevel * 0.002 + Math.sin(Date.now() * 0.0006) * 0.001;
            scene.rotation.y += 0.001 + bassLevel * 0.003 + Math.cos(Date.now() * 0.0004) * 0.001;
            scene.rotation.z = Math.sin(Date.now() * 0.002) * bassLevel * 0.05 + Math.cos(Date.now() * 0.0008) * trebleLevel * 0.03;
        }
        
        // Update particles
        if (particleSystem) {
            particleSystem.rotation.y += 0.0005;
            particleSystem.rotation.x += 0.0002;
            
            const positions = particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.01 * bassLevel;
            }
            particleSystem.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    // Smooth camera movement
    camera.position.x += (cameraRotation.y - camera.position.x) * 0.05;
    camera.position.y = 10 + cameraRotation.x * 10;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

// For audio drawing
function draw() {
    animate();
}

// Initialize oscilloscope on page load
document.addEventListener('DOMContentLoaded', () => {
    initOscilloscope();
    setupRecordedAudioConnection();
});

// Setup event listeners for recorded audio playback to connect to oscilloscope
function setupRecordedAudioConnection() {
    if (!recordedAudio) {
        console.warn('Recorded audio element not found');
        return;
    }
    
    // Connect recorded audio to oscilloscope when it starts playing
    recordedAudio.addEventListener('play', () => {
        if (!audioContext) {
            // Create audio context if it doesn't exist
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // Create oscilloscope analyser if it doesn't exist
        if (!oscilloscopeAnalyser) {
            oscilloscopeAnalyser = audioContext.createAnalyser();
            oscilloscopeAnalyser.fftSize = 2048;
            oscilloscopeAnalyser.smoothingTimeConstant = 0.3;
        }
        
        // Create media element source for recorded audio if it doesn't exist
        if (!recordedAudioSource) {
            try {
                recordedAudioSource = audioContext.createMediaElementSource(recordedAudio);
                console.log('Created MediaElementSource for recorded audio');
            } catch (err) {
                console.error('Error creating recorded audio source:', err);
                // Already created, this is fine
                if (err.name !== 'InvalidStateError') {
                    return;
                }
            }
        }
        
        // Connect to oscilloscope analyser and destination
        if (recordedAudioSource) {
            try {
                // Disconnect any existing connections first
                recordedAudioSource.disconnect();
                
                // Connect to oscilloscope analyser for visualization
                recordedAudioSource.connect(oscilloscopeAnalyser);
                
                // Also connect to destination so we can hear it
                recordedAudioSource.connect(audioContext.destination);
                
                console.log('Recorded audio connected to oscilloscope and output');
            } catch (err) {
                console.error('Error connecting recorded audio:', err);
            }
        }
    });
    
    // When recorded audio stops, reconnect oscilloscope to the merger (main tracks)
    recordedAudio.addEventListener('pause', () => {
        connectOscilloscopeToMerger();
        console.log('Recorded audio paused - oscilloscope reconnected to tracks');
    });
    
    recordedAudio.addEventListener('ended', () => {
        connectOscilloscopeToMerger();
        console.log('Recorded audio ended - oscilloscope reconnected to tracks');
    });
}

// Final initialization complete
console.log('🎵 Browser Jockey initialized successfully');
console.log('Theremin button element:', enableThereminBtn);
