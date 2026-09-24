import { type FlightTuning, TRACK_CONTRACT } from '../constants.js';
import { SHIP_CLASSES, type ShipClassId } from '../ship-classes.js';
import type { PlayerInput } from '../sim/input.js';
import type { Track } from '../sim/space.js';
import { simulate } from '../sim/step.js';
import { spawnShip } from '../sim/types.js';
import {
    buildGrid,
    CELL_GROUND,
    classHull,
    columnX,
    type FrozenTrack,
    nearestColumn,
    PACING_DZ,
    type PacingGrid,
    sampleZ,
} from './grid.js';
import { airDistance } from './jump-window.js';
import { maxColumnStep } from './reference-path.js';
import { anyNear, legalMask, type RouteRegion, regionsOf } from './viable.js';

export const POCKET_SLOT_MIN_U = 2;

const DT = 1 / 60;
const SWEEP_DZ = 0.1;
const SWEEP_PAD = 1.5;
const MAX_TICKS = 60 * 3;
const STRAFE_TICKS = 3;
const ARRIVE_U = 0.05;
const ARRIVE_VX = 0.5;
const DOOR_DEPTH = 2;
const DOOR_AHEAD = Math.ceil( POCKET_SLOT_MIN_U / 2 / PACING_DZ ) + 1;

export interface PacingPocket extends RouteRegion {
    classId: ShipClassId;
    doors: number;
    window: number;
    trapped: boolean;
}

export interface PocketGroup {
    k0: number;
    k1: number;
    x0: number;
    x1: number;
    classes: ShipClassId[];
}

interface Reach {
    grid: PacingGrid;
    legal: Uint8Array;
    fwd: Uint8Array;
    bwd: Uint8Array;
}

function isGround( r: Reach, i: number ): boolean {
    return r.legal[ i ] === 1 && r.grid.cells[ i ] === CELL_GROUND;
}

function spreadRow( r: Reach, out: Uint8Array, k: number ): void {
    const { cols } = r.grid;
    const base = k * cols;
    for ( let j = 1; j < cols; j++ ) {
        if ( out[ base + j - 1 ] === 1 && isGround( r, base + j - 1 ) && isGround( r, base + j ) ) out[ base + j ] = 1;
    }
    for ( let j = cols - 2; j >= 0; j-- ) {
        if ( out[ base + j + 1 ] === 1 && isGround( r, base + j + 1 ) && isGround( r, base + j ) ) out[ base + j ] = 1;
    }
}

function seedRow( r: Reach, out: Uint8Array, k: number, from: number, step: number ): void {
    const { cols } = r.grid;
    for ( let j = 0; j < cols; j++ ) {
        if ( r.legal[ k * cols + j ] === 1 && anyNear( out, from, cols, j, step ) ) out[ k * cols + j ] = 1;
    }
    spreadRow( r, out, k );
}

function stoppingReach( grid: PacingGrid, airLimit: number, step: number ): Reach {
    const { count, cols } = grid;
    const r: Reach = {
        grid,
        legal: legalMask( grid, airLimit, step ),
        fwd: new Uint8Array( count * cols ),
        bwd: new Uint8Array( count * cols ),
    };
    const j0 = nearestColumn( 0, grid.hull );
    r.fwd[ j0 ] = r.legal[ j0 ];
    spreadRow( r, r.fwd, 0 );
    for ( let k = 1; k < count; k++ ) seedRow( r, r.fwd, k, k - 1, step );
    for ( let j = 0; j < cols; j++ ) r.bwd[ ( count - 1 ) * cols + j ] = r.legal[ ( count - 1 ) * cols + j ];
    for ( let k = count - 2; k >= 0; k-- ) seedRow( r, r.bwd, k, k + 1, step );
    return r;
}

function deadMask( r: Reach ): Uint8Array {
    const out = new Uint8Array( r.fwd.length );
    for ( let i = 0; i < out.length; i++ ) out[ i ] = r.fwd[ i ] & ( 1 - r.bwd[ i ] );
    return out;
}

function pocketColumns( dead: Uint8Array, grid: PacingGrid, p: RouteRegion, k: number ): number[] {
    const out: number[] = [];
    const row = Math.min( Math.max( k, p.k0 ), p.k1 );
    for ( let j = nearestColumn( p.x0, grid.hull ); j <= nearestColumn( p.x1, grid.hull ); j++ ) {
        if ( dead[ row * grid.cols + j ] === 1 ) out.push( j );
    }
    return out;
}

