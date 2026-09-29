import { useSyncExternalStore } from 'react';
import { typingTarget } from '../../dev/typing-target';

export const REAR_VIEW_KEY = 'KeyB';
export const REAR_VIEW_STORE_KEY = 'slur.rearView';

const listeners = new Set< () => void >();

function stored(): boolean {
    try {
        return typeof localStorage === 'undefined' || localStorage.getItem( REAR_VIEW_STORE_KEY ) !== 'off';
    } catch {
        return true;
    }
}

let shown = stored();

function subscribe( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function rearViewShown(): boolean {
    return shown;
}

export function useRearViewShown(): boolean {
    return useSyncExternalStore( subscribe, rearViewShown, rearViewShown );
}

export function handleRearViewKey( e: KeyboardEvent ): void {
    if ( e.code !== REAR_VIEW_KEY || e.repeat || e.metaKey || e.ctrlKey || e.altKey ) return;
    if ( typingTarget( e.target ) ) return;
    e.preventDefault();
    shown = ! shown;
    try {
        localStorage.setItem( REAR_VIEW_STORE_KEY, shown ? 'on' : 'off' );
    } catch {}
    for ( const listener of listeners ) listener();
}

if ( typeof window !== 'undefined' ) addEventListener( 'keydown', handleRearViewKey );
