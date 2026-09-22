import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';

const forward = new THREE.Vector3();

export function NearFill() {
    const ref = useRef< THREE.PointLight | null >( null );
    const applied = useRef( '' );

    useFrame( ( state ) => {
        const light = ref.current;
        if ( ! light ) return;

        state.camera.getWorldDirection( forward );
        light.position.copy( state.camera.position ).addScaledVector( forward, num( 'NearFill.forward' ) );
        light.position.y += num( 'NearFill.height' );

        light.intensity = num( 'NearFill.intensity' );
        light.distance = num( 'NearFill.distance' );

        const next = col( 'NearFill.color' );
        if ( next !== applied.current ) {
            light.color.set( next );
            applied.current = next;
        }
    } );

    return <pointLight ref={ ref } decay={ 2 } />;
}
