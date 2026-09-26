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
    type MineEvent,
    PHASE,
    type PlayerState,
    ROOM_NAME,
    type ShipId,
    START_MESSAGE,
    tuningForShip,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { RunRoom } from './run-room.js';

function tick( room: RunRoom, seconds: number ): void {
    const steps = Math.round( seconds / FIXED_DT );
    for ( let i = 0; i < steps; i++ ) room.sim.fixedStep( FIXED_DT );
}

function playerOf( room: RunRoom, sessionId: string ): PlayerState {
    const p = room.state.players.get( sessionId );
    assert.ok( p, `player ${ sessionId } is present in the room` );
    return p;
}

function park( p: PlayerState, x: number, z: number ): void {
    p.x = x;
    p.z = z;
    p.vx = 0;
    p.vz = 0;
}

const SHIP: ShipId = 'executioner';
const DROP_Z = 80;

describe( 'RunRoom mines', () => {
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

    async function layingRoom( msg: { slot: number; dir?: number } = { slot: 0 } ) {
        const room = await colyseus.createRoom< RunRoom >( ROOM_NAME );
        room.setSimulationInterval();
        const host = await colyseus.connectTo( room, { name: 'Layer' } );
        const rival = await colyseus.connectTo( room, { name: 'Rival' } );
        host.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, COUNTDOWN_SECONDS + FIXED_DT );
        assert.equal( room.state.phase, PHASE.racing );

        const layer = playerOf( room, host.sessionId );
        const victim = playerOf( room, rival.sessionId );
        layer.shipId = SHIP;
        victim.shipId = SHIP;
        park( layer, 0, DROP_Z );
        park( victim, 30, DROP_Z );
        layer.slots[ 0 ] = HeldPower.mine;

        const bursts: MineEvent[] = [];
        host.onMessage( MINE_BURST_MESSAGE, ( e: MineEvent ) => bursts.push( e ) );
        host.onMessage( 'hit', () => {} );
        rival.onMessage( MINE_BURST_MESSAGE, () => {} );
        rival.onMessage( 'hit', () => {} );

        host.send( USE_POWERUP_MESSAGE, msg );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        return { room, host, rival, layer, victim, bursts };
    }

    test( 'a laid mine reaches the client-decoded state, then arms there', async () => {
        const { room, host, layer } = await layingRoom();
        assert.equal( layer.slots[ 0 ], HeldPower.none, 'laying spends the slot' );
        assert.equal( room.state.mines.size, 1 );

        await delay( 100 );
        const decoded = [ ...host.state.mines.values() ];
        assert.equal( decoded.length, 1, 'the client decodes one mine' );
        const [ m ] = decoded;
        assert.ok( m );
        const wantZ = DROP_Z + tuningForShip( SHIP ).halfL + DEFAULT_SIM_CONFIG.mineTriggerR;
        assert.equal( m.x, 0 );
        assert.ok( Math.abs( m.z - wantZ ) < 1e-3, `z ${ m.z } vs ${ wantZ }` );
        assert.equal( m.ownerId, host.sessionId );
        assert.equal( m.armed, false );
        assert.equal( host.state.players.get( host.sessionId )?.name, 'Layer', 'fields after mines still decode' );

        tick( room, DEFAULT_SIM_CONFIG.mineArmS + 0.05 );
        await delay( 100 );
        assert.equal( [ ...host.state.mines.values() ][ 0 ]?.armed, true, 'the client sees it armed' );
    } );

    test( 'a rival on an armed mine is stunned, slowed, and the mine bursts', async () => {
        const { room, host, rival, layer, victim, bursts } = await layingRoom();
        tick( room, DEFAULT_SIM_CONFIG.mineArmS + 0.05 );
        const [ mine ] = [ ...room.state.mines.values() ];
        assert.ok( mine );
        park( layer, 0, DROP_Z + 200 );
        park( victim, mine.x, mine.z );
        victim.y = mine.y;
        victim.vz = 50;
        tick( room, FIXED_DT );

        assert.equal( room.state.mines.size, 0, 'the mine is spent' );
        assert.ok( Math.abs( victim.stunTimer - DEFAULT_SIM_CONFIG.mineStunS ) < 0.05, `stun ${ victim.stunTimer }` );
        assert.ok( victim.vz < 50 * DEFAULT_SIM_CONFIG.mineSpeedCut + 1, `vz ${ victim.vz }` );

        await delay( 100 );
        assert.equal( host.state.mines.size, 0, 'the client drops it too' );
        assert.deepEqual(
            bursts.map( ( b ) => [ b.outcome, b.victimId ] ),
            [ [ 'trigger', rival.sessionId ] ],
        );
    } );

    test( 'a bolt clears a mine and bursts it', async () => {
        const { room, rival, layer, victim, bursts } = await layingRoom();
        const [ mine ] = [ ...room.state.mines.values() ];
        assert.ok( mine );
        park( layer, 30, DROP_Z );
        park( victim, mine.x, mine.z - 40 );
        victim.y = mine.y;
        victim.slots[ 0 ] = HeldPower.bolt;
        rival.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        tick( room, 0.1 );

        assert.equal( room.state.mines.size, 0 );
        assert.equal( room.state.projectiles.size, 0, 'the bolt is spent on the mine' );
        await delay( 100 );
        assert.deepEqual(
            bursts.map( ( b ) => b.outcome ),
            [ 'cleared' ],
        );
    } );

    test( 'a mine fired back lands behind the layer tail', async () => {
        const { room } = await layingRoom( { slot: 0, dir: -1 } );
        const [ mine ] = [ ...room.state.mines.values() ];
        assert.ok( mine );
        const { mineTriggerR, mineBackGap } = DEFAULT_SIM_CONFIG;
        const wantZ = DROP_Z - tuningForShip( SHIP ).halfL - mineTriggerR - mineBackGap;
        assert.ok( Math.abs( mine.z - wantZ ) < 1e-3, `z ${ mine.z } vs ${ wantZ }` );
    } );

    test( 'the layer on its own armed mine is stunned too', async () => {
        const { room, host, layer, bursts } = await layingRoom();
        tick( room, DEFAULT_SIM_CONFIG.mineArmS + 0.05 );
        const [ mine ] = [ ...room.state.mines.values() ];
        assert.ok( mine );
        park( layer, mine.x, mine.z );
        layer.y = mine.y;
        tick( room, FIXED_DT );

        assert.equal( room.state.mines.size, 0, 'the mine is spent' );
        assert.ok( layer.stunTimer > 0, `stun ${ layer.stunTimer }` );
        await delay( 100 );
        assert.deepEqual(
            bursts.map( ( b ) => [ b.outcome, b.victimId ] ),
            [ [ 'trigger', host.sessionId ] ],
        );
    } );

    test( 'a bolt and a seeker fired back decode on the client with dir -1', async () => {
        const { room, host, layer } = await layingRoom();
        layer.slots[ 0 ] = HeldPower.bolt;
        layer.slots[ 1 ] = HeldPower.seeker;
        host.send( USE_POWERUP_MESSAGE, { slot: 0, dir: -1 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        host.send( USE_POWERUP_MESSAGE, { slot: 1, dir: -1 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        await delay( 100 );

        const [ bolt ] = [ ...host.state.projectiles.values() ];
        const [ seeker ] = [ ...host.state.seekers.values() ];
        assert.ok( bolt && seeker );
        assert.equal( bolt.dir, -1 );
        assert.ok( bolt.z < DROP_Z, `bolt z ${ bolt.z }` );
        assert.equal( bolt.ownerId, host.sessionId, 'fields before dir still decode' );
        assert.equal( seeker.dir, -1 );
        assert.ok( seeker.z < DROP_Z, `seeker z ${ seeker.z }` );
        assert.equal( seeker.ownerId, host.sessionId );
        assert.equal( host.state.mines.size, 1, 'the map after projectiles and seekers still decodes' );
    } );

    test( 'a fire message with a bad dir fires forward', async () => {
        const { room, host, layer } = await layingRoom();
        layer.slots[ 0 ] = HeldPower.bolt;
        host.send( USE_POWERUP_MESSAGE, { slot: 0, dir: 7 } );
        await room.waitForMessage( USE_POWERUP_MESSAGE );
        const [ bolt ] = [ ...room.state.projectiles.values() ];
        assert.equal( bolt?.dir, 1 );
    } );

    test( 'clearing combat removes every mine', async () => {
        const { room, host } = await layingRoom();
        room.sim.clearCombat();
        await delay( 100 );
        assert.equal( room.state.mines.size, 0 );
        assert.equal( host.state.mines.size, 0 );
    } );
} );
