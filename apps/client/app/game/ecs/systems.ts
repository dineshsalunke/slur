import { tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import { bankTuning, driveAttitude } from './attitude';
import { Attitude, Net, Prev, Render, Sim } from './traits';

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

export function syncRenderSystem( world: World, alpha: number, dt: number ): void {
    const bank = bankTuning();
    world.query( Sim, Prev, Render, Net, Attitude ).readEach( ( [ s, prev, grp, net, att ] ) => {
        grp.position.set( lerp( prev.x, s.x, alpha ), lerp( prev.y, s.y, alpha ), lerp( prev.z, s.z, alpha ) );
        driveAttitude( att, grp, s.vx, s.vy, tuningForShip( net.shipId ), bank, dt );
    } );
}
