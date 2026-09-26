import { segmentOf } from '../groove/groove-track.js';
import type { GrooveObstacle } from '../groove/islands.js';
import { placePickups } from '../pickup-place.js';
import { segmentsTrack } from '../score/emit.js';
import { type Anchor, type Segment, TRACK_GEN_SEGMENTS, type Track } from '../space.js';
import { emitMotif, type PlacedNote, placeMotif } from './motif-emit.js';
import { type PhrasePlan, planPhrases } from './plan.js';
import { emitWeave } from './weave-emit.js';

export interface PhraseBuild {
    plan: PhrasePlan;
    notes: PlacedNote[];
    obstacles: GrooveObstacle[];
    segments: Segment[];
    anchors: Anchor[];
}

function phraseObstacles( plan: PhrasePlan ): { notes: PlacedNote[]; obstacles: GrooveObstacle[] } {
    const notes: PlacedNote[] = [];
    const obstacles: GrooveObstacle[] = [];
    plan.phrases.forEach( ( p, k ) => {
        if ( p.weave !== null ) {
            obstacles.push( ...emitWeave( p.weave, p.z0, p.z1, notes.length + k ) );
            return;
        }
        if ( p.notes === null ) return;
        const placed = placeMotif( p.notes, p.z0, p.x0, k ).filter( ( n ) => n.z < p.z1 );
        const emitted = emitMotif( placed, p.z1, notes.length + k ).filter( ( o ) => o.z1 <= p.z1 );
        notes.push( ...placed );
        obstacles.push( ...emitted );
    } );
    return { notes, obstacles };
}

export function buildPhrase( seed: number, length: number = TRACK_GEN_SEGMENTS.phrase ): PhraseBuild {
    const plan = planPhrases( seed, length );
    const { notes, obstacles } = phraseObstacles( plan );
    obstacles.sort( ( a, b ) => a.z0 - b.z0 || a.x0 - b.x0 );
    const segments = Array.from( { length }, ( _, i ) => segmentOf( i, obstacles ) );
    const anchors = placePickups( seed, length, ( i ) => segments[ i ] );
    return { plan, notes, obstacles, segments, anchors };
}

export function phraseTrack( seed: number, length: number = TRACK_GEN_SEGMENTS.phrase ): Track {
    const { segments, anchors } = buildPhrase( seed, length );
    return { ...segmentsTrack( segments, length ), anchors };
}
