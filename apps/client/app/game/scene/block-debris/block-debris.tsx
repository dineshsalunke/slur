import { useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { blockWorld } from '../../block-state';
import { useTrack } from '../../track-context/use-track';
import { type BreakEvent, drainBreaks, drainMends } from '../block-breaks';
import { trackGround } from '../debris-ground';
import type { DebrisBody } from '../debris-physics';
import { blotchWearUniforms, updateBlotchWear } from '../deck-breakup';
import { applyDeckFinish } from '../deck-finish';
import type { FractureCell } from '../fractured-block-geometry';
import { type FracturedBlockUniforms, patchFracturedBlock } from '../fractured-block-shader';
import { graphiteSurface } from '../track-materials';
import { patchWallBreakup } from '../wall-breakup';
import { SLOTS } from './block-debris.constants';
import { advance, buildDebris, mend, spawn } from './block-debris.utils';

export interface Slot {
    id: number;
    born: number;
    parked: boolean;
    bodies: DebrisBody[];
}

export interface Debris {
    cells: FractureCell[];
    hulls: THREE.Vector3[][];
    volumes: number[];
    geometries: THREE.BufferGeometry[];
    block: THREE.InstancedBufferAttribute;
    glow: THREE.InstancedBufferAttribute;
    slots: Slot[];
    cursor: number;
    dirty: boolean;
    now: number;
}

export function BlockDebris( { uniforms }: { uniforms: FracturedBlockUniforms } ) {
    const track = useTrack();
    const rebuild = useRebuildToken();
    const debris = useMemo( buildDebris, [] );
    const ground = useMemo( () => trackGround( track, blockWorld.broken ), [ track ] );
    const meshes = useRef< ( THREE.InstancedMesh | null )[] >( [] );
    const breakup = useMemo( blotchWearUniforms, [] );
    const onMend = useMemo( () => ( id: number ) => mend( debris, id ), [ debris ] );
    const onBreak = useMemo( () => ( e: BreakEvent ) => spawn( debris, e, debris.now ), [ debris ] );
    const material = useMemo( () => {
        const m = new THREE.MeshStandardMaterial( graphiteSurface() );
        patchFracturedBlock( m, uniforms, true );
        patchWallBreakup( m, breakup );
        return m;
    }, [ rebuild, uniforms, breakup ] );

    const release = useCallback(
        ( group: THREE.Group | null ) => () => {
            if ( ! group ) return;
            for ( const g of debris.geometries ) g.dispose();
            material.dispose();
        },
        [ debris, material ],
    );

    useFrame( ( state, delta ) => {
        const now = state.clock.elapsedTime;
        applyDeckFinish( material );
        updateBlotchWear( breakup );
        debris.now = now;
        drainMends( onMend );
        drainBreaks( onBreak );
        const live = advance( debris, meshes.current, ground, now, delta, state.camera.position.z );
        if ( ! debris.dirty ) return;
        debris.dirty = false;
        for ( const mesh of meshes.current ) {
            if ( ! mesh ) continue;
            mesh.count = live ? SLOTS : 0;
            mesh.instanceMatrix.needsUpdate = true;
        }
    } );

    return (
        <group ref={ release }>
            { debris.geometries.map( ( geometry, c ) => (
                <instancedMesh
                    key={ geometry.uuid }
                    ref={ ( m ) => {
                        meshes.current[ c ] = m;
                    } }
                    args={ [ geometry, material, SLOTS ] }
                    count={ 0 }
                    frustumCulled={ false }
                />
            ) ) }
        </group>
    );
}
