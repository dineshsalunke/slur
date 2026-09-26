import { OPEN_TARGETS, type OpenSpaceReport, openSpace, openSpaceFailures, openWidthAt } from '../groove/open-space.js';
import { HALF_WIDTH, MIN_LANE, segIndexForZ, type Track } from '../space.js';
import type { PhraseKind, PhrasePlan } from './plan.js';

export interface PhraseOpenReport {
    whole: OpenSpaceReport;
    wideShare: Record< PhraseKind, number >;
    closedArenaZ: number[];
}

const FULL_EPS = 1e-6;

export function phraseOpenSpace( track: Track, plan: PhrasePlan, dz = 1 ): PhraseOpenReport {
    const wide: Record< PhraseKind, [ number, number ] > = { arena: [ 0, 0 ], motif: [ 0, 0 ], rest: [ 0, 0 ] };
    const closedArenaZ: number[] = [];
    for ( const p of plan.phrases ) {
        for ( let z = p.z0 + dz / 2; z < Math.min( p.z1, track.finishZ ); z += dz ) {
            const width = openWidthAt( track.segmentAt( segIndexForZ( z ) ), z );
            wide[ p.kind ][ 1 ]++;
            if ( width / MIN_LANE >= OPEN_TARGETS.wideLanes ) wide[ p.kind ][ 0 ]++;
            if ( p.kind === 'arena' && width < 2 * HALF_WIDTH - FULL_EPS ) closedArenaZ.push( z );
        }
    }
    const share = ( [ n, of ]: [ number, number ] ): number => ( of === 0 ? 1 : n / of );
    return {
        whole: openSpace( track, dz ),
        wideShare: { arena: share( wide.arena ), motif: share( wide.motif ), rest: share( wide.rest ) },
        closedArenaZ,
    };
}

export function phraseOpenFailures( r: PhraseOpenReport ): string[] {
    const out = openSpaceFailures( r.whole );
    if ( r.closedArenaZ.length > 0 ) out.push( `arena closed at z ${ r.closedArenaZ[ 0 ] }` );
    return out;
}
