import { DEFAULT_TUNING, simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import { currentInput } from '../input/keyboard';
import { LocalPlayer, Net, Prev, Render, Sim } from './traits';

export function localFlightSystem( world: World, dt: number, track: Track ): void {
    const input = currentInput();
    world.query( Sim, Prev, Net, LocalPlayer ).updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        simulate( s, input, dt, tuningForShip( net.shipId ), track );
    } );
}

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

export function syncRenderSystem( world: World, alpha: number ): void {
    world.query( Sim, Prev, Render ).readEach( ( [ s, prev, grp ] ) => {
        grp.position.set( lerp( prev.x, s.x, alpha ), lerp( prev.y, s.y, alpha ), lerp( prev.z, s.z, alpha ) );
        grp.rotation.z = -( s.vx / DEFAULT_TUNING.strafeClamp ) * 0.5;
    } );
}
