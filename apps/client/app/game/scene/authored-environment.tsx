import { Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';

const SHELL_RADIUS = 100;
const GROUND_DROP = 40;
const BAND_RADIUS = 98;

export function AuthoredEnvironment() {
    const sky = useRef< THREE.MeshBasicMaterial | null >( null );
    const ground = useRef< THREE.MeshBasicMaterial | null >( null );
    const band = useRef< THREE.MeshBasicMaterial | null >( null );
    const bandMesh = useRef< THREE.Mesh | null >( null );

    useFrame( () => {
        sky.current?.color.set( col( 'Env.skyColor' ) ).multiplyScalar( num( 'Env.skyIntensity' ) );
        ground.current?.color.set( col( 'Env.groundColor' ) ).multiplyScalar( num( 'Env.groundIntensity' ) );
        band.current?.color.set( col( 'Env.bandColor' ) ).multiplyScalar( num( 'Env.bandIntensity' ) );
        bandMesh.current?.scale.setY( num( 'Env.bandHeight' ) );
    } );

    return (
        <Environment background={ false } resolution={ 64 } frames={ Infinity }>
            <mesh>
                <sphereGeometry args={ [ SHELL_RADIUS, 16, 12 ] } />
                <meshBasicMaterial ref={ sky } side={ THREE.BackSide } />
            </mesh>

            <mesh position={ [ 0, -GROUND_DROP, 0 ] } rotation={ [ -Math.PI / 2, 0, 0 ] }>
                <circleGeometry args={ [ SHELL_RADIUS, 32 ] } />
                <meshBasicMaterial ref={ ground } side={ THREE.DoubleSide } />
            </mesh>

            <mesh ref={ bandMesh }>
                <cylinderGeometry args={ [ BAND_RADIUS, BAND_RADIUS, 1, 32, 1, true ] } />
                <meshBasicMaterial ref={ band } side={ THREE.BackSide } />
            </mesh>
        </Environment>
    );
}
