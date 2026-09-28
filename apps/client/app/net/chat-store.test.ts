import { CHAT_HISTORY_LINES, CHAT_HISTORY_MESSAGE, CHAT_LINE_MESSAGE, type ChatLine } from '@slur/shared';
import { describe, expect, it, vi } from 'vitest';
import { attachChatStore, type ChatRoom, useChatLines } from './chat-store';

vi.mock( 'react', () => ( { useSyncExternalStore: ( _s: unknown, get: () => unknown ) => get() } ) );

function fakeRoom() {
    const handlers = new Map< string, ( payload: unknown ) => void >();
    let reconnect = (): void => {};
    const send = vi.fn();
    const room: ChatRoom = {
        send,
        onMessage: ( type, cb ) => handlers.set( type, cb as ( payload: unknown ) => void ),
        onReconnect: ( cb ) => {
            reconnect = cb;
        },
    };
    return {
        room,
        send,
        emit: ( type: string, payload: unknown ) => handlers.get( type )?.( payload ),
        reconnect: () => reconnect(),
    };
}

const line = ( id: number, text = `l${ id }` ): ChatLine => ( { id, from: 's', name: 'Ann', colorId: 0, text } );

describe( 'chat store', () => {
    it( 'asks for history on attach and again on reconnect', () => {
        const r = fakeRoom();
        attachChatStore( r.room );
        expect( r.send ).toHaveBeenCalledWith( CHAT_HISTORY_MESSAGE );
        r.send.mockClear();
        r.reconnect();
        expect( r.send ).toHaveBeenCalledWith( CHAT_HISTORY_MESSAGE );
    } );

    it( 'keeps lines newest first, capped, with history replacing the list', () => {
        const r = fakeRoom();
        attachChatStore( r.room );
        r.emit( CHAT_HISTORY_MESSAGE, [ line( 1 ), line( 2 ) ] );
        expect( useChatLines().map( ( l ) => l.id ) ).toEqual( [ 2, 1 ] );
        r.emit( CHAT_LINE_MESSAGE, line( 3 ) );
        expect( useChatLines().map( ( l ) => l.id ) ).toEqual( [ 3, 2, 1 ] );
        for ( let i = 4; i < 4 + CHAT_HISTORY_LINES; i++ ) r.emit( CHAT_LINE_MESSAGE, line( i ) );
        expect( useChatLines() ).toHaveLength( CHAT_HISTORY_LINES );
        expect( useChatLines()[ 0 ]?.id ).toBe( 3 + CHAT_HISTORY_LINES );
    } );

    it( 'clears on a new room and ignores the old one', () => {
        const old = fakeRoom();
        attachChatStore( old.room );
        old.emit( CHAT_LINE_MESSAGE, line( 1 ) );
        const next = fakeRoom();
        attachChatStore( next.room );
        expect( useChatLines() ).toEqual( [] );
        old.emit( CHAT_LINE_MESSAGE, line( 2 ) );
        expect( useChatLines() ).toEqual( [] );
    } );
} );
