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
    MINE_BURST_MESSAGE,
    PHASE,
    PlayerState,
    POWER_SLOTS,
    ROOM_NAME,
    RunState,
    SEEKER_HIT_MESSAGE,
    SEEKER_MISS_MESSAGE,
    SHIELD_POP_MESSAGE,
    START_MESSAGE,
    STUN_SECONDS,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { resolveMineEvent } from './room-combat.js';
import { RunRoom } from './run-room.js';

interface CombatRoom {
    fixedStep( dt: number ): void;
    clearCombat(): void;
}

function tick( room: RunRoom, seconds: number ): void {
    const steps = Math.round( seconds / FIXED_DT );
    for ( let i = 0; i < steps; i++ ) ( room as unknown as CombatRoom ).fixedStep( FIXED_DT );
}

function playerOf( room: RunRoom, sessionId: string ): PlayerState {
    const p = room.state.players.get( sessionId );
    assert.ok( p, `player ${ sessionId } is present in the room` );
    return p;
}

function arm( p: PlayerState, ...powers: HeldPower[] ): void {
    for ( let i = 0; i < POWER_SLOTS; i++ ) p.slots[ i ] = powers[ i ] ?? HeldPower.none;
}

describe( 'RunRoom shield', () => {
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

    async function duel() {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        room.setSimulationInterval();
        const host = await colyseus.connectTo( room, { name: 'Shooter' } );
        const other = await colyseus.connectTo( room, { name: 'Victim' } );
        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, COUNTDOWN_SECONDS + FIXED_DT );
        assert.equal( room.state.phase, PHASE.racing );

        const shooter = playerOf( room, host.sessionId );
        const victim = playerOf( room, other.sessionId );
        victim.shipId = 'executioner';
        shooter.x = 0;
        shooter.z = 0;
        victim.x = 0;
        victim.z = 20;

        const pops: { victimId: string }[] = [];
        let hits = 0;
        for ( const c of [ host, other ] ) {
            c.onMessage( SEEKER_MISS_MESSAGE, () => {} );
            c.onMessage( SEEKER_HIT_MESSAGE, () => {} );
        }
        host.onMessage( 'hit', () => {} );
        other.onMessage( 'hit', () => {
            hits++;
        } );
        host.onMessage( SHIELD_POP_MESSAGE, () => {} );
        other.onMessage( SHIELD_POP_MESSAGE, ( m: { victimId: string } ) => pops.push( m ) );

        async function raise(): Promise< void > {
            arm( victim, HeldPower.shield );
            other.send( USE_POWERUP_MESSAGE, { slot: 0 } );
            await room.waitForMessage( USE_POWERUP_MESSAGE );
        }

        async function shoot( power: HeldPower ): Promise< void > {
            arm( shooter, power );
            host.send( USE_POWERUP_MESSAGE, { slot: 0 } );
            await room.waitForMessage( USE_POWERUP_MESSAGE );
        }

        return { room, other, shooter, victim, pops, hits: () => hits, raise, shoot };
    }

    test( 'a shield raises for shieldS, fires nothing, and lapses at the end of the window', async () => {
        const { room, victim, raise } = await duel();
        await raise();
        assert.equal( victim.shielded, true );
        assert.equal( victim.shieldTimer, DEFAULT_SIM_CONFIG.shieldS );
        assert.equal( victim.slots[ 0 ], HeldPower.none, 'the shield is spent' );
        assert.equal( room.state.projectiles.size + room.state.seekers.size + room.state.mines.size, 0 );

        tick( room, DEFAULT_SIM_CONFIG.shieldS - 0.1 );
        assert.equal( victim.shielded, true, 'the shield holds through the window' );
        tick( room, 0.2 );
        assert.equal( victim.shielded, false, 'the shield lapses' );
    } );

    test( 'a shield eats one bolt with no stun and pops; the next bolt stuns', async () => {
        const { room, other, victim, pops, hits, raise, shoot } = await duel();
        await raise();
        await shoot( HeldPower.bolt );
        tick( room, 0.25 );

        assert.equal( victim.stunTimer, 0, 'the absorbed bolt does not stun' );
        assert.equal( victim.shielded, false, 'the shield is used up' );
        assert.equal( room.state.projectiles.size, 0, 'the absorbed bolt is spent' );

        await shoot( HeldPower.bolt );
        tick( room, 0.25 );
        assert.equal( victim.stunTimer, Math.fround( STUN_SECONDS ), 'the second bolt stuns' );

        await delay( 100 );
        assert.deepEqual(
            pops.map( ( p ) => p.victimId ),
            [ other.sessionId ],
        );
        assert.equal( hits(), 1, "only the unshielded strike broadcasts a 'hit'" );
    } );

    test( 'a shield eats a seeker with no stun and no seeker-hit message', async () => {
        const { room, other, victim, pops, raise, shoot } = await duel();
        let seekerHits = 0;
        other.onMessage( SEEKER_HIT_MESSAGE, () => {
            seekerHits++;
        } );
        await raise();
        await shoot( HeldPower.seeker );
        tick( room, 1 );

        assert.equal( room.state.seekers.size, 0, 'the seeker is spent' );
        assert.equal( victim.stunTimer, 0 );
        assert.equal( victim.shielded, false );

        await delay( 100 );
        assert.equal( pops.length, 1 );
        assert.equal( seekerHits, 0 );
    } );

    test( 'a death drops the shield and a new race clears it', async () => {
        const { room, victim, raise } = await duel();
        await raise();
        victim.dead = true;
        tick( room, FIXED_DT );
        assert.equal( victim.shielded, false, 'a block crash is not absorbed; the dead ship loses its shield' );

        victim.dead = false;
        await raise();
        ( room as unknown as CombatRoom ).clearCombat();
        assert.equal( victim.shielded, false );
        assert.equal( victim.shieldTimer, 0 );
    } );
} );

test( 'a shield eats a mine trigger: no stun, no speed cut, the mine still bursts', () => {
    const state = new RunState();
    const v = new PlayerState();
    v.shipId = 'executioner';
    v.vz = 100;
    v.shielded = true;
    v.shieldTimer = 3;
    state.players.set( 'v', v );
    const sent: string[] = [];
    const event = { outcome: 'trigger' as const, x: 0, y: 0, z: 10, victimId: 'v', ownerId: 'o' };

    resolveMineEvent( state, event, ( t ) => sent.push( t ), DEFAULT_SIM_CONFIG );
    assert.equal( v.stunTimer, 0 );
    assert.equal( v.vz, 100 );
    assert.equal( v.shielded, false );
    assert.deepEqual( sent, [ SHIELD_POP_MESSAGE, MINE_BURST_MESSAGE ] );

    resolveMineEvent( state, event, ( t ) => sent.push( t ), DEFAULT_SIM_CONFIG );
    assert.equal( v.stunTimer, DEFAULT_SIM_CONFIG.mineStunS );
    assert.deepEqual( sent.slice( 2 ), [ 'hit', MINE_BURST_MESSAGE ] );
} );
