import { CELL, FIXED_DT, type FlightTuning, MAX_SHIP_WIDTH, TRACK_CONTRACT } from '../../constants.js';
import { type JumpMode, newJumpPilot, steerJump } from '../../pacing/jump-window.js';
import { REGISTER_GAP_S } from '../../pacing/score.js';
import { HALF_WIDTH, SEG_LEN } from '../space.js';
import { simulate } from '../step.js';
import { type SimShip, spawnShip } from '../types.js';
import { CONTRACT_TUNING, isSettled, type StrafePlan, strafeInput, strafePlan } from './note-move.js';
import { type MotifNote, parseNotes } from './notes.js';

export interface Motif {
    id: string;
    notes: string;
    intensity: readonly [ number, number ];
    weight: number;
    mirror: boolean;
    stretch: readonly [ number, number ];
}

export interface ParsedMotif extends Motif {
    parsed: readonly MotifNote[];
    length: number;
}

export const MOTIF_MIN_NOTES = 3;
export const MOTIF_MAX_NOTES = 8;
export const MOTIF_FLIGHT_SPEEDS = [ TRACK_CONTRACT.pacingCruise, TRACK_CONTRACT.registerCruise ] as const;
export const MOTIF_MAX_EXTENT = 2 * HALF_WIDTH - MAX_SHIP_WIDTH;

const N3: Motif[ 'intensity' ] = [ 0, 0.6 ];
const N4: Motif[ 'intensity' ] = [ 0.3, 0.9 ];
const N5: Motif[ 'intensity' ] = [ 0.5, 1 ];

function seeded( id: string, notes: string, intensity: Motif[ 'intensity' ] ): Motif {
    return { id, notes, intensity, weight: 1, mirror: true, stretch: [ 1, 2 ] };
}

export const MOTIF_LIBRARY: readonly Motif[] = [
    seeded( 'n3-1', 'J l J', N3 ),
    seeded( 'n3-2', 'l J r', N3 ),
    seeded( 'n3-3', 'J l r', N3 ),
    seeded( 'n3-4', 'l J J', N3 ),
    seeded( 'n3-5', 'l r J', N3 ),
    seeded( 'n4-1', 'J l J J', N4 ),
    seeded( 'n4-2', 'J l r J', N4 ),
    seeded( 'n4-3', 'l J r J', N4 ),
    seeded( 'n4-4', 'l J l r', N4 ),
    seeded( 'n4-5', 'J l J r', N4 ),
    seeded( 'n5-1', 'L J r J J', N5 ),
    seeded( 'n5-2', 'J l r J l', N5 ),
    seeded( 'n5-3', 'l J l r J', N5 ),
    seeded( 'n5-4', 'J < R r l', N5 ),
    seeded( 'n5-5', 'J L r J J', N5 ),
];

type PlanCache = Map< number, StrafePlan | null >;

const contractPlans: PlanCache = new Map();

function planFor( cache: PlanCache, t: FlightTuning, cells: number ): StrafePlan | null {
    let plan = cache.get( cells );
    if ( plan === undefined ) {
        plan = strafePlan( t, cells * CELL );
        cache.set( cells, plan );
    }
    return plan;
}

function jumpModeOf( n: MotifNote ): JumpMode {
    if ( n.kind === 'jump' ) return 'single';
    if ( n.kind === 'double' ) return 'double';
    return 'none';
}

interface Flight {
    s: SimShip;
    tuning: FlightTuning;
    plans: PlanCache;
    tick: number;
    done: number;
    line: number;
    onset: number;
    last: string | null;
    out: string[];
}

function checkCalm( f: Flight ): void {
    const calm = f.done < 0 ? 0 : ( f.tick - f.done ) * FIXED_DT;
    if ( f.last !== null && calm < REGISTER_GAP_S )
        f.out.push( `${ f.last }: calm ${ calm.toFixed( 3 ) }s is under the ${ REGISTER_GAP_S }s register gap` );
}

function startNote( f: Flight, at: string ): void {
    checkCalm( f );
    f.last = at;
    if ( ! f.s.grounded || ! isSettled( f.s, f.line ) ) f.out.push( `${ at }: the ship is not settled at the onset` );
}

function flyNote( f: Flight, n: MotifNote, at: string ): void {
    const target = f.line + n.dir * n.cells * CELL;
    const plan = n.dir === 0 ? null : planFor( f.plans, f.tuning, n.cells );
    if ( n.dir !== 0 && plan === null )
        f.out.push( `${ at }: the contract ship cannot settle a ${ n.cells }-cell step` );
    const mode = jumpModeOf( n );
    const pilot = newJumpPilot();
    const next = f.onset + n.duration;
    const start = f.tick;
    while ( f.s.z < next ) {
        steerJump( pilot, mode, f.s, f.onset );
        if ( plan !== null ) strafeInput( plan, n.dir, f.tick - start, pilot.input );
        simulate( f.s, pilot.input, FIXED_DT, f.tuning );
        f.tick++;
        const ok = f.s.grounded && isSettled( f.s, target ) && ( mode === 'none' || pilot.done );
        if ( ! ok ) f.done = -1;
        else if ( f.done < 0 ) f.done = f.tick;
    }
    f.line = target;
    f.onset = next;
}

