import { useContext } from 'react';
import type { RunRoomLike } from '../run-room-like';
import { RoomContext } from './room-context.constants';

export function useRoom(): RunRoomLike {
    const room = useContext( RoomContext );
    if ( ! room ) throw new Error( 'useRoom must be used within <RoomProvider>' );
    return room;
}
