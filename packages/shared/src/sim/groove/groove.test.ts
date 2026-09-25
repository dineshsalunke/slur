import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIXED_DT, type FlightTuning } from '../../constants.js';
import { freezeTrack } from '../../pacing/grid.js';
import { rosterPockets } from '../../pacing/pockets.js';
import { SHIP_CLASSES } from '../../ship-classes.js';
import { openRunsAtSlice, type Run } from '../clearance.js';
import type { PlayerInput } from '../input.js';
import { HALF_WIDTH, type Segment, segIndexForZ, type Track } from '../space.js';
import { simulate } from '../step.js';
import { procgenDescriptor, resolveTrack } from '../track-provider.js';
import { spawnShip } from '../types.js';
import { GROOVE_BANDS, GROOVE_GRAMMAR, jumpChance, switchChance } from './grammar.js';
import { buildGroove, grooveTrack } from './groove-track.js';
import type { GrooveEvent } from './line.js';
import { openSpace, openSpaceFailures } from './open-space.js';

const SEEDS = Array.from( { length: 30 }, ( _, k ) => k + 1 );
const LENGTH = 400;
const SLICE = 2;
const MARGIN = 0.4;
const DELAY_TICKS = 12;
const REPLAN_TICKS = 3;
const JUMP_TICKS = 18;

