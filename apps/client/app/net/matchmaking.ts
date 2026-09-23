import type { Room } from '@colyseus/sdk';
import {
    descriptorReady,
    ROOM_NAME,
    type RunState,
    SET_CLASS_MESSAGE,
    type TrackDescriptor,
    toDescriptor,
} from '@slur/shared';
import { attachLobbyStore } from '../lobby/lobby-store';
import { currentShip } from '../ship/ship-choice';
import { getClient } from './client';
import { session } from './session';

const LOBBY_ROOM = 'lobby';

function enter( room: Room< RunState > ): Room< RunState > {
    session.room = room;
    room.send( SET_CLASS_MESSAGE, currentShip().id );
    return room;
}

export async function hostRoom( name: string ): Promise< Room< RunState > > {
    return enter( await getClient().create< RunState >( ROOM_NAME, { name } ) );
}

export async function joinRoom( roomId: string, name: string ): Promise< Room< RunState > > {
    return enter( await getClient().joinById< RunState >( roomId, { name } ) );
}

let linkJoin: { roomId: string; room: Promise< Room< RunState > > } | null = null;

export function joinByLink( roomId: string, name: string ): Promise< Room< RunState > > {
    if ( session.room?.roomId === roomId ) return Promise.resolve( session.room );
    if ( linkJoin?.roomId === roomId ) return linkJoin.room;
    leaveRoom();
    const room = joinRoom( roomId, name ).finally( () => {
        linkJoin = null;
    } );
    linkJoin = { roomId, room };
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
