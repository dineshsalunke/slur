import { PHASE } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { EMPTY_RUN, readRun, runViewStore } from './run-view-store';

function racer( z: number, name = 'Racer' ) {
    return {
        name,
        colorId: 0,
        shipId: 'executioner',
        spectating: false,
        finished: false,
        finishTime: 0,
        connected: true,
        z,
    };
}

function roomWith( countdown: number, players: Array< [ string, ReturnType< typeof racer > ] > ) {
    return {
        sessionId: 'a',
        state: { phase: PHASE.countdown, countdown, hostId: 'a', players: new Map( players ) },
    } as never;
}

describe( 'readRun (#274)', () => {
    it( 'keeps the same snapshot when only z moves and the order holds', () => {
        const first = readRun(
            roomWith( 3, [
                [ 'a', racer( 10 ) ],
                [ 'b', racer( 5 ) ],
            ] ),
            EMPTY_RUN,
        );
        const next = readRun(
            roomWith( 3, [
                [ 'a', racer( 12 ) ],
                [ 'b', racer( 6 ) ],
            ] ),
            first,
        );
        expect( next ).toBe( first );
    } );

    it( 'keeps the same snapshot on a sub-second countdown patch', () => {
        const first = readRun( roomWith( 2.9, [ [ 'a', racer( 0 ) ] ] ), EMPTY_RUN );
        expect( first.countdown ).toBe( 3 );
        expect( readRun( roomWith( 2.1, [ [ 'a', racer( 0 ) ] ] ), first ) ).toBe( first );
    } );

    it( 'replaces standings but keeps players when the order flips', () => {
        const first = readRun(
            roomWith( 3, [
                [ 'a', racer( 10 ) ],
                [ 'b', racer( 5 ) ],
            ] ),
            EMPTY_RUN,
        );
        const next = readRun(
            roomWith( 3, [
                [ 'a', racer( 10 ) ],
                [ 'b', racer( 15 ) ],
            ] ),
            first,
        );
        expect( next.players ).toBe( first.players );
        expect( next.standings ).not.toBe( first.standings );
        expect( next.standings[ 0 ].id ).toBe( 'b' );
    } );

    it( 'replaces players on a name change', () => {
        const first = readRun( roomWith( 3, [ [ 'a', racer( 0 ) ] ] ), EMPTY_RUN );
        const next = readRun( roomWith( 3, [ [ 'a', racer( 0, 'Ada' ) ] ] ), first );
        expect( next.players ).not.toBe( first.players );
        expect( next.players[ 0 ].name ).toBe( 'Ada' );
    } );
} );

describe( 'runViewStore first snapshot (#277)', () => {
    it( 'reads the live phase before any subscriber attaches, so a mid-race joiner never sees the lobby', () => {
        const room = {
            sessionId: 'a',
            state: { phase: PHASE.racing, countdown: 0, hostId: 'a', players: new Map() },
        } as never;
        expect( runViewStore( room ).snapshot().phase ).toBe( PHASE.racing );
    } );
} );
