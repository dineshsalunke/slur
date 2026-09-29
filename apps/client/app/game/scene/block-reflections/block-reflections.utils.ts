import type { Block, Segment } from '@slur/shared';
import type * as THREE from 'three';
import { blockWorld } from '../../block-state';
import { SEALED_BLOCK_BEVEL } from '../sealed-block-geometry';
import { SEALED_BLOCK_MAX_SEAMS } from '../sealed-block-variation';
import { SEAM_CLEAR_REACH, SEAM_CONTACT, SEAM_LOW } from './block-reflections.constants';
import { _foot } from './block-reflections.scratch';

export interface SeamFoot {
    x: number;
    z: number;
    nx: number;
    nz: number;
}

function place( out: SeamFoot, x: number, z: number, nx: number, nz: number ): SeamFoot {
    out.x = x;
    out.z = z;
    out.nx = nx;
    out.nz = nz;
    return out;
}

export function seamFoot( b: Block, u: number, out: SeamFoot ): SeamFoot {
    const sx = b.x1 - b.x0;
    const sz = b.z1 - b.z0;
    const cx = ( b.x0 + b.x1 ) / 2;
    const cz = ( b.z0 + b.z1 ) / 2;
    const a = Math.max( 0.5 * sx - SEALED_BLOCK_BEVEL, 1e-3 );
    const d = Math.max( 0.5 * sz - SEALED_BLOCK_BEVEL, 1e-3 );
    const perimeter = 4 * ( a + d );
    const t = ( ( u % perimeter ) + perimeter ) % perimeter;
    if ( t < 2 * d ) return place( out, cx + 0.5 * sx, cz + t - d, 1, 0 );
    if ( t < 2 * d + 2 * a ) return place( out, cx + a - ( t - 2 * d ), cz + 0.5 * sz, 0, 1 );
    if ( t < 4 * d + 2 * a ) return place( out, cx - 0.5 * sx, cz + d - ( t - 2 * d - 2 * a ), -1, 0 );
    return place( out, cx + t - 4 * d - 3 * a, cz - 0.5 * sz, 0, -1 );
}

function aheadX( o: Block, foot: SeamFoot ): number {
    if ( foot.z < o.z0 - SEAM_CONTACT || foot.z > o.z1 + SEAM_CONTACT ) return SEAM_CLEAR_REACH;
    const near = foot.nx > 0 ? o.x0 - foot.x : foot.x - o.x1;
    const far = foot.nx > 0 ? o.x1 - foot.x : foot.x - o.x0;
    return far <= SEAM_CONTACT ? SEAM_CLEAR_REACH : Math.max( near, 0 );
}

function aheadZ( o: Block, foot: SeamFoot ): number {
    if ( foot.x < o.x0 - SEAM_CONTACT || foot.x > o.x1 + SEAM_CONTACT ) return SEAM_CLEAR_REACH;
    const near = foot.nz > 0 ? o.z0 - foot.z : foot.z - o.z1;
    const far = foot.nz > 0 ? o.z1 - foot.z : foot.z - o.z0;
    return far <= SEAM_CONTACT ? SEAM_CLEAR_REACH : Math.max( near, 0 );
}

function freeIn( b: Block, foot: SeamFoot, blocks: readonly Block[], free: number ): number {
    for ( const o of blocks ) {
        if ( o === b || blockWorld.broken.has( o.id ) ) continue;
        if ( o.y0 > b.y0 + SEAM_LOW || o.y1 <= b.y0 ) continue;
        free = Math.min( free, foot.nx !== 0 ? aheadX( o, foot ) : aheadZ( o, foot ) );
    }
    return free;
}

export function seamFree(
    b: Block,
    foot: SeamFoot,
    prev: Segment | undefined,
    seg: Segment,
    next: Segment | undefined,
): number {
    let free = freeIn( b, foot, seg.blocks, SEAM_CLEAR_REACH );
    if ( prev ) free = freeIn( b, foot, prev.blocks, free );
    if ( next ) free = freeIn( b, foot, next.blocks, free );
    return free;
}

export function writeSeamClear(
    clear: THREE.InstancedBufferAttribute,
    i: number,
    b: Block,
    seams: readonly number[],
    prev: Segment | undefined,
    seg: Segment,
    next: Segment | undefined,
): void {
    const out = clear.array as Float32Array;
    for ( let s = 0; s < SEALED_BLOCK_MAX_SEAMS; s++ ) {
        out[ i * SEALED_BLOCK_MAX_SEAMS + s ] =
            s < seams.length ? seamFree( b, seamFoot( b, seams[ s ], _foot ), prev, seg, next ) : 0;
    }
}
