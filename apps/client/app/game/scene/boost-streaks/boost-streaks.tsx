import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Net, Render } from '../../ecs/traits';
import { boostStreakGeometry } from '../boost-look';
import { buildBoostStreakMaterial } from '../boost-streak-material';
import { AFTER_RENDER_SYNC, MAX_STREAKS, PER_SHIP } from './boost-streaks.constants';
import { writeShip } from './boost-streaks.utils';

export function BoostStreaks() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );

    const geometry = useMemo( boostStreakGeometry, [] );
    const material = useMemo( buildBoostStreakMaterial, [] );
    const levels = useMemo( () => new THREE.InstancedBufferAttribute( new Float32Array( MAX_STREAKS ), 1 ), [] );

    // Effect justified: brackets a GPU resource's lifetime — geometry and material are `new`ed outside React's tree.
    useEffect( () => {
        geometry.setAttribute( 'aLevel', levels );
        return () => {
            geometry.dispose();
            material.dispose();
        };
    }, [ geometry, material, levels ] );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

    useFrame( () => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const array = levels.array as Float32Array;
        let i = 0;
        for ( const entity of world.query( Render, Net ) ) {
            if ( i + PER_SHIP > MAX_STREAKS ) break;
            i += writeShip( mesh, array, i, entity );
        }
        mesh.count = i;
        mesh.instanceMatrix.needsUpdate = true;
        levels.needsUpdate = true;
    }, AFTER_RENDER_SYNC );

    return (
        <instancedMesh
            ref={ setMesh }
            frustumCulled={ false }
            args={ [ undefined, undefined, MAX_STREAKS ] }
            renderOrder={ 2 }
        >
            <primitive object={ geometry } attach="geometry" />
            <primitive object={ material } attach="material" />
        </instancedMesh>
    );
}
