import { useSyncExternalStore } from 'react';

// A module store, not route state: a hook in the route module re-renders the whole Canvas subtree on
// every toggle (non-negotiable #10, enforced by scripts/check-canvas-isolation.mjs).
let bloom = true;
let showGrid = true;
const listeners = new Set< () => void >();

function emit(): void {
    for ( const notify of listeners ) notify();
}

function subscribe( onChange: () => void ): () => void {
    listeners.add( onChange );
    return () => {
        listeners.delete( onChange );
    };
}

export function setBloom( next: boolean ): void {
    bloom = next;
    emit();
}

export function setShowGrid( next: boolean ): void {
    showGrid = next;
    emit();
}

export function useBloom(): boolean {
    return useSyncExternalStore( subscribe, () => bloom );
}

export function useShowGrid(): boolean {
    return useSyncExternalStore( subscribe, () => showGrid );
}
