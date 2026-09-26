import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import {
    COUNTDOWN_SECONDS,
    FIXED_DT,
    HeldPower,
    PHASE,
    type PlayerState,
    POWER_SLOTS,
    ROOM_NAME,
    START_MESSAGE,
    TUG_MESSAGE,
    type TugEvent,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { RunRoom } from './run-room.js';

function tick( room: RunRoom, seconds: number ): void {
    const steps = Math.round( seconds / FIXED_DT );
    for ( let i = 0; i < steps; i++ ) room.sim.fixedStep( FIXED_DT );
}

function playerOf( room: RunRoom, sessionId: string ): PlayerState {
    const p = room.state.players.get( sessionId );
    assert.ok( p, `player ${ sessionId } is present in the room` );
    return p;
}

function arm( p: PlayerState, ...powers: HeldPower[] ): void {
    for ( let i = 0; i < POWER_SLOTS; i++ ) p.slots[ i ] = powers[ i ] ?? HeldPower.none;
}

describe( 'RunRoom tug line', () => {
    let colyseus: ColyseusTestServer;

    before( async () => {
        const transport = new WebSocketTransport();
        const gameServer = new Server( { transport } );
        gameServer.define( ROOM_NAME, RunRoom );
        await gameServer.listen( 0 );
        const address = transport.server?.address() as AddressInfo | null;
        assert.ok( address && typeof address === 'object', 'the test server bound a TCP port' );
        ( gameServer as unknown as { port: number } ).port = address.port;
        colyseus = new ColyseusTestServer( gameServer );
    } );

    after( async () => {
        await colyseus.shutdown();
    } );

    beforeEach( async () => {
        await colyseus.cleanup();
    } );

    async function duel() {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        room.setSimulationInterval();
        const host = await colyseus.connectTo( room, { name: 'Firer' } );
        const other = await colyseus.connectTo( room, { name: 'Rival' } );
        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, COUNTDOWN_SECONDS + FIXED_DT );
        assert.equal( room.state.phase, PHASE.racing );

        const firer = playerOf( room, host.sessionId );
        const rival = playerOf( room, other.sessionId );
        firer.x = 0;
        rival.x = 0;

        const seen: TugEvent[] = [];
        host.onMessage( TUG_MESSAGE, () => {} );
        other.onMessage( TUG_MESSAGE, ( m: TugEvent ) => seen.push( m ) );

        async function tug( dir: 1 | -1 ): Promise< void > {
            arm( firer, HeldPower.tug );
            host.send( USE_POWERUP_MESSAGE, { slot: 0, dir } );
            await room.waitForMessage( USE_POWERUP_MESSAGE );
            tick( room, FIXED_DT );
        }

        return { room, host, other, firer, rival, seen, tug };
    }

    test( 'a forward tug on the rival ahead slows it and broadcasts the latch', async () => {
        const { host, other, firer, rival, seen, tug } = await duel();
        firer.z = 0;
        rival.z = 30;
        await tug( 1 );

        assert.equal( firer.slots[ 0 ], HeldPower.none, 'the tug is spent' );
        assert.ok( firer.tugTimer > 0, 'the firer is catapulted' );
        assert.ok( rival.slowTimer > 0, 'the rival is slowed' );

        await delay( 100 );
        assert.deepEqual(
            seen.map( ( e ) => [ e.outcome, e.ownerId, e.targetId, e.dir ] ),
            [ [ 'latch', host.sessionId, other.sessionId, 1 ] ],
        );
    } );

    test( 'a back tug with nobody behind keeps the charge', async () => {
        const { firer, rival, seen, tug } = await duel();
        firer.z = 0;
        rival.z = 30;
        await tug( -1 );

        assert.equal( firer.slots[ 0 ], HeldPower.tug, 'a tug with no target does not spend' );
        assert.equal( rival.towTimer, 0 );
        await delay( 100 );
        assert.equal( seen.length, 0 );
    } );
} );
