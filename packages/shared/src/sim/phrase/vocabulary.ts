import { REGISTER_GAP_Z, REST_UNIT_U, SCORE_REGISTER_CRUISE } from '../../pacing/score.js';
import { FRACTURE_SHADOW_Z } from '../fracture-shadow.js';
import { GROOVE_BEAT_Z, type GrooveBand } from '../groove/grammar.js';
import { hash2, mulberry32 } from '../rng.js';
import { mirrorNote } from '../score/compose.js';
import { MOTIFS, type Motif, motifFailures, type ParsedMotif } from '../score/motifs.js';
import { formatNotes, type MotifNote, type NoteToken, parseNotes } from '../score/notes.js';

export type TwistKind = 'mirror' | 'swap' | 'callback';

export interface SectionMotif {
    motif: ParsedMotif;
    teach: MotifNote[];
    twist: MotifNote[];
    twistKind: TwistKind;
}

export const PHRASE_ACT_NOTES: Readonly< Record< GrooveBand, readonly number[] > > = {
    low: [ 3 ],
    mid: [ 3 ],
    high: [ 3 ],
};

export const PHRASE_ACT_TWISTS: Readonly< Record< GrooveBand, readonly TwistKind[] > > = {
    low: [ 'mirror' ],
    mid: [ 'mirror', 'swap' ],
    high: [ 'mirror', 'swap' ],
};

export const NOTE_SWAPS: Readonly< Partial< Record< NoteToken, NoteToken > > > = {
    l: 'L',
    r: 'R',
    L: 'l',
    R: 'r',
    J: 'JJ',
    JJ: 'J',
    '<': 'L',
    '>': 'R',
};

export const PHRASE_BEAT_DIVISION = 2;

const SALT_VOCAB = 0x71d3a9e5 | 0;
const BEAT_EPS = 1e-9;

const flyableMemo = new Map< string, boolean >();

export function isFlyable( notes: readonly MotifNote[] ): boolean {
    const text = formatNotes( notes );
    let ok = flyableMemo.get( text );
    if ( ok === undefined ) {
        const probe: Motif = {
            id: 'probe',
            notes: text,
            intensity: [ 0, 1 ],
            weight: 1,
            mirror: true,
            stretch: [ 1, 1 ],
        };
        ok = motifFailures( [ probe ] ).length === 0;
        flyableMemo.set( text, ok );
    }
    return ok;
}

export function noteBeats( n: MotifNote ): number {
    const calm = n.kind === 'smash' ? Math.max( REGISTER_GAP_Z, FRACTURE_SHADOW_Z ) : REGISTER_GAP_Z;
    const need = n.kind === 'rest' ? REST_UNIT_U : n.move * SCORE_REGISTER_CRUISE + calm;
    return Math.ceil( ( need / GROOVE_BEAT_Z ) * PHRASE_BEAT_DIVISION - BEAT_EPS ) / PHRASE_BEAT_DIVISION;
}

export function playedNotes( m: ParsedMotif ): number {
    return m.parsed.filter( ( n ) => n.kind !== 'rest' ).length;
}

function sameNotes( a: readonly MotifNote[], b: readonly MotifNote[] ): boolean {
    return formatNotes( a ) === formatNotes( b );
}

function pickWeightedMotif( pool: readonly ParsedMotif[], r: number ): ParsedMotif {
    const total = pool.reduce( ( sum, m ) => sum + m.weight, 0 );
    let acc = r * total;
    for ( const m of pool ) {
        acc -= m.weight;
        if ( acc < 0 ) return m;
    }
    return pool[ pool.length - 1 ];
}

export function mirrored( notes: readonly MotifNote[] ): MotifNote[] {
    return notes.map( mirrorNote );
}

export function swapOne( notes: readonly MotifNote[], rand: () => number ): MotifNote[] | null {
    const order = notes
        .map( ( n, i ) => ( { i, key: rand(), to: NOTE_SWAPS[ n.token ] } ) )
        .filter( ( c ) => c.to !== undefined )
        .sort( ( a, b ) => a.key - b.key );
    for ( const c of order ) {
        const swapped = [ ...notes ];
        swapped[ c.i ] = { ...parseNotes( c.to as NoteToken )[ 0 ], accent: notes[ c.i ].accent };
        if ( isFlyable( swapped ) ) return swapped;
    }
    return null;
}

function twistOf(
    teach: MotifNote[],
    kinds: readonly TwistKind[],
    rand: () => number,
): Pick< SectionMotif, 'twist' | 'twistKind' > {
    const kind = kinds[ Math.floor( rand() * kinds.length ) ];
    const mirror = mirrored( teach );
    const swap = kind === 'swap' ? swapOne( teach, rand ) : null;
    if ( swap !== null ) return { twist: swap, twistKind: 'swap' };
    if ( ! sameNotes( mirror, teach ) ) return { twist: mirror, twistKind: 'mirror' };
    return { twist: swapOne( teach, rand ) ?? mirror, twistKind: 'swap' };
}

export function drawVocabulary(
    seed: number,
    acts: readonly GrooveBand[],
    motifs: readonly ParsedMotif[] = MOTIFS,
): SectionMotif[] {
    const out: SectionMotif[] = [];
    const used = new Set< string >();
    acts.forEach( ( act, k ) => {
        const rand = mulberry32( hash2( ( seed ^ SALT_VOCAB ) | 0, k ) );
        const sized = motifs.filter( ( m ) => PHRASE_ACT_NOTES[ act ].includes( playedNotes( m ) ) );
        const fresh = sized.filter( ( m ) => ! used.has( m.id ) );
        const motif = pickWeightedMotif( fresh.length > 0 ? fresh : sized, rand() );
        used.add( motif.id );
        const teach = [ ...motif.parsed ];
        const callback = act === 'high' && k === acts.length - 1 && acts[ 0 ] === 'low' && k > 0;
        const twist = callback
            ? { twist: mirrored( out[ 0 ].teach ), twistKind: 'callback' as const }
            : twistOf( teach, PHRASE_ACT_TWISTS[ act ], rand );
        out.push( { motif, teach, ...twist } );
    } );
    return out;
}
