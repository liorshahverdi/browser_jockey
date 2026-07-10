# Recommended Order of Work

**Decision:** GitHub Pages is the only production deployment target. Flask and Docker are retained only as local-development options.

This plan prioritizes confidence in the existing product before additional feature development.

## Phase 1 — Establish one production path

**Status:** Completed

- Treat root `index.html` as the canonical production document.
- Build a minimal `dist/` artifact containing only the static application assets.
- Deploy `dist/` to GitHub Pages instead of publishing the entire repository.
- Test the application under `/browser_jockey/`, matching the GitHub Pages project subpath.
- Resolve static and AudioWorklet URLs relative to their modules rather than the domain root.
- Remove Render deployment configuration and documentation.

**Exit criteria:** The production artifact boots under the project subpath and the timestretch AudioWorklet returns HTTP 200.

## Phase 2 — Fix backend correctness and privacy

**Status:** Completed

The backend is not part of production, but it remains useful for local development.

- Load `config.Config` correctly through the Flask application factory.
- Make debug mode opt-in through `FLASK_DEBUG`; default it to off.
- Remove IP geolocation, visitor tracking, forwarding-header trust, and request-level third-party calls.
- Remove dependencies used only by the deleted telemetry path.
- Add backend route and configuration regression tests.

**Exit criteria:** The Flask smoke tests pass, configuration overrides work, and local requests perform no visitor tracking or geolocation.

## Phase 3 — Add a real CI and deployment gate

**Status:** Completed

Every pull request and main-branch push must pass:

1. Python compilation.
2. JavaScript syntax parsing.
3. Flask route/configuration tests.
4. Static artifact integrity tests.
5. A Playwright browser smoke test served from `/browser_jockey/`.
6. Verification that the AudioWorklet is successfully fetched from the deployed path shape.

GitHub Pages deployment runs only after the complete test job succeeds.

**Exit criteria:** A broken local asset, origin-absolute `/static/` URL, JavaScript syntax error, Flask regression, page exception, or failed worklet request blocks deployment.

## Phase 4 — Reduce application complexity

**Status:** In progress

- ✅ Added `AudioGraphLifecycle` as the owner of the shared context and named resource scopes.
- ✅ Removed the Sequencer's second long-lived AudioContext; routing is deferred to the shared context.
- ✅ Added deterministic microphone replacement and page-shutdown teardown.
- ✅ Added idempotent teardown for playback, sidechain, Pattern Deck, Lo-fi Station, transcription, and Sequencer resources.
- ✅ Ensured short-lived decode contexts close on both success and failure.
- Introduce one deck controller per track.
- Move remaining feature-specific nodes and timers into named lifecycle scopes.
- Separate DOM binding from audio behavior.
- Split sequencer playback, persistence, rendering, recording, and UI concerns.
- Replace production console noise with a small opt-in debug logger.

**Exit criteria:** `app.js` becomes orchestration rather than implementation, and major audio workflows can be tested without the full DOM.

## Phase 5 — Repair release and documentation discipline

**Status:** Planned

- Establish one current version source.
- Bring `CHANGELOG.md`, README, release notes, and roadmap into agreement.
- Assign unique feature IDs; do not reuse roadmap IDs.
- Update architecture metrics and module documentation automatically or remove volatile line counts.
- Keep the GitHub Pages deployment and test instructions current.

**Exit criteria:** A contributor can determine the current release, deployed architecture, supported workflows, and planned work without encountering contradictions.

## Phase 6 — Accessibility and supply-chain hardening

**Status:** Planned

- Associate labels with all controls and add accessible names/state to icon buttons.
- Define keyboard focus behavior and test it.
- Add accessible alternatives for canvas-only information.
- Review CDN dependencies, pin versions, and introduce CSP/SRI where technically compatible.
- Replace or isolate global prototype interception used by the Pattern Deck.

## Feature-development rule

Do not add another major instrument, effect, or workflow until Phases 1–3 remain green in CI and Phase 4 has at least established audio-graph lifecycle ownership. Bug fixes and small usability improvements may continue when accompanied by regression coverage.