export function motifFlightFailures(
    notes: readonly MotifNote[],
    speed: number,
    t: FlightTuning = CONTRACT_TUNING,
): string[] {
    const s = spawnShip( 0, 0 );
    s.vz = speed;
    const f: Flight = {
        s,
        tuning: { ...t, maxCruise: speed },
        plans: t === CONTRACT_TUNING ? contractPlans : new Map(),
        tick: 0,
        done: 0,
        line: 0,
        onset: 0,
        last: null,
        out: [],
    };
    notes.forEach( ( n, i ) => {
        const at = `note ${ i + 1 } '${ n.token }' at ${ speed }u/s`;
        if ( n.kind !== 'rest' ) startNote( f, at );
        flyNote( f, n, at );
    } );
    checkCalm( f );
    return f.out;
}

function lineExtent( notes: readonly MotifNote[] ): number {
    let x = 0;
    let lo = 0;
    let hi = 0;
    for ( const n of notes ) {
        x += n.dir * n.cells * CELL;
        lo = Math.min( lo, x );
        hi = Math.max( hi, x );
    }
    return hi - lo;
}

function fieldFailures( m: Motif ): string[] {
    const out: string[] = [];
    const [ lo, hi ] = m.intensity;
    if ( ! ( 0 <= lo && lo <= hi && hi <= 1 ) ) out.push( `intensity [${ lo }, ${ hi }] is not inside [0, 1]` );
    if ( ! ( Number.isFinite( m.weight ) && m.weight > 0 ) ) out.push( `weight ${ m.weight } is not positive` );
    const [ s0, s1 ] = m.stretch;
    if ( ! ( Number.isInteger( s0 ) && Number.isInteger( s1 ) && 1 <= s0 && s0 <= s1 ) )
        out.push( `stretch [${ s0 }, ${ s1 }] is not a whole range from 1` );
    return out;
}

function noteFailures( notes: readonly MotifNote[] ): string[] {
    const out: string[] = [];
    if ( notes.length < MOTIF_MIN_NOTES || notes.length > MOTIF_MAX_NOTES )
        out.push( `${ notes.length } notes is outside ${ MOTIF_MIN_NOTES }–${ MOTIF_MAX_NOTES }` );
    if ( notes.every( ( n ) => n.kind === 'rest' ) ) out.push( 'every note is a rest' );
    for ( const n of notes )
        if ( n.duration % SEG_LEN !== 0 )
            out.push( `'${ n.token }' lasts ${ n.duration }u, off the ${ SEG_LEN }u grid` );
    const extent = lineExtent( notes );
    if ( extent > MOTIF_MAX_EXTENT ) out.push( `the line spans ${ extent }u, wider than ${ MOTIF_MAX_EXTENT }u` );
    for ( const speed of MOTIF_FLIGHT_SPEEDS ) out.push( ...motifFlightFailures( notes, speed ) );
    return out;
}

export function motifFailures( motifs: readonly Motif[] ): string[] {
    const out: string[] = [];
    const seen = new Set< string >();
    for ( const m of motifs ) {
        const own = fieldFailures( m );
        if ( m.id.length === 0 || seen.has( m.id ) ) own.push( 'the id is empty or repeated' );
        seen.add( m.id );
        try {
            own.push( ...noteFailures( parseNotes( m.notes ) ) );
        } catch ( e ) {
            own.push( ( e as Error ).message );
        }
        out.push( ...own.map( ( f ) => `${ m.id } '${ m.notes }': ${ f }` ) );
    }
    return out;
}

export function parseMotif( m: Motif ): ParsedMotif {
    const parsed = parseNotes( m.notes );
    return { ...m, parsed, length: parsed.reduce( ( sum, n ) => sum + n.duration, 0 ) };
}

export function motifDigest( motifs: readonly Motif[] ): number {
    const text = JSON.stringify( motifs );
    let h = 0x811c9dc5 | 0;
    for ( let i = 0; i < text.length; i++ ) h = Math.imul( h ^ text.charCodeAt( i ), 0x01000193 );
    return h >>> 0;
}

const libraryFailures = motifFailures( MOTIF_LIBRARY );
if ( libraryFailures.length > 0 )
    throw new Error( `the motif library breaks the score contract:\n  ${ libraryFailures.join( '\n  ' ) }` );

export const MOTIFS: readonly ParsedMotif[] = MOTIF_LIBRARY.map( parseMotif );
