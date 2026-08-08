import { DEFAULT_TUNING, simulate } from '@slur/shared';
import type { World } from 'koota';
import { currentInput } from '../input/keyboard';
import { LocalPlayer, Prev, Render, Sim } from './traits';

// Fixed-step physics. Snapshot the pre-step transform into Prev (interp source), then step.
// updateEach writes both traits back after the callback (Sim is AoS live-ref, Prev is SoA).
export function flightSystem( world: World, dt: number ): void {
    const input = currentInput();
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        simulate( s, input, dt, DEFAULT_TUNING );
    } );
}

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

// Render sync: interpolate prev→curr into the ship's Render group. readEach is read-only, but we
// mutate the live THREE.Group (an AoS ref), so no write-back is needed.
export function syncRenderSystem( world: World, alpha: number ): void {
    world.query( Sim, Prev, Render ).readEach( ( [ s, prev, grp ] ) => {
        grp.position.set( lerp( prev.x, s.x, alpha ), lerp( prev.y, s.y, alpha ), lerp( prev.z, s.z, alpha ) );
        grp.rotation.z = -( s.vx / DEFAULT_TUNING.strafeClamp ) * 0.5; // cosmetic bank from lateral velocity
    } );
}
