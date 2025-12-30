/**
 * Phase Vocoder TimeStretch Processor
 * AudioWorklet processor for real-time time-stretching without pitch changes
 * Using phase vocoder algorithm with configurable buffer size
 */

class TimeStretchProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();
        
        // Parameters
        this.stretchRatio = 1.0; // 0.5x - 2.0x
        this.bufferSize = options.processorOptions?.bufferSize || 2048;
        this.hopSize = this.bufferSize / 4;
        
        // Buffers for phase vocoder
        this.inputBuffer = new Float32Array(this.bufferSize * 2);
        this.outputBuffer = new Float32Array(this.bufferSize * 2);
        this.fftBuffer = new Float32Array(this.bufferSize);
        this.lastPhase = new Float32Array(this.bufferSize / 2 + 1);
        this.sumPhase = new Float32Array(this.bufferSize / 2 + 1);
        
        // Circular buffer management
        this.writeIndex = 0;
        this.readIndex = 0;
        this.outputIndex = 0;
        
        // Windowing function (Hann window)
        this.window = this.createHannWindow(this.bufferSize);
        
        // Listen for parameter changes
        this.port.onmessage = (event) => {
            if (event.data.stretchRatio !== undefined) {
                this.stretchRatio = Math.max(0.5, Math.min(2.0, event.data.stretchRatio));
            }
        };
    }
    
    /**
     * Create Hann window for smooth transitions
     */
    createHannWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
        }
        return window;
    }
    
    /**
     * Simple FFT implementation for phase vocoder
     * Note: For production, consider using a dedicated FFT library
     */
    simpleFFT(real, imag) {
        const n = real.length;
        const logN = Math.log2(n);
        
        // Bit reversal
        for (let i = 0; i < n; i++) {
            const j = this.reverseBits(i, logN);
            if (j > i) {
                [real[i], real[j]] = [real[j], real[i]];
                [imag[i], imag[j]] = [imag[j], imag[i]];
            }
        }
        
        // FFT calculation
        for (let s = 1; s <= logN; s++) {
            const m = 1 << s;
            const m2 = m >> 1;
            const wAngle = -2 * Math.PI / m;
            
            for (let k = 0; k < n; k += m) {
                for (let j = 0; j < m2; j++) {
                    const angle = wAngle * j;
                    const wReal = Math.cos(angle);
                    const wImag = Math.sin(angle);
                    
                    const t1 = k + j;
                    const t2 = t1 + m2;
                    
                    const tReal = wReal * real[t2] - wImag * imag[t2];
                    const tImag = wReal * imag[t2] + wImag * real[t2];
                    
                    real[t2] = real[t1] - tReal;
                    imag[t2] = imag[t1] - tImag;
                    real[t1] += tReal;
                    imag[t1] += tImag;
                }
            }
        }
    }
    
    reverseBits(x, bits) {
        let y = 0;
        for (let i = 0; i < bits; i++) {
            y = (y << 1) | (x & 1);
            x >>= 1;
        }
        return y;
    }
    
    /**
     * Process audio using phase vocoder
     */
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        
        if (!input || !input.length || !output || !output.length) {
            return true;
        }
        
        // Process all channels (stereo support)
        const numChannels = Math.min(input.length, output.length);
        for (let channel = 0; channel < numChannels; channel++) {
            if (input[channel] && output[channel]) {
                // TEMPORARY: Simple passthrough for now
                // Phase vocoder timestretching will be implemented in offline processing
                output[channel].set(input[channel]);
            }
        }
        
        // Log stretch ratio changes for debugging
        if (this.stretchRatio !== this._lastLoggedRatio) {
            console.log(`🎵 Timestretch ratio: ${this.stretchRatio.toFixed(2)}x (passthrough mode) - ${numChannels} channel(s)`);
            this._lastLoggedRatio = this.stretchRatio;
        }
        
        return true; // Keep processor alive
    }
    
    static get parameterDescriptors() {
        return [{
            name: 'stretchRatio',
            defaultValue: 1.0,
            minValue: 0.5,
            maxValue: 2.0,
            automationRate: 'k-rate'
        }];
    }
}

registerProcessor('timestretch-processor', TimeStretchProcessor);
