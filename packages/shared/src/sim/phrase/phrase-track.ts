import { segmentOf } from '../groove/groove-track.js';
import { type GrooveObstacle, placeObstacles } from '../groove/islands.js';
import type { GrooveLine } from '../groove/line.js';
import { placePickups } from '../pickup-place.js';
import { segmentsTrack } from '../score/emit.js';
import { type Anchor, type Segment, TRACK_GEN_SEGMENTS, type Track } from '../space.js';
import { composePhraseLine } from './line.js';
import { type PhrasePlan, planPhrases } from './plan.js';

export interface PhraseBuild {
    plan: PhrasePlan;
    line: GrooveLine;
    obstacles: GrooveObstacle[];
    segments: Segment[];
    anchors: Anchor[];
}

export function buildPhrase( seed: number, length: number = TRACK_GEN_SEGMENTS.phrase ): PhraseBuild {
    const plan = planPhrases( length );
    const line = composePhraseLine( seed, plan );
    const obstacles = placeObstacles( line );
    const segments = Array.from( { length }, ( _, i ) => segmentOf( i, obstacles ) );
    const anchors = placePickups( seed, length, ( i ) => segments[ i ] );
    return { plan, line, obstacles, segments, anchors };
}

export function phraseTrack( seed: number, length: number = TRACK_GEN_SEGMENTS.phrase ): Track {
    const { segments, anchors } = buildPhrase( seed, length );
    return { ...segmentsTrack( segments, length ), anchors };
}
