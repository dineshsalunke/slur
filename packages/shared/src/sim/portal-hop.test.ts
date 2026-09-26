import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PortalState } from '../combat/portal.js';
import { FIXED_DT } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import type { PlayerInput } from './input.js';
import { HALF_WIDTH, SEG_LEN, type Segment, type Track } from './space.js';
import { simulate } from './step.js';
import { copySimShip, createSimWorld, type SimShip, spawnShip } from './types.js';

const T = SHIP_CLASSES.fighter.tuning;

function flat(): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: [],
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function pair( az: number, bz: number ): PortalState {
    return { ax: 0, ay: 0, az, bx: 12, by: 0, bz, ends: 2, armA: true, armB: true };
}

function input( seq: number ): PlayerInput {
    return { seq, throttle: 1, brake: 0, strafe: 0, jump: false };
}

function fly( s: SimShip, ticks: number, portals: PortalState[] ): void {
    const world = createSimWorld();
    for ( const [ i, p ] of portals.entries() ) world.portals.set( String( i ), p );
    for ( let n = 1; n <= ticks; n++ ) simulate( s, input( n ), FIXED_DT, T, flat(), DEFAULT_SIM_CONFIG, world );
}

function cruising( z: number ): SimShip {
    const s = spawnShip( 0, z );
    s.vz = 60;
    return s;
}

test( 'simulate() carries a ship through a live pair and keeps its speed', () => {
    const s = cruising( 40 );
    fly( s, 30, [ pair( 50, 400 ) ] );
    assert.equal( s.portalHops, 1 );
    assert.equal( s.x, 12 );
    assert.ok( s.z > 400 );
    assert.ok( s.vz >= 60 );
} );

test( 'simulate() without portals flies straight on', () => {
    const s = cruising( 40 );
    fly( s, 30, [] );
    assert.equal( s.portalHops, 0 );
    assert.ok( s.z < 100 );
} );

test( 'a replay of the same inputs reproduces the hop exactly', () => {
    const server = cruising( 40 );
    const client = cruising( 40 );
    fly( server, 30, [ pair( 50, 400 ) ] );
    fly( client, 30, [ pair( 50, 400 ) ] );
    const copy = spawnShip();
    copySimShip( copy, server );
    assert.deepEqual( client, copy );
} );
