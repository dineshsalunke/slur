import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HeldPower, SHIELD_POP_MESSAGE } from '../combat/constants.js';
import { raiseShield } from '../combat/shield.js';
import type { TugEvent } from '../combat/tug.js';
import { TUG_MESSAGE } from '../combat/tug-constants.js';
import { PlayerState, RunState } from '../schema.js';
import { stunDurationForShip } from '../ship-classes.js';
import { type Block, HALF_WIDTH, SEG_LEN, type Segment, type Track } from '../sim/space.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { type FireContext, firePower } from './combat.js';

const CFG = DEFAULT_SIM_CONFIG;

function flat( blocks: Block[] = [] ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: blocks.filter( ( b ) => Math.floor( b.z0 / SEG_LEN ) === i ),
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function context( blocks: Block[] = [] ) {
    const sent: { type: string; message: unknown }[] = [];
    const ctx: FireContext = {
        state: new RunState(),
        track: flat( blocks ),
        broken: new Set(),
        config: CFG,
        broadcast: ( type, message ) => sent.push( { type, message } ),
    };
    return { ctx, sent };
}

function racer( ctx: FireContext, id: string, z: number, vz = 100 ): PlayerState {
    const p = new PlayerState();
    p.z = z;
    p.vz = vz;
    ctx.state.players.set( id, p );
    return p;
}

function armed( ctx: FireContext, z: number ): PlayerState {
    const p = racer( ctx, 'a', z );
    p.slots[ 0 ] = HeldPower.tug;
    return p;
}

function tugs( sent: { type: string; message: unknown }[] ): TugEvent[] {
    return sent.filter( ( s ) => s.type === TUG_MESSAGE ).map( ( s ) => s.message as TugEvent );
}

test( 'a forward tug on a rival ahead catapults the firer and slows the rival', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    assert.equal( p.slots[ 0 ], HeldPower.none );
    assert.equal( p.vz, Math.fround( 100 + CFG.tugKick ) );
    assert.equal( p.tugTimer, CFG.tugS );
    assert.equal( v.vz, Math.fround( 100 * CFG.tugSpeedCut ) );
    assert.equal( v.slowTimer, stunDurationForShip( v.shipId, CFG, CFG.tugSlowS ) );
    assert.equal( v.towTimer, 0 );
    assert.deepEqual(
        tugs( sent ).map( ( e ) => [ e.outcome, e.targetId, e.dir ] ),
        [ [ 'latch', 'v', 1 ] ],
    );
} );

test( 'a back tug on a chaser tows it forward and leaves the firer alone', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 200 );
    const v = racer( ctx, 'v', 120 );
    firePower( ctx, '1', p, 'a', 0, -1 );
    assert.equal( p.slots[ 0 ], HeldPower.none );
    assert.equal( p.vz, 100 );
    assert.equal( p.tugTimer, 0 );
    assert.equal( v.vz, Math.fround( 100 + CFG.towKick ) );
    assert.equal( v.towTimer, stunDurationForShip( v.shipId, CFG, CFG.towS ) );
    assert.equal( v.slowTimer, 0 );
    assert.deepEqual(
        tugs( sent ).map( ( e ) => [ e.outcome, e.targetId, e.dir ] ),
        [ [ 'latch', 'v', -1 ] ],
    );
} );

test( 'a back tug with no chaser does not fire and keeps the charge', () => {
    const { ctx, sent } = context( [ block( 1, 150 ) ] );
    const p = armed( ctx, 200 );
    racer( ctx, 'v', 260 );
    firePower( ctx, '1', p, 'a', 0, -1 );
    assert.equal( p.slots[ 0 ], HeldPower.tug );
    assert.equal( p.tugTimer, 0 );
    assert.deepEqual( sent, [] );
} );

test( 'a forward tug with no rival reels the firer to the nearest block ahead', () => {
    const { ctx, sent } = context( [ block( 1, 180 ), block( 2, 140 ) ] );
    const p = armed( ctx, 100 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    assert.equal( p.slots[ 0 ], HeldPower.none );
    assert.equal( p.vz, Math.fround( 100 + CFG.tugKick ) );
    assert.equal( p.tugAnchorZ, 140 );
    const [ e ] = tugs( sent );
    assert.equal( e.outcome, 'anchor' );
    assert.equal( e.targetId, '' );
    assert.equal( e.z, 140 );
} );

test( 'a forward tug with nothing in range does not fire', () => {
    const { ctx, sent } = context( [ block( 1, 100 + CFG.tugRange + 5 ) ] );
    const p = armed( ctx, 100 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    assert.equal( p.slots[ 0 ], HeldPower.tug );
    assert.deepEqual( sent, [] );
} );

test( 'a shield absorbs the slow, but the firer still catapults', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    raiseShield( v, CFG.shieldS );
    firePower( ctx, '1', p, 'a', 0, 1 );
    assert.equal( v.shielded, false );
    assert.equal( v.slowTimer, 0 );
    assert.equal( v.vz, 100 );
    assert.equal( p.vz, Math.fround( 100 + CFG.tugKick ) );
    assert.deepEqual(
        sent.map( ( s ) => s.type ),
        [ SHIELD_POP_MESSAGE, TUG_MESSAGE ],
    );
} );

function block( id: number, z0: number ): Block {
    return { id, kind: 'sealed', x0: -HALF_WIDTH, x1: HALF_WIDTH, z0, z1: z0 + 8, y0: 0, y1: 4 };
}
