// Room-level tests for the S5 combat loop: a bolt stuns the ship it hits, a racer grabs a pickup, and a
// taken pickup slot respawns. These cover what the shared sim tests cannot reach — message handling,
// projectile pruning, and the pickup respawn timer all live on RunRoom, not inside simulate().

import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Server } from '@colyseus/core';
import { getStateCallbacks } from '@colyseus/sdk';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
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
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { RunRoom } from './run-room.js';

// Not 2567 — a dev server may already hold that port, and a test run must never depend on it being free.
const TEST_PORT = 2568;

// The room advances physics from setSimulationInterval, i.e. the wall clock. Waiting on real time would
// cost over six seconds per run (3s countdown + 3s pickup respawn) and stay timing-flaky. Drive the same
// fixed step the interval calls, with time we control instead. `fixedStep` is private to the room, so this
// cast is the test seam — it is the only place this file reaches past the public surface.
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
        // boot() accepts a plain @colyseus/core Server (its second overload), so this mirrors index.ts
        // without needing @colyseus/tools. The lobby room is irrelevant to combat, so it is left out.
        const gameServer = new Server( { transport: new WebSocketTransport() } );
        gameServer.define( ROOM_NAME, RunRoom );
        colyseus = await boot( gameServer, TEST_PORT );
    } );

    after( async () => {
        await colyseus.shutdown();
    } );

    beforeEach( async () => {
        await colyseus.cleanup();
    } );

    // lobby → countdown → racing, driven deterministically. The host is the first joiner (see onJoin).
    async function racingRoom( clients: number ) {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        const connections = [];
        for ( let i = 0; i < clients; i++ ) {
            connections.push( await colyseus.connectTo( room, { name: `Racer${ i }` } ) );
        }
        const [ host ] = connections;
        assert.ok( host, 'at least one client connected' );

        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, COUNTDOWN_SECONDS + FIXED_DT ); // bleed the countdown; the phase flips on the last tick

        assert.equal( room.state.phase, PHASE.racing, 'the countdown hands over to racing' );
        return { room, connections, host };
    }

    test( 'a bolt stuns the ship it hits, spares its owner, and is pruned', async () => {
        const { room, connections, host } = await racingRoom( 2 );
        const [ , otherClient ] = connections;
        assert.ok( otherClient, 'the second client connected' );

        const shooter = playerOf( room, host.sessionId );
        const victim = playerOf( room, otherClient.sessionId );

        // No client sends INPUT, and stepRace only calls simulate() when an input is queued — so both ships
        // hold exactly these poses for the whole test. That is what makes the geometry below deterministic,
        // and it also keeps the ships off the track hazards that would otherwise kill them mid-test.
        shooter.x = 0;
        shooter.z = 0;
        victim.x = 0;
        victim.z = 20;
        shooter.heldPower = HeldPower.bolt;

        let broadcastHits = 0;
        otherClient.onMessage( 'hit', () => {
            broadcastHits++;
        } );
        // 'hit' broadcasts to EVERY client, so the shooter receives it too. Register a no-op there to keep
        // the SDK from logging an unhandled-message warning during the run.
        host.onMessage( 'hit', () => {} );

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        assert.equal( room.state.projectiles.size, 1, 'firing spawns exactly one bolt' );
        assert.equal( shooter.heldPower, HeldPower.none, 'firing empties the single held slot' );

        // The bolt spawns 3u ahead of the shooter and covers 2u per tick (120u/s ÷ 60). The victim's hit
        // window is about 8u deep, so the bolt cannot tunnel past it. 0.25s carries it well beyond z=20.
        tick( room, 0.25 );

        assert.equal( victim.stunTimer, STUN_SECONDS, 'the victim takes the full stun' );
        assert.equal( shooter.stunTimer, 0, 'the owner is immune to its own bolt' );
        assert.equal( room.state.projectiles.size, 0, 'a spent bolt is pruned' );

        await delay( 100 ); // the spark is a broadcast, not state — let it cross the socket
        assert.equal( broadcastHits, 1, "the impact broadcasts one 'hit' for the cosmetic spark" );
    } );

    // Regression guard for the leak fixed in the client bridge (issue #22 sub-item 1). The client detaches a
    // bolt's onChange from inside projectiles.onRemove, so that detach only ever runs if the server actually
    // emits a removal delta for every bolt it announced. This asserts that contract from the wire side. The
    // client's own per-id map cannot be asserted here — it lives in apps/client, and apps/server must not
    // import it (the workspace graph is a DAG pointing at shared).
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
        await delay( 100 ); // the add delta has to cross the socket before the client callback runs

        assert.equal( added.length, 1, 'the client saw exactly one bolt appear' );
        assert.deepEqual( removed, [], 'and it has not been removed yet' );

        tick( room, 0.25 ); // carry the bolt into the victim; the hit prunes it server-side
        await room.waitForNextPatch();
        await delay( 100 );

        assert.deepEqual( removed, added, 'the client is told to remove every bolt it was told to add' );
        assert.equal( room.state.projectiles.size, 0, 'and the server map is drained' );
    } );

    test( 'a racer grabs an available pickup and the slot hides', async () => {
        // One client only: a second racer parked on the start line could sit on a pickup and take it first.
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );

        const [ pickup ] = pickupLayout( room.state.seed );
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

        const [ pickup ] = pickupLayout( room.state.seed );
        assert.ok( pickup, 'the seeded layout places at least one pickup' );

        racer.heldPower = HeldPower.none;
        racer.x = pickup.x;
        racer.z = pickup.z;
        tick( room, FIXED_DT );
        assert.equal( room.state.pickupTaken.get( pickup.id ), true, 'precondition: the slot is taken' );

        // The racer still holds the bolt and still sits on the slot, so it cannot re-grab. The slot has to
        // flip back on the timer alone — which is the behaviour under test.
        tick( room, PICKUP_RESPAWN_S + FIXED_DT );

        assert.equal( room.state.pickupTaken.get( pickup.id ), false, 'the slot returns after the delay' );
    } );
} );
