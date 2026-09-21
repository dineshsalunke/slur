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

export interface FloorSpan {
    x0: number;
    x1: number;
    y: number;
}

export interface Block {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    z0: number;
    z1: number;
    lethal: boolean;
}

export type SegmentKind = 'plain' | 'block' | 'gap' | 'finish';

export interface Segment {
    index: number;
    z0: number;
    z1: number;
    kind: SegmentKind;
    floors: FloorSpan[];
    blocks: Block[];
    isFinish: boolean;
}

export interface Anchor {
    id: string;
    kind: string;
    x: number;
    y: number;
    z: number;
    params?: unknown;
}

export interface Track {
    finishZ: number;
    segmentAt( i: number ): Segment;
    segmentAtZ( z: number ): Segment;
    anchors: Anchor[];
}

export interface ProcgenDescriptor {
    kind: 'procgen';
    seed: number;
    tier: number;
    length: number;
}

export const SEG_LEN = 20;
export const TRACK_SEGMENTS = 400;
export const START_SAFE = 6;
export const LEAD_SEGMENTS = 1;
export const HALF_WIDTH = 32;
export const LANES = ( 2 * HALF_WIDTH ) / CELL;
export const ZCELLS = SEG_LEN / CELL;
export const MIN_LANE = 2 * CELL;
export const BLOCK_HEIGHT = 8;
export const BLOCK_DEPTH = 8;
export const PICKUP_SPACING = 3;

export const WEAVE_AMP_LANES = LANES;
export const SLOPE_CAP = deriveWeaveSlopeCap( ALL_CLASS_TUNINGS );
export const CURV_CAP = deriveWeaveCurvatureCap( ALL_CLASS_TUNINGS, CELL );
export const FZ_ROWS = deriveNodePeriod( SLOPE_CAP, CURV_CAP, WEAVE_AMP_LANES );
export const WEAVE_PERIOD_ROWS = deriveWeavePeriod( SLOPE_CAP, CURV_CAP, WEAVE_AMP_LANES, WEAVE_CARRIER_BUDGET );

const SALT_LINE_A = 0x1234567 | 0;
const SALT_LINE_B = 0x2b3c4d5 | 0;
const SALT_WALL = 0x51ed270b | 0;
const SALT_DRAG = 0x3c9f42a1 | 0;
const SALT_FLICK = 0x7a1c9e33 | 0;
const SALT_GAP = 0x2f6a1b9d | 0;

function rowGlobal( i: number, r: number ): number {
    return i * ZCELLS + r;
}

function weavePhaseRows( seed: number ): number {
    return valueNoise1D( ( seed ^ SALT_LINE_A ) | 0, 0.5 ) * WEAVE_PERIOD_ROWS;
}

export function weaveRaw( seed: number, row: number ): number {
    const phase = ( row + weavePhaseRows( seed ) ) / WEAVE_PERIOD_ROWS;
    const carrier = smoothstep( ( tri( phase ) + 1 ) / 2 );
    const perturb = valueNoise1D( ( seed ^ SALT_LINE_B ) | 0, row / FZ_ROWS );
    const v = ( 1 - WEAVE_NOISE_FRAC ) * carrier + WEAVE_NOISE_FRAC * perturb;
    return v < 0 ? 0 : v > 1 ? 1 : v;
}
export function weaveLineLanes( seed: number, row: number ): number {
    return weaveRaw( seed, row ) * WEAVE_AMP_LANES;
}

function lerp( a: number, b: number, t: number ): number {
    return a + ( b - a ) * t;
}
function clamp( v: number, lo: number, hi: number ): number {
    return v < lo ? lo : v > hi ? hi : v;
}
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
    if ( i < START_SAFE ) return 0;
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
    return clamp( w, CORRIDOR_W_MIN, LANES );
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

function rolledGap( seed: number, i: number, length: number ): boolean {
    if ( i < START_SAFE || i >= length ) return false;
    return mulberry32( hash2( seed, i ) )() < gapProb( intensityAt( i, length ) );
}

function fullFloor( y: number ): FloorSpan[] {
    return [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y } ];
}

function gapFloors( seed: number, i: number, length: number ): FloorSpan[] {
    if ( mulberry32( hash2( ( seed ^ SALT_GAP ) | 0, i ) )() < FULL_GAP_FRAC ) return [];
    const wLanes = corridorWidthLanes( intensityAt( i, length ) );
    const openStart = clamp(
        Math.round( weaveRaw( seed, rowGlobal( i, Math.floor( ZCELLS / 2 ) ) ) * ( LANES - wLanes ) ),
        0,
        LANES - wLanes,
    );
    const x0 = -HALF_WIDTH + openStart * CELL;
    return [ { x0, x1: x0 + wLanes * CELL, y: 0 } ];
}

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

