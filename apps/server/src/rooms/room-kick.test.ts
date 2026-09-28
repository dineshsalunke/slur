import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import {
    CHAT_HISTORY_MESSAGE,
    CHAT_LINE_MESSAGE,
    CHAT_SEND_MESSAGE,
    type ChatLine,
    KICK_MESSAGE,
    KICKED_CODE,
    KICKED_MESSAGE,
    PHASE,
    ROOM_NAME,
    START_MESSAGE,
} from '@slur/shared';
import { RunRoom } from './run-room.js';

describe( 'RunRoom host kick + name filter (#342)', () => {
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

    async function lobby() {
        const host = await colyseus.sdk.create( ROOM_NAME, { name: 'Host', token: 'host-token' } );
        const guest = await colyseus.sdk.joinById( host.roomId, { name: 'Guest', token: 'guest-token' } );
        const room = colyseus.getRoomById< RunRoom >( host.roomId );
        for ( const c of [ host, guest ] ) {
            c.onMessage( CHAT_LINE_MESSAGE, () => {} );
            c.onMessage( CHAT_HISTORY_MESSAGE, () => {} );
            c.onMessage( KICKED_MESSAGE, () => {} );
        }
        return { host, guest, room };
    }

    test( 'the host kicks a guest: the guest is told, leaves with a consented close, and its chat goes', async () => {
        const { host, guest, room } = await lobby();
        guest.send( CHAT_SEND_MESSAGE, 'spam' );
        await room.waitForMessage( CHAT_SEND_MESSAGE );
        const told = new Promise< void >( ( resolve ) => guest.onMessage( KICKED_MESSAGE, () => resolve() ) );
        const left = new Promise< number >( ( resolve ) => guest.onLeave( resolve ) );
        const history = new Promise< ChatLine[] >( ( resolve ) => host.onMessage( CHAT_HISTORY_MESSAGE, resolve ) );

        host.send( KICK_MESSAGE, guest.sessionId );

        await told;
        assert.equal( await left, 4000 );
        assert.deepEqual( await history, [] );
        await delay( 50 );
        assert.equal( room.state.players.has( guest.sessionId ), false );
        assert.equal( room.chat.history().length, 0 );
    } );

    test( 'a kicked token cannot rejoin the room; another token can', async () => {
        const { host, guest, room } = await lobby();
        const left = new Promise< number >( ( resolve ) => guest.onLeave( resolve ) );
        host.send( KICK_MESSAGE, guest.sessionId );
        await left;

        await assert.rejects( colyseus.sdk.joinById( room.roomId, { name: 'Guest', token: 'guest-token' } ), {
            code: KICKED_CODE,
        } );
        const other = await colyseus.sdk.joinById( room.roomId, { name: 'Other', token: 'other-token' } );
        assert.ok( room.state.players.has( other.sessionId ) );
    } );

    test( 'only the host kicks, never itself, and not mid-race', async () => {
        const { host, guest, room } = await lobby();
        guest.send( KICK_MESSAGE, host.sessionId );
        await room.waitForMessage( KICK_MESSAGE );
        host.send( KICK_MESSAGE, host.sessionId );
        await room.waitForMessage( KICK_MESSAGE );
        host.send( KICK_MESSAGE, { id: guest.sessionId } );
        await room.waitForMessage( KICK_MESSAGE );
        await delay( 50 );
        assert.equal( room.state.players.size, 2 );

        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        while ( room.state.phase !== PHASE.racing ) await delay( 50 );
        host.send( KICK_MESSAGE, guest.sessionId );
        await room.waitForMessage( KICK_MESSAGE );
        await delay( 50 );
        assert.ok( room.state.players.has( guest.sessionId ), 'a racing guest stays' );
    } );

    test( 'a profane name joins as Racer; invisible characters are stripped', async () => {
        const run = await colyseus.sdk.create( ROOM_NAME, { name: 'Big Bitch' } );
        const room = colyseus.getRoomById< RunRoom >( run.roomId );
        assert.equal( room.state.players.get( run.sessionId )?.name, 'Racer' );
        const ann = await colyseus.sdk.joinById( run.roomId, { name: 'A​nn' } );
        assert.equal( room.state.players.get( ann.sessionId )?.name, 'Ann' );
    } );
} );
