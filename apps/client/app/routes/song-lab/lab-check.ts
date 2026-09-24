import type { Track } from '@slur/shared';
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
import { type LabEntry, labEntries } from './lab-view';

export interface LabCheck {
    track: Track;
    entries: LabEntry[];
    digestOk: boolean;
    matches: Record< string, boolean >;
}

const checks = new Map< string, LabCheck >();

export function runMatches( track: Track, run: LabRun ): boolean {
    return sameResult( labResult( replayRun( track, run ) ), run.result );
}

export function checkVariant( v: LabVariant ): LabCheck {
    const track = labTrack( v );
    const entries = labEntries( v );
    const matches: LabCheck[ 'matches' ] = {};
    for ( const e of entries ) matches[ e.key ] = runMatches( track, e.run );
    return { track, entries, digestOk: labDigest( v ) === v.trackDigest, matches };
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