function groundRun( r: Reach, k: number, j: number ): [ number, number ] | null {
    const { cols } = r.grid;
    if ( ! isGround( r, k * cols + j ) ) return null;
    let a = j;
    let b = j;
    while ( a > 0 && isGround( r, k * cols + a - 1 ) ) a--;
    while ( b < cols - 1 && isGround( r, k * cols + b + 1 ) ) b++;
    return [ a, b ];
}

interface Door {
    k: number;
    xs: number[];
}

interface Scene {
    phys: Reach;
    slot: Reach;
    dead: Uint8Array;
}

function isDoor( scene: Scene, k: number, q: number ): boolean {
    const { cols, count } = scene.slot.grid;
    if ( scene.dead[ k * cols + q ] === 1 ) return false;
    for ( let d = 0; d <= DOOR_AHEAD && k + d < count; d++ )
        if ( scene.slot.bwd[ ( k + d ) * cols + q ] === 1 ) return true;
    return false;
}

function doorInRun( scene: Scene, run: [ number, number ], k: number, mid: number ): Door | null {
    let best = -1;
    for ( let q = run[ 0 ]; q <= run[ 1 ]; q++ ) {
        if ( ! isDoor( scene, k, q ) ) continue;
        if ( best < 0 || Math.abs( q - mid ) < Math.abs( best - mid ) ) best = q;
    }
    if ( best < 0 ) return null;
    const deeper = best + ( best < mid ? -DOOR_DEPTH : DOOR_DEPTH );
    const cols = [ best ];
    if ( deeper >= run[ 0 ] && deeper <= run[ 1 ] && isDoor( scene, k, deeper ) ) cols.push( deeper );
    return { k, xs: cols.map( ( q ) => columnX( q, scene.phys.grid.hull ) ) };
}

function doorsInRow( scene: Scene, cols: number[], k: number ): Door[] {
    const out: Door[] = [];
    const seen = new Set< number >();
    const mid = cols.reduce( ( s, j ) => s + j, 0 ) / cols.length;
    for ( const j of cols ) {
        const run = groundRun( scene.phys, k, j );
        if ( run === null || seen.has( run[ 0 ] ) ) continue;
        seen.add( run[ 0 ] );
        const door = doorInRun( scene, run, k, mid );
        if ( door !== null ) out.push( door );
    }
    return out;
}

function findDoors( scene: Scene, p: RouteRegion ): Door[] {
    const out: Door[] = [];
    const last = Math.min( p.k1 + 2, scene.phys.grid.count - 1 );
    for ( let k = p.k0; k <= last; k++ ) {
        const cols = pocketColumns( scene.dead, scene.slot.grid, p, k );
        if ( cols.length > 0 ) out.push( ...doorsInRow( scene, cols, k ) );
    }
    return out;
}

export interface SqueezeAttempt {
    fromX: number;
    stopZ: number;
    toX: number;
}

function strafeToward( t: FlightTuning, err: number, vx: number ): number {
    const want = Math.sign( err ) * Math.min( t.strafeClamp, Math.sqrt( t.strafeAccel * Math.abs( err ) ) );
    return Math.max( -1, Math.min( 1, ( want - vx ) / ( t.strafeAccel * DT * STRAFE_TICKS ) ) );
}

export function squeezesThrough( track: Track, t: FlightTuning, a: SqueezeAttempt ): boolean {
    const s = spawnShip( a.fromX, a.stopZ );
    const input: PlayerInput = { seq: 0, throttle: 0, brake: 1, strafe: 0, jump: false };
    for ( let n = 0; n < MAX_TICKS; n++ ) {
        const err = a.toX - s.x;
        if ( Math.abs( err ) < ARRIVE_U && Math.abs( s.vx ) < ARRIVE_VX ) return true;
        input.strafe = strafeToward( t, err, s.vx );
        simulate( s, input, DT, t, track );
        if ( s.dead || s.stunTimer > 0 ) return false;
    }
    return false;
}

