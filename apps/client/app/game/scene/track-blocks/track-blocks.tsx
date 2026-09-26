import { useFrame } from '@react-three/fiber';
import { SEG_LEN } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { LocalPlayer, Sim } from '../../ecs/traits';
import { useTrack } from '../../track-context/use-track';
import { endFrame, type ShipProbe } from '../block-breaks';
import { BlockBurst } from '../block-burst/block-burst';
import { BlockDebris } from '../block-debris/block-debris';
import { blotchWearUniforms, updateBlotchWear } from '../deck-breakup';
import { applyDeckFinish, deckTextureSpan } from '../deck-finish';
import { fracturedBlockGeometry } from '../fractured-block-geometry';
import { fracturedBlockUniforms, patchFracturedBlock } from '../fractured-block-shader';
import { SEALED_BLOCK_UNIT_BEVEL, SEALED_BLOCK_UNIT_DIMS, sealedBlockGeometry } from '../sealed-block-geometry';
import { patchSealedBlock, sealedBlockUniforms } from '../sealed-block-shader';
import { SEALED_BLOCK_MAX_SEAMS } from '../sealed-block-variation';
import { AHEAD, BACK } from '../track-instancing';
import { graphiteSurface } from '../track-materials';
import { patchWallBreakup } from '../wall-breakup';
import { BLOCK_LIMIT, FRACTURED_LIMIT } from './track-blocks.constants';
import { emitSegment, fracturedAttributes } from './track-blocks.utils';

export interface SealedVariation {
    seams: number[];
    count: number;
    wear: number;
}

export interface SealedAttributes {
    seams: THREE.InstancedBufferAttribute;
    variation: THREE.InstancedBufferAttribute;
}

export interface FracturedAttributes {
    block: THREE.InstancedBufferAttribute;
    glow: THREE.InstancedBufferAttribute;
}

export interface Emit {
    sealed: THREE.InstancedMesh;
    fractured: THREE.InstancedMesh;
    attrs: SealedAttributes;
    cracked: FracturedAttributes;
    si: number;
    fi: number;
    ship: ShipProbe | undefined;
    preGlow: number;
    preReach: number;
}

export function TrackBlocks() {
    const track = useTrack();
    const world = useWorld();
    const blockRef = useRef< THREE.InstancedMesh | null >( null );
    const fracturedRef = useRef< THREE.InstancedMesh | null >( null );
    const emitRef = useRef< Emit | null >( null );
    const rebuild = useRebuildToken();
    const surface = useMemo( graphiteSurface, [ rebuild ] );

    const uniforms = useMemo( () => sealedBlockUniforms(), [] );
    const fractureUniforms = useMemo( () => fracturedBlockUniforms(), [] );
    const breakup = useMemo( blotchWearUniforms, [] );
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
    const cells = useMemo( fracturedBlockGeometry, [] );
    const fractured = useMemo( () => fracturedAttributes( cells ), [ cells ] );
    const attachBlocks = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            blockRef.current = mesh;
            return () => {
                blockRef.current = null;
                geometry.dispose();
            };
        },
        [ geometry ],
    );
    const attachFractured = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            fracturedRef.current = mesh;
            return () => {
                fracturedRef.current = null;
                fractured.geometry.dispose();
                cells.dispose();
            };
        },
        [ fractured, cells ],
    );

    useFrame( () => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const blocks = blockRef.current;
        const cracked = fracturedRef.current;
        if ( ! sim || ! blocks || ! cracked ) return;

        updateBlotchWear( breakup );
        uniforms.uSealedSeamIntensity.value = num( 'Block.seamEmissive' );
        uniforms.uSealedWearMax.value = num( 'Block.wear' );
        const span = deckTextureSpan( surface.map );
        uniforms.uSealedTexSpan.value = span;
        fractureUniforms.uFractureTexSpan.value = span;
        fractureUniforms.uFractureGap.value = num( 'Fracture.gap' );
        fractureUniforms.uFractureIntensity.value = num( 'Fracture.glow' );
        fractureUniforms.uFractureCoreDepth.value = num( 'Fracture.coreDepth' );

        applyDeckFinish( blocks.material as THREE.MeshStandardMaterial );
        applyDeckFinish( cracked.material as THREE.MeshStandardMaterial );

        const i0 = Math.max( 0, Math.floor( ( sim.z - BACK ) / SEG_LEN ) );
        const i1 = Math.floor( ( sim.z + AHEAD ) / SEG_LEN );

        emitRef.current ??= {
            sealed: blocks,
            fractured: cracked,
            attrs,
            cracked: fractured.cracked,
            si: 0,
            fi: 0,
            ship: undefined,
            preGlow: 0,
            preReach: 1,
        };
        const e = emitRef.current;
        e.sealed = blocks;
        e.fractured = cracked;
        e.si = 0;
        e.fi = 0;
        e.ship = sim;
        e.preGlow = num( 'Fracture.preGlow' );
        e.preReach = num( 'Fracture.preReach' );
        for ( let i = i0; i <= i1; i++ ) emitSegment( e, track.segmentAt( i ) );
        endFrame();
        blocks.count = e.si;
        cracked.count = e.fi;
        blocks.instanceMatrix.needsUpdate = true;
        cracked.instanceMatrix.needsUpdate = true;
        attrs.seams.needsUpdate = true;
        attrs.variation.needsUpdate = true;
        fractured.cracked.block.needsUpdate = true;
        fractured.cracked.glow.needsUpdate = true;
    } );

    return (
        <Fragment>
            <instancedMesh
                ref={ attachBlocks }
                geometry={ geometry }
                count={ 0 }
                frustumCulled={ false }
                args={ [ undefined, undefined, BLOCK_LIMIT ] }
            >
                <meshStandardMaterial
                    { ...surface }
                    ref={ ( m ) => {
                        if ( ! m ) return;
                        patchSealedBlock( m, uniforms );
                        patchWallBreakup( m, breakup );
                    } }
                />
            </instancedMesh>
            <instancedMesh
                ref={ attachFractured }
                geometry={ fractured.geometry }
                count={ 0 }
                frustumCulled={ false }
                args={ [ undefined, undefined, FRACTURED_LIMIT ] }
            >
                <meshStandardMaterial
                    { ...surface }
                    ref={ ( m ) => {
                        if ( ! m ) return;
                        patchFracturedBlock( m, fractureUniforms, false );
                        patchWallBreakup( m, breakup );
                    } }
                />
            </instancedMesh>
            <BlockDebris uniforms={ fractureUniforms } />
            <BlockBurst />
        </Fragment>
    );
}
