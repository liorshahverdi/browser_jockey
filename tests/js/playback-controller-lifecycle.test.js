import test from 'node:test';
import assert from 'node:assert/strict';

import { PlaybackController } from '../../app/static/js/modules/playback-controller.js';

test('PlaybackController owns exactly one effects-chain connection', () => {
    const events = [];
    const gainNode = {
        gain: { value: 0 },
        connect(destination) { events.push(['connect', destination.name]); },
        disconnect(destination) { events.push(['disconnect', destination?.name ?? 'all']); },
    };
    const context = { createGain: () => gainNode };
    const audioElement = { currentTime: 0, pause() {} };
    const controller = new PlaybackController(context, audioElement, null, 'test');
    const first = { name: 'first' };
    const second = { name: 'second' };

    controller.connectToEffectsChain(first);
    controller.connectToEffectsChain(first);
    controller.connectToEffectsChain(second);
    controller.destroy();

    assert.deepEqual(events, [
        ['connect', 'first'],
        ['disconnect', 'first'],
        ['connect', 'second'],
        ['disconnect', 'all'],
    ]);
});
