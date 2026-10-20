import { type FloorSpan, HALF_WIDTH, LEAD_SEGMENTS, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { RAIL_W } from './track-geometry';
import { buildRailRuns } from './track-rails';

const full = (): FloorSpan[] => [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ];

function segmentOf( f: FloorSpan[], i: number ): Segment {
    return {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: f.length > 0 ? 'plain' : 'gap',
        floors: f,
        blocks: [],
        isFinish: false,
    };
}

function trackOf( floors: FloorSpan[][] ): Track {
    const lead: FloorSpan[][] = Array.from( { length: LEAD_SEGMENTS }, full );
    const segs: Segment[] = [ ...lead, ...floors ].map( ( f, i ) => segmentOf( f, i - LEAD_SEGMENTS ) );
    const at = ( i: number ) => segs[ i + LEAD_SEGMENTS ] ?? segmentOf( [], i );
    return {
        finishZ: floors.length * SEG_LEN,
        anchors: [],
        segmentAt: at,
        segmentAtZ: ( z: number ) => at( Math.floor( z / SEG_LEN ) ),
    };
}

const LEAD_Z = -LEAD_SEGMENTS * SEG_LEN;

describe( 'rail runs', () => {
    it( 'merges contiguous segments into one run per side', () => {
        const runs = buildRailRuns( trackOf( [ full(), full(), full() ] ), 3 );

        expect( runs ).toHaveLength( 2 );
        for ( const run of runs ) {
            expect( run.z0 ).toBe( LEAD_Z );
            expect( run.z1 ).toBe( 3 * SEG_LEN );
        }
    } );

    it( 'covers the lead-in deck the floor renders behind the start line', () => {
        const runs = buildRailRuns( trackOf( [ full() ] ), 1 );

        for ( const run of runs ) expect( run.z0 ).toBe( LEAD_Z );
    } );

    it( 'breaks a run where the deck has a full-width gap', () => {
        const runs = buildRailRuns( trackOf( [ full(), [], full() ] ), 3 );

        expect( runs ).toHaveLength( 4 );
        expect( runs.filter( ( r ) => r.x < 0 ).map( ( r ) => [ r.z0, r.z1 ] ) ).toEqual( [
            [ LEAD_Z, SEG_LEN ],
            [ 2 * SEG_LEN, 3 * SEG_LEN ],
        ] );
    } );

    it( 'lights only the side a partial span still reaches', () => {
        const partial: FloorSpan[] = [ { x0: -HALF_WIDTH, x1: 0, y: 0 } ];
        const runs = buildRailRuns( trackOf( [ full(), partial, full() ] ), 3 );

        expect( runs.filter( ( r ) => r.x < 0 ) ).toHaveLength( 1 );
        expect( runs.filter( ( r ) => r.x > 0 ) ).toHaveLength( 2 );
    } );

    it( 'sits OUTBOARD of the deck edge and FLUSH with its top face', () => {
        const [ left ] = buildRailRuns( trackOf( [ full() ] ), 1 );

        expect( Math.abs( left.x ) ).toBeGreaterThan( HALF_WIDTH );
        expect( left.x ).toBeCloseTo( -HALF_WIDTH - RAIL_W / 2 );
        expect( left.y ).toBe( 0 );
    } );
} );
