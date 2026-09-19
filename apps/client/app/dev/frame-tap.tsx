import { advance, useFrame, useStore } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { type DeltaLog, pumpAndCapture, recordDelta } from './frame-tap-pump';

/**
 * The frame tap's CLIENT half: listens on Vite's HMR channel for a tap request, pumps the frameloop by hand,
 * and POSTs the rendered frame back to the dev server, which writes it to disk. `frame-tap-plugin.ts` is the
 * server half and carries the mechanism record; `frame-tap-pump.ts` is the pump and carries the proof that a
 * pumped frame goes through the composer.
 *
 * MOUNT THIS ON LAB ROUTES ONLY — NEVER ON `/game`. Pumping ADVANCES THE SIMULATION; that is precisely why it
 * beats a bare `gl.render`, and precisely why it has no business on a server-authoritative game route, where
 * it would step the sim outside the netcode's clock and desync the client from the server that owns it. The
 * labs run `simulate()` with no room in the path, so stepping them costs nothing.
 *
 * Renders nothing. Holds no state that can re-render anything: the delta log is a ref and the only hook that
 * touches React's lifecycle is the HMR subscription below.
 */
export function FrameTap() {
    const store = useStore();
    const log = useRef< DeltaLog >( { first: 0, last: 0, frames: 0 } );

    // Priority 0 ON PURPOSE. fiber computes `internal.priority` as the COUNT of subscribers with priority > 0,
    // and skips its own `gl.render` whenever that count is non-zero — so a priority-1 observer here would take
    // render ownership away from the EffectComposer and quietly turn bloom off for everyone. At priority 0 this
    // is inert: it runs before the composer, observes the delta every subscriber saw, and changes nothing.
    useFrame( ( _state, delta ) => recordDelta( log.current, delta ), 0 );

    // JUSTIFIED EFFECT — external sync, which is the one job Effects are for: `import.meta.hot` is Vite's HMR
    // socket, a system outside React with its own lifetime, and `on`/`off` is a pure subscribe/unsubscribe
    // bracket. Rejected alternatives: a module-level listener installed at import (would keep answering taps
    // after the route unmounted, making a stale tab a silent second responder — the failure mode the server
    // half exists to prevent); and driving the pump from a `window` global via browser automation, which was
    // weighed and lost because it re-tethers the instrument to a live CDP evaluate. No setState, so this never
    // re-renders. `import.meta.hot` is undefined in a production build, so this component is inert there by
    // construction rather than by a DEV flag.
    useEffect( () => {
        const hot = import.meta.hot;
        if ( ! hot ) return;

        const report = ( id: string, err: unknown ): void => {
            // Never fail silently: a page that cannot tap is otherwise indistinguishable from no page at all,
            // and the caller would read "nobody answered" and go looking for the wrong problem.
            hot.send( 'slur:frame-tap:error', {
                id,
                href: location.href,
                message: err instanceof Error ? `${ err.name }: ${ err.message }` : String( err ),
            } );
        };

        const onRequest = ( data: {
            id: string;
            warmup: number;
            frames: number;
            ab: boolean;
            route: string;
        } ): void => {
            const post = async (
                kind: 'composed' | 'bloom-off',
                dataUrl: string,
                meta: { firstDelta: number; capturedDelta: number; pumped: number },
            ): Promise< void > => {
                const png = await fetch( dataUrl ).then( ( r ) => r.blob() );
                const res = await fetch( `${ data.route }/upload?id=${ encodeURIComponent( data.id ) }`, {
                    method: 'POST',
                    body: png,
                    headers: {
                        'Content-Type': 'image/png',
                        'x-frame-tap-kind': kind,
                        'x-frame-tap-href': location.href,
                        'x-frame-tap-first-delta': String( meta.firstDelta ),
                        'x-frame-tap-captured-delta': String( meta.capturedDelta ),
                        'x-frame-tap-pumped': String( meta.pumped ),
                    },
                } );
                // A non-2xx upload is a FAILED tap, not a delivered one: without this the caller waits out
                // its timeout and reads "nobody answered", which points at the wrong half of the system.
                if ( ! res.ok ) throw new Error( `upload rejected: HTTP ${ res.status } ${ await res.text() }` );
            };

            try {
                const result = pumpAndCapture( {
                    advance,
                    getState: () => store.getState(),
                    log: log.current,
                    now: () => performance.now(),
                    warmup: data.warmup,
                    frames: data.frames,
                    ab: data.ab,
                } );
                const meta = {
                    firstDelta: result.firstDelta,
                    capturedDelta: result.capturedDelta,
                    pumped: result.pumped,
                };
                // The uploads are async, so `void post(…)` would drop their failures into an unhandled
                // rejection and the caller would time out against a page that had already given up. The
                // catch below covers the synchronous pump ONLY; these need their own.
                post( 'composed', result.composed, meta ).catch( ( err ) => report( data.id, err ) );
                if ( result.bloomOff ) {
                    post( 'bloom-off', result.bloomOff, meta ).catch( ( err ) => report( data.id, err ) );
                }
            } catch ( err ) {
                report( data.id, err );
            }
        };

        hot.on( 'slur:frame-tap:request', onRequest );
        return () => hot.off( 'slur:frame-tap:request', onRequest );
    }, [ store ] );

    return null;
}
