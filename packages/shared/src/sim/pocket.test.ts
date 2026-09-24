import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIXED_DT, type FlightTuning } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { emptyInput } from './input.js';
import { type Block, type Segment, segIndexForZ, type Track } from './space.js';
import { simulate } from './step.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';
import { spawnShip } from './types.js';

const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 0x0fffffff, 42, 99991, 0xffffffff ];
const POCKET_DEPTH = 1.5;
const MIN_SLACK = 0.01;
const HOLD_TICKS = 180;

function cachedTrack( track: Track ): Track {
    const cache = new Map< number, Segment >();
    const segmentAt = ( i: number ): Segment => {
        let seg = cache.get( i );
        if ( seg === undefined ) {
            seg = track.segmentAt( i );
            cache.set( i, seg );
        }
        return seg;
    };
    return { ...track, segmentAt, segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ) };
}

function sealedBlocks( track: Track ): Block[] {
    const out: Block[] = [];
    for ( let i = 0; track.segmentAt( i ).z0 < track.finishZ; i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) if ( b.kind === 'sealed' ) out.push( b );
    }
    return out;
}

interface Pocket {
    rear: Block;
    front: Block;
    x0: number;
    x1: number;
}

function pockets( blocks: Block[], t: FlightTuning ): Pocket[] {
    const hull = 2 * t.halfL;
    const out: Pocket[] = [];
    for ( const rear of blocks ) {
        for ( const front of blocks ) {
            const gap = front.z0 - rear.z1;
            if ( gap < hull + MIN_SLACK || gap > hull + POCKET_DEPTH ) continue;
            const x0 = Math.max( rear.x0, front.x0 );
            const x1 = Math.min( rear.x1, front.x1 );
            if ( x1 > x0 ) out.push( { rear, front, x0, x1 } );
        }
    }
    return out;
}

function longestStun( track: Track, t: FlightTuning, x: number, z: number ): number {
    const s = spawnShip( x, z );
    s.vz = 0;
    const inp = emptyInput();
    inp.throttle = 1;
    let streak = 0;
    let longest = 0;
    for ( let i = 0; i < HOLD_TICKS; i++ ) {
        simulate( s, inp, FIXED_DT, t, track );
        streak = s.stunTimer > 0 ? streak + 1 : 0;
        longest = Math.max( longest, streak );
    }
    return longest;
}

function stunTicks( t: FlightTuning ): number {
    return Math.ceil( t.bounceStun / FIXED_DT ) + 1;
}

test( 'seed 1 z≈6019: a Fighter holding throttle gets control back after one bounce', () => {
    const t = SHIP_CLASSES.fighter.tuning;
    const track = cachedTrack( resolveTrack( procgenDescriptor( 1 ) ) );
    assert.ok( longestStun( track, t, -26, 6019.235 ) <= stunTicks( t ) );
} );

test( 'seed 1 z≈6019: a Fighter that steers out leaves the pocket in under a second', () => {
    const t = SHIP_CLASSES.fighter.tuning;
    const track = cachedTrack( resolveTrack( procgenDescriptor( 1 ) ) );
    const s = spawnShip( -26, 6019.235 );
    s.vz = 0;
    const inp = emptyInput();
    inp.throttle = 1;
    for ( let i = 0; i < 120; i++ ) simulate( s, inp, FIXED_DT, t, track );
    inp.strafe = 1;
    let ticks = 0;
    while ( s.x - t.halfW < -24.86 && ticks < 60 ) {
        simulate( s, inp, FIXED_DT, t, track );
        ticks += 1;
    }
    assert.ok( ticks < 60, `still in the pocket after 1 s (x=${ s.x })` );
} );

test( 'no pocket on the fairness seeds stun-locks any class holding throttle', () => {
    let checked = 0;
    const locked: string[] = [];
    for ( const seed of SEEDS ) {
        const track = cachedTrack( resolveTrack( procgenDescriptor( seed ) ) );
        const blocks = sealedBlocks( track );
        for ( const c of Object.values( SHIP_CLASSES ) ) {
            for ( const p of pockets( blocks, c.tuning ) ) {
                checked += 1;
                const x = ( p.x0 + p.x1 ) / 2;
                const z = ( p.rear.z1 + p.front.z0 ) / 2;
                if ( longestStun( track, c.tuning, x, z ) > stunTicks( c.tuning ) ) {
                    locked.push( `seed ${ seed } ${ c.id } z ${ p.rear.z1.toFixed( 1 ) }` );
                }
            }
        }
    }
    assert.ok( checked > 1000, `the scan found only ${ checked } pockets` );
    assert.deepEqual( locked, [] );
} );
