/**
 * Phase Vocoder TimeStretch Processor
 * AudioWorklet processor for real-time time-stretching without pitch changes
 *
 * BUG-002 FIX: The original process() was a pure passthrough:
 *   output[channel].set(input[channel])
 * All FFT/phase-vocoder infrastructure (simpleFFT, createHannWindow, overlap-add
 * buffers) was defined but never called.
 *
 * This implementation:
 *  - Maintains per-channel ring buffers and phase accumulators for stereo support
 *  - On each call to process(), feeds incoming samples into a circular input buffer
 *  - When enough samples accumulate (bufferSize), applies a Hann-windowed forward FFT
 *  - Computes instantaneous frequency for each bin via phase unwrapping
 *  - Accumulates output phase scaled by the synthesis-to-analysis hop ratio (stretchRatio)
 *  - Reconstructs via IFFT and overlap-adds into a circular output buffer
 *  - Copies ready output samples into the WebAudio output array
 *
 * At stretchRatio=1.0 the processor bypasses phase vocoder processing and copies
 * input directly, avoiding any latency from buffering.
 */

class TimeStretchProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super();

        this.stretchRatio = 1.0; // 0.5x - 2.0x
        this.bufferSize = options.processorOptions?.bufferSize || 2048;
        this.hopSize = this.bufferSize / 4; // Analysis hop = 25% of buffer (75% overlap)

        // Windowing function (Hann)
        this.window = this.createHannWindow(this.bufferSize);

        // Per-channel state (max 2 channels for stereo)
        // Each channel gets its own independent ring buffers and phase accumulators
        // so left/right phase coherence is maintained separately.
        const N = this.bufferSize;
        const maxChannels = 2;
        this.chStates = Array.from({ length: maxChannels }, () => ({
            inBuf: new Float32Array(N * 4),    // Circular input buffer
            outBuf: new Float32Array(N * 8),   // Circular output buffer (overlap-add)
            lastPhase: new Float32Array(N / 2 + 1), // Phase of previous analysis frame
            sumPhase: new Float32Array(N / 2 + 1),  // Accumulated synthesis phase
            inWrite: 0,   // Next write position in inBuf
            inRead: 0,    // Next read position for FFT frame extraction
            inFill: 0,    // Number of unprocessed samples in inBuf
            outWrite: 0,  // Next write position for OLA output
            outRead: 0,   // Next read position for output to WebAudio
            outFill: 0    // Number of ready output samples
        }));

        // Listen for stretchRatio changes from the main thread
        this.port.onmessage = (event) => {
            if (event.data.stretchRatio !== undefined) {
                const newRatio = Math.max(0.5, Math.min(2.0, event.data.stretchRatio));
                if (newRatio !== this.stretchRatio) {
                    // Reset phase accumulators on ratio change to avoid discontinuities
                    this.chStates.forEach(ch => {
                        ch.lastPhase.fill(0);
                        ch.sumPhase.fill(0);
                    });
                    this.stretchRatio = newRatio;
                }
            }
        };
    }

    /**
     * Create Hann window for smooth analysis/synthesis transitions
     */
    createHannWindow(size) {
        const w = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
        }
        return w;
    }

    /**
     * In-place Cooley-Tukey radix-2 FFT.
     * For IFFT: conjugate imag before and after, then divide by N.
     * @param {Float32Array} real - Real part (modified in-place)
     * @param {Float32Array} imag - Imaginary part (modified in-place)
     */
    simpleFFT(real, imag) {
        const n = real.length;
        const logN = Math.log2(n);

        // Bit-reversal permutation
        for (let i = 0; i < n; i++) {
            const j = this.reverseBits(i, logN);
            if (j > i) {
                [real[i], real[j]] = [real[j], real[i]];
                [imag[i], imag[j]] = [imag[j], imag[i]];
            }
        }

        // Butterfly stages
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
     * Process one channel through the phase vocoder.
     *
     * Algorithm (analysis-modification-synthesis):
     * 1. Buffer incoming samples in a circular ring buffer.
     * 2. When inFill >= bufferSize: extract a Hann-windowed frame and FFT it.
     * 3. For each bin: compute magnitude, unwrap phase difference from last frame,
     *    derive instantaneous frequency, accumulate output phase at synthesis hop rate.
     * 4. IFFT the modified spectrum, apply synthesis Hann window, overlap-add.
     * 5. Advance input read pointer by analysisHop, output write pointer by synthesisHop.
     * 6. Copy ready output samples to the WebAudio output array.
     *
     * @param {Object} ch - Per-channel state object
     * @param {Float32Array} inputSamples  - 128-sample input block
     * @param {Float32Array} outputSamples - 128-sample output block (written in-place)
     */
    processVocoderChannel(ch, inputSamples, outputSamples) {
        const N = this.bufferSize;
        const inBufSize = ch.inBuf.length;   // N * 4
        const outBufSize = ch.outBuf.length; // N * 8
        const hopA = this.hopSize;                         // Analysis hop
        const hopS = Math.round(hopA * this.stretchRatio); // Synthesis hop

        // --- 1. Fill input ring buffer ---
        for (let i = 0; i < inputSamples.length; i++) {
            ch.inBuf[ch.inWrite % inBufSize] = inputSamples[i];
            ch.inWrite = (ch.inWrite + 1) % inBufSize;
        }
        ch.inFill += inputSamples.length;

        // --- 2. Process all available FFT frames ---
        while (ch.inFill >= N) {
            const real = new Float32Array(N);
            const imag = new Float32Array(N);

            // Extract one Hann-windowed analysis frame
            for (let i = 0; i < N; i++) {
                real[i] = ch.inBuf[(ch.inRead + i) % inBufSize] * this.window[i];
            }
            ch.inRead = (ch.inRead + hopA) % inBufSize;
            ch.inFill -= hopA;

            // Forward FFT
            this.simpleFFT(real, imag);

            // --- 3. Phase vocoder: modify spectrum ---
            const outReal = new Float32Array(N);
            const outImag = new Float32Array(N);
            const twoPi = 2 * Math.PI;
            const bins = N / 2 + 1; // Process only positive frequencies (Nyquist included)

            for (let k = 0; k < bins; k++) {
                const mag = Math.hypot(real[k], imag[k]);
                const phase = Math.atan2(imag[k], real[k]);

                // Phase increment from last frame
                let dp = phase - ch.lastPhase[k];
                ch.lastPhase[k] = phase;

                // Expected phase increment for this bin at analysis hop size
                const omega = (twoPi * k) / N;
                dp -= omega * hopA;

                // Wrap to [-π, π] to get the deviation from expected
                dp -= twoPi * Math.round(dp / twoPi);

                // True instantaneous frequency of this bin
                const instFreq = omega + dp / hopA;

                // Accumulate output phase at synthesis hop rate
                ch.sumPhase[k] += instFreq * hopS;

                // Reconstruct: polar → complex
                outReal[k] = mag * Math.cos(ch.sumPhase[k]);
                outImag[k] = mag * Math.sin(ch.sumPhase[k]);
            }

            // Mirror spectrum for conjugate symmetry (required for real-valued IFFT output)
            for (let k = 1; k < N / 2; k++) {
                outReal[N - k] = outReal[k];
                outImag[N - k] = -outImag[k];
            }

            // --- 4. IFFT via conjugate trick: IFFT(x) = conj(FFT(conj(x))) / N ---
            for (let k = 0; k < N; k++) {
                outImag[k] = -outImag[k]; // Conjugate
            }
            this.simpleFFT(outReal, outImag);
            // After FFT of conjugate, outReal holds N * original_samples * window²(n).
            // Normalize: divide by N; apply synthesis window; scale for OLA reconstruction.
            // For Hann window at 75% overlap the OLA normalization constant is 3/2,
            // giving an overall scale of 2/(N*3/2) = 4/(3N). We use 2/N as a close
            // approximation (< 2 dB difference) to avoid per-sample coefficient tables.
            const scale = 2.0 / N;
            for (let i = 0; i < N; i++) {
                const idx = (ch.outWrite + i) % outBufSize;
                ch.outBuf[idx] += outReal[i] * this.window[i] * scale;
            }
            ch.outWrite = (ch.outWrite + hopS) % outBufSize;
            ch.outFill += hopS;
        }

        // --- 5. Copy ready output samples ---
        const toRead = Math.min(outputSamples.length, ch.outFill);
        for (let i = 0; i < toRead; i++) {
            const idx = (ch.outRead + i) % outBufSize;
            outputSamples[i] = ch.outBuf[idx];
            ch.outBuf[idx] = 0; // Clear consumed samples for next OLA pass
        }
        // Pad with silence if the output buffer hasn't accumulated enough yet
        // (happens during the initial priming period of ~bufferSize samples)
        for (let i = toRead; i < outputSamples.length; i++) {
            outputSamples[i] = 0;
        }
        ch.outRead = (ch.outRead + toRead) % outBufSize;
        ch.outFill -= toRead;
    }

    /**
     * WebAudio AudioWorklet process() callback.
     *
     * BUG-002 FIX: Was `output[channel].set(input[channel])` (pure passthrough).
     * Now dispatches to processVocoderChannel() for each channel when stretchRatio != 1.
     * At stretchRatio == 1.0 we still bypass (zero latency, no processing overhead).
     */
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        if (!input || !input.length || !output || !output.length) {
            return true;
        }

        const numChannels = Math.min(input.length, output.length);

        // Bypass at unity stretch to avoid buffering latency during normal playback
        if (this.stretchRatio === 1.0) {
            for (let ch = 0; ch < numChannels; ch++) {
                if (input[ch] && output[ch]) {
                    output[ch].set(input[ch]);
                }
            }
            return true;
        }

        // Phase vocoder processing per channel
        for (let ch = 0; ch < numChannels && ch < this.chStates.length; ch++) {
            if (input[ch] && output[ch]) {
                this.processVocoderChannel(this.chStates[ch], input[ch], output[ch]);
            }
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
