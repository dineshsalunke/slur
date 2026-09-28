import { CHAT_HISTORY_LINES, CHAT_HISTORY_MESSAGE, CHAT_LINE_MESSAGE, type ChatLine } from '@slur/shared';
import { useSyncExternalStore } from 'react';

export interface ChatRoom {
    send( type: string, payload?: unknown ): void;
    onMessage< Payload >( type: string, callback: ( payload: Payload ) => void ): unknown;
    onReconnect( callback: () => void ): unknown;
}

let newestFirst: readonly ChatLine[] = [];
let current: ChatRoom | null = null;
const listeners = new Set< () => void >();

function set( next: readonly ChatLine[] ): void {
    newestFirst = next;
    for ( const notify of listeners ) notify();
}

export function attachChatStore( room: ChatRoom ): void {
    current = room;
    set( [] );
    room.onMessage< ChatLine >( CHAT_LINE_MESSAGE, ( line ) => {
        if ( current === room ) set( [ line, ...newestFirst ].slice( 0, CHAT_HISTORY_LINES ) );
    } );
    room.onMessage< ChatLine[] >( CHAT_HISTORY_MESSAGE, ( history ) => {
        if ( current === room ) set( history.slice( -CHAT_HISTORY_LINES ).reverse() );
    } );
    room.onReconnect( () => room.send( CHAT_HISTORY_MESSAGE ) );
    room.send( CHAT_HISTORY_MESSAGE );
}

export function useChatLines(): readonly ChatLine[] {
    return useSyncExternalStore(
        ( notify ) => {
            listeners.add( notify );
            return () => listeners.delete( notify );
        },
        () => newestFirst,
        () => newestFirst,
    );
}
