import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { LocalPlayer, Sim } from '../../game/ecs/traits';

const DRIFT_SPEED = 22;

export function LandingRig() {
    const world = useWorld();
    const still = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches,
        [],
    );

    // JUSTIFIED EFFECT — external sync: the koota ECS world (module singleton). The backdrop needs exactly one
    useEffect( () => {
        const e = world.spawn( Sim, LocalPlayer );
        return () => e.destroy();
    }, [ world ] );

    useFrame( ( state, delta ) => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        if ( ! sim ) return;
        if ( ! still ) sim.z += DRIFT_SPEED * delta;
        const cam = state.camera;
        cam.position.set( 0, 5, sim.z - 13 );
        cam.lookAt( 0, 1, sim.z + 8 );
    } );

    return null;
}
