import { HeldPower } from '@slur/shared';
import { button } from 'leva';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { GRANTABLE_POWERS } from './pickup-grants.constants';

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

export function grantButtons( room: LoopbackRoom ) {
    return Object.fromEntries(
        GRANTABLE_POWERS.map( ( [ name, power ] ) => [ name, button( () => grantPower( room, power ) ) ] ),
    );
}
