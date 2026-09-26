import { segmentOf } from '../groove/groove-track.js';
import { type GrooveObstacle, placeObstacles } from '../groove/islands.js';
import type { GrooveLine } from '../groove/line.js';
import { placePickups } from '../pickup-place.js';
import { segmentsTrack } from '../score/emit.js';
import { type Anchor, type Segment, TRACK_GEN_SEGMENTS, type Track } from '../space.js';
import { composePhraseLine } from './line.js';
import { emitMotif, type PlacedNote, placeMotif } from './motif-emit.js';
import { type PhrasePlan, planPhrases } from './plan.js';

export interface PhraseBuild {
    plan: PhrasePlan;
    line: GrooveLine;
    notes: PlacedNote[];
    obstacles: GrooveObstacle[];
    segments: Segment[];
    anchors: Anchor[];
}

function motifObstacles( plan: PhrasePlan, event0: number ): { notes: PlacedNote[]; obstacles: GrooveObstacle[] } {
    const notes: PlacedNote[] = [];
    const obstacles: GrooveObstacle[] = [];
    plan.phrases.forEach( ( p, k ) => {
        if ( p.notes === null ) return;
        const placed = placeMotif( p.notes, p.z0, p.x0, k ).filter( ( n ) => n.z < p.z1 );
        const emitted = emitMotif( placed, p.z1, event0 + notes.length ).filter( ( o ) => o.z1 <= p.z1 );
        notes.push( ...placed );
        obstacles.push( ...emitted );
    } );
    return { notes, obstacles };
}

export function buildPhrase( seed: number, length: number = TRACK_GEN_SEGMENTS.phrase ): PhraseBuild {
    const plan = planPhrases( seed, length );
    const line = composePhraseLine( seed, plan );
    const motif = motifObstacles( plan, line.events.length );
    const obstacles = [ ...placeObstacles( line ), ...motif.obstacles ].sort( ( a, b ) => a.z0 - b.z0 || a.x0 - b.x0 );
    const segments = Array.from( { length }, ( _, i ) => segmentOf( i, obstacles ) );
    const anchors = placePickups( seed, length, ( i ) => segments[ i ] );
    return { plan, line, notes: motif.notes, obstacles, segments, anchors };
}

export function phraseTrack( seed: number, length: number = TRACK_GEN_SEGMENTS.phrase ): Track {
    const { segments, anchors } = buildPhrase( seed, length );
    return { ...segmentsTrack( segments, length ), anchors };
}
