import type { AuthoredLevel, AuthoredRect } from '@slur/shared';

export function overlaps( a: AuthoredRect, b: AuthoredRect ): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.z < b.z + b.l && b.z < a.z + a.l;
}

export function subtractRect< T extends AuthoredRect >( a: T, r: AuthoredRect ): T[] {
    if ( ! overlaps( a, r ) ) return [ a ];
    const aTop = a.z + a.l;
    const aRight = a.x + a.w;
    const z0 = Math.max( a.z, r.z );
    const z1 = Math.min( aTop, r.z + r.l );
    const x1 = Math.min( aRight, r.x + r.w );
    const pieces: T[] = [
        { ...a, l: z0 - a.z },
        { ...a, z: z1, l: aTop - z1 },
        { ...a, w: Math.max( a.x, r.x ) - a.x, z: z0, l: z1 - z0 },
        { ...a, x: x1, w: aRight - x1, z: z0, l: z1 - z0 },
    ];
    return pieces.filter( ( p ) => p.w > 0 && p.l > 0 );
}

function edgeIndex(
    rects: readonly AuthoredRect[],
    lo: ( r: AuthoredRect ) => number,
    hi: ( r: AuthoredRect ) => number,
) {
    const edges = [ ...new Set( rects.flatMap( ( r ) => [ lo( r ), hi( r ) ] ) ) ].sort( ( a, b ) => a - b );
    return { edges, at: new Map( edges.map( ( e, i ) => [ e, i ] ) ) };
}

interface CellGrid {
    cells: Uint8Array;
    cols: number;
    rows: number;
}

function rowFree( g: CellGrid, j: number, i0: number, i1: number ): boolean {
    for ( let i = i0; i < i1; i++ ) if ( g.cells[ j * g.cols + i ] !== 1 ) return false;
    return true;
}

function runEnd( g: CellGrid, i: number, j: number ): number {
    let i1 = i + 1;
    while ( i1 < g.cols && rowFree( g, j, i1, i1 + 1 ) ) i1++;
    return i1;
}

function stackEnd( g: CellGrid, j: number, i0: number, i1: number ): number {
    let j1 = j + 1;
    while ( j1 < g.rows && rowFree( g, j1, i0, i1 ) ) j1++;
    return j1;
}

function claim( g: CellGrid, i0: number, i1: number, j0: number, j1: number ): void {
    for ( let j = j0; j < j1; j++ ) g.cells.fill( 2, j * g.cols + i0, j * g.cols + i1 );
}

export function unionRects( rects: readonly AuthoredRect[] ): AuthoredRect[] {
    if ( rects.length === 0 ) return [];
    const xs = edgeIndex(
        rects,
        ( r ) => r.x,
        ( r ) => r.x + r.w,
    );
    const zs = edgeIndex(
        rects,
        ( r ) => r.z,
        ( r ) => r.z + r.l,
    );
    const g: CellGrid = {
        cols: xs.edges.length - 1,
        rows: zs.edges.length - 1,
        cells: new Uint8Array( ( xs.edges.length - 1 ) * ( zs.edges.length - 1 ) ),
    };
    for ( const r of rects ) {
        const i0 = xs.at.get( r.x ) ?? 0;
        const i1 = xs.at.get( r.x + r.w ) ?? 0;
        for ( let j = zs.at.get( r.z ) ?? 0; j < ( zs.at.get( r.z + r.l ) ?? 0 ); j++ ) {
            g.cells.fill( 1, j * g.cols + i0, j * g.cols + i1 );
        }
    }
    const out: AuthoredRect[] = [];
    for ( let j = 0; j < g.rows; j++ ) {
        for ( let i = 0; i < g.cols; i++ ) {
            if ( ! rowFree( g, j, i, i + 1 ) ) continue;
            const i1 = runEnd( g, i, j );
            const j1 = stackEnd( g, j, i, i1 );
            claim( g, i, i1, j, j1 );
            out.push( {
                x: xs.edges[ i ],
                z: zs.edges[ j ],
                w: xs.edges[ i1 ] - xs.edges[ i ],
                l: zs.edges[ j1 ] - zs.edges[ j ],
            } );
        }
    }
    return out;
}

export function normalizeLevel( level: AuthoredLevel ): AuthoredLevel {
    const blocks = [ true, false ].flatMap( ( destructible ) =>
        unionRects( level.blocks.filter( ( b ) => b.destructible === destructible ) ).map( ( r ) => ( {
            ...r,
            destructible,
        } ) ),
    );
    return {
        ...level,
        blocks: blocks.sort( ( a, b ) => a.z - b.z || a.x - b.x ),
        gaps: unionRects( level.gaps ),
    };
}

export interface OutlineSegment {
    x0: number;
    z0: number;
    x1: number;
    z1: number;
}

function oddSpans( spans: readonly ( readonly [ number, number ] )[] ): [ number, number ][] {
    const events = spans
        .flatMap( ( [ a, b ] ) => [
            [ a, 1 ],
            [ b, -1 ],
        ] )
        .sort( ( p, q ) => p[ 0 ] - q[ 0 ] );
    const out: [ number, number ][] = [];
    let depth = 0;
    let from = 0;
    for ( const [ at, d ] of events ) {
        if ( depth % 2 !== 0 && at > from ) {
            const last = out.at( -1 );
            if ( last !== undefined && last[ 1 ] === from ) last[ 1 ] = at;
            else out.push( [ from, at ] );
        }
        depth += d;
        from = at;
    }
    return out;
}

function groupSpans(
    entries: readonly ( readonly [ number, number, number ] )[],
): Map< number, [ number, number ][] > {
    const lines = new Map< number, [ number, number ][] >();
    for ( const [ key, a, b ] of entries ) {
        const line = lines.get( key );
        if ( line === undefined ) lines.set( key, [ [ a, b ] ] );
        else line.push( [ a, b ] );
    }
    return lines;
}

export function outlineSegments( rects: readonly AuthoredRect[] ): OutlineSegment[] {
    const vertical = groupSpans(
        rects.flatMap( ( r ) => [
            [ r.x, r.z, r.z + r.l ],
            [ r.x + r.w, r.z, r.z + r.l ],
        ] ),
    );
    const horizontal = groupSpans(
        rects.flatMap( ( r ) => [
            [ r.z, r.x, r.x + r.w ],
            [ r.z + r.l, r.x, r.x + r.w ],
        ] ),
    );
    const out: OutlineSegment[] = [];
    for ( const [ x, spans ] of vertical ) {
        for ( const [ z0, z1 ] of oddSpans( spans ) ) out.push( { x0: x, z0, x1: x, z1 } );
    }
    for ( const [ z, spans ] of horizontal ) {
        for ( const [ x0, x1 ] of oddSpans( spans ) ) out.push( { x0, z0: z, x1, z1: z } );
    }
    return out;
}
