// Deterministic track generation. The ENTIRE track is a pure function of the room seed — no stored
// geometry, no synced tiles. `segmentAt(i)` derives one segment from (seed, i) via a LOCAL PRNG
// seeded by hash2(seed, i), so it is O(1) random-access and byte-identical on client + server (this
// is why collision — which runs inside the shared simulate() — auto-networks with no wire change).
//
// A finite Race is indices 0..TRACK_SEGMENTS; because segmentAt accepts any i, endless Survival (S7)
// falls out for free — do NOT materialize an array, that would force an S7 rewrite.
//
// DETERMINISM: integer/PRNG/`+-*/`/compare ONLY. NO Math.sin/cos/tan/pow/sqrt in this file — a single
// ULP of cross-engine drift diverges geometry → diverges deaths → the game desyncs.

import { MAX_GAP, MAX_STEP } from '../constants.js';
import { hash2, mulberry32 } from './rng.js';

// Solid floor over the lateral interval [x0, x1] at world height y. Gaps = x not covered by any span.
export interface FloorSpan {
    x0: number;
    x1: number;
    y: number;
}

// Lethal AABB in the (x, y) plane, spanning the segment's full z-range. Touch it → derezz.
export interface Block {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
}

// What a segment is, for rendering + the fairness test. Collision ignores this (it reads floors/blocks
// generically); it exists so the test knows a `platform` is passable-by-jump, not passable-by-corridor.
export type SegmentKind = 'plain' | 'block' | 'platform' | 'gap' | 'finish';

export interface Segment {
    index: number;
    z0: number; // world z-range [z0, z1)
    z1: number;
    kind: SegmentKind;
    floors: FloorSpan[]; // gaps = x uncovered by any span (fall-through)
    blocks: Block[];
    isFinish: boolean;
}

export interface Track {
    seed: number;
    finishZ: number; // world z of the finish line
    segmentAt( i: number ): Segment;
    segmentAtZ( z: number ): Segment;
}

// ── Track constants (commented, tunable — difficulty is a config edit) ──
export const SEG_LEN = 20; // world-z length of one segment. A GAP is one segment long, so SEG_LEN ≤ MAX_GAP is the hard fairness bound (asserted in the determinism test).
export const TRACK_SEGMENTS = 200; // number of hazard segments before the finish → finishZ = TRACK_SEGMENTS·SEG_LEN.
export const START_SAFE = 6; // leading segments forced flat + full-width (spawn/accel zone) — no death before you're moving.
export const HALF_WIDTH = 16; // lateral half-extent of the track floor (matches DEFAULT_TUNING.halfWidth); full width = 2·HALF_WIDTH.
export const MIN_CORRIDOR = 6; // narrowest guaranteed passable lane (units) a block may leave — always ≥1 way through.
export const BLOCK_HEIGHT = 2.5; // block top (y). Below double-jump reach on purpose → strafe around OR jump over; either way there is a route.
const CORRIDOR_EXTRA = 8; // block corridors vary in [MIN_CORRIDOR, MIN_CORRIDOR+CORRIDOR_EXTRA] — some tight, some loose.

// Archetype mix. Probabilities are the difficulty dial; they sum to 1 across the [0,1) roll.
type Archetype = 'plain' | 'block' | 'platform' | 'gap';
const P_PLAIN = 0.4;
const P_BLOCK = 0.22; // cumulative 0.62
const P_PLATFORM = 0.2; // cumulative 0.82
// remainder (0.18) → gap

function pickArchetype( r: number ): Archetype {
    if ( r < P_PLAIN ) return 'plain';
    if ( r < P_PLAIN + P_BLOCK ) return 'block';
    if ( r < P_PLAIN + P_BLOCK + P_PLATFORM ) return 'platform';
    return 'gap';
}

// The FIRST roll of a segment's local RNG decides its archetype. Exposed as a standalone O(1) probe so
// segmentAt can look at the *previous* segment's raw archetype (for the "land pad after a gap" rule)
// without recursion — each probe seeds its own independent stream, so it stays random-access.
function rawArchetypeAt( seed: number, i: number ): Archetype {
    return pickArchetype( mulberry32( hash2( seed, i ) )() );
}

function fullFloor( y: number ): FloorSpan[] {
    return [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y } ];
}

