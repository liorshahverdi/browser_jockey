import test from 'node:test';
import assert from 'node:assert/strict';

import { SidechainCompressor } from '../../app/static/js/modules/sidechain.js';

function node(name, events) {
    return {
        name,
        connect(destination) { events.push(['connect', name, destination.name]); },
        disconnect(destination) { events.push(['disconnect', name, destination?.name ?? 'all']); },
    };
}

test('SidechainCompressor removes analyser taps and restores target routing', () => {
    const events = [];
    const analyser = {
        ...node('analyser', events),
        fftSize: 0,
        smoothingTimeConstant: 0,
    };
    const duck = {
        ...node('duck', events),
        gain: {
            value: 0,
            cancelScheduledValues() {},
            setTargetAtTime() {},
        },
    };
    const context = {
        currentTime: 0,
        createAnalyser: () => analyser,
        createGain: () => duck,
    };
    const source = node('source', events);
    const target = node('target', events);
    const merger = node('merger', events);
    const sidechain = new SidechainCompressor(context);

    sidechain.setup(source, target, merger);
    sidechain.destroy();

    assert.ok(events.some(event => JSON.stringify(event) === JSON.stringify(['disconnect', 'source', 'analyser'])));
    assert.deepEqual(events.at(-1), ['connect', 'target', 'merger']);
    assert.equal(sidechain.analyserNode, null);
    assert.equal(sidechain.duckGain, null);
});