function cached( track: Track ): Track {
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

function strafeToward( t: FlightTuning, err: number, vx: number ): number {
    const want = Math.sign( err ) * Math.min( t.strafeClamp, Math.sqrt( t.strafeAccel * Math.abs( err ) ) );
    return Math.max( -1, Math.min( 1, ( want - vx ) / ( t.strafeAccel * FIXED_DT * 3 ) ) );
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

interface Flight {
    finished: boolean;
    deaths: number;
    bumps: number;
}

type Steer = ( tick: number, s: ReturnType< typeof spawnShip > ) => { target: number; jump: boolean; brake: boolean };

function edgeCounter(): ( on: boolean ) => number {
    let was = false;
    let count = 0;
    return ( on ) => {
        if ( on && ! was ) count++;
        was = on;
        return count;
    };
}

function fly( track: Track, t: FlightTuning, steer: Steer ): Flight {
    const s = spawnShip( 0, 0 );
    const maxTicks = Math.ceil( track.finishZ / ( 0.4 * t.maxCruise ) / FIXED_DT ) + 600;
    const deaths = edgeCounter();
    const bumps = edgeCounter();
    let jumpHold = 0;
    for ( let tick = 0; tick < maxTicks && ! s.finished; tick++ ) {
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
        simulate( s, input, FIXED_DT, t, track );
        deaths( s.dead );
        bumps( s.stunTimer > 0 );
    }
    return { finished: s.finished, deaths: deaths( s.dead ), bumps: bumps( s.stunTimer > 0 ) };
}

function avoidPilot( track: Track, t: FlightTuning ): Steer {
    const free = freeSlices( track, t );
    const inRuns = ( runs: Run[], x: number ): boolean => runs.some( ( [ a, b ] ) => x >= a && x <= b );
    const clearFrom = ( x: number, k0: number, kN: number ): number => {
        let k = k0;
        while ( k <= kN && inRuns( free( k ), x ) ) k++;
        return k - k0;
    };
    const queue: [ number, number ][] = [];
    let target = 0;
    let clearHere = Number.POSITIVE_INFINITY;
    return ( tick, s ) => {
        const k0 = Math.floor( s.z / SLICE );
        const kN = Math.ceil( ( s.z + Math.max( s.vz, 20 ) * 1.2 + 20 ) / SLICE );
        if ( tick % REPLAN_TICKS === 0 && ! s.dead ) {
            let best = s.x;
            let bestKey = Number.NEGATIVE_INFINITY;
            for ( let x = -HALF_WIDTH; x <= HALF_WIDTH; x += 0.5 ) {
                const key = Math.min( clearFrom( x, k0, kN ), kN - k0 + 1 ) * 1000 - Math.abs( x - s.x );
                if ( key > bestKey ) {
                    bestKey = key;
                    best = x;
                }
            }
            queue.push( [ tick + DELAY_TICKS, best ] );
            clearHere = clearFrom( s.x, k0, kN ) * SLICE;
        }
        while ( queue.length > 0 && queue[ 0 ][ 0 ] <= tick ) target = ( queue.shift() as [ number, number ] )[ 1 ];
        return { target, jump: false, brake: clearHere < s.vz * 0.4 + 4 && Math.abs( target - s.x ) > 2 };
    };
}

function linePilot( seed: number ): Steer {
    const { line, obstacles } = buildGroove( seed, LENGTH );
    const holes = new Set( obstacles.filter( ( o ) => o.kind === 'hole' ).map( ( o ) => o.event ) );
    let next = 0;
    let target = 0;
    let wasDead = false;
    return ( _tick, s ) => {
        if ( wasDead && ! s.dead )
            next = Math.max(
                0,
                line.events.findIndex( ( e ) => e.z > s.z ),
            );
        wasDead = s.dead;
        let jump = false;
        const lead = 0.07 * Math.max( s.vz, 1 );
        while ( next < line.events.length && s.z >= line.events[ next ].z - lead ) {
            const e = line.events[ next ];
            if ( e.kind === 'strafe' ) target = e.to;
            else if ( holes.has( next ) ) jump = true;
            next++;
        }
        return { target, jump, brake: false };
    };
}

test( 'a groove seed emits the same geometry every time', () => {
    assert.deepEqual( buildGroove( 7, LENGTH ), buildGroove( 7, LENGTH ) );
    assert.notDeepEqual( buildGroove( 7, LENGTH ).segments, buildGroove( 8, LENGTH ).segments );
} );

test( 'groove resolves through the procgen descriptor', () => {
    const track = resolveTrack( procgenDescriptor( 3, 'groove' ) );
    assert.deepEqual( track.segmentAt( 100 ), grooveTrack( 3 ).segmentAt( 100 ) );
    assert.ok( track.anchors.length > 0 );
} );

test( 'seeds 1–30 meet every open-space target', () => {
    for ( const seed of SEEDS ) {
        const failures = openSpaceFailures( openSpace( grooveTrack( seed, LENGTH ) ) );
        assert.deepEqual( failures, [], `seed ${ seed }` );
    }
} );

function switchTally( events: readonly GrooveEvent[] ): [ number, number ] {
    const dirs = events.filter( ( e ) => e.kind === 'strafe' ).map( ( e ) => Math.sign( e.to - e.from ) );
    const switched = dirs.slice( 1 ).filter( ( d, k ) => d !== dirs[ k ] ).length;
    return [ switched, Math.max( 0, dirs.length - 1 ) ];
}

test( 'the generated moves follow the take grammar', () => {
    let switched = 0;
    let strafes = 0;
    const jumps = { low: [ 0, 0 ], mid: [ 0, 0 ], high: [ 0, 0 ] };
    for ( const seed of SEEDS ) {
        const { events } = buildGroove( seed, LENGTH ).line;
        const [ sw, n ] = switchTally( events );
        switched += sw;
        strafes += n;
        for ( const e of events ) {
            jumps[ e.band ][ 1 ]++;
            if ( e.kind === 'jump' ) jumps[ e.band ][ 0 ]++;
        }
    }
    assert.ok( Math.abs( switched / strafes - switchChance() ) < 0.08, `switch ${ switched / strafes }` );
    for ( const band of GROOVE_BANDS ) {
        const [ j, n ] = jumps[ band ];
        if ( n < 50 ) continue;
        assert.ok( Math.abs( j / n - jumpChance( band ) ) < 0.08, `${ band } jump ${ j / n }` );
    }
    assert.equal( GROOVE_GRAMMAR.dxBin, 4 );
} );

test( 'no roster pocket on groove seeds', () => {
    for ( const seed of SEEDS.slice( 0, 10 ) ) {
        assert.deepEqual( rosterPockets( freezeTrack( grooveTrack( seed, LENGTH ) ) ), [], `seed ${ seed }` );
    }
} );

test( 'every class finishes groove seeds with a late-reacting avoidance pilot and no death', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        for ( const seed of SEEDS.slice( 0, 5 ) ) {
            const track = cached( grooveTrack( seed, LENGTH ) );
            const f = fly( track, c.tuning, avoidPilot( track, c.tuning ) );
            assert.ok( f.finished && f.deaths === 0, `${ c.id } seed ${ seed }: ${ JSON.stringify( f ) }` );
        }
    }
} );

test( 'the freighter flies the groove line itself with no death and no bump', () => {
    for ( const seed of SEEDS ) {
        const f = fly( cached( grooveTrack( seed, LENGTH ) ), SHIP_CLASSES.freighter.tuning, linePilot( seed ) );
        assert.deepEqual( f, { finished: true, deaths: 0, bumps: 0 }, `seed ${ seed }` );
    }
} );
