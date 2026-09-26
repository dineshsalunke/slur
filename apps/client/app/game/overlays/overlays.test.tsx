// @vitest-environment jsdom

import { PHASE, SET_CLASS_MESSAGE, START_MESSAGE } from '@slur/shared';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentShip } from '../../ship/ship-choice';
import { mountOverlays, pressEnter, unmountOverlays } from './mount-overlays';
import { bus, send } from './test-room';

vi.mock( '@colyseus/sdk', async () => ( await import( './test-room' ) ).sdkMock );

const counts = vi.hoisted( () => ( { LeaveGuard: 0, SpecTag: 0, Roster: 0 } ) );

vi.mock( './spec-tag', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./spec-tag') >();
    return {
        SpecTag: ( props: Parameters< typeof actual.SpecTag >[ 0 ] ) => {
            counts.SpecTag += 1;
            return actual.SpecTag( props );
        },
    };
} );

vi.mock( './roster', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./roster') >();
    return {
        Roster: ( props: Parameters< typeof actual.Roster >[ 0 ] ) => {
            counts.Roster += 1;
            return actual.Roster( props );
        },
    };
} );

vi.mock( './leave-guard', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./leave-guard') >();
    return {
        LeaveGuard: ( props: Parameters< typeof actual.LeaveGuard >[ 0 ] ) => {
            counts.LeaveGuard += 1;
            return actual.LeaveGuard( props );
        },
    };
} );

beforeEach( () => {
    bus.reset();
    counts.LeaveGuard = 0;
    counts.SpecTag = 0;
    counts.Roster = 0;
    send.mockClear();
} );

afterEach( unmountOverlays );

describe( 'Overlays subscription boundary (#91)', () => {
    it( 'does not re-render LeaveGuard on an elapsed patch', async () => {
        await mountOverlays();
        counts.LeaveGuard = 0;

        await act( async () => {
            bus.emitRoot( 'elapsed', 1.5 );
        } );

        expect( counts.LeaveGuard ).toBe( 0 );
    } );

    it( 'still re-renders LeaveGuard on a phase change — proving the 0 above is not vacuous', async () => {
        await mountOverlays();
        counts.LeaveGuard = 0;

        await act( async () => {
            bus.emitRoot( 'phase', PHASE.finished );
        } );

        expect( counts.LeaveGuard ).toBeGreaterThan( 0 );
    } );

    it( 'mounts the spectator bar when self turns spectator, without re-rendering LeaveGuard', async () => {
        const container = await mountOverlays();
        counts.LeaveGuard = 0;
        expect( container.textContent ).not.toContain( 'Spectating' );

        await act( async () => {
            const self = bus.state.players.get( 'self' );
            if ( self ) self.spectating = true;
            bus.emitPlayerChange();
        } );

        expect( container.textContent ).toContain( 'Spectating' );
        expect( counts.LeaveGuard ).toBe( 0 );
    } );
} );

describe( 'Lobby overlay subscription boundary', () => {
    it( 'lets a per-player patch reach Roster without re-rendering SpecTag', async () => {
        bus.state.phase = PHASE.lobby;
        await mountOverlays();
        counts.SpecTag = 0;
        counts.Roster = 0;

        await act( async () => {
            const self = bus.state.players.get( 'self' );
            if ( self ) self.name = 'Renamed';
            bus.emitPlayerChange();
        } );

        expect( counts.Roster ).toBeGreaterThan( 0 );
        expect( counts.SpecTag ).toBe( 0 );
    } );

    it( 'does not re-render Roster on a z-only ship patch (#274)', async () => {
        bus.state.phase = PHASE.lobby;
        await mountOverlays();
        counts.Roster = 0;

        await act( async () => {
            const self = bus.state.players.get( 'self' );
            if ( self ) self.z = 42;
            bus.emitPlayerChange();
        } );

        expect( counts.Roster ).toBe( 0 );
    } );

    it( 'cycles the ship on D, re-rendering SpecTag but not Roster, and sends the new ship', async () => {
        bus.state.phase = PHASE.lobby;
        await mountOverlays();
        counts.SpecTag = 0;
        counts.Roster = 0;

        await act( async () => {
            document.body.dispatchEvent( new KeyboardEvent( 'keydown', { code: 'KeyD', bubbles: true } ) );
        } );

        expect( counts.SpecTag ).toBeGreaterThan( 0 );
        expect( counts.Roster ).toBe( 0 );
        expect( send ).toHaveBeenCalledWith( SET_CLASS_MESSAGE, currentShip().id );
    } );

    it( 'starts the run on a bare Enter for the host only', async () => {
        bus.state.phase = PHASE.lobby;
        await mountOverlays();

        await pressEnter();
        expect( send ).toHaveBeenCalledWith( START_MESSAGE );

        send.mockClear();
        bus.state.hostId = 'other';
        await pressEnter();
        expect( send ).not.toHaveBeenCalledWith( START_MESSAGE );
    } );
} );
