import { useFrame } from '@react-three/fiber';
import { mulberry32 } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import type { WallConfig } from './env-config';

const MARGIN = 20;

interface Slab {
    z: number;
    side: number;
    h: number;
}

export function TubeWalls( { config, seed = 9999 }: { config: WallConfig; seed?: number } ) {
    const world = useWorld();
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const rng = useMemo( () => mulberry32( seed ), [ seed ] );
    const span = useMemo( () => Math.ceil( config.count / 2 ) * config.spacing, [ config.count, config.spacing ] );
    const slabs = useMemo< Slab[] >(
        () =>
            Array.from( { length: config.count }, ( _, i ) => ( {
                z: Math.floor( i / 2 ) * config.spacing,
                side: i % 2 ? 1 : -1,
                h: config.minHeight + rng() * ( config.maxHeight - config.minHeight ),
            } ) ),
        [ config.count, config.spacing, config.minHeight, config.maxHeight, rng ],
    );
    const m = useMemo( () => new THREE.Object3D(), [] );

    useFrame( () => {
        const e = world.queryFirst( LocalPlayer, Sim );
        const sim = e?.get( Sim );
        const mesh = ref.current;
        if ( ! sim || ! mesh ) return;
        const z = sim.z;
        for ( let i = 0; i < slabs.length; i++ ) {
            const s = slabs[ i ];
            if ( z - s.z > MARGIN ) {
                s.z += span;
                s.h = config.minHeight + rng() * ( config.maxHeight - config.minHeight );
            }
            m.position.set( s.side * config.distance, config.yBase + s.h / 2, s.z );
            m.scale.set( config.thickness, s.h, config.thickness );
            m.updateMatrix();
            mesh.setMatrixAt( i, m.matrix );
        }
        mesh.instanceMatrix.needsUpdate = true;
    } );

    return (
        <instancedMesh
            key={ config.count }
            ref={ ref }
            frustumCulled={ false }
            args={ [ undefined, undefined, config.count ] }
        >
            <boxGeometry />
            <meshStandardMaterial color="#000000" emissive={ config.color } emissiveIntensity={ config.intensity } />
        </instancedMesh>
    );
}
