import { DEFAULT_TRACK_GEN, FIXED_DT, HeldPower, procgenDescriptor, START_MESSAGE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { INCOMING_SEEKER_BEHIND } from './pickup-grants.constants';
import { firstEmptySlot, grantPower, incomingSeeker } from './pickup-grants.utils';

function racingRoom(): LoopbackRoom {
    const room = new LoopbackRoom( procgenDescriptor( 1, DEFAULT_TRACK_GEN ), { countdownSeconds: 0 } );
    room.send( START_MESSAGE );
    room.step( FIXED_DT );
    return room;
}

describe( 'firstEmptySlot', () => {
    it( 'finds the first empty slot, or -1 when all are held', () => {
        expect( firstEmptySlot( [ HeldPower.none, HeldPower.none, HeldPower.none ] ) ).toBe( 0 );
        expect( firstEmptySlot( [ HeldPower.mine, HeldPower.none, HeldPower.bolt ] ) ).toBe( 1 );
        expect( firstEmptySlot( [ HeldPower.mine, HeldPower.tug, HeldPower.bolt ] ) ).toBe( -1 );
    } );
} );

describe( 'grantPower', () => {
    it( 'fills server slots in order and reaches the decoded client state', () => {
        const room = racingRoom();
        expect( grantPower( room, HeldPower.seeker ) ).toBe( true );
        expect( grantPower( room, HeldPower.tug ) ).toBe( true );
        expect( grantPower( room, HeldPower.portal ) ).toBe( true );
        expect( grantPower( room, HeldPower.bolt ) ).toBe( false );
        expect( [ ...( room.sim.state.players.get( room.sessionId )?.slots ?? [] ) ] ).toEqual( [
            HeldPower.seeker,
            HeldPower.tug,
            HeldPower.portal,
        ] );
        room.step( 0.2 );
        expect( [ ...( room.state.players.get( room.sessionId )?.slots ?? [] ) ] ).toEqual( [
            HeldPower.seeker,
            HeldPower.tug,
            HeldPower.portal,
        ] );
    } );
} );

describe( 'incomingSeeker', () => {
    it( 'launches a seeker behind the player, locked on the player', () => {
        const room = racingRoom();
        const self = room.sim.state.players.get( room.sessionId );
        expect( incomingSeeker( room ) ).toBe( true );
        const [ seeker ] = [ ...room.sim.state.seekers.values() ];
        expect( seeker?.targetId ).toBe( room.sessionId );
        expect( seeker?.z ).toBeLessThan( ( self?.z ?? 0 ) - INCOMING_SEEKER_BEHIND + 10 );
        room.step( 0.2 );
        expect( [ ...room.state.seekers.values() ].map( ( s ) => s.targetId ) ).toEqual( [ room.sessionId ] );
    } );
} );
