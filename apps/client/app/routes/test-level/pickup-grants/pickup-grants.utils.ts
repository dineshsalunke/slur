import { aimSeeker, HeldPower, Seeker } from '@slur/shared';
import { button } from 'leva';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { GRANTABLE_POWERS, INCOMING_SEEKER_BEHIND, INCOMING_SEEKER_OWNER } from './pickup-grants.constants';

export function firstEmptySlot( slots: ArrayLike< number > ): number {
    for ( let i = 0; i < slots.length; i++ ) if ( slots[ i ] === HeldPower.none ) return i;
    return -1;
}

export function grantPower( room: LoopbackRoom, power: HeldPower ): boolean {
    const player = room.sim.state.players.get( room.sessionId );
    if ( ! player ) return false;
    const slot = firstEmptySlot( player.slots );
    if ( slot < 0 ) return false;
    player.slots[ slot ] = power;
    return true;
}

export function incomingSeeker( room: LoopbackRoom ): boolean {
    const player = room.sim.state.players.get( room.sessionId );
    if ( ! player ) return false;
    const shooter = { x: player.x, y: player.y, z: player.z - INCOMING_SEEKER_BEHIND, vz: player.vz };
    const seeker = new Seeker();
    aimSeeker( seeker, shooter, INCOMING_SEEKER_OWNER, room.sessionId );
    room.sim.state.seekers.set( `${ INCOMING_SEEKER_OWNER }:${ Date.now() }`, seeker );
    return true;
}

export function grantButtons( room: LoopbackRoom ) {
    return {
        ...Object.fromEntries(
            GRANTABLE_POWERS.map( ( [ name, power ] ) => [ name, button( () => grantPower( room, power ) ) ] ),
        ),
        'incoming seeker': button( () => incomingSeeker( room ) ),
    };
}
