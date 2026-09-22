import {
    CELL,
    CRACK_EDGE_MARGIN_LANES,
    CRACK_FRAC,
    CRACK_SEGS_MAX,
    CRACK_SEGS_MIN,
    CRACK_W_LANES_MAX,
    CRACK_W_LANES_MIN,
    FULL_GAP_FRAC,
} from '../constants.js';
import { type LaneRange, rimTeeth } from './gap-teeth.js';
import { corridorWidthLanes, gapProb, intensityAt, spacingSegments } from './intensity.js';
import { hash2, mulberry32 } from './rng.js';
import {
    clamp,
    type FloorSpan,
    HALF_WIDTH,
    LANES,
    laneOf,
    lerp,
    SEG_LEN,
    START_SAFE,
    type TrackDensity,
    ZCELLS,
} from './space.js';
import { rowGlobal, weaveRaw } from './weave.js';

const SALT_GAP = 0x2f6a1b9d | 0;
const SALT_CRACK = 0x7b19c3a5 | 0;

export interface Crack {
    segs: number;
    lo: number;
    w: number;
}

function rolledGap( seed: number, i: number, length: number, density: TrackDensity ): boolean {
    if ( i < START_SAFE || i >= length ) return false;
    return mulberry32( hash2( seed, i ) )() < gapProb( intensityAt( i, length ) ) * density.gaps;
}

export function gapOpens( seed: number, i: number, length: number, density: TrackDensity ): boolean {
    if ( ! rolledGap( seed, i, length, density ) ) return false;
    const back = spacingSegments( intensityAt( i, length ) );
    for ( let p = 1; p <= back + CRACK_SEGS_MAX; p++ ) {
        if ( ! rolledGap( seed, i - p, length, density ) ) continue;
        const c = crackAt( seed, i - p );
        const ends = i - p + ( c === null ? 1 : c.segs );
        if ( ends + back > i ) return false;
    }
    return true;
}

export function crackAt( seed: number, i: number ): Crack | null {
    const r = mulberry32( hash2( ( seed ^ SALT_CRACK ) | 0, i ) );
    if ( r() >= CRACK_FRAC ) return null;
    const w = CRACK_W_LANES_MIN + Math.floor( r() * ( CRACK_W_LANES_MAX - CRACK_W_LANES_MIN + 1 ) );
    const span = CRACK_W_LANES_MAX - CRACK_W_LANES_MIN;
    const segs = Math.round( lerp( CRACK_SEGS_MAX, CRACK_SEGS_MIN, span > 0 ? ( w - CRACK_W_LANES_MIN ) / span : 0 ) );
    const slots = LANES - 2 * CRACK_EDGE_MARGIN_LANES - w;
    const lo = CRACK_EDGE_MARGIN_LANES + Math.floor( r() * ( slots + 1 ) );
    return { segs, lo, w };
}

function crackStartAt( seed: number, s: number, length: number, density: TrackDensity ): Crack | null {
    return gapOpens( seed, s, length, density ) ? crackAt( seed, s ) : null;
}

export function crackCovering( seed: number, i: number, length: number, density: TrackDensity ): Crack | null {
    for ( let s = i - CRACK_SEGS_MAX + 1; s <= i; s++ ) {
        const c = crackStartAt( seed, s, length, density );
        if ( c && s + c.segs > i ) return c;
    }
    return null;
}

export function crackFloors( c: Crack ): FloorSpan[] {
    const x0 = -HALF_WIDTH + c.lo * CELL;
    const x1 = x0 + c.w * CELL;
    return [
        { x0: -HALF_WIDTH, x1: x0, y: 0 },
        { x0: x1, x1: HALF_WIDTH, y: 0 },
    ];
}

function holeLanes( floors: FloorSpan[] ): LaneRange[] {
    const out: LaneRange[] = [];
    let cursor = 0;
    for ( const f of floors ) {
        const lo = laneOf( f.x0 );
        if ( lo > cursor ) out.push( { lo: cursor, hi: lo - 1 } );
        cursor = Math.max( cursor, laneOf( f.x1 ) );
    }
    if ( cursor < LANES ) out.push( { lo: cursor, hi: LANES - 1 } );
    return out;
}

function toothSpans( seed: number, i: number, floors: FloorSpan[], z0: number ): FloorSpan[] {
    const z1 = z0 + SEG_LEN;
    return rimTeeth( seed, i, holeLanes( floors ), ZCELLS ).map( ( t ) => ( {
        x0: -HALF_WIDTH + t.lo * CELL,
        x1: -HALF_WIDTH + ( t.hi + 1 ) * CELL,
        y: 0,
        z0: t.front ? z0 : z1 - t.rows * CELL,
        z1: t.front ? z0 + t.rows * CELL : z1,
    } ) );
}

export function gapFloors( seed: number, i: number, length: number, z0: number ): FloorSpan[] {
    const full = mulberry32( hash2( ( seed ^ SALT_GAP ) | 0, i ) )() < FULL_GAP_FRAC;
    if ( full ) return toothSpans( seed, i, [], z0 );
    const wLanes = corridorWidthLanes( intensityAt( i, length ) );
    const openStart = clamp(
        Math.round( weaveRaw( seed, rowGlobal( i, Math.floor( ZCELLS / 2 ) ) ) * ( LANES - wLanes ) ),
        0,
        LANES - wLanes,
    );
    const x0 = -HALF_WIDTH + openStart * CELL;
    const deck: FloorSpan[] = [ { x0, x1: x0 + wLanes * CELL, y: 0 } ];
    return [ ...deck, ...toothSpans( seed, i, deck, z0 ) ];
}
