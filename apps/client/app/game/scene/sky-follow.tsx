import { useFrame } from '@react-three/fiber';
import { type ReactNode, useRef } from 'react';
import type * as THREE from 'three';

// A group that rides the camera each frame, so its children stay centred on the viewer and the sky never
// runs out as the ship travels. Position only, not rotation, so the sky still swings as the ship turns.
export function SkyFollow( { children }: { children: ReactNode } ) {
    const ref = useRef< THREE.Group | null >( null );
    useFrame( ( state ) => {
        const g = ref.current;
        if ( g ) g.position.copy( state.camera.position );
    } );
    return <group ref={ ref }>{ children }</group>;
}
