import { CELL } from '../../constants.js';
import {
    HELD_MIN_CELLS,
    type NoteKind,
    REGISTER_GAP_Z,
    REST_UNIT_U,
    SCORE_REGISTER_CRUISE,
} from '../../pacing/score.js';
import { FRACTURE_SHADOW_Z } from '../fracture-shadow.js';
import { SEG_LEN } from '../space.js';
import { NOTE_MOVE_S } from './note-move.js';

export const NOTE_TOKENS = [ 'l', 'r', 'L', 'R', '<', '>', 'J', 'JJ', 'S', '.' ] as const;
export type NoteToken = ( typeof NOTE_TOKENS )[ number ];
export const ACCENT_MARK = '!';
export const SMASH_NOTE_DEPTH = CELL;

export type MotifNoteKind = NoteKind | 'rest';

export interface NoteShape {
    kind: MotifNoteKind;
    dir: number;
    cells: number;
}

export interface MotifNote extends NoteShape {
    token: NoteToken;
    accent: boolean;
    move: number;
    duration: number;
}

const SHAPES: Record< NoteToken, NoteShape > = {
    l: { kind: 'step', dir: -1, cells: 1 },
    r: { kind: 'step', dir: 1, cells: 1 },
    L: { kind: 'step', dir: -1, cells: 2 },
    R: { kind: 'step', dir: 1, cells: 2 },
    '<': { kind: 'held', dir: -1, cells: HELD_MIN_CELLS },
    '>': { kind: 'held', dir: 1, cells: HELD_MIN_CELLS },
    J: { kind: 'jump', dir: 0, cells: 0 },
    JJ: { kind: 'double', dir: 0, cells: 0 },
    S: { kind: 'smash', dir: 0, cells: 0 },
    '.': { kind: 'rest', dir: 0, cells: 0 },
};

export function isNoteToken( word: string ): word is NoteToken {
    return ( NOTE_TOKENS as readonly string[] ).includes( word );
}

export function noteMove( n: NoteShape ): number {
    switch ( n.kind ) {
        case 'step':
            return n.cells >= 2 ? NOTE_MOVE_S.step2 : NOTE_MOVE_S.step1;
        case 'held':
            return NOTE_MOVE_S.held;
        case 'jump':
            return NOTE_MOVE_S.jump;
        case 'double':
            return NOTE_MOVE_S.double;
        case 'smash':
            return SMASH_NOTE_DEPTH / SCORE_REGISTER_CRUISE;
        default:
            return 0;
    }
}

export function noteDuration( n: NoteShape ): number {
    if ( n.kind === 'rest' ) return REST_UNIT_U;
    const calm = n.kind === 'smash' ? Math.max( REGISTER_GAP_Z, FRACTURE_SHADOW_Z ) : REGISTER_GAP_Z;
    return Math.ceil( ( noteMove( n ) * SCORE_REGISTER_CRUISE + calm ) / SEG_LEN ) * SEG_LEN;
}

export function parseNotes( src: string ): MotifNote[] {
    const words = src.split( /\s+/ ).filter( ( w ) => w.length > 0 );
    if ( words.length === 0 ) throw new Error( 'the note string is empty' );
    return words.map( ( word, i ) => {
        const accent = word.startsWith( ACCENT_MARK );
        const token = accent ? word.slice( ACCENT_MARK.length ) : word;
        if ( ! isNoteToken( token ) )
            throw new Error( `note ${ i + 1 } '${ word }' is not one of ${ NOTE_TOKENS.join( ' ' ) }` );
        const shape = SHAPES[ token ];
        if ( accent && shape.kind === 'rest' ) throw new Error( `note ${ i + 1 }: a rest cannot carry an accent` );
        return { ...shape, token, accent, move: noteMove( shape ), duration: noteDuration( shape ) };
    } );
}

export function formatNotes( notes: readonly MotifNote[] ): string {
    return notes.map( ( n ) => ( n.accent ? ACCENT_MARK : '' ) + n.token ).join( ' ' );
}
