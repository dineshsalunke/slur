import { readFileSync } from 'node:fs';
import { COLOR_COUNT } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { PLAYER_BG, playerBg } from './colors';

const css = readFileSync( new URL( '../app.css', import.meta.url ), 'utf8' );
const tokens = [ ...css.matchAll( /--color-player-(\d+):\s*#[0-9a-f]{6};/gi ) ].map( ( m ) => Number( m[ 1 ] ) );

describe( 'player colours', () => {
    it( 'has one @theme token per colour id, in order', () => {
        expect( tokens ).toEqual( Array.from( { length: COLOR_COUNT }, ( _, i ) => i ) );
    } );

    it( 'maps each colour id to the class of its own token', () => {
        expect( PLAYER_BG ).toEqual( tokens.map( ( i ) => `bg-player-${ i }` ) );
    } );

    it( 'falls back to the first colour for an unknown id', () => {
        expect( playerBg( COLOR_COUNT ) ).toBe( 'bg-player-0' );
    } );
} );
