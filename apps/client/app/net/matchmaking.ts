import type { Room } from '@colyseus/sdk';
import { descriptorReady, ROOM_NAME, type RunState, type TrackDescriptor, toDescriptor } from '@slur/shared';
import { attachLobbyStore } from '../lobby/lobby-store';
import { getClient } from './client';
import { session } from './session';

const LOBBY_ROOM = 'lobby';

export async function hostRoom( name: string ): Promise< Room< RunState > > {
    const room = await getClient().create< RunState >( ROOM_NAME, { name } );
    session.room = room;
    return room;
}

export async function joinRoom( roomId: string, name: string ): Promise< Room< RunState > > {
    const room = await getClient().joinById< RunState >( roomId, { name } );
    session.room = room;
    return room;
}

export async function joinLobby(): Promise< void > {
    if ( session.lobby ) return;
    const lobby = await getClient().joinOrCreate( LOBBY_ROOM );
    session.lobby = lobby;
    attachLobbyStore( lobby );
}

export function leaveRoom(): void {
    session.room?.leave();
    session.room = null;
}

export function waitForDescriptor( room: Room< RunState > ): Promise< TrackDescriptor > {
    const ready = (): boolean => !! room.state?.descriptor && descriptorReady( room.state.descriptor );
    if ( ready() ) return Promise.resolve( toDescriptor( room.state.descriptor ) );
    return new Promise( ( resolve ) => {
        const handler = (): void => {
            if ( ! ready() ) return;
            room.onStateChange.remove( handler );
            resolve( toDescriptor( room.state.descriptor ) );
        };
        room.onStateChange( handler );
    } );
}
