// Determinism + fairness gate for the track generator. Run via `pnpm --filter @slur/shared test`
// (tsc -b → node --test on the compiled dist). If any of these fail the game desyncs or becomes
// unfair — they are hard gates, not smoke tests.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    ALL_CLASS_TUNINGS,
    CELL,
    CURV_CAP,
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
    SLOPE_CAP,
    START_SAFE,
    TRACK_SEGMENTS,
    type Track,
    weaveLineLanes,
    ZCELLS,
} from '../index.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 0x0fffffff, 42, 99991, 0xffffffff ];
// Half-width of the widest hull in the roster. Track fairness floors to the CLASS SET (the principle
// ship-classes.ts states), so derive it instead of hard-coding: add a wider ship and the gate guards it.
const WIDEST_HALF_W = Math.max( ...ALL_CLASS_TUNINGS.map( ( t ) => t.halfW ) );
// The band a hull CENTRE may occupy without clipping the outer rails.
const CENTRE_MIN = -HALF_WIDTH + WIDEST_HALF_W;
const CENTRE_MAX = HALF_WIDTH - WIDEST_HALF_W;
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

// ── S6 procgen v2 — coherent weave + variable-width walls ──

// The racing line the ship threads must never demand more lateral SPEED (slope) than the least-capable
// weaver can hold. Cap is DERIVED from ALL_CLASS_TUNINGS (constants.ts) — not hand-picked. Measured on the
// continuous full-amplitude line; the generator's actual corridor uses ≤ this amplitude, so it stays fair.
test( 'racing-line slope stays under the derived least-capable cap (weave is threadable)', () => {
    for ( const seed of SEEDS ) {
        let prev = weaveLineLanes( seed, 0 );
        for ( let row = 1; row < TRACK_SEGMENTS * ZCELLS; row++ ) {
            const cur = weaveLineLanes( seed, row );
            assert.ok(
                Math.abs( cur - prev ) <= SLOPE_CAP + 1e-9,
                `seed ${ seed } row ${ row } slope ${ Math.abs( cur - prev ) } > SLOPE_CAP ${ SLOPE_CAP }`,
            );
            prev = cur;
        }
    }
} );

// Slope alone is insufficient: a tight zig-zag inside the slope cap still needs un-affordable REVERSAL.
// Curvature (slope-change/row) must stay under a cap derived from strafeAccel — the real harder-but-fair lever.
test( 'racing-line curvature stays under the derived reversal cap', () => {
    for ( const seed of SEEDS ) {
        const prev = weaveLineLanes( seed, 0 );
        let prevSlope = weaveLineLanes( seed, 1 ) - prev;
        for ( let row = 2; row < TRACK_SEGMENTS * ZCELLS; row++ ) {
            const cur = weaveLineLanes( seed, row );
            const slope = cur - weaveLineLanes( seed, row - 1 );
            assert.ok(
                Math.abs( slope - prevSlope ) <= CURV_CAP + 1e-9,
                `seed ${ seed } row ${ row } curvature ${ Math.abs( slope - prevSlope ) } > CURV_CAP ${ CURV_CAP }`,
            );
            prevSlope = slope;
        }
    }
} );

// Fairness BY CONSTRUCTION: ≥ MIN_LANE contiguous open floor at EVERY z-slice, for every segment and every
// difficulty D (D varies with segment index, so the full sweep covers the whole ramp). This is the per-slice
// helper (a moving-within-segment corridor is fair at each slice even if the collapsed segment wouldn't be).
test( 'every z-slice keeps a ≥ MIN_LANE open corridor across all seeds and difficulty', () => {
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            const s = t.segmentAt( i );
            if ( isHole( s ) ) continue;
            assert.ok(
                passableCorridorWidth( s ) >= MIN_LANE - 1e-6,
                `seed ${ seed } seg ${ i } per-slice corridor ${ passableCorridorWidth( s ) } < MIN_LANE`,
            );
        }
    }
} );

