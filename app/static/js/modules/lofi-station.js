/**
 * F-022  Lo-fi Station — Generative Lo-fi Instrument
 *
 * Pure Web-Audio synthesis: drums + chords + melody + ambient textures.
 * Connects to the master merger bus via routingGain.
 */

/* ── helpers ─────────────────────────────────────────────────── */

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* ── constants ───────────────────────────────────────────────── */

const SCHEDULE_INTERVAL = 25;   // ms
const LOOK_AHEAD        = 0.1;  // seconds
const STEPS              = 64;  // 16th-notes in 4-bar cycle

// Minor-pentatonic intervals from root (semitones)
const MINOR_PENTA = [0, 3, 5, 7, 10];
const BLUES_SCALE = [0, 3, 5, 6, 7, 10];

// Jazz chord progressions as arrays of [rootOffset, quality]
// rootOffset = semitones above key root, quality = array of semitone intervals
const CHORD_PROGRESSIONS = [
    // ii-V-I-vi  (Dm7 G7 Cmaj7 Am7 in C)
    [[2,[0,3,7,10]], [7,[0,4,7,10]], [0,[0,4,7,11]], [9,[0,3,7,10]]],
    // I-vi-ii-V
    [[0,[0,4,7,11]], [9,[0,3,7,10]], [2,[0,3,7,10]], [7,[0,4,7,10]]],
    // I-IV-vi-V
    [[0,[0,4,7,11]], [5,[0,4,7,11]], [9,[0,3,7,10]], [7,[0,4,7,10]]],
    // vi-IV-I-V
    [[9,[0,3,7,10]], [5,[0,4,7,11]], [0,[0,4,7,11]], [7,[0,4,7,10]]],
    // iii-vi-ii-V
    [[4,[0,3,7,10]], [9,[0,3,7,10]], [2,[0,3,7,10]], [7,[0,4,7,10]]],
    // I-iii-IV-iv (borrowing minor iv)
    [[0,[0,4,7,11]], [4,[0,3,7,10]], [5,[0,4,7,11]], [5,[0,3,7,10]]],
];

// Key roots (MIDI note numbers, octave 3)
const KEY_ROOTS = [48, 50, 51, 53, 55]; // C3, D3, Eb3, F3, G3

/* ── drum patterns ───────────────────────────────────────────── */
// Each pattern: array of 64 steps, value = velocity (0 = silent)

