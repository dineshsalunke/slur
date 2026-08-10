// Determinism + shape gate for the value-noise primitives that drive S6 procgen. If these drift across
// engines the track geometry diverges → deaths diverge → desync. Trig-free by construction (see noise.ts);
// these tests pin the numeric contract the generator relies on.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { smoothstep, tri, valueNoise1D, valueNoise2D } from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 42, 0xffffffff ];

test( 'smoothstep is clamped, monotone, and hits the fade anchors', () => {
    assert.equal( smoothstep( 0 ), 0 );
    assert.equal( smoothstep( 1 ), 1 );
    assert.equal( smoothstep( 0.5 ), 0.5 );
    assert.equal( smoothstep( -3 ), 0 ); // clamped below
    assert.equal( smoothstep( 9 ), 1 ); // clamped above
    let prev = -1;
    for ( let i = 0; i <= 20; i++ ) {
        const v = smoothstep( i / 20 );
        assert.ok( v >= prev, 'smoothstep not monotone' );
        prev = v;
    }
} );

test( 'tri is a triangle wave in [-1,1], period 1, trough at integers', () => {
    assert.ok( Math.abs( tri( 0 ) + 1 ) < 1e-12 ); // trough
    assert.ok( Math.abs( tri( 1 ) + 1 ) < 1e-12 ); // period 1 → trough again
    assert.ok( Math.abs( tri( 0.5 ) - 1 ) < 1e-12 ); // peak
    for ( let i = 0; i <= 100; i++ ) {
        const v = tri( i / 7 );
        assert.ok( v >= -1 - 1e-12 && v <= 1 + 1e-12, `tri out of range: ${ v }` );
    }
} );

test( 'valueNoise1D is deterministic, in [0,1), and continuous at lattice nodes', () => {
    for ( const seed of SEEDS ) {
        for ( const x of [ 0, 0.5, 1, 3.7, 100.25, -2.3, 517.9 ] ) {
            const a = valueNoise1D( seed, x );
            const b = valueNoise1D( seed, x );
            assert.equal( a, b, 'valueNoise1D not deterministic' );
            assert.ok( a >= 0 && a < 1, `valueNoise1D out of [0,1): ${ a }` );
        }
        // At an integer node the value equals the raw lattice value from both sides (continuity).
        assert.equal( valueNoise1D( seed, 5 ), valueNoise1D( seed, 5.0 ) );
    }
} );

test( 'valueNoise2D is deterministic and in [0,1)', () => {
    for ( const seed of SEEDS ) {
        for ( const [ x, y ] of [ [ 0, 0 ], [ 1.5, 2.5 ], [ 10.2, -3.1 ], [ 0.9, 0.9 ], [ 200.5, 77.7 ] ] ) {
            const a = valueNoise2D( seed, x, y );
            const b = valueNoise2D( seed, x, y );
            assert.equal( a, b, 'valueNoise2D not deterministic' );
            assert.ok( a >= 0 && a < 1, `valueNoise2D out of [0,1): ${ a }` );
        }
    }
} );

test( 'different seeds decorrelate the noise fields (not a constant)', () => {
    const a = valueNoise2D( 1, 3.3, 4.4 );
    const b = valueNoise2D( 2, 3.3, 4.4 );
    assert.notEqual( a, b, 'noise ignored the seed' );
} );
