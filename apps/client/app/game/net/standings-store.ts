import { computeStandings, isStalled, type StandingInput } from '@slur/shared';
import { useSyncExternalStore } from 'react';
import type { RunRoomLike } from '../../net/run-room-like';
import { stateCallbacks } from '../../net/state-callbacks';
import type { RosterEntry } from '../hud/roster-panel';

export const ROSTER_WINDOW = 5;

export interface RacerInput extends StandingInput {
    connected: boolean;
    progressAt: number;
}

export interface StandingsSnapshot {
    connected: number;
    field: number;
    rank: number;
    selfSpectating: boolean;
    selfFinished: boolean;
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

export function readStandings(
    players: readonly RacerInput[],
    selfId: string,
    elapsed = 0,
    stallRule = false,
): StandingsSnapshot {
    const standings = computeStandings( players );
    const selfIndex = standings.findIndex( ( s ) => s.id === selfId );
    const self = players.find( ( p ) => p.id === selfId );
    const progressAt = new Map( players.map( ( p ) => [ p.id, p.progressAt ] ) );
    return {
        connected: players.filter( ( p ) => p.connected ).length,
        field: standings.length,
        rank: selfIndex + 1,
        selfSpectating: self?.spectating ?? false,
        selfFinished: self?.finished ?? false,
        entries: rosterWindow( standings, selfIndex ).map( ( s ) => ( {
            id: s.id,
            rank: s.rank,
            name: s.name || 'Racer',
            self: s.id === selfId,
            idle: stallRule && ! s.finished && isStalled( elapsed, progressAt.get( s.id ) ?? elapsed ),
        } ) ),
    };
}

export function standingsKey( s: StandingsSnapshot ): string {
    const rows = s.entries.map( ( e ) => `${ e.rank }:${ e.id }:${ e.name }:${ e.idle }` ).join( '|' );
    return `${ s.connected }/${ s.field }/${ s.rank }/${ s.selfSpectating }/${ s.selfFinished }/${ rows }`;
}

function racersOf( room: RunRoomLike ): RacerInput[] {
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
            progressAt: p.progressAt,
        } );
    } );
    return racers;
}

function createStore( room: RunRoomLike ): StandingsStore {
    const listeners = new Set< () => void >();
    let current = readStandings( [], room.sessionId );
    let key = standingsKey( current );
    let detach: ( () => void ) | null = null;

    const recompute = (): boolean => {
        const s = room.state;
        const next = readStandings( racersOf( room ), room.sessionId, s.elapsed, s.raceCap > 0 );
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
        const $ = stateCallbacks( room );
        const perPlayer = new Map< string, () => void >();
        const offElapsed = $( room.state ).listen( 'elapsed', refresh );
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
            offElapsed();
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

const stores = new WeakMap< RunRoomLike, StandingsStore >();

export function standingsStore( room: RunRoomLike ): StandingsStore {
    let store = stores.get( room );
    if ( ! store ) {
        store = createStore( room );
        stores.set( room, store );
    }
    return store;
}

export function useStandings( room: RunRoomLike ): StandingsSnapshot {
    const store = standingsStore( room );
    return useSyncExternalStore( store.subscribe, store.snapshot, store.snapshot );
}

export function useSelfSpectating( room: RunRoomLike ): boolean {
    const store = standingsStore( room );
    const spectating = () => store.snapshot().selfSpectating;
    return useSyncExternalStore( store.subscribe, spectating, spectating );
}

export function useSelfFinished( room: RunRoomLike ): boolean {
    const store = standingsStore( room );
    const finished = () => store.snapshot().selfFinished;
    return useSyncExternalStore( store.subscribe, finished, finished );
}
