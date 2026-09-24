import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const SONG = /\.(mp3|wav|ogg|flac|m4a)$/i;
const RATE_MIN = 0.5;
const RATE_MAX = 1;

function fail( res: ServerResponse, status: number, error: string ): void {
    res.statusCode = status;
    res.setHeader( 'content-type', 'application/json' );
    res.end( JSON.stringify( { error } ) );
}

function listSongs( dir: string ): unknown[] {
    if ( ! existsSync( dir ) ) return [];
    return readdirSync( dir )
        .filter( ( f ) => SONG.test( f ) )
        .map( ( file ) => {
            const analysisPath = join( dir, file.replace( SONG, '.analysis.json' ) );
            return existsSync( analysisPath ) ? JSON.parse( readFileSync( analysisPath, 'utf8' ) ) : { song: file };
        } );
}

function streamClip( res: ServerResponse, file: string, from: number, to: number, rate: number ): void {
    const args = [ '-v', 'error', '-ss', String( from ), '-to', String( to ), '-i', file ];
    args.push( '-af', `atempo=${ rate }`, '-ac', '2', '-ar', '44100', '-f', 'wav', '-' );
    const ff = spawn( 'ffmpeg', args );
    res.setHeader( 'content-type', 'audio/wav' );
    ff.stdout.pipe( res );
    ff.stderr.pipe( process.stderr );
    ff.on( 'error', ( e ) => fail( res, 500, String( e ) ) );
    res.on( 'close', () => ff.kill() );
}

export function tapperPlugin( { dir }: { dir: string } ): Plugin {
    return {
        name: 'slur-tapper',
        apply: 'serve',
        configureServer( server ) {
            server.middlewares.use( '/__tapper/songs', ( _req, res ) => {
                res.setHeader( 'content-type', 'application/json' );
                res.end( JSON.stringify( listSongs( dir ) ) );
            } );
            server.middlewares.use( '/__tapper/clip', ( req, res ) => {
                const q = new URL( req.url ?? '', 'http://x' ).searchParams;
                const song = q.get( 'song' ) ?? '';
                const from = Number( q.get( 'from' ) );
                const to = Number( q.get( 'to' ) );
                const rate = Number( q.get( 'rate' ) ?? 1 );
                const known = existsSync( dir ) && readdirSync( dir ).includes( song ) && SONG.test( song );
                if ( ! known ) return fail( res, 404, `no song ${ JSON.stringify( song ) } in ${ dir }` );
                if ( ! ( from >= 0 && to > from ) ) return fail( res, 400, 'need 0 <= from < to' );
                if ( ! ( rate >= RATE_MIN && rate <= RATE_MAX ) ) return fail( res, 400, 'rate must be 0.5..1' );
                streamClip( res, join( dir, song ), from, to, rate );
            } );
        },
    };
}
