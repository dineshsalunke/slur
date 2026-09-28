import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { LobbyRoom, Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { normalizeRoomCode, PUBLIC_ROOM_TAKEN_CODE, ROOM_NAME } from '@slur/shared';
import { roomCodes } from './room-codes.js';
import { RunRoom } from './run-room.js';

interface Row {
    roomId: string;
}

describe( 'RunRoom private rooms and the public slot (#340)', () => {
    let colyseus: ColyseusTestServer;

    before( async () => {
        const transport = new WebSocketTransport();
        const gameServer = new Server( { transport } );
        gameServer.define( ROOM_NAME, RunRoom ).enableRealtimeListing();
        gameServer.define( 'lobby', LobbyRoom );
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

    async function listed(): Promise< string[] > {
        const lobby = await colyseus.sdk.joinOrCreate( 'lobby' );
        const rows = await new Promise< Row[] >( ( resolve ) => lobby.onMessage( 'rooms', resolve ) );
        await lobby.leave();
        return rows.map( ( r ) => r.roomId );
    }

    test( 'a created room gets a 5-char code, stays out of the lobby list, and joins by code', async () => {
        const run = await colyseus.sdk.create( ROOM_NAME, { name: 'Ann' } );
        assert.equal( normalizeRoomCode( run.roomId ), run.roomId );
        assert.deepEqual( await listed(), [] );

        const bob = await colyseus.sdk.joinById( run.roomId, { name: 'Bob' } );
        assert.equal( bob.roomId, run.roomId );
        await bob.leave();
        await run.leave();
    } );

    test( 'quick play shares one listed room', async () => {
        const ann = await colyseus.sdk.joinOrCreate( ROOM_NAME, { name: 'Ann', public: true } );
        const bob = await colyseus.sdk.joinOrCreate( ROOM_NAME, { name: 'Bob', public: true } );
        assert.equal( bob.roomId, ann.roomId );
        assert.equal( roomCodes.publicRoom(), ann.roomId );
        assert.deepEqual( await listed(), [ ann.roomId ] );
        await bob.leave();
        await ann.leave();
    } );

    test( 'a second public create is refused with 409', async () => {
        const ann = await colyseus.sdk.create( ROOM_NAME, { name: 'Ann', public: true } );
        await assert.rejects( colyseus.sdk.create( ROOM_NAME, { name: 'Bob', public: true } ), {
            code: PUBLIC_ROOM_TAKEN_CODE,
        } );
        await ann.leave();
    } );

    test( 'disposing the public room frees the slot', async () => {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME, { public: true } );
        assert.equal( roomCodes.publicRoom(), room.roomId );
        await room.disconnect();
        assert.equal( roomCodes.publicRoom(), null );
    } );
} );
