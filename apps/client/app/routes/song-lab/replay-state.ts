import { type FlightTuning, type PlayerInput, SEG_LEN, type ShipClassId, START_SAFE } from '@slur/shared';
import {
    classTuning,
    expandInputs,
    type LabResult,
    type LabRun,
    type LabTally,
    newTally,
} from '../../../song-lab/bundle';
import { createStore } from '../tapper/external-store';

export const SPEEDS = [ 0.25, 0.5, 1, 2, 4, 8 ];

export interface LiveReplay {
    inputs: PlayerInput[];
    tuning: FlightTuning;
    tally: LabTally;
    generation: number;
    songZ: number;
    crossTick: number | null;
}

export interface ReplayView {
    playing: boolean;
    speed: number;
    replayed: LabResult | null;
}

export const replay: LiveReplay = {
    inputs: [],
    tuning: classTuning( 'fighter' ),
    tally: newTally(),
    generation: 0,
    songZ: START_SAFE * SEG_LEN,
    crossTick: null,
};

export const replayView = createStore< ReplayView >( { playing: true, speed: 1, replayed: null } );

export function replayLive(): boolean {
    return ! replay.tally.done && replay.tally.ticks < replay.inputs.length;
}

export function loadReplay( classId: ShipClassId, run: LabRun | undefined, songZ: number ): void {
    replay.inputs = run ? expandInputs( run.inputs ) : [];
    replay.tuning = classTuning( classId );
    replay.songZ = songZ;
    restartReplay();
}

export function crossingTick( ticksAfter: number, zBefore: number, zAfter: number, songZ: number ): number | null {
    if ( zAfter < songZ ) return null;
    const frac = zAfter > zBefore ? ( songZ - zBefore ) / ( zAfter - zBefore ) : 0;
    return ticksAfter - 1 + Math.min( 1, Math.max( 0, frac ) );
}

export function restartReplay(): void {
    replay.tally = newTally();
    replay.crossTick = null;
    replay.generation++;
    replayView.set( { ...replayView.get(), replayed: null } );
}

export function endReplay( result: LabResult ): void {
    replayView.set( { ...replayView.get(), replayed: result } );
}

export function togglePlay(): void {
    const v = replayView.get();
    replayView.set( { ...v, playing: ! v.playing } );
}

export function setSpeed( speed: number ): void {
    replayView.set( { ...replayView.get(), speed } );
}

export function stepSpeed( dir: 1 | -1 ): void {
    const i = SPEEDS.indexOf( replayView.get().speed ) + dir;
    setSpeed( SPEEDS[ Math.max( 0, Math.min( SPEEDS.length - 1, i ) ) ] );
}
