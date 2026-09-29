export interface EventQueue< T > {
    readonly items: readonly T[];
    push( e: T ): void;
    drain( sink: ( e: T ) => void ): void;
    clear(): void;
}

export function createEventQueue< T >( cap: number ): EventQueue< T > {
    const items: T[] = [];
    return {
        items,
        push( e ) {
            items.push( e );
            if ( items.length > cap ) items.shift();
        },
        drain( sink ) {
            for ( const e of items ) sink( e );
            items.length = 0;
        },
        clear() {
            items.length = 0;
        },
    };
}
