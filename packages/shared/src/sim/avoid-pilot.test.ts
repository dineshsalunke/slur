import { FIXED_DT, type FlightTuning } from '../constants.js';
import { strafeToward } from '../pacing/pockets.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { openRunsAtSlice, type Run } from './clearance.js';
import type { PlayerInput } from './input.js';
import { HALF_WIDTH, type Segment, segIndexForZ, type Track } from './space.js';
import { simulate } from './step.js';
import { createSimWorld, spawnShip } from './types.js';

const SLICE = 2;
const MARGIN = 0.4;
const DELAY_TICKS = 12;
const REPLAN_TICKS = 3;
const JUMP_TICKS = 18;
const COMMIT = 0.5;

export function cached( track: Track ): Track {
    const memo = new Map< number, Segment >();
    const segmentAt = ( i: number ): Segment => {
        let s = memo.get( i );
        if ( s === undefined ) {
            s = track.segmentAt( i );
            memo.set( i, s );
        }
        return s;
    };
    return { ...track, segmentAt, segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ) };
}

function merged( runs: Run[] ): Run[] {
    const out: Run[] = [];
    for ( const [ a, b ] of runs ) {
        const p = out[ out.length - 1 ];
        if ( p !== undefined && a <= p[ 1 ] + 1e-6 ) p[ 1 ] = Math.max( p[ 1 ], b );
        else out.push( [ a, b ] );
    }
    return out;
}

function intersect( a: Run[], b: Run[] ): Run[] {
    const out: Run[] = [];
    for ( const [ a0, a1 ] of a )
        for ( const [ b0, b1 ] of b ) {
            const lo = Math.max( a0, b0 );
            const hi = Math.min( a1, b1 );
            if ( hi > lo ) out.push( [ lo, hi ] );
        }
    return out;
}

function freeSlices( track: Track, t: FlightTuning ): ( k: number ) => Run[] {
    const memo = new Map< number, Run[] >();
    const raw = ( z: number ): Run[] =>
        z >= track.finishZ ? [ [ -HALF_WIDTH, HALF_WIDTH ] ] : merged( openRunsAtSlice( track.segmentAtZ( z ), z ) );
    return ( k ) => {
        const hit = memo.get( k );
        if ( hit !== undefined ) return hit;
        const z = k * SLICE;
        const runs = intersect( intersect( raw( z ), raw( z - t.halfL - MARGIN ) ), raw( z + t.halfL + MARGIN ) );
        const pad = t.halfW + MARGIN;
        const out = runs.map( ( [ a, b ] ): Run => [ a + pad, b - pad ] ).filter( ( [ a, b ] ) => b >= a );
        memo.set( k, out );
        return out;
    };
}

function floorAhead( track: Track, x: number, z0: number, z1: number ): boolean {
    for ( let z = z0; z <= z1; z += 1 ) {
        const seg = track.segmentAtZ( z );
        const on = seg.floors.some(
            ( f ) => ( f.z0 ?? seg.z0 ) <= z && z <= ( f.z1 ?? seg.z1 ) && x >= f.x0 && x <= f.x1,
        );
        if ( ! on ) return false;
    }
    return true;
}

export interface Flight {
    finished: boolean;
    deaths: number;
    bumps: number;
    smashes: number;
    ticks: number;
}

export type Steer = (
    tick: number,
    s: ReturnType< typeof spawnShip >,
) => { target: number; jump: boolean; brake: boolean };

function edgeCounter(): ( on: boolean ) => number {
    let was = false;
    let count = 0;
    return ( on ) => {
        if ( on && ! was ) count++;
        was = on;
        return count;
    };
}

export function fly( track: Track, t: FlightTuning, steer: Steer ): Flight {
    const s = spawnShip( 0, 0 );
    const world = createSimWorld();
    const maxTicks = Math.ceil( track.finishZ / ( 0.4 * t.maxCruise ) / FIXED_DT ) + 600;
    const deaths = edgeCounter();
    const bumps = edgeCounter();
    let jumpHold = 0;
    let tick = 0;
    for ( ; tick < maxTicks && ! s.finished; tick++ ) {
        const plan = steer( tick, s );
        const edge = s.grounded && ! floorAhead( track, s.x, s.z + t.halfL, s.z + t.halfL + s.vz * 0.1 );
        jumpHold = plan.jump || edge ? JUMP_TICKS : Math.max( 0, jumpHold - 1 );
        const input: PlayerInput = {
            seq: tick,
            throttle: plan.brake ? 0 : 1,
            brake: plan.brake ? 1 : 0,
            strafe: strafeToward( t, plan.target - s.x, s.vx ),
            jump: jumpHold > 0,
        };
        simulate( s, input, FIXED_DT, t, track, DEFAULT_SIM_CONFIG, world );
        deaths( s.dead );
        bumps( s.stunTimer > 0 );
    }
    return {
        finished: s.finished,
        deaths: deaths( s.dead ),
        bumps: bumps( s.stunTimer > 0 ),
        smashes: world.broken.size,
        ticks: tick,
    };
}

export function avoidPilot( track: Track, t: FlightTuning ): Steer {
    const free = freeSlices( track, t );
    const inRuns = ( runs: Run[], x: number ): boolean => runs.some( ( [ a, b ] ) => x >= a && x <= b );
    const clearFrom = ( x: number, k0: number, kN: number ): number => {
        let k = k0;
        while ( k <= kN && inRuns( free( k ), x ) ) k++;
        return k - k0;
    };
    const queue: [ number, number ][] = [];
    let target = 0;
    let chosen = 0;
    let clearHere = Number.POSITIVE_INFINITY;
    return ( tick, s ) => {
        const k0 = Math.floor( s.z / SLICE );
        const kN = Math.ceil( ( s.z + Math.max( s.vz, 20 ) * 1.2 + 20 ) / SLICE );
        if ( tick % REPLAN_TICKS === 0 && ! s.dead ) {
            let best = s.x;
            let bestKey = Number.NEGATIVE_INFINITY;
            for ( let x = -HALF_WIDTH; x <= HALF_WIDTH; x += 0.5 ) {
                const reach = Math.abs( x - s.x ) + COMMIT * Math.abs( x - chosen );
                const key = Math.min( clearFrom( x, k0, kN ), kN - k0 + 1 ) * 1000 - reach;
                if ( key > bestKey ) {
                    bestKey = key;
                    best = x;
                }
            }
            chosen = best;
            queue.push( [ tick + DELAY_TICKS, best ] );
            clearHere = clearFrom( s.x, k0, kN ) * SLICE;
        }
        while ( queue.length > 0 && queue[ 0 ][ 0 ] <= tick ) target = ( queue.shift() as [ number, number ] )[ 1 ];
        return { target, jump: false, brake: clearHere < s.vz * 0.4 + 4 && Math.abs( target - s.x ) > 2 };
    };
}
