/**
 * Pattern Deck — F-021
 *
 * Embeds a live Strudel coding environment synced to the current track BPM.
 * Strudel uses its own AudioContext and outputs directly to speakers.
 * BPM sync injects setcps() into the editor code.
 *
 * API: replEl.editor → StrudelMirror instance with setCode/getCode/evaluate/start/stop/hush.
 * NOT CodeMirror 6 EditorView (which is a different, inner object).
 */
import { SidechainCompressor } from './sidechain.js';

const STRUDEL_CDN = 'https://esm.sh/@strudel/repl@1.3.0';
const STRUDEL_ELEMENT = 'strudel-editor';

const PRESETS = {
  kicksnare: `sound("bd ~ sd ~")`,
  fullkit: `stack(
  sound("bd ~ sd ~"),
  sound("hh*8").gain(0.35),
  sound("cp:2").every(4, fast(2))
)`,
  bassline: `note("<c2 ~ eb2 f2>")
  .sound("sawtooth").lpf(600).gain(0.55)`,
  acid: `note("c3 [c3 c3] eb3 f3*2")
  .sound("sawtooth")
  .lpf(sine.range(400, 2000).slow(4))
  .res(10).gain(0.5)`,
  pads: `note("<Cm7 Fm7 Bb7 Eb7>/2")
  .sound("piano").room(0.6).gain(0.3).attack(0.2)`,
  jungle: `sound("bd:3 sd:2 [bd:3 bd:3] sd:2").fast(2)`
};

export class PatternDeck {
  constructor() {
    this.replEl       = null;   // <strudel-repl> element
    this.mirror       = null;   // StrudelMirror (replEl.editor)
    this.currentBpm   = 120;
    this.audioContext = null;
    this.strudelOutputGain = null;
    this.strudelDuckGain   = null;
    this.strudelAnalyser   = null;
    this.sidechain    = null;
    this._initialized = false;
    this._loadingPromise = null;
  }

