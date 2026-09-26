import { PHASE } from '@slur/shared';
import { vi } from 'vitest';

export interface TestPlayer {
    name: string;
    colorId: number;
    shipId: string;
    spectating: boolean;
    finished: boolean;
    finishTime: number;
    connected: boolean;
    z: number;
}

type Listener = ( v: unknown ) => void;

const state = {
    phase: PHASE.racing,
    countdown: 0,
    elapsed: 0,
    finishDeadline: 0,
    hostId: 'self',
    players: new Map< string, TestPlayer >(),
} as Record< string, unknown > & { players: Map< string, TestPlayer > };

const rootListeners = new Map< string, Set< Listener > >();
const playerChange = new Set< () => void >();

function listenRoot( prop: string, cb: Listener ) {
    const set = rootListeners.get( prop ) ?? new Set();
    set.add( cb );
    rootListeners.set( prop, set );
    return () => set.delete( cb );
}

export const bus = {
    state,
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
        state.phase = PHASE.racing;
        state.elapsed = 0;
        state.countdown = 0;
        state.hostId = 'self';
        state.players = new Map( [
            [
                'self',
                {
                    name: 'Racer',
                    colorId: 0,
                    shipId: 'executioner',
                    spectating: false,
                    finished: false,
                    finishTime: 0,
                    connected: true,
                    z: 0,
                },
            ],
        ] );
    },
};

export const send = vi.fn();

export const room = { sessionId: 'self', state, send } as never;

export const callbacksMock = {
    stateCallbacks: () => ( target: unknown ) => {
        if ( target === state ) {
            return {
                listen: ( prop: string, cb: Listener ) => {
                    const off = listenRoot( prop, cb );
                    cb( state[ prop ] );
                    return off;
                },
                players: {
                    onAdd: ( cb: ( p: unknown, id: string ) => void ) => {
                        for ( const [ id, p ] of state.players ) cb( p, id );
                        return () => {};
                    },
                    onRemove: () => () => {},
                },
            };
        }
        return {
            onChange: ( cb: () => void ) => {
                playerChange.add( cb );
                return () => playerChange.delete( cb );
            },
            listen: ( prop: string, cb: Listener ) => {
                cb( ( target as Record< string, unknown > )[ prop ] );
                return () => {};
            },
        };
    },
};
