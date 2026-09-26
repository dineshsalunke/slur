import {
    DEFAULT_TRACK_GEN,
    FIXED_DT,
    HeldPower,
    HIT_MESSAGE,
    type HitMessage,
    PHASE,
    procgenDescriptor,
    START_MESSAGE,
    USE_POWERUP_MESSAGE,
} from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { stateCallbacks } from '../state-callbacks';
import { LoopbackRoom } from './loopback-room';

function stepFor( room: LoopbackRoom, seconds: number ): void {
    for ( let t = 0; t < seconds; t += FIXED_DT ) room.step( FIXED_DT );
}

describe( 'LoopbackRoom', () => {
    it( 'joins the local racer as host and decodes it into the client state', () => {
        const room = new LoopbackRoom( procgenDescriptor( 1, DEFAULT_TRACK_GEN ), 'Pilot' );

        expect( room.state ).not.toBe( room.sim.state );
        expect( room.state.hostId ).toBe( room.sessionId );
        expect( room.state.players.get( room.sessionId )?.name ).toBe( 'Pilot' );
        expect( room.state.descriptor.seed ).toBe( room.sim.state.descriptor.seed );
    } );

    it( 'starts, fires a bolt and delivers the decoded projectile and the hit', () => {
        const room = new LoopbackRoom( procgenDescriptor( 1, DEFAULT_TRACK_GEN ) );
        room.sim.join( 'target' );
        const $ = stateCallbacks( room );
        const added: string[] = [];
        const removed: string[] = [];
        $( room.state ).projectiles.onAdd( ( _bolt, id ) => added.push( id ) );
        $( room.state ).projectiles.onRemove( ( _bolt, id ) => removed.push( id ) );
        const hits: HitMessage[] = [];
        room.onMessage( HIT_MESSAGE, ( m: HitMessage ) => hits.push( m ) );

        room.send( START_MESSAGE );
        stepFor( room, 5 );
        expect( room.state.phase ).toBe( PHASE.racing );

        const shooter = room.sim.state.players.get( room.sessionId );
        const victim = room.sim.state.players.get( 'target' );
        if ( ! shooter || ! victim ) throw new Error( 'both racers joined' );
        victim.shipId = 'executioner';
        shooter.x = 0;
        shooter.z = 0;
        victim.x = 0;
        victim.z = 120;
        shooter.slots[ 0 ] = HeldPower.bolt;

        room.send( USE_POWERUP_MESSAGE, { slot: 0 } );
        stepFor( room, 0.5 );

        expect( added ).toHaveLength( 1 );
        expect( removed ).toEqual( added );
        expect( hits ).toHaveLength( 1 );
        expect( hits[ 0 ].victimId ).toBe( 'target' );
        expect( room.state.players.get( room.sessionId )?.slots[ 0 ] ).toBe( HeldPower.none );
    } );
} );
