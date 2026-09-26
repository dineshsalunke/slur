import type { ReactNode } from 'react';
import type { RunRoomLike } from '../run-room-like';
import { RoomContext } from './room-context.constants';

export function RoomProvider( { room, children }: { room: RunRoomLike; children: ReactNode } ) {
    return <RoomContext.Provider value={ room }>{ children }</RoomContext.Provider>;
}
