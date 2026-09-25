import { DEFAULT_SIM_CONFIG, simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import { blockWorld } from '../block-state';
import { currentInput } from '../input/current-input';
import { bankTuning, driveAttitude } from './attitude';
import { sparkIfBounced } from './bounce-spark';
import { Attitude, LocalPlayer, Net, Prev, Render, Sim } from './traits';

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

export function syncRenderSystem( world: World, alpha: number, dt: number ): void {
    const bank = bankTuning();
    world.query( Sim, Prev, Render, Net, Attitude ).readEach( ( [ s, prev, grp, net, att ] ) => {
        grp.position.set( lerp( prev.x, s.x, alpha ), lerp( prev.y, s.y, alpha ), lerp( prev.z, s.z, alpha ) );
        driveAttitude( att, grp, s.vx, s.vy, tuningForShip( net.shipId ), bank, dt );
    } );
}
