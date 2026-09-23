import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    aimBolt,
    BLOCK_HEIGHT,
    BLOCK_ID_STRIDE,
    type Block,
    BOLT_SPAWN_AHEAD,
    type BoltStrike,
    canFire,
    DEFAULT_SIM_CONFIG,
    dropPower,
    emptySlots,
    FIXED_DT,
    type Gunner,
    HALF_WIDTH,
    HeldPower,
    type ProjectileState,
    SEG_LEN,
    type Segment,
    seekerReady,
    spendPower,
    stepBolts,
    stepPickups,
    type Track,
} from '../index.js';

function wallAt( i: number, kind: Block[ 'kind' ] ): Block {
    return {
        x0: -HALF_WIDTH,
        x1: HALF_WIDTH,
        y0: 0,
        y1: BLOCK_HEIGHT,
        z0: i * SEG_LEN,
        z1: i * SEG_LEN + 6,
        id: i * BLOCK_ID_STRIDE,
        kind,
    };
}

function trackWithWall( at: number, kind: Block[ 'kind' ] ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'block',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: i === at ? [ wallAt( i, kind ) ] : [],
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function gunner( over: Partial< Gunner > = {} ): Gunner {
    return {
        x: 0,
        y: 1,
        z: 0,
        slots: [ HeldPower.bolt, HeldPower.none, HeldPower.none ],
        stunTimer: 0,
        dead: false,
        spectating: false,
        ...over,
    };
}

function boltBefore( z: number ): ProjectileState {
    return { x: 0, y: 1, z: z - 2, ownerId: 'me', ttl: 1 };
}

test( 'only an armed, upright, unstunned racer can fire', () => {
    assert.ok( canFire( gunner(), 0 ) );
    assert.ok( ! canFire( gunner(), 1 ), 'an empty slot cannot fire' );
    assert.ok( ! canFire( gunner(), 3 ), 'there is no fourth slot' );
    assert.ok( ! canFire( gunner(), 0.5 ) );
    assert.ok( ! canFire( gunner( { stunTimer: 0.1 } ), 0 ) );
    assert.ok( ! canFire( gunner( { dead: true } ), 0 ) );
    assert.ok( ! canFire( gunner( { spectating: true } ), 0 ) );
} );

test( 'aimBolt spawns the bolt ahead of the gunner with a full ttl', () => {
    const bolt: ProjectileState = { x: 0, y: 0, z: 0, ownerId: '', ttl: 0 };
    aimBolt( bolt, gunner( { x: 2, y: 3, z: 40 } ), 'me' );
    assert.deepEqual( bolt, { x: 2, y: 3, z: 40 + BOLT_SPAWN_AHEAD, ownerId: 'me', ttl: DEFAULT_SIM_CONFIG.boltTtl } );
} );

test( 'a bolt breaks the fractured block it reaches and is spent', () => {
    const track = trackWithWall( 3, 'fractured' );
    const bolts = new Map( [ [ 'b', boltBefore( 3 * SEG_LEN ) ] ] );
    const broken = new Set< number >();
    const strikes: BoltStrike[] = [];
    stepBolts( bolts, [], track, broken, FIXED_DT, ( s ) => strikes.push( s ) );
    assert.ok( broken.has( 3 * BLOCK_ID_STRIDE ) );
    assert.equal( bolts.size, 0 );
    assert.equal( strikes.length, 1 );
    assert.equal( strikes[ 0 ].victimId, '' );
    assert.equal( strikes[ 0 ].z, 3 * SEG_LEN );
} );

test( 'a sealed block eats the bolt without breaking', () => {
    const bolts = new Map( [ [ 'b', boltBefore( 3 * SEG_LEN ) ] ] );
    const broken = new Set< number >();
    stepBolts( bolts, [], trackWithWall( 3, 'sealed' ), broken, FIXED_DT, () => {} );
    assert.equal( broken.size, 0 );
    assert.equal( bolts.size, 0 );
} );

test( 'a bolt in open track flies on until its ttl runs out', () => {
    const bolts = new Map( [ [ 'b', { ...boltBefore( 0 ), ttl: 2 * FIXED_DT } ] ] );
    const track = trackWithWall( -1, 'sealed' );
    stepBolts( bolts, [], track, new Set(), FIXED_DT, () => {} );
    assert.equal( bolts.size, 1 );
    stepBolts( bolts, [], track, new Set(), FIXED_DT, () => {} );
    assert.equal( bolts.size, 0 );
} );

test( 'an empty-handed racer grabs a pickup, which respawns after pickupRespawnS', () => {
    const pickups = [ { id: 'p', x: 0, y: 1, z: 10 } ];
    const taken = new Map< string, boolean >();
    const respawn = new Map< string, number >();
    const me = gunner( { z: 10, slots: emptySlots() } );
    stepPickups( [ me ], pickups, taken, respawn, FIXED_DT, { ...DEFAULT_SIM_CONFIG, seekerRatio: 0 } );
    assert.deepEqual( me.slots, [ HeldPower.bolt, HeldPower.none, HeldPower.none ] );
    assert.equal( taken.get( 'p' ), true );

    const other = gunner( { z: 10, slots: emptySlots() } );
    stepPickups( [ other ], pickups, taken, respawn, DEFAULT_SIM_CONFIG.pickupRespawnS / 2 );
    assert.deepEqual( other.slots, emptySlots(), 'a taken pickup was grabbed again' );

    stepPickups( [], pickups, taken, respawn, DEFAULT_SIM_CONFIG.pickupRespawnS );
    assert.equal( taken.get( 'p' ), false );
    assert.equal( respawn.size, 0 );
} );

test( 'a grab fills the lowest empty slot, and a full rack skips the pickup for others', () => {
    const taken = new Map< string, boolean >();
    const me = gunner( { z: 10, slots: [ HeldPower.seeker, HeldPower.none, HeldPower.bolt ] } );
    stepPickups( [ me ], [ { id: 'p', x: 0, y: 1, z: 10 } ], taken, new Map(), FIXED_DT, {
        ...DEFAULT_SIM_CONFIG,
        seekerRatio: 1,
    } );
    assert.deepEqual( me.slots, [ HeldPower.seeker, HeldPower.seeker, HeldPower.bolt ], 'duplicates are allowed' );

    const full = new Map< string, boolean >();
    stepPickups( [ me ], [ { id: 'q', x: 0, y: 1, z: 10 } ], full, new Map(), FIXED_DT );
    assert.equal( full.get( 'q' ), undefined, 'a full rack leaves the pickup on the track' );
} );

test( 'spending or dropping a slot empties only that slot', () => {
    const me = gunner( { slots: [ HeldPower.bolt, HeldPower.seeker, HeldPower.bolt ] } );
    assert.equal( spendPower( me, 1 ), HeldPower.seeker );
    assert.deepEqual( me.slots, [ HeldPower.bolt, HeldPower.none, HeldPower.bolt ] );
    assert.equal( spendPower( me, 1 ), HeldPower.none, 'an empty slot spends nothing' );

    assert.ok( dropPower( me, 2 ) );
    assert.deepEqual( me.slots, [ HeldPower.bolt, HeldPower.none, HeldPower.none ] );
    assert.ok( ! dropPower( me, 7 ) );
    assert.ok( dropPower( gunner( { stunTimer: 1 } ), 0 ), 'a stunned racer may still drop' );
    assert.ok( ! dropPower( gunner( { spectating: true } ), 0 ) );
} );

test( 'a shooter may have one seeker in flight at a time', () => {
    const live = [ { ownerId: 'a' } ];
    assert.ok( ! seekerReady( 'a', live ) );
    assert.ok( seekerReady( 'b', live ) );
    assert.ok( seekerReady( 'a', [] ) );
} );
