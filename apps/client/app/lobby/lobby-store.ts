import type { Room, RoomAvailable } from '@colyseus/sdk';
import type { RunMetadata } from '@slur/shared';
import { useSyncExternalStore } from 'react';

export type LobbyRow = RoomAvailable< RunMetadata >;

let rooms: LobbyRow[] = [];
const listeners = new Set< () => void >();
let attached = false;

function set( next: LobbyRow[] ): void {
    rooms = next;
    for ( const notify of listeners ) notify();
}

export function attachLobbyStore( lobby: Room ): void {
    if ( attached ) return;
    attached = true;
    lobby.onMessage( 'rooms', ( list: LobbyRow[] ) => set( list ) );
    lobby.onMessage( '+', ( [ , room ]: [ string, LobbyRow ] ) =>
        set( [ ...rooms.filter( ( r ) => r.roomId !== room.roomId ), room ] ),
    );
    lobby.onMessage( '-', ( roomId: string ) => set( rooms.filter( ( r ) => r.roomId !== roomId ) ) );
}

export function useLobbyRooms(): LobbyRow[] {
    return useSyncExternalStore(
        ( notify ) => {
            listeners.add( notify );
            return () => listeners.delete( notify );
        },
        () => rooms,
        () => rooms,
    );
}
