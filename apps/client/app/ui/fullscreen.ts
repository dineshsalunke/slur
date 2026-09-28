import { FULLSCREEN_KEY } from './fullscreen.constants';

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

function wantsFullscreen(): boolean {
    try {
        return localStorage.getItem( FULLSCREEN_KEY ) !== 'off';
    } catch {
        return true;
    }
}

function rememberFullscreen(): void {
    try {
        localStorage.setItem( FULLSCREEN_KEY, isFullscreen() ? 'on' : 'off' );
    } catch {}
}

async function enterFullscreen(): Promise< void > {
    await document.documentElement.requestFullscreen( { navigationUI: 'hide' } );
    await screen.orientation?.lock?.( 'landscape' ).catch( () => {} );
}

export async function toggleFullscreen(): Promise< void > {
    try {
        if ( document.fullscreenElement ) await document.exitFullscreen();
        else await enterFullscreen();
    } catch {}
}

export function fullscreenForPlay(): void {
    if ( ! canFullscreen() || isFullscreen() || ! wantsFullscreen() ) return;
    enterFullscreen().catch( () => {} );
}

if ( typeof document !== 'undefined' ) document.addEventListener( 'fullscreenchange', rememberFullscreen );
