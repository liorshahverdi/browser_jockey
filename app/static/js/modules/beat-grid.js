/**
 * Beat Grid + Quantize — F-005
 *
 * Generates a beat grid from detected (or tapped) BPM, renders it as a
 * canvas overlay, and optionally snaps loop A/B points and hot cues to
 * the nearest beat.
 */

export class BeatGrid {
    constructor() {
        this.bpm             = 0;     // current BPM (0 = unknown)
        this.firstBeatOffset = 0;     // seconds — fine-tune grid alignment
        this.snapEnabled     = false; // quantize loop & cue points to beats
        this.gridVisible     = false; // show overlay (toggled on after load)
        this._tapTimes       = [];    // ms timestamps for tap-tempo
    }

    /** Set BPM from detection; resets calibration offset. */
    setBPM(bpm) {
        this.bpm             = (bpm && bpm > 0) ? bpm : 0;
        this.firstBeatOffset = 0;
        this._tapTimes       = [];
    }

    /** Seconds between consecutive beats. */
    getBeatInterval() {
        return this.bpm > 0 ? 60 / this.bpm : 0;
    }

    /**
     * Snap rawTime (seconds) to the nearest beat boundary.
     * Returns rawTime unchanged when snap is off or BPM is unknown.
     */
    snapTime(rawTime) {
        const interval = this.getBeatInterval();
        if (!interval) return rawTime;
        const relative = rawTime - this.firstBeatOffset;
        return Math.max(0, this.firstBeatOffset + Math.round(relative / interval) * interval);
    }

    /**
     * Record a tap for tap-tempo. Resets the sequence if the last tap
     * was more than 3 s ago.  Returns the computed BPM after ≥2 taps,
     * or null on the first tap.
     */
    tap() {
        const now = Date.now();
        if (this._tapTimes.length &&
            now - this._tapTimes[this._tapTimes.length - 1] > 3000) {
            this._tapTimes = [];
        }
        this._tapTimes.push(now);
        if (this._tapTimes.length > 8) this._tapTimes.shift();
        if (this._tapTimes.length < 2) return null;

        const recent = this._tapTimes.slice(-4);
        let sumMs = 0;
        for (let i = 1; i < recent.length; i++) sumMs += recent[i] - recent[i - 1];
        const avgMs  = sumMs / (recent.length - 1);
        const tapBPM = 60000 / avgMs;

        if (tapBPM >= 3 && tapBPM <= 300) {
            this.bpm = Math.round(tapBPM * 10) / 10; // 1 decimal place
        }
        return this.bpm;
    }

    getTapCount() { return this._tapTimes.length; }

    /** Nudge firstBeatOffset by ±1/16 of a beat. */
    nudge(direction) {
        const interval = this.getBeatInterval();
        if (!interval) return;
        this.firstBeatOffset = Math.max(
            -interval,
            this.firstBeatOffset + direction * interval / 16
        );
    }

    /**
     * Draw the beat grid onto an overlay canvas positioned on the waveform.
     *
     * Beat lines:  1 px wide, 55 % height, 30 % opacity
     * Bar lines:   2 px wide, full height, 70 % opacity + fade at edges
     */
    draw(canvas, zoomState) {
        const dpr    = window.devicePixelRatio || 1;
        const cssW   = canvas.offsetWidth;
        const cssH   = canvas.offsetHeight;
        const width  = Math.round(cssW * dpr);
        const height = Math.round(cssH * dpr);

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width  = width;
            canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        if (!this.gridVisible || this.bpm <= 0 || !zoomState.audioBuffer) return;

        const duration      = zoomState.audioBuffer.duration;
        const interval      = this.getBeatInterval();
        const viewStartTime = zoomState.offset * duration;
        const viewDuration  = duration / zoomState.level;
        const viewEndTime   = viewStartTime + viewDuration;

        const firstN = Math.floor((viewStartTime - this.firstBeatOffset) / interval) - 1;
        const lastN  = Math.ceil( (viewEndTime   - this.firstBeatOffset) / interval) + 1;

        for (let n = firstN; n <= lastN; n++) {
            const beatTime = this.firstBeatOffset + n * interval;
            if (beatTime < 0 || beatTime > duration) continue;

            const xNorm = (beatTime - viewStartTime) / viewDuration;
            if (xNorm < 0 || xNorm > 1) continue;

            const x      = xNorm * width;
            const isBar  = ((n % 4) + 4) % 4 === 0;

            ctx.save();

            if (isBar) {
                // Full-height bar line, soft fade at top/bottom edges
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                grad.addColorStop(0,    'rgba(255,255,255,0)');
                grad.addColorStop(0.08, 'rgba(255,255,255,0.85)');
                grad.addColorStop(0.92, 'rgba(255,255,255,0.85)');
                grad.addColorStop(1,    'rgba(255,255,255,0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth   = 2 * dpr;
                ctx.globalAlpha = 0.70;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            } else {
                // Shorter beat tick, centred vertically
                const tickH = height * 0.55;
                const tickY = (height - tickH) / 2;
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth   = 1 * dpr;
                ctx.globalAlpha = 0.28;
                ctx.beginPath();
                ctx.moveTo(x, tickY);
                ctx.lineTo(x, tickY + tickH);
                ctx.stroke();
            }

            ctx.restore();
        }
    }
}
