import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * The frame tap's SERVER half: pull a rendered frame out of a browser tab nobody is looking at, as a PNG on
 * disk, in DEV ONLY. The client half is `app/dev/frame-tap.tsx`; read that one for what actually renders.
 *
 * THE PROBLEM. Every visual review here needed a Chrome tab to be frontmost, because a backgrounded tab is
 * `visibilityState: "hidden"` and the browser stops calling `requestAnimationFrame` — and R3F's frameloop is
 * nothing but `requestAnimationFrame(loop)`. That is spec behaviour, not a setting, so the fix is to stop
 * being a client of the browser's clock. `@react-three/fiber` 9.7.0 exports `advance()`, which drives one
 * frame on demand and checks neither `frameloop` nor `internal.active` nor `internal.frames` — so it works on
 * a live `frameloop="always"` root whose rAF has simply stopped being called, with nothing about the visible
 * tab's behaviour changed.
 *
 * HOW THE PNG REACHES DISK. Five mechanisms were weighed:
 *
 *   1. Return a data-URL string through the browser-automation bridge. A lane cannot SEE an image that way
 *      and neither can the owner, and a 4 MP PNG as base64 is megabytes of string through the bridge and
 *      into a transcript. Rejected — it fails the entire point, which is asynchronous review.
 *   2. `<a download>` + a programmatic click. Needs a user gesture, lands in the browser's download
 *      directory with no path control, and is inert in an automated tab. Rejected.
 *   3. A CDP / `computer screenshot` capture of the page. Composites the page rather than the tapped frame,
 *      and it FORCES a canvas measure — it has already been observed resizing a 300x150 canvas to 3456x1882
 *      in a tab that was still hidden with rAF dead. The instrument would alter the thing it measures.
 *      Rejected.
 *   4. OPFS / IndexedDB / `showSaveFilePicker`. Either not on disk where a human can open it, or needs a
 *      gesture. Rejected.
 *   5. THIS — `canvas.toDataURL()` in the page, POSTed as binary to a dev-only connect middleware that
 *      writes the file. Same shape as `art-refs-plugin.ts` one directory up the same road. Chosen.
 *
 * HOW THE PUMP IS DRIVEN. The page is told to pump over Vite's HMR channel (`server.hot.send` here,
 * `import.meta.hot.on` there) rather than through a browser-automation evaluate. The consequence is the
 * deliverable, not an elegance: a tap is an ordinary HTTP request, so a lane, the supervisor or the owner can
 * pull a frame with `curl` from any desktop, against any Chrome that merely has the route open — no
 * extension pairing, no CDP, no 45-second evaluate timeout, no multi-megabyte string crossing a bridge. It is
 * also dev-only BY CONSTRUCTION rather than by convention: `import.meta.hot` is undefined in a production
 * build, so the client half physically cannot ship, and `apply: 'serve'` keeps this half out of it too.
 *
 * FAILING LOUDLY IS THE WHOLE CONTRACT. This instrument's natural failure modes are silent: nothing answers
 * (no tab open, HMR disconnected), or SEVERAL tabs have the route open and all of them answer. Three lanes
 * share one Chrome, so more than one tab on a port is likely rather than hypothetical. A tap that quietly
 * returned a stale or someone-else's frame would be worse than no instrument at all, because every downstream
 * art judgement would silently inherit it. So: zero responders is a 504, several responders is a 409 that
 * names them and writes NOTHING, and last-write-wins does not exist here.
 *
 * GET, not POST, for the trigger — it writes a file, so it is not the REST-correct verb, but `curl <url>`
 * with no flags is the interface this exists to provide and that is worth more than the verb.
 */

// A tap name is one path SEGMENT, whitelisted by shape rather than resolved-and-compared: it cannot express
// `..` or a separator, so traversal is impossible by construction. `art-refs-plugin.ts` makes the same
// argument for reads; this half writes, so the stakes are higher and the discipline is the same.
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/i;

// Wall-clock budget for a page to answer at all, and the window kept open AFTER the first answer to catch a
// second responder. The settle window is what turns "several tabs answered" from a race into a detection.
const DEFAULT_TIMEOUT_MS = 8_000;
const SETTLE_MS = 400;

// A 4 MP PNG is a few MB; 64 is headroom, not a target. Guards against a runaway body on a localhost socket.
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

/** Validates a caller-supplied tap name. Exported for its test — the traversal argument above is the point. */
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

/**
 * Decides what a set of uploads means. Pure, and exported because this — not the file write — is the part
 * whose failure would be invisible.
 */
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

    // Keyed on distinct href, NOT on upload count: one responder legitimately sends two uploads when the
    // bloom-off A/B is requested.
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
            // A page that cannot tap at all (no WebGL, an exception mid-pump) reports instead of just never
            // answering — otherwise its failure is indistinguishable from "no tab is open", which is the one
            // ambiguity this instrument must not have.
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

            // Connect strips the mount prefix, so `req.url` is `/` for a tap and `/upload` for an upload.
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
                    // The tap already timed out, or this is a stray upload. Say so rather than writing a file
                    // nobody is waiting for.
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

                    // First answer starts the settle window; every later answer within it joins this tap, so a
                    // second tab is DETECTED rather than racing.
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
                // Warm-up exists because `update()` takes its delta from `state.clock.getDelta()` — wall time
                // since the last frame FROM ANY SOURCE. In a tab whose rAF has been dead for 40 s the first
                // pumped frame carries a ~40 s delta. The shared `createFixedStep` caps that at 5 sim steps
                // and drops the backlog, so the ship does not teleport, but the chase camera damps against the
                // raw delta and snaps. Warm-up absorbs that lurch; the captured frame is a settled one.
                const warmup = Math.round( num( 'warmup', 8 ) );
                const frames = Math.max( 1, Math.round( num( 'frames', 8 ) ) );
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
                            // The suffix is a server-side literal and `name` is shape-whitelisted, so the
                            // joined path cannot leave `dir`.
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
                            // firstDelta is the rAF-liveness reading — see the README. capturedDelta describes
                            // the frame actually photographed, so a caller can tell a settled frame from a
                            // warm one instead of trusting that it settled.
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
