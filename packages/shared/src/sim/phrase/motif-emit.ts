import { CELL, TRACK_CONTRACT } from '../../constants.js';
import { FRACTURE_SHADOW_Z } from '../fracture-shadow.js';
import { GROOVE_BEAT_Z } from '../groove/grammar.js';
import { type GrooveObstacle, HOLE_LEAD, ISLAND_MIN_DEPTH, SMASH_DEPTH, SMASH_WIDTH } from '../groove/islands.js';
import { GROOVE_LINE_LIMIT } from '../groove/line.js';
import type { MotifNote, MotifNoteKind, NoteToken } from '../score/notes.js';
import { HALF_WIDTH, MIN_LANE, SEG_LEN } from '../space.js';
import { noteBeats } from './vocabulary.js';

export const MOTIF_LEAD_BEATS = 1;
export const GATE_HALF = MIN_LANE / 2;
export const GATE_POST = 2 * CELL;
export const GATE_DEPTH = 6 * CELL;
export const GATE_NEAR_REACH = 2 * CELL;
export const JUMP_HOLE_HALF = 2 * CELL;
export const MOVE_CRUISE = TRACK_CONTRACT.registerCruise;

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

export function motifPhraseLen( notes: readonly MotifNote[] ): number {
    const beats = notes.reduce( ( sum, n ) => sum + noteBeats( n ), MOTIF_LEAD_BEATS );
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

export function placeMotif( notes: readonly MotifNote[], z0: number, x0: number, phrase: number ): PlacedNote[] {
    const out: PlacedNote[] = [];
    let beats = MOTIF_LEAD_BEATS;
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
        beats += noteBeats( n );
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

function gateOf( n: PlacedNote, endZ: number, event: number ): GrooveObstacle[] {
    const d = Math.sign( n.to - n.from );
    const z0 = snapUp( n.z + n.move * MOVE_CRUISE );
    const z1 = Math.min( z0 + GATE_DEPTH, snapCell( endZ ) );
    if ( z1 - z0 < ISLAND_MIN_DEPTH ) return [];
    const near = post( n.from - d * GATE_NEAR_REACH, n.to - d * GATE_HALF, z0, z1, event );
    const far = post( n.to + d * GATE_HALF, n.to + d * ( GATE_HALF + GATE_POST ), z0, z1, event );
    return [ near, far ].filter( ( o ) => o !== null );
}

function holeOf( n: PlacedNote, event: number ): GrooveObstacle {
    const [ x0, x1 ] = toWalls( n.from - JUMP_HOLE_HALF, n.from + JUMP_HOLE_HALF );
    const z0 = snapCell( n.z + HOLE_LEAD );
    const depth = n.kind === 'double' ? 2 * SEG_LEN : SEG_LEN;
    return { kind: 'hole', x0, x1, z0, z1: z0 + depth, event };
}

function smashOf( n: PlacedNote, endZ: number, event: number ): GrooveObstacle | null {
    const x0 = Math.max( -HALF_WIDTH, Math.min( HALF_WIDTH - SMASH_WIDTH, n.to - SMASH_WIDTH / 2 ) );
    const segEnd = ( Math.floor( ( n.z + CELL ) / SEG_LEN ) + 1 ) * SEG_LEN;
    const z0 = n.z + CELL + SMASH_DEPTH <= segEnd ? snapCell( n.z + CELL ) : segEnd;
    if ( z0 + SMASH_DEPTH + FRACTURE_SHADOW_Z > endZ ) return null;
    return { kind: 'smash', x0, x1: x0 + SMASH_WIDTH, z0, z1: z0 + SMASH_DEPTH, event };
}

export function emitMotif( placed: readonly PlacedNote[], phraseEnd: number, event0: number ): GrooveObstacle[] {
    const out: GrooveObstacle[] = [];
    placed.forEach( ( n, i ) => {
        const endZ = Math.min( phraseEnd, placed[ i + 1 ]?.z ?? phraseEnd );
        const event = event0 + i;
        if ( n.kind === 'step' || n.kind === 'held' ) out.push( ...gateOf( n, endZ, event ) );
        else if ( n.kind === 'jump' || n.kind === 'double' ) out.push( holeOf( n, event ) );
        else if ( n.kind === 'smash' ) {
            const s = smashOf( n, endZ, event );
            if ( s !== null ) out.push( s );
        }
    } );
    return out;
}
