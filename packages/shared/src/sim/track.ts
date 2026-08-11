// Deterministic track generation. The ENTIRE track is a pure function of the room seed — no stored
// geometry, no synced tiles. `segmentAt(i)` derives one segment from (seed, i) via LOCAL hashes/PRNGs
// seeded by hash2(seed, …), so it is O(1) random-access and byte-identical on client + server (this is
// why collision — which runs inside the shared simulate() — auto-networks with no wire change).
//
// The track is FINITE — indices 0..length (length defaults to TRACK_SEGMENTS). segmentAt(i) stays a pure
// O(1) derivation with no stored array, which is what keeps geometry byte-identical on client + server with
// zero tile sync — a finite track could be materialized once, but the per-segment function is the simplest
// correct form and costs nothing. (ADR-004: the old "endless Survival falls out for free — do NOT
// materialize an array, that would force an S7 rewrite" note is obsolete; Survival/endless was dropped.)
//
// DETERMINISM: integer/PRNG/`+-*/`/compare/floor ONLY. NO Math.sin/cos/tan/pow/sqrt in the per-segment
// path — a single ULP of cross-engine drift diverges geometry → diverges deaths → the game desyncs.
// Coherence comes from hashed value-noise + smoothstep + triangle-wave (see noise.ts); every sqrt-needing
// bound (jump-reach, the weave node period) is a ONE-TIME constant computed in constants.ts.
//
// ── ADR-006 MODEL — rhythm-paced: arrangement envelope + DISCRETE SLALOM ──
// Difficulty follows a "Believer" arrangement envelope (intensityAt → SECTIONS): escalating waves — tense
// verse breathers, chorus slams, a bridge valley, a final peak, then an outro to a plain finish. Each hazard
// segment carves a moving "racing line" (weaveRaw); a moderate safe corridor (the union of the line's 5 per-row
// positions) stays clear so the WEAVE forces continuous strafing, and OUTSIDE it deadly blocks are placed
// DISCRETELY by coherent noise (density < 1 → HOLES between them = dodge-space; RLE-merged but width-capped, so
// NEVER a solid bank/tube — you SLALOM around sparse obstacles). INSIDE the corridor an occasional SMALL slow
// (drag) grace-note is the eat-or-dodge decision on the line. Fair BY CONSTRUCTION: lethal never sits inside
// the corridor, so ≥ MIN_LANE open floor survives at EVERY z-slice; weave speed ≤ the derived SLOPE_CAP/CURV_CAP
// (the difficulty ceiling). Difficulty = block density + weave demand + gaps, NOT a shrinking tube. Slice 1:
// gaps stay full-width (positional = Slice 2).

