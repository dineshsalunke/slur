import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { NEBULA_LIGHT } from './nebula-baker';

export function SceneEnvironment() {
    useFrame( ( state ) => {
        state.scene.environment = NEBULA_LIGHT.environment;
        state.scene.environmentIntensity = num( 'Environment.intensity' );
        state.scene.environmentRotation.y = THREE.MathUtils.degToRad( num( 'Environment.rotation' ) );
    } );

    return null;
}
