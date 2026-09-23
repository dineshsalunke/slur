// @vitest-environment jsdom

import { PHASE, SET_CLASS_MESSAGE, START_MESSAGE } from '@slur/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomProvider } from '../../net/room-context';
import { currentShip } from '../../ship/ship-choice';
import { Overlays } from './overlays';

const bus = vi.hoisted( () => {
    interface Player {
        name: string;
        colorId: number;
        shipId: string;
        spectating: boolean;
        finished: boolean;
        finishTime: number;
        connected: boolean;
        z: number;
    }
    const state = {
        phase: PHASE_RACING(),
        countdown: 0,
        elapsed: 0,
        finishDeadline: 0,
        hostId: 'self',
        players: new Map< string, Player >(),
    } as Record< string, unknown > & { players: Map< string, Player > };
    function PHASE_RACING() {
        return 2;
    }
    const rootListeners = new Map< string, Set< ( v: unknown ) => void > >();
    const playerChange = new Set< () => void >();
    const listen = (
        registry: Map< string, Set< ( v: unknown ) => void > >,
        prop: string,
        cb: ( v: unknown ) => void,
    ) => {
        const set = registry.get( prop ) ?? new Set();
        set.add( cb );
        registry.set( prop, set );
        return () => set.delete( cb );
    };
    return {
        state,
        rootListeners,
        playerChange,
        listen,
        emitRoot( prop: string, value: unknown ) {
            state[ prop ] = value;
            for ( const cb of rootListeners.get( prop ) ?? [] ) cb( value );
        },
        emitPlayerChange() {
            for ( const cb of [ ...playerChange ] ) cb();
        },
        reset() {
            rootListeners.clear();
            playerChange.clear();
            state.phase = 2;
            state.elapsed = 0;
            state.countdown = 0;
            state.hostId = 'self';
            state.players = new Map();
        },
    };
} );

vi.mock( '@colyseus/sdk', () => ( {
    Client: class {},
    getStateCallbacks: () => ( target: unknown ) => {
        if ( target === bus.state ) {
            return {
                listen: ( prop: string, cb: ( v: unknown ) => void ) => {
                    const off = bus.listen( bus.rootListeners, prop, cb );
                    cb( bus.state[ prop ] );
                    return off;
                },
                players: {
                    onAdd: ( cb: ( p: unknown, id: string ) => void ) => {
                        for ( const [ id, p ] of bus.state.players ) cb( p, id );
                        return () => {};
                    },
                    onRemove: () => () => {},
                },
            };
        }
        return {
            onChange: ( cb: () => void ) => {
                bus.playerChange.add( cb );
                return () => bus.playerChange.delete( cb );
            },
            listen: ( prop: string, cb: ( v: unknown ) => void ) => {
                cb( ( target as Record< string, unknown > )[ prop ] );
                return () => {};
            },
        };
    },
} ) );

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

const send = vi.fn();
const room = { sessionId: 'self', state: bus.state, send } as never;

let container: HTMLDivElement;
let root: Root;

async function mountOverlays() {
    const router = createMemoryRouter( [
        {
            path: '/',
            element: (
                <RoomProvider room={ room }>
                    <Overlays />
                </RoomProvider>
            ),
        },
    ] );
    await act( async () => {
        root.render( <RouterProvider router={ router } /> );
    } );
}

beforeEach( () => {
    ( globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean } ).IS_REACT_ACT_ENVIRONMENT = true;
    bus.reset();
    bus.state.players.set( 'self', {
        name: 'Racer',
        colorId: 0,
        shipId: 'executioner',
        spectating: false,
        finished: false,
        finishTime: 0,
        connected: true,
        z: 0,
    } );
    counts.LeaveGuard = 0;
    counts.SpecTag = 0;
    counts.Roster = 0;
    send.mockClear();
    container = document.createElement( 'div' );
    document.body.append( container );
    root = createRoot( container );
} );

afterEach( async () => {
    await act( async () => {
        root.unmount();
    } );
    container.remove();
} );

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
        await mountOverlays();
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
            bus.emitPlayerChange();
        } );

        expect( counts.Roster ).toBeGreaterThan( 0 );
        expect( counts.SpecTag ).toBe( 0 );
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

        await act( async () => {
            document.body.dispatchEvent( new KeyboardEvent( 'keydown', { code: 'Enter', bubbles: true } ) );
        } );
        expect( send ).toHaveBeenCalledWith( START_MESSAGE );

        send.mockClear();
        bus.state.hostId = 'other';
        await act( async () => {
            document.body.dispatchEvent( new KeyboardEvent( 'keydown', { code: 'Enter', bubbles: true } ) );
        } );
        expect( send ).not.toHaveBeenCalledWith( START_MESSAGE );
    } );
} );
