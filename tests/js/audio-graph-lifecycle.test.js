import test from 'node:test';
import assert from 'node:assert/strict';

import { AudioGraphLifecycle, AudioResourceScope } from '../../app/static/js/modules/audio-graph-lifecycle.js';

function fakeNode(events, name) {
    return {
        connect(destination, ...args) { events.push(['connect', name, destination.name, ...args]); },
        disconnect(...args) { events.push(['disconnect', name, ...args.map(value => value?.name ?? value)]); },
    };
}

test('scope disconnects graph resources and stops external resources once', () => {
    const events = [];
    const source = fakeNode(events, 'source');
    const destination = { name: 'destination' };
    const node = fakeNode(events, 'node');
    const scheduledSource = {
        stop() { events.push(['stop', 'scheduled']); },
        disconnect() { events.push(['disconnect', 'scheduled']); },
    };
    const stream = { getTracks: () => [{ stop: () => events.push(['stop', 'track']) }] };
    const worker = { terminate: () => events.push(['terminate', 'worker']) };
    const scope = new AudioResourceScope('test', error => { throw error; });

    scope.connect(source, destination, 0, 1);
    scope.ownNode(node);
    scope.ownSource(scheduledSource);
    scope.ownStream(stream);
    scope.ownWorker(worker);
    scope.addCleanup(() => events.push(['cleanup']));
    scope.dispose();
    scope.dispose();

    assert.deepEqual(events, [
        ['connect', 'source', 'destination', 0, 1],
        ['cleanup'],
        ['terminate', 'worker'],
        ['stop', 'track'],
        ['stop', 'scheduled'],
        ['disconnect', 'scheduled'],
        ['disconnect', 'source', 'destination', 0, 1],
        ['disconnect', 'node'],
    ]);
});

test('replacing a named scope disposes the previous generation', () => {
    const events = [];
    const lifecycle = new AudioGraphLifecycle({ onError: error => { throw error; } });
    lifecycle.scope('microphone').addCleanup(() => events.push('old'));

    const replacement = lifecycle.replaceScope('microphone');
    replacement.addCleanup(() => events.push('new'));

    assert.deepEqual(events, ['old']);
    lifecycle.disposeScope('microphone');
    assert.deepEqual(events, ['old', 'new']);
});

test('disposeAll closes the owned AudioContext after scopes', async () => {
    const events = [];
    const context = {
        state: 'running',
        async close() { this.state = 'closed'; events.push('context'); },
    };
    const lifecycle = new AudioGraphLifecycle({ onError: error => { throw error; } });
    lifecycle.setContext(context);
    lifecycle.scope('application').addCleanup(() => events.push('scope'));

    await lifecycle.disposeAll();
    await lifecycle.disposeAll();

    assert.deepEqual(events, ['scope', 'context']);
    assert.equal(context.state, 'closed');
});

test('disposed scopes reject new ownership', () => {
    const scope = new AudioResourceScope('disposed');
    scope.dispose();
    assert.throws(() => scope.ownNode({}), /disposed/);
});
