import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { _c, GEOMETRY, SLOTS } from './block-burst.constants';
import { pending } from './block-burst.state';
import { draw } from './block-burst.utils';

export interface Burst {
    x: number;
    y: number;
    z: number;
    size: number;
    born: number;
}

export function BlockBurst() {
    const live = useMemo< Burst[] >( () => [], [] );
    const meshRef = useRef< THREE.InstancedMesh | null >( null );

    useFrame( ( state ) => {
        const mesh = meshRef.current;
        if ( ! mesh ) return;
        const now = state.clock.elapsedTime;
        for ( const b of pending ) {
            b.born = now;
            live.push( b );
            if ( live.length > SLOTS ) live.shift();
        }
        pending.length = 0;
        draw( mesh, live, now );
    } );

    return (
        <instancedMesh
            ref={ ( m ) => {
                meshRef.current = m;
                if ( m ) m.setColorAt( 0, _c.setRGB( 0, 0, 0 ) );
            } }
            geometry={ GEOMETRY }
            count={ 0 }
            frustumCulled={ false }
            args={ [ undefined, undefined, SLOTS ] }
        >
            <meshBasicMaterial transparent depthWrite={ false } blending={ THREE.AdditiveBlending } fog={ false } />
        </instancedMesh>
    );
}
