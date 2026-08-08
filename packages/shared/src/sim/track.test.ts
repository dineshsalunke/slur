// Determinism + fairness gate for the S3 track generator. Run via `pnpm --filter @slur/shared test`
// (tsc -b → node --test on the compiled dist). If any of these fail the game desyncs or becomes
// unfair — they are hard gates, not smoke tests.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    HALF_WIDTH,
    isHole,
    MAX_GAP,
    MAX_STEP,
    MIN_CORRIDOR,
    makeTrack,
    mulberry32,
    passableCorridorWidth,
    SEG_LEN,
    type Segment,
    START_SAFE,
    TRACK_SEGMENTS,
} from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 0x0fffffff, 42, 99991, 0xffffffff ];
const N = TRACK_SEGMENTS + 4; // include a couple of finish segments

function segEqual( a: Segment, b: Segment ): boolean {
    return JSON.stringify( a ) === JSON.stringify( b );
}

// mulberry32 is the load-bearing PRNG — pin it against KNOWN output (captured from the verified bryc
// implementation, seed 0) so a mistyped constant can never slip through unnoticed.
test( 'mulberry32 matches the verified reference stream (seed 0)', () => {
    const r = mulberry32( 0 );
    const got = [ r(), r(), r() ].map( ( v ) => Math.round( v * 1e9 ) );
    assert.deepEqual( got, [ 266429209, 329746, 223272027 ] );
    // Range invariant.
    for ( const v of [ r(), r() ] ) assert.ok( v >= 0 && v < 1, `${ v } out of [0,1)` );
} );

test( 'segmentAt is stable across repeated calls (same track instance)', () => {
    const t = makeTrack( 1234 );
    for ( let i = 0; i < N; i++ ) {
        assert.ok( segEqual( t.segmentAt( i ), t.segmentAt( i ) ), `segment ${ i } not stable` );
    }
} );

test( 'two makeTrack(seed) are byte-identical for every segment (client == server)', () => {
    for ( const seed of SEEDS ) {
        const a = makeTrack( seed );
        const b = makeTrack( seed );
        for ( let i = 0; i < N; i++ ) {
            assert.ok( segEqual( a.segmentAt( i ), b.segmentAt( i ) ), `seed ${ seed } seg ${ i } diverged` );
        }
    }
} );

test( 'segmentAtZ maps world-z to the right segment (O(1), pure)', () => {
    const t = makeTrack( 7 );
    for ( const i of [ 0, 3, 50, 199 ] ) {
        const z = i * SEG_LEN + SEG_LEN * 0.5;
        assert.equal( t.segmentAtZ( z ).index, i );
    }
} );

test( 'start-safe zone is flat + full-width with no hazards', () => {
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = 0; i < START_SAFE; i++ ) {
            const s = t.segmentAt( i );
            assert.equal( s.blocks.length, 0 );
            assert.equal( s.floors.length, 1 );
            assert.equal( s.floors[ 0 ].y, 0 );
            assert.equal( s.floors[ 0 ].x0, -HALF_WIDTH );
            assert.equal( s.floors[ 0 ].x1, HALF_WIDTH );
        }
    }
} );

test( 'fairness invariants hold for every segment across many seeds', () => {
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            const s = t.segmentAt( i );
            if ( isHole( s ) ) {
                // A gap is one segment long → must be crossable by a jump.
                assert.ok( SEG_LEN <= MAX_GAP, `SEG_LEN ${ SEG_LEN } > MAX_GAP ${ MAX_GAP }` );
                // No two active holes in a row (the next segment is forced to a landing pad).
                assert.ok( ! isHole( t.segmentAt( i + 1 ) ), `hole ${ i } not followed by a pad` );
                assert.equal( t.segmentAt( i + 1 ).floors[ 0 ].y, 0, `pad after hole ${ i } not flat y=0` );
            } else {
                // Non-hole: must leave a laterally-passable corridor (no all-lane wall).
                assert.ok(
                    passableCorridorWidth( s ) >= MIN_CORRIDOR - 1e-6,
                    `seed ${ seed } seg ${ i } corridor ${ passableCorridorWidth( s ) } < ${ MIN_CORRIDOR }`,
                );
                // Any raised step is within jump reach.
                for ( const f of s.floors ) {
                    assert.ok(
                        f.y <= MAX_STEP + 1e-6,
                        `seed ${ seed } seg ${ i } step ${ f.y } > MAX_STEP ${ MAX_STEP }`,
                    );
                }
            }
        }
    }
} );

test( 'finish segments are flat and flagged', () => {
    const t = makeTrack( 1234 );
    assert.equal( t.finishZ, TRACK_SEGMENTS * SEG_LEN );
    const s = t.segmentAt( TRACK_SEGMENTS );
    assert.ok( s.isFinish );
    assert.equal( s.floors[ 0 ].y, 0 );
} );
