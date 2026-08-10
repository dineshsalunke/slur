import { useFrame } from '@react-three/fiber';
import { type ReactNode, useRef } from 'react';
import type * as THREE from 'three';

// A group that rides the camera each frame, so its children (the gradient dome + the drei star field) stay
// centred on the viewer — an "infinite" sky that never runs out as the ship travels down the ribbon.
// Leaf-local, imperative useFrame: copies the camera position, zero re-renders. Distant sky elements only,
// so copying position (not rotation) is enough — parallax comes from their radius, not from tracking angle.
export function SkyFollow( { children }: { children: ReactNode } ) {
    const ref = useRef< THREE.Group | null >( null );
    useFrame( ( state ) => {
        const g = ref.current;
        if ( g ) g.position.copy( state.camera.position );
    } );
    return <group ref={ ref }>{ children }</group>;
}
