import type { Track } from '@slur/shared';
import type * as THREE from 'three';
import { buildRailMask } from './rail-glow';
import { buildRailRuns, type RailRun } from './track-rails';

export interface TrackRails {
    track: Track;
    runs: RailRun[];
    segments: number;
    mask: THREE.DataTexture;
}

let live: TrackRails | null = null;

export function trackRails( track: Track, segments: number ): TrackRails {
    if ( live?.track === track && live.segments === segments ) return live;
    live?.mask.dispose();
    const runs = buildRailRuns( track, segments );
    live = { track, runs, segments, mask: buildRailMask( runs, segments ) };
    return live;
}
