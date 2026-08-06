import { DEFAULT_TUNING } from '@slur/shared';
import type { World } from 'koota';
import type { PerspectiveCamera } from 'three';
import { LocalPlayer, Render, Sim } from '../ecs/traits';

// Chase cam: behind + above the ship, rubberband follow (exp ease, frame-rate independent),
// speed-based trail stretch, look-ahead, and speed-FOV. Called from the Loop (no own useFrame),
// so R3F's auto-render stays on.
export function updateChaseCamera( cam: PerspectiveCamera, world: World, dt: number ): void {
    const e = world.queryFirst( LocalPlayer, Render, Sim );
    if ( ! e ) return;
    const render = e.get( Render );
    const sim = e.get( Sim );
    if ( ! render || ! sim ) return;
    const p = render.position;
    const speed = sim.vz;

    const k = 1 - Math.exp( -8 * dt ); // rubberband lag-follow
    const back = 13 + ( speed / DEFAULT_TUNING.maxCruise ) * 6; // trail-stretch with speed

    cam.position.x += ( p.x - cam.position.x ) * k;
    cam.position.y += ( p.y + 5 - cam.position.y ) * k;
    cam.position.z += ( p.z - back - cam.position.z ) * k; // forward = +z, trail behind
    cam.lookAt( p.x, p.y + 1, p.z + 8 ); // look-ahead

    const fov = 70 + ( speed / DEFAULT_TUNING.maxCruise ) * 20;
    if ( Math.abs( cam.fov - fov ) > 0.1 ) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
    }
}
