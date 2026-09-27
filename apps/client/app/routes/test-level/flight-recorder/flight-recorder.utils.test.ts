import { HeldPower, spawnShip } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { SPEED_BANDS, TELEPORT_U } from './flight-recorder.constants';
import {
    breaksRun,
    clockOf,
    emptyTake,
    eventsBetween,
    type FlightSnap,
    pushPoint,
    snapOf,
    speedBand,
} from './flight-recorder.utils';

function snap( patch: Partial< FlightSnap > = {} ): FlightSnap {
    return { x: 0, z: 0, dead: false, grounded: true, jumpsUsed: 0, boosting: false, held: 0, ...patch };
}

describe( 'eventsBetween', () => {
    it( 'reads takeoff, landing, boost and pickup edges', () => {
        expect( eventsBetween( snap(), snap( { grounded: false, jumpsUsed: 1 } ) ) ).toEqual( [ 'takeoff' ] );
        expect(
            eventsBetween( snap( { grounded: false, jumpsUsed: 1 } ), snap( { grounded: false, jumpsUsed: 2 } ) ),
        ).toEqual( [ 'takeoff' ] );
        expect( eventsBetween( snap( { grounded: false, jumpsUsed: 2 } ), snap() ) ).toEqual( [ 'landing' ] );
        expect( eventsBetween( snap(), snap( { boosting: true } ) ) ).toEqual( [ 'boost' ] );
        expect( eventsBetween( snap( { boosting: true } ), snap( { boosting: true } ) ) ).toEqual( [] );
        expect( eventsBetween( snap(), snap( { held: 1 } ) ) ).toEqual( [ 'pickup' ] );
        expect( eventsBetween( snap( { held: 1 } ), snap() ) ).toEqual( [] );
    } );

    it( 'reports a death once and nothing on the respawn', () => {
        expect( eventsBetween( snap( { grounded: false } ), snap( { dead: true } ) ) ).toEqual( [ 'death' ] );
        expect( eventsBetween( snap( { dead: true } ), snap( { dead: true } ) ) ).toEqual( [] );
        expect( eventsBetween( snap( { dead: true, grounded: false } ), snap() ) ).toEqual( [] );
    } );
} );

describe( 'snapOf', () => {
    it( 'counts held slots and reads boost from the timer', () => {
        const ship = { ...spawnShip( 3, 40 ), boostTimer: 0.5 };
        const s = snapOf( ship, [ HeldPower.bolt, HeldPower.none, HeldPower.seeker ] );
        expect( s ).toMatchObject( { x: 3, z: 40, held: 2, boosting: true } );
    } );
} );

describe( 'runs', () => {
    it( 'break on the first sample, after a death and on a teleport', () => {
        expect( breaksRun( null, snap() ) ).toBe( true );
        expect( breaksRun( snap( { dead: true } ), snap() ) ).toBe( true );
        expect( breaksRun( snap(), snap( { z: TELEPORT_U + 1 } ) ) ).toBe( true );
        expect( breaksRun( snap(), snap( { z: 2 } ) ) ).toBe( false );
    } );

    it( 'grow the last run or open a new one', () => {
        const take = emptyTake( 1 );
        pushPoint( take, { x: 0, z: 0, band: 0 }, false );
        pushPoint( take, { x: 0, z: 1, band: 0 }, false );
        pushPoint( take, { x: 0, z: 50, band: 0 }, true );
        expect( take.runs.map( ( r ) => r.length ) ).toEqual( [ 2, 1 ] );
    } );
} );

describe( 'speedBand', () => {
    it( 'spreads 0..maxCruise over the bands and puts boost above them', () => {
        expect( speedBand( 0, 100 ) ).toBe( 0 );
        expect( speedBand( -5, 100 ) ).toBe( 0 );
        expect( speedBand( 99, 100 ) ).toBe( SPEED_BANDS - 1 );
        expect( speedBand( 100, 100 ) ).toBe( SPEED_BANDS - 1 );
        expect( speedBand( 101, 100 ) ).toBe( SPEED_BANDS );
    } );
} );

describe( 'clockOf', () => {
    it( 'formats minutes and seconds', () => {
        expect( clockOf( 0 ) ).toBe( '0:00' );
        expect( clockOf( 75 ) ).toBe( '1:15' );
    } );
} );
