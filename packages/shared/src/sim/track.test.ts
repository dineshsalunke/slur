// Determinism + fairness gate for the track generator. Run via `pnpm --filter @slur/shared test`
// (tsc -b → node --test on the compiled dist). If any of these fail the game desyncs or becomes
// unfair — they are hard gates, not smoke tests.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    ALL_CLASS_TUNINGS,
    HALF_WIDTH,
    isHole,
    jumpReach,
    MIN_LANE,
    makeTrack,
    mulberry32,
    passableCorridorWidth,
    SEG_LEN,
    type Segment,
    SHIP_CLASSES,
    START_SAFE,
    TRACK_SEGMENTS,
    type Track,
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

// Every ship class must clear a one-segment gap — the shared server track is floored to the LEAST-capable
// class, so if the worst class can't jump a gap, the game is unfair for that class. Generous grounded rule:
// airborne z-distance = SEG_LEN − 2·halfL. (Derived from jump feel + speed → difficulty is a config edit.)
test( 'every ship class clears a one-segment gap (generous grounded rule)', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        const effectiveGap = SEG_LEN - 2 * c.tuning.halfL;
        assert.ok(
            effectiveGap <= jumpReach( c.tuning ),
            `class ${ c.id }: effective gap ${ effectiveGap.toFixed( 2 ) } > jumpReach ${ jumpReach( c.tuning ).toFixed( 2 ) }`,
        );
    }
    // The registry the generator floors to is non-empty (guards an accidental empty class set).
    assert.ok( ALL_CLASS_TUNINGS.length >= 1 );
} );

// Assert one segment is fair: a hole is followed by a flat pad; a non-hole is flat, leaves a ≥ MIN_LANE
// corridor, and its cubes are discrete grounded AABBs. Extracted so the seed×segment sweep stays flat.
function assertSegmentFair( t: Track, seed: number, i: number ): void {
    const s = t.segmentAt( i );
    if ( isHole( s ) ) {
        // No two active holes in a row (the next segment is forced to a landing pad).
        assert.ok( ! isHole( t.segmentAt( i + 1 ) ), `hole ${ i } not followed by a pad` );
        assert.equal( t.segmentAt( i + 1 ).floors[ 0 ].y, 0, `pad after hole ${ i } not flat y=0` );
        return;
    }
    // Every non-hole floor is flat ground (no raised platforms anymore).
    for ( const f of s.floors ) assert.equal( f.y, 0, `seed ${ seed } seg ${ i } floor not flat (y=${ f.y })` );
    // A laterally-passable corridor of ≥ MIN_LANE (2 lanes) always survives the cube field.
    assert.ok(
        passableCorridorWidth( s ) >= MIN_LANE - 1e-6,
        `seed ${ seed } seg ${ i } corridor ${ passableCorridorWidth( s ) } < MIN_LANE ${ MIN_LANE }`,
    );
    // Cubes carry a z-extent (discrete AABB), sit on the floor, and are un-jumpable (tall).
    for ( const b of s.blocks ) {
        assert.ok( b.z1 > b.z0, `seed ${ seed } seg ${ i } cube has no z-extent` );
        assert.ok( b.z0 >= s.z0 && b.z1 <= s.z1, `seed ${ seed } seg ${ i } cube z out of segment` );
        assert.equal( b.y0, 0, `seed ${ seed } seg ${ i } cube not grounded` );
    }
}

test( 'fairness invariants hold for every segment across many seeds', () => {
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) assertSegmentFair( t, seed, i );
    }
} );

test( 'finish segments are flat and flagged', () => {
    const t = makeTrack( 1234 );
    assert.equal( t.finishZ, TRACK_SEGMENTS * SEG_LEN );
    const s = t.segmentAt( TRACK_SEGMENTS );
    assert.ok( s.isFinish );
    assert.equal( s.floors[ 0 ].y, 0 );
} );
