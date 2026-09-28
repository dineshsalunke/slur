// @vitest-environment jsdom

import { CHAT_LINE_MESSAGE, CHAT_SEND_MESSAGE, PHASE, SET_CLASS_MESSAGE, START_MESSAGE } from '@slur/shared';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachChatStore } from '../../../net/chat-store';
import { attachKeyboard, keyboardInput } from '../../input/keyboard';
import { mountOverlays, unmountOverlays } from '../mount-overlays';
import { bus, send } from '../test-room';

vi.mock( '../../../net/state-callbacks', async () => ( await import( '../test-room' ) ).callbacksMock );

const counts = vi.hoisted( () => ( { ChatLines: 0, Roster: 0 } ) );

vi.mock( './chat-lines', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./chat-lines') >();
    return {
        ChatLines: () => {
            counts.ChatLines += 1;
            return actual.ChatLines();
        },
    };
} );

vi.mock( '../roster/roster', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('../roster/roster') >();
    return {
        Roster: ( props: Parameters< typeof actual.Roster >[ 0 ] ) => {
            counts.Roster += 1;
            return actual.Roster( props );
        },
    };
} );

function chatField( host: HTMLElement ): HTMLInputElement {
    const field = host.querySelector< HTMLInputElement >( 'input[aria-label="Chat message"]' );
    if ( ! field ) throw new Error( 'the chat field is mounted' );
    return field;
}

function key( target: EventTarget, type: 'keydown' | 'keyup', code: string, k = code ) {
    return act( async () => {
        target.dispatchEvent( new KeyboardEvent( type, { code, key: k, bubbles: true } ) );
    } );
}

let detachKeyboard = (): void => {};

beforeEach( () => {
    bus.reset();
    bus.state.phase = PHASE.lobby;
    counts.ChatLines = 0;
    counts.Roster = 0;
    send.mockClear();
    detachKeyboard = attachKeyboard();
} );

afterEach( async () => {
    detachKeyboard();
    await unmountOverlays();
} );

describe( 'Lobby chat', () => {
    it( 'keeps game keys typed into the chat field away from every window listener', async () => {
        const host = await mountOverlays();
        const field = chatField( host );
        field.focus();
        const windowKeys = vi.fn();
        addEventListener( 'keydown', windowKeys );

        for ( const code of [ 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyE', 'KeyM', 'Backquote', 'Enter' ] ) {
            await key( field, 'keydown', code );
        }
        removeEventListener( 'keydown', windowKeys );

        expect( windowKeys ).not.toHaveBeenCalled();
        expect( keyboardInput.throttle ).toBe( 0 );
        expect( keyboardInput.strafe ).toBe( 0 );
        expect( keyboardInput.jump ).toBe( false );
        expect( send ).not.toHaveBeenCalledWith( SET_CLASS_MESSAGE, expect.anything() );
        expect( send ).not.toHaveBeenCalledWith( START_MESSAGE );
    } );

    it( 'lets a keyup from the chat field release a key held before focus', async () => {
        const host = await mountOverlays();
        await key( document.body, 'keydown', 'KeyW' );
        expect( keyboardInput.throttle ).toBe( 1 );

        const field = chatField( host );
        field.focus();
        await key( field, 'keyup', 'KeyW' );
        expect( keyboardInput.throttle ).toBe( 0 );
    } );

    it( 'blurs the field on Escape', async () => {
        const host = await mountOverlays();
        const field = chatField( host );
        field.focus();
        await key( field, 'keydown', 'Escape' );
        expect( document.activeElement ).not.toBe( field );
    } );

    it( 'sends the trimmed text on submit, clears the field, and sends nothing when blank', async () => {
        const host = await mountOverlays();
        const field = chatField( host );
        field.value = '  gg all  ';
        await act( async () => {
            field.form?.requestSubmit();
        } );
        expect( send ).toHaveBeenCalledWith( CHAT_SEND_MESSAGE, 'gg all' );
        expect( field.value ).toBe( '' );

        send.mockClear();
        field.value = '   ';
        await act( async () => {
            field.form?.requestSubmit();
        } );
        expect( send ).not.toHaveBeenCalled();
    } );

    it( 'renders an incoming line in ChatLines only, never re-rendering Roster', async () => {
        let deliver: ( payload: unknown ) => void = () => {};
        attachChatStore( {
            send: () => {},
            onMessage: ( type, cb ) => {
                if ( type === CHAT_LINE_MESSAGE ) deliver = cb as ( payload: unknown ) => void;
            },
            onReconnect: () => {},
        } );
        const host = await mountOverlays();
        counts.ChatLines = 0;
        counts.Roster = 0;

        await act( async () => {
            deliver( { id: 1, from: 'other', name: 'Bob', colorId: 2, text: 'race me' } );
        } );

        expect( counts.ChatLines ).toBe( 1 );
        expect( counts.Roster ).toBe( 0 );
        expect( host.textContent ).toContain( 'race me' );
    } );
} );
