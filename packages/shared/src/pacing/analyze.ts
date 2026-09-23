import { DEFAULT_TUNING, type FlightTuning, TRACK_CONTRACT } from '../constants.js';
import type { Anchor, Segment, Track } from '../sim/space.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';
import { measureDemand, type PacingDemand } from './demand.js';
import { buildGrid, freezeTrack, type PacingGrid } from './grid.js';
import { type PacingIntent, procgenIntent } from './intent.js';
import { airDistance, measureGaps, type PacingGap } from './jump-window.js';
import { type ReferencePath, referencePath } from './reference-path.js';

export const PACING_JUMP_SOURCE = 'DEFAULT_JUMP';

export interface PacingJump {
    source: string;
    single: number;
    double: number;
}

export interface PacingReport {
    length: number;
    finishZ: number;
    cruise: number;
    duration: number;
    segments: Segment[];
    anchors: Anchor[];
    grid: PacingGrid;
    path: ReferencePath;
    demand: PacingDemand;
    gaps: PacingGap[];
    jump: PacingJump;
    intent: PacingIntent | null;
}

export function analyzeTrack( source: Track, tuning: FlightTuning = DEFAULT_TUNING ): Omit< PacingReport, 'intent' > {
    const cruise = TRACK_CONTRACT.pacingCruise;
    const frozen = freezeTrack( source );
    const grid = buildGrid( frozen );
    const jump = {
        source: PACING_JUMP_SOURCE,
        single: airDistance( tuning, 'single' ),
        double: airDistance( tuning, 'double' ),
    };
    const path = referencePath( grid, cruise, jump.double );
    return {
        length: frozen.length,
        finishZ: source.finishZ,
        cruise,
        duration: source.finishZ / cruise,
        segments: frozen.segments,
        anchors: source.anchors,
        grid,
        path,
        demand: measureDemand( path, cruise ),
        gaps: measureGaps( frozen, grid, path, tuning ),
        jump,
    };
}

export function analyzeDescriptor( d: TrackDescriptor ): PacingReport {
    const report = analyzeTrack( resolveTrack( d ) );
    const intent = d.kind === 'procgen' ? procgenIntent( d, report.segments ) : null;
    return { ...report, intent };
}
