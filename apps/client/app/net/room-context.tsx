import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { createContext, type ReactNode, useContext } from 'react';

// Thin room context: a PURE passthrough that exposes the loader-joined room to React consumers.
// It deliberately does NOT own the room's lifetime — no useEffect, no leave() on unmount. The
// connection lives on the module singleton (session) + loader, OUTSIDE React lifecycle: a transient
// route remount must never tear down the socket (that coupling caused create→leave→dispose churn —
// a new room every render). Teardown is a deliberate action (page close / explicit leave), not a
// component side effect.
const RoomContext = createContext< Room< RunState > | null >( null );

export function RoomProvider( { room, children }: { room: Room< RunState >; children: ReactNode } ) {
    return <RoomContext.Provider value={ room }>{ children }</RoomContext.Provider>;
}

export function useRoom(): Room< RunState > {
    const room = useContext( RoomContext );
    if ( ! room ) throw new Error( 'useRoom must be used within <RoomProvider>' );
    return room;
}
