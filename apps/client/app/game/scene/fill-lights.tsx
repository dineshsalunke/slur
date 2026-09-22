import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { col, num } from '../../dev/tunables';

export function FillLights() {
    const point = useRef< THREE.PointLight >( null );

    useFrame( ( { camera } ) => {
        const p = point.current;
        if ( ! p ) return;
        p.position.set(
            camera.position.x,
            camera.position.y + num( 'fill.pointLift' ),
            camera.position.z - num( 'fill.pointBack' ),
        );
        p.intensity = num( 'fill.point' );
        p.decay = num( 'fill.pointDecay' );
        p.distance = num( 'fill.pointDistance' );
        p.color.set( col( 'fill.pointColor' ) );
    } );

    return <pointLight ref={ point } />;
}