import {
    BLOCK_MAX_LANES,
    CELL,
    CORRIDOR_BUFFER,
    CORRIDOR_W_MIN,
    CORRIDOR_W_START,
    deriveNodePeriod,
    deriveWeaveCurvatureCap,
    deriveWeavePeriod,
    deriveWeaveSlopeCap,
    FLICK_RATE_MAX,
    FLICK_RATE_START,
    FLICK_WIDTH,
    FULL_GAP_FRAC,
    GAP_P_MAX,
    GAP_P_START,
    SECTIONS,
    SLOW_GRACE_MAX,
    SLOW_GRACE_START,
    SLOW_NOISE_FZ_LANE,
    SLOW_NOISE_FZ_SEG,
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

// ADR-002 — a first-class piece of gameplay data placed ON the track by the provider. Anchors are
// MATERIALIZED, not synced: their positions derive from the descriptor (exactly like geometry), so both ends
// compute an identical list from the same descriptor and only per-anchor *availability* (e.g.
// RunState.pickupTaken, keyed by anchor id) ever crosses the wire. `kind` is left OPEN (a string) for future
// hazard/drop/checkpoint kinds — but only 'pickup' is modelled today (do NOT invent kinds with no consumer).
// Litmus for adding a kind (ADR-000): "would two clients disagreeing on this anchor desync the game?" yes →
// it belongs here; cosmetic-only → it belongs to the (frozen) VisualTrack, never on the physics Track.
export interface Anchor {
    id: string; // stable slot key. For 'pickup' this is the segment index string → keys RunState.pickupTaken.
    kind: string; // 'pickup' today; open for hazard/drop/checkpoint later.
    x: number;
    y: number;
    z: number;
    params?: unknown; // per-kind payload (unused by 'pickup'); reserved so a kind can carry data without a schema change.
}

export interface Track {
    finishZ: number; // world z of the finish line
    segmentAt( i: number ): Segment;
    segmentAtZ( z: number ): Segment;
    anchors: Anchor[]; // ADR-002: gameplay anchors (pickups today), materialized by the provider from the descriptor.
}

// The procgen arm of TrackDescriptor (the discriminated union lives in track-provider.ts, the ADR-001 seam).
// Defined here — not imported from the provider — so track.ts stays the leaf module and only the provider
// depends on it, never the reverse. `seed` is the ONLY field procgen actually reads today; `tier` and
// `length` are RESERVED + UNWIRED (ADR-003 wires the procgen rule-system): `tier` is ignored and `length`
// falls back to TRACK_SEGMENTS so the generated geometry is byte-identical to the pre-ADR seed-only path.
export interface ProcgenDescriptor {
    kind: 'procgen';
    seed: number;
    tier: number;
    length: number;
}

// ── Track constants — everything is sized in 4u CELLs (difficulty is a config edit) ──
export const SEG_LEN = 20; // world-z length of one segment = 5 z-cells. A GAP is one segment long.
export const TRACK_SEGMENTS = 400; // hazard segments before finish → finishZ = TRACK_SEGMENTS·SEG_LEN = 8000u. ≈2.4 min at cruise (55 u/s) / ~2.8 min at real avg — the 2–3 min target. The SECTIONS arrangement normalizes to this, so the Believer arc just stretches.
export const START_SAFE = 6; // leading segments forced flat + full-width (spawn/accel zone) — no early death.
export const HALF_WIDTH = 32; // lateral half-extent → 16 lanes wide (2·HALF_WIDTH/CELL). Matches DEFAULT_TUNING.halfWidth.
export const LANES = ( 2 * HALF_WIDTH ) / CELL; // 16 lateral cells (lanes).
export const ZCELLS = SEG_LEN / CELL; // 5 forward cells (rows) per segment.
export const MIN_LANE = 2 * CELL; // fairness: ≥2 contiguous open lanes (8u) guaranteed at every z-slice — even the widest class (Freighter 3.6u) threads with margin.
export const BLOCK_HEIGHT = 8; // cube top (y) = 2 cells. ABOVE double-jump reach on purpose → UN-jumpable: strafe around, never hop.
export const BLOCK_DEPTH = 8; // z-depth (world u) of a block — a SHORT DISCRETE cube centered in the segment, NOT the full 20u segment. Short so you flick PAST obstacles instead of running beside a long wall. Tune for chunkier (↑) vs sparser/snappier (↓); same block COUNT either way (renderer-budget safe).
export const PICKUP_SPACING = 3; // ADR-002: segments between pickup anchors → a pickup roughly every PICKUP_SPACING·SEG_LEN (≈60u): dense drops. Provider-materialized here (was combat/pickups.ts pre-ADR-002).

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
const SALT_WALL = 0x51ed270b | 0; // discrete deadly-block noise stream (outside the corridor)
const SALT_DRAG = 0x3c9f42a1 | 0; // slow grace-note noise stream (uncorrelated from the walls + the weave line)
const SALT_FLICK = 0x7a1c9e33 | 0; // flick-pillar roll + side stream (uncorrelated from everything else)
const SALT_GAP = 0x2f6a1b9d | 0; // full-vs-partial gap-width roll (uncorrelated from rolledGap's occurrence roll)

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

// ── ADR-006 arrangement envelope — intensityAt REPLACES the S6 monotonic difficultyAt ──
// A "Believer" staircase of escalating waves (SECTIONS in constants.ts), smoothstepped within each section.
// Intensity ∈ [0,1] drives corridor width, weave amplitude (via corridorWidthLanes), slow-grace density, and
// gap probability. Hidden pacing scaffold — the surface stays continuous. Trig-free (arithmetic + smoothstep)
// ⇒ byte-identical on both engines.
function lerp( a: number, b: number, t: number ): number {
    return a + ( b - a ) * t;
}
function clamp( v: number, lo: number, hi: number ): number {
    return v < lo ? lo : v > hi ? hi : v;
}
// SECTIONS' relative weights normalized ONCE (module load) to fractions [f0, f1) of the post-START_SAFE track.
const SECTION_BOUNDS = ( () => {
    const total = SECTIONS.reduce( ( sum, s ) => sum + s.weight, 0 );
    let acc = 0;
    return SECTIONS.map( ( s ) => {
        const f0 = acc / total;
        acc += s.weight;
        return { f0, f1: acc / total, i0: s.i0, i1: s.i1 };
    } );
} )();
export function intensityAt( i: number, length: number ): number {
    if ( i < START_SAFE ) return 0; // start-safe accel zone plays before the arrangement begins
    const span = length - START_SAFE;
    const pos = span > 0 ? clamp( ( i - START_SAFE ) / span, 0, 1 ) : 0;
    let s = SECTION_BOUNDS[ SECTION_BOUNDS.length - 1 ];
    for ( const b of SECTION_BOUNDS ) {
        if ( pos >= b.f0 && pos < b.f1 ) {
            s = b;
            break;
        }
    }
    const t = s.f1 > s.f0 ? ( pos - s.f0 ) / ( s.f1 - s.f0 ) : 1;
    return clamp( lerp( s.i0, s.i1, smoothstep( clamp( t, 0, 1 ) ) ), 0, 1 );
}
function corridorWidthLanes( intensity: number ): number {
    const w = Math.round( lerp( CORRIDOR_W_START, CORRIDOR_W_MIN, intensity ) );
    return clamp( w, CORRIDOR_W_MIN, LANES ); // never below the MIN_LANE (2-lane) fairness floor
}
function slowGrace( intensity: number ): number {
    return lerp( SLOW_GRACE_START, SLOW_GRACE_MAX, intensity );
}
function wallDensity( intensity: number ): number {
    return lerp( WALL_DENSITY_START, WALL_DENSITY_MAX, intensity );
}
function gapProb( intensity: number ): number {
    return lerp( GAP_P_START, GAP_P_MAX, intensity );
}
function flickRate( intensity: number ): number {
    return lerp( FLICK_RATE_START, FLICK_RATE_MAX, intensity );
}

// ── Gaps — sparse jump punctuation, orthogonal to the weave ──
// Whether segment i ROLLED a gap (first draw of its local RNG < gapProb(D)). A real gap also requires the
// PREVIOUS segment not to have rolled one (→ no two gaps in a row, and the segment after a gap is a guaranteed
// landing pad). Pure O(1) local lookback — each probe seeds its own independent stream.
function rolledGap( seed: number, i: number, length: number ): boolean {
    if ( i < START_SAFE || i >= length ) return false;
    return mulberry32( hash2( seed, i ) )() < gapProb( intensityAt( i, length ) );
}

function fullFloor( y: number ): FloorSpan[] {
    return [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y } ];
}

