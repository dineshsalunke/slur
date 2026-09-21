import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/i;

const DEFAULT_TIMEOUT_MS = 45_000;
const SETTLE_MS = 400;

const MAX_UPLOAD_BYTES = 64 * 1024 * 1024;

export type TapKind = 'composed' | 'bloom-off';

export type TapUpload = {
    href: string;
    kind: TapKind;
    firstDelta: number;
    capturedDelta: number;
    pumped: number;
    png: Buffer;
};

export type TapVerdict =
    | { ok: true; uploads: TapUpload[] }
    | { ok: false; status: number; error: string; responders?: string[] };

export function validateTapName( raw: string | null ): { ok: true; name: string } | { ok: false; error: string } {
    const name = raw ?? 'frame';
    if ( ! NAME.test( name ) ) {
        return {
            ok: false,
            error: `frame-tap: bad name ${ JSON.stringify( name ) }. Allowed: /^[a-z0-9][a-z0-9-]{0,63}$/i — one segment, no dots, no separators.`,
        };
    }
    return { ok: true, name };
}

export function arbitrate( uploads: TapUpload[] ): TapVerdict {
    if ( uploads.length === 0 ) {
        return {
            ok: false,
            status: 504,
            error:
                'frame-tap: nobody answered. Is a lab route open on this dev server, in ANY Chrome window? ' +
                'The tab does NOT need to be focused or extension-paired — it does need to be loaded, and its ' +
                'HMR socket connected (a tab left open across a dev-server restart is not).',
        };
    }

    const responders = [ ...new Set( uploads.map( ( u ) => u.href ) ) ];
    if ( responders.length > 1 ) {
        return {
            ok: false,
            status: 409,
            error:
                `frame-tap: ${ responders.length } tabs answered and there is no way to tell which frame you ` +
                'wanted, so nothing was written. Close all but one, then tap again.',
            responders,
        };
    }

    return { ok: true, uploads };
}

export function frameTapPlugin( { dir, route = '/__frame-tap' }: { dir: string; route?: string } ): Plugin {
    type Pending = {
        uploads: TapUpload[];
        settle: ReturnType< typeof setTimeout > | null;
        deadline: ReturnType< typeof setTimeout >;
        done: ( verdict: TapVerdict ) => void;
    };
    const pending = new Map< string, Pending >();

    return {
        name: 'slur:frame-tap',
        apply: 'serve',
        configureServer( server ) {
            server.hot.on( 'slur:frame-tap:error', ( data: { id?: string; href?: string; message?: string } ) => {
                const entry = data?.id ? pending.get( data.id ) : undefined;
                if ( ! entry ) return;
                clearTimeout( entry.deadline );
                if ( entry.settle ) clearTimeout( entry.settle );
                pending.delete( data.id as string );
                entry.done( {
                    ok: false,
                    status: 502,
                    error: `frame-tap: the page at ${ data.href ?? '(unknown)' } failed to tap: ${ data.message ?? 'unknown error' }`,
                } );
            } );

            server.middlewares.use( route, ( req, res, next ) => {
                const url = new URL( req.url ?? '/', 'http://localhost' );

                if ( url.pathname === '/upload' ) {
                    handleUpload( req, res );
                    return;
                }
                if ( url.pathname !== '/' ) {
                    next();
                    return;
                }
                handleTap( url, res );
            } );

            function json( res: import('node:http').ServerResponse, status: number, body: unknown ): void {
                res.statusCode = status;
                res.setHeader( 'Content-Type', 'application/json' );
                res.end( `${ JSON.stringify( body, null, 4 ) }\n` );
            }

            function handleUpload(
                req: import('node:http').IncomingMessage,
                res: import('node:http').ServerResponse,
            ): void {
                const url = new URL( req.url ?? '/', 'http://localhost' );
                const id = url.searchParams.get( 'id' ) ?? '';
                const entry = pending.get( id );
                if ( ! entry ) {
                    json( res, 410, {
                        error: `frame-tap: no tap is waiting for id ${ JSON.stringify( id ) } (timed out?)`,
                    } );
                    return;
                }

                const chunks: Buffer[] = [];
                let size = 0;
                req.on( 'data', ( c: Buffer ) => {
                    size += c.length;
                    if ( size > MAX_UPLOAD_BYTES ) {
                        req.destroy();
                        return;
                    }
                    chunks.push( c );
                } );
                req.on( 'end', () => {
                    const header = ( k: string ): string => String( req.headers[ k ] ?? '' );
                    entry.uploads.push( {
                        href: header( 'x-frame-tap-href' ) || '(unknown)',
                        kind: header( 'x-frame-tap-kind' ) === 'bloom-off' ? 'bloom-off' : 'composed',
                        firstDelta: Number( header( 'x-frame-tap-first-delta' ) ) || 0,
                        capturedDelta: Number( header( 'x-frame-tap-captured-delta' ) ) || 0,
                        pumped: Number( header( 'x-frame-tap-pumped' ) ) || 0,
                        png: Buffer.concat( chunks ),
                    } );

                    if ( ! entry.settle ) {
                        clearTimeout( entry.deadline );
                        entry.settle = setTimeout( () => {
                            pending.delete( id );
                            entry.done( arbitrate( entry.uploads ) );
                        }, SETTLE_MS );
                    }
                    json( res, 200, { ok: true } );
                } );
            }

            function handleTap( url: URL, res: import('node:http').ServerResponse ): void {
                const named = validateTapName( url.searchParams.get( 'name' ) );
                if ( ! named.ok ) {
                    json( res, 400, { error: named.error } );
                    return;
                }

                const num = ( key: string, fallback: number ): number => {
                    const v = Number( url.searchParams.get( key ) );
                    return Number.isFinite( v ) && v >= 0 ? v : fallback;
                };
                const warmup = Math.round( num( 'warmup', 6 ) );
                const frames = Math.max( 1, Math.round( num( 'frames', 2 ) ) );
                const ab = url.searchParams.get( 'ab' ) === '1';
                const timeoutMs = Math.max( 250, num( 'timeout', DEFAULT_TIMEOUT_MS ) );

                const id = `${ Date.now().toString( 36 ) }-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;

                const entry: Pending = {
                    uploads: [],
                    settle: null,
                    deadline: setTimeout( () => {
                        pending.delete( id );
                        entry.done( arbitrate( [] ) );
                    }, timeoutMs ),
                    done: ( verdict ) => {
                        if ( ! verdict.ok ) {
                            json( res, verdict.status, { error: verdict.error, responders: verdict.responders } );
                            return;
                        }

                        mkdirSync( dir, { recursive: true } );
                        const written: Record< string, string > = {};
                        for ( const u of verdict.uploads ) {
                            const file = join(
                                dir,
                                u.kind === 'bloom-off' ? `${ named.name }.bloom-off.png` : `${ named.name }.png`,
                            );
                            writeFileSync( file, u.png );
                            written[ u.kind ] = file;
                        }

                        const lead = verdict.uploads[ 0 ];
                        json( res, 200, {
                            ok: true,
                            files: written,
                            href: lead.href,
                            pumped: lead.pumped,
                            firstDeltaSeconds: lead.firstDelta,
                            capturedDeltaSeconds: lead.capturedDelta,
                        } );
                    },
                };
                pending.set( id, entry );

                server.hot.send( 'slur:frame-tap:request', { id, warmup, frames, ab, route } );
            }
        },
    };
}
