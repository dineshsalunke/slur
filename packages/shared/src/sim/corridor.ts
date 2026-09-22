import {
    DEFAULT_TUNING,
    OPEN_BAND_PEAK,
    OPEN_BAND_START,
    PINCH_FUNNEL_SEGS,
    PINCH_INTENSITY_MIN,
    PINCH_LANES,
    PINCH_RATE_MAX,
    PINCH_SEGS_MAX,
    PINCH_SEGS_MIN,
    pinchLeadSegments,
} from '../constants.js';
import { gapOpens } from './gaps.js';
import { intensityAt, spacingSegments } from './intensity.js';
import { hash2, mulberry32 } from './rng.js';
import { clamp, LANES, lerp, SEG_LEN, START_SAFE, type TrackDensity, ZCELLS } from './space.js';
import { rowGlobal, weaveRaw } from './weave.js';

const SALT_PINCH = 0x3d9f2a61 | 0;

export interface Band {
    lo: number;
    hi: number;
    pinched: boolean;
}

export function openBandLanes( intensity: number ): number {
    return Math.round( clamp( lerp( OPEN_BAND_START, OPEN_BAND_PEAK, intensity ), OPEN_BAND_PEAK, LANES ) );
}

function pinchLead(): number {
    return pinchLeadSegments( SEG_LEN, DEFAULT_TUNING.maxCruise );
}

function weaveBand( seed: number, i: number, lanes: number ): Band {
    const slots = LANES - lanes;
    const lo = clamp( Math.round( weaveRaw( seed, rowGlobal( i, Math.floor( ZCELLS / 2 ) ) ) * slots ), 0, slots );
    return { lo, hi: lo + lanes - 1, pinched: false };
}

function pinchRate( intensity: number ): number {
    if ( intensity < PINCH_INTENSITY_MIN ) return 0;
    return lerp( 0, PINCH_RATE_MAX, ( intensity - PINCH_INTENSITY_MIN ) / ( 1 - PINCH_INTENSITY_MIN ) );
}

function pinchSegs( seed: number, i: number ): number {
    const r = mulberry32( hash2( ( seed ^ SALT_PINCH ) | 0, i * 2 + 1 ) )();
    return PINCH_SEGS_MIN + Math.floor( r * ( PINCH_SEGS_MAX - PINCH_SEGS_MIN + 1 ) );
}

function pinchRolled( seed: number, i: number, length: number, density: TrackDensity ): boolean {
    if ( i < START_SAFE + PINCH_FUNNEL_SEGS || i >= length ) return false;
    return (
        mulberry32( hash2( ( seed ^ SALT_PINCH ) | 0, i ) )() < pinchRate( intensityAt( i, length ) ) * density.blocks
    );
}

function pinchStartAt( seed: number, i: number, length: number, density: TrackDensity ): boolean {
    if ( ! pinchRolled( seed, i, length, density ) ) return false;
    const lead = Math.max( spacingSegments( intensityAt( i, length ) ), pinchLead(), 2 * PINCH_FUNNEL_SEGS + 1 );
    for ( let p = 1; p <= lead + PINCH_SEGS_MAX; p++ ) {
        if ( gapOpens( seed, i - p, length, density ) ) return false;
        if ( ! pinchRolled( seed, i - p, length, density ) ) continue;
        if ( i - p + pinchSegs( seed, i - p ) + lead >= i ) return false;
    }
    return true;
}

function pinchCovering( seed: number, i: number, length: number, density: TrackDensity ): number | null {
    for ( let s = i - PINCH_SEGS_MAX + 1; s <= i; s++ ) {
        if ( pinchStartAt( seed, s, length, density ) && s + pinchSegs( seed, s ) > i ) return s;
    }
    return null;
}

function pinchHole( seed: number, start: number, length: number ): number {
    const host = weaveBand( seed, start, openBandLanes( intensityAt( start, length ) ) );
    return host.lo + Math.floor( ( host.hi - host.lo + 1 - PINCH_LANES ) / 2 );
}

function nearestPinch(
    seed: number,
    i: number,
    length: number,
    density: TrackDensity,
): { hole: number; t: number } | null {
    let best: { hole: number; t: number } | null = null;
    for ( let d = 1; d <= PINCH_FUNNEL_SEGS; d++ ) {
        const t = ( PINCH_FUNNEL_SEGS - d + 1 ) / ( PINCH_FUNNEL_SEGS + 1 );
        if ( pinchStartAt( seed, i + d, length, density ) ) {
            const cand = { hole: pinchHole( seed, i + d, length ), t };
            if ( best === null || cand.t > best.t ) best = cand;
        }
        const behind = pinchCovering( seed, i - d, length, density );
        if ( behind !== null ) {
            const cand = { hole: pinchHole( seed, behind, length ), t };
            if ( best === null || cand.t > best.t ) best = cand;
        }
    }
    return best;
}

export function bandAt( seed: number, i: number, length: number, density: TrackDensity ): Band {
    const start = pinchCovering( seed, i, length, density );
    if ( start !== null ) {
        const lo = pinchHole( seed, start, length );
        return { lo, hi: lo + PINCH_LANES - 1, pinched: true };
    }
    const open = weaveBand( seed, i, openBandLanes( intensityAt( i, length ) ) );
    const near = nearestPinch( seed, i, length, density );
    if ( near === null ) return open;
    const lanes = Math.round( lerp( open.hi - open.lo + 1, PINCH_LANES, near.t ) );
    const centre = lerp( ( open.lo + open.hi ) / 2, near.hole + ( PINCH_LANES - 1 ) / 2, near.t );
    const lo = clamp( Math.round( centre - ( lanes - 1 ) / 2 ), 0, LANES - lanes );
    return { lo, hi: lo + lanes - 1, pinched: false };
}
