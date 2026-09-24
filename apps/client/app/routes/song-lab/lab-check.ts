import type { ShipClassId, Track } from '@slur/shared';
import {
    type LabBundle,
    type LabRun,
    type LabVariant,
    labDigest,
    labResult,
    labTrack,
    replayRun,
    sameResult,
} from '../../../song-lab/bundle';

export interface LabCheck {
    track: Track;
    digestOk: boolean;
    matches: Partial< Record< ShipClassId, boolean > >;
}

const checks = new Map< string, LabCheck >();

export function runMatches( track: Track, run: LabRun ): boolean {
    return sameResult( labResult( replayRun( track, run ) ), run.result );
}

export function checkVariant( v: LabVariant ): LabCheck {
    const track = labTrack( v );
    const matches: LabCheck[ 'matches' ] = {};
    for ( const run of v.runs ) matches[ run.classId ] = runMatches( track, run );
    return { track, digestOk: labDigest( v ) === v.trackDigest, matches };
}

export function variantCheck( name: string, bundle: LabBundle, v: LabVariant ): LabCheck {
    const key = `${ name }\u0000${ bundle.createdAt }\u0000${ v.id }`;
    let c = checks.get( key );
    if ( ! c ) {
        c = checkVariant( v );
        checks.set( key, c );
    }
    return c;
}
