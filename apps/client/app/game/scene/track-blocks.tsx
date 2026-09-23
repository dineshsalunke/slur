import { useFrame } from '@react-three/fiber';
import { SEG_LEN, type Segment, type Track } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { blockWorld } from '../block-state';
import { LocalPlayer, Sim } from '../ecs/traits';
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

function writeVariation( attrs: SealedAttributes, i: number, x: number, z: number, dims: BlockDims ): void {
    const v = variationFor( x, z, dims );
    const seams = attrs.seams.array as Float32Array;
    for ( let s = 0; s < SEALED_BLOCK_MAX_SEAMS; s++ ) seams[ i * SEALED_BLOCK_MAX_SEAMS + s ] = v.seams[ s ] ?? 0;
    const variation = attrs.variation.array as Float32Array;
    variation[ i * 2 ] = v.count;
    variation[ i * 2 + 1 ] = v.wear;
}

function emitSealed( mesh: THREE.InstancedMesh, attrs: SealedAttributes, bi: number, seg: Segment ): number {
    for ( const b of seg.blocks ) {
        if ( blockWorld.broken.has( b.id ) ) continue;
        const h = Math.max( 0.05, b.y1 - b.y0 );
        const dims = { w: b.x1 - b.x0, h, d: b.z1 - b.z0 };
        const cx = ( b.x0 + b.x1 ) / 2;
        const cz = ( b.z0 + b.z1 ) / 2;
        const next = put( mesh, bi, BLOCK_LIMIT, cx, b.y0 + h / 2, cz, dims.w, h, dims.d );
        if ( next === bi ) break;
        writeVariation( attrs, bi, cx, cz, dims );
        bi = next;
    }
    return bi;
}

export function TrackBlocks( { track }: { track: Track } ) {
    const world = useWorld();
    const blockRef = useRef< THREE.InstancedMesh | null >( null );
    const maps = useSealedBlockMaps();

    const uniforms = useMemo( () => sealedBlockUniforms(), [] );
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

    useFrame( () => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const blocks = blockRef.current;
        if ( ! sim || ! blocks ) return;

        uniforms.uSealedBevel.value = SEALED_BLOCK_BEVEL;
        uniforms.uSealedSeamWidth.value = SEALED_BLOCK_SEAM_WIDTH;
        uniforms.uSealedSeamIntensity.value = num( 'Block.seamEmissive' );
        uniforms.uSealedWearMax.value = num( 'Block.wear' );
        uniforms.uSealedTexSpan.value = num( 'Block.textureSpan' );

        const material = blocks.material as THREE.MeshStandardMaterial;
        const normalScale = num( 'Block.normalScale' );
        material.color.set( col( 'Metal.mapTint' ) );
        material.metalness = num( 'Block.metalness' );
        material.roughness = num( 'Block.roughness' );
        material.envMapIntensity = num( 'Block.envMapIntensity' );
        material.normalScale.set( normalScale, normalScale );

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        let bi = 0;
        for ( let i = i0; i <= i1; i++ ) bi = emitSealed( blocks, attrs, bi, track.segmentAt( i ) );
        blocks.count = bi;
        blocks.instanceMatrix.needsUpdate = true;
        attrs.seams.needsUpdate = true;
        attrs.variation.needsUpdate = true;
    } );

    return (
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
    );
}
