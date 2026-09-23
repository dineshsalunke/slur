import {
    BLOCK_DEPTH_BIAS_PEAK,
    BLOCK_DEPTH_BIAS_REST,
    BLOCK_DEPTH_MAX,
    BLOCK_DEPTH_MIN,
    BLOCK_SPLIT_GAP_MAX,
    BLOCK_SPLIT_GAP_MIN,
    BLOCK_WIDTH_BIAS_PEAK,
    BLOCK_WIDTH_BIAS_REST,
    BLOCK_WIDTH_MAX,
    BLOCK_WIDTH_MIN,
} from '../constants.js';
import { hash2, mulberry32 } from './rng.js';

const SALT_DEPTH = 0x3d9a7f11 | 0;

export function blockDepthFor( u: number, intensity: number, maxDepth: number ): number {
    const bias = BLOCK_DEPTH_BIAS_REST + ( BLOCK_DEPTH_BIAS_PEAK - BLOCK_DEPTH_BIAS_REST ) * intensity;
    const t = ( u < 0 ? 0 : u > 1 ? 1 : u ) ** bias;
    const depth = BLOCK_DEPTH_MIN + ( BLOCK_DEPTH_MAX - BLOCK_DEPTH_MIN ) * t;
    return Math.min( depth, maxDepth );
}

export function blockZSpan(
    seed: number,
    i: number,
    key: number,
    segZ0: number,
    segLen: number,
    intensity: number,
): [ number, number ] {
    const r = mulberry32( hash2( ( seed ^ SALT_DEPTH ) | 0, Math.imul( i, 0x2545f491 ) + key ) );
    const depth = blockDepthFor( r(), intensity, segLen );
    const z0 = segZ0 + r() * ( segLen - depth );
    return [ z0, z0 + depth ];
}

export function carveRun( seed: number, i: number, key: number, runWidth: number, intensity: number ): number[][] {
    const r = mulberry32( hash2( ( seed ^ SALT_DEPTH ) | 0, Math.imul( i, 0x85ebca6b ) + key ) );
    const bias = BLOCK_WIDTH_BIAS_REST + ( BLOCK_WIDTH_BIAS_PEAK - BLOCK_WIDTH_BIAS_REST ) * intensity;
    const out: number[][] = [];
    let x = r() * Math.min( BLOCK_SPLIT_GAP_MAX, Math.max( 0, runWidth - BLOCK_WIDTH_MIN ) );
    while ( runWidth - x >= BLOCK_WIDTH_MIN ) {
        const top = Math.min( BLOCK_WIDTH_MAX, runWidth - x );
        const w = BLOCK_WIDTH_MIN + ( top - BLOCK_WIDTH_MIN ) * r() ** bias;
        out.push( [ x, x + w ] );
        x += w + BLOCK_SPLIT_GAP_MIN + r() * ( BLOCK_SPLIT_GAP_MAX - BLOCK_SPLIT_GAP_MIN );
    }
    if ( out.length === 0 ) out.push( [ 0, runWidth ] );
    return out;
}
