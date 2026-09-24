import { DEFAULT_TUNING, type FlightTuning, TRACK_CONTRACT } from '../constants.js';
import { type Anchor, SEG_LEN, type Segment, type Track } from '../sim/space.js';
import { resolveTrack, type TrackDescriptor } from '../sim/track-provider.js';
import { analyzeArms, type PacingArms } from './arms.js';
import { measureDemand, type PacingDemand } from './demand.js';
import { buildGrid, freezeTrack, type PacingGrid } from './grid.js';
import { type PacingIntent, procgenIntent } from './intent.js';
import { airDistance, measureGaps, type PacingGap } from './jump-window.js';
import { type PacingPocket, rosterPockets } from './pockets.js';
import { type ReferencePath, referencePath } from './reference-path.js';
import { analyzeRoutes, type PacingRoutes } from './route-graph.js';
import { intentLine, type PacingScore, type ScoreAdherence, scoreAdherence, transcribe } from './score.js';

export const PACING_JUMP_SOURCE = 'DEFAULT_JUMP';

export interface PacingJump {
    source: string;
    single: number;
    double: number;
}

export interface PacingOptions {
    routes?: boolean;
    pockets?: boolean;
    arms?: boolean;
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
    routes: PacingRoutes | null;
    arms: PacingArms | null;
    pockets: PacingPocket[] | null;
    score: PacingScore;
    intent: PacingIntent | null;
    line: PacingScore | null;
    adherence: ScoreAdherence | null;
}

type TrackReport = Omit< PacingReport, 'intent' | 'line' | 'adherence' >;

export function analyzeTrack(
    source: Track,
    tuning: FlightTuning = DEFAULT_TUNING,
    options: PacingOptions = {},
): TrackReport {
    const cruise = TRACK_CONTRACT.pacingCruise;
    const frozen = freezeTrack( source );
    const grid = buildGrid( frozen );
    const jump = {
        source: PACING_JUMP_SOURCE,
        single: airDistance( tuning, 'single' ),
        double: airDistance( tuning, 'double' ),
    };
    const path = referencePath( grid, cruise, jump.double );
    const wantArms = options.arms === true;
    const routes =
        options.routes === true || wantArms ? analyzeRoutes( frozen, grid, jump.double, path.maxStep ) : null;
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
        routes,
        arms: wantArms && routes !== null ? analyzeArms( frozen, grid, routes, path, tuning, cruise ) : null,
        pockets: options.pockets === true ? rosterPockets( frozen ) : null,
        score: transcribe( path, frozen.segments, jump.single ),
    };
}

export function analyzeDescriptor( d: TrackDescriptor, options: PacingOptions = {} ): PacingReport {
    const report = analyzeTrack( resolveTrack( d ), DEFAULT_TUNING, options );
    const intent = d.kind === 'procgen' ? procgenIntent( d, report.segments ) : null;
    const line =
        intent === null
            ? null
            : transcribe(
                  intentLine( intent, report.segments, report.grid.count ),
                  report.segments,
                  report.jump.single,
                  SEG_LEN,
              );
    const adherence = line === null ? null : scoreAdherence( line.notes, report.score.notes );
    return { ...report, intent, line, adherence };
}
