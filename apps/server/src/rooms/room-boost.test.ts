import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import {
    COUNTDOWN_SECONDS,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    HeldPower,
    PHASE,
    type PlayerState,
    ROOM_NAME,
    START_MESSAGE,
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

function wireValues( p: PlayerState ): Record< string, unknown > {
    const json: Record< string, unknown > = p.toJSON();
    return Object.fromEntries(
        Object.entries( json ).map( ( [ k, v ] ) => [ k, typeof v === 'number' ? Math.fround( v ) : v ] ),
    );
}

describe( 'RunRoom boost', () => {
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

    test( 'a boost reaches both clients, and every player field decodes at its new index', async () => {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        room.setSimulationInterval();
        const host = await colyseus.connectTo( room, { name: 'Booster' } );
        const rival = await colyseus.connectTo( room, { name: 'Rival' } );
        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, COUNTDOWN_SECONDS + FIXED_DT );
        assert.equal( room.state.phase, PHASE.racing );

        const booster = playerOf( room, host.sessionId );
        booster.slots[ 0 ] = HeldPower.boost;
        booster.shielded = true;
        booster.tugTimer = 0.75;
        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        assert.equal( booster.slots[ 0 ], HeldPower.none, 'firing spends the slot' );
        assert.equal( booster.boostTimer, DEFAULT_SIM_CONFIG.boostS );
        booster.glideTimer = 1.25;

        await delay( 100 );
        const want = wireValues( booster );
        assert.ok( Object.keys( want ).length >= 37, `${ Object.keys( want ).length } wire fields` );
        for ( const client of [ host, rival ] ) {
            const decoded = client.state.players.get( host.sessionId );
            assert.ok( decoded, 'the client decodes the booster' );
            assert.deepEqual( wireValues( decoded ), want );
            assert.ok( decoded.boostTimer > 0, 'boostTimer decodes' );
            assert.equal( decoded.shielded, true, 'a field that moved down decodes' );
        }
    } );
} );
