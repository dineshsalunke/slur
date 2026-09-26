import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { computeStandings, PHASE, type RunState, type Standing, type StandingInput } from '@slur/shared';
import { useSyncExternalStore } from 'react';

export interface PlayerView {
    id: string;
    name: string;
    colorId: number;
    shipId: string;
    spectating: boolean;
    connected: boolean;
}

export interface RunSnapshot {
    phase: number;
    countdown: number;
    hostId: string;
    players: readonly PlayerView[];
    standings: readonly Standing[];
}

export interface RunViewStore {
    subscribe( listener: () => void ): () => void;
    snapshot(): RunSnapshot;
}

export const EMPTY_RUN: RunSnapshot = {
    phase: PHASE.lobby,
    countdown: 0,
    hostId: '',
    players: [],
    standings: [],
};

function playerKey( p: PlayerView ): string {
    return `${ p.id }:${ p.name }:${ p.colorId }:${ p.shipId }:${ p.spectating }:${ p.connected }`;
}

function standingKey( s: Standing ): string {
    return `${ s.id }:${ s.rank }:${ s.finished }:${ s.finishTime }:${ s.name }:${ s.colorId }:${ s.shipId }`;
}

function keep< T >( prev: readonly T[], next: T[], key: ( v: T ) => string ): readonly T[] {
    if ( prev.length !== next.length ) return next;
    return prev.every( ( v, i ) => key( v ) === key( next[ i ] ) ) ? prev : next;
}

export function readRun( room: Room< RunState >, prev: RunSnapshot ): RunSnapshot {
    const s = room.state;
    const players: PlayerView[] = [];
    const racers: StandingInput[] = [];
    s.players.forEach( ( p, id ) => {
        players.push( {
            id,
            name: p.name,
            colorId: p.colorId,
            shipId: p.shipId,
            spectating: p.spectating,
            connected: p.connected,
        } );
        racers.push( {
            id,
            name: p.name,
            colorId: p.colorId,
            shipId: p.shipId,
            spectating: p.spectating,
            finished: p.finished,
            finishTime: p.finishTime,
            z: p.z,
        } );
    } );
    const next: RunSnapshot = {
        phase: s.phase,
        countdown: Math.ceil( s.countdown ),
        hostId: s.hostId,
        players: keep( prev.players, players, playerKey ),
        standings: keep( prev.standings, computeStandings( racers ), standingKey ),
    };
    const same =
        next.phase === prev.phase &&
        next.countdown === prev.countdown &&
        next.hostId === prev.hostId &&
        next.players === prev.players &&
        next.standings === prev.standings;
    return same ? prev : next;
}

function createStore( room: Room< RunState > ): RunViewStore {
    const listeners = new Set< () => void >();
    let current = EMPTY_RUN;
    let detach: ( () => void ) | null = null;

    const recompute = (): boolean => {
        const next = readRun( room, current );
        if ( next === current ) return false;
        current = next;
        return true;
    };

    const refresh = () => {
        if ( ! recompute() ) return;
        for ( const listener of listeners ) listener();
    };

    const attach = () => {
        const $ = getStateCallbacks( room );
        const offs = [
            $( room.state ).listen( 'phase', refresh ),
            $( room.state ).listen( 'countdown', refresh ),
            $( room.state ).listen( 'hostId', refresh ),
        ];
        const perPlayer = new Map< string, () => void >();
        offs.push(
            $( room.state ).players.onAdd( ( p, sid ) => {
                perPlayer.set( sid, $( p ).onChange( refresh ) );
                refresh();
            } ),
            $( room.state ).players.onRemove( ( _p, sid ) => {
                perPlayer.get( sid )?.();
                perPlayer.delete( sid );
                refresh();
            } ),
        );
        return () => {
            for ( const off of offs ) off();
            for ( const off of perPlayer.values() ) off();
        };
    };

    return {
        subscribe( listener ) {
            listeners.add( listener );
            detach ??= attach();
            return () => {
                listeners.delete( listener );
                if ( listeners.size > 0 ) return;
                detach?.();
                detach = null;
            };
        },
        snapshot() {
            if ( ! detach ) recompute();
            return current;
        },
    };
}

const stores = new WeakMap< Room< RunState >, RunViewStore >();

export function runViewStore( room: Room< RunState > ): RunViewStore {
    let store = stores.get( room );
    if ( ! store ) {
        store = createStore( room );
        stores.set( room, store );
    }
    return store;
}

function useRunField< K extends keyof RunSnapshot >( room: Room< RunState >, key: K ): RunSnapshot[ K ] {
    const store = runViewStore( room );
    const read = () => store.snapshot()[ key ];
    return useSyncExternalStore( store.subscribe, read, read );
}

export function useRunPhase( room: Room< RunState > ): number {
    return useRunField( room, 'phase' );
}

export function useCountdown( room: Room< RunState > ): number {
    return useRunField( room, 'countdown' );
}

export function useHostId( room: Room< RunState > ): string {
    return useRunField( room, 'hostId' );
}

export function useRunPlayers( room: Room< RunState > ): readonly PlayerView[] {
    return useRunField( room, 'players' );
}

export function useRunStandings( room: Room< RunState > ): readonly Standing[] {
    return useRunField( room, 'standings' );
}
