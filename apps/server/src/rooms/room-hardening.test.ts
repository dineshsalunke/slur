import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { CREATE_LIMIT_CODE, INPUT_MESSAGE, PHASE, ROOM_NAME, START_MESSAGE } from '@slur/shared';
import { CreateQuota } from '../create-quota.js';
import { MAX_LIVE_ROOMS_PER_IP, MAX_MESSAGES_PER_SECOND, MAX_PAYLOAD_BYTES } from '../limits.js';
import { installMatchmakeGuard } from '../matchmake-guard.js';
import { RunRoom } from './run-room.js';

function settle( ms: number ): Promise< void > {
    return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

describe( 'RunRoom hardening (#339)', () => {
    let colyseus: ColyseusTestServer;
    let quota = new CreateQuota();

    before( async () => {
        const transport = new WebSocketTransport( { maxPayload: MAX_PAYLOAD_BYTES } );
        const gameServer = new Server( { transport } );
        gameServer.define( ROOM_NAME, RunRoom );
        installMatchmakeGuard( [ { admit: ( call, nowMs ) => quota.admit( call, nowMs ) } ] );
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
        quota = new CreateQuota();
    } );

    test( 'a non-string name joins as Racer', async () => {
        const run = await colyseus.sdk.create( ROOM_NAME, { name: 7 } );
        const room = colyseus.getRoomById< RunRoom >( run.roomId );
        assert.equal( room.state.players.get( run.sessionId )?.name, 'Racer' );
        await run.leave();
    } );

    test( 'a client over the message rate is disconnected and the room lives on', async () => {
        const host = await colyseus.sdk.create( ROOM_NAME, { name: 'Host' } );
        const flooder = await colyseus.sdk.joinById( host.roomId, { name: 'Flood' } );
        const room = colyseus.getRoomById< RunRoom >( host.roomId );
        const left = new Promise< number >( ( resolve ) => flooder.onLeave( resolve ) );
        for ( let i = 0; i < MAX_MESSAGES_PER_SECOND * 2; i++ ) flooder.send( INPUT_MESSAGE, { inputs: [] } );
        await left;
        await settle( 50 );
        assert.notEqual( room.state.players.get( flooder.sessionId )?.connected, true );
        assert.equal( room.state.players.get( host.sessionId )?.connected, true );
        await host.leave();
    } );

    test( 'a message over the payload cap closes that client only', async () => {
        const host = await colyseus.sdk.create( ROOM_NAME, { name: 'Host' } );
        const big = await colyseus.sdk.joinById( host.roomId, { name: 'Big' } );
        const left = new Promise< number >( ( resolve ) => big.onLeave( resolve ) );
        big.send( INPUT_MESSAGE, { inputs: [], pad: 'x'.repeat( MAX_PAYLOAD_BYTES ) } );
        await left;
        host.send( START_MESSAGE );
        await settle( 50 );
        assert.notEqual( colyseus.getRoomById< RunRoom >( host.roomId ).state.phase, PHASE.lobby );
        await host.leave();
    } );

    test( 'a throw inside a handler is caught and the room keeps running', async () => {
        const run = await colyseus.sdk.create( ROOM_NAME, { name: 'Host' } );
        const room = colyseus.getRoomById< RunRoom >( run.roomId );
        room.sim.input = () => {
            throw new Error( 'boom' );
        };
        run.send( INPUT_MESSAGE, { inputs: [] } );
        run.send( START_MESSAGE );
        await settle( 50 );
        assert.notEqual( room.state.phase, PHASE.lobby, 'the message after the throw still reached the sim' );
        await run.leave();
    } );

    test( 'one address cannot hold more than the live-room cap', async () => {
        const runs = [];
        for ( let i = 0; i < MAX_LIVE_ROOMS_PER_IP; i++ ) runs.push( await colyseus.sdk.create( ROOM_NAME, {} ) );
        await assert.rejects( colyseus.sdk.create( ROOM_NAME, {} ), { code: CREATE_LIMIT_CODE } );
        for ( const run of runs ) await run.leave();
    } );
} );
