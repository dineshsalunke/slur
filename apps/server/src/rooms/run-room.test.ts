import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Server } from '@colyseus/core';
import { getStateCallbacks } from '@colyseus/sdk';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import {
    type Block,
    COUNTDOWN_SECONDS,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    HeldPower,
    PHASE,
    PICKUP_RESPAWN_S,
    type PlayerState,
    pickupLayout,
    ROOM_NAME,
    resolveTrack,
    SEEKER_HIT_MESSAGE,
    SEEKER_MISS_MESSAGE,
    START_MESSAGE,
    STUN_SECONDS,
    TRACK_SEGMENTS,
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

    test( 'a fired seeker locks the racer ahead and its hit applies the seeker stun', async () => {
        const { room, connections, host } = await racingRoom( 2 );
        const [ , otherClient ] = connections;
        assert.ok( otherClient, 'the second client connected' );

        const shooter = playerOf( room, host.sessionId );
        const victim = playerOf( room, otherClient.sessionId );
        shooter.x = 0;
        shooter.z = 0;
        victim.shipId = 'executioner';
        victim.x = 0;
        victim.z = 20;
        shooter.heldPower = HeldPower.seeker;

        let seekerHits = 0;
        for ( const c of [ host, otherClient ] ) {
            c.onMessage( 'hit', () => {} );
            c.onMessage( SEEKER_MISS_MESSAGE, () => {} );
        }
        host.onMessage( SEEKER_HIT_MESSAGE, () => {} );
        otherClient.onMessage( SEEKER_HIT_MESSAGE, () => {
            seekerHits++;
        } );

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        assert.equal( room.state.projectiles.size, 0, 'a held seeker does not fire a bolt' );
        assert.equal( room.state.seekers.size, 1, 'firing spawns exactly one seeker' );
        const [ seeker ] = room.state.seekers.values();
        assert.equal( seeker?.targetId, otherClient.sessionId, 'the seeker locks the racer ahead' );
        assert.equal( shooter.heldPower, HeldPower.none, 'firing empties the single held slot' );

        tick( room, 1 );

        assert.equal( room.state.seekers.size, 0, 'a spent seeker is pruned' );
        assert.equal(
            victim.stunTimer,
            DEFAULT_SIM_CONFIG.seekerStunS,
            'a zero-armour ship takes the full seeker stun',
        );
        assert.equal( shooter.stunTimer, 0, 'the owner is not stunned' );

        await delay( 100 );
        assert.equal( seekerHits, 1, 'the hit broadcasts one seeker-hit message' );
    } );

    test( 'a seeker fired with nothing ahead flies unlocked and is wasted', async () => {
        const { room, host } = await racingRoom( 1 );
        const shooter = playerOf( room, host.sessionId );
        shooter.heldPower = HeldPower.seeker;

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        const [ seeker ] = room.state.seekers.values();
        assert.equal( seeker?.targetId, '', 'no racer ahead means no lock' );
        assert.equal( shooter.heldPower, HeldPower.none, 'the power is spent anyway' );

        tick( room, DEFAULT_SIM_CONFIG.seekerTtl + FIXED_DT );
        assert.equal( room.state.seekers.size, 0, 'the unlocked seeker expires' );
    } );

    function firstBlock( room: RunRoom, kind: Block[ 'kind' ] ): Block {
        const track = resolveTrack( toDescriptor( room.state.descriptor ) );
        for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
            const b = track.segmentAt( i ).blocks.find( ( x ) => x.kind === kind );
            if ( b ) return b;
        }
        assert.fail( `the seeded track has no ${ kind } block` );
    }

    function aimAt( room: RunRoom, sessionId: string, b: Block ): void {
        const shooter = playerOf( room, sessionId );
        shooter.x = ( b.x0 + b.x1 ) / 2;
        shooter.z = b.z0 - 5;
        shooter.heldPower = HeldPower.bolt;
    }

    test( 'a bolt breaks a fractured block, is spent, and the break is synced', async () => {
        const { room, host } = await racingRoom( 1 );
        host.onMessage( 'hit', () => {} );
        const target = firstBlock( room, 'fractured' );
        aimAt( room, host.sessionId, target );

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        tick( room, 0.1 );

        assert.equal( room.state.blockBroken.get( String( target.id ) ), true, 'the break did not reach state' );
        assert.equal( room.state.projectiles.size, 0, 'the bolt flew on after breaking the block' );
    } );

    test( 'a sealed block eats the bolt and stays standing', async () => {
        const { room, host } = await racingRoom( 1 );
        host.onMessage( 'hit', () => {} );
        const target = firstBlock( room, 'sealed' );
        aimAt( room, host.sessionId, target );

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        tick( room, 0.1 );

        assert.equal( room.state.blockBroken.size, 0, 'a sealed block was broken' );
        assert.equal( room.state.projectiles.size, 0, 'the bolt flew through a sealed block' );
    } );

    test( 'returning to the lobby restores every broken block', async () => {
        const { room, host } = await racingRoom( 1 );
        host.onMessage( 'hit', () => {} );
        aimAt( room, host.sessionId, firstBlock( room, 'fractured' ) );
        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        tick( room, 0.1 );
        assert.equal( room.state.blockBroken.size, 1, 'precondition: one block is broken' );

        ( room as unknown as { resetToLobby(): void } ).resetToLobby();

        assert.equal( room.state.blockBroken.size, 0, 'a broken block survived the reset' );
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
