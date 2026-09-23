import { tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Group } from 'three';
import { num } from '../../dev/tuning';
import { Hover, Interp, Net, Render, Sim } from './traits';

const TAU = Math.PI * 2;

interface HoverState {
    lift: number;
    phase: number;
    applied: number;
}

function advance( grp: Group, h: HoverState, speed: number, shipId: string, dt: number ): void {
    const stretch = Math.min( 1, Math.max( 0, speed / tuningForShip( shipId ).maxCruise ) );
    const target = num( 'Hover.base' ) + stretch * num( 'Hover.speedLift' );
    h.lift += ( target - h.lift ) * ( 1 - Math.exp( -num( 'Hover.follow' ) * dt ) );
    h.phase = ( h.phase + dt * num( 'Hover.bobRate' ) * TAU ) % TAU;
    h.applied = h.lift + Math.sin( h.phase ) * num( 'Hover.bob' );
    grp.position.y += h.applied;
}

function trailingSpeed( buffer: { t: number; z: number }[] ): number {
    if ( buffer.length < 2 ) return 0;
    const b = buffer[ buffer.length - 1 ];
    const a = buffer[ buffer.length - 2 ];
    const span = ( b.t - a.t ) / 1000;
    return span > 0 ? ( b.z - a.z ) / span : 0;
}

export function hoverSystem( world: World, dt: number ): void {
    world.query( Sim, Hover, Render, Net ).readEach( ( [ s, h, grp, net ] ) => {
        advance( grp, h, s.vz, net.shipId, dt );
    } );
    world.query( Interp, Hover, Render, Net ).readEach( ( [ interp, h, grp, net ] ) => {
        advance( grp, h, trailingSpeed( interp.buffer ), net.shipId, dt );
    } );
}
