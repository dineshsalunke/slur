import { CELL } from '../../constants.js';
import { GROOVE_BANDS, GROOVE_BEAT_Z, type GrooveBand } from '../groove/grammar.js';
import { SEG_LEN, START_SAFE } from '../space.js';

export type PhraseRole = 'open' | 'teach' | 'repeat' | 'set' | 'weave' | 'twist' | 'rest' | 'finish';

export type PhraseKind = 'arena' | 'motif' | 'rest';

export interface Phrase {
    role: PhraseRole;
    kind: PhraseKind;
    act: GrooveBand;
    section: number;
    z0: number;
    z1: number;
}

export interface PhrasePlan {
    length: number;
    sections: number;
    phrases: Phrase[];
}

export const PHRASE_SECTION: readonly PhraseRole[] = [ 'open', 'teach', 'repeat', 'set', 'weave', 'twist', 'rest' ];

export const PHRASE_ROLE_KIND: Readonly< Record< PhraseRole, PhraseKind > > = {
    open: 'arena',
    teach: 'motif',
    repeat: 'motif',
    set: 'arena',
    weave: 'motif',
    twist: 'motif',
    rest: 'rest',
    finish: 'arena',
};

export const PHRASE_SECTION_LEN = 1952;
export const PHRASE_ARENA_LEN = 280;
export const PHRASE_FINISH_LEN = 300;
export const PHRASE_REST_LEN = snapCell( GROOVE_BEAT_Z );

export const PHRASE_FIXED_LEN: Readonly< Partial< Record< PhraseRole, number > > > = {
    open: PHRASE_ARENA_LEN,
    set: PHRASE_ARENA_LEN,
    rest: PHRASE_REST_LEN,
};

export function snapCell( z: number ): number {
    return Math.round( z / CELL ) * CELL;
}

export function phraseStartZ(): number {
    return START_SAFE * SEG_LEN;
}

export function finishPhraseZ( length: number ): number {
    return Math.max( phraseStartZ(), snapCell( length * SEG_LEN - PHRASE_FINISH_LEN ) );
}

export function sectionCount( length: number ): number {
    return Math.max( 1, Math.round( ( finishPhraseZ( length ) - phraseStartZ() ) / PHRASE_SECTION_LEN ) );
}

export function actOf( section: number, sections: number ): GrooveBand {
    const k = Math.floor( ( section * GROOVE_BANDS.length ) / sections );
    return GROOVE_BANDS[ Math.min( GROOVE_BANDS.length - 1, k ) ];
}

function sectionPhrases( section: number, sections: number, z0: number, z1: number ): Phrase[] {
    const fixed = PHRASE_SECTION.reduce( ( sum, r ) => sum + ( PHRASE_FIXED_LEN[ r ] ?? 0 ), 0 );
    const flexCount = PHRASE_SECTION.filter( ( r ) => PHRASE_FIXED_LEN[ r ] === undefined ).length;
    const flex = Math.max( 0, ( z1 - z0 - fixed ) / flexCount );
    const act = actOf( section, sections );
    const out: Phrase[] = [];
    let acc = z0;
    let z = z0;
    for ( const role of PHRASE_SECTION ) {
        acc += PHRASE_FIXED_LEN[ role ] ?? flex;
        const end = Math.min( z1, snapCell( acc ) );
        if ( end > z ) out.push( { role, kind: PHRASE_ROLE_KIND[ role ], act, section, z0: z, z1: end } );
        z = Math.max( z, end );
    }
    const last = out[ out.length - 1 ];
    if ( last !== undefined ) last.z1 = z1;
    return out;
}

export function planPhrases( length: number ): PhrasePlan {
    const start = phraseStartZ();
    const finish = finishPhraseZ( length );
    const sections = sectionCount( length );
    const bound = ( k: number ): number =>
        k === sections ? finish : snapCell( start + ( k * ( finish - start ) ) / sections );
    const phrases: Phrase[] = [];
    for ( let k = 0; k < sections; k++ ) phrases.push( ...sectionPhrases( k, sections, bound( k ), bound( k + 1 ) ) );
    const end = length * SEG_LEN;
    if ( end > finish )
        phrases.push( {
            role: 'finish',
            kind: 'arena',
            act: actOf( sections - 1, sections ),
            section: sections - 1,
            z0: finish,
            z1: end,
        } );
    return { length, sections, phrases };
}
