import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { PHASE, type RunState } from '@slur/shared';
import { useEffect, useState } from 'react';

export interface PlayerView {
    id: string;
    name: string;
    colorId: number;
    shipId: string;
    spectating: boolean;
    finished: boolean;
    finishTime: number;
    connected: boolean;
    z: number;
}

export interface RunView {
    phase: number;
    countdown: number;
    elapsed: number;
    finishDeadline: number;
    hostId: string;
    selfId: string;
    players: PlayerView[];
}

function readView( room: Room< RunState > ): RunView {
    const s = room.state;
    const players: PlayerView[] = [];
    s.players.forEach( ( p, id ) => {
        players.push( {
            id,
            name: p.name,
            colorId: p.colorId,
            shipId: p.shipId,
            spectating: p.spectating,
            finished: p.finished,
            finishTime: p.finishTime,
            connected: p.connected,
            z: p.z,
        } );
    } );
    return {
        phase: s.phase,
        countdown: s.countdown,
        elapsed: s.elapsed,
        finishDeadline: s.finishDeadline,
        hostId: s.hostId,
        selfId: room.sessionId,
        players,
    };
}

export function useRunPhase( room: Room< RunState > ): number {
    const [ phase, setPhase ] = useState< number >( PHASE.lobby );

    // JUSTIFIED EFFECT — same external system, same reasoning as useRunView below: Colyseus schema callbacks
    useEffect( () => {
        const $ = getStateCallbacks( room );
        return $( room.state ).listen( 'phase', ( value ) => setPhase( value ) );
    }, [ room ] );

    return phase;
}

export function useRunView( room: Room< RunState > ): RunView {
    const [ view, setView ] = useState< RunView >( () => ( {
        phase: PHASE.lobby,
        countdown: 0,
        elapsed: 0,
        finishDeadline: 0,
        hostId: '',
        selfId: room.sessionId,
        players: [],
    } ) );

    // JUSTIFIED EFFECT — syncs with an external system: the Colyseus room's schema callbacks (NOT React-reactive).
    useEffect( () => {
        const $ = getStateCallbacks( room );
        const offs: Array< () => void > = [];
        const rebuild = () => setView( readView( room ) );

        offs.push( $( room.state ).listen( 'phase', rebuild ) );
        offs.push( $( room.state ).listen( 'countdown', rebuild ) );
        offs.push( $( room.state ).listen( 'elapsed', rebuild ) );
        offs.push( $( room.state ).listen( 'finishDeadline', rebuild ) );
        offs.push( $( room.state ).listen( 'hostId', rebuild ) );

        const perPlayer = new Map< string, () => void >();
        offs.push(
            $( room.state ).players.onAdd( ( p, sid ) => {
                perPlayer.set( sid, $( p ).onChange( rebuild ) );
                rebuild();
            } ),
        );
        offs.push(
            $( room.state ).players.onRemove( ( _p, sid ) => {
                perPlayer.get( sid )?.();
                perPlayer.delete( sid );
                rebuild();
            } ),
        );

        rebuild();
        return () => {
            for ( const off of offs ) off();
            for ( const off of perPlayer.values() ) off();
        };
    }, [ room ] );

    return view;
}
