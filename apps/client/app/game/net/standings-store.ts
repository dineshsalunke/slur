import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { computeStandings, type RunState, type StandingInput } from '@slur/shared';
import { useSyncExternalStore } from 'react';
import type { RosterEntry } from '../hud/roster-panel';

export const ROSTER_WINDOW = 5;

export interface RacerInput extends StandingInput {
    connected: boolean;
}

export interface StandingsSnapshot {
    connected: number;
    field: number;
    rank: number;
    selfSpectating: boolean;
    entries: readonly RosterEntry[];
}

export interface StandingsStore {
    subscribe( listener: () => void ): () => void;
    snapshot(): StandingsSnapshot;
}

export function rosterWindow< T >( rows: readonly T[], centre: number, size = ROSTER_WINDOW ): T[] {
    const start = Math.max( 0, Math.min( centre - Math.floor( size / 2 ), rows.length - size ) );
    return rows.slice( start, start + size );
}

export function readStandings( players: readonly RacerInput[], selfId: string ): StandingsSnapshot {
    const standings = computeStandings( players );
    const selfIndex = standings.findIndex( ( s ) => s.id === selfId );
    return {
        connected: players.filter( ( p ) => p.connected ).length,
        field: standings.length,
        rank: selfIndex + 1,
        selfSpectating: players.find( ( p ) => p.id === selfId )?.spectating ?? false,
        entries: rosterWindow( standings, selfIndex ).map( ( s ) => ( {
            id: s.id,
            rank: s.rank,
            name: s.name || 'Racer',
            self: s.id === selfId,
        } ) ),
    };
}

export function standingsKey( s: StandingsSnapshot ): string {
    const rows = s.entries.map( ( e ) => `${ e.rank }:${ e.id }:${ e.name }` ).join( '|' );
    return `${ s.connected }/${ s.field }/${ s.rank }/${ s.selfSpectating }/${ rows }`;
}

function racersOf( room: Room< RunState > ): RacerInput[] {
    const racers: RacerInput[] = [];
    room.state.players.forEach( ( p, id ) => {
        racers.push( {
            id,
            name: p.name,
            colorId: p.colorId,
            shipId: p.shipId,
            spectating: p.spectating,
            finished: p.finished,
            finishTime: p.finishTime,
            z: p.z,
            connected: p.connected,
        } );
    } );
    return racers;
}

function createStore( room: Room< RunState > ): StandingsStore {
    const listeners = new Set< () => void >();
    let current = readStandings( [], room.sessionId );
    let key = standingsKey( current );
    let detach: ( () => void ) | null = null;

    const recompute = (): boolean => {
        const next = readStandings( racersOf( room ), room.sessionId );
        const nextKey = standingsKey( next );
        if ( nextKey === key ) return false;
        key = nextKey;
        current = next;
        return true;
    };

    const refresh = () => {
        if ( ! recompute() ) return;
        for ( const listener of listeners ) listener();
    };

    const attach = () => {
        const $ = getStateCallbacks( room );
        const perPlayer = new Map< string, () => void >();
        const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
            perPlayer.set( sid, $( p ).onChange( refresh ) );
            refresh();
        } );
        const offRemove = $( room.state ).players.onRemove( ( _p, sid ) => {
            perPlayer.get( sid )?.();
            perPlayer.delete( sid );
            refresh();
        } );
        return () => {
            offAdd();
            offRemove();
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

const stores = new WeakMap< Room< RunState >, StandingsStore >();

export function standingsStore( room: Room< RunState > ): StandingsStore {
    let store = stores.get( room );
    if ( ! store ) {
        store = createStore( room );
        stores.set( room, store );
    }
    return store;
}

export function useStandings( room: Room< RunState > ): StandingsSnapshot {
    const store = standingsStore( room );
    return useSyncExternalStore( store.subscribe, store.snapshot, store.snapshot );
}

export function useSelfSpectating( room: Room< RunState > ): boolean {
    const store = standingsStore( room );
    const spectating = () => store.snapshot().selfSpectating;
    return useSyncExternalStore( store.subscribe, spectating, spectating );
}
