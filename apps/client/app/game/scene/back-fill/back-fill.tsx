import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../../dev/tuning';
import { FILL_DISTANCE } from './back-fill.constants';

export function BackFill() {
    const ref = useRef< THREE.DirectionalLight | null >( null );
    const applied = useRef( '' );

    useFrame( () => {
        const light = ref.current;
        if ( ! light ) return;

        const elevation = THREE.MathUtils.degToRad( num( 'Fill.elevation' ) );
        const azimuth = THREE.MathUtils.degToRad( num( 'Fill.azimuth' ) );
        const ground = Math.cos( elevation ) * FILL_DISTANCE;

        light.position.set(
            ground * Math.sin( azimuth ),
            Math.sin( elevation ) * FILL_DISTANCE,
            -ground * Math.cos( azimuth ),
        );
        light.intensity = num( 'Fill.intensity' );

        const next = col( 'Fill.color' );
        if ( next !== applied.current ) {
            light.color.set( next );
            applied.current = next;
        }
    } );

    return <directionalLight ref={ ref } />;
}
