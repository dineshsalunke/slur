import { type ComposedNote, formatNotes, type ShipClassId, segmentsTrack } from '@slur/shared';
import { type LabSkill, type LabVariant, labEmitted, trackDigest } from './bundle.ts';
import { humanSeed, pilotSpec, recordHumanRun } from './human.ts';
import { songClock } from './map.ts';
import { trackHoles } from './pilot.ts';
import { recordRun } from './record.ts';
import { intensityOf, type LabSongAnalysis, type VariantSpec } from './variants.ts';

export function labNote( n: ComposedNote, taps: ReadonlySet< number > ): string {
    return n.kind === 'jump' && taps.has( n.z ) ? 'j' : formatNotes( [ n ] );
}

export function buildVariant(
    spec: VariantSpec,
    a: LabSongAnalysis,
    seed: number,
    classes: readonly ShipClassId[],
    skills: readonly LabSkill[] = [],
): LabVariant {
    const c = songClock( a );
    const { build, score, motifs, taps = [] } = spec.make( a, c, seed );
    const tapSet = new Set( taps );
    const emitted = labEmitted( score, spec.emit );
    const track = segmentsTrack( emitted.segments, score.length );
    const holes = trackHoles( track, score.length ).map( ( h ) => ( tapSet.has( h.z0 ) ? { ...h, tap: true } : h ) );
    const course = { spans: emitted.spans, holes };
    const phrases = new Map< number, string[] >();
    for ( const n of score.notes )
        phrases.set( n.phrase, [ ...( phrases.get( n.phrase ) ?? [] ), labNote( n, tapSet ) ] );
    return {
        id: spec.id,
        label: spec.label,
        rules: spec.rules,
        build,
        motifs,
        score,
        scoreString: score.notes.map( ( n ) => labNote( n, tapSet ) ).join( ' ' ),
        phraseStrings: [ ...phrases.values() ].map( ( p ) => p.join( ' ' ) ),
        intensity: intensityOf( score ),
        trackDigest: trackDigest( emitted.segments ),
        runs: classes.map( ( id ) => recordRun( track, course, id ) ),
        humanRuns: skills.flatMap( ( skill ) =>
            classes.map( ( id ) =>
                recordHumanRun( track, course, id, pilotSpec( skill, humanSeed( spec.id, seed, id, skill ) ) ),
            ),
        ),
        ...( spec.emit === undefined ? {} : { emit: spec.emit } ),
    };
}
