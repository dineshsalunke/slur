import { describe, expect, it } from 'vitest';
import { type Action, onAction, press } from './actions';
import { BINDINGS, keyOf } from './bindings';
import { keyAction } from './keyboard';

function key( code: string, extra: Partial< KeyboardEvent > = {} ): KeyboardEvent {
    return {
        code,
        repeat: false,
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        target: null,
        ...extra,
    } as KeyboardEvent;
}

describe( 'action map', () => {
    it( 'delivers each press to every listener until it unsubscribes', () => {
        const a: Action[] = [];
        const b: Action[] = [];
        const offA = onAction( ( action ) => a.push( action ) );
        const offB = onAction( ( action ) => b.push( action ) );
        press( 'fireForward' );
        offA();
        press( 'mute' );
        offB();
        press( 'drop' );
        expect( a ).toEqual( [ 'fireForward' ] );
        expect( b ).toEqual( [ 'fireForward', 'mute' ] );
    } );

    it( 'keeps the #368 keyboard bindings', () => {
        expect( [ 'KeyE', 'KeyD', 'KeyS', 'KeyF', 'KeyX', 'KeyM' ].map( ( c ) => keyAction( key( c ) ) ) ).toEqual( [
            'fireForward',
            'fireBack',
            'previous',
            'next',
            'drop',
            'mute',
        ] );
    } );

    it( 'names the key for each keyboard action, and none for start', () => {
        expect( keyOf( 'fireForward' ) ).toBe( 'KeyE' );
        expect( keyOf( 'mute' ) ).toBe( 'KeyM' );
        expect( keyOf( 'start' ) ).toBe( '' );
    } );

    it( 'binds no action to an old or unrelated key (#368)', () => {
        for ( const code of [
            'ControlRight',
            'ControlLeft',
            'ShiftLeft',
            'ShiftRight',
            'ArrowUp',
            'Digit2',
            'Digit3',
            'KeyR',
            'Enter',
            'Space',
        ] ) {
            expect( keyAction( key( code ) ) ).toBeNull();
        }
    } );

    it( 'leaves Ctrl, Meta and Alt chords to the browser; Shift does not block a key', () => {
        expect( keyAction( key( 'KeyE', { ctrlKey: true } ) ) ).toBeNull();
        expect( keyAction( key( 'KeyE', { metaKey: true } ) ) ).toBeNull();
        expect( keyAction( key( 'KeyM', { altKey: true } ) ) ).toBeNull();
        expect( keyAction( key( 'KeyE', { shiftKey: true } ) ) ).toBe( 'fireForward' );
    } );

    it( 'ignores repeated keys and keys typed into a field', () => {
        expect( keyAction( key( 'KeyF', { repeat: true } ) ) ).toBeNull();
        const field = { tagName: 'INPUT', isContentEditable: false } as unknown as EventTarget;
        expect( keyAction( key( 'KeyM', { target: field } ) ) ).toBeNull();
    } );

    it( 'binds every d-pad arm and the pad Start button', () => {
        expect( BINDINGS.touch ).toEqual( { up: 'fireForward', down: 'fireBack', left: 'previous', right: 'next' } );
        expect( BINDINGS.pad ).toContainEqual( [ 9, 'start' ] );
    } );
} );
