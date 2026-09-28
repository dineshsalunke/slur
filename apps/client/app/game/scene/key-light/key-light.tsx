import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { col, num } from '../../../dev/tuning';

export function KeyLight() {
    const ref = useRef< THREE.DirectionalLight | null >( null );
    const applied = useRef( '' );

    useFrame( () => {
        const light = ref.current;
        if ( ! light ) return;

        light.position.set( num( 'KeyLight.x' ), num( 'KeyLight.y' ), num( 'KeyLight.z' ) );
        light.intensity = num( 'KeyLight.intensity' );

        const next = col( 'KeyLight.color' );
        if ( next !== applied.current ) {
            light.color.set( next );
            applied.current = next;
        }
    } );

    return <directionalLight ref={ ref } />;
}
