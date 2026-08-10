// Deterministic track generation. The ENTIRE track is a pure function of the room seed — no stored
// geometry, no synced tiles. `segmentAt(i)` derives one segment from (seed, i) via LOCAL hashes/PRNGs
// seeded by hash2(seed, …), so it is O(1) random-access and byte-identical on client + server (this is
// why collision — which runs inside the shared simulate() — auto-networks with no wire change).
//
// A finite Race is indices 0..TRACK_SEGMENTS; because segmentAt accepts any i, endless Survival (S7)
// falls out for free — do NOT materialize an array, that would force an S7 rewrite.
//
// DETERMINISM: integer/PRNG/`+-*/`/compare/floor ONLY. NO Math.sin/cos/tan/pow/sqrt in the per-segment
// path — a single ULP of cross-engine drift diverges geometry → diverges deaths → the game desyncs.
// Coherence comes from hashed value-noise + smoothstep + triangle-wave (see noise.ts); every sqrt-needing
// bound (jump-reach, the weave node period) is a ONE-TIME constant computed in constants.ts.
//
// ── S6 MODEL (procgen v2 + S6.1 lively carrier): carved racing-line + variable-width noise walls ──
// Each hazard segment carves a rounded-triangle "racing line" (see weaveRaw) the player threads, and walls the space OUTSIDE a
// corridor of ≥ MIN_LANE open lanes around it. Contiguous wall lanes are RLE-merged into ONE wide Block →
// variable block widths (1/2/3+ cells). Fair BY CONSTRUCTION: the corridor is never walled, so ≥ MIN_LANE
// contiguous open floor survives at EVERY z-slice regardless of wall shape (no per-width fairness proof).
// Walls span the FULL segment depth (one merged Block per lane-run) — this keeps the block count within the
// renderer's instance budget while the corridor still moves per-row (5 rows/segment) for a dense weave.

import {
    CELL,
    CORRIDOR_W_MIN,
    CORRIDOR_W_START,
    D_EASE_CAP,
    D_PACE_AMP,
    D_PACE_WAVELENGTH,
    D_RAMP_SEGMENTS,
    DRAG_FRAC,
    DRAG_NOISE_FZ_LANE,
    DRAG_NOISE_FZ_SEG,
    deriveNodePeriod,
    deriveWeaveCurvatureCap,
    deriveWeavePeriod,
    deriveWeaveSlopeCap,
    GAP_P_MAX,
    GAP_P_START,
    WALL_DENSITY_MAX,
    WALL_DENSITY_START,
    WALL_NOISE_FZ_LANE,
    WALL_NOISE_FZ_SEG,
    WEAVE_CARRIER_BUDGET,
    WEAVE_NOISE_FRAC,
} from '../constants.js';
import { ALL_CLASS_TUNINGS } from '../ship-classes.js';
import { smoothstep, tri, valueNoise1D, valueNoise2D } from './noise.js';
import { hash2, mulberry32 } from './rng.js';

// Solid floor over the lateral interval [x0, x1] at world height y. Gaps = x not covered by any span.
export interface FloorSpan {
    x0: number;
    x1: number;
    y: number;
}

