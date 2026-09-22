import { type BlockDims, sealedBlockBevel } from './sealed-block-geometry';

export const SEALED_BLOCK_MAX_SEAMS = 4;

export const SEALED_BLOCK_SEAM_WIDTH = 0.14;

export interface SealedBlockWear {
    scale: number;
    coverage: number;
    contrast: number;
    grain: number;
    strength: number;
}

export const SEALED_BLOCK_WEAR: SealedBlockWear = {
    scale: 2.4,
    coverage: 0.45,
    contrast: 0.55,
    grain: 9,
    strength: 0,
};

export const SEALED_BLOCK_WEAR_COLOR = '#2c3138';
export const SEALED_BLOCK_WEAR_ROUGHNESS = 0.3;

export function sealedBlockInset( dims: BlockDims ): [ number, number ] {
    const c = sealedBlockBevel( dims );
    return [ dims.w / 2 - c, dims.d / 2 - c ];
}

export function sealedBlockPerimeter( dims: BlockDims ): number {
    const [ a, b ] = sealedBlockInset( dims );
    return 4 * ( a + b );
}

function hash01( seed: number, salt: number ): number {
    let h = Math.imul( seed ^ Math.imul( salt, 0x9e37_79b1 ), 0x85eb_ca6b );
    h ^= h >>> 13;
    h = Math.imul( h, 0xc2b2_ae35 );
    return ( ( h ^ ( h >>> 16 ) ) >>> 0 ) / 0x1_0000_0000;
}

export function sealedBlockSeed( x: number, z: number ): number {
    const gx = Math.imul( Math.round( x * 16 ) + 1, 0x27d4_eb2d );
    const gz = Math.imul( Math.round( z * 16 ) + 7, 0x1656_67b1 );
    return ( gx ^ gz ) | 0;
}

export function sealedBlockSeamCount( seed: number ): number {
    return 1 + Math.floor( hash01( seed, 0x5eed ) * 3 );
}

const SEALED_BLOCK_CLEAN_SHARE = 0.4;

export function sealedBlockWearSeed( seed: number ): number {
    const h = hash01( seed, 0xea7 );
    return Math.max( 0, ( h - SEALED_BLOCK_CLEAN_SHARE ) / ( 1 - SEALED_BLOCK_CLEAN_SHARE ) );
}

const SEALED_BLOCK_CORNER_KEEPOUT = SEALED_BLOCK_SEAM_WIDTH * 2;

function offCorner( u: number, corners: number[] ): number {
    for ( const c of corners ) {
        const d = u - c;
        if ( Math.abs( d ) < SEALED_BLOCK_CORNER_KEEPOUT ) {
            return c + ( d < 0 ? -SEALED_BLOCK_CORNER_KEEPOUT : SEALED_BLOCK_CORNER_KEEPOUT );
        }
    }
    return u;
}

export function sealedBlockSeams( seed: number, count: number, dims: BlockDims ): number[] {
    const [ a, b ] = sealedBlockInset( dims );
    const perimeter = 4 * ( a + b );
    const corners = [ 0, 2 * b, 2 * b + 2 * a, 4 * b + 2 * a, perimeter ];
    const n = Math.max( 0, Math.min( Math.floor( count ), SEALED_BLOCK_MAX_SEAMS ) );
    return Array.from( { length: n }, ( _, i ) =>
        offCorner( ( ( i + 0.15 + 0.7 * hash01( seed, i ) ) / n ) * perimeter, corners ),
    );
}
