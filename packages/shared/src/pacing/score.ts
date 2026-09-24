import { CELL } from '../constants.js';
import { FASTEST_CRUISE } from '../ship-classes.js';
import { FRACTURE_SHADOW_Z } from '../sim/fracture-shadow.js';
import { type Block, SEG_LEN, type Segment, spanHasZ } from '../sim/space.js';
import { PACING_DX, PACING_DZ, PACING_HULL, sampleZ } from './grid.js';
import type { PacingIntent } from './intent.js';
import type { ReferencePath } from './reference-path.js';

export const REGISTER_GAP_S = 0.5;
export const SCORE_REGISTER_CRUISE = FASTEST_CRUISE;
export const REGISTER_GAP_Z = REGISTER_GAP_S * SCORE_REGISTER_CRUISE;
export const NOTE_MERGE_U = 4;
export const NOTE_MIN_STEP_U = CELL - PACING_DX;
export const HELD_MIN_CELLS = 3;
export const NOTE_MOVE_S = { step1: 0.367, step2: 0.55, jump: 0.517, double: 1.15 } as const;
export const REST_UNIT_U = 60;
export const ADHERENCE_WINDOW_U = REGISTER_GAP_Z;

export type NoteKind = 'step' | 'held' | 'jump' | 'double' | 'smash';
export type NoteVoice = 'lateral' | 'air' | 'smash';

export interface ScoreNote {
    kind: NoteKind;
    k0: number;
    k1: number;
    dir: number;
    cells: number;
    token: string;
    spacing: number;
    early: number;
    rests: number;
}

export interface ScoreCalm {
    k0: number;
    k1: number;
    drift: number;
}

export interface PacingScore {
    notes: ScoreNote[];
    calms: ScoreCalm[];
    breaches: number;
}

export interface ScoreAdherence {
    notes: number;
    played: number;
    share: number;
    window: number;
}

export type ScoreLine = Pick< ReferencePath, 'x' | 'air' >;

function note( kind: NoteKind, k0: number, k1: number, dir = 0, cells = 0 ): ScoreNote {
    return { kind, k0, k1, dir, cells, token: '', spacing: 0, early: 0, rests: 0 };
}

function lateralNotes( x: Float32Array, mergeU: number ): ScoreNote[] {
    const runs: ScoreNote[] = [];
    const mergeGap = mergeU / PACING_DZ;
    let cur: ScoreNote | null = null;
    for ( let k = 1; k < x.length; k++ ) {
        const dx = x[ k ] - x[ k - 1 ];
        if ( dx === 0 ) continue;
        const dir = dx < 0 ? -1 : 1;
        if ( cur !== null && cur.dir === dir && k - cur.k1 <= mergeGap ) {
            cur.k1 = k;
            continue;
        }
        cur = note( 'step', k - 1, k, dir );
        runs.push( cur );
    }
    const out: ScoreNote[] = [];
    for ( const r of runs ) {
        const dist = Math.abs( x[ r.k1 ] - x[ r.k0 ] );
        if ( dist < NOTE_MIN_STEP_U ) continue;
        r.cells = Math.max( 1, Math.round( dist / CELL ) );
        if ( r.cells >= HELD_MIN_CELLS ) r.kind = 'held';
        out.push( r );
    }
    return out;
}

function airNotes( air: Uint8Array, singleAir: number ): ScoreNote[] {
    const out: ScoreNote[] = [];
    let k = 0;
    while ( k < air.length ) {
        if ( air[ k ] === 0 ) {
            k++;
            continue;
        }
        let end = k;
        while ( end < air.length && air[ end ] === 1 ) end++;
        out.push( note( ( end - k ) * PACING_DZ > singleAir ? 'double' : 'jump', k, end - 1 ) );
        k = end;
    }
    return out;
}

function lineHits( x: Float32Array, b: Block, k: number ): boolean {
    const z = sampleZ( k );
    return z >= b.z0 && z < b.z1 && b.x0 < x[ k ] + PACING_HULL && b.x1 > x[ k ] - PACING_HULL;
}

function smashOf( x: Float32Array, b: Block ): ScoreNote | null {
    let hit: ScoreNote | null = null;
    const k0 = Math.max( 0, Math.floor( b.z0 / PACING_DZ ) );
    const k1 = Math.min( x.length - 1, Math.ceil( b.z1 / PACING_DZ ) );
    for ( let k = k0; k <= k1; k++ ) {
        if ( ! lineHits( x, b, k ) ) continue;
        if ( hit === null ) hit = note( 'smash', k, k );
        else hit.k1 = k;
    }
    return hit;
}

function smashNotes( x: Float32Array, segments: Segment[] ): ScoreNote[] {
    const out: ScoreNote[] = [];
    for ( const seg of segments ) {
        for ( const b of seg.blocks ) {
            const hit = b.kind === 'fractured' ? smashOf( x, b ) : null;
            if ( hit !== null ) out.push( hit );
        }
    }
    return out;
}

