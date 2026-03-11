/**
 * Sidechain Compression — F-009
 *
 * Ducks Track 2 based on Track 1's RMS energy. Uses an AnalyserNode tap on
 * Track 1 and a dedicated GainNode inserted into Track 2's output path.
 * Gain ramps are applied with setTargetAtTime for smooth attack/release.
 */
export class SidechainCompressor {
    constructor(audioContext) {
        this.ac        = audioContext;
        this.enabled   = false;

        // Parameters (user-adjustable)
        this.threshold = -12;   // dBFS — level at which ducking begins
        this.ratio     = 4;     // compression ratio (e.g. 4 → 4:1)
        this.attack    = 5;     // ms
        this.release   = 150;   // ms
        this.wet       = 1.0;   // 0–1 blend between ducked and unducked T2

        // Audio nodes
        this.analyserNode    = null;  // taps Track 1 signal
        this.duckGain        = null;  // inserted into Track 2 chain

        // Internal state
        this._buffer         = null;
        this._lastGain       = 1.0;
        this._rafId          = null;
        this._track2Final    = null;
        this._merger         = null;
        this._isSetUp        = false;

        // Optional UI callback — called each tick with GR% (0–100)
        this.onGainReduction = null;
    }

    /**
     * Wire up audio nodes. Call once after audioContext + effects chain are ready.
     *
     * @param {AudioNode} track1TapNode   - Any node on Track 1's path to tap (e.g. gain1)
     * @param {AudioNode} track2FinalMix  - finalMix2: the last node in Track 2's chain before merger
     * @param {AudioNode} merger          - The shared mix-bus GainNode both tracks feed
     */
    setup(track1TapNode, track2FinalMix, merger) {
        if (this._isSetUp) return;

        // --- Track 1 tap ---
        this.analyserNode = this.ac.createAnalyser();
        this.analyserNode.fftSize = 256;
        this.analyserNode.smoothingTimeConstant = 0;  // raw per-block RMS
        this._buffer = new Float32Array(this.analyserNode.fftSize);
        track1TapNode.connect(this.analyserNode);
        // analyserNode produces no output — it's a side-tap only

        // --- Track 2 duck gain (inserted between finalMix2 and merger) ---
        this.duckGain = this.ac.createGain();
        this.duckGain.gain.value = 1.0;
        this._track2Final = track2FinalMix;
        this._merger      = merger;

        try {
            track2FinalMix.disconnect(merger);
        } catch (e) {
            console.warn('SidechainCompressor: could not disconnect finalMix2 from merger:', e.message);
        }
        track2FinalMix.connect(this.duckGain);
        this.duckGain.connect(merger);

        this._isSetUp = true;
    }

    enable() {
        if (!this._isSetUp || this.enabled) return;
        this.enabled = true;
        this._tick();
    }

    disable() {
        this.enabled = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
        if (this.duckGain) {
            this.duckGain.gain.cancelScheduledValues(this.ac.currentTime);
            this.duckGain.gain.setTargetAtTime(1.0, this.ac.currentTime, 0.005);
        }
        this._lastGain = 1.0;
        if (this.onGainReduction) this.onGainReduction(0);
    }

    _tick() {
        if (!this.enabled) return;
        this._process();
        this._rafId = requestAnimationFrame(() => this._tick());
    }

    _process() {
        if (!this.analyserNode || !this.duckGain) return;

        // 1. Compute RMS of Track 1
        this.analyserNode.getFloatTimeDomainData(this._buffer);
        let sum = 0;
        for (let i = 0; i < this._buffer.length; i++) sum += this._buffer[i] ** 2;
        const rms   = Math.sqrt(sum / this._buffer.length);
        const rmsDb = 20 * Math.log10(rms + 1e-10);

        // 2. Compute target gain for Track 2
        let targetGain = 1.0;
        if (rmsDb > this.threshold) {
            const over         = rmsDb - this.threshold;
            const reductionDb  = -over * (1 - 1 / this.ratio);
            const rawGain      = 10 ** (reductionDb / 20);
            targetGain = 1 - this.wet * (1 - rawGain);
        }

        // 3. Smooth gain with attack / release time constants
        const now       = this.ac.currentTime;
        const attacking = targetGain < this._lastGain;
        const tc        = attacking ? this.attack / 3000 : this.release / 3000;
        this.duckGain.gain.setTargetAtTime(Math.max(0, targetGain), now, tc);
        this._lastGain = targetGain;

        // 4. Notify UI of gain reduction amount
        if (this.onGainReduction) {
            this.onGainReduction(Math.round(Math.max(0, (1 - targetGain) * 100)));
        }
    }

    // --- Parameter setters ---
    setThreshold(db)  { this.threshold = db; }
    setRatio(r)       { this.ratio = r; }
    setAttack(ms)     { this.attack = ms; }
    setRelease(ms)    { this.release = ms; }
    setWet(v)         { this.wet = Math.max(0, Math.min(1, v)); }

    isReady() { return this._isSetUp; }

    destroy() {
        this.disable();
        if (this.analyserNode) try { this.analyserNode.disconnect(); } catch (e) {}
        if (this._isSetUp && this._track2Final && this.duckGain && this._merger) {
            try {
                this._track2Final.disconnect(this.duckGain);
                this.duckGain.disconnect(this._merger);
                this._track2Final.connect(this._merger);
            } catch (e) {}
        }
        this._isSetUp = false;
    }
}
