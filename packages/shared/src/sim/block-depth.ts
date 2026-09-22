import { BLOCK_DEPTH_WEIGHTS_MAX, BLOCK_DEPTH_WEIGHTS_START, BLOCK_DEPTHS } from '../constants.js';
import { hash2, mulberry32 } from './rng.js';

const SALT_DEPTH = 0x3d9a7f11 | 0;

function weightAt( k: number, intensity: number ): number {
    const a = BLOCK_DEPTH_WEIGHTS_START[ k ];
    const b = BLOCK_DEPTH_WEIGHTS_MAX[ k ];
    return a + ( b - a ) * intensity;
}

export function blockDepthFor( u: number, intensity: number, maxDepth: number ): number {
    let acc = 0;
    let total = 0;
    for ( let k = 0; k < BLOCK_DEPTHS.length; k++ ) total += weightAt( k, intensity );
    for ( let k = 0; k < BLOCK_DEPTHS.length; k++ ) {
        acc += weightAt( k, intensity ) / total;
        if ( u < acc ) return Math.min( BLOCK_DEPTHS[ k ], maxDepth );
    }
    return Math.min( BLOCK_DEPTHS[ BLOCK_DEPTHS.length - 1 ], maxDepth );
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
