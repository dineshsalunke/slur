import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';

export function SceneFog() {
    const fog = useMemo( () => new THREE.Fog( col( 'Fog.color' ), num( 'Fog.near' ), num( 'Fog.far' ) ), [] );
    const applied = useRef( col( 'Fog.color' ) );

    useFrame( () => {
        fog.near = num( 'Fog.near' );
        fog.far = num( 'Fog.far' );

        const next = col( 'Fog.color' );
        if ( next !== applied.current ) {
            fog.color.set( next );
            applied.current = next;
        }
    } );

    return <primitive object={ fog } attach="fog" />;
}
