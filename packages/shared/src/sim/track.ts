// Deterministic track generation. The ENTIRE track is a pure function of the room seed — no stored
// geometry, no synced tiles. `segmentAt(i)` derives one segment from (seed, i) via a LOCAL PRNG
// seeded by hash2(seed, i), so it is O(1) random-access and byte-identical on client + server (this
// is why collision — which runs inside the shared simulate() — auto-networks with no wire change).
//
// A finite Race is indices 0..TRACK_SEGMENTS; because segmentAt accepts any i, endless Survival (S7)
// falls out for free — do NOT materialize an array, that would force an S7 rewrite.
//
// DETERMINISM: integer/PRNG/`+-*/`/compare/floor ONLY. NO Math.sin/cos/tan/pow/sqrt in this file — a
// single ULP of cross-engine drift diverges geometry → diverges deaths → the game desyncs. (Jump-reach
// fairness, which DOES need sqrt, is a one-time bound computed in constants.ts and asserted in the test.)

import { CELL } from '../constants.js';
import { hash2, mulberry32 } from './rng.js';

// Solid floor over the lateral interval [x0, x1] at world height y. Gaps = x not covered by any span.
export interface FloorSpan {
    x0: number;
    x1: number;
    y: number;
}

// Lethal AABB cube in (x, y) over a bounded z-range [z0, z1). Touch it (footprint overlap) → derezz.
// z0/z1 make it a DISCRETE cube (an open-scatter field is many of these) AND supply the AABB z-extent.
export interface Block {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    z0: number;
    z1: number;
}

// What a segment is, for rendering + the fairness test. Collision reads floors/blocks generically.
export type SegmentKind = 'plain' | 'block' | 'gap' | 'finish';

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

// ── Track constants — everything is sized in 4u CELLs (difficulty is a config edit) ──
export const SEG_LEN = 20; // world-z length of one segment = 5 z-cells. A GAP is one segment long.
export const TRACK_SEGMENTS = 200; // hazard segments before the finish → finishZ = TRACK_SEGMENTS·SEG_LEN.
export const START_SAFE = 6; // leading segments forced flat + full-width (spawn/accel zone) — no early death.
export const HALF_WIDTH = 32; // lateral half-extent → 16 lanes wide (2·HALF_WIDTH/CELL). Matches DEFAULT_TUNING.halfWidth.
export const LANES = ( 2 * HALF_WIDTH ) / CELL; // 16 lateral cells (lanes).
export const ZCELLS = SEG_LEN / CELL; // 5 forward cells (rows) per segment.
export const MIN_LANE = 2 * CELL; // fairness: ≥2 contiguous open lanes (8u) guaranteed at every z-slice — even the widest class (Freighter 3.6u) threads with margin.
export const BLOCK_HEIGHT = 8; // cube top (y) = 2 cells. ABOVE double-jump reach on purpose → UN-jumpable: strafe around or destroy, never hop.
const ROW_FILL = 0.7; // P(a z-row holds a cube) → ~3.5 cubes/segment average. THE block-density / difficulty dial.

// Archetype mix. Probabilities are the difficulty dial; they sum to 1 across the [0,1) roll. Blocks are the
// STAR obstacle now (strafe-weave core); gaps punctuate with the jump mechanic; plain gives breathing room.
type Archetype = 'plain' | 'block' | 'gap';
const P_PLAIN = 0.35;
const P_BLOCK = 0.45; // cumulative 0.80
// remainder (0.20) → gap

function pickArchetype( r: number ): Archetype {
    if ( r < P_PLAIN ) return 'plain';
    if ( r < P_PLAIN + P_BLOCK ) return 'block';
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
        case 'block': {
            // OPEN-SCATTER cube field on the cell grid. Each of the ZCELLS z-rows MAY hold ONE 1×1-cell cube
            // at a random lane. ≤1 cube per row ⇒ cubes are z-disjoint ⇒ every z-slice keeps ≥ (LANES−1)
            // lanes open, far above MIN_LANE — fair BY CONSTRUCTION (no pigeonhole needed). Full floor
            // underneath: a block field is DODGED (strafe-weave), never fallen through.
            const blocks: Block[] = [];
            for ( let r = 0; r < ZCELLS; r++ ) {
                if ( rng() < ROW_FILL ) {
                    const lane = Math.floor( rng() * LANES ); // 0..LANES-1
                    const bx0 = -HALF_WIDTH + lane * CELL;
                    const bz0 = z0 + r * CELL;
                    blocks.push( { x0: bx0, x1: bx0 + CELL, y0: 0, y1: BLOCK_HEIGHT, z0: bz0, z1: bz0 + CELL } );
                }
            }
            return { ...base, kind: 'block', floors: fullFloor( 0 ), blocks };
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

// Widest continuous lateral corridor of floor NOT covered by any block (units). CONSERVATIVE: it ignores
// each cube's z-extent (treats all cubes as coexisting at one z-slice), so it under-estimates the true open
// lane — a safe lower bound for the ≥ MIN_LANE fairness assert.
export function passableCorridorWidth( seg: Segment ): number {
    let best = 0;
    for ( const f of seg.floors ) {
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
