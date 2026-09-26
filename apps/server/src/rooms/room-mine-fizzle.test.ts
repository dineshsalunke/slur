import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    DEFAULT_SIM_CONFIG,
    HALF_WIDTH,
    HeldPower,
    MINE_BURST_MESSAGE,
    type MineEvent,
    PlayerState,
    RunState,
    SEG_LEN,
    type Segment,
    type Track,
} from '@slur/shared';
import { type FireContext, firePower } from './room-combat.js';

function track( deck: boolean ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: deck ? [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ] : [],
        blocks: [],
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function layOver( deck: boolean ) {
    const state = new RunState();
    const p = new PlayerState();
    p.shipId = 'executioner';
    p.x = 3;
    p.y = 2;
    p.z = 100;
    p.vz = 90;
    p.slots[ 0 ] = HeldPower.mine;
    state.players.set( 'layer', p );
    const sent: [ string, MineEvent ][] = [];
    const ctx: FireContext = {
        state,
        track: track( deck ),
        broken: new Set(),
        config: DEFAULT_SIM_CONFIG,
        broadcast: ( type, message ) => sent.push( [ type, message as MineEvent ] ),
    };
    firePower( ctx, 'm1', p, 'layer', 0 );
    return { state, p, sent };
}

test( 'a mine fired over a gap spends the power, lays nothing and emits one fizzle', () => {
    const { state, p, sent } = layOver( false );

    assert.equal( p.slots[ 0 ], HeldPower.none );
    assert.equal( state.mines.size, 0 );
    assert.equal( sent.length, 1 );
    const [ type, e ] = sent[ 0 ];
    assert.equal( type, MINE_BURST_MESSAGE );
    assert.equal( e.outcome, 'fizzle' );
    assert.equal( e.ownerId, 'layer' );
    assert.deepEqual( [ e.x, e.y ], [ 3, 2 ] );
    assert.ok( e.z > p.z, 'the fizzle sits ahead of the layer, at the drop point' );
} );

test( 'a mine that lands emits no fizzle', () => {
    const { state, sent } = layOver( true );

    assert.equal( state.mines.size, 1 );
    assert.deepEqual( sent, [] );
} );
