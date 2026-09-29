export interface Reveal {
    shown: boolean;
    listeners: Set< () => void >;
}

export function createReveal(): Reveal {
    return { shown: false, listeners: new Set() };
}

export function subscribeReveal( reveal: Reveal, notify: () => void ): () => void {
    reveal.listeners.add( notify );
    return () => reveal.listeners.delete( notify );
}

export function revealOnFrame( reveal: Reveal ): void {
    if ( reveal.shown ) return;
    reveal.shown = true;
    for ( const notify of reveal.listeners ) notify();
}
