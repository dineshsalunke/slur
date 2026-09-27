import { useFrame } from '@react-three/fiber';
import type { TugEvent } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useCallback, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { drainTugs } from '../tug-events';
import { INSTANCES_PER_TETHER, MAX } from './tug-line.constants';
import { placeTether, type RopeView, readView, spawnTether, tetherDone } from './tug-line.utils';

export interface Tether {
    ownerId: string;
    targetId: string;
    dir: number;
    x: number;
    y: number;
    z: number;
    age: number;
    throwS: number;
    reelAt: number;
    pulled: boolean;
}

export function TugLine() {
    const world = useWorld();
    const meshRef = useRef< THREE.InstancedMesh | null >( null );
    const tethers = useMemo< Tether[] >( () => [], [] );
    const view = useMemo< RopeView >( () => ( { cam: new THREE.Vector3(), pxPerUnit: 1 } ), [] );
    const onTug = useMemo( () => ( e: TugEvent ) => spawnTether( tethers, e ), [ tethers ] );

    const setMesh = useCallback( ( mesh: THREE.InstancedMesh | null ) => {
        meshRef.current = mesh;
        if ( mesh ) mesh.count = 0;
    }, [] );

    useFrame( ( state, delta ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        drainTugs( onTug );
        readView( state, view );
        let n = 0;
        for ( const t of tethers ) {
            t.age += delta;
            if ( ! tetherDone( t ) ) n += placeTether( world, mesh, n, t, view );
        }
        while ( tethers.length > 0 && tetherDone( tethers[ 0 ] ) ) tethers.shift();
        mesh.count = n;
        mesh.instanceMatrix.needsUpdate = true;
        if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
    } );

    return (
        <instancedMesh
            ref={ setMesh }
            frustumCulled={ false }
            renderOrder={ 2 }
            args={ [ undefined, undefined, MAX * INSTANCES_PER_TETHER ] }
        >
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } />
        </instancedMesh>
    );
}
