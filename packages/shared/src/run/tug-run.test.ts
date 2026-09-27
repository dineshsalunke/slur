import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HeldPower, SHIELD_POP_MESSAGE } from '../combat/constants.js';
import { raiseShield } from '../combat/shield.js';
import { type TugEvent, throwSeconds } from '../combat/tug.js';
import { TUG_MESSAGE } from '../combat/tug-constants.js';
import { FIXED_DT } from '../constants.js';
import { PlayerState, RunState } from '../schema.js';
import { stunDurationForShip } from '../ship-classes.js';
import { type Block, HALF_WIDTH, SEG_LEN, type Segment, type Track } from '../sim/space.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import { type FireContext, firePower } from './combat.js';
import { stepTugThrows } from './tug-run.js';

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
    const broken = new Set< number >();
    const ctx: FireContext = {
        state: new RunState(),
        track: flat( blocks ),
        broken,
        config: CFG,
        broadcast: ( type, message ) => sent.push( { type, message } ),
        tugThrows: [],
    };
    return { ctx, sent, broken };
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

function outcomes( sent: { type: string; message: unknown }[] ): string[] {
    return tugs( sent ).map( ( e ) => e.outcome );
}

function land( ctx: FireContext ): number {
    let steps = 0;
    while ( ctx.tugThrows.length > 0 && steps < 1000 ) {
        stepTugThrows( ctx, FIXED_DT );
        steps++;
    }
    return steps;
}

test( 'a forward tug throws first and pulls nothing until the hook lands', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    assert.equal( p.slots[ 0 ], HeldPower.none );
    assert.equal( p.vz, 100 );
    assert.equal( p.tugTimer, 0 );
    assert.equal( v.slowTimer, 0 );
    const [ thrown ] = tugs( sent );
    assert.deepEqual( [ thrown.outcome, thrown.targetId, thrown.dir ], [ 'throw', 'v', 1 ] );
    assert.equal( thrown.seconds, throwSeconds( 50, CFG.tugRange, CFG ) );
} );

test( 'the hook lands after the throw time and then catapults the firer and slows the rival', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    const steps = land( ctx );
    assert.equal( steps, Math.round( throwSeconds( 50, CFG.tugRange, CFG ) / FIXED_DT ) );
    assert.equal( p.vz, Math.fround( 100 + CFG.tugKick ) );
    assert.equal( p.tugTimer, CFG.tugS );
    assert.equal( v.vz, Math.fround( 100 * CFG.tugSpeedCut ) );
    assert.equal( v.slowTimer, stunDurationForShip( v.shipId, CFG, CFG.tugSlowS ) );
    assert.equal( v.towTimer, 0 );
    assert.deepEqual( outcomes( sent ), [ 'throw', 'latch' ] );
    assert.equal( tugs( sent )[ 1 ].seconds, CFG.tugS );
} );

test( 'a back tug on a chaser tows it forward at the latch and leaves the firer alone', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 200 );
    const v = racer( ctx, 'v', 120 );
    firePower( ctx, '1', p, 'a', 0, -1 );
    assert.equal( v.towTimer, 0 );
    land( ctx );
    assert.equal( p.vz, 100 );
    assert.equal( p.tugTimer, 0 );
    assert.equal( v.vz, Math.fround( 100 + CFG.towKick ) );
    assert.equal( v.towTimer, stunDurationForShip( v.shipId, CFG, CFG.towS ) );
    assert.equal( v.slowTimer, 0 );
    const latched = tugs( sent )[ 1 ];
    assert.deepEqual( [ latched.outcome, latched.targetId, latched.dir ], [ 'latch', 'v', -1 ] );
    assert.equal( latched.seconds, v.towTimer );
} );

test( 'a back tug with no chaser does not fire and keeps the charge', () => {
    const { ctx, sent } = context( [ block( 1, 150 ) ] );
    const p = armed( ctx, 200 );
    racer( ctx, 'v', 260 );
    firePower( ctx, '1', p, 'a', 0, -1 );
    assert.equal( p.slots[ 0 ], HeldPower.tug );
    assert.equal( ctx.tugThrows.length, 0 );
    assert.deepEqual( sent, [] );
} );

