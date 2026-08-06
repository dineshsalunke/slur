// Determinism guard: same seed (spawn) + same input sequence → identical SimShip.
// The sim is the S2 netcode contract, so bit-identical replay must hold. Runs against built dist.
import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_TUNING, emptyInput, FIXED_DT, spawnShip, stepShip } from '../dist/index.js';

function run() {
    const s = spawnShip();
    const input = emptyInput();
    for ( let i = 0; i < 600; i++ ) {
        // A fixed, reproducible input script: throttle throughout, strafe wobble, periodic jump/boost.
        input.throttle = 1;
        input.strafe = Math.sin( i / 20 ) > 0 ? 1 : -1;
        input.jump = i % 45 < 3;
        input.boost = i % 120 < 40;
        stepShip( s, input, FIXED_DT, DEFAULT_TUNING );
    }
    return s;
}

test( 'same seed + inputs produce identical SimShip', () => {
    assert.deepEqual( run(), run() );
} );

test( 'ship actually advanced down the track', () => {
    const s = run();
    assert.ok( s.z > 0, `expected forward progress, got z=${ s.z }` );
} );
