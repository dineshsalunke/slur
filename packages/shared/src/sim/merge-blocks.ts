import { MAX_SHIP_WIDTH, TRACK_CONTRACT } from '../constants.js';
import { passableCorridorWidth } from './clearance.js';
import { fractureFits } from './fracture.js';
import { type Block, MIN_LANE, type Segment } from './space.js';

export const MERGE_SLIT_X = MAX_SHIP_WIDTH;
export const MERGE_POCKET_Z = 2 * TRACK_CONTRACT.shipHalfL;

export function closePair( a: Block, b: Block ): boolean {
    const xGap = Math.max( a.x0, b.x0 ) - Math.min( a.x1, b.x1 );
    const zGap = Math.max( a.z0, b.z0 ) - Math.min( a.z1, b.z1 );
    if ( zGap < 0 ) return xGap > 0 && xGap < MERGE_SLIT_X;
    if ( xGap < 0 ) return zGap > 0 && zGap < MERGE_POCKET_Z;
    return xGap < MERGE_SLIT_X && zGap < MERGE_POCKET_Z;
}

function settleKind( b: Block, fractured: boolean ): Block {
    return { ...b, kind: fractured && fractureFits( b ) ? 'fractured' : 'sealed' };
}

function union( a: Block, b: Block ): Block {
    const box: Block = {
        ...a,
        id: Math.min( a.id, b.id ),
        x0: Math.min( a.x0, b.x0 ),
        x1: Math.max( a.x1, b.x1 ),
        y0: Math.min( a.y0, b.y0 ),
        y1: Math.max( a.y1, b.y1 ),
        z0: Math.min( a.z0, b.z0 ),
        z1: Math.max( a.z1, b.z1 ),
    };
    return settleKind( box, a.kind === 'fractured' || b.kind === 'fractured' );
}

function keepsClearance( seg: Segment, before: Block[], after: Block[] ): boolean {
    const was = passableCorridorWidth( { ...seg, blocks: before } );
    return passableCorridorWidth( { ...seg, blocks: after } ) >= Math.min( MIN_LANE, was );
}

function tryMerge( seg: Segment, cur: Block[] ): Block[] | null {
    for ( let a = 0; a < cur.length; a++ ) {
        for ( let c = a + 1; c < cur.length; c++ ) {
            if ( ! closePair( cur[ a ], cur[ c ] ) ) continue;
            const next = cur.filter( ( _, k ) => k !== a && k !== c );
            next.push( union( cur[ a ], cur[ c ] ) );
            if ( keepsClearance( seg, cur, next ) ) return next;
        }
    }
    return null;
}

export function mergeCloseBlocks( seg: Segment ): Block[] {
    let cur = [ ...seg.blocks ];
    for ( let next = tryMerge( seg, cur ); next; next = tryMerge( seg, cur ) ) cur = next;
    return cur.sort( ( a, b ) => a.id - b.id );
}

function xOverlap( a: Block, b: Block ): boolean {
    return Math.min( a.x1, b.x1 ) > Math.max( a.x0, b.x0 );
}

function hasPartner( b: Block, others: Block[], gapTo: ( o: Block ) => number ): boolean {
    return others.some( ( o ) => {
        const gap = gapTo( o );
        return xOverlap( b, o ) && gap > 0 && gap < MERGE_POCKET_Z;
    } );
}

export function abutAcrossBoundary( seg: Segment, prev: Block[], next: Block[] ): Block[] {
    const cur = [ ...seg.blocks ];
    for ( let k = 0; k < cur.length; k++ ) {
        const b = cur[ k ];
        const z0 = hasPartner( b, prev, ( o ) => b.z0 - o.z1 ) ? seg.z0 : b.z0;
        const z1 = hasPartner( b, next, ( o ) => o.z0 - b.z1 ) ? seg.z1 : b.z1;
        if ( z0 === b.z0 && z1 === b.z1 ) continue;
        const grown = [ ...cur ];
        grown[ k ] = settleKind( { ...b, z0, z1 }, b.kind === 'fractured' );
        if ( keepsClearance( seg, cur, grown ) ) cur[ k ] = grown[ k ];
    }
    return cur;
}
