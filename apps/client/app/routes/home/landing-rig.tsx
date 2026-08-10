import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { LocalPlayer, Sim } from '../../game/ecs/traits';

// A calm ambient drift — slow enough to read as a menu backdrop, fast enough that the parallax canyon walls
// visibly recycle. Zeroed when the viewer prefers reduced motion (the scene then sits still).
const DRIFT_SPEED = 22;

// Landing backdrop rig: spawns the single LocalPlayer+Sim that Environment/TubeWalls recycle against, drifts
// its z gently, and parks the camera on a fixed chase offset. Mounted FIRST in the canvas so its useFrame
// runs before TubeWalls reads sim.z this frame. Mirrors env-lab's EnvRig, tuned slow + reduced-motion aware.
export function LandingRig() {
    const world = useWorld();
    // Browser-only read (SPA route, no SSR): stop the drift entirely when the OS asks for reduced motion.
    const still = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches,
        [],
    );

    // JUSTIFIED EFFECT — external sync: the koota ECS world (module singleton). The backdrop needs exactly one
    // LocalPlayer+Sim present while mounted so Environment/TubeWalls recycle off sim.z. Scene-scoped, cheap,
    // and SHOULD recreate on remount — same shape as env-lab's EnvRig spawn, not the S2 connection anti-pattern.
    useEffect( () => {
        const e = world.spawn( Sim, LocalPlayer );
        return () => e.destroy();
    }, [ world ] );

    useFrame( ( state, delta ) => {
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        if ( ! sim ) return;
        if ( ! still ) sim.z += DRIFT_SPEED * delta; // gentle auto-advance down the ribbon
        const cam = state.camera;
        cam.position.set( 0, 5, sim.z - 13 ); // fixed chase offset — this is a viewer, no rubberband
        cam.lookAt( 0, 1, sim.z + 8 );
    } );

    return null;
}
