import { CELL } from '../../constants.js';
import { FRACTURE_SHADOW_Z } from '../fracture-shadow.js';
import { GROOVE_BEAT_Z, type GrooveBand } from '../groove/grammar.js';
import { type GrooveObstacle, HOLE_LEAD, ISLAND_MIN_DEPTH, SMASH_DEPTH, SMASH_WIDTH } from '../groove/islands.js';
import { GROOVE_LINE_LIMIT } from '../groove/line.js';
import { isLateral, SCORE_PIN_HALF } from '../score/emit.js';
import type { MotifNote, MotifNoteKind, NoteToken } from '../score/notes.js';
import { HALF_WIDTH, MIN_LANE, SEG_LEN } from '../space.js';
import { leadDistance } from './pitch.js';
import { beatsFor, noteBeats } from './vocabulary.js';

export const MOTIF_LEAD_BEATS = 1;
export const PIN_HALF = SCORE_PIN_HALF;
export const PIN_DEPTH = CELL;
export const GATE_FAR = MIN_LANE - PIN_HALF;
export const GATE_POST = 2 * CELL;
export const GATE_DEPTH = 6 * CELL;

export interface PlacedNote {
    token: NoteToken;
    kind: MotifNoteKind;
    move: number;
    z: number;
    from: number;
    to: number;
    phrase: number;
}

export function snapCell( z: number ): number {
    return Math.round( z / CELL ) * CELL;
}

export function motifLeadIn( act: GrooveBand, entry: number ): number {
    return entry === 0
        ? MOTIF_LEAD_BEATS
        : Math.max( MOTIF_LEAD_BEATS, beatsFor( leadDistance( act, entry ) + PIN_DEPTH ) );
}

export function motifPhraseLen( notes: readonly MotifNote[], act: GrooveBand, leadIn = MOTIF_LEAD_BEATS ): number {
    const beats = notes.reduce( ( sum, n ) => sum + noteBeats( n, act ), leadIn );
    return snapCell( beats * GROOVE_BEAT_Z );
}

export function motifSpan( notes: readonly MotifNote[] ): [ number, number ] {
    let x = 0;
    let lo = 0;
    let hi = 0;
    for ( const n of notes ) {
        x += n.dir * n.cells * CELL;
        lo = Math.min( lo, x );
        hi = Math.max( hi, x );
    }
    return [ lo, hi ];
}

export function centredStart( notes: readonly MotifNote[] ): number {
    const [ lo, hi ] = motifSpan( notes );
    const x0 = -snapCell( ( lo + hi ) / 2 );
    return Math.max( -GROOVE_LINE_LIMIT - lo, Math.min( GROOVE_LINE_LIMIT - hi, x0 ) );
}

export function placeMotif(
    notes: readonly MotifNote[],
    z0: number,
    x0: number,
    phrase: number,
    act: GrooveBand,
    leadIn = MOTIF_LEAD_BEATS,
): PlacedNote[] {
    const out: PlacedNote[] = [];
    let beats = leadIn;
    let x = x0;
    for ( const n of notes ) {
        const to = x + n.dir * n.cells * CELL;
        if ( n.kind !== 'rest' )
            out.push( {
                token: n.token,
                kind: n.kind,
                move: n.move,
                z: snapCell( z0 + beats * GROOVE_BEAT_Z ),
                from: x,
                to,
                phrase,
            } );
        beats += noteBeats( n, act );
        x = to;
    }
    return out;
}

function snapUp( z: number ): number {
    return Math.ceil( z / CELL ) * CELL;
}

function toWalls( x0: number, x1: number ): [ number, number ] {
    const lo = Math.max( -HALF_WIDTH, x0 + HALF_WIDTH < MIN_LANE ? -HALF_WIDTH : x0 );
    const hi = Math.min( HALF_WIDTH, HALF_WIDTH - x1 < MIN_LANE ? HALF_WIDTH : x1 );
    return [ lo, hi ];
}

function post( a: number, b: number, z0: number, z1: number, event: number ): GrooveObstacle | null {
    const [ x0, x1 ] = toWalls( Math.min( a, b ), Math.max( a, b ) );
    if ( x1 - x0 < CELL || x0 >= HALF_WIDTH || x1 <= -HALF_WIDTH ) return null;
    return { kind: 'island', x0, x1, z0, z1, event };
}

function noteEnd( next: PlacedNote | undefined, phraseEnd: number ): number {
    if ( next === undefined ) return phraseEnd;
    return Math.min( phraseEnd, next.z - ( isLateral( next ) ? PIN_DEPTH : 0 ) );
}

function pinOf( n: PlacedNote, event: number ): GrooveObstacle | null {
    const d = Math.sign( n.to - n.from );
    return post( n.from + d * PIN_HALF, d * HALF_WIDTH, n.z - PIN_DEPTH, n.z, event );
}

function gateOf( n: PlacedNote, act: GrooveBand, endZ: number, event: number ): GrooveObstacle[] {
    const d = Math.sign( n.to - n.from );
    const z0 = snapUp( n.z + leadDistance( act, n.to - n.from ) );
    const z1 = Math.min( z0 + GATE_DEPTH, snapCell( endZ ) );
    if ( z1 - z0 < ISLAND_MIN_DEPTH ) return [];
    const near = post( -d * HALF_WIDTH, n.to - d * PIN_HALF, z0, z1, event );
    const far = post( n.to + d * GATE_FAR, n.to + d * ( GATE_FAR + GATE_POST ), z0, z1, event );
    return [ near, far ].filter( ( o ) => o !== null );
}

function holeOf( n: PlacedNote, event: number ): GrooveObstacle {
    const z0 = snapCell( n.z + HOLE_LEAD );
    const depth = n.kind === 'double' ? 2 * SEG_LEN : SEG_LEN;
    return { kind: 'hole', x0: -HALF_WIDTH, x1: HALF_WIDTH, z0, z1: z0 + depth, event };
}

function smashOf( n: PlacedNote, endZ: number, event: number ): GrooveObstacle | null {
    const x0 = Math.max( -HALF_WIDTH, Math.min( HALF_WIDTH - SMASH_WIDTH, n.to - SMASH_WIDTH / 2 ) );
    const segEnd = ( Math.floor( ( n.z + CELL ) / SEG_LEN ) + 1 ) * SEG_LEN;
    const z0 = n.z + CELL + SMASH_DEPTH <= segEnd ? snapCell( n.z + CELL ) : segEnd;
    if ( z0 + SMASH_DEPTH + FRACTURE_SHADOW_Z > endZ ) return null;
    return { kind: 'smash', x0, x1: x0 + SMASH_WIDTH, z0, z1: z0 + SMASH_DEPTH, event };
}

export function emitMotif(
    placed: readonly PlacedNote[],
    act: GrooveBand,
    phraseEnd: number,
    event0: number,
): GrooveObstacle[] {
    const out: GrooveObstacle[] = [];
    placed.forEach( ( n, i ) => {
        const endZ = noteEnd( placed[ i + 1 ], phraseEnd );
        const event = event0 + i;
        if ( isLateral( n ) )
            out.push( ...[ pinOf( n, event ) ].filter( ( o ) => o !== null ), ...gateOf( n, act, endZ, event ) );
        else if ( n.kind === 'jump' || n.kind === 'double' ) out.push( holeOf( n, event ) );
        else if ( n.kind === 'smash' ) {
            const s = smashOf( n, endZ, event );
            if ( s !== null ) out.push( s );
        }
    } );
    return out;
}