  async initialize(audioContext, merger) {
    if (this._initialized) return;
    this._initialized = true;
    this.audioContext      = audioContext;
    this.strudelOutputGain = audioContext.createGain();
    this.strudelDuckGain   = audioContext.createGain();
    this.strudelAnalyser   = audioContext.createAnalyser();
    this.strudelOutputGain.connect(this.strudelDuckGain);
    this.strudelDuckGain.connect(merger);
    this.strudelOutputGain.connect(this.strudelAnalyser);
    this.strudelOutputGain.gain.value = 0.8;
    this._setupControls();
    console.log('✅ PatternDeck audio chain ready');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async play() {
    const ok = await this._ensureStrudelLoaded();
    if (!ok) return;
    this._evalRepl();
  }

  stop() {
    if (!this.replEl) return;
    if (typeof this.mirror?.stop    === 'function') { this.mirror.stop();    return; }
    if (typeof this.mirror?.hush    === 'function') { this.mirror.hush();    return; }
    if (typeof this.replEl.stop     === 'function') { this.replEl.stop();    return; }
    if (typeof this.replEl.hush     === 'function') { this.replEl.hush();    return; }
    console.warn('PatternDeck: no stop/hush method found');
  }

  syncBPM(bpm) {
    if (!bpm || isNaN(bpm)) return;
    this.currentBpm = bpm;
    const cps = (bpm / 240).toFixed(4);
    const cpsEl = document.getElementById('patternDeckCps');
    const bpmEl = document.getElementById('patternDeckBpm');
    if (cpsEl) cpsEl.textContent = parseFloat(cps).toFixed(2);
    if (bpmEl) bpmEl.textContent = Math.round(bpm);
    const current = this._getCode();
    if (!current) return;
    const updated = /^setcps\([^)]+\)/m.test(current)
      ? current.replace(/^setcps\([^)]+\)/m, `setcps(${cps})`)
      : `setcps(${cps})\n${current}`;
    this._setCode(updated);
  }

  async loadPreset(name) {
    const code = PRESETS[name];
    if (!code) return;
    const ok = await this._ensureStrudelLoaded();
    if (!ok) return;
    const cps = (this.currentBpm / 240).toFixed(4);
    this._setCode(`setcps(${cps})\n${code}`);
    this._evalRepl();
  }

  setVolume(v) {
    if (this.strudelOutputGain)
      this.strudelOutputGain.gain.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
  }

  enableSidechain(sourceGainNode) {
    if (!sourceGainNode) {
      console.warn('PatternDeck.enableSidechain: sourceGainNode not ready');
      return;
    }
    this.sidechain?.disable();
    this.sidechain = new SidechainCompressor();
    this.sidechain.trySetupPatternDeck(
      sourceGainNode, this.strudelOutputGain, this.strudelDuckGain, this.audioContext
    );
  }

  disableSidechain() {
    this.sidechain?.disable();
    this.sidechain = null;
  }

  // ── Lazy load ─────────────────────────────────────────────────────────────

  _ensureStrudelLoaded() {
    if (this.replEl) return Promise.resolve(true);
    if (!this._loadingPromise) this._loadingPromise = this._doLoad();
    return this._loadingPromise;
  }

  async _doLoad() {
    const container = document.getElementById('patternDeckEditor');
    if (!container) return false;

    // Intercept the moment superdough wires its destinationGain → strudelCtx.destination.
    // We redirect that connection through a MediaStream bridge into our master chain.
    // Must be armed BEFORE the import so it's in place when evaluate() triggers
    // superdough's lazy audio init.
    this._setupOutputRouting();

    try {
      // esm.sh loads multiple copies of @strudel/core, each trying to call
      // customElements.define('strudel-editor'). The 2nd+ calls throw
      // NotSupportedError and prevent the evalScope from loading (no audio).
      // Patch the prototype once to silently skip duplicate registrations.
      if (!CustomElementRegistry.prototype._strudelPatched) {
        const _orig = CustomElementRegistry.prototype.define;
        CustomElementRegistry.prototype.define = function(name, ctor, opts) {
          if (this.get(name)) return;
          return _orig.call(this, name, ctor, opts);
        };
        CustomElementRegistry.prototype._strudelPatched = true;
      }

      await import(STRUDEL_CDN);
      const defined = !!customElements.get(STRUDEL_ELEMENT);
      console.log(`✅ PatternDeck: @strudel/repl loaded, ${STRUDEL_ELEMENT} defined: ${defined}`);

      container.innerHTML = '';
      this.replEl = document.createElement(STRUDEL_ELEMENT);
      this.replEl.id = 'patternDeckRepl';
      container.appendChild(this.replEl);

      await customElements.whenDefined(STRUDEL_ELEMENT);
      console.log(`✅ PatternDeck: ${STRUDEL_ELEMENT} upgraded`);

      // replEl.editor → StrudelMirror instance (has setCode/evaluate/start/stop/hush).
      // This is NOT a CM6 EditorView — it's Strudel's own mirror object.
      this.mirror = await this._waitForMirror();

      // Set default code once mirror is available
      const defaultCode = `setcps(0.5)\nstack(\n  sound("bd ~ sd ~"),\n  sound("hh*8").gain(0.35)\n)`;
      this._setCode(defaultCode);

      // Diagnostics
      const elMethods = ['evaluate','start','stop','hush','play','setCode','getCode']
        .filter(m => typeof this.replEl[m] === 'function');
      const mirrorMethods = this.mirror
        ? ['evaluate','start','stop','hush','setCode','getCode']
            .filter(m => typeof this.mirror[m] === 'function')
        : [];
      console.log(
        '✅ PatternDeck: REPL ready.',
        'replEl methods:', elMethods.join(', ') || '(none)',
        '| mirror methods:', mirrorMethods.join(', ') || '(none)'
      );
      return true;

    } catch (e) {
      console.error('PatternDeck: load failed:', e);
      this._loadingPromise = null;
      return false;
    }
  }

  // ── StrudelMirror / editor helpers ────────────────────────────────────────

  _waitForMirror() {
    return new Promise((resolve) => {
      let attempts = 0;
      const check = () => {
        const mirror = this.replEl?.editor;
        // StrudelMirror exposes evaluate, start, setCode etc.
        if (mirror && (typeof mirror.evaluate === 'function' || typeof mirror.setCode === 'function')) {
          console.log('✅ PatternDeck: StrudelMirror found on replEl.editor');
          resolve(mirror);
        } else if (attempts++ > 80) {
          console.warn('PatternDeck: StrudelMirror not found after 12s — will use replEl fallbacks');
          resolve(null);
        } else {
          setTimeout(check, 150);
        }
      };
      check();
    });
  }

  _getCode() {
    // StrudelMirror.getCode()
    if (typeof this.mirror?.getCode === 'function') return this.mirror.getCode();
    // CM6 EditorView fallback (nested inside mirror, if exposed)
    if (this.mirror?.editor?.state?.doc) return this.mirror.editor.state.doc.toString();
    // Direct element method
    if (typeof this.replEl?.getCode === 'function') return this.replEl.getCode();
    return '';
  }

  _setCode(code) {
    // StrudelMirror.setCode()
    if (typeof this.mirror?.setCode === 'function') { this.mirror.setCode(code); return; }
    // CM6 dispatch (if mirror is a CM6 EditorView)
    if (this.mirror?.dispatch && this.mirror?.state) {
      this.mirror.dispatch({ changes: { from: 0, to: this.mirror.state.doc.length, insert: code } });
      return;
    }
    // Direct element method
    if (typeof this.replEl?.setCode === 'function') { this.replEl.setCode(code); return; }
    console.warn('PatternDeck: _setCode — no viable method found; code not set');
  }

  _evalRepl() {
    // StrudelMirror methods (replEl.editor)
    if (typeof this.mirror?.evaluate === 'function') { this.mirror.evaluate(); return; }
    if (typeof this.mirror?.start    === 'function') { this.mirror.start();    return; }
    // Direct element methods
    if (typeof this.replEl?.evaluate === 'function') { this.replEl.evaluate(); return; }
    if (typeof this.replEl?.start    === 'function') { this.replEl.start();    return; }
    if (typeof this.replEl?.play     === 'function') { this.replEl.play();     return; }
    // Ctrl+Enter on the shadow host — Strudel handles this via its own keyboard binding
    console.warn('PatternDeck: no evaluate/start method — sending Ctrl+Enter to replEl');
    const e = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true });
    this.replEl?.dispatchEvent(e);
  }

  // ── Output routing (MediaStream bridge) ──────────────────────────────────

  /**
   * Intercepts every AudioNode.connect(AudioDestinationNode) call that
   * originates from a context other than ours.
   *
   * esm.sh loads 6 copies of @strudel/core, each creating its own AudioContext
   * and connecting its own destinationGain to its own context.destination.
   * The copy that produces actual audio may not be the first one, so we must
   * bridge ALL of them — using a WeakSet to do so exactly once per context.
   *
   * Bridge per context:
   *   superdough → MediaStreamAudioDestinationNode (in strudelCtx)
   *             → MediaStream
   *             → MediaStreamAudioSourceNode (in ourCtx)
   *             → strudelOutputGain → strudelDuckGain → merger → master chain
   *
   * The intercept is kept active (no self-restore) for the lifetime of the page.
   */
  _setupOutputRouting() {
    if (!this.audioContext || !this.strudelOutputGain) return;
    if (AudioNode.prototype._strudelBridgeArmed) return; // already armed
    AudioNode.prototype._strudelBridgeArmed = true;

    const ourCtx      = this.audioContext;
    const targetGain  = this.strudelOutputGain;
    const _orig       = AudioNode.prototype.connect;
    const bridgedCtxs = new WeakSet(); // track which contexts are already bridged

    AudioNode.prototype.connect = function(dest, ...args) {
      // Match any AudioDestinationNode that belongs to a foreign context.
      // Use dest === dest.context?.destination instead of instanceof for robustness.
      if (dest && dest === dest.context?.destination && dest.context !== ourCtx) {
        const strudelCtx = dest.context;
        if (!bridgedCtxs.has(strudelCtx)) {
          bridgedCtxs.add(strudelCtx);
          try {
            const msDest   = strudelCtx.createMediaStreamDestination();
            const msSource = ourCtx.createMediaStreamSource(msDest.stream);
            msSource.connect(targetGain);
            console.log('✅ PatternDeck: bridged Strudel context to master chain');
            return _orig.call(this, msDest); // route to bridge, not to speakers
          } catch (e) {
            console.error('PatternDeck: bridge failed for context:', e);
            return _orig.call(this, dest, ...args); // fallback to speakers
          }
        }
        // Already bridged this context — fall through (shouldn't re-connect normally)
      }
      return _orig.call(this, dest, ...args);
    };

    console.log('PatternDeck: output routing intercept armed (multi-bridge)');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _setupControls() {
    document.getElementById('patternDeckVolume')?.addEventListener('input', (e) => {
      const v = e.target.value / 100;
      const display = document.getElementById('patternDeckVolumeDisplay');
      if (display) display.textContent = `${e.target.value}%`;
      this.setVolume(v);
    });
  }
}
