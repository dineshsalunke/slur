import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    ALL_CLASS_TUNINGS,
    applyDescriptor,
    CELL,
    CURV_CAP,
    DEFAULT_TUNING,
    HALF_WIDTH,
    isHole,
    jumpReach,
    LEAD_SEGMENTS,
    MIN_LANE,
    mulberry32,
    passableCorridorWidth,
    pickupLayout,
    procgenDescriptor,
    resolveTrack,
    SEG_LEN,
    type Segment,
    SHIP_CLASSES,
    SLOPE_CAP,
    START_SAFE,
    TRACK_SEGMENTS,
    type Track,
    TrackDescriptorState,
    toDescriptor,
    weaveLineLanes,
    ZCELLS,
} from '../index.js';

const makeTrack = ( seed: number ): Track => resolveTrack( procgenDescriptor( seed ) );

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 0x0fffffff, 42, 99991, 0xffffffff ];
const WIDEST_HALF_W = Math.max( ...ALL_CLASS_TUNINGS.map( ( t ) => t.halfW ) );
const CENTRE_MIN = -HALF_WIDTH + WIDEST_HALF_W;
const CENTRE_MAX = HALF_WIDTH - WIDEST_HALF_W;
const N = TRACK_SEGMENTS + 4;

function segEqual( a: Segment, b: Segment ): boolean {
    return JSON.stringify( a ) === JSON.stringify( b );
}

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

test( 'two resolveTrack(procgenDescriptor) are byte-identical for every segment (client == server)', () => {
    for ( const seed of SEEDS ) {
        const a = makeTrack( seed );
        const b = makeTrack( seed );
        for ( let i = 0; i < N; i++ ) {
            assert.ok( segEqual( a.segmentAt( i ), b.segmentAt( i ) ), `seed ${ seed } seg ${ i } diverged` );
        }
    }
} );

test( 'resolveTrack builds byte-identical tracks from the same descriptor (determinism)', () => {
    for ( const seed of SEEDS ) {
        const descriptor = procgenDescriptor( seed );
        const a = resolveTrack( descriptor );
        const b = resolveTrack( descriptor );
        assert.equal( a.finishZ, b.finishZ, `seed ${ seed } finishZ diverged` );
        for ( let i = 0; i < N; i++ ) {
            assert.ok( segEqual( a.segmentAt( i ), b.segmentAt( i ) ), `seed ${ seed } seg ${ i } diverged` );
        }
    }
} );

