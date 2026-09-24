import { CELL, MAX_SHIP_WIDTH, REST_INTENSITY } from '../../constants.js';
import { intensityAt } from '../intensity.js';
import { hash2, mulberry32 } from '../rng.js';
import { clamp, HALF_WIDTH, MIN_LANE, SEG_LEN, START_SAFE, TRACK_SEGMENTS } from '../space.js';
import { MOTIFS, type ParsedMotif } from './motifs.js';
import { type MotifNote, type NoteToken, parseNotes } from './notes.js';

export const SCORE_LINE_LIMIT = HALF_WIDTH - MIN_LANE + MAX_SHIP_WIDTH / 2;
export const SCORE_REPEAT_MAX = 2;
export const SCORE_BREATH_MAX_RESTS = 4;
export const SCORE_ATTEMPTS = 4;

const SALT_SCORE = 0x4b7e2d93 | 0;

export interface Variation {
    mirror: boolean;
    repeat: number;
    stretch: number;
}

export interface ComposedNote extends MotifNote {
    z: number;
    x: number;
    phrase: number;
}

export interface ComposedPhrase {
    index: number;
    motif: string | null;
    variation: Variation | null;
    attempt: number;
    intensity: number;
    z0: number;
    z1: number;
}

export type IntensityCurve = readonly number[];

export interface ComposedScore {
    seed: number;
    length: number;
    curve?: IntensityCurve;
    phrases: ComposedPhrase[];
    notes: ComposedNote[];
}

export function scoreIntensityAt( i: number, length: number, curve?: IntensityCurve ): number {
    if ( curve === undefined || curve.length === 0 ) return intensityAt( i, length );
    return clamp( curve[ clamp( i, 0, curve.length - 1 ) ], 0, 1 );
}

interface Chosen {
    motif: ParsedMotif;
    variation: Variation;
    attempt: number;
    notes: MotifNote[];
}

const MIRROR: Record< NoteToken, NoteToken > = {
    l: 'r',
    r: 'l',
    L: 'R',
    R: 'L',
    '<': '>',
    '>': '<',
    J: 'J',
    JJ: 'JJ',
    S: 'S',
    '.': '.',
};

export const REST_NOTE: MotifNote = parseNotes( '.' )[ 0 ];

export function mirrorNote( n: MotifNote ): MotifNote {
    return { ...n, token: MIRROR[ n.token ], dir: n.dir === 0 ? 0 : -n.dir };
}

export function varyMotif( m: ParsedMotif, v: Variation ): MotifNote[] {
    const once = v.mirror ? m.parsed.map( mirrorNote ) : m.parsed;
    const flat: MotifNote[] = [];
    for ( let k = 0; k < v.repeat; k++ ) flat.push( ...once );
    const out: MotifNote[] = [];
    flat.forEach( ( n, i ) => {
        out.push( n );
        if ( i < flat.length - 1 ) for ( let k = 1; k < v.stretch; k++ ) out.push( REST_NOTE );
    } );
    return out;
}

export function rollVariation( m: ParsedMotif, rnd: () => number ): Variation {
    const flip = rnd() < 0.5;
    const repeat = 1 + Math.floor( rnd() * SCORE_REPEAT_MAX );
    const [ s0, s1 ] = m.stretch;
    const stretch = s0 + Math.floor( rnd() * ( s1 - s0 + 1 ) );
    return { mirror: m.mirror && flip, repeat, stretch };
}

export function phraseFits( notes: readonly MotifNote[], x0: number ): boolean {
    let x = x0;
    for ( const n of notes ) {
        x += n.dir * n.cells * CELL;
        if ( Math.abs( x ) > SCORE_LINE_LIMIT ) return false;
    }
    return true;
}

export function phraseLength( notes: readonly MotifNote[] ): number {
    return notes.reduce( ( sum, n ) => sum + n.duration, 0 );
}

export function motifsAt( intensity: number, motifs: readonly ParsedMotif[] = MOTIFS ): ParsedMotif[] {
    if ( intensity < REST_INTENSITY ) return [];
    return motifs.filter( ( m ) => m.intensity[ 0 ] <= intensity && intensity <= m.intensity[ 1 ] );
}

function pickMotif( candidates: readonly ParsedMotif[], r: number ): ParsedMotif {
    const total = candidates.reduce( ( sum, m ) => sum + m.weight, 0 );
    let acc = r * total;
    for ( const m of candidates ) {
        acc -= m.weight;
        if ( acc < 0 ) return m;
    }
    return candidates[ candidates.length - 1 ];
}

export function choosePhrase(
    seed: number,
    index: number,
    intensity: number,
    x: number,
    room: number,
    motifs: readonly ParsedMotif[] = MOTIFS,
): Chosen | null {
    const candidates = motifsAt( intensity, motifs );
    if ( candidates.length === 0 ) return null;
    for ( let attempt = 0; attempt < SCORE_ATTEMPTS; attempt++ ) {
        const rnd = mulberry32( hash2( ( seed ^ SALT_SCORE ) | 0, index * ( SCORE_ATTEMPTS + 1 ) + attempt ) );
        const motif = pickMotif( candidates, rnd() );
        const variation = rollVariation( motif, rnd );
        let notes = varyMotif( motif, variation );
        if ( ! phraseFits( notes, x ) && motif.mirror ) {
            variation.mirror = ! variation.mirror;
            notes = varyMotif( motif, variation );
        }
        if ( phraseFits( notes, x ) && phraseLength( notes ) <= room ) return { motif, variation, attempt, notes };
    }
    return null;
}

export function breathRests( intensity: number ): number {
    return Math.round( SCORE_BREATH_MAX_RESTS * ( 1 - intensity ) );
}

export function composeScore(
    seed: number,
    length: number = TRACK_SEGMENTS,
    motifs: readonly ParsedMotif[] = MOTIFS,
    curve?: IntensityCurve,
): ComposedScore {
    const end = length * SEG_LEN;
    const phrases: ComposedPhrase[] = [];
    const notes: ComposedNote[] = [];
    let z = START_SAFE * SEG_LEN;
    let x = 0;
    const place = ( n: MotifNote, phrase: number ): void => {
        x += n.dir * n.cells * CELL;
        notes.push( { ...n, z, x, phrase } );
        z += n.duration;
    };
    while ( end - z >= REST_NOTE.duration ) {
        const index = phrases.length;
        const z0 = z;
        const intensity = scoreIntensityAt( Math.floor( z / SEG_LEN ), length, curve );
        const chosen = index === 0 ? null : choosePhrase( seed, index, intensity, x, end - z, motifs );
        if ( chosen === null ) place( REST_NOTE, index );
        else {
            for ( const n of chosen.notes ) place( n, index );
            for ( let k = breathRests( intensity ); k > 0 && end - z >= REST_NOTE.duration; k-- )
                place( REST_NOTE, index );
        }
        phrases.push( phraseRecord( index, chosen, intensity, z0, z ) );
    }
    if ( curve === undefined ) return { seed, length, phrases, notes };
    return { seed, length, curve: [ ...curve ], phrases, notes };
}

function phraseRecord(
    index: number,
    chosen: Chosen | null,
    intensity: number,
    z0: number,
    z1: number,
): ComposedPhrase {
    if ( chosen === null ) return { index, motif: null, variation: null, attempt: -1, intensity, z0, z1 };
    return { index, motif: chosen.motif.id, variation: chosen.variation, attempt: chosen.attempt, intensity, z0, z1 };
}
