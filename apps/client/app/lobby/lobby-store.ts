import type { Room, RoomAvailable } from '@colyseus/sdk';
import type { RunMetadata } from '@slur/shared';
import { useSyncExternalStore } from 'react';

// One row of the live room list — a matchmaking listing carrying our { hostName, phase } metadata.
export type LobbyRow = RoomAvailable< RunMetadata >;

// The room list lives on a MODULE store, not React state, for one specific correctness reason: the server's
// LobbyRoom pushes the initial `rooms` snapshot the instant we join, BEFORE any component mounts. Attaching
// the handlers at join time (attachLobbyStore, called from matchmaking.joinLobby) guarantees we catch it;
// a component-mounted subscription would race and miss it. Components read via useLobbyRooms (below).
let rooms: LobbyRow[] = [];
const listeners = new Set< () => void >();
let attached = false;

function set( next: LobbyRow[] ): void {
    rooms = next; // replace the ref only on real changes → useSyncExternalStore's snapshot stays stable between them
    for ( const notify of listeners ) notify();
}

// Wire the LobbyRoom's push messages into the store. Called ONCE at join; the lobby stays connected for the
// app's lifetime (a session resource), so the handlers need no teardown.
export function attachLobbyStore( lobby: Room ): void {
    if ( attached ) return;
    attached = true;
    lobby.onMessage( 'rooms', ( list: LobbyRow[] ) => set( list ) ); // full snapshot (on join)
    lobby.onMessage( '+', ( [ , room ]: [ string, LobbyRow ] ) =>
        set( [ ...rooms.filter( ( r ) => r.roomId !== room.roomId ), room ] ),
    );
    lobby.onMessage( '-', ( roomId: string ) => set( rooms.filter( ( r ) => r.roomId !== roomId ) ) );
}

// React read API. useSyncExternalStore is THE idiomatic external-store bridge — it owns subscribe/unsubscribe
// and snapshot caching, so no useEffect is needed. getSnapshot returns a stable ref between changes (required,
// else an infinite render loop). The third arg is the SSR snapshot; the landing is client-only so it's moot.
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
