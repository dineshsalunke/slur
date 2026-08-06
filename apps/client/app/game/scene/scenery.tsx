import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';

const SPAN = 400;
const MARGIN = 30;

// Seeded PRNG (mulberry32) → deterministic recycling, so this survives becoming shared/networked.
function mulberry32( seed: number ): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = ( a + 0x6d2b79f5 ) | 0;
        let t = Math.imul( a ^ ( a >>> 15 ), 1 | a );
        t = ( t + Math.imul( t ^ ( t >>> 7 ), 61 | t ) ) ^ t;
        return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
    };
}

interface Box {
    z: number;
    side: number;
    off: number;
    h: number;
}

// Recycled instanced side-boxes — the primary parallax speed cue. PURE IMPERATIVE: a local useFrame
// mutating the InstancedMesh matrices, zero subscriptions, zero re-renders during play.
export function Scenery( { count = 50 }: { count?: number } ) {
    const world = useWorld();
    const ref = useRef< THREE.InstancedMesh | null >( null );
    const rng = useMemo( () => mulberry32( 1234 ), [] );
    const boxes = useMemo< Box[] >(
        () =>
            Array.from( { length: count }, ( _, i ) => ( {
                z: ( i / count ) * SPAN,
                side: i % 2 ? 1 : -1,
                off: 14 + rng() * 10,
                h: 2 + rng() * 20,
            } ) ),
        [ count, rng ],
    );
    const m = useMemo( () => new THREE.Object3D(), [] );

    useFrame( () => {
        const e = world.queryFirst( LocalPlayer, Sim );
        const sim = e?.get( Sim );
        const mesh = ref.current;
        if ( ! sim || ! mesh ) return;
        const z = sim.z;
        for ( let i = 0; i < boxes.length; i++ ) {
            const b = boxes[ i ];
            if ( z - b.z > MARGIN ) {
                b.z += SPAN; // recycle ahead of the ship (seeded, deterministic)
                b.off = 14 + rng() * 10;
                b.h = 2 + rng() * 20;
            }
            m.position.set( b.side * b.off, b.h / 2, b.z );
            m.scale.set( 2, b.h, 2 );
            m.updateMatrix();
            mesh.setMatrixAt( i, m.matrix );
        }
        mesh.instanceMatrix.needsUpdate = true;
    } );

    return (
        <instancedMesh ref={ ref } args={ [ undefined, undefined, count ] }>
            <boxGeometry />
            <meshStandardMaterial emissive="#ff2bd6" emissiveIntensity={ 2 } toneMapped={ false } />
        </instancedMesh>
    );
}
