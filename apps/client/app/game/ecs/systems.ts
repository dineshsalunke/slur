import { DEFAULT_SIM_CONFIG, simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import { blockWorld } from '../block-state';
import { currentInput } from '../input/current-input';
import { sparkIfBounced } from './bounce-spark';
import { LocalPlayer, Net, Prev, Render, Sim } from './traits';

export function localFlightSystem( world: World, dt: number, track: Track ): void {
    const input = currentInput();
    world.query( Sim, Prev, Net, LocalPlayer ).updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        const tuning = tuningForShip( net.shipId );
        const stunBefore = s.stunTimer;
        const vzBefore = s.vz;
        simulate( s, input, dt, tuning, track, DEFAULT_SIM_CONFIG, blockWorld );
        sparkIfBounced( s, stunBefore, vzBefore, dt, tuning );
    } );
}

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

export function syncRenderSystem( world: World, alpha: number ): void {
    world.query( Sim, Prev, Render, Net ).readEach( ( [ s, prev, grp, net ] ) => {
        grp.position.set( lerp( prev.x, s.x, alpha ), lerp( prev.y, s.y, alpha ), lerp( prev.z, s.z, alpha ) );
        grp.rotation.z = -( s.vx / tuningForShip( net.shipId ).strafeClamp ) * 0.5;
    } );
}