// A gap's floors. FULL_GAP_FRAC of gaps are FULL-WIDTH (floors:[] → must JUMP). The rest are PARTIAL — a floor
// STRIP at the weave-line corridor with a hole to the side(s): strafe onto the strip to cross, or jump. Strip
// width (= corridor width) + position (= the weave) vary, so gaps read as DIFFERENT WIDTHS; the strip sits on
// the reachable line → fair. Collision is span-based, so a partial floor "just works" (over the strip = grounded).
function gapFloors( seed: number, i: number, length: number ): FloorSpan[] {
    if ( mulberry32( hash2( ( seed ^ SALT_GAP ) | 0, i ) )() < FULL_GAP_FRAC ) return []; // full-width jump gap
    const wLanes = corridorWidthLanes( intensityAt( i, length ) );
    const openStart = clamp(
        Math.round( weaveRaw( seed, rowGlobal( i, Math.floor( ZCELLS / 2 ) ) ) * ( LANES - wLanes ) ),
        0,
        LANES - wLanes,
    );
    const x0 = -HALF_WIDTH + openStart * CELL;
    return [ { x0, x1: x0 + wLanes * CELL, y: 0 } ];
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

// A flick pillar: the lane range [lo, hi] inside the corridor that intrudes from one edge, forcing a sidestep.
interface Flick {
    lo: number;
    hi: number;
}

// DISCRETE SLALOM + FLICK (ADR-006). Lane state: 0 = open · 1 = lethal (red block) · 2 = drag (amber slow).
// INSIDE the corridor's union band → open, except (a) a FLICK pillar intruding from one edge (forces a sidestep
// to the other side) or (b) an occasional SMALL slow grace-note. OUTSIDE the band → a DISCRETE deadly block
// where coherent noise clears the density (holes between them = dodge-space, NEVER a solid bank). A ≥ MIN_LANE
// open run always survives the band (the flick leaves it — see flickAt), so fairness holds at every z-slice.
function laneState(
    seed: number,
    i: number,
    lane: number,
    unionLo: number,
    unionHi: number,
    flick: Flick | null,
    density: number,
    slowP: number,
): 0 | 1 | 2 {
    if ( lane >= unionLo && lane <= unionHi ) {
        if ( flick && lane >= flick.lo && lane <= flick.hi ) return 1; // flick pillar → sidestep the other way
        const slow = valueNoise2D( ( seed ^ SALT_DRAG ) | 0, lane / SLOW_NOISE_FZ_LANE, i / SLOW_NOISE_FZ_SEG ) < slowP;
        return slow ? 2 : 0; // inside the corridor: open, or a small slow grace-note
    }
    if ( lane >= unionLo - CORRIDOR_BUFFER && lane <= unionHi + CORRIDOR_BUFFER ) return 0; // clear MARGIN around the corridor — no pillar crowds the edge (keeps the safe path reasonable, not frame-perfect)
    const wall = valueNoise2D( ( seed ^ SALT_WALL ) | 0, lane / WALL_NOISE_FZ_LANE, i / WALL_NOISE_FZ_SEG ) < density;
    return wall ? 1 : 0; // outside: a discrete deadly block, or a hole (dodge-space)
}

// Whether segment i ROLLED a flick (independent local RNG). Used with a one-segment lookback so flicks never
// land two in a row → there is always a clear segment to recover, which keeps the sidestep laterally reachable.
function flickRolled( seed: number, i: number, length: number ): boolean {
    if ( i < START_SAFE || i >= length ) return false;
    return mulberry32( hash2( ( seed ^ SALT_FLICK ) | 0, i ) )() < flickRate( intensityAt( i, length ) );
}

// The flick pillar for segment i (or null). Fires only if this segment rolled one AND the previous did not, and
// only if blocking FLICK_WIDTH lanes still leaves ≥ MIN_LANE open on the other side. Side alternates by an
// independent hash → a mix of left/right sidesteps.
function flickAt( seed: number, i: number, length: number, unionLo: number, unionHi: number ): Flick | null {
    if ( ! flickRolled( seed, i, length ) || flickRolled( seed, i - 1, length ) ) return null;
    const minGapLanes = MIN_LANE / CELL;
    if ( unionHi - unionLo + 1 - FLICK_WIDTH < minGapLanes ) return null; // keep a MIN_LANE gap to the side
    const fromLeft = mulberry32( hash2( ( seed ^ SALT_FLICK ) | 0, i * 2 + 1 ) )() < 0.5;
    return fromLeft
        ? { lo: unionLo, hi: unionLo + FLICK_WIDTH - 1 } // pillar on the LEFT edge → sidestep RIGHT
        : { lo: unionHi - FLICK_WIDTH + 1, hi: unionHi }; // pillar on the RIGHT edge → sidestep LEFT
}

// Build the segment's blocks: RLE-merge contiguous SAME-STATE lanes into one full-depth Block (variable width).
// A run break happens whenever the lane state changes (open↔lethal↔drag), so lethal and drag never merge together.
function buildWalls(
    seed: number,
    i: number,
    unionLo: number,
    unionHi: number,
    flick: Flick | null,
    density: number,
    slowP: number,
    z0: number,
): Block[] {
    const blocks: Block[] = [];
    let runStart = 0;
    let runState: 0 | 1 | 2 = 0;
    // SHORT DISCRETE cube centered in the segment (BLOCK_DEPTH), NOT a full-segment-depth wall → you flick PAST
    // it. Same block count (one per lane-run) so the renderer budget is unaffected; only the z-extent shrinks.
    const bz0 = z0 + ( SEG_LEN - BLOCK_DEPTH ) / 2;
    const bz1 = bz0 + BLOCK_DEPTH;
    const flush = ( endLane: number ): void => {
        blocks.push( {
            x0: -HALF_WIDTH + runStart * CELL,
            x1: -HALF_WIDTH + ( endLane + 1 ) * CELL,
            y0: 0,
            y1: BLOCK_HEIGHT,
            z0: bz0,
            z1: bz1,
            lethal: runState === 1,
        } );
    };
    for ( let lane = 0; lane < LANES; lane++ ) {
        const st = laneState( seed, i, lane, unionLo, unionHi, flick, density, slowP );
        // break the run on a state change OR when a same-state run hits the width cap (no giant wall-slabs).
        if ( st !== runState || ( runState !== 0 && lane - runStart >= BLOCK_MAX_LANES ) ) {
            if ( runState !== 0 ) flush( lane - 1 ); // close the previous block run
            runState = st;
            runStart = lane;
        }
    }
    if ( runState !== 0 ) flush( LANES - 1 );
    return blocks;
}

function buildSegment( seed: number, i: number, length: number ): Segment {
    const z0 = i * SEG_LEN;
    const z1 = z0 + SEG_LEN;
    const base = { index: i, z0, z1, blocks: [] as Block[], isFinish: false };

    // Finish: a flat full-width pad from `length` onward (isFinish flips `finished` on cross).
    if ( i >= length ) return { ...base, kind: 'finish', floors: fullFloor( 0 ), isFinish: true };
    // Start-safe accel zone.
    if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ) };

    // Gap: rolled one AND the previous segment didn't (guarantees a landing pad after every gap, and no two
    // active gaps in a row). Falls through the whole width → cross it only airborne.
    if ( rolledGap( seed, i, length ) && ! rolledGap( seed, i - 1, length ) )
        return { ...base, kind: 'gap', floors: gapFloors( seed, i, length ) };

    // Carved corridor + noise walls (extracted to corridorUnion / buildWalls to keep this simple).
    const intensity = intensityAt( i, length );
    const wLanes = corridorWidthLanes( intensity );
    const { lo: unionLo, hi: unionHi } = corridorUnion( seed, i, wLanes );
    const flick = flickAt( seed, i, length, unionLo, unionHi );
    const blocks = buildWalls( seed, i, unionLo, unionHi, flick, wallDensity( intensity ), slowGrace( intensity ), z0 );

    // 'plain' when no walls happened to spawn — still a valid corridor segment (pickups land here + on blocks).
    return { ...base, kind: blocks.length > 0 ? 'block' : 'plain', floors: fullFloor( 0 ), blocks };
}

