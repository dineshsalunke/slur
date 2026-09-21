import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { createContext, type ReactNode, useContext } from 'react';

const RoomContext = createContext< Room< RunState > | null >( null );

export function RoomProvider( { room, children }: { room: Room< RunState >; children: ReactNode } ) {
    return <RoomContext.Provider value={ room }>{ children }</RoomContext.Provider>;
}

export function useRoom(): Room< RunState > {
    const room = useContext( RoomContext );
    if ( ! room ) throw new Error( 'useRoom must be used within <RoomProvider>' );
    return room;
}