function doorAttempts( dead: Uint8Array, slot: PacingGrid, p: RouteRegion, doors: Door[] ): SqueezeAttempt[] {
    const out: SqueezeAttempt[] = [];
    const committed = ( p.k0 + 1 ) * PACING_DZ + POCKET_SLOT_MIN_U / 2;
    const z0 = Math.max( committed, Math.min( ...doors.map( ( d ) => sampleZ( d.k ) ) ) - SWEEP_PAD );
    const z1 = Math.max( ...doors.map( ( d ) => sampleZ( d.k ) ) ) + SWEEP_PAD;
    const xs = [ ...new Set( doors.flatMap( ( d ) => d.xs ) ) ];
    for ( let n = 0; z0 + n * SWEEP_DZ <= z1 + 1e-9; n++ ) {
        const stopZ = z0 + n * SWEEP_DZ;
        const cols = pocketColumns( dead, slot, p, Math.floor( stopZ / PACING_DZ ) );
        const fromX = columnX( cols[ Math.floor( cols.length / 2 ) ], slot.hull );
        for ( const toX of xs ) out.push( { fromX, stopZ, toX } );
    }
    return out;
}

function longestWindow( stops: number[] ): number {
    const ticks = [ ...new Set( stops.map( ( z ) => Math.round( z / SWEEP_DZ ) ) ) ].sort( ( a, b ) => a - b );
    let best = 0;
    let run = 0;
    for ( let i = 0; i < ticks.length; i++ ) {
        run = i > 0 && ticks[ i ] === ticks[ i - 1 ] + 1 ? run + 1 : 1;
        best = Math.max( best, run );
    }
    return best > 0 ? ( best - 1 ) * SWEEP_DZ : 0;
}

function escapeWindow( track: Track, t: FlightTuning, tries: SqueezeAttempt[] ): number {
    const stops = new Set< number >();
    for ( const a of tries ) {
        if ( stops.has( a.stopZ ) ) continue;
        if ( squeezesThrough( track, t, a ) ) stops.add( a.stopZ );
    }
    return longestWindow( [ ...stops ] );
}

export function classPockets( frozen: FrozenTrack, classId: ShipClassId, t: FlightTuning ): PacingPocket[] {
    const step = maxColumnStep( TRACK_CONTRACT.pacingCruise );
    const airLimit = airDistance( t, 'double' );
    const slot = stoppingReach( buildGrid( frozen, classHull( t, POCKET_SLOT_MIN_U ) ), airLimit, step );
    const phys = stoppingReach( buildGrid( frozen, classHull( t ) ), airLimit, step );
    const dead = deadMask( slot );
    const scene = { phys, slot, dead };
    return regionsOf( dead, slot.grid ).map( ( p ) => {
        const doors = findDoors( scene, p );
        const window =
            doors.length > 0 ? escapeWindow( frozen.track, t, doorAttempts( dead, slot.grid, p, doors ) ) : 0;
        return { ...p, classId, doors: doors.length, window, trapped: window < POCKET_SLOT_MIN_U };
    } );
}

export function rosterPockets( frozen: FrozenTrack ): PacingPocket[] {
    return Object.values( SHIP_CLASSES ).flatMap( ( c ) => classPockets( frozen, c.id, c.tuning ) );
}

function overlaps( g: PocketGroup, p: PacingPocket ): boolean {
    return p.k0 <= g.k1 && g.k0 <= p.k1 && p.x0 <= g.x1 && g.x0 <= p.x1;
}

export function groupPockets( pockets: PacingPocket[] ): PocketGroup[] {
    const out: PocketGroup[] = [];
    for ( const p of pockets.filter( ( q ) => q.trapped ).sort( ( a, b ) => a.k0 - b.k0 ) ) {
        const g = out.find( ( q ) => overlaps( q, p ) );
        if ( g === undefined ) {
            out.push( { k0: p.k0, k1: p.k1, x0: p.x0, x1: p.x1, classes: [ p.classId ] } );
            continue;
        }
        g.k0 = Math.min( g.k0, p.k0 );
        g.k1 = Math.max( g.k1, p.k1 );
        g.x0 = Math.min( g.x0, p.x0 );
        g.x1 = Math.max( g.x1, p.x1 );
        if ( ! g.classes.includes( p.classId ) ) g.classes.push( p.classId );
    }
    return out;
}
