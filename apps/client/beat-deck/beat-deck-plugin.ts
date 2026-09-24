import { mkdirSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

const MAX_TAKE_BYTES = 64 * 1024 * 1024;
const SLUG_MAX = 48;

export type SaveResult = { ok: true; file: string; bytes: number } | { ok: false; status: number; error: string };

export function slugOf( songName: string ): string {
    const slug = songName
        .replace( /\.[^.]*$/, '' )
        .toLowerCase()
        .replace( /[^a-z0-9]+/g, '-' )
        .replace( /^-+|-+$/g, '' )
        .slice( 0, SLUG_MAX );
    return slug || 'song';
}

export function takeFileName( songName: string, at: Date ): string {
    return `take-${ slugOf( songName ) }-${ at.toISOString().replace( /[:.]/g, '-' ) }.json`;
}

function songNameOf( take: unknown ): string | null {
    if ( typeof take !== 'object' || take === null ) return null;
    const { version, song } = take as { version?: unknown; song?: { name?: unknown } };
    if ( typeof version !== 'number' || typeof song?.name !== 'string' ) return null;
    return song.name;
}

export function saveTake( dir: string, body: string, at: Date ): SaveResult {
    let take: unknown;
    try {
        take = JSON.parse( body );
    } catch {
        return { ok: false, status: 400, error: 'take is not JSON' };
    }
    const songName = songNameOf( take );
    if ( songName === null ) return { ok: false, status: 400, error: 'take needs a numeric version and song.name' };
    const root = resolve( dir );
    const file = takeFileName( songName, at );
    const path = resolve( root, file );
    if ( ! path.startsWith( root + sep ) ) return { ok: false, status: 400, error: 'take path escapes the takes dir' };
    mkdirSync( root, { recursive: true } );
    writeFileSync( path, body, { flag: 'wx' } );
    return { ok: true, file, bytes: Buffer.byteLength( body ) };
}

function readBody( req: IncomingMessage ): Promise< string > {
    return new Promise( ( done, fail ) => {
        const chunks: Buffer[] = [];
        let size = 0;
        req.on( 'data', ( chunk: Buffer ) => {
            size += chunk.length;
            if ( size > MAX_TAKE_BYTES ) {
                fail( new Error( 'take too large' ) );
                req.destroy();
                return;
            }
            chunks.push( chunk );
        } );
        req.on( 'end', () => done( Buffer.concat( chunks ).toString( 'utf8' ) ) );
        req.on( 'error', fail );
    } );
}

function sendJson( res: ServerResponse, status: number, body: unknown ): void {
    res.statusCode = status;
    res.setHeader( 'content-type', 'application/json' );
    res.end( JSON.stringify( body ) );
}

export function beatDeckPlugin( { dir }: { dir: string } ): Plugin {
    return {
        name: 'slur-beat-deck',
        apply: 'serve',
        configureServer( server ) {
            server.middlewares.use( '/__beat-deck/take', ( req, res ) => {
                if ( req.method !== 'POST' ) return sendJson( res, 405, { error: 'POST a take' } );
                readBody( req )
                    .then( ( body ) => {
                        const saved = saveTake( dir, body, new Date() );
                        if ( saved.ok ) sendJson( res, 200, { file: saved.file, bytes: saved.bytes } );
                        else sendJson( res, saved.status, { error: saved.error } );
                    } )
                    .catch( ( e: unknown ) => sendJson( res, 413, { error: String( e ) } ) );
            } );
        },
    };
}
