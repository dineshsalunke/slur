import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { LocalPlayer, Render } from '../../game/ecs/traits';

const SIZE = 3;

// Unlit and dark so it cannot contaminate the bloom or lighting sweeps it exists to make judgeable.
export function ShipBox() {
    const world = useWorld();
    const ref = useRef< Mesh >( null );

    useFrame( () => {
        const g = world.queryFirst( LocalPlayer, Render )?.get( Render );
        if ( ! g || ! ref.current ) return;
        ref.current.position.set( g.position.x, g.position.y + SIZE / 2, g.position.z );
    } );

    return (
        <mesh ref={ ref }>
            <boxGeometry args={ [ SIZE, SIZE, SIZE ] } />
            <meshBasicMaterial color="#404040" />
        </mesh>
    );
}
