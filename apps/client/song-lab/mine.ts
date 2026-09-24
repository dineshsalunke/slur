import {
    type ComposedNote,
    type ComposedScore,
    clamp,
    formatNotes,
    MOTIF_MIN_NOTES,
    type Motif,
    mirrorNote,
    motifFailures,
    SEG_LEN,
} from '@slur/shared';

export const MINE_MAX_NOTES = 5;
export const MINE_KEEP = 12;
export const MINE_BAND_PAD = 0.1;

interface Gram {
    notes: string;
    count: number;
    lo: number;
    hi: number;
}

function canonical( notes: readonly ComposedNote[] ): string {
    const first = notes.find( ( n ) => n.dir !== 0 );
    return formatNotes( first !== undefined && first.dir > 0 ? notes.map( mirrorNote ) : notes );
}

export function countGrams( score: ComposedScore ): Gram[] {
    const played = score.notes.filter( ( n ) => n.kind !== 'rest' );
    const grams = new Map< string, Gram >();
    for ( let i = 0; i < played.length; i++ )
        for ( let len = MOTIF_MIN_NOTES; len <= MINE_MAX_NOTES && i + len <= played.length; len++ ) {
            const run = played.slice( i, i + len );
            if ( run.some( ( n ) => n.phrase !== run[ 0 ].phrase ) ) break;
            const key = canonical( run );
            const at = score.curve?.[ Math.floor( run[ 0 ].z / SEG_LEN ) ] ?? 0.5;
            const g = grams.get( key ) ?? { notes: key, count: 0, lo: at, hi: at };
            g.count++;
            g.lo = Math.min( g.lo, at );
            g.hi = Math.max( g.hi, at );
            grams.set( key, g );
        }
    return [ ...grams.values() ].sort( ( p, q ) => q.count - p.count || q.notes.length - p.notes.length );
}

export function mineMotifs( score: ComposedScore ): Motif[] {
    const out: Motif[] = [];
    for ( const g of countGrams( score ) ) {
        if ( out.length >= MINE_KEEP ) break;
        const m: Motif = {
            id: `m${ out.length + 1 }`,
            notes: g.notes,
            intensity: [ clamp( g.lo - MINE_BAND_PAD, 0, 1 ), clamp( g.hi + MINE_BAND_PAD, 0, 1 ) ],
            weight: g.count,
            mirror: true,
            stretch: [ 1, 2 ],
        };
        if ( motifFailures( [ m ] ).length === 0 ) out.push( m );
    }
    if ( out.length > 0 ) out[ 0 ] = { ...out[ 0 ], intensity: [ 0, 1 ] };
    return out;
}
