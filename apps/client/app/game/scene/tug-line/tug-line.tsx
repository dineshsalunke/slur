import { useFrame } from '@react-three/fiber';
import type { TugEvent } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { drainTugs } from '../tug-events';
import { MAX } from './tug-line.constants';
import { placeTether, spawnTether, tetherDone } from './tug-line.utils';

export interface Tether {
    ownerId: string;
    targetId: string;
    x: number;
    y: number;
    z: number;
    age: number;
}

export function TugLine() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const tethers = useMemo< Tether[] >( () => [], [] );
    const onTug = useMemo( () => ( e: TugEvent ) => spawnTether( tethers, e ), [ tethers ] );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

    useFrame( ( _state, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        drainTugs( onTug );
        let n = 0;
        for ( const t of tethers ) {
            t.age += delta;
            if ( ! tetherDone( t ) && placeTether( world, mesh, n, t ) ) n++;
        }
        while ( tethers.length > 0 && tetherDone( tethers[ 0 ] ) ) tethers.shift();
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
        if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
    } );

    return (
        <instancedMesh ref={ setMesh } frustumCulled={ false } renderOrder={ 2 } args={ [ undefined, undefined, MAX ] }>
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } />
        </instancedMesh>
    );
}
