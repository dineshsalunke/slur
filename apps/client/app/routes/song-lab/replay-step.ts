import {
    DEFAULT_SIM_CONFIG,
    type FlightTuning,
    type PlayerInput,
    type SimShip,
    type SimWorld,
    simulate,
    type Track,
} from '@slur/shared';
import type { LabResult } from './lab-bundle';

export interface Replay {
    inputs: readonly PlayerInput[];
    frame: number;
    deaths: number;
    wasDead: boolean;
    finishFrame: number;
    generation: number;
}

export function createReplay(): Replay {
    return { inputs: [], frame: 0, deaths: 0, wasDead: false, finishFrame: -1, generation: 0 };
}

export function rewindReplay( r: Replay ): void {
    r.frame = 0;
    r.deaths = 0;
    r.wasDead = false;
    r.finishFrame = -1;
    r.generation++;
}

export function replayLive( r: Replay ): boolean {
    return r.frame < r.inputs.length && r.finishFrame < 0;
}

export function stepReplay( r: Replay, s: SimShip, dt: number, t: FlightTuning, track: Track, world: SimWorld ): void {
    if ( ! replayLive( r ) ) return;
    simulate( s, r.inputs[ r.frame ], dt, t, track, DEFAULT_SIM_CONFIG, world );
    r.frame++;
    if ( s.dead && ! r.wasDead ) r.deaths++;
    r.wasDead = s.dead;
    if ( s.finished ) r.finishFrame = r.frame;
}

export function replayResult( r: Replay ): LabResult {
    const finished = r.finishFrame >= 0;
    return { finished, frames: finished ? r.finishFrame : r.frame, deaths: r.deaths };
}

export function sameResult( a: LabResult, b: LabResult ): boolean {
    return a.finished === b.finished && a.frames === b.frames && a.deaths === b.deaths;
}
