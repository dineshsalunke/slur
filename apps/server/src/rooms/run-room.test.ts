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
    BOUNCE_MESSAGE,
    type BounceMessage,
    COUNTDOWN_SECONDS,
    DEFAULT_SIM_CONFIG,
    DROP_POWERUP_MESSAGE,
    emptyInput,
    FIXED_DT,
    HeldPower,
    MAX_SHIP_WIDTH,
    PHASE,
    PICKUP_RESPAWN_S,
    type PlayerInput,
    type PlayerState,
    POWER_SLOTS,
    pickupLayout,
    pickupPower,
    ROOM_NAME,
    resolveTrack,
    SEEKER_HIT_MESSAGE,
    SEEKER_MISS_MESSAGE,
    START_MESSAGE,
    START_STAGGER,
    STUN_SECONDS,
    segIndexForZ,
    TRACK_SEGMENTS,
    type Track,
    toDescriptor,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { RunRoom } from './run-room.js';

const AIM_BACK = 5;

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

function arm( p: PlayerState, ...powers: HeldPower[] ): void {
    for ( let i = 0; i < POWER_SLOTS; i++ ) p.slots[ i ] = powers[ i ] ?? HeldPower.none;
}

function rack( p: PlayerState ): number[] {
    return Array.from( p.slots );
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

    async function racingRoom( clients: number, gen?: string ) {
        if ( gen ) process.env.SLUR_TRACK_GEN = gen;
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        delete process.env.SLUR_TRACK_GEN;
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

    test( 'a countdown joiner races from a clean grid slot; racing and finished joiners spectate', async () => {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        room.setSimulationInterval();
        const host = await colyseus.connectTo( room, { name: 'Host' } );
        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, COUNTDOWN_SECONDS / 2 );
        assert.equal( room.state.phase, PHASE.countdown );

        const early = await colyseus.connectTo( room, { name: 'Early' } );
        const joiner = playerOf( room, early.sessionId );
        assert.equal( joiner.spectating, false, 'a countdown joiner races' );
        assert.equal( joiner.x, START_STAGGER, 'the joiner takes the next grid slot' );
        assert.equal( joiner.lastSafeX, joiner.x, 'the respawn line starts at the grid slot' );
        assert.equal( joiner.finishTime, 0 );
        assert.deepEqual( rack( joiner ), Array( POWER_SLOTS ).fill( HeldPower.none ) );

        tick( room, COUNTDOWN_SECONDS );
        assert.equal( room.state.phase, PHASE.racing );
        assert.equal( joiner.spectating, false, 'the countdown joiner is still racing after GO' );

        const late = await colyseus.connectTo( room, { name: 'Late' } );
        assert.equal( playerOf( room, late.sessionId ).spectating, true, 'a racing joiner spectates' );

        room.state.phase = PHASE.finished;
        const afterFinish = await colyseus.connectTo( room, { name: 'After' } );
        assert.equal( playerOf( room, afterFinish.sessionId ).spectating, true, 'a finished joiner spectates' );
    } );

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
        arm( shooter, HeldPower.bolt );

        let broadcastHits = 0;
        otherClient.onMessage( 'hit', () => {
            broadcastHits++;
        } );
        host.onMessage( 'hit', () => {} );

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        assert.equal( room.state.projectiles.size, 1, 'firing spawns exactly one bolt' );
        assert.equal( shooter.slots[ 0 ], HeldPower.none, 'firing empties the fired slot' );

        tick( room, 0.25 );

        assert.equal( victim.stunTimer, STUN_SECONDS, 'a zero-armour ship takes the full stun' );
        assert.equal( shooter.stunTimer, 0, 'the owner is immune to its own bolt' );
        assert.equal( room.state.projectiles.size, 0, 'a spent bolt is pruned' );

        await delay( 100 );
        assert.equal( broadcastHits, 1, "the impact broadcasts one 'hit' for the cosmetic spark" );
    } );

    test( 'a block bounce broadcasts one bounce message per contact, naming the victim', async () => {
        const { room, connections, host } = await racingRoom( 2 );
        const [ , otherClient ] = connections;
        assert.ok( otherClient, 'the second client connected' );
        const b = firstBlock( room, 'sealed' );
        const racer = playerOf( room, host.sessionId );
        racer.x = ( b.x0 + b.x1 ) / 2;
        racer.z = b.z0 - 4;
        racer.vz = 40;

        const seen: BounceMessage[] = [];
        otherClient.onMessage( BOUNCE_MESSAGE, ( m: BounceMessage ) => {
            seen.push( m );
        } );
        host.onMessage( BOUNCE_MESSAGE, () => {} );

        const queue = ( room as unknown as { queues: Map< string, PlayerInput[] > } ).queues.get( host.sessionId );
        assert.ok( queue, 'the racer has an input queue' );
        for ( let i = 0; i < 6; i++ ) queue.push( { ...emptyInput( i ), throttle: 1 } );
        tick( room, 6 * FIXED_DT );

        assert.ok( racer.stunTimer > 0, 'the racer bounced off the block' );
        await delay( 100 );
        assert.equal( seen.length, 1, 'one contact broadcasts one bounce' );
        assert.equal( seen[ 0 ]?.victimId, host.sessionId );
        assert.ok( Math.abs( ( seen[ 0 ]?.z ?? 0 ) - b.z0 ) < 1, 'the contact sits on the block face' );
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
        arm( shooter, HeldPower.bolt );
        host.onMessage( 'hit', () => {} );
        otherClient.onMessage( 'hit', () => {} );

        const added: string[] = [];
        const removed: string[] = [];
        const $ = getStateCallbacks( host );
        $( host.state ).projectiles.onAdd( ( _bolt, id ) => added.push( id ) );
        $( host.state ).projectiles.onRemove( ( _bolt, id ) => removed.push( id ) );

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
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
        arm( shooter, HeldPower.seeker );

        let seekerHits = 0;
        for ( const c of [ host, otherClient ] ) {
            c.onMessage( 'hit', () => {} );
            c.onMessage( SEEKER_MISS_MESSAGE, () => {} );
        }
        host.onMessage( SEEKER_HIT_MESSAGE, () => {} );
        otherClient.onMessage( SEEKER_HIT_MESSAGE, () => {
            seekerHits++;
        } );

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        assert.equal( room.state.projectiles.size, 0, 'a held seeker does not fire a bolt' );
        assert.equal( room.state.seekers.size, 1, 'firing spawns exactly one seeker' );
        const [ seeker ] = room.state.seekers.values();
        assert.equal( seeker?.targetId, otherClient.sessionId, 'the seeker locks the racer ahead' );
        assert.equal( shooter.slots[ 0 ], HeldPower.none, 'firing empties the fired slot' );

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
        arm( shooter, HeldPower.seeker );

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        const [ seeker ] = room.state.seekers.values();
        assert.equal( seeker?.targetId, '', 'no racer ahead means no lock' );
        assert.equal( shooter.slots[ 0 ], HeldPower.none, 'the power is spent anyway' );

        tick( room, DEFAULT_SIM_CONFIG.seekerTtl + FIXED_DT );
        assert.equal( room.state.seekers.size, 0, 'the unlocked seeker expires' );
    } );

    test( 'a shooter fires three seekers back to back', async () => {
        const { room, host } = await racingRoom( 1 );
        const shooter = playerOf( room, host.sessionId );
        arm( shooter, HeldPower.seeker, HeldPower.seeker, HeldPower.seeker );

        for ( const slot of [ 0, 1, 2 ] ) {
            host.send( USE_POWERUP_MESSAGE, { slot } );
            await room.waitForMessage( USE_POWERUP_MESSAGE );
        }

        assert.equal( room.state.seekers.size, 3, 'every seeker flies at once' );
        assert.deepEqual( rack( shooter ), [ HeldPower.none, HeldPower.none, HeldPower.none ] );
    } );

    test( 'a boost starts the racer boost timer, fires nothing, and a second use resets it', async () => {
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );
        arm( racer, HeldPower.boost, HeldPower.boost );

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        assert.equal( racer.boostTimer, DEFAULT_SIM_CONFIG.boostS );
        assert.equal( racer.slots[ 0 ], HeldPower.none, 'the boost is spent' );
        assert.equal( room.state.projectiles.size, 0, 'a boost is not a bolt' );

        racer.boostTimer = 0.5;
        host.send( USE_POWERUP_MESSAGE, { slot: 1 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        assert.equal( racer.boostTimer, DEFAULT_SIM_CONFIG.boostS, 'the second boost resets, it does not add' );
    } );

    test( 'a stunned racer cannot boost and keeps the charge', async () => {
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );
        arm( racer, HeldPower.boost );
        racer.stunTimer = 1;

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        assert.equal( racer.boostTimer, 0 );
        assert.equal( racer.slots[ 0 ], HeldPower.boost, 'the charge is kept' );
    } );

    test( 'a fire message without a valid slot is ignored', async () => {
        const { room, host } = await racingRoom( 1 );
        const shooter = playerOf( room, host.sessionId );
        arm( shooter, HeldPower.bolt );

        host.send( USE_POWERUP_MESSAGE );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        host.send( USE_POWERUP_MESSAGE, { slot: POWER_SLOTS } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );

        assert.equal( room.state.projectiles.size, 0, 'no bolt fired' );
        assert.equal( shooter.slots[ 0 ], HeldPower.bolt, 'the power is kept' );
    } );

    test( 'dropping a slot empties only that slot and fires nothing', async () => {
        const { room, host } = await racingRoom( 1 );
        const shooter = playerOf( room, host.sessionId );
        arm( shooter, HeldPower.bolt, HeldPower.seeker );

        host.send( DROP_POWERUP_MESSAGE, { slot: 1 } );
        await room.waitForMessage( DROP_POWERUP_MESSAGE );

        assert.deepEqual( rack( shooter ), [ HeldPower.bolt, HeldPower.none, HeldPower.none ] );
        assert.equal( room.state.projectiles.size, 0, 'a drop fires no bolt' );
        assert.equal( room.state.seekers.size, 0, 'a drop fires no seeker' );
    } );

    function approachClear( track: Track, b: Block ): boolean {
        const x = ( b.x0 + b.x1 ) / 2;
        const z0 = b.z0 - AIM_BACK - MAX_SHIP_WIDTH;
        for ( let i = segIndexForZ( z0 ); i <= segIndexForZ( b.z0 ); i++ ) {
            for ( const o of track.segmentAt( i ).blocks ) {
                if ( o.id === b.id ) continue;
                if ( o.x0 < x + MAX_SHIP_WIDTH && o.x1 > x - MAX_SHIP_WIDTH && o.z0 < b.z0 && o.z1 > z0 ) return false;
            }
        }
        return true;
    }

    function firstBlock( room: RunRoom, kind: Block[ 'kind' ] ): Block {
        const track = resolveTrack( toDescriptor( room.state.descriptor ) );
        for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
            const b = track.segmentAt( i ).blocks.find( ( x ) => x.kind === kind && approachClear( track, x ) );
            if ( b ) return b;
        }
        assert.fail( `the seeded track has no ${ kind } block` );
    }

    function aimAt( room: RunRoom, sessionId: string, b: Block ): void {
        const shooter = playerOf( room, sessionId );
        shooter.x = ( b.x0 + b.x1 ) / 2;
        shooter.z = b.z0 - AIM_BACK;
        arm( shooter, HeldPower.bolt );
    }

    test( 'a bolt breaks a fractured block, is spent, and the break is synced', async () => {
        const { room, host } = await racingRoom( 1, 'weave' );
        host.onMessage( 'hit', () => {} );
        const target = firstBlock( room, 'fractured' );
        aimAt( room, host.sessionId, target );

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
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

        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        tick( room, 0.1 );

        assert.equal( room.state.blockBroken.size, 0, 'a sealed block was broken' );
        assert.equal( room.state.projectiles.size, 0, 'the bolt flew through a sealed block' );
    } );

    test( 'returning to the lobby restores every broken block', async () => {
        const { room, host } = await racingRoom( 1, 'weave' );
        host.onMessage( 'hit', () => {} );
        aimAt( room, host.sessionId, firstBlock( room, 'fractured' ) );
        host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        tick( room, 0.1 );
        assert.equal( room.state.blockBroken.size, 1, 'precondition: one block is broken' );

        ( room as unknown as { resetToLobby(): void } ).resetToLobby();

        assert.equal( room.state.blockBroken.size, 0, 'a broken block survived the reset' );
    } );

    test( 'a racer grabs an available pickup into its lowest empty slot and the pickup hides', async () => {
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );

        const [ pickup ] = pickupLayout( toDescriptor( room.state.descriptor ) );
        assert.ok( pickup, 'the seeded layout places at least one pickup' );

        arm( racer, HeldPower.seeker );
        racer.x = pickup.x;
        racer.z = pickup.z;

        tick( room, FIXED_DT );

        assert.deepEqual( rack( racer ), [ HeldPower.seeker, pickupPower( pickup.id ), HeldPower.none ] );
        assert.equal( room.state.pickupTaken.get( pickup.id ), true, 'the grabbed pickup hides' );
    } );

    test( 'a racer with a full rack skips the pickup and it stays', async () => {
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );

        const [ pickup ] = pickupLayout( toDescriptor( room.state.descriptor ) );
        assert.ok( pickup, 'the seeded layout places at least one pickup' );

        arm( racer, HeldPower.seeker, HeldPower.seeker, HeldPower.seeker );
        racer.x = pickup.x;
        racer.z = pickup.z;

        tick( room, FIXED_DT );

        assert.deepEqual( rack( racer ), [ HeldPower.seeker, HeldPower.seeker, HeldPower.seeker ] );
        assert.notEqual( room.state.pickupTaken.get( pickup.id ), true, 'the skipped pickup stays available' );
    } );

    test( 'a client decodes the rack and hears each slot change', async () => {
        const { room, host } = await racingRoom( 1 );
        const changes: string[] = [];
        const $ = getStateCallbacks( host );
        $( host.state ).players.onAdd( ( p ) => {
            $( p ).slots.onChange( ( v, i ) => changes.push( `${ i }=${ v }` ) );
        } );
        await room.waitForNextPatch();
        await delay( 100 );
        changes.length = 0;

        arm( playerOf( room, host.sessionId ), HeldPower.bolt, HeldPower.none, HeldPower.seeker );
        await room.waitForNextPatch();
        await delay( 100 );

        const mine = host.state.players.get( host.sessionId );
        assert.deepEqual( mine && Array.from( mine.slots ), [ HeldPower.bolt, HeldPower.none, HeldPower.seeker ] );
        assert.deepEqual( changes.sort(), [ `0=${ HeldPower.bolt }`, `2=${ HeldPower.seeker }` ] );
    } );

    test( 'a client decodes a score descriptor and resolves the server track from it', async () => {
        process.env.SLUR_TRACK_GEN = 'score';
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        delete process.env.SLUR_TRACK_GEN;
        const host = await colyseus.connectTo( room, { name: 'Racer0' } );
        await room.waitForNextPatch();
        await delay( 100 );

        const decoded = toDescriptor( host.state.descriptor );
        assert.equal( decoded.kind === 'procgen' && decoded.gen, 'score' );
        assert.deepEqual( decoded, toDescriptor( room.state.descriptor ) );
        assert.equal( host.state.players.get( host.sessionId )?.name, 'Racer0' );
        const server = resolveTrack( toDescriptor( room.state.descriptor ) );
        const client = resolveTrack( decoded );
        for ( let i = 0; i < TRACK_SEGMENTS; i += 7 ) {
            assert.equal( JSON.stringify( client.segmentAt( i ) ), JSON.stringify( server.segmentAt( i ) ) );
        }
    } );

    test( 'a room without SLUR_TRACK_GEN hosts a groove track', async () => {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        const host = await colyseus.connectTo( room, { name: 'Racer0' } );
        await room.waitForNextPatch();
        await delay( 100 );
        const decoded = toDescriptor( host.state.descriptor );
        assert.equal( decoded.kind === 'procgen' && decoded.gen, 'groove' );
    } );

    test( 'a taken pickup slot respawns after PICKUP_RESPAWN_S', async () => {
        const { room, host } = await racingRoom( 1 );
        const racer = playerOf( room, host.sessionId );

        const [ pickup ] = pickupLayout( toDescriptor( room.state.descriptor ) );
        assert.ok( pickup, 'the seeded layout places at least one pickup' );

        arm( racer );
        racer.x = pickup.x;
        racer.z = pickup.z;
        tick( room, FIXED_DT );
        assert.equal( room.state.pickupTaken.get( pickup.id ), true, 'precondition: the slot is taken' );
        arm( racer, HeldPower.bolt, HeldPower.bolt, HeldPower.bolt );

        tick( room, PICKUP_RESPAWN_S + FIXED_DT );

        assert.equal( room.state.pickupTaken.get( pickup.id ), false, 'the slot returns after the delay' );
    } );
} );
