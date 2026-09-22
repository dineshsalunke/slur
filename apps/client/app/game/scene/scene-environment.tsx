import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEnvMode } from '../../dev/env-store';
import { num } from '../../dev/tuning';
import { AuthoredEnvironment } from './authored-environment';
import { HdriEnvironment } from './hdri-environment';

export function SceneEnvironment() {
    const mode = useEnvMode();

    useFrame( ( state ) => {
        state.scene.environmentIntensity = num( 'Environment.intensity' );
        state.scene.environmentRotation.y = THREE.MathUtils.degToRad( num( 'Environment.rotation' ) );
    } );

    return mode === 'authored' ? <AuthoredEnvironment /> : <HdriEnvironment />;
}
