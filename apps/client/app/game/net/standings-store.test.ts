import { describe, expect, it } from 'vitest';
import { type RacerInput, readStandings, rosterWindow, standingsKey } from './standings-store';

function racer( id: string, z: number, extra: Partial< RacerInput > = {} ): RacerInput {
    return {
        id,
        name: id,
        colorId: 0,
        shipId: 'executioner',
        spectating: false,
        finished: false,
        finishTime: 0,
        z,
        connected: true,
        progressAt: 0,
        ...extra,
    };
}

describe( 'rosterWindow', () => {
    const rows = [ 1, 2, 3, 4, 5, 6, 7, 8 ];

    it( 'centres the window on the given index', () => {
        expect( rosterWindow( rows, 3 ) ).toEqual( [ 2, 3, 4, 5, 6 ] );
    } );

    it( 'pins the window to the top for the leader', () => {
        expect( rosterWindow( rows, 0 ) ).toEqual( [ 1, 2, 3, 4, 5 ] );
    } );

    it( 'pins the window to the bottom for the last racer', () => {
        expect( rosterWindow( rows, 7 ) ).toEqual( [ 4, 5, 6, 7, 8 ] );
    } );

    it( 'shows the top of the field when the centre is absent', () => {
        expect( rosterWindow( rows, -1 ) ).toEqual( [ 1, 2, 3, 4, 5 ] );
    } );

    it( 'returns every row of a field smaller than the window', () => {
        expect( rosterWindow( [ 1, 2 ], 1 ) ).toEqual( [ 1, 2 ] );
    } );
} );

describe( 'readStandings', () => {
    it( 'ranks self by z and marks the self row', () => {
        const s = readStandings( [ racer( 'a', 10 ), racer( 'self', 30 ), racer( 'b', 20 ) ], 'self' );
        expect( s.rank ).toBe( 1 );
        expect( s.field ).toBe( 3 );
        expect( s.entries.map( ( e ) => e.id ) ).toEqual( [ 'self', 'b', 'a' ] );
        expect( s.entries[ 0 ]?.self ).toBe( true );
        expect( s.entries[ 1 ]?.self ).toBe( false );
    } );

    it( 'counts spectators as connected but not in the field', () => {
        const s = readStandings( [ racer( 'a', 10 ), racer( 'self', 0, { spectating: true } ) ], 'self' );
        expect( s.connected ).toBe( 2 );
        expect( s.field ).toBe( 1 );
        expect( s.rank ).toBe( 0 );
        expect( s.selfSpectating ).toBe( true );
    } );

    it( 'marks self finished from the server latch', () => {
        const before = readStandings( [ racer( 'a', 10, { finished: true } ), racer( 'self', 30 ) ], 'self' );
        const after = readStandings( [ racer( 'a', 10 ), racer( 'self', 30, { finished: true } ) ], 'self' );
        expect( before.selfFinished ).toBe( false );
        expect( after.selfFinished ).toBe( true );
        expect( standingsKey( after ) ).not.toBe( standingsKey( before ) );
    } );

    it( 'names an empty name Racer', () => {
        expect( readStandings( [ racer( 'self', 0, { name: '' } ) ], 'self' ).entries[ 0 ]?.name ).toBe( 'Racer' );
    } );

    it( 'flags a racer idle after STALL_SECONDS without progress, never a finisher', () => {
        const players = [
            racer( 'a', 10, { progressAt: 5 } ),
            racer( 'self', 30, { progressAt: 40 } ),
            racer( 'b', 50, { finished: true, progressAt: 0 } ),
        ];
        const idle = ( elapsed: number ) =>
            readStandings( players, 'self', elapsed, true ).entries.map( ( e ) => [ e.id, e.idle ] );
        expect( idle( 34 ) ).toEqual( [
            [ 'b', false ],
            [ 'self', false ],
            [ 'a', false ],
        ] );
        expect( idle( 35 ) ).toEqual( [
            [ 'b', false ],
            [ 'self', false ],
            [ 'a', true ],
        ] );
        expect( standingsKey( readStandings( players, 'self', 35, true ) ) ).not.toBe(
            standingsKey( readStandings( players, 'self', 34, true ) ),
        );
    } );

    it( 'flags nobody idle when the stall rule is off (open-ended run)', () => {
        const s = readStandings( [ racer( 'a', 10, { progressAt: 0 } ) ], 'a', 999, false );
        expect( s.entries[ 0 ]?.idle ).toBe( false );
    } );
} );

describe( 'standingsKey', () => {
    it( 'ignores a z change that keeps the order', () => {
        const before = readStandings( [ racer( 'a', 10 ), racer( 'self', 30 ) ], 'self' );
        const after = readStandings( [ racer( 'a', 12 ), racer( 'self', 31 ) ], 'self' );
        expect( standingsKey( after ) ).toBe( standingsKey( before ) );
    } );

    it( 'changes when an overtake swaps the order', () => {
        const before = readStandings( [ racer( 'a', 10 ), racer( 'self', 30 ) ], 'self' );
        const after = readStandings( [ racer( 'a', 40 ), racer( 'self', 31 ) ], 'self' );
        expect( standingsKey( after ) ).not.toBe( standingsKey( before ) );
    } );
} );
