import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useContext } from 'react';
import { RoomContext } from './room-context.constants';

export function useRoom(): Room< RunState > {
    const room = useContext( RoomContext );
    if ( ! room ) throw new Error( 'useRoom must be used within <RoomProvider>' );
    return room;
}
