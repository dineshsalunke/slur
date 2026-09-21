import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { LocalPlayer, Sim } from '../../game/ecs/traits';

const ADVANCE_SPEED = 70;

export function EnvRig() {
    const world = useWorld();

    // JUSTIFIED EFFECT — external sync: the koota ECS world (module singleton). The lab needs exactly one
    useEffect( () => {
        const e = world.spawn( Sim, LocalPlayer );
        return () => e.destroy();
    }, [ world ] );

    useFrame( ( state, delta ) => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        if ( ! sim ) return;
        sim.z += ADVANCE_SPEED * delta;
        const cam = state.camera;
        cam.position.set( 0, 5, sim.z - 13 );
        cam.lookAt( 0, 1, sim.z + 8 );
    } );

    return null;
}
