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
    CHAT_MAX_CHARS,
    CHAT_SEND_MESSAGE,
    type ChatLine,
    PHASE,
    ROOM_NAME,
    START_MESSAGE,
} from '@slur/shared';
import { CHAT_BURST } from './chat-log.js';
import { RunRoom } from './run-room.js';

describe( 'RunRoom lobby chat', () => {
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
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        const ann = await colyseus.connectTo( room, { name: 'Ann' } );
        const bob = await colyseus.connectTo( room, { name: 'Bob' } );
        const seen: ChatLine[] = [];
        ann.onMessage( CHAT_LINE_MESSAGE, () => {} );
        bob.onMessage( CHAT_LINE_MESSAGE, ( line: ChatLine ) => seen.push( line ) );
        return { room, ann, bob, seen };
    }

    test( 'a line reaches every client, stamped with the sender call sign and capped', async () => {
        const { room, ann, seen } = await lobby();
        ann.send( CHAT_SEND_MESSAGE, `  ${ 'g'.repeat( CHAT_MAX_CHARS + 20 ) }\n` );
        ann.send( CHAT_SEND_MESSAGE, { name: 'Host', text: 'spoof' } );
        await room.waitForMessage( CHAT_SEND_MESSAGE );
        await delay( 100 );

        assert.equal( seen.length, 1, 'the object payload is dropped' );
        assert.equal( seen[ 0 ]?.name, 'Ann' );
        assert.equal( seen[ 0 ]?.from, ann.sessionId );
        assert.equal( seen[ 0 ]?.text, 'g'.repeat( CHAT_MAX_CHARS ) );
    } );

    test( 'a sender past the burst is dropped', async () => {
        const { room, ann, seen } = await lobby();
        for ( let i = 0; i < CHAT_BURST + 3; i++ ) ann.send( CHAT_SEND_MESSAGE, `line ${ i }` );
        await room.waitForMessage( CHAT_SEND_MESSAGE );
        await delay( 150 );
        assert.equal( seen.length, CHAT_BURST );
    } );

    test( 'a mid-lobby joiner pulls the history', async () => {
        const { room, ann, bob } = await lobby();
        ann.send( CHAT_SEND_MESSAGE, 'first' );
        await room.waitForMessage( CHAT_SEND_MESSAGE );
        bob.send( CHAT_SEND_MESSAGE, 'second' );
        await room.waitForMessage( CHAT_SEND_MESSAGE );

        const cat = await colyseus.connectTo( room, { name: 'Cat' } );
        const history = new Promise< ChatLine[] >( ( resolve ) => cat.onMessage( CHAT_HISTORY_MESSAGE, resolve ) );
        cat.onMessage( CHAT_LINE_MESSAGE, () => {} );
        cat.send( CHAT_HISTORY_MESSAGE );
        const lines = await history;
        assert.deepEqual(
            lines.map( ( l ) => [ l.name, l.text ] ),
            [
                [ 'Ann', 'first' ],
                [ 'Bob', 'second' ],
            ],
        );
    } );

    test( 'chat is closed once the run leaves the lobby', async () => {
        const { room, ann, seen } = await lobby();
        ann.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        assert.notEqual( room.state.phase, PHASE.lobby );
        ann.send( CHAT_SEND_MESSAGE, 'too late' );
        await room.waitForMessage( CHAT_SEND_MESSAGE );
        await delay( 100 );
        assert.equal( seen.length, 0 );
        assert.equal( room.chat.history().length, 0 );
    } );
} );
