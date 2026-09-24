import type { PacingReport } from '@slur/shared';
import type { AnalyzeReply, AnalyzeRequest } from './analyze-worker';

interface Pending {
    resolve: ( report: PacingReport ) => void;
    reject: ( err: Error ) => void;
}

const pending = new Map< number, Pending >();
let worker: Worker | null = null;
let nextId = 0;

function failAll( err: Error ): void {
    for ( const p of pending.values() ) p.reject( err );
    pending.clear();
    worker?.terminate();
    worker = null;
}

function onReply( e: MessageEvent< AnalyzeReply > ): void {
    const p = pending.get( e.data.id );
    if ( ! p ) return;
    pending.delete( e.data.id );
    if ( 'report' in e.data ) p.resolve( e.data.report );
    else p.reject( new Error( e.data.error ) );
}

function analyzer(): Worker {
    if ( worker ) return worker;
    const w = new Worker( new URL( './analyze-worker.ts', import.meta.url ), { type: 'module' } );
    w.addEventListener( 'message', onReply );
    w.addEventListener( 'error', ( e ) => failAll( new Error( e.message || 'pacing analyze worker failed' ) ) );
    worker = w;
    return w;
}

export function analyzeSeed( seed: number ): Promise< PacingReport > {
    const id = nextId++;
    return new Promise( ( resolve, reject ) => {
        pending.set( id, { resolve, reject } );
        analyzer().postMessage( { id, seed } satisfies AnalyzeRequest );
    } );
}