function makeDrumPatterns() {
    const kickBase = [
        // boom-bap
        [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0,
         1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
        // simple 4otf
        [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0,
         1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
        // syncopated
        [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0,
         1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
        // sparse
        [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0,
         1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,  1,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
    ];

    const snareBase = [
        [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0,  0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0,
         0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0,  0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
        [0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0,  0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0,
         0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0,  0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    ];

    const hatBase = [
        // straight 8ths
        [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0,  1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0,
         1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0,  1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
        // 16ths with accents
        [1,0,.4,0, 1,0,.4,0, 1,0,.4,0, 1,0,.4,.3,  1,0,.4,0, 1,0,.4,0, 1,0,.4,0, 1,0,.4,.3,
         1,0,.4,0, 1,0,.4,0, 1,0,.4,0, 1,0,.4,.3,  1,0,.4,0, 1,0,.4,.5, 1,0,.4,.5, 1,.3,.5,.3],
        // sparse
        [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0,  0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0,
         0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0,  0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,.5],
    ];

    return {
        kick:  pick(kickBase),
        snare: pick(snareBase),
        hat:   pick(hatBase),
    };
}

/* ── melody pattern generation ───────────────────────────────── */

function makeMelodyPattern(keyRoot, progression) {
    const pattern = new Array(STEPS).fill(null);
    const density = rand(0.25, 0.40);
    const scale = Math.random() < 0.5 ? MINOR_PENTA : BLUES_SCALE;

    for (let i = 0; i < STEPS; i++) {
        if (Math.random() > density) continue;
        const bar = Math.floor(i / 16);
        const [rootOffset] = progression[bar];
        const chordRoot = keyRoot + rootOffset;
        const interval = pick(scale);
        // melody one octave above chord root
        pattern[i] = chordRoot + 12 + interval;
    }
    return pattern;
}

/* ── bitcrusher worklet (inline) ─────────────────────────────── */

const BITCRUSHER_CODE = `
class BitcrusherProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{ name: 'reduction', defaultValue: 1, minValue: 1, maxValue: 16 }];
    }
    constructor() { super(); this._held = 0; this._count = 0; }
    process(inputs, outputs, params) {
        const input  = inputs[0];
        const output = outputs[0];
        if (!input || !input.length) return true;
        const reduction = params.reduction.length === 1
            ? params.reduction[0] : params.reduction;
        for (let ch = 0; ch < input.length; ch++) {
            const inp = input[ch];
            const out = output[ch];
            const r = typeof reduction === 'number' ? reduction : reduction[0];
            for (let i = 0; i < inp.length; i++) {
                this._count++;
                if (this._count >= r) {
                    this._count = 0;
                    this._held = inp[i];
                }
                out[i] = this._held;
            }
        }
        return true;
    }
}
registerProcessor('lofi-bitcrusher', BitcrusherProcessor);
`;

/* ── saturation curve ────────────────────────────────────────── */

function makeSaturationCurve(amount) {
    const n = 8192;
    const curve = new Float32Array(n);
    const k = amount * 50;
    for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve;
}

/* ═══════════════════════════════════════════════════════════════
   LofiStation class
   ═══════════════════════════════════════════════════════════════ */

export class LofiStation {

    constructor() {
        this.ac = null;
        this._initialized = false;
        this._playing = false;
        this._bpm = 75;
        this._lofiAmount = 0.5;

        // audio nodes (created in initialize)
        this.drumGain    = null;
        this.chordGain   = null;
        this.melodyGain  = null;
        this.ambientGain = null;
        this.preFxGain   = null;
        this.lofiFilter  = null;
        this.waveShaperNode = null;
        this.bitcrusherNode = null;
        this.wowDelay    = null;
        this.wowLfo      = null;
        this.wowLfoGain  = null;
        this.outputGain  = null;
        this.routingGain = null;

        // shared noise buffer
        this._noiseBuffer = null;

        // ambient sources (continuous)
        this._crackleSource = null;
        this._hissSource    = null;

        // scheduler state
        this._timerId   = null;
        this._nextStep  = 0;
        this._nextTime  = 0;

        // patterns
        this._drums      = null;
        this._chordProg  = null;
        this._keyRoot    = 48;
        this._melody     = null;

        // layer mute state
        this._muted = { drums: false, chords: false, melody: false, ambient: false };

        // active chord oscillators (so we can stop them)
        this._activeChordOscs = [];
    }

    /* ── public API ──────────────────────────────────────────── */

    async initialize(audioContext, merger) {
        if (this._initialized) return;
        this._initialized = true;
        this.ac = audioContext;

        // layer gains
        this.drumGain    = this.ac.createGain(); this.drumGain.gain.value    = 0.7;
        this.chordGain   = this.ac.createGain(); this.chordGain.gain.value   = 0.25;
        this.melodyGain  = this.ac.createGain(); this.melodyGain.gain.value  = 0.3;
        this.ambientGain = this.ac.createGain(); this.ambientGain.gain.value = 0.15;

        // pre-fx bus
        this.preFxGain = this.ac.createGain();
        this.preFxGain.gain.value = 1;
        this.drumGain.connect(this.preFxGain);
        this.chordGain.connect(this.preFxGain);
        this.melodyGain.connect(this.preFxGain);

        // lo-fi filter (lowpass)
        this.lofiFilter = this.ac.createBiquadFilter();
        this.lofiFilter.type = 'lowpass';
        this.lofiFilter.frequency.value = 8000;
        this.lofiFilter.Q.value = 0.7;
        this.preFxGain.connect(this.lofiFilter);

        // ambient bypasses preFx but goes through filter
        this.ambientGain.connect(this.lofiFilter);

        // tape saturation
        this.waveShaperNode = this.ac.createWaveShaper();
        this.waveShaperNode.oversample = '4x';
        this.waveShaperNode.curve = makeSaturationCurve(this._lofiAmount);
        this.lofiFilter.connect(this.waveShaperNode);

        // bitcrusher worklet
        try {
            const blob = new Blob([BITCRUSHER_CODE], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            await this.ac.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);
            this.bitcrusherNode = new AudioWorkletNode(this.ac, 'lofi-bitcrusher');
            this.waveShaperNode.connect(this.bitcrusherNode);
        } catch (e) {
            console.warn('Lo-fi Station: bitcrusher worklet failed, bypassing:', e);
            this.bitcrusherNode = null;
        }

        const afterCrusher = this.bitcrusherNode || this.waveShaperNode;

        // wow/flutter delay
        this.wowDelay = this.ac.createDelay(0.05);
        this.wowDelay.delayTime.value = 0.005;
        this.wowLfo = this.ac.createOscillator();
        this.wowLfo.type = 'sine';
        this.wowLfo.frequency.value = 0.4;
        this.wowLfoGain = this.ac.createGain();
        this.wowLfoGain.gain.value = 0.0005;
        this.wowLfo.connect(this.wowLfoGain);
        this.wowLfoGain.connect(this.wowDelay.delayTime);
        this.wowLfo.start();
        afterCrusher.connect(this.wowDelay);

        // output
        this.outputGain = this.ac.createGain();
        this.outputGain.gain.value = 0.8;
        this.routingGain = this.ac.createGain();
        this.routingGain.gain.value = 1;
        this.wowDelay.connect(this.outputGain);
        this.outputGain.connect(this.routingGain);
        this.routingGain.connect(merger);

        // shared noise buffer (2 seconds of white noise)
        const sr = this.ac.sampleRate;
        this._noiseBuffer = this.ac.createBuffer(1, sr * 2, sr);
        const data = this._noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        // apply initial lo-fi amount
        this.setLofiAmount(this._lofiAmount);

        // generate initial patterns
        this.regenerate();

        console.log('✅ Lo-fi Station audio chain ready');
    }

    getRoutingGain() { return this.routingGain; }

    play() {
        if (!this._initialized || this._playing) return;
        this._playing = true;
        this._nextStep = 0;
        this._nextTime = this.ac.currentTime + 0.05;
        this._startAmbient();
        this._schedulerTick();
        this._timerId = setInterval(() => this._schedulerTick(), SCHEDULE_INTERVAL);
    }

    stop() {
        if (!this._playing) return;
        this._playing = false;
        if (this._timerId) { clearInterval(this._timerId); this._timerId = null; }
        this._stopAmbient();
        this._stopActiveChords();
    }

    syncBPM(bpm) {
        this._bpm = clamp(bpm, 40, 200);
    }

    regenerate() {
        this._keyRoot = pick(KEY_ROOTS);
        this._chordProg = pick(CHORD_PROGRESSIONS);
        this._drums = makeDrumPatterns();
        this._melody = makeMelodyPattern(this._keyRoot, this._chordProg);
    }

    setLofiAmount(v) {
        this._lofiAmount = clamp(v, 0, 1);
        if (!this._initialized) return;

        // lowpass: 20000 → 2500 Hz (exponential)
        const minF = 2500, maxF = 20000;
        const freq = maxF * Math.pow(minF / maxF, this._lofiAmount);
        this.lofiFilter.frequency.setTargetAtTime(freq, this.ac.currentTime, 0.05);

        // saturation curve intensity
        this.waveShaperNode.curve = makeSaturationCurve(this._lofiAmount);

        // bitcrusher: reduction 1 → 8
        if (this.bitcrusherNode) {
            const red = 1 + this._lofiAmount * 7;
            this.bitcrusherNode.parameters.get('reduction')
                .setTargetAtTime(red, this.ac.currentTime, 0.05);
        }

        // wow depth
        const depth = 0.0001 + this._lofiAmount * 0.002;
        this.wowLfoGain.gain.setTargetAtTime(depth, this.ac.currentTime, 0.05);
    }

    setLayerVolume(layer, v) {
        const node = this._layerNode(layer);
        if (node) node.gain.setTargetAtTime(clamp(v, 0, 1), this.ac.currentTime, 0.02);
    }

    toggleLayerMute(layer) {
        this._muted[layer] = !this._muted[layer];
        const node = this._layerNode(layer);
        if (node) {
            node.gain.setTargetAtTime(
                this._muted[layer] ? 0 : 1,
                this.ac.currentTime, 0.02
            );
        }
        return this._muted[layer];
    }

    setVolume(v) {
        if (this.outputGain) {
            this.outputGain.gain.setTargetAtTime(clamp(v, 0, 1), this.ac.currentTime, 0.02);
        }
    }

    /* ── private: layer node lookup ──────────────────────────── */

    _layerNode(name) {
        switch (name) {
            case 'drums':   return this.drumGain;
            case 'chords':  return this.chordGain;
            case 'melody':  return this.melodyGain;
            case 'ambient': return this.ambientGain;
        }
        return null;
    }

    /* ── private: scheduler ──────────────────────────────────── */

    _schedulerTick() {
        const stepDur = 60 / this._bpm / 4; // duration of one 16th note
        while (this._nextTime < this.ac.currentTime + LOOK_AHEAD) {
            this._playStep(this._nextStep, this._nextTime, stepDur);
            this._nextTime += stepDur;
            this._nextStep = (this._nextStep + 1) % STEPS;
        }
    }

    _playStep(step, time, stepDur) {
        const bar = Math.floor(step / 16);

        // ── drums ──
        if (!this._muted.drums && this._drums) {
            const kv = this._drums.kick[step];
            if (kv) this._playKick(time, kv);

            const sv = this._drums.snare[step];
            if (sv) this._playSnare(time, sv);

            const hv = this._drums.hat[step];
            if (hv) this._playHat(time, typeof hv === 'number' ? hv : 1);
        }

        // ── chords (trigger on first step of each bar) ──
        if (!this._muted.chords && step % 16 === 0 && this._chordProg) {
            this._playChord(bar, time, stepDur * 16);
        }

        // ── melody ──
        if (!this._muted.melody && this._melody && this._melody[step] != null) {
            this._playMelodyNote(this._melody[step], time, stepDur * rand(1.5, 3));
        }
    }

    /* ── private: drum synthesis ──────────────────────────────── */

    _playKick(time, vel) {
        const osc = this.ac.createOscillator();
        const gain = this.ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
        gain.gain.setValueAtTime(0.9 * vel, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        osc.connect(gain);
        gain.connect(this.drumGain);
        osc.start(time);
        osc.stop(time + 0.3);
    }

    _playSnare(time, vel) {
        // tonal body
        const osc = this.ac.createOscillator();
        const oscGain = this.ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = 200;
        oscGain.gain.setValueAtTime(0.5 * vel, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(oscGain);
        oscGain.connect(this.drumGain);
        osc.start(time);
        osc.stop(time + 0.06);

        // noise burst
        const src = this.ac.createBufferSource();
        src.buffer = this._noiseBuffer;
        const bp = this.ac.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 5000;
        bp.Q.value = 0.8;
        const nGain = this.ac.createGain();
        nGain.gain.setValueAtTime(0.6 * vel, time);
        nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        src.connect(bp);
        bp.connect(nGain);
        nGain.connect(this.drumGain);
        src.start(time);
        src.stop(time + 0.16);
    }

    _playHat(time, vel) {
        const src = this.ac.createBufferSource();
        src.buffer = this._noiseBuffer;
        const hp = this.ac.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 8000;
        const gain = this.ac.createGain();
        const v = vel * rand(0.15, 0.35);
        gain.gain.setValueAtTime(v, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + rand(0.03, 0.08));
        src.connect(hp);
        hp.connect(gain);
        gain.connect(this.drumGain);
        src.start(time);
        src.stop(time + 0.1);
    }

    /* ── private: chord synthesis ─────────────────────────────── */

    _playChord(bar, time, dur) {
        this._stopActiveChords(time);

        const [rootOffset, intervals] = this._chordProg[bar % this._chordProg.length];
        const rootMidi = this._keyRoot + rootOffset;

        for (const interval of intervals) {
            const freq = 440 * Math.pow(2, (rootMidi + interval - 69) / 12);

            // saw + triangle detuned pair
            const osc1 = this.ac.createOscillator();
            const osc2 = this.ac.createOscillator();
            osc1.type = 'sawtooth';
            osc2.type = 'triangle';
            osc1.frequency.value = freq;
            osc2.frequency.value = freq;
            osc1.detune.value = 5;
            osc2.detune.value = -5;

            const noteGain = this.ac.createGain();
            noteGain.gain.setValueAtTime(0, time);
            noteGain.gain.linearRampToValueAtTime(0.08, time + 0.3);  // slow attack
            noteGain.gain.setValueAtTime(0.08, time + dur - 0.8);
            noteGain.gain.linearRampToValueAtTime(0, time + dur);      // release

            osc1.connect(noteGain);
            osc2.connect(noteGain);
            noteGain.connect(this.chordGain);

            osc1.start(time);
            osc2.start(time);
            osc1.stop(time + dur + 0.1);
            osc2.stop(time + dur + 0.1);

            this._activeChordOscs.push(
                { osc: osc1, gain: noteGain, end: time + dur },
                { osc: osc2, gain: noteGain, end: time + dur }
            );
        }
    }

    _stopActiveChords(now) {
        const t = now || this.ac.currentTime;
        this._activeChordOscs = this._activeChordOscs.filter(entry => {
            if (entry.end <= t + 0.01) {
                try { entry.osc.stop(); } catch (_) { /* already stopped */ }
                return false;
            }
            return true;
        });
    }

    /* ── private: melody synthesis ────────────────────────────── */

    _playMelodyNote(midi, time, dur) {
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        const osc = this.ac.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        // occasional pitch slide
        if (Math.random() < 0.15) {
            const target = freq * (Math.random() < 0.5 ? 1.06 : 0.94);
            osc.frequency.linearRampToValueAtTime(target, time + dur * 0.5);
        }

        const gain = this.ac.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
        gain.gain.setValueAtTime(0.2, time + dur - 0.1);
        gain.gain.linearRampToValueAtTime(0, time + dur);

        osc.connect(gain);
        gain.connect(this.melodyGain);
        osc.start(time);
        osc.stop(time + dur + 0.01);
    }

    /* ── private: ambient layer (continuous) ──────────────────── */

    _startAmbient() {
        if (this._crackleSource) return;

        // vinyl crackle: bandpass noise
        this._crackleSource = this.ac.createBufferSource();
        this._crackleSource.buffer = this._noiseBuffer;
        this._crackleSource.loop = true;
        const crackleBP = this.ac.createBiquadFilter();
        crackleBP.type = 'bandpass';
        crackleBP.frequency.value = 1800;
        crackleBP.Q.value = 0.5;
        const crackleGain = this.ac.createGain();
        crackleGain.gain.value = 0.04;
        this._crackleSource.connect(crackleBP);
        crackleBP.connect(crackleGain);
        crackleGain.connect(this.ambientGain);
        this._crackleSource.start();
        this._crackleGain = crackleGain;

        // tape hiss: highpass noise
        this._hissSource = this.ac.createBufferSource();
        this._hissSource.buffer = this._noiseBuffer;
        this._hissSource.loop = true;
        const hissHP = this.ac.createBiquadFilter();
        hissHP.type = 'highpass';
        hissHP.frequency.value = 6000;
        const hissGain = this.ac.createGain();
        hissGain.gain.value = 0.02;
        this._hissSource.connect(hissHP);
        hissHP.connect(hissGain);
        hissGain.connect(this.ambientGain);
        this._hissSource.start();
        this._hissGain = hissGain;
    }

    _stopAmbient() {
        try { this._crackleSource?.stop(); } catch (_) { /* */ }
        try { this._hissSource?.stop(); } catch (_) { /* */ }
        this._crackleSource = null;
        this._hissSource = null;
    }
}
