import type { Room } from '@colyseus/sdk';
import { type RunState, SET_CLASS_MESSAGE } from '@slur/shared';
import { currentShip, cycleShip } from '../../../ship/ship-choice';

export function stepShip( room: Room< RunState >, dir: -1 | 1 ) {
    cycleShip( dir );
    room.send( SET_CLASS_MESSAGE, currentShip().id );
}