test( 'a forward tug with no rival reels the firer to the nearest block in the band', () => {
    const { ctx, sent } = context( [ block( 1, 100 + 300 ), block( 2, 100 + 270 ), block( 3, 100 + 200 ) ] );
    const p = armed( ctx, 100 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    assert.equal( p.slots[ 0 ], HeldPower.none );
    assert.equal( p.tugAnchorZ, 0 );
    assert.equal( tugs( sent )[ 0 ].seconds, throwSeconds( 270, CFG.tugBlockMax, CFG ) );
    land( ctx );
    assert.equal( p.vz, Math.fround( 100 + CFG.tugKick ) );
    assert.equal( p.tugAnchorZ, 370 );
    assert.deepEqual( outcomes( sent ), [ 'throw', 'anchor' ] );
    const e = tugs( sent )[ 1 ];
    assert.equal( e.targetId, '' );
    assert.equal( e.z, 370 );
} );

test( 'a forward tug with nothing in range does not fire', () => {
    const { ctx, sent } = context( [ block( 1, 100 + CFG.tugBlockMax + 5 ), block( 2, 100 + CFG.tugBlockMin - 5 ) ] );
    const p = armed( ctx, 100 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    assert.equal( p.slots[ 0 ], HeldPower.tug );
    assert.deepEqual( sent, [] );
} );

test( 'a shield raised during the throw absorbs the slow, but the firer still catapults', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    raiseShield( v, CFG.shieldS );
    land( ctx );
    assert.equal( v.shielded, false );
    assert.equal( v.slowTimer, 0 );
    assert.equal( v.vz, 100 );
    assert.equal( p.vz, Math.fround( 100 + CFG.tugKick ) );
    assert.deepEqual(
        sent.map( ( s ) => s.type ),
        [ TUG_MESSAGE, SHIELD_POP_MESSAGE, TUG_MESSAGE ],
    );
} );

test( 'a rival that dies during the throw is a miss: no pull and no slow', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    v.dead = true;
    land( ctx );
    assert.equal( p.tugTimer, 0 );
    assert.equal( p.vz, 100 );
    assert.equal( v.slowTimer, 0 );
    assert.deepEqual( outcomes( sent ), [ 'throw', 'miss' ] );
} );

test( 'a rival out of reach at the latch is a miss', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    v.z = p.z + CFG.tugRange * CFG.tugLatchSlack + 1;
    land( ctx );
    assert.equal( p.tugTimer, 0 );
    assert.equal( v.slowTimer, 0 );
    assert.deepEqual( outcomes( sent ), [ 'throw', 'miss' ] );
} );

test( 'a rival that moved but stayed within the latch slack is still latched', () => {
    const { ctx, sent } = context();
    const p = armed( ctx, 100 );
    const v = racer( ctx, 'v', 150 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    v.z = p.z + CFG.tugRange * CFG.tugLatchSlack - 1;
    land( ctx );
    assert.equal( p.tugTimer, CFG.tugS );
    assert.deepEqual( outcomes( sent ), [ 'throw', 'latch' ] );
} );

test( 'an anchor block broken during the throw is a miss', () => {
    const { ctx, sent, broken } = context( [ block( 1, 100 + 300 ) ] );
    const p = armed( ctx, 100 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    broken.add( 1 );
    land( ctx );
    assert.equal( p.tugTimer, 0 );
    assert.equal( p.tugAnchorZ, 0 );
    assert.deepEqual( outcomes( sent ), [ 'throw', 'miss' ] );
} );

test( 'a firer that dies during the throw gets no pull', () => {
    const { ctx, sent } = context( [ block( 1, 100 + 300 ) ] );
    const p = armed( ctx, 100 );
    firePower( ctx, '1', p, 'a', 0, 1 );
    p.dead = true;
    land( ctx );
    assert.equal( p.tugTimer, 0 );
    assert.deepEqual( outcomes( sent ), [ 'throw', 'miss' ] );
} );

function block( id: number, z0: number ): Block {
    return { id, kind: 'sealed', x0: -HALF_WIDTH, x1: HALF_WIDTH, z0, z1: z0 + 8, y0: 0, y1: 4 };
}
