import { useFrame } from '@react-three/fiber';
import { type ReactNode, useRef } from 'react';
import type * as THREE from 'three';

export function SkyFollow( { children }: { children: ReactNode } ) {
    const ref = useRef< THREE.Group | null >( null );
    useFrame( ( state ) => {
        const g = ref.current;
        if ( g ) g.position.copy( state.camera.position );
    } );
    return <group ref={ ref }>{ children }</group>;
}
