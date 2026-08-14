// @vitest-environment jsdom

import { PHASE } from '@slur/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomProvider } from '../../net/room-context';
import { Overlays } from './overlays';

// Regression guard for #91. <Overlays> used to hold the ONLY run-state subscription and prop-drill the
// snapshot to every sibling, so a patch re-rendered LeaveGuard / LeaveButton / HeldPowerChip / ThreatHud for
// data none of them reads. It now subscribes to `phase` alone and each phase panel owns its own subscription.
//
// This pins the outcome the browser census measured: an `elapsed` patch reaches RaceHud and nothing else.
//
// NOTE ON THE 0: "LeaveGuard rendered 0 times" is only evidence if LeaveGuard *can* render in this harness.
// A broken fake, a mock that never mounts, or a component that is inert here would all produce the same 0
// for the wrong reason. So the second test drives a PHASE change and asserts LeaveGuard DOES re-render on
// the same rig — the counter is proven live before the 0 is allowed to mean anything.

// A hand-driven stand-in for the Colyseus callbacks API. The real one needs an encoder/decoder pair pumping
// bytes; what is under test is purely WHICH component registers WHICH subscription, so a controllable bus is
// the honest instrument. `listen` fires immediately with the current value, matching the real API.
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
        heldPower: number;
    }
    const state = {
        phase: PHASE_RACING(),
        countdown: 0,
        elapsed: 0,
        finishDeadline: 0,
        hostId: 'self',
        players: new Map< string, Player >(),
    } as Record< string, unknown > & { players: Map< string, Player > };
    // PHASE is not importable inside a hoisted factory, so mirror the one value we need (2 = racing).
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
        // Drive a root-field patch the way the wire would.
        emitRoot( prop: string, value: unknown ) {
            state[ prop ] = value;
            for ( const cb of rootListeners.get( prop ) ?? [] ) cb( value );
        },
        // Drive a per-player patch (this is what carries `z` at patch rate during a race).
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
    // client.ts constructs one at module load (reachable via LeaveButton → matchmaking → client).
    Client: class {},
    getStateCallbacks: () => ( target: unknown ) => {
        if ( target === bus.state ) {
            return {
                listen: ( prop: string, cb: ( v: unknown ) => void ) => {
                    const off = bus.listen( bus.rootListeners, prop, cb );
                    cb( bus.state[ prop ] ); // real `listen` fires immediately
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

// Count renders of the REAL components by calling through — the automated equivalent of the console probe
// used for the browser census. Calling the original as a function (rather than as a nested element) keeps its
// hooks in this component's slot, so a re-render driven by its OWN subscription still increments the count.
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
        heldPower: 0,
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

        expect( counts.RaceHud ).toBeGreaterThan( 0 ); // the panel that reads the clock still updates
        expect( counts.LeaveGuard ).toBe( 0 ); // the sibling that never reads it is untouched
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

        // `players` carries `z`, which simulate() moves every tick — the field that actually drives the
        // in-race churn, and the reason splitting the clock out alone measured as a no-op.
        await act( async () => {
            bus.emitPlayerChange();
        } );

        expect( counts.RaceHud ).toBeGreaterThan( 0 );
        expect( counts.LeaveGuard ).toBe( 0 );
    } );
} );
