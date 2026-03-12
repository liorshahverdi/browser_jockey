const WORKER_URL = new URL('./transcription-worker.js', import.meta.url);

export class Transcriber {
    constructor() {
        this._worker = null;
        this._modelReady = false;
        // Callbacks
        this.onStatus = null;
        this.onModelProgress = null;
        this.onReady = null;
        this.onResult = null;
        this.onError = null;
    }

    _ensureWorker() {
        if (this._worker) return;
        this._worker = new Worker(WORKER_URL, { type: 'module' });
        this._worker.onmessage = ({ data: msg }) => {
            switch (msg.type) {
                case 'status':         this.onStatus?.(msg.message); break;
                case 'model-progress': this.onModelProgress?.(msg.file, msg.progress); break;
                case 'ready':          this._modelReady = true; this.onReady?.(); break;
                case 'result':         this.onResult?.(msg.text); break;
                case 'error':          this.onError?.(msg.message); break;
            }
        };
        this._worker.onerror = e => this.onError?.(`Worker error: ${e.message}`);
    }

    loadModel() {
        this._ensureWorker();
        if (this._modelReady) { this.onReady?.(); return; }
        this._worker.postMessage({ type: 'load' });
    }

    async transcribe(blob, audioContext, options = {}) {
        this._ensureWorker();
        try {
            this.onStatus?.('Preparing audio…');
            const float32 = await prepareAudio(blob, audioContext);
            this._worker.postMessage({ type: 'transcribe', audio: float32, options }, [float32.buffer]);
        } catch (e) {
            this.onError?.(`Audio preparation failed: ${e.message}`);
        }
    }
}

async function prepareAudio(blob, audioContext) {
    const audioBuffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    // Mix to mono
    const len = audioBuffer.length, nCh = audioBuffer.numberOfChannels;
    const mono = new Float32Array(len);
    for (let ch = 0; ch < nCh; ch++) {
        const d = audioBuffer.getChannelData(ch);
        for (let i = 0; i < len; i++) mono[i] += d[i];
    }
    if (nCh > 1) for (let i = 0; i < len; i++) mono[i] /= nCh;
    // Resample to 16 kHz
    const src = audioBuffer.sampleRate, tgt = 16000;
    if (src === tgt) return mono;
    const ratio = src / tgt, outLen = Math.ceil(len / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
        const p = i * ratio, f = Math.floor(p), fr = p - f;
        out[i] = (mono[f] ?? 0) + fr * ((mono[f+1] ?? 0) - (mono[f] ?? 0));
    }
    return out;
}
