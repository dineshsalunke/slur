import { useFrame } from '@react-three/fiber';
import type { Anchor } from '@slur/shared';
import { useCallback, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { PICKUP_HOVER } from '../combat-look';
import { streakMaterial, streakQuads } from '../deck-reflection/deck-reflection';
import { reflection } from '../deck-reflection/deck-reflection.state';
import { PICKUP_EMITTER } from './pickup-reflections.constants';
import { placePickupEmitters, syncPickupEmitters } from './pickup-reflections.utils';

export function PickupReflections( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const geometry = useMemo( () => streakQuads( 1 ), [] );
    const material = useMemo(
        () => streakMaterial( reflection, PICKUP_EMITTER, { uPickupHover: { value: PICKUP_HOVER } } ),
        [],
    );
    const attach = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            meshRef.current = mesh;
            if ( ! mesh ) return;
            placePickupEmitters( mesh.instanceMatrix.array as Float32Array, layout );
            mesh.instanceMatrix.needsUpdate = true;
            return () => {
                meshRef.current = null;
                geometry.dispose();
                material.dispose();
            };
        },
        [ geometry, material, layout ],
    );

    useFrame( () => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const gain = num( 'Reflect.pickup' );
        material.uniforms.uReflGain.value = gain;
        mesh.visible = gain > 0 && layout.length > 0;
        if ( ! mesh.visible ) return;
        if ( syncPickupEmitters( mesh.instanceMatrix.array as Float32Array, layout, isTaken ) ) {
            mesh.instanceMatrix.needsUpdate = true;
        }
    } );

    return (
        <instancedMesh
            ref={ attach }
            args={ [ geometry, material, Math.max( layout.length, 1 ) ] }
            count={ layout.length }
            frustumCulled={ false }
        />
    );
}