test( 'a procgen descriptor round-trips through the wire schema unchanged', () => {
    for ( const seed of SEEDS ) {
        const descriptor = procgenDescriptor( seed );
        const state = new TrackDescriptorState();
        applyDescriptor( state, descriptor );
        assert.deepEqual( toDescriptor( state ), descriptor, `seed ${ seed } descriptor did not round-trip` );
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

test( 'every ship class clears a one-segment gap (generous grounded rule)', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        const effectiveGap = SEG_LEN - 2 * c.tuning.halfL;
        assert.ok(
            effectiveGap <= jumpReach( c.tuning ),
            `class ${ c.id }: effective gap ${ effectiveGap.toFixed( 2 ) } > jumpReach ${ jumpReach( c.tuning ).toFixed( 2 ) }`,
        );
    }
    assert.ok( ALL_CLASS_TUNINGS.length >= 1 );
} );

function assertSegmentFair( t: Track, seed: number, i: number ): void {
    const s = t.segmentAt( i );
    if ( isHole( s ) ) {
        assert.ok( ! isHole( t.segmentAt( i + 1 ) ), `hole ${ i } not followed by a pad` );
        assert.equal( t.segmentAt( i + 1 ).floors[ 0 ].y, 0, `pad after hole ${ i } not flat y=0` );
        return;
    }
    for ( const f of s.floors ) assert.equal( f.y, 0, `seed ${ seed } seg ${ i } floor not flat (y=${ f.y })` );
    assert.ok(
        passableCorridorWidth( s ) >= MIN_LANE - 1e-6,
        `seed ${ seed } seg ${ i } corridor ${ passableCorridorWidth( s ) } < MIN_LANE ${ MIN_LANE }`,
    );
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

function openIntervalsAt( seg: Segment, r: number ): Array< [ number, number ] > {
    if ( isHole( seg ) ) return [];
    const zc = seg.z0 + r * CELL + CELL / 2;
    const walls: Array< [ number, number ] > = [];
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
function mergeIntervals( iv: Array< [ number, number ] > ): Array< [ number, number ] > {
    if ( iv.length <= 1 ) return iv;
    const s = [ ...iv ].sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
    const out: Array< [ number, number ] > = [ [ s[ 0 ][ 0 ], s[ 0 ][ 1 ] ] ];
    for ( let k = 1; k < s.length; k++ ) {
        const last = out[ out.length - 1 ];
        if ( s[ k ][ 0 ] <= last[ 1 ] ) last[ 1 ] = Math.max( last[ 1 ], s[ k ][ 1 ] );
        else out.push( [ s[ k ][ 0 ], s[ k ][ 1 ] ] );
    }
    return out;
}
test( 'a widest-hull ship can always thread the corridor (REACH and FIT together)', () => {
    const reachUnits = SLOPE_CAP * CELL;
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
                const dilated = mergeIntervals(
                    reach.map( ( [ a, b ] ): [ number, number ] => [
                        Math.max( CENTRE_MIN, a - reachUnits ),
                        Math.min( CENTRE_MAX, b + reachUnits ),
                    ] ),
                );
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

test( 'block count per visible window stays within the renderer instance budget (per kind)', () => {
    const WINDOW = Math.ceil( ( 900 + 80 ) / SEG_LEN );
    const BUDGET = 160;
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

test( 'ADR-002: pickupLayout is exactly track.anchors filtered to kind "pickup" (source of truth)', () => {
    for ( const seed of SEEDS ) {
        const anchors = makeTrack( seed ).anchors.filter( ( a ) => a.kind === 'pickup' );
        assert.deepEqual(
            pickupLayout( procgenDescriptor( seed ) ),
            anchors,
            `seed ${ seed }: helper diverged from the read`,
        );
    }
} );

test( 'ADR-002: pickup anchor id/position scheme is unchanged (zero wire migration + placement)', () => {
    for ( const seed of SEEDS ) {
        for ( const p of makeTrack( seed ).anchors.filter( ( a ) => a.kind === 'pickup' ) ) {
            const seg = Number( p.id );
            assert.equal( p.id, String( seg ), `seed ${ seed }: id ${ p.id } is not a segment-index string` );
            assert.ok( seg >= START_SAFE, `seed ${ seed }: pickup ${ p.id } inside the start-safe zone` );
            assert.equal(
                p.z,
                seg * SEG_LEN + SEG_LEN / 2,
                `seed ${ seed }: pickup ${ p.id } z off the segment mid-row`,
            );
            assert.equal( p.y, 0, `seed ${ seed }: pickup ${ p.id } not at ground level` );
            assert.ok( Math.abs( p.x ) <= HALF_WIDTH, `seed ${ seed }: pickup ${ p.id } outside the rails` );
        }
    }
} );

test( 'ADR-002: anchors are all kind "pickup"; filtering an unmodelled kind yields none', () => {
    const anchors = makeTrack( 1234 ).anchors;
    assert.ok( anchors.length > 0, 'no anchors materialized' );
    assert.ok(
        anchors.every( ( a ) => a.kind === 'pickup' ),
        'a non-pickup kind was materialized (none exist yet)',
    );
    assert.deepEqual(
        anchors.filter( ( a ) => a.kind === 'checkpoint' ),
        [],
        'an unmodelled kind matched anchors',
    );
} );

test( 'the lead-in apron is flat, full-width and hazard-free', () => {
    for ( const seed of SEEDS ) {
        const t = makeTrack( seed );
        for ( let i = -LEAD_SEGMENTS; i < 0; i++ ) {
            const s = t.segmentAt( i );
            assert.equal( s.blocks.length, 0, `seed ${ seed } seg ${ i }: a hazard before the start line` );
            assert.deepEqual(
                s.floors,
                [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
                `seed ${ seed } seg ${ i }: apron is not flat + full-width`,
            );
        }
    }
} );

test( 'the track has a real back edge one segment behind the lead-in', () => {
    const t = makeTrack( 7 );
    assert.deepEqual( t.segmentAtZ( -LEAD_SEGMENTS * SEG_LEN ).floors, [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ] );
    assert.deepEqual( t.segmentAtZ( -LEAD_SEGMENTS * SEG_LEN - 1 ).floors, [], 'floor past the drawn back edge' );
    assert.deepEqual( t.segmentAtZ( -1000 ).floors, [], 'floor far past the drawn back edge' );
} );

test( 'respawnSetback cannot reach past the lead-in apron', () => {
    assert.ok(
        DEFAULT_TUNING.respawnSetback < START_SAFE * SEG_LEN,
        `respawnSetback ${ DEFAULT_TUNING.respawnSetback }u can now outrun the first hazard at ${ START_SAFE * SEG_LEN }u`,
    );
    for ( const t of ALL_CLASS_TUNINGS )
        assert.ok(
            t.respawnSetback < START_SAFE * SEG_LEN,
            `a class tuning's respawnSetback outruns the first hazard`,
        );
} );
