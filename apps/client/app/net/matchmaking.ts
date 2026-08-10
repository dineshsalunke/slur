import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { descriptorReady, ROOM_NAME, type RunState, type TrackDescriptor, toDescriptor } from '@slur/shared';
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

// Leave = a DELIBERATE teardown (the only place a run room is closed) — never a component unmount cleanup
// (the S2 bug). The caller navigates to '/' afterwards; a fresh Host/Join stashes a new room on the session.
export function leaveRoom(): void {
    session.room?.leave();
    session.room = null;
}

// The TrackDescriptor is server-authoritative (set in onCreate) but decodes AFTER the join handshake. Resolve
// once it's populated (descriptorReady — procgen: a real non-zero seed) so the /game loader can hand NetCanvas
// a descriptor that MATCHES the server from the first render (identical track both ends). Lives here, not a
// component effect — same reason as S2. Listens on the descriptor's `seed` (the procgen sentinel field).
export function waitForDescriptor( room: Room< RunState > ): Promise< TrackDescriptor > {
    if ( descriptorReady( room.state.descriptor ) ) return Promise.resolve( toDescriptor( room.state.descriptor ) );
    return new Promise( ( resolve ) => {
        const off = getStateCallbacks( room )( room.state.descriptor ).listen( 'seed', () => {
            if ( descriptorReady( room.state.descriptor ) ) {
                off();
                resolve( toDescriptor( room.state.descriptor ) );
            }
        } );
    } );
}