interface Flick {
    lo: number;
    hi: number;
}

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
        if ( flick && lane >= flick.lo && lane <= flick.hi ) return 1;
        const slow = valueNoise2D( ( seed ^ SALT_DRAG ) | 0, lane / SLOW_NOISE_FZ_LANE, i / SLOW_NOISE_FZ_SEG ) < slowP;
        return slow ? 2 : 0;
    }
    if ( lane >= unionLo - CORRIDOR_BUFFER && lane <= unionHi + CORRIDOR_BUFFER ) return 0;
    const wall = valueNoise2D( ( seed ^ SALT_WALL ) | 0, lane / WALL_NOISE_FZ_LANE, i / WALL_NOISE_FZ_SEG ) < density;
    return wall ? 1 : 0;
}

function flickRolled( seed: number, i: number, length: number ): boolean {
    if ( i < START_SAFE || i >= length ) return false;
    return mulberry32( hash2( ( seed ^ SALT_FLICK ) | 0, i ) )() < flickRate( intensityAt( i, length ) );
}

function flickAt( seed: number, i: number, length: number, unionLo: number, unionHi: number ): Flick | null {
    if ( ! flickRolled( seed, i, length ) || flickRolled( seed, i - 1, length ) ) return null;
    const minGapLanes = MIN_LANE / CELL;
    if ( unionHi - unionLo + 1 - FLICK_WIDTH < minGapLanes ) return null;
    const fromLeft = mulberry32( hash2( ( seed ^ SALT_FLICK ) | 0, i * 2 + 1 ) )() < 0.5;
    return fromLeft ? { lo: unionLo, hi: unionLo + FLICK_WIDTH - 1 } : { lo: unionHi - FLICK_WIDTH + 1, hi: unionHi };
}

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
        if ( st !== runState || ( runState !== 0 && lane - runStart >= BLOCK_MAX_LANES ) ) {
            if ( runState !== 0 ) flush( lane - 1 );
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

    if ( i >= length ) return { ...base, kind: 'finish', floors: fullFloor( 0 ), isFinish: true };
    if ( i < -LEAD_SEGMENTS ) return { ...base, kind: 'gap', floors: [] };
    if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ) };

    if ( rolledGap( seed, i, length ) && ! rolledGap( seed, i - 1, length ) )
        return { ...base, kind: 'gap', floors: gapFloors( seed, i, length ) };

    const intensity = intensityAt( i, length );
    const wLanes = corridorWidthLanes( intensity );
    const { lo: unionLo, hi: unionHi } = corridorUnion( seed, i, wLanes );
    const flick = flickAt( seed, i, length, unionLo, unionHi );
    const blocks = buildWalls( seed, i, unionLo, unionHi, flick, wallDensity( intensity ), slowGrace( intensity ), z0 );

    return { ...base, kind: blocks.length > 0 ? 'block' : 'plain', floors: fullFloor( 0 ), blocks };
}

function openCenterX( seg: Segment ): number {
    const zc = seg.z0 + SEG_LEN / 2;
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

export function segIndexForZ( z: number ): number {
    return Math.floor( z / SEG_LEN );
}

export function makeProcgenTrack( d: ProcgenDescriptor ): Track {
    const seed = d.seed;
    const length = d.length || TRACK_SEGMENTS;
    const segmentAt = ( i: number ): Segment => buildSegment( seed, i, length );
    return {
        finishZ: length * SEG_LEN,
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ),
        anchors: pickupAnchors( length, segmentAt ),
    };
}

function pickupAnchors( length: number, segmentAt: ( i: number ) => Segment ): Anchor[] {
    const out: Anchor[] = [];
    for ( let seg = START_SAFE; seg < length; seg += PICKUP_SPACING ) {
        const s = segmentAt( seg );
        if ( isHole( s ) ) continue;
        const z = seg * SEG_LEN + SEG_LEN / 2;
        out.push( { id: String( seg ), kind: 'pickup', x: openCenterX( s ), y: 0, z } );
    }
    return out;
}

export function isHole( seg: Segment ): boolean {
    return seg.floors.length === 0;
}

function wallsOnSlice( seg: Segment, f: FloorSpan, zc: number ): Array< [ number, number ] > {
    const walls: Array< [ number, number ] > = [];
    for ( const b of seg.blocks ) {
        if ( ! b.lethal ) continue;
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

export function passableCorridorWidth( seg: Segment ): number {
    if ( seg.floors.length === 0 ) return 0;
    let worst = Number.POSITIVE_INFINITY;
    for ( let r = 0; r < ZCELLS; r++ ) {
        const zc = seg.z0 + r * CELL + CELL / 2;
        worst = Math.min( worst, maxOpenAtSlice( seg, zc ) );
    }
    return worst === Number.POSITIVE_INFINITY ? 0 : worst;
}
