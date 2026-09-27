import { type Block, SEG_LEN, type Segment, type Track } from '@slur/shared';
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
import { AHEAD, BACK, put } from '../track-instancing';
import type { BlockCapacity, Emit, FracturedAttributes, SealedAttributes, SealedVariation } from './track-blocks';
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
    const next = put( e.sealed, e.si, e.capacity.sealed, cx, b.y0 + h / 2, cz, dims.w, h, dims.d );
    if ( next === e.si ) return;
    writeVariation( e.attrs, e.si, cx, cz, dims );
    e.si = next;
}

export function emitFractured( e: Emit, b: Block ): void {
    noteStanding( b );
    if ( e.fi >= e.capacity.fractured ) return;
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

export function emitWindow( e: Emit, track: Track, z: number ): void {
    const i0 = Math.max( 0, Math.floor( ( z - BACK ) / SEG_LEN ) );
    const i1 = Math.floor( ( z + AHEAD ) / SEG_LEN );
    const here = Math.max( i0, Math.floor( z / SEG_LEN ) );
    for ( let i = here; i <= i1; i++ ) emitSegment( e, track.segmentAt( i ) );
    for ( let i = i0; i < here; i++ ) emitSegment( e, track.segmentAt( i ) );
}

export function blockCapacity( track: Track ): BlockCapacity {
    const last = Math.floor( ( track.finishZ + AHEAD ) / SEG_LEN );
    const span = Math.ceil( ( BACK + AHEAD ) / SEG_LEN ) + 1;
    const sealed = new Int32Array( last + 1 );
    const fractured = new Int32Array( last + 1 );
    for ( let i = 0; i <= last; i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            if ( b.kind === 'fractured' ) fractured[ i ]++;
            else sealed[ i ]++;
        }
    }
    return {
        sealed: Math.max( BLOCK_LIMIT, worstWindow( sealed, span ) ),
        fractured: Math.max( FRACTURED_LIMIT, worstWindow( fractured, span ) ),
    };
}

function worstWindow( counts: Int32Array, span: number ): number {
    let sum = 0;
    let worst = 0;
    for ( let i = 0; i < counts.length; i++ ) {
        sum += counts[ i ];
        if ( i >= span ) sum -= counts[ i - span ];
        worst = Math.max( worst, sum );
    }
    return worst;
}

export function sealedAttributes( capacity: number ): SealedAttributes {
    return {
        seams: new THREE.InstancedBufferAttribute(
            new Float32Array( capacity * SEALED_BLOCK_MAX_SEAMS ),
            SEALED_BLOCK_MAX_SEAMS,
        ),
        variation: new THREE.InstancedBufferAttribute( new Float32Array( capacity * 2 ), 2 ),
    };
}

export function fracturedAttributes(
    cells: THREE.BufferGeometry,
    capacity: number,
): {
    geometry: THREE.BufferGeometry;
    cracked: FracturedAttributes;
} {
    const geometry = shareCells( cells );
    const block = new THREE.InstancedBufferAttribute( new Float32Array( capacity * 4 ), 4 );
    const glow = new THREE.InstancedBufferAttribute( new Float32Array( capacity ).fill( 1 ), 1 );
    geometry.setAttribute( 'aBlock', block );
    geometry.setAttribute( 'aFractureGlow', glow );
    return { geometry, cracked: { block, glow } };
}