// Lethal AABB cube in (x, y) over a bounded z-range [z0, z1). Touch it (footprint overlap) → derezz.
// z0/z1 make it a DISCRETE block (a wall field is many of these) AND supply the AABB z-extent. Post-S6 a
// Block may span MANY lanes laterally (RLE-merged wall run) — x1-x0 is a multiple of CELL.
export interface Block {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    z0: number;
    z1: number;
    lethal: boolean; // true = red wall (touch → derezz + enforces the corridor); false = amber DRAG block (passable, slows you). See buildWalls / step.ts.
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
export const BLOCK_HEIGHT = 8; // cube top (y) = 2 cells. ABOVE double-jump reach on purpose → UN-jumpable: strafe around, never hop.

// ── Derived weave caps (computed ONCE from the ship roster, never per-segment) ──
// The racing line is threadable by the LEAST-capable ship BY CONSTRUCTION: its slope stays under that ship's
// strafeClamp/maxCruise and its curvature under its strafeAccel-limited reversal rate (see constants.ts).
export const WEAVE_AMP_LANES = LANES; // max racing-line amplitude (lanes). Actual amplitude ≤ this (shrinks with corridor width).
export const SLOPE_CAP = deriveWeaveSlopeCap( ALL_CLASS_TUNINGS ); // [lanes/row]
export const CURV_CAP = deriveWeaveCurvatureCap( ALL_CLASS_TUNINGS, CELL ); // [Δ(lanes/row)/row]
export const FZ_ROWS = deriveNodePeriod( SLOPE_CAP, CURV_CAP, WEAVE_AMP_LANES ); // fBm PERTURBATION node period (rows) — the small organic wander on top of the carrier
export const WEAVE_PERIOD_ROWS = deriveWeavePeriod( SLOPE_CAP, CURV_CAP, WEAVE_AMP_LANES, WEAVE_CARRIER_BUDGET ); // rounded-triangle carrier period (rows) — one full L→R→L sweep

// Distinct hash salts so the racing line, the wall field, and the gap roll are uncorrelated streams.
const SALT_LINE_A = 0x1234567 | 0;
const SALT_LINE_B = 0x2b3c4d5 | 0;
const SALT_WALL = 0x51ed270b | 0;
const SALT_DRAG = 0x3c9f42a1 | 0; // lethal-vs-drag classification stream (uncorrelated from the wall field)

// Global row index (5 rows/segment): the weave moves PER ROW, not per segment → a denser, threadable line.
function rowGlobal( i: number, r: number ): number {
    return i * ZCELLS + r;
}

// Per-seed phase offset (rows) so different seeds don't all start their sweep from the same wall. A constant
// derived once from the seed; the ×period keeps it in the carrier's own units.
function weavePhaseRows( seed: number ): number {
    return valueNoise1D( ( seed ^ SALT_LINE_A ) | 0, 0.5 ) * WEAVE_PERIOD_ROWS;
}

// Racing-line center in LANES ∈ [0, LANES). A ROUNDED-TRIANGLE carrier (near-constant slope down each leg →
// continuous strafing demand; smoothstep-rounded apexes → curvature-safe) plus a small fBm perturbation for
// organic apex positions. The carrier period + the WEAVE_NOISE_FRAC split are sized so realized slope stays
// ≤ SLOPE_CAP and curvature ≤ CURV_CAP — the least-capable ship can always follow it (asserted directly on
// this signal by the fairness test). Trig-free (tri + smoothstep + value-noise) ⇒ byte-identical both ends.
export function weaveRaw( seed: number, row: number ): number {
    const phase = ( row + weavePhaseRows( seed ) ) / WEAVE_PERIOD_ROWS;
    const carrier = smoothstep( ( tri( phase ) + 1 ) / 2 ); // triangle → [0,1], apexes rounded by the fade
    const perturb = valueNoise1D( ( seed ^ SALT_LINE_B ) | 0, row / FZ_ROWS ); // gentle organic wander, [0,1)
    const v = ( 1 - WEAVE_NOISE_FRAC ) * carrier + WEAVE_NOISE_FRAC * perturb;
    return v < 0 ? 0 : v > 1 ? 1 : v; // guard the float edges → stays in [0,1)
}
export function weaveLineLanes( seed: number, row: number ): number {
    return weaveRaw( seed, row ) * WEAVE_AMP_LANES;
}

// ── Difficulty D(i) ∈ [0,1] — Race ease-out to a cap + triangle-wave pacing (Survival growth deferred to S7) ──
function lerp( a: number, b: number, t: number ): number {
    return a + ( b - a ) * t;
}
function clamp( v: number, lo: number, hi: number ): number {
    return v < lo ? lo : v > hi ? hi : v;
}
export function difficultyAt( i: number ): number {
    const t = clamp( ( i - START_SAFE ) / D_RAMP_SEGMENTS, 0, 1 );
    const ease = smoothstep( t ) * D_EASE_CAP; // monotone trend
    const pace = D_PACE_AMP * tri( i / D_PACE_WAVELENGTH ); // tension→release swing
    return clamp( ease + pace, 0, 1 );
}
function corridorWidthLanes( d: number ): number {
    const w = Math.round( lerp( CORRIDOR_W_START, CORRIDOR_W_MIN, d ) );
    return clamp( w, CORRIDOR_W_MIN, LANES ); // never below the MIN_LANE (2-lane) fairness floor
}
function wallDensity( d: number ): number {
    return lerp( WALL_DENSITY_START, WALL_DENSITY_MAX, d );
}
function gapProb( d: number ): number {
    return lerp( GAP_P_START, GAP_P_MAX, d );
}

// ── Gaps — sparse jump punctuation, orthogonal to the weave ──
// Whether segment i ROLLED a gap (first draw of its local RNG < gapProb(D)). A real gap also requires the
// PREVIOUS segment not to have rolled one (→ no two gaps in a row, and the segment after a gap is a guaranteed
// landing pad). Pure O(1) local lookback — each probe seeds its own independent stream.
function rolledGap( seed: number, i: number ): boolean {
    if ( i < START_SAFE || i >= TRACK_SEGMENTS ) return false;
    return mulberry32( hash2( seed, i ) )() < gapProb( difficultyAt( i ) );
}

function fullFloor( y: number ): FloorSpan[] {
    return [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y } ];
}

