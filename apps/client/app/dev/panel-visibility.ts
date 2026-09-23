import { useSyncExternalStore } from 'react';
import { typingTarget } from './typing-target';

const listeners = new Set< () => void >();

let shown = false;

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

if ( import.meta.env.DEV && typeof window !== 'undefined' ) {
    addEventListener( 'keydown', ( e ) => {
        if ( e.code !== 'Backquote' || e.repeat || e.metaKey || e.ctrlKey || e.altKey ) return;
        if ( typingTarget( e.target ) ) return;
        e.preventDefault();
        togglePanel();
    } );
}
