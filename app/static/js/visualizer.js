// Get DOM elements
const container = document.getElementById('visualizer-container');
const audioElement = document.getElementById('audioElement');
const audioFileInput = document.getElementById('audioFile');
const fileNameDisplay = document.getElementById('fileName');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const placeholder = document.getElementById('placeholder');
const modeCircleBtn = document.getElementById('modeCircle');
const modeBarsBtn = document.getElementById('modeBars');
const modeSphereBtn = document.getElementById('modeSphere');
const currentKeyDisplay = document.getElementById('currentKey');

// Audio context and analyser
let audioContext;
let analyser;
let source;
let dataArray;
let bufferLength;
let animationId;

// Three.js variables
let scene, camera, renderer;
let visualizationObjects = [];
let currentMode = 'circle';
let particles = [];
let particleSystem;
let cameraRotation = { x: 0, y: 0 };
let bassLevel = 0;
let trebleLevel = 0;

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// Musical key detection
let currentKey = 'C';
let currentKeyColor = { h: 0, s: 100, l: 50 };

// Map musical notes to frequencies and colors
const noteFrequencies = {
    'C': { freq: 261.63, color: { h: 0, s: 100, l: 50 } },      // Red
    'C#': { freq: 277.18, color: { h: 30, s: 100, l: 50 } },    // Orange
    'D': { freq: 293.66, color: { h: 60, s: 100, l: 50 } },     // Yellow
    'D#': { freq: 311.13, color: { h: 90, s: 100, l: 50 } },    // Yellow-Green
    'E': { freq: 329.63, color: { h: 120, s: 100, l: 50 } },    // Green
    'F': { freq: 349.23, color: { h: 150, s: 100, l: 50 } },    // Cyan-Green
    'F#': { freq: 369.99, color: { h: 180, s: 100, l: 50 } },   // Cyan
    'G': { freq: 392.00, color: { h: 210, s: 100, l: 50 } },    // Light Blue
    'G#': { freq: 415.30, color: { h: 240, s: 100, l: 50 } },   // Blue
    'A': { freq: 440.00, color: { h: 270, s: 100, l: 50 } },    // Purple
    'A#': { freq: 466.16, color: { h: 300, s: 100, l: 50 } },   // Magenta
    'B': { freq: 493.88, color: { h: 330, s: 100, l: 50 } }     // Pink
};

// Detect musical key from frequency data
function detectMusicalKey() {
    if (!analyser || !dataArray) return;
    
    // Get frequency data
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    // Find dominant frequency bin
    let maxValue = 0;
    let maxIndex = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxValue) {
            maxValue = frequencyData[i];
            maxIndex = i;
        }
    }
    
    // Convert bin index to frequency
    const nyquist = audioContext.sampleRate / 2;
    const dominantFreq = (maxIndex * nyquist) / analyser.frequencyBinCount;
    
    // Find closest note
    let closestNote = 'C';
    let minDiff = Infinity;
    
    Object.keys(noteFrequencies).forEach(note => {
        // Check multiple octaves
        for (let octave = 0; octave < 5; octave++) {
            const freq = noteFrequencies[note].freq * Math.pow(2, octave);
            const diff = Math.abs(dominantFreq - freq);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        }
    });
    
    // Update current key if changed
    if (closestNote !== currentKey) {
        currentKey = closestNote;
        currentKeyColor = noteFrequencies[closestNote].color;
        currentKeyDisplay.textContent = closestNote;
        currentKeyDisplay.style.color = `hsl(${currentKeyColor.h}, ${currentKeyColor.s}%, 60%)`;
        currentKeyDisplay.style.textShadow = `0 0 10px hsl(${currentKeyColor.h}, ${currentKeyColor.s}%, 50%)`;
        updateVisualizationColors();
    }
}

