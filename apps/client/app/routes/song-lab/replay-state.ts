import type { PlayerInput } from '@slur/shared';
import { createStore } from '../tapper/external-store';
import type { LabResult } from './lab-bundle';
import { createReplay, rewindReplay } from './replay-step';

export const SPEEDS = [ 0.25, 0.5, 1, 2, 4, 8 ];

export interface ReplayView {
    playing: boolean;
    speed: number;
    replayed: LabResult | null;
}

export const replay = createReplay();

export const replayView = createStore< ReplayView >( { playing: true, speed: 1, replayed: null } );

export function loadReplay( inputs: readonly PlayerInput[] ): void {
    replay.inputs = inputs;
    restartReplay();
}

export function restartReplay(): void {
    rewindReplay( replay );
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
