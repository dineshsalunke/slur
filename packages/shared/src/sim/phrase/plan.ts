import { GROOVE_BANDS, GROOVE_BEAT_Z, type GrooveBand } from '../groove/grammar.js';
import type { MotifNote } from '../score/notes.js';
import { SEG_LEN, START_SAFE } from '../space.js';
import { centredStart, MOTIF_LEAD_BEATS, motifLeadIn, motifPhraseLen, snapCell } from './motif-emit.js';
import { drawVocabulary, type SectionMotif, type TwistKind } from './vocabulary.js';
import { rollWeave, type WeaveSpec, weaveExitOffset, weaveRunUp } from './weave-emit.js';

export type PhraseRole = 'open' | 'teach' | 'repeat' | 'set' | 'weave' | 'twist' | 'rest' | 'finish';

export type PhraseKind = 'arena' | 'motif' | 'weave' | 'rest';

export interface Phrase {
    role: PhraseRole;
    kind: PhraseKind;
    act: GrooveBand;
    section: number;
    z0: number;
    z1: number;
    notes: MotifNote[] | null;
    x0: number;
    leadIn: number;
    motif: string | null;
    twist: TwistKind | null;
    weave: WeaveSpec | null;
}

export interface PhrasePlan {
    seed: number;
    length: number;
    sections: number;
    vocabulary: SectionMotif[];
    phrases: Phrase[];
}

export const PHRASE_SECTION: readonly PhraseRole[] = [ 'open', 'teach', 'repeat', 'set', 'weave', 'twist', 'rest' ];

export const PHRASE_ROLE_KIND: Readonly< Record< PhraseRole, PhraseKind > > = {
    open: 'arena',
    teach: 'motif',
    repeat: 'motif',
    set: 'arena',
    weave: 'weave',
    twist: 'motif',
    rest: 'rest',
    finish: 'arena',
};

export const PHRASE_ARENA_LEN = 280;
export const PHRASE_FINISH_LEN = 300;
export const PHRASE_REST_LEN = snapCell( GROOVE_BEAT_Z );
export const PHRASE_WEAVE_MIN = 240;
export const PHRASE_WEAVE_MAX = 480;
export const PHRASE_SECTIONS = 5;
export const PHRASE_SECTION_FLOOR = 2 * PHRASE_ARENA_LEN + PHRASE_REST_LEN + PHRASE_WEAVE_MIN;

export function phraseStartZ(): number {
    return START_SAFE * SEG_LEN;
}

export function finishPhraseZ( length: number ): number {
    return Math.max( phraseStartZ(), snapCell( length * SEG_LEN - PHRASE_FINISH_LEN ) );
}

export function actOf( section: number, sections: number ): GrooveBand {
    const k = Math.floor( ( section * GROOVE_BANDS.length ) / sections );
    return GROOVE_BANDS[ Math.min( GROOVE_BANDS.length - 1, k ) ];
}

function phraseNotes( role: PhraseRole, m: SectionMotif ): MotifNote[] | null {
    if ( role === 'teach' || role === 'repeat' ) return m.teach;
    if ( role === 'twist' ) return m.twist;
    return null;
}

function leadInOf( seed: number, role: PhraseRole, notes: MotifNote[] | null, act: GrooveBand, k: number ): number {
    if ( notes === null ) return 0;
    if ( PHRASE_SECTION[ PHRASE_SECTION.indexOf( role ) - 1 ] !== 'weave' ) return MOTIF_LEAD_BEATS;
    return motifLeadIn( act, weaveExitOffset( rollWeave( seed, act, k ), centredStart( notes ) ) );
}

function roleLengths( seed: number, k: number, m: SectionMotif, act: GrooveBand ): Record< PhraseRole, number > {
    const motif = ( role: PhraseRole ): number => {
        const notes = phraseNotes( role, m );
        return notes === null ? 0 : motifPhraseLen( notes, act, leadInOf( seed, role, notes, act, k ) );
    };
    return {
        open: PHRASE_ARENA_LEN,
        teach: motif( 'teach' ),
        repeat: motif( 'repeat' ),
        set: Math.max( PHRASE_ARENA_LEN, weaveRunUp( rollWeave( seed, act, k ) ) ),
        weave: PHRASE_WEAVE_MIN,
        twist: motif( 'twist' ),
        rest: PHRASE_REST_LEN,
        finish: 0,
    };
}

