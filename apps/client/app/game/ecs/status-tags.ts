import type { Entity, TagTrait, World } from 'koota';
import { Dead, LocalPlayer, Sim, Spectating, Stunned } from './traits';

interface ShipStatus {
    dead: boolean;
    stunTimer: number;
}

function setTag( ent: Entity, tag: TagTrait, on: boolean ): void {
    if ( on === ent.has( tag ) ) return;
    if ( on ) ent.add( tag );
    else ent.remove( tag );
}

export function mirrorStatus( ent: Entity, isDead: boolean, isStunned: boolean ): void {
    setTag( ent, Dead, isDead );
    setTag( ent, Stunned, isStunned );
}

export function mirrorShipStatus( ent: Entity, ship: ShipStatus ): void {
    mirrorStatus( ent, ship.dead, ship.stunTimer > 0 );
}

export function mirrorSpectating( ent: Entity, isSpectating: boolean ): void {
    setTag( ent, Spectating, isSpectating );
}

export function mirrorLocalStatus( world: World ): void {
    world.query( Sim, LocalPlayer ).readEach( ( [ s ], e ) => mirrorShipStatus( e, s ) );
}
