import type { FlightTuning, PlayerInput, ShipClassId } from '@slur/shared';
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
};

export const replayView = createStore< ReplayView >( { playing: true, speed: 1, replayed: null } );

export function replayLive(): boolean {
    return ! replay.tally.done && replay.tally.ticks < replay.inputs.length;
}

export function loadReplay( classId: ShipClassId, run: LabRun | undefined ): void {
    replay.inputs = run ? expandInputs( run.inputs ) : [];
    replay.tuning = classTuning( classId );
    restartReplay();
}

export function restartReplay(): void {
    replay.tally = newTally();
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
