import { columnX, nearestColumn, type PacingGrid } from './grid.js';

export interface RouteRegion {
    k0: number;
    k1: number;
    x0: number;
    x1: number;
    cells: number;
}

export function anyNear( mask: Uint8Array, row: number, cols: number, j: number, step: number ): boolean {
    for ( let q = Math.max( 0, j - step ); q <= Math.min( cols - 1, j + step ); q++ ) {
        if ( mask[ row * cols + q ] === 1 ) return true;
    }
    return false;
}

function sweep(
    legal: Uint8Array,
    cols: number,
    count: number,
    step: number,
    forward: boolean,
    out: Uint8Array,
): void {
    for ( let n = 1; n < count; n++ ) {
        const k = forward ? n : count - 1 - n;
        const from = forward ? k - 1 : k + 1;
        for ( let j = 0; j < cols; j++ ) {
            if ( legal[ k * cols + j ] === 1 && anyNear( out, from, cols, j, step ) ) out[ k * cols + j ] = 1;
        }
    }
}

export function viableCells( grid: PacingGrid, legal: Uint8Array, step: number, startX = 0 ): Uint8Array[] {
    const { count, cols } = grid;
    const fwd = new Uint8Array( count * cols );
    const bwd = new Uint8Array( count * cols );
    const j0 = nearestColumn( startX, grid.hull );
    fwd[ j0 ] = legal[ j0 ];
    for ( let j = 0; j < cols; j++ ) bwd[ ( count - 1 ) * cols + j ] = legal[ ( count - 1 ) * cols + j ];
    sweep( legal, cols, count, step, true, fwd );
    sweep( legal, cols, count, step, false, bwd );
    const viable = new Uint8Array( count * cols );
    const deadEnd = new Uint8Array( count * cols );
    for ( let i = 0; i < viable.length; i++ ) {
        viable[ i ] = fwd[ i ] & bwd[ i ];
        deadEnd[ i ] = fwd[ i ] & ( 1 - bwd[ i ] );
    }
    return [ viable, deadEnd ];
}

interface Bounds {
    k0: number;
    k1: number;
    j0: number;
    j1: number;
    cells: number;
}

function neighbours( c: number, count: number, cols: number ): number[] {
    const k = Math.floor( c / cols );
    const j = c - k * cols;
    const out: number[] = [];
    if ( k > 0 ) out.push( c - cols );
    if ( k < count - 1 ) out.push( c + cols );
    if ( j > 0 ) out.push( c - 1 );
    if ( j < cols - 1 ) out.push( c + 1 );
    return out;
}

function grow( b: Bounds, c: number, cols: number ): void {
    const k = Math.floor( c / cols );
    const j = c - k * cols;
    b.cells++;
    b.k0 = Math.min( b.k0, k );
    b.k1 = Math.max( b.k1, k );
    b.j0 = Math.min( b.j0, j );
    b.j1 = Math.max( b.j1, j );
}

function flood( mask: Uint8Array, seen: Uint8Array, grid: PacingGrid, start: number ): Bounds {
    const b = { k0: grid.count, k1: -1, j0: grid.cols, j1: -1, cells: 0 };
    const stack = [ start ];
    seen[ start ] = 1;
    while ( stack.length > 0 ) {
        const c = stack.pop() as number;
        grow( b, c, grid.cols );
        for ( const n of neighbours( c, grid.count, grid.cols ) ) {
            if ( mask[ n ] === 0 || seen[ n ] === 1 ) continue;
            seen[ n ] = 1;
            stack.push( n );
        }
    }
    return b;
}

export function regionsOf( mask: Uint8Array, grid: PacingGrid ): RouteRegion[] {
    const seen = new Uint8Array( mask.length );
    const out: RouteRegion[] = [];
    for ( let i = 0; i < mask.length; i++ ) {
        if ( mask[ i ] === 0 || seen[ i ] === 1 ) continue;
        const b = flood( mask, seen, grid, i );
        out.push( {
            k0: b.k0,
            k1: b.k1,
            x0: columnX( b.j0, grid.hull ),
            x1: columnX( b.j1, grid.hull ),
            cells: b.cells,
        } );
    }
    return out;
}
