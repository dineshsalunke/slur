const listeners = new Set< () => void >();

let rebuild = 0;

export function bumpRebuild(): void {
    rebuild++;
    for ( const listener of listeners ) listener();
}

export function rebuildToken(): number {
    return rebuild;
}

export function subscribeRebuild( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}
