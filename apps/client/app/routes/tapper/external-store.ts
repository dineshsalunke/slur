export interface Store< T > {
    get(): T;
    set( next: T ): void;
    subscribe( cb: () => void ): () => void;
}

export function createStore< T >( initial: T ): Store< T > {
    let value = initial;
    const subs = new Set< () => void >();
    return {
        get: () => value,
        set( next ) {
            value = next;
            for ( const cb of subs ) cb();
        },
        subscribe( cb ) {
            subs.add( cb );
            return () => subs.delete( cb );
        },
    };
}
