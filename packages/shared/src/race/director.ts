import { COLOR_COUNT, MAX_RACE_SECONDS, START_STAGGER_U } from '../constants.js';
import { copySimShip, type SimShip, spawnShip } from '../sim/types.js';

export const PHASE = { lobby: 0, countdown: 1, racing: 2, finished: 3 } as const;

export const START_MESSAGE = 'start';
export const RESTART_MESSAGE = 'restart';
export const SET_COLOR_MESSAGE = 'setColor';

export function isColorId( n: unknown ): n is number {
    return typeof n === 'number' && Number.isInteger( n ) && n >= 0 && n < COLOR_COUNT;
}

export function shouldSpectateOnJoin( phase: number ): boolean {
    return phase >= PHASE.racing;
}

export interface RunMetadata {
    hostName: string;
    phase: number;
}

type RacerState = SimShip & { finishTime: number };

export function startGridX( seat: number ): number {
    if ( seat === 0 ) return 0;
    const rank = Math.ceil( seat / 2 );
    return seat % 2 === 1 ? rank * START_STAGGER_U : -rank * START_STAGGER_U;
}

export function resetPlayerForRace( p: RacerState, seat: number ): void {
    copySimShip( p, spawnShip( startGridX( seat ), 0 ) );
    p.finishTime = 0;
}

export interface StandingInput {
    id: string;
    name: string;
    colorId: number;
    shipId: string;
    spectating: boolean;
    finished: boolean;
    finishTime: number;
    z: number;
}

export interface Standing extends StandingInput {
    rank: number;
    dnf: boolean;
}

export function computeStandings( players: Iterable< StandingInput > ): Standing[] {
    const racers = [ ...players ].filter( ( p ) => ! p.spectating );
    racers.sort( ( a, b ) => {
        if ( a.finished !== b.finished ) return a.finished ? -1 : 1;
        if ( a.finished && b.finished ) return a.finishTime - b.finishTime;
        return b.z - a.z;
    } );
    return racers.map( ( p, i ) => ( { ...p, rank: i + 1, dnf: ! p.finished } ) );
}

export interface RaceEndInput {
    elapsed: number;
    finishDeadline: number;
    racerCount: number;
    finishedCount: number;
}

export function raceShouldEnd( i: RaceEndInput ): boolean {
    if ( i.racerCount === 0 ) return true;
    if ( i.finishedCount >= i.racerCount ) return true;
    if ( i.finishDeadline > 0 && i.elapsed >= i.finishDeadline ) return true;
    if ( i.elapsed >= MAX_RACE_SECONDS ) return true;
    return false;
}
