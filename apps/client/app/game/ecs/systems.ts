import { simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import { currentInput } from '../input/keyboard';
import { bankTuning, driveAttitude } from './attitude';
import { Attitude, LocalPlayer, Net, Prev, Render, Sim } from './traits';

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

export function syncRenderSystem( world: World, alpha: number, dt: number ): void {
    const bank = bankTuning();
    world.query( Sim, Prev, Render, Net, Attitude ).readEach( ( [ s, prev, grp, net, att ] ) => {
        grp.position.set( lerp( prev.x, s.x, alpha ), lerp( prev.y, s.y, alpha ), lerp( prev.z, s.z, alpha ) );
        driveAttitude( att, grp, s.vx, s.vy, tuningForShip( net.shipId ), bank, dt );
    } );
}
