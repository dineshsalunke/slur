import { BLOCK_MAX_LANES, CELL, GAP_BLOCK_ATTEMPTS, GAP_BLOCK_RATE_MAX, GAP_BLOCK_RATE_START } from '../constants.js';
import { blockDepthFor } from './block-depth.js';
import { passableCorridorWidth } from './clearance.js';
import { hash2, mulberry32 } from './rng.js';
import {
    BLOCK_HEIGHT,
    type Block,
    type FloorSpan,
    HALF_WIDTH,
    isFullSpan,
    laneOf,
    lerp,
    MIN_LANE,
    SEG_LEN,
    type Segment,
    type TrackDensity,
} from './space.js';

const SALT_GAP_BLOCK = 0x5c2e91b7 | 0;

function gapBlockRate( intensity: number ): number {
    return lerp( GAP_BLOCK_RATE_START, GAP_BLOCK_RATE_MAX, intensity );
}

function gapBlockCandidate(
    seed: number,
    i: number,
    attempt: number,
    floors: FloorSpan[],
    z0: number,
    intensity: number,
): Block | null {
    const decks = floors.filter( isFullSpan );
    if ( decks.length === 0 ) return null;
    const r = mulberry32( hash2( ( seed ^ SALT_GAP_BLOCK ) | 0, i * ( GAP_BLOCK_ATTEMPTS + 1 ) + attempt + 1 ) );
    const deck = decks[ Math.min( decks.length - 1, Math.floor( r() * decks.length ) ) ];
    const lo = laneOf( deck.x0 );
    const hi = laneOf( deck.x1 );
    const lanes = 1 + Math.floor( r() * BLOCK_MAX_LANES );
    if ( hi - lo < lanes ) return null;
    const start = lo + Math.floor( r() * ( hi - lo - lanes + 1 ) );
    const half = SEG_LEN / 2;
    const depth = blockDepthFor( r(), intensity, half );
    const bz0 = z0 + half + r() * ( half - depth );
    return {
        x0: -HALF_WIDTH + start * CELL,
        x1: -HALF_WIDTH + ( start + lanes ) * CELL,
        y0: 0,
        y1: BLOCK_HEIGHT,
        z0: bz0,
        z1: bz0 + depth,
    };
}

export function gapBlocks(
    seed: number,
    i: number,
    intensity: number,
    floors: FloorSpan[],
    z0: number,
    z1: number,
    density: TrackDensity,
): Block[] {
    const roll = mulberry32( hash2( ( seed ^ SALT_GAP_BLOCK ) | 0, i ) )();
    if ( roll >= gapBlockRate( intensity ) * density.blocks ) return [];
    const trial: Segment = { index: i, z0, z1, kind: 'gap', floors, blocks: [], isFinish: false };
    for ( let a = 0; a < GAP_BLOCK_ATTEMPTS; a++ ) {
        const b = gapBlockCandidate( seed, i, a, floors, z0, intensity );
        if ( b === null ) continue;
        trial.blocks = [ b ];
        if ( passableCorridorWidth( trial ) >= MIN_LANE - 1e-6 ) return [ b ];
    }
    return [];
}
