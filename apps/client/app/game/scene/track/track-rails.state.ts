import type { Track } from '@slur/shared';
import { buildRailRuns, type RailRun } from './track-rails';

export interface TrackRails {
    track: Track;
    runs: RailRun[];
    segments: number;
}

let live: TrackRails | null = null;

export function trackRails( track: Track, segments: number ): TrackRails {
    if ( live?.track === track && live.segments === segments ) return live;
    live = { track, runs: buildRailRuns( track, segments ), segments };
    return live;
}
