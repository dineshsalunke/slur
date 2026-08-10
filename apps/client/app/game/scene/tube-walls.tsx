import { useFrame } from '@react-three/fiber';
import { mulberry32 } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import type { WallConfig } from './env-config';

// How far behind the ship a slab may fall before it recycles ahead. The chase cam sits ~13u back, so 20u
// keeps recycling off-screen.
const MARGIN = 20;

interface Slab {
    z: number;
    side: number; // -1 | +1
    h: number;
}

// Parallax neon "canyon walls" FAR to each side of the open ribbon — enclosure feel WITHOUT touching
// gameplay (config.distance is always > HALF_WIDTH 32, non-collidable, purely visual). Same technique as
// scenery.tsx: seeded instanced slabs recycled ahead of the local ship in a leaf-local useFrame — zero
// subscriptions, zero re-renders during play. Integration-ready: reads the same LocalPlayer+Sim the real
// scene owns, so it drops into net-canvas/game-canvas unchanged.
export function TubeWalls( { config, seed = 9999 }: { config: WallConfig; seed?: number } ) {
    const world = useWorld();
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const rng = useMemo( () => mulberry32( seed ), [ seed ] ); // networked: seed off the room's procgen descriptor → same walls every client
    const span = useMemo( () => Math.ceil( config.count / 2 ) * config.spacing, [ config.count, config.spacing ] );
    const slabs = useMemo< Slab[] >(
        () =>
            Array.from( { length: config.count }, ( _, i ) => ( {
                z: Math.floor( i / 2 ) * config.spacing, // two per z-step (one each side)
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
                s.z += span; // recycle ahead of the ship (seeded, deterministic)
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
        // key on count so a variant switch (different buffer size) cleanly remounts the instanced buffer.
        <instancedMesh
            key={ config.count }
            ref={ ref }
            frustumCulled={ false }
            args={ [ undefined, undefined, config.count ] }
        >
            <boxGeometry />
            { /* black base + HDR emissive = pure neon slab that the single global Bloom catches. */ }
            <meshStandardMaterial
                color="#000000"
                emissive={ config.color }
                emissiveIntensity={ config.intensity }
                toneMapped={ false }
            />
        </instancedMesh>
    );
}
