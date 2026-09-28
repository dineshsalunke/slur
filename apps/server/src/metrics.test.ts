import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, it } from 'node:test';
import { Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { PHASE, ROOM_NAME } from '@slur/shared';
import { formatEvent } from './log.js';
import { collectRooms, formatMetrics } from './metrics.js';
import { RunRoom } from './rooms/run-room.js';

describe( 'formatMetrics', () => {
    it( 'counts rooms by phase and players by role', () => {
        const text = formatMetrics(
            [
                { phase: PHASE.lobby, racers: 1, spectators: 0 },
                { phase: PHASE.racing, racers: 3, spectators: 2 },
                { phase: PHASE.racing, racers: 2, spectators: 0 },
            ],
            7,
            12.9,
        );
        const lines = text.split( '\n' );
        assert.ok( lines.includes( 'slur_rooms{phase="lobby"} 1' ) );
        assert.ok( lines.includes( 'slur_rooms{phase="countdown"} 0' ) );
        assert.ok( lines.includes( 'slur_rooms{phase="racing"} 2' ) );
        assert.ok( lines.includes( 'slur_rooms{phase="finished"} 0' ) );
        assert.ok( lines.includes( 'slur_players{role="racer"} 6' ) );
        assert.ok( lines.includes( 'slur_players{role="spectator"} 2' ) );
        assert.ok( lines.includes( 'slur_connections 7' ) );
        assert.ok( lines.includes( 'slur_uptime_seconds 12' ) );
        assert.ok( lines.includes( '# TYPE slur_rooms gauge' ) );
        assert.ok( text.endsWith( '\n' ) );
    } );
} );

describe( 'formatEvent', () => {
    it( 'writes one logfmt line', () => {
        assert.equal(
            formatEvent( 'client.join', { room: 'abc', players: 2 } ),
            'slur event=client.join room=abc players=2',
        );
    } );
} );

describe( 'collectRooms', () => {
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

    it( 'reads live rooms from the matchmaker', async () => {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        await colyseus.connectTo( room );
        await colyseus.connectTo( room );
        await room.waitForNextPatch();

        const rooms = await collectRooms();
        assert.deepEqual( rooms, [ { phase: PHASE.lobby, racers: 2, spectators: 0 } ] );
    } );
} );
