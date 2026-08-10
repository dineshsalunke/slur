import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { LocalPlayer, Sim } from '../../game/ecs/traits';

// Steady flythrough speed for the lab (u/s). Not the real sim — just enough forward motion to show the
// parallax walls recycling and the sky staying put.
const ADVANCE_SPEED = 70;

// Lab-only rig: spawns the single LocalPlayer+Sim the world components recycle against, auto-advances its
// z (no input, no flightSystem), and hard-follows the camera behind it. Mounted FIRST in the canvas so its
// useFrame runs before TubeWalls/Track read sim.z this frame.
export function EnvRig() {
    const world = useWorld();

    // JUSTIFIED EFFECT — external sync: the koota ECS world (module singleton). The lab needs exactly one
    // LocalPlayer+Sim present while mounted so Environment/TubeWalls/Track recycle off sim.z, mirroring the
    // real scene. Scene-scoped, cheap, and SHOULD recreate on remount — same shape as game-canvas's spawn,
    // not the S2 connection anti-pattern.
    useEffect( () => {
        const e = world.spawn( Sim, LocalPlayer );
        return () => e.destroy();
    }, [ world ] );

    useFrame( ( state, delta ) => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        if ( ! sim ) return;
        sim.z += ADVANCE_SPEED * delta; // auto-advance down the ribbon
        const cam = state.camera;
        cam.position.set( 0, 5, sim.z - 13 ); // fixed chase offset (no rubberband — this is a viewer)
        cam.lookAt( 0, 1, sim.z + 8 );
    } );

    return null;
}