function buildSegment( seed: number, i: number ): Segment {
    const z0 = i * SEG_LEN;
    const z1 = z0 + SEG_LEN;
    const base = { index: i, z0, z1, blocks: [] as Block[], isFinish: false };

    // Finish: a flat full-width pad from TRACK_SEGMENTS onward (isFinish flips `finished` on cross).
    if ( i >= TRACK_SEGMENTS ) return { ...base, kind: 'finish', floors: fullFloor( 0 ), isFinish: true };
    // Start-safe accel zone.
    if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ) };

    const rng = mulberry32( hash2( seed, i ) );
    let arch = pickArchetype( rng() ); // consumes the SAME first roll as rawArchetypeAt(seed, i)

    // Fairness: the segment right after a gap MUST be a flat landing pad (guaranteed floor to land on),
    // and this also prevents two active gaps in a row (the second becomes a pad). Purely local, O(1).
    if ( i > START_SAFE && rawArchetypeAt( seed, i - 1 ) === 'gap' ) arch = 'plain';

    switch ( arch ) {
        case 'gap':
            return { ...base, kind: 'gap', floors: [] }; // no floor across the whole width → fall unless airborne
        case 'platform': {
            // Raised SOLID section spanning the full width: JUMP onto it (land on the top floor) or
            // CRASH into its lethal face. Top ≤ MAX_STEP so a single ground jump clears it. Renders as
            // the block body (visible, solid) + the top floor — no more invisible floating ledge.
            const y = MAX_STEP * ( 0.55 + 0.45 * rng() ); // 0.55..1.0 × MAX_STEP → reads clearly + jumpable
            const body: Block = { x0: -HALF_WIDTH, x1: HALF_WIDTH, y0: 0, y1: y };
            return { ...base, kind: 'platform', floors: fullFloor( y ), blocks: [ body ] };
        }
        case 'block': {
            // Flat floor + one lethal block against one edge, leaving a passable corridor on the other.
            const corridor = MIN_CORRIDOR + rng() * CORRIDOR_EXTRA;
            const openRight = rng() < 0.5;
            const block: Block = openRight
                ? { x0: -HALF_WIDTH, x1: HALF_WIDTH - corridor, y0: 0, y1: BLOCK_HEIGHT }
                : { x0: -HALF_WIDTH + corridor, x1: HALF_WIDTH, y0: 0, y1: BLOCK_HEIGHT };
            return { ...base, kind: 'block', floors: fullFloor( 0 ), blocks: [ block ] };
        }
        default:
            return { ...base, kind: 'plain', floors: fullFloor( 0 ) };
    }
}

// Ship z → segment index. Pure, O(1) — the collision entry point.
export function segIndexForZ( z: number ): number {
    return Math.floor( z / SEG_LEN );
}

// makeTrack(seed) → the `track` handle passed into simulate(). A closure bound to the seed; both ends
// build it from the SAME room-state seed and thus generate identical geometry.
export function makeTrack( seed: number ): Track {
    const segmentAt = ( i: number ): Segment => buildSegment( seed, i );
    return {
        seed,
        finishZ: TRACK_SEGMENTS * SEG_LEN,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ),
    };
}

// ── Fairness / collision helpers (also asserted by the determinism test) ──

// A hole = a segment with no floor at all: you cross it only by being airborne (a jump).
export function isHole( seg: Segment ): boolean {
    return seg.floors.length === 0;
}

// Widest continuous lateral corridor of floor NOT covered by any block (units). Used both by the
// fairness test (must be ≥ MIN_CORRIDOR for non-hole segments) and as a shared notion of "passable".
export function passableCorridorWidth( seg: Segment ): number {
    let best = 0;
    for ( const f of seg.floors ) {
        // Subtract each block's x-overlap from this span, tracking the largest surviving sub-interval.
        // Blocks here only ever touch one edge, so a single running cursor suffices.
        let cursor = f.x0;
        const edges: Array< [ number, number ] > = [];
        for ( const b of seg.blocks ) {
            const lo = Math.max( f.x0, b.x0 );
            const hi = Math.min( f.x1, b.x1 );
            if ( hi > lo ) edges.push( [ lo, hi ] );
        }
        edges.sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
        for ( const [ lo, hi ] of edges ) {
            if ( lo > cursor ) best = Math.max( best, lo - cursor );
            cursor = Math.max( cursor, hi );
        }
        if ( f.x1 > cursor ) best = Math.max( best, f.x1 - cursor );
    }
    return best;
}

export { MAX_GAP, MAX_STEP };
