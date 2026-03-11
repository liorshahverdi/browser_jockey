/**
 * Hot Cues (CDJ-Style) — F-004
 * 8 labeled, color-coded cue points per track.
 * Persisted to localStorage keyed by file hash (name|size).
 */

export const HOT_CUE_COLORS = [
    '#ff4444', '#ff9900', '#ffdd00', '#44dd44',
    '#44aaff', '#8844ff', '#ff44cc', '#ffffff'
];

const STORAGE_PREFIX = 'bj_hotcues_';

export class HotCueManager {
    constructor(trackId) {
        this.trackId = trackId; // 'track1' or 'track2'
        this.cues = new Array(8).fill(null);
        this.fileHash = null;
    }

    /**
     * Store current playhead position as cue point id (0-7).
     */
    setCue(id, time) {
        this.cues[id] = { id, time, label: '', color: HOT_CUE_COLORS[id] };
        if (this.fileHash) this._save();
    }

    /**
     * Seek audioElement to cue id. Returns true if cue exists, false if empty.
     * If paused, seeks without playing (pre-cue behaviour).
     */
    jumpToCue(id, audioElement) {
        const cue = this.cues[id];
        if (!cue) return false;
        audioElement.currentTime = cue.time;
        return true;
    }

    /**
     * Clear cue slot id.
     */
    deleteCue(id) {
        this.cues[id] = null;
        if (this.fileHash) this._save();
    }

    /**
     * Set editable label (max 12 chars) for an existing cue.
     */
    setLabel(id, label) {
        if (this.cues[id]) {
            this.cues[id].label = label.slice(0, 12);
            if (this.fileHash) this._save();
        }
    }

    /**
     * Load cues from localStorage for the given file hash.
     * Resets cues to empty array if no saved data exists.
     */
    loadCues(fileHash) {
        this.fileHash = fileHash;
        try {
            const raw = localStorage.getItem(STORAGE_PREFIX + fileHash + '_' + this.trackId);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length === 8) {
                    this.cues = parsed;
                    return;
                }
            }
        } catch {}
        this.cues = new Array(8).fill(null);
    }

    getCues() {
        return this.cues;
    }

    _save() {
        try {
            localStorage.setItem(
                STORAGE_PREFIX + this.fileHash + '_' + this.trackId,
                JSON.stringify(this.cues)
            );
        } catch {}
    }
}
