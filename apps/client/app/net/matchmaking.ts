import type { Room } from '@colyseus/sdk';
import {
    descriptorReady,
    KICKED_MESSAGE,
    ROOM_NAME,
    type RunCreateOptions,
    type RunState,
    SET_CLASS_MESSAGE,
    type TrackDescriptor,
    toDescriptor,
} from '@slur/shared';
import { attachLobbyStore } from '../lobby/lobby-store';
import { currentShip } from '../ship/ship-choice';
import { attachChatStore } from './chat-store';
import { getClient } from './client';
import { connectionStatus, setConnectionStatus } from './connection-status';
import { browserJoinToken } from './join-token';
import { session } from './session';

const LOBBY_ROOM = 'lobby';

function watchRoom( room: Room< RunState > ): void {
    room.onDrop( () => {
        if ( session.room === room ) setConnectionStatus( 'reconnecting' );
    } );
    room.onReconnect( () => {
        if ( session.room === room ) setConnectionStatus( 'live' );
    } );
    room.onMessage( KICKED_MESSAGE, () => {
        if ( session.room === room ) setConnectionStatus( 'kicked' );
    } );
    room.onLeave( () => {
        if ( session.room !== room ) return;
        session.room = null;
        if ( connectionStatus() !== 'kicked' ) setConnectionStatus( 'lost' );
    } );
}

let leaves = 0;

export class AbandonedJoinError extends Error {
    constructor() {
        super( 'The player left before the join finished.' );
    }
}

async function enter( joining: Promise< Room< RunState > > ): Promise< Room< RunState > > {
    const leavesAtStart = leaves;
    const room = await joining;
    if ( leaves !== leavesAtStart ) {
        room.leave();
        throw new AbandonedJoinError();
    }
    leaveRoom();
    session.room = room;
    setConnectionStatus( 'live' );
    watchRoom( room );
    attachChatStore( room );
    room.send( SET_CLASS_MESSAGE, currentShip().id );
    return room;
}

export function quickPlay( name: string ): Promise< Room< RunState > > {
    const options: RunCreateOptions = { name, public: true, token: browserJoinToken() };
    return enter( getClient().joinOrCreate< RunState >( ROOM_NAME, options ) );
}

export function createPrivate( name: string ): Promise< Room< RunState > > {
    const options: RunCreateOptions = { name, token: browserJoinToken() };
    return enter( getClient().create< RunState >( ROOM_NAME, options ) );
}

export function joinRoom( roomId: string, name: string ): Promise< Room< RunState > > {
    const options: RunCreateOptions = { name, token: browserJoinToken() };
    return enter( getClient().joinById< RunState >( roomId, options ) );
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

let lobbyJoin: Promise< void > | null = null;

async function connectLobby(): Promise< void > {
    const lobby = await getClient().joinOrCreate( LOBBY_ROOM );
    session.lobby = lobby;
    lobby.onLeave( () => {
        if ( session.lobby !== lobby ) return;
        session.lobby = null;
        lobbyJoin = null;
    } );
    attachLobbyStore( lobby );
}

export function joinLobby(): Promise< void > {
    lobbyJoin ??= connectLobby().catch( ( error: unknown ) => {
        lobbyJoin = null;
        throw error;
    } );
    return lobbyJoin;
}

export function leaveRoom(): void {
    const room = session.room;
    leaves += 1;
    session.room = null;
    setConnectionStatus( 'live' );
    room?.leave();
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
