import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { ROOM_NAME, type RunState } from '@slur/shared';
import { attachLobbyStore } from '../lobby/lobby-store';
import { getClient } from './client';
import { session } from './session';

// The built-in LobbyRoom is registered under this name server-side (index.ts).
const LOBBY_ROOM = 'lobby';

// Room creation/join lives in EVENT HANDLERS (the landing's Host/Join actions), never in a loader — a
// loader re-runs on revalidation and must not open a socket (the S2 anti-pattern). Each stashes the joined
// room on the session singleton so the /game loader can find it (requireRoom) and it survives navigation.

// Host: create a fresh run room. The creator is seat 0 → the server makes them host.
export async function hostRoom( name: string ): Promise< Room< RunState > > {
    const room = await getClient().create< RunState >( ROOM_NAME, { name } );
    session.room = room;
    return room;
}

// Join an existing run by id (from a room-list row). Joining a locked (racing) room → the server seats you
// as a spectator for the current round.
export async function joinRoom( roomId: string, name: string ): Promise< Room< RunState > > {
    const room = await getClient().joinById< RunState >( roomId, { name } );
    session.room = room;
    return room;
}

// Join the live room list. Idempotent — the lobby connection is a session singleton kept for the app's
// lifetime; attaching the store here (at join, in module scope) is what guarantees the initial snapshot lands.
export async function joinLobby(): Promise< void > {
    if ( session.lobby ) return;
    const lobby = await getClient().joinOrCreate( LOBBY_ROOM );
    session.lobby = lobby;
    attachLobbyStore( lobby );
}

// The seed is server-authoritative (set in onCreate) but decodes AFTER the join handshake. Resolve once it's
// a real (non-zero) value so the /game loader can hand NetCanvas a seed that MATCHES the server from the
// first render (identical track both ends). Lives here, not a component effect — same reason as S2.
export function waitForSeed( room: Room< RunState > ): Promise< number > {
    if ( room.state.seed ) return Promise.resolve( room.state.seed );
    return new Promise( ( resolve ) => {
        const off = getStateCallbacks( room )( room.state ).listen( 'seed', ( v ) => {
            if ( v ) {
                off();
                resolve( v );
            }
        } );
    } );
}
