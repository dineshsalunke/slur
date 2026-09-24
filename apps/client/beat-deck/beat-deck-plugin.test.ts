import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { saveTake, slugOf, takeFileName } from './beat-deck-plugin';

const AT = new Date( '2026-09-25T10:11:12.345Z' );
const HOSTILE = [ '../../../etc/passwd', '..\\..\\x.mp3', '/abs/path.mp3', 'a/../../b.json', '..', '', '....mp3' ];

let scratch = '';

function takesDir(): string {
    scratch = mkdtempSync( join( tmpdir(), 'beat-deck-' ) );
    return join( scratch, 'takes' );
}

afterEach( () => {
    if ( scratch ) rmSync( scratch, { recursive: true, force: true } );
    scratch = '';
} );

describe( 'takeFileName', () => {
    it( 'builds the name from a slug of the song and the time', () => {
        expect( takeFileName( 'Imagine Dragons - Believer.mp3', AT ) ).toBe(
            'take-imagine-dragons-believer-2026-09-25T10-11-12-345Z.json',
        );
    } );

    it( 'never holds a separator or a dot segment, whatever the song name', () => {
        for ( const name of HOSTILE ) {
            const file = takeFileName( name, AT );
            expect( file ).toMatch( /^take-[a-z0-9-]+-[0-9TZ-]+\.json$/ );
            expect( file ).not.toContain( '..' );
            expect( slugOf( name ) ).not.toMatch( /[/\\.]/ );
        }
    } );
} );

describe( 'saveTake', () => {
    it( 'writes the take inside the takes dir for hostile song names', () => {
        const dir = takesDir();
        HOSTILE.forEach( ( name, i ) => {
            const at = new Date( AT.getTime() + i );
            const saved = saveTake( dir, JSON.stringify( { version: 1, song: { name } } ), at );
            expect( saved.ok ).toBe( true );
        } );
        expect( readdirSync( dir ) ).toHaveLength( HOSTILE.length );
        expect( readdirSync( scratch ) ).toEqual( [ 'takes' ] );
        expect( readdirSync( dirname( scratch ) ) ).not.toContain( 'passwd' );
    } );

    it( 'stores the posted body unchanged and reports its size', () => {
        const dir = takesDir();
        const body = JSON.stringify( { version: 1, song: { name: 'a.mp3' }, ticks: { tick: [ 0, 1 ] } } );
        const saved = saveTake( dir, body, AT );
        if ( ! saved.ok ) throw new Error( saved.error );
        expect( readFileSync( join( dir, saved.file ), 'utf8' ) ).toBe( body );
        expect( saved.bytes ).toBe( body.length );
    } );

    it( 'rejects a body that is not a take', () => {
        const dir = takesDir();
        expect( saveTake( dir, 'not json', AT ) ).toMatchObject( { ok: false, status: 400 } );
        expect( saveTake( dir, 'null', AT ) ).toMatchObject( { ok: false, status: 400 } );
        expect( saveTake( dir, JSON.stringify( { song: { name: 'a' } } ), AT ) ).toMatchObject( { ok: false } );
        expect( saveTake( dir, JSON.stringify( { version: 1, song: { name: 7 } } ), AT ) ).toMatchObject( {
            ok: false,
        } );
    } );
} );