// The lane band [lo, hi] swept by the moving corridor across a segment's 5 rows — never walled, so per-slice
// fairness holds regardless of wall shape outside it.
function corridorUnion( seed: number, i: number, wLanes: number ): { lo: number; hi: number } {
    let lo = LANES;
    let hi = -1;
    for ( let r = 0; r < ZCELLS; r++ ) {
        const openStart = clamp(
            Math.round( weaveRaw( seed, rowGlobal( i, r ) ) * ( LANES - wLanes ) ),
            0,
            LANES - wLanes,
        );
        const openEnd = openStart + wLanes - 1;
        if ( openStart < lo ) lo = openStart;
        if ( openEnd > hi ) hi = openEnd;
    }
    return { lo, hi };
}

// Lane state for the wall field: 0 = open, 1 = lethal (red), 2 = drag (amber). A lane wants a block where the
// coherent wall-noise clears the density; a second uncorrelated noise then classifies it lethal or drag.
// LETHAL is SUPPRESSED inside the corridor [unionLo, unionHi] (fairness: the never-walled band stays open);
// DRAG is allowed anywhere — so a drag patch can sit ON the racing line as a passable, slowing obstacle.
function laneState(
    seed: number,
    i: number,
    lane: number,
    unionLo: number,
    unionHi: number,
    density: number,
): 0 | 1 | 2 {
    const wall = valueNoise2D( ( seed ^ SALT_WALL ) | 0, lane / WALL_NOISE_FZ_LANE, i / WALL_NOISE_FZ_SEG ) < density;
    if ( ! wall ) return 0;
    const isDrag =
        valueNoise2D( ( seed ^ SALT_DRAG ) | 0, lane / DRAG_NOISE_FZ_LANE, i / DRAG_NOISE_FZ_SEG ) < DRAG_FRAC;
    if ( ! isDrag && lane >= unionLo && lane <= unionHi ) return 0; // lethal inside the corridor → suppress (keep it open)
    return isDrag ? 2 : 1;
}

// Build the segment's blocks: RLE-merge contiguous SAME-STATE lanes into one full-depth Block (variable width).
// A run break happens whenever the lane state changes (open↔lethal↔drag), so lethal and drag never merge together.
function buildWalls(
    seed: number,
    i: number,
    unionLo: number,
    unionHi: number,
    density: number,
    z0: number,
    z1: number,
): Block[] {
    const blocks: Block[] = [];
    let runStart = 0;
    let runState: 0 | 1 | 2 = 0;
    const flush = ( endLane: number ): void => {
        blocks.push( {
            x0: -HALF_WIDTH + runStart * CELL,
            x1: -HALF_WIDTH + ( endLane + 1 ) * CELL,
            y0: 0,
            y1: BLOCK_HEIGHT,
            z0,
            z1,
            lethal: runState === 1,
        } );
    };
    for ( let lane = 0; lane < LANES; lane++ ) {
        const st = laneState( seed, i, lane, unionLo, unionHi, density );
        if ( st !== runState ) {
            if ( runState !== 0 ) flush( lane - 1 ); // close the previous block run
            runState = st;
            runStart = lane;
        }
    }
    if ( runState !== 0 ) flush( LANES - 1 );
    return blocks;
}

