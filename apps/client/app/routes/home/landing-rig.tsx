import { useFrame } from '@react-three/fiber';
import { DEFAULT_TUNING } from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { LocalPlayer, Net, Render, Sim } from '../../game/ecs/traits';
import { prefersReducedMotion } from '../../game/scene/reduced-motion';
import { currentShip } from '../../ship/ship-choice';

const CRUISE = DEFAULT_TUNING.maxCruise * 0.6;
const CAMERA_BACK = 5;
const CAMERA_HEIGHT = 2.2;
const LOOK_AHEAD = 40;
const LOOK_HEIGHT = 1.6;
const PORTRAIT_LOOK_HEIGHT = -12;

export function LandingRig( { loopZ }: { loopZ: number } ) {
    const world = useWorld();
    const still = useMemo( prefersReducedMotion, [] );

    // Syncs with the koota ECS world (a module singleton): the backdrop needs one local ship entity to drive.
    useEffect( () => {
        const e = world.spawn( Sim, LocalPlayer, Render, Net( { shipId: currentShip().id } ) );
        return () => e.destroy();
    }, [ world ] );

    useFrame( ( state, delta ) => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        if ( ! sim ) return;
        sim.vz = still ? 0 : CRUISE;
        sim.z = ( sim.z + sim.vz * delta ) % loopZ;
        const cam = state.camera;
        cam.position.set( 0, CAMERA_HEIGHT, sim.z - CAMERA_BACK );
        const portrait = state.size.width < state.size.height;
        cam.lookAt( 0, portrait ? PORTRAIT_LOOK_HEIGHT : LOOK_HEIGHT, sim.z + LOOK_AHEAD );
    } );

    return null;
}
