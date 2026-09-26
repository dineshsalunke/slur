import type { Block, Segment } from '@slur/shared';
import * as THREE from 'three';
import { blockWorld } from '../../block-state';
import { boltCloseness, noteBroken, noteStanding } from '../block-breaks';
import { fractureOrient, shareCells } from '../fractured-block-geometry';
import type { BlockDims } from '../sealed-block-geometry';
import {
    SEALED_BLOCK_MAX_SEAMS,
    sealedBlockSeamCount,
    sealedBlockSeams,
    sealedBlockSeed,
    sealedBlockWearSeed,
} from '../sealed-block-variation';
import { put } from '../track-instancing';
import type { Emit, FracturedAttributes, SealedAttributes, SealedVariation } from './track-blocks';
import { _m, BLOCK_LIMIT, FRACTURED_LIMIT } from './track-blocks.constants';
import { variations } from './track-blocks.state';

export function variationFor( x: number, z: number, dims: BlockDims ): SealedVariation {
    const seed = sealedBlockSeed( x, z );
    const key =
        seed ^
        Math.imul( Math.round( dims.w * 16 ), 0x9e37_79b1 ) ^
        Math.imul( Math.round( dims.d * 16 ), 0x85eb_ca6b );
    const cached = variations.get( key );
    if ( cached ) return cached;

    const count = sealedBlockSeamCount( seed );
    const made = {
        seams: sealedBlockSeams( seed, count, dims ),
        count,
        wear: sealedBlockWearSeed( seed ),
    };
    variations.set( key, made );
    return made;
}

export function writeVariation( attrs: SealedAttributes, i: number, x: number, z: number, dims: BlockDims ): void {
    const v = variationFor( x, z, dims );
    const seams = attrs.seams.array as Float32Array;
    for ( let s = 0; s < SEALED_BLOCK_MAX_SEAMS; s++ ) seams[ i * SEALED_BLOCK_MAX_SEAMS + s ] = v.seams[ s ] ?? 0;
    const variation = attrs.variation.array as Float32Array;
    variation[ i * 2 ] = v.count;
    variation[ i * 2 + 1 ] = v.wear;
}

export function emitSealed( e: Emit, b: Block ): void {
    const h = Math.max( 0.05, b.y1 - b.y0 );
    const dims = { w: b.x1 - b.x0, h, d: b.z1 - b.z0 };
    const cx = ( b.x0 + b.x1 ) / 2;
    const cz = ( b.z0 + b.z1 ) / 2;
    const next = put( e.sealed, e.si, BLOCK_LIMIT, cx, b.y0 + h / 2, cz, dims.w, h, dims.d );
    if ( next === e.si ) return;
    writeVariation( e.attrs, e.si, cx, cz, dims );
    e.si = next;
}

export function emitFractured( e: Emit, b: Block ): void {
    noteStanding( b );
    if ( e.fi >= FRACTURED_LIMIT ) return;
    const c = boltCloseness( b, e.preReach );
    _m.makeTranslation( ( b.x0 + b.x1 ) / 2, ( b.y0 + b.y1 ) / 2, ( b.z0 + b.z1 ) / 2 );
    e.fractured.setMatrixAt( e.fi, _m );
    e.cracked.block.setXYZW( e.fi, b.x1 - b.x0, Math.max( 0.05, b.y1 - b.y0 ), b.z1 - b.z0, fractureOrient( b.id ) );
    e.cracked.glow.setX( e.fi, 1 + e.preGlow * c * c );
    e.fi++;
}

export function emitSegment( e: Emit, seg: Segment ): void {
    for ( const b of seg.blocks ) {
        const fractured = b.kind === 'fractured';
        if ( blockWorld.broken.has( b.id ) ) {
            if ( fractured ) noteBroken( b, e.ship );
        } else if ( fractured ) emitFractured( e, b );
        else emitSealed( e, b );
    }
}

export function fracturedAttributes( cells: THREE.BufferGeometry ): {
    geometry: THREE.BufferGeometry;
    cracked: FracturedAttributes;
} {
    const geometry = shareCells( cells );
    const block = new THREE.InstancedBufferAttribute( new Float32Array( FRACTURED_LIMIT * 4 ), 4 );
    const glow = new THREE.InstancedBufferAttribute( new Float32Array( FRACTURED_LIMIT ).fill( 1 ), 1 );
    geometry.setAttribute( 'aBlock', block );
    geometry.setAttribute( 'aFractureGlow', glow );
    return { geometry, cracked: { block, glow } };
}
