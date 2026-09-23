import { useFrame } from '@react-three/fiber';
import { type Block, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { blockWorld } from '../block-state';
import { LocalPlayer, Sim } from '../ecs/traits';
import { forgetMended, fractureYaw, noteBreak } from './block-breaks';
import { BlockDebris } from './block-debris';
import { applyBlockMetal } from './block-metal';
import { fracturedBlockGeometry } from './fractured-block-geometry';
import { fracturedBlockUniforms, patchFracturedBlock } from './fractured-block-shader';
import {
    type BlockDims,
    SEALED_BLOCK_BEVEL,
    SEALED_BLOCK_UNIT_BEVEL,
    SEALED_BLOCK_UNIT_DIMS,
    sealedBlockGeometry,
} from './sealed-block-geometry';
import { SEALED_BLOCK_SURFACE } from './sealed-block-material';
import { patchSealedBlock, sealedBlockUniforms } from './sealed-block-shader';
import { useSealedBlockMaps } from './sealed-block-texture';
import {
    SEALED_BLOCK_MAX_SEAMS,
    SEALED_BLOCK_SEAM_WIDTH,
    sealedBlockSeamCount,
    sealedBlockSeams,
    sealedBlockSeed,
    sealedBlockWearSeed,
} from './sealed-block-variation';
import { AHEAD, BACK, put } from './track-instancing';

const BLOCK_LIMIT = 320;
const FRACTURED_LIMIT = 160;

interface SealedVariation {
    seams: number[];
    count: number;
    wear: number;
}

const variations = new Map< number, SealedVariation >();

function variationFor( x: number, z: number, dims: BlockDims ): SealedVariation {
    const seed = sealedBlockSeed( x, z );
    const key = seed ^ Math.imul( Math.round( dims.w * 16 ), 0x9e37_79b1 );
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

interface SealedAttributes {
    seams: THREE.InstancedBufferAttribute;
    variation: THREE.InstancedBufferAttribute;
}

interface Emit {
    sealed: THREE.InstancedMesh;
    fractured: THREE.InstancedMesh;
    attrs: SealedAttributes;
    si: number;
    fi: number;
    fromZ: number;
}

const _m = new THREE.Object3D();

function writeVariation( attrs: SealedAttributes, i: number, x: number, z: number, dims: BlockDims ): void {
    const v = variationFor( x, z, dims );
    const seams = attrs.seams.array as Float32Array;
    for ( let s = 0; s < SEALED_BLOCK_MAX_SEAMS; s++ ) seams[ i * SEALED_BLOCK_MAX_SEAMS + s ] = v.seams[ s ] ?? 0;
    const variation = attrs.variation.array as Float32Array;
    variation[ i * 2 ] = v.count;
    variation[ i * 2 + 1 ] = v.wear;
}

function emitSealed( e: Emit, b: Block ): void {
    const h = Math.max( 0.05, b.y1 - b.y0 );
    const dims = { w: b.x1 - b.x0, h, d: b.z1 - b.z0 };
    const cx = ( b.x0 + b.x1 ) / 2;
    const cz = ( b.z0 + b.z1 ) / 2;
    const next = put( e.sealed, e.si, BLOCK_LIMIT, cx, b.y0 + h / 2, cz, dims.w, h, dims.d );
    if ( next === e.si ) return;
    writeVariation( e.attrs, e.si, cx, cz, dims );
    e.si = next;
}

function emitFractured( e: Emit, b: Block ): void {
    if ( e.fi >= FRACTURED_LIMIT ) return;
    _m.position.set( ( b.x0 + b.x1 ) / 2, ( b.y0 + b.y1 ) / 2, ( b.z0 + b.z1 ) / 2 );
    _m.rotation.set( 0, fractureYaw( b.id ), 0 );
    _m.scale.set( b.x1 - b.x0, Math.max( 0.05, b.y1 - b.y0 ), b.z1 - b.z0 );
    _m.updateMatrix();
    e.fractured.setMatrixAt( e.fi, _m.matrix );
    e.fi++;
}

function emitSegment( e: Emit, seg: Segment ): void {
    for ( const b of seg.blocks ) {
        const fractured = b.kind === 'fractured';
        if ( blockWorld.broken.has( b.id ) ) {
            if ( fractured ) noteBreak( b, e.fromZ );
        } else if ( fractured ) emitFractured( e, b );
        else emitSealed( e, b );
    }
}

function fracturedGeometry(): THREE.BufferGeometry {
    const g = fracturedBlockGeometry();
    const glow = new Float32Array( FRACTURED_LIMIT ).fill( 1 );
    g.setAttribute( 'aFractureGlow', new THREE.InstancedBufferAttribute( glow, 1 ) );
    return g;
}

export function TrackBlocks( { track }: { track: Track } ) {
    const world = useWorld();
    const blockRef = useRef< THREE.InstancedMesh | null >( null );
    const fracturedRef = useRef< THREE.InstancedMesh | null >( null );
    const emitRef = useRef< Emit | null >( null );
    const maps = useSealedBlockMaps();

    const uniforms = useMemo( () => sealedBlockUniforms(), [] );
    const fractureUniforms = useMemo( () => fracturedBlockUniforms(), [] );
    const attrs = useMemo< SealedAttributes >(
        () => ( {
            seams: new THREE.InstancedBufferAttribute(
                new Float32Array( BLOCK_LIMIT * SEALED_BLOCK_MAX_SEAMS ),
                SEALED_BLOCK_MAX_SEAMS,
            ),
            variation: new THREE.InstancedBufferAttribute( new Float32Array( BLOCK_LIMIT * 2 ), 2 ),
        } ),
        [],
    );
    const geometry = useMemo( () => {
        const g = sealedBlockGeometry( SEALED_BLOCK_UNIT_DIMS, SEALED_BLOCK_UNIT_BEVEL );
        g.setAttribute( 'aSealedSeams', attrs.seams );
        g.setAttribute( 'aSealedVariation', attrs.variation );
        return g;
    }, [ attrs ] );
    const fractured = useMemo( fracturedGeometry, [] );

    useFrame( () => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const blocks = blockRef.current;
        const cracked = fracturedRef.current;
        if ( ! sim || ! blocks || ! cracked ) return;

        uniforms.uSealedBevel.value = SEALED_BLOCK_BEVEL;
        uniforms.uSealedSeamWidth.value = SEALED_BLOCK_SEAM_WIDTH;
        uniforms.uSealedSeamIntensity.value = num( 'Block.seamEmissive' );
        uniforms.uSealedWearMax.value = num( 'Block.wear' );
        uniforms.uSealedTexSpan.value = num( 'Block.textureSpan' );
        fractureUniforms.uFractureTexSpan.value = num( 'Block.textureSpan' );

        applyBlockMetal( blocks.material as THREE.MeshStandardMaterial );
        applyBlockMetal( cracked.material as THREE.MeshStandardMaterial );

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        emitRef.current ??= { sealed: blocks, fractured: cracked, attrs, si: 0, fi: 0, fromZ: 0 };
        const e = emitRef.current;
        e.sealed = blocks;
        e.fractured = cracked;
        e.si = 0;
        e.fi = 0;
        e.fromZ = sim.z;
        for ( let i = i0; i <= i1; i++ ) emitSegment( e, track.segmentAt( i ) );
        forgetMended();
        blocks.count = e.si;
        cracked.count = e.fi;
        blocks.instanceMatrix.needsUpdate = true;
        cracked.instanceMatrix.needsUpdate = true;
        attrs.seams.needsUpdate = true;
        attrs.variation.needsUpdate = true;
    } );

    return (
        <Fragment>
            <instancedMesh
                ref={ blockRef }
                geometry={ geometry }
                count={ 0 }
                frustumCulled={ false }
                args={ [ undefined, undefined, BLOCK_LIMIT ] }
            >
                <meshStandardMaterial
                    { ...SEALED_BLOCK_SURFACE }
                    { ...maps }
                    ref={ ( m ) => m && patchSealedBlock( m, uniforms ) }
                />
            </instancedMesh>
            <instancedMesh
                ref={ fracturedRef }
                geometry={ fractured }
                count={ 0 }
                frustumCulled={ false }
                args={ [ undefined, undefined, FRACTURED_LIMIT ] }
            >
                <meshStandardMaterial
                    { ...SEALED_BLOCK_SURFACE }
                    { ...maps }
                    ref={ ( m ) => m && patchFracturedBlock( m, fractureUniforms ) }
                />
            </instancedMesh>
            <BlockDebris uniforms={ fractureUniforms } />
        </Fragment>
    );
}