// Goal #2: RLE-merged noise walls produce VARIABLE-width blocks (not just 1-cell cubes). Assert multi-lane
// blocks actually appear — the whole point of the corridor+RLE model.
test( 'variable-width blocks appear (walls wider than one cell)', () => {
    let sawWide = false;
    let maxW = 0;
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            for ( const b of t.segmentAt( i ).blocks ) {
                const w = b.x1 - b.x0;
                if ( w > CELL + 1e-9 ) sawWide = true;
                if ( w > maxW ) maxW = w;
            }
        }
    }
    assert.ok( sawWide, `no multi-cell blocks emerged (max width ${ maxW })` );
} );

// Both hazard kinds must actually appear: red (lethal) walls AND amber (drag) passable blocks. A regression
// that made every block one kind would silently gut the risk/reward mechanic without failing any other test.
test( 'both lethal walls and passable drag blocks are generated', () => {
    let lethal = 0;
    let drag = 0;
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            for ( const b of t.segmentAt( i ).blocks ) {
                if ( b.lethal ) lethal++;
                else drag++;
            }
        }
    }
    assert.ok( lethal > 0, 'no lethal walls generated' );
    assert.ok( drag > 0, 'no drag (amber) blocks generated' );
} );

// Gaps stay orthogonal + sparse: never two active gaps in a row (the segment after a gap is a landing pad),
// and none in the start-safe zone. (GAP-REACH per class is asserted separately above.)
test( 'no two gaps in a row and none in start-safe', () => {
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = 0; i < START_SAFE; i++ )
            assert.ok( ! isHole( t.segmentAt( i ) ), `gap in start-safe seg ${ i }` );
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            if ( isHole( t.segmentAt( i ) ) ) {
                assert.ok( ! isHole( t.segmentAt( i + 1 ) ), `seed ${ seed } two gaps in a row at ${ i }` );
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

// Per-slice fairness (≥ MIN_LANE open at every z) is NOT enough on its own: consecutive openings must also be
// laterally REACHABLE given the ship's bounded strafe (walls are un-jumpable). Otherwise the open lane can jump
// side-to-side faster than any ship can follow → an unavoidable "L-shaped" dead-end. Forward-flood the set of
// reachable x-intervals row by row (dilate by ±SLOPE_CAP·CELL, intersect with the open floor); assert it never
// collapses to empty on a floored stretch. A hole resets reachability (you cross it airborne, landing anywhere).
function openIntervalsAt( seg: Segment, r: number ): Array< [ number, number ] > {
    if ( isHole( seg ) ) return [];
    const zc = seg.z0 + r * CELL + CELL / 2;
    const walls: Array< [ number, number ] > = [];
    // Only LETHAL blocks obstruct — drag (amber) blocks are passable (you fly through, just slow), so they
    // must NOT count toward reachability or a dead-end.
    for ( const b of seg.blocks ) if ( b.lethal && b.z0 <= zc && zc < b.z1 ) walls.push( [ b.x0, b.x1 ] );
    walls.sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
    const open: Array< [ number, number ] > = [];
    let cursor = -HALF_WIDTH;
    for ( const [ lo, hi ] of walls ) {
        if ( lo > cursor ) open.push( [ cursor, Math.min( lo, HALF_WIDTH ) ] );
        cursor = Math.max( cursor, hi );
    }
    if ( cursor < HALF_WIDTH ) open.push( [ cursor, HALF_WIDTH ] );
    return open.filter( ( [ a, b ] ) => b > a );
}
// Legal CENTRE positions for the widest hull at this row: each opening eroded by halfW on both sides.
// Eroding BEFORE the flood-fill is the whole point. The reachable set is usually several disjoint
// intervals, and an opening too thin to hold a hull vanishes here instead of being masked by a wider
// sibling — exactly what propagating raw openings and then measuring the widest one fails to catch.
function centreIntervalsAt( seg: Segment, r: number ): Array< [ number, number ] > {
    const out: Array< [ number, number ] > = [];
    for ( const [ a, b ] of openIntervalsAt( seg, r ) ) {
        const lo = Math.max( a + WIDEST_HALF_W, CENTRE_MIN );
        const hi = Math.min( b - WIDEST_HALF_W, CENTRE_MAX );
        if ( hi > lo ) out.push( [ lo, hi ] );
    }
    return out;
}
function intersectIntervals(
    a: Array< [ number, number ] >,
    b: Array< [ number, number ] >,
): Array< [ number, number ] > {
    const out: Array< [ number, number ] > = [];
    for ( const [ a0, a1 ] of a )
        for ( const [ b0, b1 ] of b ) {
            const lo = Math.max( a0, b0 );
            const hi = Math.min( a1, b1 );
            if ( hi > lo ) out.push( [ lo, hi ] );
        }
    return out;
}
test( 'a widest-hull ship can always thread the corridor (REACH and FIT together)', () => {
    const reachUnits = SLOPE_CAP * CELL; // how far the least-capable ship can strafe per forward row (world x)
    // Reachability is tracked over hull CENTRES, not raw openings, so "reachable" always means "a whole
    // ship fits there" rather than "some sliver of floor is exposed there".
    const full: Array< [ number, number ] > = [ [ CENTRE_MIN, CENTRE_MAX ] ];
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        let reach = full;
        for ( let i = START_SAFE; i < TRACK_SEGMENTS; i++ ) {
            const seg = t.segmentAt( i );
            if ( isHole( seg ) ) {
                reach = full;
                continue;
            }
            for ( let r = 0; r < ZCELLS; r++ ) {
                const dilated = reach.map( ( [ a, b ] ): [ number, number ] => [
                    Math.max( CENTRE_MIN, a - reachUnits ),
                    Math.min( CENTRE_MAX, b + reachUnits ),
                ] );
                reach = intersectIntervals( dilated, centreIntervalsAt( seg, r ) );
                assert.ok(
                    reach.length > 0,
                    `seed ${ seed } seg ${ i } row ${ r }: no centre line survives for a ` +
                        `${ ( 2 * WIDEST_HALF_W ).toFixed( 2 ) }u hull — unavoidable dead-end`,
                );
            }
        }
    }
} );

// Worst-case [lethal, drag] block counts in any WINDOW-segment slice of one track (extracted so the budget
// test below stays flat / under the cognitive-complexity cap).
function worstWindowCounts( t: Track, window: number ): [ number, number ] {
    let worstLethal = 0;
    let worstDrag = 0;
    for ( let s = START_SAFE; s < TRACK_SEGMENTS; s++ ) {
        let l = 0;
        let d = 0;
        for ( let i = s; i < s + window && i <= TRACK_SEGMENTS; i++ ) {
            for ( const b of t.segmentAt( i ).blocks ) {
                if ( b.lethal ) l++;
                else d++;
            }
        }
        if ( l > worstLethal ) worstLethal = l;
        if ( d > worstDrag ) worstDrag = d;
    }
    return [ worstLethal, worstDrag ];
}

// Renderer budget guard: the client renders lethal + drag blocks as TWO instanced pools (distinct emissive
// colour), so EACH kind's worst-case count over a visible window must stay under its pool cap (BLOCK_LIMIT in
// track-view.tsx — exceeding it SILENTLY DROPS blocks). Checked per-kind, not on the total.
test( 'block count per visible window stays within the renderer instance budget (per kind)', () => {
    const WINDOW = Math.ceil( ( 900 + 80 ) / SEG_LEN ); // TrackView AHEAD+BACK
    const BUDGET = 160; // must match BLOCK_LIMIT in apps/client/.../track-view.tsx (per pool)
    let worstLethal = 0;
    let worstDrag = 0;
    for ( const seed of SEEDS ) {
        const [ l, d ] = worstWindowCounts( makeTrack( seed ), WINDOW );
        if ( l > worstLethal ) worstLethal = l;
        if ( d > worstDrag ) worstDrag = d;
    }
    assert.ok( worstLethal < BUDGET, `worst-case ${ worstLethal } lethal blocks/window ≥ BLOCK_LIMIT ${ BUDGET }` );
    assert.ok( worstDrag < BUDGET, `worst-case ${ worstDrag } drag blocks/window ≥ BLOCK_LIMIT ${ BUDGET }` );
} );
