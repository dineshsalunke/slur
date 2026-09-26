// @vitest-environment jsdom

import { PHASE, RESTART_MESSAGE } from '@slur/shared';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountOverlays, pressEnter, unmountOverlays } from './mount-overlays';
import { bus, send } from './test-room';

vi.mock( '@colyseus/sdk', async () => ( await import( './test-room' ) ).sdkMock );

const counts = vi.hoisted( () => ( { ResultsOverlay: 0, Standings: 0 } ) );

vi.mock( './results-overlay', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./results-overlay') >();
    return {
        ResultsOverlay: ( props: Parameters< typeof actual.ResultsOverlay >[ 0 ] ) => {
            counts.ResultsOverlay += 1;
            return actual.ResultsOverlay( props );
        },
    };
} );

vi.mock( './standings', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./standings') >();
    return {
        Standings: ( props: Parameters< typeof actual.Standings >[ 0 ] ) => {
            counts.Standings += 1;
            return actual.Standings( props );
        },
    };
} );

beforeEach( () => {
    bus.reset();
    bus.state.phase = PHASE.finished;
    const base = { shipId: 'executioner', spectating: false, connected: true, z: 0 };
    const racers = [
        [ 'self', 'Dinesh', 104.78 ],
        [ 'priya', 'Priya', 102.37 ],
        [ 'sam', 'Sam', 0 ],
    ] as const;
    racers.forEach( ( [ id, name, finishTime ], colorId ) => {
        bus.state.players.set( id, { ...base, name, colorId, finished: finishTime > 0, finishTime } );
    } );
    send.mockClear();
} );

afterEach( unmountOverlays );

describe( 'Results overlay', () => {
    it( 'titles the winner and marks the unfinished racer DNF', async () => {
        const container = await mountOverlays();

        expect( container.querySelector( 'h2' )?.textContent ).toBe( 'Priya wins' );
        const rows = [ ...container.querySelectorAll( 'ol[aria-label="Standings"] li' ) ];
        expect( rows.map( ( r ) => r.textContent?.includes( 'DNF' ) ) ).toEqual( [ false, false, true ] );
        expect( rows[ 1 ]?.textContent ).toContain( '+2.41' );
    } );

    it( 'restarts the run on a bare Enter for the host only', async () => {
        await mountOverlays();

        await pressEnter();
        expect( send ).toHaveBeenCalledWith( RESTART_MESSAGE );

        send.mockClear();
        bus.state.hostId = 'priya';
        await pressEnter();
        expect( send ).not.toHaveBeenCalledWith( RESTART_MESSAGE );
    } );

    it( 'lets a per-player patch reach Standings without re-rendering the shell', async () => {
        await mountOverlays();
        counts.ResultsOverlay = 0;
        counts.Standings = 0;

        await act( async () => {
            const self = bus.state.players.get( 'self' );
            if ( self ) self.name = 'Renamed';
            bus.emitPlayerChange();
        } );

        expect( counts.Standings ).toBeGreaterThan( 0 );
        expect( counts.ResultsOverlay ).toBe( 0 );
    } );
} );
