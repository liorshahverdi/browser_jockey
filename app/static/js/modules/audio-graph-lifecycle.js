export class AudioResourceScope {
    constructor(name, onError = null) {
        this.name = name;
        this.onError = onError;
        this.disposed = false;
        this.cleanups = [];
        this.connections = [];
        this.nodes = [];
        this.sources = [];
        this.streams = [];
        this.workers = [];
        this.timers = [];
        this.objectUrls = [];
    }

    _assertActive() {
        if (this.disposed) throw new Error(`Audio resource scope "${this.name}" is disposed`);
    }

    _safe(action, label) {
        try {
            return action();
        } catch (error) {
            this.onError?.(error, `${this.name}:${label}`);
            return undefined;
        }
    }

    addCleanup(cleanup) {
        this._assertActive();
        if (typeof cleanup !== 'function') throw new TypeError('cleanup must be a function');
        this.cleanups.push(cleanup);
        return cleanup;
    }

    connect(source, destination, ...args) {
        this._assertActive();
        if (!source?.connect || !destination) throw new TypeError('connect requires source and destination nodes');
        source.connect(destination, ...args);
        this.connections.push({ source, destination, args });
        return destination;
    }

    ownNode(node) {
        this._assertActive();
        if (node) this.nodes.push(node);
        return node;
    }

    ownSource(source) {
        this._assertActive();
        if (source) this.sources.push(source);
        return source;
    }

    ownStream(stream) {
        this._assertActive();
        if (stream) this.streams.push(stream);
        return stream;
    }

    ownWorker(worker) {
        this._assertActive();
        if (worker) this.workers.push(worker);
        return worker;
    }

    ownTimer(id, clear = clearTimeout) {
        this._assertActive();
        if (id !== null && id !== undefined) this.timers.push({ id, clear });
        return id;
    }

    ownAnimationFrame(id) {
        return this.ownTimer(id, cancelAnimationFrame);
    }

    ownObjectURL(url) {
        this._assertActive();
        if (url) this.objectUrls.push(url);
        return url;
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;

        for (const cleanup of this.cleanups.reverse()) {
            this._safe(cleanup, 'cleanup');
        }
        for (const { id, clear } of this.timers.reverse()) {
            this._safe(() => clear(id), 'timer');
        }
        for (const worker of this.workers.reverse()) {
            this._safe(() => worker.terminate(), 'worker');
        }
        for (const stream of this.streams.reverse()) {
            for (const track of stream.getTracks?.() ?? []) {
                this._safe(() => track.stop(), 'stream-track');
            }
        }
        for (const source of this.sources.reverse()) {
            this._safe(() => source.stop(), 'source-stop');
            this._safe(() => source.disconnect(), 'source-disconnect');
        }
        for (const { source, destination, args } of this.connections.reverse()) {
            this._safe(() => source.disconnect(destination, ...args), 'connection');
        }
        for (const node of this.nodes.reverse()) {
            this._safe(() => node.disconnect(), 'node');
        }
        for (const url of this.objectUrls.reverse()) {
            this._safe(() => URL.revokeObjectURL(url), 'object-url');
        }

        this.cleanups.length = 0;
        this.connections.length = 0;
        this.nodes.length = 0;
        this.sources.length = 0;
        this.streams.length = 0;
        this.workers.length = 0;
        this.timers.length = 0;
        this.objectUrls.length = 0;
    }
}

export class AudioGraphLifecycle {
    constructor({ onError } = {}) {
        this.onError = onError ?? ((error, resource) => {
            console.warn(`Audio lifecycle cleanup failed (${resource}):`, error);
        });
        this.context = null;
        this.closeContextOnDispose = true;
        this.scopes = new Map();
        this.disposed = false;
    }

    setContext(context, { closeOnDispose = true } = {}) {
        if (this.context && this.context !== context) {
            throw new Error('AudioGraphLifecycle already owns a different AudioContext');
        }
        this.context = context;
        this.closeContextOnDispose = closeOnDispose;
        return context;
    }

    scope(name) {
        if (this.disposed) throw new Error('AudioGraphLifecycle is disposed');
        if (!this.scopes.has(name)) {
            this.scopes.set(name, new AudioResourceScope(name, this.onError));
        }
        return this.scopes.get(name);
    }

    replaceScope(name) {
        this.disposeScope(name);
        const scope = new AudioResourceScope(name, this.onError);
        this.scopes.set(name, scope);
        return scope;
    }

    disposeScope(name) {
        const scope = this.scopes.get(name);
        if (!scope) return;
        scope.dispose();
        this.scopes.delete(name);
    }

    async disposeAll() {
        if (this.disposed) return;
        this.disposed = true;

        for (const scope of [...this.scopes.values()].reverse()) scope.dispose();
        this.scopes.clear();

        if (this.closeContextOnDispose && this.context && this.context.state !== 'closed') {
            try {
                await this.context.close();
            } catch (error) {
                this.onError(error, 'audio-context');
            }
        }
        this.context = null;
    }
}