// World-x centre of the WIDEST lethal-free run at a segment's mid-row — where a pickup sits so it is ALWAYS on
// open floor (never buried in a wall or a flick pillar) and inside the corridor the player threads. Reads the
// BUILT segment's blocks, so it is correct regardless of wall/flick placement (was `corridorCenterX`, which
// assumed the geometric centre was open — false once flicks can intrude there). Deterministic like the track.
// Only meaningful for non-gap segments — a gap has no floor, so callers skip holes first.
function openCenterX( seg: Segment ): number {
    const zc = seg.z0 + SEG_LEN / 2; // the pickup's z (segment mid)
    const walls = seg.blocks
        .filter( ( b ) => b.lethal && b.z0 <= zc && zc < b.z1 )
        .map( ( b ): [ number, number ] => [ b.x0, b.x1 ] )
        .sort( ( a, b ) => a[ 0 ] - b[ 0 ] );
    let cursor = -HALF_WIDTH;
    let bestLo = -HALF_WIDTH;
    let bestHi = -HALF_WIDTH;
    const consider = ( lo: number, hi: number ): void => {
        if ( hi - lo > bestHi - bestLo ) {
            bestLo = lo;
            bestHi = hi;
        }
    };
    for ( const [ lo, hi ] of walls ) {
        if ( lo > cursor ) consider( cursor, lo );
        cursor = Math.max( cursor, hi );
    }
    if ( HALF_WIDTH > cursor ) consider( cursor, HALF_WIDTH );
    return ( bestLo + bestHi ) / 2;
}

