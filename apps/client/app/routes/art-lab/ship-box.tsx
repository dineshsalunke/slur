import { useFrame } from '@react-three/fiber';
import { tuningForShip } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { LocalPlayer, Net, Render } from '../../game/ecs/traits';

const HEIGHT = 3;

// Unlit and dark so it cannot skew the bloom, and sized from halfW/halfL so edge contact reads true.
export function ShipBox() {
    const world = useWorld();
    const ref = useRef< Mesh >( null );

    useFrame( () => {
        const e = world.queryFirst( LocalPlayer, Render );
        const g = e?.get( Render );
        if ( ! e || ! g || ! ref.current ) return;
        const { halfW, halfL } = tuningForShip( e.get( Net )?.shipId ?? '' );
        ref.current.position.set( g.position.x, g.position.y + HEIGHT / 2, g.position.z );
        ref.current.scale.set( 2 * halfW, HEIGHT, 2 * halfL );
    } );

    return (
        <mesh ref={ ref }>
            <boxGeometry args={ [ 1, 1, 1 ] } />
            <meshBasicMaterial color="#404040" />
        </mesh>
    );
}
