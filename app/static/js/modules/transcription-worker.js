import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/dist/transformers.min.js';

env.allowRemoteModels = true;
env.allowLocalModels  = false;

let transcriber = null;

self.addEventListener('message', async ({ data }) => {
    if (data.type === 'load')       await loadModel();
    if (data.type === 'transcribe') await runTranscription(data.audio, data.options ?? {});
});

async function loadModel() {
    if (transcriber) { self.postMessage({ type: 'ready' }); return; }
    try {
        self.postMessage({ type: 'status', message: 'Downloading Whisper model (~290 MB)…' });
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
            progress_callback: (p) => {
                if (p.status === 'progress')
                    self.postMessage({ type: 'model-progress', file: p.file ?? '', progress: Math.round(p.progress ?? 0) });
                else if (p.status === 'downloading')
                    self.postMessage({ type: 'status', message: `Downloading ${(p.file ?? '').split('/').pop()}…` });
                else if (p.status === 'loading')
                    self.postMessage({ type: 'status', message: 'Loading model into memory…' });
            }
        });
        self.postMessage({ type: 'ready' });
    } catch (e) {
        self.postMessage({ type: 'error', message: `Model load failed: ${e.message}` });
        transcriber = null;
    }
}

async function runTranscription(audio, options) {
    if (!transcriber) { self.postMessage({ type: 'error', message: 'Model not loaded.' }); return; }
    try {
        self.postMessage({ type: 'status', message: 'Transcribing audio…' });
        // return_timestamps must always be true to enable chunked inference over long audio;
        // without it the pipeline only processes the first 30-second window.
        // no_repeat_ngram_size prevents the repetition-loop hallucination common in whisper-tiny.
        // stride_length_s kept small (2s) so minimal previous-chunk context is re-fed into the
        // next chunk — large stride amplifies loops across boundaries.
        const opts = {
            return_timestamps: true,
            chunk_length_s: 30,
            stride_length_s: 2,
            no_repeat_ngram_size: 3,
        };
        if (options.language && options.language !== 'auto') opts.language = options.language;
        // Pass as a plain Float32Array — Transformers.js v3 ASR pipeline expects raw typed array
        // (already resampled to 16 kHz by prepareAudio in the main thread)
        const audioFloat32 = audio instanceof Float32Array ? audio : new Float32Array(audio);
        const result = await transcriber(audioFloat32, opts);

        let text;
        if (options.timestamps && result.chunks?.length) {
            text = result.chunks.map(c => {
                const s = Array.isArray(c.timestamp) ? (c.timestamp[0] ?? 0) : 0;
                const mm = Math.floor(s / 60), ss = String(Math.floor(s % 60)).padStart(2, '0');
                return `[${mm}:${ss}] ${c.text.trim()}`;
            }).join('\n');
        } else {
            // Timestamps were only used internally for chunking — join chunk text without them
            text = result.chunks?.length
                ? result.chunks.map(c => c.text.trim()).join(' ')
                : (result.text ?? '');
        }
        self.postMessage({ type: 'result', text: text.trim() });
    } catch (e) {
        self.postMessage({ type: 'error', message: `Transcription failed: ${e.message}` });
    }
}
