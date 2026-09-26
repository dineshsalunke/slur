import { PACING_DZ } from './grid.js';
import type { ReferencePath } from './reference-path.js';

export const DEMAND_BIN_S = 1;
export const MOVE_MERGE_U = 4;
export const STRAFE_WINDOW_U = 8;

export type MoveKind = 'strafe' | 'jump';

export interface PacingMove {
    kind: MoveKind;
    k0: number;
    k1: number;
    dir: number;
}

export interface PacingQuiet {
    k0: number;
    k1: number;
    seconds: number;
}

export interface PacingBin {
    t0: number;
    t1: number;
    lateral: number;
    peakStrafe: number;
    reversals: number;
    moves: number;
    jumps: number;
}

export interface PacingDemand {
    moves: PacingMove[];
    quiet: PacingQuiet[];
    bins: PacingBin[];
    strafe: Float32Array;
}

function strafeMoves( x: Float32Array ): PacingMove[] {
    const out: PacingMove[] = [];
    const mergeGap = MOVE_MERGE_U / PACING_DZ;
    let cur: PacingMove | null = null;
    for ( let k = 1; k < x.length; k++ ) {
        const dx = x[ k ] - x[ k - 1 ];
        if ( dx === 0 ) continue;
        const dir = dx < 0 ? -1 : 1;
        if ( cur !== null && cur.dir === dir && k - cur.k1 <= mergeGap ) {
            cur.k1 = k;
            continue;
        }
        cur = { kind: 'strafe', k0: k - 1, k1: k, dir };
        out.push( cur );
    }
    return out;
}

function jumpMoves( air: Uint8Array ): PacingMove[] {
    const out: PacingMove[] = [];
    let k = 0;
    while ( k < air.length ) {
        if ( air[ k ] === 0 ) {
            k++;
            continue;
        }
        let end = k;
        while ( end < air.length && air[ end ] === 1 ) end++;
        out.push( { kind: 'jump', k0: k, k1: end - 1, dir: 0 } );
        k = end;
    }
    return out;
}

function quietSpans( moves: PacingMove[], count: number, cruise: number ): PacingQuiet[] {
    const out: PacingQuiet[] = [];
    let cursor = 0;
    for ( const m of moves ) {
        if ( m.k0 > cursor ) out.push( { k0: cursor, k1: m.k0, seconds: ( ( m.k0 - cursor ) * PACING_DZ ) / cruise } );
        cursor = Math.max( cursor, m.k1 + 1 );
    }
    if ( count > cursor ) out.push( { k0: cursor, k1: count, seconds: ( ( count - cursor ) * PACING_DZ ) / cruise } );
    return out;
}

function strafeRate( x: Float32Array, cruise: number ): Float32Array {
    const w = Math.max( 1, Math.round( STRAFE_WINDOW_U / PACING_DZ ) );
    const seconds = ( w * PACING_DZ ) / cruise;
    const out = new Float32Array( x.length );
    for ( let k = 0; k < x.length; k++ ) {
        const a = Math.max( 0, k - Math.floor( w / 2 ) );
        const b = Math.min( x.length - 1, a + w );
        out[ k ] = Math.abs( x[ b ] - x[ a ] ) / seconds;
    }
    return out;
}

export function measureDemand( path: ReferencePath, cruise: number ): PacingDemand {
    const { x, air } = path;
    const count = x.length;
    const moves = [ ...strafeMoves( x ), ...jumpMoves( air ) ].sort( ( a, b ) => a.k0 - b.k0 || a.k1 - b.k1 );
    const strafe = strafeRate( x, cruise );
    const perBin = ( DEMAND_BIN_S * cruise ) / PACING_DZ;
    const binCount = Math.ceil( count / perBin );
    const bins: PacingBin[] = [];
    for ( let b = 0; b < binCount; b++ ) {
        const t0 = b * DEMAND_BIN_S;
        bins.push( {
            t0,
            t1: Math.min( t0 + DEMAND_BIN_S, ( count * PACING_DZ ) / cruise ),
            lateral: 0,
            peakStrafe: 0,
            reversals: 0,
            moves: 0,
            jumps: 0,
        } );
    }
    const binOf = ( k: number ): PacingBin => bins[ Math.min( binCount - 1, Math.floor( k / perBin ) ) ];
    for ( let k = 1; k < count; k++ ) {
        const bin = binOf( k );
        bin.lateral += Math.abs( x[ k ] - x[ k - 1 ] ) / DEMAND_BIN_S;
        if ( strafe[ k ] > bin.peakStrafe ) bin.peakStrafe = strafe[ k ];
    }
    let lastDir = 0;
    for ( const m of moves ) {
        const bin = binOf( m.k0 );
        if ( m.kind === 'jump' ) {
            bin.jumps++;
            continue;
        }
        bin.moves++;
        if ( lastDir !== 0 && m.dir !== lastDir ) bin.reversals++;
        lastDir = m.dir;
    }
    return { moves, quiet: quietSpans( moves, count, cruise ), bins, strafe };
}
