import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';

const VOID = new THREE.Color( 0, 0, 0 );

export function SceneFog() {
    const fog = useMemo( () => new THREE.Fog( VOID, num( 'Fog.near' ), num( 'Fog.far' ) ), [] );

    useFrame( () => {
        fog.near = num( 'Fog.near' );
        fog.far = num( 'Fog.far' );
    } );

    return <primitive object={ fog } attach="fog" />;
}
