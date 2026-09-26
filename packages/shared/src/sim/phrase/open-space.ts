import { OPEN_TARGETS, type OpenSpaceReport, openSpace, openSpaceFailures, openWidthAt } from '../groove/open-space.js';
import { fullFloor, HALF_WIDTH, MIN_LANE, type Segment, segIndexForZ, spanHasZ, type Track } from '../space.js';
import type { PhraseKind, PhrasePlan } from './plan.js';

export interface PhraseOpenReport {
    whole: OpenSpaceReport;
    wideShare: Record< PhraseKind, number >;
    closedArenaZ: number[];
}

const FULL_EPS = 1e-6;

function hasAirSlice( s: Segment ): boolean {
    for ( let z = s.z0 + 0.5; z < s.z1; z += 1 ) if ( ! s.floors.some( ( f ) => spanHasZ( s, f, z ) ) ) return true;
    return false;
}

export function bridgeAirSlices( track: Track ): Track {
    const memo = new Map< number, Segment >();
    const segmentAt = ( i: number ): Segment => {
        let s = memo.get( i );
        if ( s === undefined ) {
            const raw = track.segmentAt( i );
            s = hasAirSlice( raw ) ? { ...raw, floors: [ ...raw.floors, ...fullFloor( 0 ) ] } : raw;
            memo.set( i, s );
        }
        return s;
    };
    return { ...track, segmentAt, segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ) };
}

export function phraseOpenSpace( source: Track, plan: PhrasePlan, dz = 1 ): PhraseOpenReport {
    const track = bridgeAirSlices( source );
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