export function sectionMinLen( seed: number, k: number, m: SectionMotif, act: GrooveBand ): number {
    const lens = roleLengths( seed, k, m, act );
    return PHRASE_SECTION.reduce( ( sum, r ) => sum + lens[ r ], 0 );
}

function vocabularyFor( seed: number, sections: number ): SectionMotif[] {
    return drawVocabulary(
        seed,
        Array.from( { length: sections }, ( _, k ) => actOf( k, sections ) ),
    );
}

function fitSections( seed: number, usable: number ): SectionMotif[] {
    const most = Math.max( 1, Math.floor( usable / PHRASE_SECTION_FLOOR ) );
    for ( let n = most; n > 1; n-- ) {
        const vocab = vocabularyFor( seed, n );
        if ( vocab.reduce( ( sum, m, k ) => sum + sectionMinLen( seed, k, m, actOf( k, n ) ), 0 ) <= usable )
            return vocab;
    }
    return vocabularyFor( seed, 1 );
}

function rolePhrase( seed: number, role: PhraseRole, m: SectionMotif, act: GrooveBand, k: number ): Phrase {
    const notes = phraseNotes( role, m );
    return {
        role,
        kind: PHRASE_ROLE_KIND[ role ],
        act,
        section: k,
        z0: 0,
        z1: 0,
        notes,
        x0: notes === null ? 0 : centredStart( notes ),
        leadIn: leadInOf( seed, role, notes, act, k ),
        motif: notes === null ? null : m.motif.id,
        twist: role === 'twist' ? m.twistKind : null,
        weave: role === 'weave' ? rollWeave( seed, act, k ) : null,
    };
}

function sectionPhrases(
    seed: number,
    k: number,
    sections: number,
    m: SectionMotif,
    z0: number,
    z1: number,
): Phrase[] {
    const act = actOf( k, sections );
    const lens = roleLengths( seed, k, m, act );
    const slack = Math.max( 0, z1 - z0 - sectionMinLen( seed, k, m, act ) );
    lens.weave += Math.min( slack, PHRASE_WEAVE_MAX - PHRASE_WEAVE_MIN );
    lens.open += slack - ( lens.weave - PHRASE_WEAVE_MIN );
    const out: Phrase[] = [];
    let z = z0;
    for ( const role of PHRASE_SECTION ) {
        const end = Math.min( z1, snapCell( z + lens[ role ] ) );
        if ( end > z ) out.push( { ...rolePhrase( seed, role, m, act, k ), z0: z, z1: end } );
        z = Math.max( z, end );
    }
    const last = out[ out.length - 1 ];
    if ( last !== undefined ) last.z1 = z1;
    return out;
}

export function planPhrases( seed: number, length: number ): PhrasePlan {
    const start = phraseStartZ();
    const finish = finishPhraseZ( length );
    const vocabulary = fitSections( seed, finish - start );
    const sections = vocabulary.length;
    const mins = vocabulary.map( ( m, k ) => sectionMinLen( seed, k, m, actOf( k, sections ) ) );
    const total = mins.reduce( ( a, b ) => a + b, 0 );
    const phrases: Phrase[] = [];
    let z = start;
    let before = 0;
    for ( let k = 0; k < sections; k++ ) {
        before += mins[ k ];
        const end = k === sections - 1 ? finish : snapCell( start + ( before * ( finish - start ) ) / total );
        phrases.push( ...sectionPhrases( seed, k, sections, vocabulary[ k ], z, Math.max( z, end ) ) );
        z = Math.max( z, end );
    }
    const end = length * SEG_LEN;
    if ( end > finish )
        phrases.push( {
            role: 'finish',
            kind: 'arena',
            act: actOf( sections - 1, sections ),
            section: sections - 1,
            z0: finish,
            z1: end,
            notes: null,
            x0: 0,
            leadIn: 0,
            motif: null,
            twist: null,
            weave: null,
        } );
    return { seed, length, sections, vocabulary, phrases };
}

export function phraseSegments( seed: number ): number {
    const vocab = vocabularyFor( seed, PHRASE_SECTIONS );
    const body = vocab.reduce(
        ( sum, m, k ) =>
            sum + sectionMinLen( seed, k, m, actOf( k, PHRASE_SECTIONS ) ) + PHRASE_WEAVE_MAX - PHRASE_WEAVE_MIN,
        0,
    );
    return Math.ceil( ( phraseStartZ() + body + PHRASE_FINISH_LEN ) / SEG_LEN );
}
