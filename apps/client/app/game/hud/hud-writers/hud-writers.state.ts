export type HudWriter = ( nowMs: number ) => void;

const writers = new Map< string, HudWriter >();

export function addHudWriter( id: string, write: HudWriter ): () => void {
    writers.set( id, write );
    return () => {
        if ( writers.get( id ) === write ) writers.delete( id );
    };
}

export function writeHud(): void {
    const now = performance.now();
    for ( const write of writers.values() ) write( now );
}
