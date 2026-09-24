export function canFullscreen(): boolean {
    return typeof document !== 'undefined' && document.fullscreenEnabled === true;
}

export function isFullscreen(): boolean {
    return document.fullscreenElement !== null;
}

export function subscribeFullscreen( listener: () => void ): () => void {
    document.addEventListener( 'fullscreenchange', listener );
    return () => document.removeEventListener( 'fullscreenchange', listener );
}

export async function toggleFullscreen(): Promise< void > {
    try {
        if ( document.fullscreenElement ) {
            await document.exitFullscreen();
            return;
        }
        await document.documentElement.requestFullscreen( { navigationUI: 'hide' } );
        await screen.orientation?.lock?.( 'landscape' );
    } catch {}
}
