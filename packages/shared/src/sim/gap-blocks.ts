import { BLOCK_WIDTH_MIN, GAP_BLOCK_ATTEMPTS, GAP_BLOCK_RATE_MAX, GAP_BLOCK_RATE_START } from '../constants.js';
import { blockDepthFor, carveRun } from './block-depth.js';
import { passableCorridorWidth } from './clearance.js';
import { placeBlock } from './fracture.js';
import { hash2, mulberry32 } from './rng.js';
import {
    BLOCK_HEIGHT,
    type Block,
    type FloorSpan,
    isFullSpan,
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
    const parts = carveRun( seed ^ SALT_GAP_BLOCK, i, attempt, deck.x1 - deck.x0, intensity );
    const part = parts[ Math.min( parts.length - 1, Math.floor( r() * parts.length ) ) ];
    if ( part[ 1 ] - part[ 0 ] < BLOCK_WIDTH_MIN - 1e-6 ) return null;
    const half = SEG_LEN / 2;
    const depth = blockDepthFor( r(), intensity, half );
    const bz0 = z0 + half + r() * ( half - depth );
    return placeBlock( seed, i, 0, intensity, {
        x0: deck.x0 + part[ 0 ],
        x1: deck.x0 + part[ 1 ],
        y0: 0,
        y1: BLOCK_HEIGHT,
        z0: bz0,
        z1: bz0 + depth,
    } );
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
