import type { ScoreNote } from './score.js';

export const NGRAM_MIN = 3;
export const NGRAM_MAX = 8;
export const PHRASE_BREAK_RESTS = 4;
export const REST_TOKEN = '.';

export interface NoteGram {
    gram: string;
    notes: number;
    count: number;
}

export interface GramOptions {
    min?: number;
    max?: number;
    rests?: boolean;
}

const MIRROR: Record< string, string > = { l: 'r', r: 'l', L: 'R', R: 'L', '<': '>', '>': '<' };

export function mirrorToken( token: string ): string {
    return MIRROR[ token ] ?? token;
}

export function canonicalGram( tokens: string[] ): string {
    const plain = tokens.join( ' ' );
    const mirrored = tokens.map( mirrorToken ).join( ' ' );
    return mirrored < plain ? mirrored : plain;
}

export function scorePhrases( notes: ScoreNote[], rests = true ): string[][][] {
    const phrases: string[][][] = [];
    let cur: string[][] = [];
    for ( const n of notes ) {
        const beat = [ n.token ];
        cur.push( beat );
        if ( n.rests >= PHRASE_BREAK_RESTS ) {
            phrases.push( cur );
            cur = [];
        } else if ( rests ) for ( let r = 0; r < n.rests; r++ ) beat.push( REST_TOKEN );
    }
    if ( cur.length > 0 ) phrases.push( cur );
    return phrases;
}

export function countGrams( scores: ScoreNote[][], options: GramOptions = {} ): Map< string, number > {
    const min = options.min ?? NGRAM_MIN;
    const max = options.max ?? NGRAM_MAX;
    const counts = new Map< string, number >();
    for ( const notes of scores ) {
        for ( const phrase of scorePhrases( notes, options.rests ?? true ) ) {
            for ( let i = 0; i < phrase.length; i++ ) {
                for ( let n = min; n <= max && i + n <= phrase.length; n++ ) {
                    const beats = phrase.slice( i, i + n );
                    const last = beats[ n - 1 ];
                    const tokens = [ ...beats.slice( 0, -1 ).flat(), last[ 0 ] ];
                    const key = canonicalGram( tokens );
                    counts.set( key, ( counts.get( key ) ?? 0 ) + 1 );
                }
            }
        }
    }
    return counts;
}

export function topGrams( counts: Map< string, number >, limit: number ): NoteGram[] {
    return [ ...counts ]
        .map( ( [ gram, count ] ) => ( {
            gram,
            count,
            notes: gram.split( ' ' ).filter( ( t ) => t !== REST_TOKEN ).length,
        } ) )
        .sort( ( a, b ) => b.count - a.count || b.notes - a.notes || ( a.gram < b.gram ? -1 : 1 ) )
        .slice( 0, limit );
}
