import { useFrame } from '@react-three/fiber';
import { type RefObject, useCallback, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { streakMaterial, streakQuads } from '../deck-reflection/deck-reflection';
import { reflection } from '../deck-reflection/deck-reflection.state';
import { SEALED_BLOCK_BEVEL } from '../sealed-block-geometry';
import { SEALED_BLOCK_MAX_SEAMS } from '../sealed-block-variation';
import type { SealedAttributes } from '../track-blocks/track-blocks';
import { BLOCK_EMITTER } from './block-reflections.constants';

export function BlockReflections( {
    source,
    attrs,
}: {
    source: RefObject< THREE.InstancedMesh | null >;
    attrs: SealedAttributes;
} ) {
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const geometry = useMemo( () => {
        const g = streakQuads( SEALED_BLOCK_MAX_SEAMS );
        g.setAttribute( 'aSealedSeams', attrs.seams );
        g.setAttribute( 'aSealedVariation', attrs.variation );
        return g;
    }, [ attrs ] );
    const material = useMemo(
        () => streakMaterial( reflection, BLOCK_EMITTER, { uBevel: { value: SEALED_BLOCK_BEVEL } } ),
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
        const gain = num( 'Reflect.block' ) * num( 'Block.seamEmissive' );
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
