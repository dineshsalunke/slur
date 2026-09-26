import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useRef } from 'react';
import type * as THREE from 'three';
import { col, num } from '../../../dev/tuning';
import { LocalPlayer, Render } from '../../ecs/traits';
import { exhaustDrive } from '../exhaust-drive';
import { AFTER_RENDER_SYNC } from './engine-light.constants';

export function EngineLight() {
    const world = useWorld();
    const ref = useRef< THREE.PointLight | null >( null );
    const applied = useRef( '' );

    useFrame( () => {
        const light = ref.current;
        if ( ! light ) return;

        const entity = world.queryFirst( LocalPlayer, Render );
        const group = entity?.get( Render );
        if ( ! entity || ! group?.visible ) {
            light.intensity = 0;
            return;
        }

        const throttle = exhaustDrive( entity );
        if ( throttle < 0 ) {
            light.intensity = 0;
            return;
        }

        const idle = num( 'Exhaust.idle' );
        light.position.copy( group.position );
        light.position.z -= num( 'EngineLight.back' );
        light.position.y += num( 'EngineLight.lift' );
        light.intensity = num( 'EngineLight.intensity' ) * ( idle + ( 1 - idle ) * throttle );
        light.distance = num( 'EngineLight.distance' );

        const next = col( 'EngineLight.color' );
        if ( next !== applied.current ) {
            light.color.set( next );
            applied.current = next;
        }
    }, AFTER_RENDER_SYNC );

    return <pointLight ref={ ref } decay={ 2 } />;
}
