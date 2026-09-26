import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import type { ReactNode } from 'react';
import { RoomContext } from './room-context.constants';

export function RoomProvider( { room, children }: { room: Room< RunState >; children: ReactNode } ) {
    return <RoomContext.Provider value={ room }>{ children }</RoomContext.Provider>;
}
