export type Action = 'fireForward' | 'fireBack' | 'next' | 'previous' | 'drop' | 'mute' | 'start';

const listeners = new Set< ( action: Action ) => void >();

export function press( action: Action ): void {
    for ( const listener of listeners ) listener( action );
}

export function onAction( listener: ( action: Action ) => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}
