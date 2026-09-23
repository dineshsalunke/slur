import { useSyncExternalStore } from 'react';

const listeners = new Set< () => void >();

let shown = true;

function notify(): void {
    for ( const listener of listeners ) listener();
}

function subscribe( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

function panelShown(): boolean {
    return shown;
}

export function togglePanel(): void {
    shown = ! shown;
    notify();
}

export function usePanelShown(): boolean {
    return useSyncExternalStore( subscribe, panelShown, panelShown );
}

function typing( target: EventTarget | null ): boolean {
    const el = target as HTMLElement | null;
    if ( ! el ) return false;
    return el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
}

if ( import.meta.env.DEV && typeof window !== 'undefined' ) {
    addEventListener( 'keydown', ( e ) => {
        if ( e.code !== 'Backquote' || e.repeat || e.metaKey || e.ctrlKey || e.altKey ) return;
        if ( typing( e.target ) ) return;
        e.preventDefault();
        togglePanel();
    } );
}