// Update visualization colors based on detected key
function updateVisualizationColors() {
    const baseHue = currentKeyColor.h;
    
    visualizationObjects.forEach((obj, i) => {
        const hueOffset = (i / visualizationObjects.length) * 120 - 60; // ±60 degrees
        const hue = (baseHue + hueOffset + 360) % 360;
        
        const color = new THREE.Color(`hsl(${hue}, ${currentKeyColor.s}%, ${currentKeyColor.l}%)`);
        const emissive = new THREE.Color(`hsl(${hue}, ${currentKeyColor.s}%, ${currentKeyColor.l * 0.3}%)`);
        
        obj.material.color = color;
        obj.material.emissive = emissive;
    });
}

// Initialize Three.js scene
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.z = 50;
    camera.position.y = 10;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xff00ff, 2, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x00ffff, 2, 100);
    pointLight2.position.set(-20, -20, 20);
    scene.add(pointLight2);
    
    // Add directional light for better color visibility
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);
    
    // Add particle system for background effect
    createParticleSystem();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
    
    // Mouse interaction for camera rotation
    let mouseX = 0, mouseY = 0;
    container.addEventListener('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;
        cameraRotation.x = mouseY * 0.3;
        cameraRotation.y = mouseX * 0.3;
        
        // Update mouse position for raycaster
        mouse.x = mouseX;
        mouse.y = mouseY;
        
        // Change cursor on hover
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(visualizationObjects);
        container.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    });
    
    // Add click event listener
    container.addEventListener('click', onVisualizerClick);
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
        
        // Clear previous selection
        if (selectedObject && selectedObject !== clickedObject) {
            selectedObject.userData.isSelected = false;
        }
        
        // Toggle selection
        clickedObject.userData.isSelected = !clickedObject.userData.isSelected;
        selectedObject = clickedObject.userData.isSelected ? clickedObject : null;
        
        console.log('Selected:', clickedObject.userData.isSelected);
        
        // Trigger explosion effect
        if (clickedObject.userData.isSelected) {
            clickedObject.userData.explosionForce = 1.5;
            clickedObject.userData.explosionTime = Date.now();
            clickedObject.userData.spinBoost = 0.3;
            
            console.log('Explosion triggered!');
            
            // Change color temporarily
            const hue = Math.random() * 360;
            clickedObject.material.color.setHSL(hue / 360, 1, 0.5);
            clickedObject.material.emissive.setHSL(hue / 360, 1, 0.3);
            
            // Create ripple effect on nearby objects
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
        
        const hue = Math.random();
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
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

// Create circular visualization
function createCircleVisualization() {
    clearVisualization();
    const numBars = 128;
    const radius = 20;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numBars; i++) {
        // Random height variations for each bar
        const randomHeight = 0.8 + Math.random() * 0.4;
        const geometry = new THREE.BoxGeometry(0.5, 1 * randomHeight, 0.5);
        const hueOffset = (i / numBars) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 100,
            transparent: true,
            opacity: 0.85 + Math.random() * 0.15 // Random opacity
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
            randomPhase: Math.random() * Math.PI * 2, // Random phase offset
            randomSpeed: 0.8 + Math.random() * 0.4, // Random animation speed
            randomAmplitude: 0.7 + Math.random() * 0.6, // Random wave amplitude
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(bar);
        visualizationObjects.push(bar);
    }
}

// Create bar visualization
function createBarsVisualization() {
    clearVisualization();
    const numBars = 64;
    const spacing = 1.2;
    const startX = -(numBars * spacing) / 2;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numBars; i++) {
        // Random bar dimensions
        const randomWidth = 0.8 + Math.random() * 0.4;
        const randomDepth = 0.8 + Math.random() * 0.4;
        const geometry = new THREE.BoxGeometry(randomWidth, 1, randomDepth);
        const hueOffset = (i / numBars) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 80 + Math.random() * 40, // Random shininess
            transparent: true,
            opacity: 0.85 + Math.random() * 0.15
        });
        const bar = new THREE.Mesh(geometry, material);
        
        bar.position.x = startX + i * spacing;
        bar.position.y = 0;
        bar.userData = { 
            targetScale: 1, 
            pulsePhase: i * 0.1 + Math.random() * 0.5, // More random phase
            baseX: startX + i * spacing,
            velocity: 0,
            rotationVelocity: 0,
            tiltX: 0,
            tiltZ: 0,
            index: i,
            randomBounce: 0.7 + Math.random() * 0.6, // Random bounce intensity
            randomSpin: 0.5 + Math.random() * 1.0, // Random spin speed
            randomWave: Math.random() * Math.PI * 2, // Random wave offset
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(bar);
        visualizationObjects.push(bar);
    }
}

