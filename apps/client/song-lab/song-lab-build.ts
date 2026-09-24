import { emitScore, formatNotes, type ShipClassId, segmentsTrack } from '@slur/shared';
import { type LabVariant, trackDigest } from './bundle.ts';
import { songClock } from './map.ts';
import { trackHoles } from './pilot.ts';
import { recordRun } from './record.ts';
import { intensityOf, type LabSongAnalysis, type VariantSpec } from './variants.ts';

export function buildVariant(
    spec: VariantSpec,
    a: LabSongAnalysis,
    seed: number,
    classes: readonly ShipClassId[],
): LabVariant {
    const c = songClock( a );
    const { build, score, motifs } = spec.make( a, c, seed );
    const emitted = emitScore( score );
    const track = segmentsTrack( emitted.segments, score.length );
    const course = { spans: emitted.spans, holes: trackHoles( track, score.length ) };
    const phrases = new Map< number, string[] >();
    for ( const n of score.notes )
        phrases.set( n.phrase, [ ...( phrases.get( n.phrase ) ?? [] ), formatNotes( [ n ] ) ] );
    return {
        id: spec.id,
        label: spec.label,
        rules: spec.rules,
        build,
        motifs,
        score,
        scoreString: formatNotes( score.notes ),
        phraseStrings: [ ...phrases.values() ].map( ( p ) => p.join( ' ' ) ),
        intensity: intensityOf( score ),
        trackDigest: trackDigest( emitted.segments ),
        runs: classes.map( ( id ) => recordRun( track, course, id ) ),
    };
}
