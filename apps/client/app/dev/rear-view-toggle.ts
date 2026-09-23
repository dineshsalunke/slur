import { useSyncExternalStore } from 'react';
import { typingTarget } from './typing-target';

const listeners = new Set< () => void >();

let shown = true;

function subscribe( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

function rearViewShown(): boolean {
    return shown;
}

export function useRearViewShown(): boolean {
    return useSyncExternalStore( subscribe, rearViewShown, rearViewShown );
}

if ( import.meta.env.DEV && typeof window !== 'undefined' ) {
    addEventListener( 'keydown', ( e ) => {
        if ( e.code !== 'KeyR' || e.repeat || e.metaKey || e.ctrlKey || e.altKey ) return;
        if ( typingTarget( e.target ) ) return;
        e.preventDefault();
        shown = ! shown;
        for ( const listener of listeners ) listener();
    } );
}
