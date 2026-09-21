import { advance, useFrame, useStore } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { type DeltaLog, pumpAndCapture, recordDelta } from './frame-tap-pump';

export function FrameTap() {
    const store = useStore();
    const log = useRef< DeltaLog >( { first: 0, last: 0, frames: 0 } );

    useFrame( ( _state, delta ) => recordDelta( log.current, delta ), 0 );

    // JUSTIFIED EFFECT — external sync, which is the one job Effects are for: `import.meta.hot` is Vite's HMR
    useEffect( () => {
        const hot = import.meta.hot;
        if ( ! hot ) return;

        const report = ( id: string, err: unknown ): void => {
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
