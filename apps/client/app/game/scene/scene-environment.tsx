import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { bandedEnvironment } from './env-band/env-band.state';
import { environmentMap } from './hdri/hdri.state';

export function SceneEnvironment() {
    useFrame( ( state ) => {
        state.scene.environment = bandedEnvironment( state.gl, environmentMap() );
        state.scene.environmentIntensity = num( 'Environment.intensity' );
        state.scene.environmentRotation.y = THREE.MathUtils.degToRad( num( 'Environment.rotation' ) );
    } );

    return null;
}
