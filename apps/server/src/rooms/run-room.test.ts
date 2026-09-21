import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Server } from '@colyseus/core';
import { getStateCallbacks } from '@colyseus/sdk';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import {
    COUNTDOWN_SECONDS,
    FIXED_DT,
    HeldPower,
    PHASE,
    PICKUP_RESPAWN_S,
    type PlayerState,
    pickupLayout,
    ROOM_NAME,
    START_MESSAGE,
    STUN_SECONDS,
    toDescriptor,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { RunRoom } from './run-room.js';

interface FixedStepRoom {
    fixedStep( dt: number ): void;
}

function tick( room: RunRoom, seconds: number ): void {
    const steps = Math.round( seconds / FIXED_DT );
    for ( let i = 0; i < steps; i++ ) ( room as unknown as FixedStepRoom ).fixedStep( FIXED_DT );
}

function playerOf( room: RunRoom, sessionId: string ): PlayerState {
    const p = room.state.players.get( sessionId );
    assert.ok( p, `player ${ sessionId } is present in the room` );
    return p;
}

describe( 'RunRoom combat', () => {
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

    async function racingRoom( clients: number ) {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        room.setSimulationInterval();
        const connections = [];
        for ( let i = 0; i < clients; i++ ) {
            connections.push( await colyseus.connectTo( room, { name: `Racer${ i }` } ) );
        }
        const [ host ] = connections;
        assert.ok( host, 'at least one client connected' );

        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, COUNTDOWN_SECONDS + FIXED_DT );

        assert.equal( room.state.phase, PHASE.racing, 'the countdown hands over to racing' );
        return { room, connections, host };
    }

    test( 'a bolt stuns the ship it hits, spares its owner, and is pruned', async () => {
        const { room, connections, host } = await racingRoom( 2 );
        const [ , otherClient ] = connections;
        assert.ok( otherClient, 'the second client connected' );

        const shooter = playerOf( room, host.sessionId );
        const victim = playerOf( room, otherClient.sessionId );

        victim.shipId = 'executioner';

        shooter.x = 0;
        shooter.z = 0;
        victim.x = 0;
        victim.z = 20;
        shooter.heldPower = HeldPower.bolt;

        let broadcastHits = 0;
        otherClient.onMessage( 'hit', () => {
            broadcastHits++;
        } );
        host.onMessage( 'hit', () => {} );

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        assert.equal( room.state.projectiles.size, 1, 'firing spawns exactly one bolt' );
        assert.equal( shooter.heldPower, HeldPower.none, 'firing empties the single held slot' );

        tick( room, 0.25 );

        assert.equal( victim.stunTimer, STUN_SECONDS, 'a zero-armour ship takes the full stun' );
        assert.equal( shooter.stunTimer, 0, 'the owner is immune to its own bolt' );
        assert.equal( room.state.projectiles.size, 0, 'a spent bolt is pruned' );

        await delay( 100 );
        assert.equal( broadcastHits, 1, "the impact broadcasts one 'hit' for the cosmetic spark" );
    } );

    test( 'every bolt the client is told to add, it is later told to remove', async () => {
        const { room, connections, host } = await racingRoom( 2 );
        const [ , otherClient ] = connections;
        assert.ok( otherClient, 'the second client connected' );

        const shooter = playerOf( room, host.sessionId );
        const victim = playerOf( room, otherClient.sessionId );
        shooter.x = 0;
        shooter.z = 0;
        victim.x = 0;
        victim.z = 20;
        shooter.heldPower = HeldPower.bolt;
        host.onMessage( 'hit', () => {} );
        otherClient.onMessage( 'hit', () => {} );

        const added: string[] = [];
        const removed: string[] = [];
        const $ = getStateCallbacks( host );
        $( host.state ).projectiles.onAdd( ( _bolt, id ) => added.push( id ) );
        $( host.state ).projectiles.onRemove( ( _bolt, id ) => removed.push( id ) );

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        await room.waitForNextPatch();
        await delay( 100 );

        assert.equal( added.length, 1, 'the client saw exactly one bolt appear' );
        assert.deepEqual( removed, [], 'and it has not been removed yet' );

        tick( room, 0.25 );
        await room.waitForNextPatch();
        await delay( 100 );

        assert.deepEqual( removed, added, 'the client is told to remove every bolt it was told to add' );
        assert.equal( room.state.projectiles.size, 0, 'and the server map is drained' );
    } );

    test( 'a racer grabs an available pickup and the slot hides', async () => {
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );

        const [ pickup ] = pickupLayout( toDescriptor( room.state.descriptor ) );
        assert.ok( pickup, 'the seeded layout places at least one pickup' );

        racer.heldPower = HeldPower.none;
        racer.x = pickup.x;
        racer.z = pickup.z;

        tick( room, FIXED_DT );

        assert.equal( racer.heldPower, HeldPower.bolt, 'overlapping an available pickup arms the racer' );
        assert.equal( room.state.pickupTaken.get( pickup.id ), true, 'the grabbed slot hides' );
    } );

    test( 'a taken pickup slot respawns after PICKUP_RESPAWN_S', async () => {
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );

        const [ pickup ] = pickupLayout( toDescriptor( room.state.descriptor ) );
        assert.ok( pickup, 'the seeded layout places at least one pickup' );

        racer.heldPower = HeldPower.none;
        racer.x = pickup.x;
        racer.z = pickup.z;
        tick( room, FIXED_DT );
        assert.equal( room.state.pickupTaken.get( pickup.id ), true, 'precondition: the slot is taken' );

        tick( room, PICKUP_RESPAWN_S + FIXED_DT );

        assert.equal( room.state.pickupTaken.get( pickup.id ), false, 'the slot returns after the delay' );
    } );
} );
