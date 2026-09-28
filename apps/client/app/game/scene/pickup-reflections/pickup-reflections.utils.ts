import type { Anchor } from '@slur/shared';

export function placePickupEmitters( matrices: Float32Array, layout: readonly Anchor[] ): void {
    matrices.fill( 0 );
    for ( let i = 0; i < layout.length; i++ ) {
        const at = i * 16;
        const p = layout[ i ];
        matrices[ at ] = 1;
        matrices[ at + 5 ] = 1;
        matrices[ at + 10 ] = 1;
        matrices[ at + 12 ] = p.x;
        matrices[ at + 13 ] = p.y;
        matrices[ at + 14 ] = p.z;
        matrices[ at + 15 ] = 1;
    }
}

export function syncPickupEmitters(
    matrices: Float32Array,
    layout: readonly Anchor[],
    isTaken: ( id: string ) => boolean,
): boolean {
    let changed = false;
    for ( let i = 0; i < layout.length; i++ ) {
        const alive = isTaken( layout[ i ].id ) ? 0 : 1;
        const at = i * 16;
        if ( matrices[ at ] === alive ) continue;
        matrices[ at ] = alive;
        changed = true;
    }
    return changed;
}
