import { MatchMakeError } from '@colyseus/sdk';
import { PUBLIC_ROOM_TAKEN_CODE, ROOM_NOT_FOUND_CODE, TOO_MANY_WRONG_CODES_CODE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { NO_SERVER, QUICK_PLAY_FULL, RUN_FULL, TOO_MANY_WRONG_CODES } from './menu-form';
import { menuErrorFor, menuIntent } from './menu-form.utils';

describe( 'menuIntent (#340)', () => {
    it( 'reads quick and join, and treats anything else as create', () => {
        expect( menuIntent( 'quick' ) ).toBe( 'quick' );
        expect( menuIntent( 'join' ) ).toBe( 'join' );
        expect( menuIntent( 'create' ) ).toBe( 'create' );
        expect( menuIntent( null ) ).toBe( 'create' );
    } );
} );

describe( 'menuErrorFor (#340)', () => {
    it( 'names the code when no run has it', () => {
        const error = new MatchMakeError( 'room "K7QXM" not found', ROOM_NOT_FOUND_CODE );
        expect( menuErrorFor( 'join', 'K7QXM', error ) ).toBe( 'No run with code K7QXM.' );
    } );

    it( 'says full when the run is locked', () => {
        const error = new MatchMakeError( 'room "K7QXM" is locked', ROOM_NOT_FOUND_CODE );
        expect( menuErrorFor( 'join', 'K7QXM', error ) ).toBe( RUN_FULL );
    } );

    it( 'asks the player to wait after too many wrong codes', () => {
        const error = new MatchMakeError( 'Too many failed joins', TOO_MANY_WRONG_CODES_CODE );
        expect( menuErrorFor( 'join', 'K7QXM', error ) ).toBe( TOO_MANY_WRONG_CODES );
    } );

    it( 'points quick play at a private room when the public slot is taken', () => {
        const error = new MatchMakeError( 'Quick play is full', PUBLIC_ROOM_TAKEN_CODE );
        expect( menuErrorFor( 'quick', '', error ) ).toBe( QUICK_PLAY_FULL );
    } );

    it( 'blames the connection for anything else', () => {
        expect( menuErrorFor( 'create', '', new TypeError( 'fetch failed' ) ) ).toBe( NO_SERVER );
        expect( menuErrorFor( 'create', '', new MatchMakeError( 'x', 500 ) ) ).toBe( NO_SERVER );
    } );
} );
