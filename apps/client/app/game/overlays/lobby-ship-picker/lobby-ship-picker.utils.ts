import { SET_CLASS_MESSAGE } from '@slur/shared';
import type { RunRoomLike } from '../../../net/run-room-like';
import { currentShip, cycleShip } from '../../../ship/ship-choice';

export function stepShip( room: RunRoomLike, dir: -1 | 1 ) {
    cycleShip( dir );
    room.send( SET_CLASS_MESSAGE, currentShip().id );
}