function buildSegment( seed: number, i: number ): Segment {
    const z0 = i * SEG_LEN;
    const z1 = z0 + SEG_LEN;
    const base = { index: i, z0, z1, blocks: [] as Block[], isFinish: false };

    // Finish: a flat full-width pad from TRACK_SEGMENTS onward (isFinish flips `finished` on cross).
    if ( i >= TRACK_SEGMENTS ) return { ...base, kind: 'finish', floors: fullFloor( 0 ), isFinish: true };
    // Start-safe accel zone.
    if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ) };

    // Gap: rolled one AND the previous segment didn't (guarantees a landing pad after every gap, and no two
    // active gaps in a row). Falls through the whole width → cross it only airborne.
    if ( rolledGap( seed, i ) && ! rolledGap( seed, i - 1 ) ) return { ...base, kind: 'gap', floors: [] };

    // Carved corridor + noise walls (extracted to corridorUnion / buildWalls to keep this simple).
    const d = difficultyAt( i );
    const wLanes = corridorWidthLanes( d );
    const { lo: unionLo, hi: unionHi } = corridorUnion( seed, i, wLanes );
    const blocks = buildWalls( seed, i, unionLo, unionHi, wallDensity( d ), z0, z1 );

    // 'plain' when no walls happened to spawn — still a valid corridor segment (pickups land here + on blocks).
    return { ...base, kind: blocks.length > 0 ? 'block' : 'plain', floors: fullFloor( 0 ), blocks };
}

// World-x centre of the open racing-line corridor at segment i's MID-ROW (= a pickup's z, SEG_LEN/2). A pickup
// placed here sits ON the line the player threads and is ALWAYS inside the ≥ MIN_LANE open band — never a wall.
// Mirrors buildSegment's carve, so it stays byte-identical both ends (pickups are deterministic from the seed
// like the track). Only meaningful for non-gap segments — a gap has no floor, so callers skip holes first.
export function corridorCenterX( seed: number, i: number ): number {
    const wLanes = corridorWidthLanes( difficultyAt( i ) );
    const r = Math.floor( ZCELLS / 2 ); // mid row = the pickup's z
    const openStart = clamp(
        Math.round( weaveRaw( seed, rowGlobal( i, r ) ) * ( LANES - wLanes ) ),
        0,
        LANES - wLanes,
    );
    const centerLane = openStart + ( wLanes - 1 ) / 2;
    return -HALF_WIDTH + ( centerLane + 0.5 ) * CELL; // lane index → world x (lane centre)
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

// Widest contiguous lateral corridor of floor NOT covered by a wall, at ONE z-slice (z-center). Sums the
// floor spans, subtracts wall intervals that overlap this slice, returns the largest open run (units).
// Wall intervals of `seg` that overlap slice z=zc, clipped to the floor span, sorted by start.
function wallsOnSlice( seg: Segment, f: FloorSpan, zc: number ): Array< [ number, number ] > {
    const walls: Array< [ number, number ] > = [];
    for ( const b of seg.blocks ) {
        if ( ! b.lethal ) continue; // drag blocks are PASSABLE — they never break the open corridor
        if ( b.z0 <= zc && zc < b.z1 ) {
            const lo = Math.max( f.x0, b.x0 );
            const hi = Math.min( f.x1, b.x1 );
            if ( hi > lo ) walls.push( [ lo, hi ] );
        }
    }
    walls.sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
    return walls;
}

function maxOpenAtSlice( seg: Segment, zc: number ): number {
    let best = 0;
    for ( const f of seg.floors ) {
        let cursor = f.x0;
        for ( const [ lo, hi ] of wallsOnSlice( seg, f, zc ) ) {
            if ( lo > cursor ) best = Math.max( best, lo - cursor );
            cursor = Math.max( cursor, hi );
        }
        if ( f.x1 > cursor ) best = Math.max( best, f.x1 - cursor );
    }
    return best;
}

// PER-SLICE min contiguous open corridor (units) across the segment's z-rows — the true fairness measure now
// that the corridor MOVES within a segment (the old whole-segment collapse would false-fail a moving corridor
// that is fair at every slice). A hole returns 0. Stricter than the old helper; the old scatter model still
// passes it (its cubes are already per-row). Asserted ≥ MIN_LANE in the track test.
export function passableCorridorWidth( seg: Segment ): number {
    if ( seg.floors.length === 0 ) return 0;
    let worst = Number.POSITIVE_INFINITY;
    for ( let r = 0; r < ZCELLS; r++ ) {
        const zc = seg.z0 + r * CELL + CELL / 2;
        worst = Math.min( worst, maxOpenAtSlice( seg, zc ) );
    }
    return worst === Number.POSITIVE_INFINITY ? 0 : worst;
}
