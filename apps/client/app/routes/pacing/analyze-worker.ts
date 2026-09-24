import { analyzeDescriptor, type PacingOptions, type PacingReport, procgenDescriptor } from '@slur/shared';

export interface AnalyzeRequest {
    id: number;
    seed: number;
    options: PacingOptions;
}

export type AnalyzeReply = { id: number; report: PacingReport } | { id: number; error: string };

function reply( message: AnalyzeReply ): void {
    self.postMessage( message );
}

self.addEventListener( 'message', ( e: MessageEvent< AnalyzeRequest > ) => {
    const { id, seed, options } = e.data;
    try {
        reply( { id, report: analyzeDescriptor( procgenDescriptor( seed ), options ) } );
    } catch ( err ) {
        reply( { id, error: err instanceof Error ? err.message : String( err ) } );
    }
} );
