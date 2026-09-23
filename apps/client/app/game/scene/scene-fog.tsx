import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { NEBULA_HORIZON } from './nebula-baker';

export function SceneFog() {
    const fog = useMemo( () => new THREE.Fog( NEBULA_HORIZON, num( 'Fog.near' ), num( 'Fog.far' ) ), [] );

    useFrame( () => {
        fog.near = num( 'Fog.near' );
        fog.far = num( 'Fog.far' );
        fog.color.copy( NEBULA_HORIZON );
    } );

    return <primitive object={ fog } attach="fog" />;
}
