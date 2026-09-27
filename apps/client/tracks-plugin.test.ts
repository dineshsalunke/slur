import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { type AuthoredLevel, serializeAuthoredLevel } from '@slur/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { deleteTrack, listTracks, readTrack, saveTrack } from './tracks-plugin';

const HOSTILE = [ '../escape', '..', '/abs', 'a/../../b', 'UPPER', '-dash', 'a.json', '%2e%2e', '' ];

const LEVEL: AuthoredLevel = {
    version: 1,
    id: 'wall-run',
    name: 'Wall run',
    length: 40,
    source: null,
    savedAt: '2026-09-27T00:00:00.000Z',
    blocks: [ { x: -12, z: 300, w: 8, l: 4, destructible: true } ],
    gaps: [],
};

let scratch = '';

function tracksDir(): string {
    scratch = mkdtempSync( join( tmpdir(), 'tracks-' ) );
    return join( scratch, 'tracks' );
}

afterEach( () => {
    if ( scratch ) rmSync( scratch, { recursive: true, force: true } );
    scratch = '';
} );

describe( 'saveTrack', () => {
    it( 'writes the canonical level to <slug>.json and reads it back', () => {
        const dir = tracksDir();
        const body = serializeAuthoredLevel( LEVEL );
        expect( saveTrack( dir, 'wall-run', JSON.stringify( LEVEL ) ) ).toMatchObject( {
            ok: true,
            value: { file: 'wall-run.json' },
        } );
        expect( readFileSync( join( dir, 'wall-run.json' ), 'utf8' ) ).toBe( body );
        expect( readTrack( dir, 'wall-run' ) ).toEqual( { ok: true, value: body } );
    } );

    it( 'overwrites an existing track', () => {
        const dir = tracksDir();
        saveTrack( dir, 'wall-run', serializeAuthoredLevel( LEVEL ) );
        saveTrack( dir, 'wall-run', serializeAuthoredLevel( { ...LEVEL, name: 'Second' } ) );
        expect( readTrack( dir, 'wall-run' ) ).toMatchObject( {
            ok: true,
            value: expect.stringContaining( 'Second' ),
        } );
    } );

    it( 'refuses hostile slugs and never writes outside the dir', () => {
        const dir = tracksDir();
        for ( const slug of HOSTILE ) {
            expect( saveTrack( dir, slug, serializeAuthoredLevel( LEVEL ) ) ).toMatchObject( {
                ok: false,
                status: 400,
            } );
            expect( readTrack( dir, slug ) ).toMatchObject( { ok: false, status: 400 } );
        }
        expect( readdirSync( scratch ) ).toEqual( [] );
        expect( readdirSync( dirname( scratch ) ) ).not.toContain( 'escape.json' );
    } );

    it( 'rejects a body that is not a valid level or names another id', () => {
        const dir = tracksDir();
        expect( saveTrack( dir, 'wall-run', 'not json' ) ).toMatchObject( { ok: false, status: 400 } );
        expect( saveTrack( dir, 'wall-run', JSON.stringify( { ...LEVEL, length: 2 } ) ) ).toMatchObject( {
            ok: false,
        } );
        expect( saveTrack( dir, 'other', serializeAuthoredLevel( LEVEL ) ) ).toMatchObject( { ok: false } );
    } );
} );

describe( 'listTracks and readTrack', () => {
    it( 'lists valid tracks by id and skips broken files', () => {
        const dir = tracksDir();
        saveTrack( dir, 'wall-run', serializeAuthoredLevel( LEVEL ) );
        saveTrack( dir, 'a-first', serializeAuthoredLevel( { ...LEVEL, id: 'a-first', name: 'First' } ) );
        writeFileSync( join( dir, 'broken.json' ), '{' );
        expect( listTracks( dir ) ).toEqual( [
            { id: 'a-first', name: 'First', length: 40, savedAt: LEVEL.savedAt },
            { id: 'wall-run', name: 'Wall run', length: 40, savedAt: LEVEL.savedAt },
        ] );
    } );

    it( 'returns an empty list with no dir and 404 for a missing track', () => {
        const dir = tracksDir();
        expect( listTracks( dir ) ).toEqual( [] );
        expect( readTrack( dir, 'nope' ) ).toMatchObject( { ok: false, status: 404 } );
    } );
} );

describe( 'deleteTrack', () => {
    it( 'removes a known track and leaves the others', () => {
        const dir = tracksDir();
        saveTrack( dir, 'wall-run', serializeAuthoredLevel( LEVEL ) );
        saveTrack( dir, 'a-first', serializeAuthoredLevel( { ...LEVEL, id: 'a-first' } ) );
        expect( deleteTrack( dir, 'wall-run' ) ).toEqual( { ok: true, value: { file: 'wall-run.json' } } );
        expect( readdirSync( dir ) ).toEqual( [ 'a-first.json' ] );
        expect( readTrack( dir, 'wall-run' ) ).toMatchObject( { ok: false, status: 404 } );
    } );

    it( 'answers 404 for an unknown id', () => {
        const dir = tracksDir();
        saveTrack( dir, 'wall-run', serializeAuthoredLevel( LEVEL ) );
        expect( deleteTrack( dir, 'nope' ) ).toMatchObject( { ok: false, status: 404 } );
        expect( readdirSync( dir ) ).toEqual( [ 'wall-run.json' ] );
    } );

    it( 'refuses hostile slugs and deletes nothing outside the dir', () => {
        const dir = tracksDir();
        saveTrack( dir, 'wall-run', serializeAuthoredLevel( LEVEL ) );
        writeFileSync( join( scratch, 'escape.json' ), '{}' );
        for ( const slug of HOSTILE ) {
            expect( deleteTrack( dir, slug ) ).toMatchObject( { ok: false, status: 400 } );
        }
        expect( readdirSync( dir ) ).toEqual( [ 'wall-run.json' ] );
        expect( readdirSync( scratch ).sort() ).toEqual( [ 'escape.json', 'tracks' ] );
    } );
} );
