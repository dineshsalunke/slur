import { OPEN_TARGETS, type OpenSpaceReport, openSpace, openWidthAt } from '../groove/open-space.js';
import { fullFloor, HALF_WIDTH, MIN_LANE, type Segment, segIndexForZ, spanHasZ, type Track } from '../space.js';
import type { PhraseKind, PhrasePlan } from './plan.js';

export interface PhraseOpenReport {
    whole: OpenSpaceReport;
    outside: OpenSpaceReport;
    outsideWideShare: number;
    wideShare: Record< PhraseKind, number >;
    closedArenaZ: number[];
}

export const PHRASE_WHOLE_WIDE_SHARE = 0.6;

const FULL_EPS = 1e-6;

type ZRange = [ number, number ];

function hasAirSlice( s: Segment ): boolean {
    for ( let z = s.z0 + 0.5; z < s.z1; z += 1 ) if ( ! s.floors.some( ( f ) => spanHasZ( s, f, z ) ) ) return true;
    return false;
}

function memoTrack( track: Track, map: ( raw: Segment ) => Segment ): Track {
    const memo = new Map< number, Segment >();
    const segmentAt = ( i: number ): Segment => {
        let s = memo.get( i );
        if ( s === undefined ) {
            s = map( track.segmentAt( i ) );
            memo.set( i, s );
        }
        return s;
    };
    return { ...track, segmentAt, segmentAtZ: ( z: number ) => segmentAt( segIndexForZ( z ) ) };
}

export function bridgeAirSlices( track: Track ): Track {
    return memoTrack( track, ( raw ) =>
        hasAirSlice( raw ) ? { ...raw, floors: [ ...raw.floors, ...fullFloor( 0 ) ] } : raw,
    );
}

function inside( ranges: readonly ZRange[], z0: number, z1: number ): boolean {
    return ranges.some( ( [ a, b ] ) => a <= z0 && z1 <= b );
}

export function exemptWeaves( track: Track, plan: PhrasePlan ): Track {
    const weaves = plan.phrases.filter( ( p ) => p.kind === 'weave' ).map( ( p ): ZRange => [ p.z0, p.z1 ] );
    return memoTrack( track, ( raw ) => {
        if ( ! weaves.some( ( [ a, b ] ) => a < raw.z1 && raw.z0 < b ) ) return raw;
        return {
            ...raw,
            floors: [ ...raw.floors, ...fullFloor( 0 ) ],
            blocks: raw.blocks.filter( ( b ) => ! inside( weaves, b.z0, b.z1 ) ),
        };
    } );
}

export function phraseOpenSpace( source: Track, plan: PhrasePlan, dz = 1 ): PhraseOpenReport {
    const track = bridgeAirSlices( source );
    const wide: Record< PhraseKind, [ number, number ] > = {
        arena: [ 0, 0 ],
        motif: [ 0, 0 ],
        weave: [ 0, 0 ],
        rest: [ 0, 0 ],
    };
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
    const kinds = [ wide.arena, wide.motif, wide.rest ];
    return {
        whole: openSpace( track, dz ),
        outside: openSpace( exemptWeaves( track, plan ), dz ),
        outsideWideShare: share( [
            kinds.reduce( ( n, [ k ] ) => n + k, 0 ),
            kinds.reduce( ( n, [ , of ] ) => n + of, 0 ),
        ] ),
        wideShare: {
            arena: share( wide.arena ),
            motif: share( wide.motif ),
            weave: share( wide.weave ),
            rest: share( wide.rest ),
        },
        closedArenaZ,
    };
}

export function phraseOpenFailures( r: PhraseOpenReport ): string[] {
    const out: string[] = [];
    if ( r.outsideWideShare < OPEN_TARGETS.wideShare )
        out.push( `outside wideShare ${ r.outsideWideShare.toFixed( 3 ) }` );
    if ( r.whole.wideShare < PHRASE_WHOLE_WIDE_SHARE )
        out.push( `whole wideShare ${ r.whole.wideShare.toFixed( 3 ) }` );
    if ( r.outside.minLanes < OPEN_TARGETS.minLanes ) out.push( `minLanes ${ r.outside.minLanes.toFixed( 2 ) }` );
    if ( r.outside.longestNarrow > OPEN_TARGETS.longestNarrow )
        out.push( `longestNarrow ${ r.outside.longestNarrow }` );
    if ( r.outside.longestWall > OPEN_TARGETS.longestWall ) out.push( `longestWall ${ r.outside.longestWall }` );
    if ( r.whole.longestArenaGap > OPEN_TARGETS.arenaSpacing )
        out.push( `longestArenaGap ${ r.whole.longestArenaGap }` );
    if ( r.closedArenaZ.length > 0 ) out.push( `arena closed at z ${ r.closedArenaZ[ 0 ] }` );
    return out;
}