// Ship z → segment index. Pure, O(1) — the collision entry point.
export function segIndexForZ( z: number ): number {
    return Math.floor( z / SEG_LEN );
}

// makeProcgenTrack(descriptor) → the `track` handle passed into simulate(). PROCGEN-INTERNAL: this is the
// ONLY place a `seed` is read to build a track — everything outside goes through resolveTrack (track-provider,
// the ADR-001 seam). A closure bound to the descriptor's seed; both ends build it from the SAME room-state
// descriptor and thus generate identical geometry. `length` falls back to TRACK_SEGMENTS (RESERVED/UNWIRED —
// see ProcgenDescriptor) so finishZ + the finish/gap end-cutoffs are byte-identical to the pre-ADR path.
export function makeProcgenTrack( d: ProcgenDescriptor ): Track {
    const seed = d.seed;
    const length = d.length || TRACK_SEGMENTS; // `|| ` (not `??`): the schema uint16 defaults to 0, and a 0-length track is meaningless — fall back so geometry stays identical
    const segmentAt = ( i: number ): Segment => buildSegment( seed, i, length );
    return {
        finishZ: length * SEG_LEN,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ),
        anchors: pickupAnchors( length, segmentAt ),
    };
}

// ADR-002: materialize the pickup anchors while building the track (was combat/pickups.ts's `pickupLayout`).
// One candidate slot per PICKUP_SPACING segments after the start-safe zone, EXCLUDING gaps (no floor to grab
// over). Each anchor sits at the corridor centre (the racing line) at the segment's mid-row, so it is always
// inside the ≥ MIN_LANE open band — never buried in a wall. The `id` is the segment-index string, UNCHANGED
// from the pre-ADR-002 scheme so RunState.pickupTaken keys need ZERO wire migration. Deterministic from the
// seed like the geometry → both ends materialize the identical list; only availability ever syncs.
function pickupAnchors( length: number, segmentAt: ( i: number ) => Segment ): Anchor[] {
    const out: Anchor[] = [];
    for ( let seg = START_SAFE; seg < length; seg += PICKUP_SPACING ) {
        const s = segmentAt( seg );
        if ( isHole( s ) ) continue; // gap → no floor to stand on / grab over
        const z = seg * SEG_LEN + SEG_LEN / 2; // centred forward in the segment (the mid row)
        out.push( { id: String( seg ), kind: 'pickup', x: openCenterX( s ), y: 0, z } );
    }
    return out;
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