export function noteToken( n: Pick< ScoreNote, 'kind' | 'dir' | 'cells' > ): string {
    switch ( n.kind ) {
        case 'jump':
            return 'J';
        case 'double':
            return 'JJ';
        case 'smash':
            return 'S';
        case 'held':
            return n.dir < 0 ? '<' : '>';
        default:
            if ( n.cells >= 2 ) return n.dir < 0 ? 'L' : 'R';
            return n.dir < 0 ? 'l' : 'r';
    }
}

export function noteMoveSeconds( n: Pick< ScoreNote, 'kind' | 'k0' | 'k1' | 'cells' > ): number {
    const span = ( ( n.k1 - n.k0 + 1 ) * PACING_DZ ) / SCORE_REGISTER_CRUISE;
    switch ( n.kind ) {
        case 'jump':
            return NOTE_MOVE_S.jump;
        case 'double':
            return NOTE_MOVE_S.double;
        case 'smash':
            return span;
        case 'held':
            return Math.max( NOTE_MOVE_S.step2, span );
        default:
            return n.cells >= 2 ? NOTE_MOVE_S.step2 : NOTE_MOVE_S.step1;
    }
}

export function noteSpacing( n: Pick< ScoreNote, 'kind' | 'k0' | 'k1' | 'cells' > ): number {
    const move = noteMoveSeconds( n ) * SCORE_REGISTER_CRUISE;
    if ( n.kind === 'smash' ) return move + Math.max( REGISTER_GAP_Z, FRACTURE_SHADOW_Z );
    return move + REGISTER_GAP_Z;
}

export function noteVoice( n: Pick< ScoreNote, 'kind' > ): NoteVoice {
    if ( n.kind === 'jump' || n.kind === 'double' ) return 'air';
    if ( n.kind === 'smash' ) return 'smash';
    return 'lateral';
}

function calmSpans( x: Float32Array, notes: ScoreNote[] ): ScoreCalm[] {
    const out: ScoreCalm[] = [];
    let from = 0;
    const push = ( k0: number, k1: number ): void => {
        if ( k1 <= k0 ) return;
        let drift = 0;
        for ( let k = k0; k < k1; k++ ) drift = Math.max( drift, Math.abs( x[ k ] - x[ k0 ] ) );
        out.push( { k0, k1, drift } );
    };
    for ( const n of notes ) {
        push( from, n.k0 );
        from = Math.max( from, n.k1 + 1 );
    }
    push( from, x.length );
    return out;
}

export function transcribe(
    line: ScoreLine,
    segments: Segment[],
    singleAir: number,
    mergeU = NOTE_MERGE_U,
): PacingScore {
    const notes = [
        ...lateralNotes( line.x, mergeU ),
        ...airNotes( line.air, singleAir ),
        ...smashNotes( line.x, segments ),
    ].sort( ( a, b ) => a.k0 - b.k0 || a.k1 - b.k1 );
    let allowed = Number.NEGATIVE_INFINITY;
    let breaches = 0;
    let prev: ScoreNote | null = null;
    for ( const n of notes ) {
        n.token = noteToken( n );
        n.spacing = noteSpacing( n );
        const z = n.k0 * PACING_DZ;
        n.early = Math.max( 0, allowed - z );
        if ( n.early > 0 ) breaches++;
        if ( prev !== null ) prev.rests = Math.floor( Math.max( 0, z - allowed ) / REST_UNIT_U );
        allowed = Math.max( allowed, z + n.spacing );
        prev = n;
    }
    return { notes, calms: calmSpans( line.x, notes ), breaches };
}

export function intentLine( intent: PacingIntent, segments: Segment[], count: number ): ScoreLine {
    const x = new Float32Array( count );
    const air = new Uint8Array( count );
    let last = 0;
    for ( let k = 0; k < count; k++ ) {
        const z = sampleZ( k );
        const i = Math.floor( z / SEG_LEN );
        const band = intent.bands[ i ];
        if ( band ) last = ( band.x0 + band.x1 ) / 2;
        x[ k ] = last;
        const seg = segments[ i ];
        if (
            seg?.kind === 'gap' &&
            ! seg.floors.some( ( f ) => spanHasZ( seg, f, z ) && f.x0 <= last && last <= f.x1 )
        )
            air[ k ] = 1;
    }
    return { x, air };
}

export function scoreAdherence( score: ScoreNote[], played: ScoreNote[], window = ADHERENCE_WINDOW_U ): ScoreAdherence {
    const used = new Uint8Array( played.length );
    let hits = 0;
    for ( const n of score ) {
        let best = -1;
        let bestD = Number.POSITIVE_INFINITY;
        played.forEach( ( p, i ) => {
            if ( used[ i ] === 1 || noteVoice( p ) !== noteVoice( n ) || p.dir !== n.dir ) return;
            const d = Math.abs( p.k0 - n.k0 ) * PACING_DZ;
            if ( d <= window && d < bestD ) {
                best = i;
                bestD = d;
            }
        } );
        if ( best < 0 ) continue;
        used[ best ] = 1;
        hits++;
    }
    return { notes: score.length, played: hits, share: score.length === 0 ? 1 : hits / score.length, window };
}
