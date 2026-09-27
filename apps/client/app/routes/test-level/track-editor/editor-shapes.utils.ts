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

function joined( a: AuthoredRect, b: AuthoredRect ): AuthoredRect | null {
    if ( a.x === b.x && a.w === b.w && ( a.z + a.l === b.z || b.z + b.l === a.z ) ) {
        return { x: a.x, z: Math.min( a.z, b.z ), w: a.w, l: a.l + b.l };
    }
    if ( a.z === b.z && a.l === b.l && ( a.x + a.w === b.x || b.x + b.w === a.x ) ) {
        return { x: Math.min( a.x, b.x ), z: a.z, w: a.w + b.w, l: a.l };
    }
    return null;
}

function absorb( out: AuthoredRect[], r: AuthoredRect ): void {
    let cur = r;
    for ( let k = 0; k < out.length; k++ ) {
        const j = joined( out[ k ], cur );
        if ( j === null ) continue;
        out.splice( k, 1 );
        cur = j;
        k = -1;
    }
    out.push( cur );
}

export function unionRects( rects: readonly AuthoredRect[] ): AuthoredRect[] {
    const out: AuthoredRect[] = [];
    for ( const r of rects ) {
        let pieces: AuthoredRect[] = [ { x: r.x, z: r.z, w: r.w, l: r.l } ];
        for ( const o of out ) pieces = pieces.flatMap( ( p ) => subtractRect( p, o ) );
        for ( const p of pieces ) absorb( out, p );
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
