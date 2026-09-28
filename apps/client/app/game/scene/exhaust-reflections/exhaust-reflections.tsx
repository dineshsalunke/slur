import { useFrame } from '@react-three/fiber';
import { type RefObject, useCallback, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { streakMaterial, streakQuads } from '../deck-reflection/deck-reflection';
import { reflection } from '../deck-reflection/deck-reflection.state';
import { EXHAUST_EMITTER, EXHAUST_REFLECTION_REACH } from './exhaust-reflections.constants';

export function ExhaustReflections( {
    source,
    drive,
    deckY,
}: {
    source: RefObject< THREE.InstancedMesh | null >;
    drive: THREE.InstancedBufferAttribute;
    deckY: THREE.InstancedBufferAttribute;
} ) {
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const geometry = useMemo( () => {
        const g = streakQuads( 1 );
        g.setAttribute( 'aDrive', drive );
        g.setAttribute( 'aDeckY', deckY );
        return g;
    }, [ drive, deckY ] );
    const material = useMemo(
        () => streakMaterial( reflection, EXHAUST_EMITTER, { uExhaustReach: { value: EXHAUST_REFLECTION_REACH } } ),
        [],
    );
    const attach = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            meshRef.current = mesh;
            if ( ! mesh ) return;
            mesh.onBeforeRender = () => {
                const src = source.current;
                mesh.count = src ? src.count : 0;
                if ( src ) mesh.instanceMatrix = src.instanceMatrix;
            };
            return () => {
                meshRef.current = null;
                geometry.dispose();
                material.dispose();
            };
        },
        [ geometry, material, source ],
    );

    useFrame( () => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const gain = num( 'Reflect.exhaust' );
        material.uniforms.uReflGain.value = gain;
        mesh.visible = gain > 0;
    } );

    return (
        <instancedMesh
            ref={ attach }
            args={ [ geometry, material, 1 ] }
            count={ 0 }
            frustumCulled={ false }
            dispose={ null }
        />
    );
}
