import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve, sep } from 'node:path';
import { isLevelSlug, parseAuthoredLevel, serializeAuthoredLevel } from '@slur/shared';
import type { Plugin } from 'vite';

const MAX_TRACK_BYTES = 8 * 1024 * 1024;

export interface TrackSummary {
    id: string;
    name: string;
    length: number;
    savedAt: string;
}

export type TrackResult< T > = { ok: true; value: T } | { ok: false; status: number; error: string };

function trackPath( dir: string, slug: string ): string | null {
    if ( ! isLevelSlug( slug ) ) return null;
    const root = resolve( dir );
    const path = resolve( root, `${ slug }.json` );
    return path.startsWith( root + sep ) ? path : null;
}

export function listTracks( dir: string ): TrackSummary[] {
    if ( ! existsSync( dir ) ) return [];
    return readdirSync( dir )
        .filter( ( f ) => f.endsWith( '.json' ) )
        .flatMap( ( f ) => {
            try {
                const { id, name, length, savedAt } = parseAuthoredLevel(
                    JSON.parse( readFileSync( resolve( dir, f ), 'utf8' ) ),
                );
                return [ { id, name, length, savedAt } ];
            } catch {
                return [];
            }
        } )
        .sort( ( a, b ) => a.id.localeCompare( b.id ) );
}

export function readTrack( dir: string, slug: string ): TrackResult< string > {
    const path = trackPath( dir, slug );
    if ( path === null ) return { ok: false, status: 400, error: 'bad track slug' };
    if ( ! existsSync( path ) ) return { ok: false, status: 404, error: `no track ${ slug }` };
    return { ok: true, value: readFileSync( path, 'utf8' ) };
}

export function saveTrack( dir: string, slug: string, body: string ): TrackResult< { file: string; bytes: number } > {
    const path = trackPath( dir, slug );
    if ( path === null ) return { ok: false, status: 400, error: 'bad track slug' };
    let text: string;
    try {
        const level = parseAuthoredLevel( JSON.parse( body ) );
        if ( level.id !== slug ) return { ok: false, status: 400, error: `level id ${ level.id } is not ${ slug }` };
        text = serializeAuthoredLevel( level );
    } catch ( e ) {
        return { ok: false, status: 400, error: e instanceof Error ? e.message : String( e ) };
    }
    mkdirSync( resolve( dir ), { recursive: true } );
    writeFileSync( path, text );
    return { ok: true, value: { file: `${ slug }.json`, bytes: Buffer.byteLength( text ) } };
}

function readBody( req: IncomingMessage ): Promise< string > {
    return new Promise( ( done, fail ) => {
        const chunks: Buffer[] = [];
        let size = 0;
        req.on( 'data', ( chunk: Buffer ) => {
            size += chunk.length;
            if ( size > MAX_TRACK_BYTES ) {
                fail( new Error( 'track too large' ) );
                req.destroy();
                return;
            }
            chunks.push( chunk );
        } );
        req.on( 'end', () => done( Buffer.concat( chunks ).toString( 'utf8' ) ) );
        req.on( 'error', fail );
    } );
}

function send( res: ServerResponse, status: number, body: string ): void {
    res.statusCode = status;
    res.setHeader( 'content-type', 'application/json' );
    res.setHeader( 'cache-control', 'no-store' );
    res.end( body );
}

function sendResult< T >( res: ServerResponse, r: TrackResult< T >, body: ( v: T ) => string ): void {
    if ( r.ok ) send( res, 200, body( r.value ) );
    else send( res, r.status, JSON.stringify( { error: r.error } ) );
}

function slugOfUrl( url: string | undefined ): string {
    const raw = ( url ?? '/' ).split( '?' )[ 0 ].replace( /^\/+|\/+$/g, '' );
    try {
        return decodeURIComponent( raw );
    } catch {
        return raw;
    }
}

export function tracksPlugin( { dir }: { dir: string } ): Plugin {
    return {
        name: 'slur-tracks',
        apply: 'serve',
        configureServer( server ) {
            server.middlewares.use( '/__tracks', ( req, res ) => {
                const slug = slugOfUrl( req.url );
                if ( slug === '' ) {
                    if ( req.method !== 'GET' ) return send( res, 405, JSON.stringify( { error: 'GET the list' } ) );
                    return send( res, 200, JSON.stringify( listTracks( dir ) ) );
                }
                if ( req.method === 'GET' ) return sendResult( res, readTrack( dir, slug ), ( text ) => text );
                if ( req.method !== 'POST' )
                    return send( res, 405, JSON.stringify( { error: 'GET or POST a track' } ) );
                readBody( req )
                    .then( ( body ) => sendResult( res, saveTrack( dir, slug, body ), ( v ) => JSON.stringify( v ) ) )
                    .catch( ( e: unknown ) => send( res, 413, JSON.stringify( { error: String( e ) } ) ) );
            } );
        },
    };
}