// Create sphere visualization
function createSphereVisualization() {
    clearVisualization();
    const numSpheres = 100;
    const radius = 25;
    const baseHue = currentKeyColor.h;
    
    for (let i = 0; i < numSpheres; i++) {
        // Random sphere sizes
        const randomSize = 0.3 + Math.random() * 0.4;
        const geometry = new THREE.SphereGeometry(randomSize, 16, 16);
        const hueOffset = (i / numSpheres) * 120 - 60;
        const hue = (baseHue + hueOffset + 360) % 360;
        
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${hue}, 100%, 50%)`),
            emissive: new THREE.Color(`hsl(${hue}, 100%, 30%)`),
            shininess: 50 + Math.random() * 100, // Varied shininess
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3
        });
        const sphere = new THREE.Mesh(geometry, material);
        
        // Fibonacci sphere distribution with random variation
        const phi = Math.acos(1 - 2 * (i + 0.5) / numSpheres);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        
        const radiusVariation = radius * (0.9 + Math.random() * 0.2); // Random distance from center
        sphere.position.x = Math.cos(theta) * Math.sin(phi) * radiusVariation;
        sphere.position.y = Math.sin(theta) * Math.sin(phi) * radiusVariation;
        sphere.position.z = Math.cos(phi) * radiusVariation;
        
        sphere.userData = { 
            baseX: sphere.position.x,
            baseY: sphere.position.y,
            baseZ: sphere.position.z,
            targetScale: 0.5,
            pulseSpeed: 0.015 + Math.random() * 0.04, // More varied speed
            rotationSpeed: (Math.random() - 0.5) * 0.08, // Faster random rotation
            velocity: 0,
            index: i,
            randomFloat: Math.random() * Math.PI * 2, // Random float offset
            randomOrbit: (Math.random() - 0.5) * 0.02, // Random orbital motion
            randomGlow: 0.5 + Math.random() * 0.5, // Random glow intensity
            isSelected: false,
            explosionForce: 0,
            spinBoost: 0,
            rippleForce: 0
        };
        
        scene.add(sphere);
        visualizationObjects.push(sphere);
    }
}

// Clear current visualization
function clearVisualization() {
    visualizationObjects.forEach(obj => {
        scene.remove(obj);
        obj.geometry.dispose();
        obj.material.dispose();
    });
    visualizationObjects = [];
}

// Handle file upload
audioFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Check if it's a valid audio/video file
        const validTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 
            'audio/m4a', 'audio/flac', 'audio/x-m4a', 'audio/aiff', 'audio/x-aiff',
            'audio/opus', 'audio/webm', 'audio/wma', 'audio/x-ms-wma',
            'video/mp4', 'video/webm', 'video/ogg'
        ];
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const acceptedExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'aiff', 'aif', 'opus', 'webm', 'oga', 'mp4', 'avi', 'mov'];
        
        // Check file type or extension
        const isValidType = validTypes.includes(file.type) || acceptedExtensions.includes(fileExtension);
        
        if (!isValidType && file.type && !file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
            alert('⚠️ Please select a valid audio file.\n\nSupported formats: MP3, WAV, OGG, M4A, AAC, FLAC, AIFF, OPUS, WEBM');
            audioFileInput.value = '';
            return;
        }
        
        fileNameDisplay.textContent = file.name;
        const fileURL = URL.createObjectURL(file);
        
        // Set the audio source and type
        audioElement.src = fileURL;
        
        // Try to set the correct MIME type based on extension
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
            audioElement.type = mimeTypes[fileExtension];
        }
        
        // Add error handler for unsupported formats
        audioElement.addEventListener('error', function(e) {
            let errorMessage = 'Error loading audio file. ';
            if (audioElement.error) {
                switch (audioElement.error.code) {
                    case audioElement.error.MEDIA_ERR_ABORTED:
                        errorMessage += 'Playback was aborted.';
                        break;
                    case audioElement.error.MEDIA_ERR_NETWORK:
                        errorMessage += 'Network error occurred.';
                        break;
                    case audioElement.error.MEDIA_ERR_DECODE:
                        errorMessage += 'The audio file format is not supported by your browser.';
                        break;
                    case audioElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage += 'The audio format or MIME type is not supported.\n\nTry converting to MP3, WAV, or OGG format.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                        break;
                }
            }
            alert('⚠️ ' + errorMessage);
            fileNameDisplay.textContent = 'Error loading file';
            playBtn.disabled = true;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        }, { once: true });
        
        // Initialize audio context on first file load
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512; // Increased from 256 to get more frequency bins (256 bins)
            analyser.smoothingTimeConstant = 0.8; // Smooth out audio data
            source = audioContext.createMediaElementSource(audioElement);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
        
        // Initialize Three.js if not already done
        if (!renderer) {
            initThreeJS();
            createCircleVisualization();
        }
        
        // Enable controls
        playBtn.disabled = false;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;
        modeCircleBtn.disabled = false;
        modeBarsBtn.disabled = false;
        modeSphereBtn.disabled = false;
        
        // Hide placeholder
        placeholder.classList.add('hidden');
    }
});

// Play button
playBtn.addEventListener('click', () => {
    audioContext.resume().then(() => {
        audioElement.play();
        draw();
    });
});

// Pause button
pauseBtn.addEventListener('click', () => {
    audioElement.pause();
});

// Stop button
stopBtn.addEventListener('click', () => {
    audioElement.pause();
    audioElement.currentTime = 0;
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

// 3D Visualizer animation function
function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate bass and treble levels for effects
        const bassSum = dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
        const trebleSum = dataArray.slice(dataArray.length - 16).reduce((a, b) => a + b, 0) / 16;
        bassLevel = bassSum / 255;
        trebleLevel = trebleSum / 255;
        
        // Detect musical key and update colors
        detectMusicalKey();
        
        // Update visualization based on mode
        if (currentMode === 'circle') {
            visualizationObjects.forEach((bar, i) => {
                // Map each bar to audio data - ensure even distribution
                // Use different mapping to avoid gaps
                const dataIndex = Math.min(
                    Math.floor((i / visualizationObjects.length) * (bufferLength - 1)),
                    bufferLength - 1
                );
                const audioValue = dataArray[dataIndex] || dataArray[i % bufferLength] || 0;
                const scale = (audioValue / 255) * 15 * bar.userData.randomAmplitude + 1;
                bar.userData.targetScale = scale;
                
                // Add velocity-based scaling for bounce effect
                bar.userData.velocity += (bar.userData.targetScale - bar.scale.y) * (0.2 * bar.userData.randomSpeed);
                bar.userData.velocity *= 0.85; // Damping
                bar.scale.y += bar.userData.velocity;
                bar.position.y = (bar.scale.y - 1) * 0.5;
                
                // Pulse outward with bass - more dramatic with randomness
                const radiusOffset = bassLevel * 8 * bar.userData.randomAmplitude;
                const currentRadius = 1 + radiusOffset / 20;
                bar.position.x = bar.userData.baseX * currentRadius;
                bar.position.z = bar.userData.baseZ * currentRadius;
                
                // Add multiple wave motions for dancing effect with random phases
                const wave1 = Math.sin(Date.now() * 0.003 * bar.userData.randomSpeed + i * 0.1 + bar.userData.randomPhase) * trebleLevel * 3 * bar.userData.randomAmplitude;
                const wave2 = Math.cos(Date.now() * 0.005 * bar.userData.randomSpeed + i * 0.15 + bar.userData.randomPhase) * bassLevel * 2;
                const wave3 = Math.sin(Date.now() * 0.004 + bar.userData.randomPhase) * (audioValue / 255) * 2; // Audio-reactive wave
                bar.position.y += wave1 + wave2 + wave3;
                
                // Twist/spiral motion with randomness
                const twist = Math.sin(Date.now() * 0.002 + i * 0.05 + bar.userData.randomPhase) * bassLevel * 0.3 * bar.userData.randomAmplitude;
                bar.rotation.z = twist;
                
                // Individual bar rotation with random variation
                bar.userData.rotationSpeed += (audioValue / 255) * 0.05 * bar.userData.randomSpeed;
                bar.userData.rotationSpeed *= 0.95;
                bar.rotation.x += bar.userData.rotationSpeed;
                
                // Scale width for emphasis with random factor
                const widthScale = 1 + (audioValue / 255) * 0.5 * bar.userData.randomAmplitude;
                bar.scale.x = widthScale;
                bar.scale.z = widthScale;
                
                // Random opacity pulsing
                bar.material.opacity = 0.7 + (audioValue / 255) * 0.3 + Math.sin(Date.now() * 0.002 + bar.userData.randomPhase) * 0.1;
                
                // Apply click effects
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
                
                // Apply ripple effects
                if (bar.userData.rippleForce > 0) {
                    bar.scale.y *= (1 + bar.userData.rippleForce);
                    bar.userData.rippleForce *= 0.9;
                }
                
                // Highlight selected object
                if (bar.userData.isSelected) {
                    bar.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    bar.material.emissiveIntensity = 1 + glowPulse;
                }
            });
            
            // More dynamic scene rotation with slight randomness
            scene.rotation.y += 0.002 + bassLevel * 0.005 + Math.sin(Date.now() * 0.001) * 0.001;
            scene.rotation.z = Math.sin(Date.now() * 0.001) * trebleLevel * 0.03;
            scene.rotation.x = Math.cos(Date.now() * 0.0008) * bassLevel * 0.02;
            
        } else if (currentMode === 'bars') {
            visualizationObjects.forEach((bar, i) => {
                const audioValue = dataArray[i * 2] || 0;
                const scale = (audioValue / 255) * 20 * bar.userData.randomBounce + 1;
                bar.userData.targetScale = scale;
                
                // Velocity-based bounce with random variation
                bar.userData.velocity += (bar.userData.targetScale - bar.scale.y) * (0.25 * bar.userData.randomBounce);
                bar.userData.velocity *= 0.8; // Less damping for more bounce
                bar.scale.y += bar.userData.velocity;
                bar.position.y = (bar.scale.y - 1) * 0.5;
                
                // Exaggerated pulsing effect with randomness
                const pulse = Math.sin(Date.now() * 0.005 + bar.userData.pulsePhase) * bassLevel * 1.5 * bar.userData.randomBounce;
                bar.scale.x = 1 + pulse + (audioValue / 255) * 0.8;
                bar.scale.z = 1 + pulse + (audioValue / 255) * 0.8;
                
                // Wave motion along X axis with random offset
                const waveX = Math.sin(Date.now() * 0.004 + i * 0.2 + bar.userData.randomWave) * bassLevel * 5 * bar.userData.randomBounce;
                bar.position.x = bar.userData.baseX + waveX;
                
                // Jumping/bouncing motion with random intensity
                const jump = Math.abs(Math.sin(Date.now() * 0.006 + i * 0.15 + bar.userData.randomWave)) * trebleLevel * 4 * bar.userData.randomBounce;
                bar.position.y += jump;
                
                // Add Z-axis wave for more 3D motion
                const waveZ = Math.cos(Date.now() * 0.003 + i * 0.25 + bar.userData.randomWave) * trebleLevel * 2;
                bar.position.z = waveZ;
                
                // Dynamic tilting with randomness
                bar.userData.tiltX += ((audioValue / 255) * 0.5 * bar.userData.randomBounce - bar.userData.tiltX) * 0.2;
                bar.userData.tiltZ += (Math.sin(Date.now() * 0.003 + i * 0.1) * bassLevel * 0.5 - bar.userData.tiltZ) * 0.2;
                bar.rotation.x = bar.userData.tiltX;
                bar.rotation.z = bar.userData.tiltZ;
                
                // Spinning on Y axis with random speed
                bar.userData.rotationVelocity += (audioValue / 255) * 0.08 * bar.userData.randomSpin;
                bar.userData.rotationVelocity *= 0.92;
                bar.rotation.y += bar.userData.rotationVelocity + trebleLevel * 0.05 * bar.userData.randomSpin;
                
                // Random opacity variation
                bar.material.opacity = 0.75 + (audioValue / 255) * 0.25 + Math.sin(Date.now() * 0.003 + bar.userData.randomWave) * 0.1;
                
                // Apply click effects
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
                
                // Apply ripple effects
                if (bar.userData.rippleForce > 0) {
                    bar.scale.y *= (1 + bar.userData.rippleForce * 2);
                    bar.position.y += bar.userData.rippleForce * 3;
                    bar.userData.rippleForce *= 0.9;
                }
                
                // Highlight selected object
                if (bar.userData.isSelected) {
                    bar.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    bar.material.emissiveIntensity = 1 + glowPulse;
                }
            });
            
            // Scene motion - more dramatic with randomness
            scene.rotation.y += 0.001 + bassLevel * 0.004 + Math.sin(Date.now() * 0.0005) * 0.001;
            scene.rotation.x = Math.sin(Date.now() * 0.002) * 0.05 + trebleLevel * 0.03 + Math.cos(Date.now() * 0.0007) * 0.02;
            scene.rotation.z = Math.cos(Date.now() * 0.0015) * 0.04 + bassLevel * 0.02;
            
        } else if (currentMode === 'sphere') {
            visualizationObjects.forEach((sphere, i) => {
                // Map spheres to audio data
                const dataIndex = Math.floor((i / visualizationObjects.length) * bufferLength);
                const audioValue = dataArray[dataIndex] || 0;
                const scale = (audioValue / 255) * 3 * sphere.userData.randomGlow + 0.5;
                sphere.userData.targetScale = scale;
                
                // Velocity-based scaling for bounce
                sphere.userData.velocity += (sphere.userData.targetScale - sphere.scale.x) * 0.3;
                sphere.userData.velocity *= 0.85;
                const newScale = sphere.scale.x + sphere.userData.velocity;
                sphere.scale.set(newScale, newScale, newScale);
                
                // Pulse position outward - more dramatic with randomness
                const pulseAmount = 1 + bassLevel * 0.5 * sphere.userData.randomGlow + (audioValue / 255) * 0.3;
                sphere.position.x = sphere.userData.baseX * pulseAmount;
                sphere.position.y = sphere.userData.baseY * pulseAmount;
                sphere.position.z = sphere.userData.baseZ * pulseAmount;
                
                // Add complex floating motion with random phases
                const float1 = Math.sin(Date.now() * sphere.userData.pulseSpeed + sphere.userData.randomFloat) * trebleLevel * 4 * sphere.userData.randomGlow;
                const float2 = Math.cos(Date.now() * sphere.userData.pulseSpeed * 0.7 + sphere.userData.randomFloat) * trebleLevel * 3;
                const float3 = Math.sin(Date.now() * sphere.userData.pulseSpeed * 1.3 + sphere.userData.randomFloat) * bassLevel * 3;
                const float4 = Math.cos(Date.now() * sphere.userData.pulseSpeed * 0.5 + sphere.userData.randomFloat) * (audioValue / 255) * 2; // Audio-reactive
                
                sphere.position.x += float1 + float4;
                sphere.position.y += float2 + float4 * 0.7;
                sphere.position.z += float3 + float4 * 0.5;
                
                // Orbital motion for extra dynamism
                const orbitAngle = Date.now() * sphere.userData.randomOrbit;
                sphere.position.x += Math.cos(orbitAngle) * bassLevel * 3;
                sphere.position.z += Math.sin(orbitAngle) * bassLevel * 3;
                
                // Individual sphere rotation with random speeds
                sphere.rotation.x += sphere.userData.rotationSpeed * (1 + trebleLevel) * sphere.userData.randomGlow;
                sphere.rotation.y += sphere.userData.rotationSpeed * 0.7 * (1 + bassLevel);
                sphere.rotation.z += sphere.userData.rotationSpeed * 0.5;
                
                // Wobble effect with randomness
                const wobble = Math.sin(Date.now() * 0.004 + i * 0.2 + sphere.userData.randomFloat) * bassLevel * 0.3 * sphere.userData.randomGlow;
                sphere.rotation.x += wobble;
                
                // Opacity pulsing with random intensity
                sphere.material.opacity = 0.5 + (audioValue / 255) * 0.4 * sphere.userData.randomGlow + Math.sin(Date.now() * sphere.userData.pulseSpeed) * 0.2;
                
                // Glow effect - vary emissive intensity
                const glowIntensity = (audioValue / 255) * sphere.userData.randomGlow;
                sphere.material.emissiveIntensity = 0.3 + glowIntensity * 0.7;
                
                // Apply click effects
                if (sphere.userData.explosionForce > 0) {
                    const timeSinceExplosion = (Date.now() - sphere.userData.explosionTime) / 1000;
                    const explosionScale = Math.max(0, sphere.userData.explosionForce * (1 - timeSinceExplosion * 0.7));
                    const currentScale = sphere.scale.x * (1 + explosionScale * 2);
                    sphere.scale.set(currentScale, currentScale, currentScale);
                    sphere.userData.rotationSpeed += sphere.userData.spinBoost;
                    sphere.userData.spinBoost *= 0.95;
                    sphere.userData.explosionForce *= 0.92;
                    
                    // Push outward
                    const pushAmount = 1 + explosionScale;
                    sphere.position.x = sphere.userData.baseX * pulseAmount * pushAmount;
                    sphere.position.y = sphere.userData.baseY * pulseAmount * pushAmount;
                    sphere.position.z = sphere.userData.baseZ * pulseAmount * pushAmount;
                }
                
                // Apply ripple effects
                if (sphere.userData.rippleForce > 0) {
                    const rippleScale = sphere.scale.x * (1 + sphere.userData.rippleForce);
                    sphere.scale.set(rippleScale, rippleScale, rippleScale);
                    sphere.userData.rippleForce *= 0.92;
                }
                
                // Highlight selected object
                if (sphere.userData.isSelected) {
                    sphere.material.opacity = 1.0;
                    const glowPulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                    sphere.material.emissiveIntensity = 2 + glowPulse * 2;
                }
            });
            
            // More dynamic scene rotation with organic randomness
            scene.rotation.x += 0.001 + trebleLevel * 0.002 + Math.sin(Date.now() * 0.0006) * 0.001;
            scene.rotation.y += 0.001 + bassLevel * 0.003 + Math.cos(Date.now() * 0.0004) * 0.001;
            scene.rotation.z = Math.sin(Date.now() * 0.002) * bassLevel * 0.05 + Math.cos(Date.now() * 0.0008) * trebleLevel * 0.03;
        }
        
        // Update particle system
        if (particleSystem) {
            particleSystem.rotation.y += 0.0005 + bassLevel * 0.002;
            particleSystem.rotation.x += 0.0002 + trebleLevel * 0.001;
            
            // Pulse particle opacity with bass
            particleSystem.material.opacity = 0.3 + bassLevel * 0.4;
        }
        
        // Smooth camera movement based on mouse
        camera.position.x += (cameraRotation.y * 20 - camera.position.x) * 0.05;
        camera.position.y += (10 + cameraRotation.x * 20 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
    }
    
    if (renderer) {
        renderer.render(scene, camera);
    }
}

// Start animation when playing
audioElement.addEventListener('play', () => {
    if (!animationId) {
        animate();
    }
});

// Auto-pause animation when audio ends
audioElement.addEventListener('ended', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
});