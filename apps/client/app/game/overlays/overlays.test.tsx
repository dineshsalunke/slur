// @vitest-environment jsdom

import { PHASE } from '@slur/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomProvider } from '../../net/room-context';
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

const counts = vi.hoisted( () => ( { LeaveGuard: 0, RaceHud: 0 } ) );

vi.mock( './leave-guard', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./leave-guard') >();
    return {
        LeaveGuard: ( props: Parameters< typeof actual.LeaveGuard >[ 0 ] ) => {
            counts.LeaveGuard += 1;
            return actual.LeaveGuard( props );
        },
    };
} );

vi.mock( './race-hud', async ( importOriginal ) => {
    const actual = await importOriginal< typeof import('./race-hud') >();
    return {
        RaceHud: ( props: Parameters< typeof actual.RaceHud >[ 0 ] ) => {
            counts.RaceHud += 1;
            return actual.RaceHud( props );
        },
    };
} );

const room = { sessionId: 'self', state: bus.state } as never;

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
    counts.RaceHud = 0;
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
    it( 'lets an elapsed patch reach RaceHud without re-rendering LeaveGuard', async () => {
        await mountOverlays();
        counts.LeaveGuard = 0;
        counts.RaceHud = 0;

        await act( async () => {
            bus.emitRoot( 'elapsed', 1.5 );
        } );

        expect( counts.RaceHud ).toBeGreaterThan( 0 );
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

    it( 'lets a per-player patch reach RaceHud without re-rendering LeaveGuard', async () => {
        await mountOverlays();
        counts.LeaveGuard = 0;
        counts.RaceHud = 0;

        await act( async () => {
            bus.emitPlayerChange();
        } );

        expect( counts.RaceHud ).toBeGreaterThan( 0 );
        expect( counts.LeaveGuard ).toBe( 0 );
    } );
} );
