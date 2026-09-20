import { type FloorSpan, HALF_WIDTH, SEG_LEN, type Segment, type Track } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { BOUNDARY_H, BOUNDARY_W } from './track-geometry';
import { buildRailRuns, railRunDistance } from './track-rails';

// A run that survives a gap would light the floor across a hole the deck does not have, and a run that
// splits on every segment would bead the highlight instead of streaking it. Neither is visible in a type.

const full = (): FloorSpan[] => [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ];

function trackOf( floors: FloorSpan[][] ): Track {
    const segs: Segment[] = floors.map( ( f, i ) => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: f.length > 0 ? 'plain' : 'gap',
        floors: f,
        blocks: [],
        isFinish: false,
    } ) );
    return {
        finishZ: segs.length * SEG_LEN,
        anchors: [],
        segmentAt: ( i: number ) => segs[ i ],
        segmentAtZ: ( z: number ) => segs[ Math.floor( z / SEG_LEN ) ],
    };
}

describe( 'rail runs', () => {
    it( 'merges contiguous segments into one run per side', () => {
        const runs = buildRailRuns( trackOf( [ full(), full(), full() ] ), 3 );

        expect( runs ).toHaveLength( 2 );
        for ( const run of runs ) {
            expect( run.z0 ).toBe( 0 );
            expect( run.z1 ).toBe( 3 * SEG_LEN );
        }
    } );

    it( 'breaks a run where the deck has a full-width gap', () => {
        const runs = buildRailRuns( trackOf( [ full(), [], full() ] ), 3 );

        expect( runs ).toHaveLength( 4 );
        expect( runs.filter( ( r ) => r.x < 0 ).map( ( r ) => [ r.z0, r.z1 ] ) ).toEqual( [
            [ 0, SEG_LEN ],
            [ 2 * SEG_LEN, 3 * SEG_LEN ],
        ] );
    } );

    it( 'lights only the side a partial span still reaches', () => {
        const partial: FloorSpan[] = [ { x0: -HALF_WIDTH, x1: 0, y: 0 } ];
        const runs = buildRailRuns( trackOf( [ full(), partial, full() ] ), 3 );

        expect( runs.filter( ( r ) => r.x < 0 ) ).toHaveLength( 1 );
        expect( runs.filter( ( r ) => r.x > 0 ) ).toHaveLength( 2 );
    } );

    it( 'sits OUTBOARD of the deck edge and ABOVE its top face', () => {
        const [ left ] = buildRailRuns( trackOf( [ full() ] ), 1 );

        // ADR-012: the band is [HALF_WIDTH, HALF_WIDTH + w] and takes no playable width.
        expect( Math.abs( left.x ) ).toBeGreaterThan( HALF_WIDTH );
        expect( left.x ).toBeCloseTo( -HALF_WIDTH - BOUNDARY_W / 2 );
        // At or below the deck plane the top face is outside the source's hemisphere and receives
        // nothing at all — the defect that lit only the gap end caps.
        expect( left.y ).toBeGreaterThan( 0 );
        expect( left.y ).toBeCloseTo( BOUNDARY_H / 2 );
    } );

    it( 'measures distance to the span, not to its centre', () => {
        const run = { x: 0, y: 0, z0: 100, z1: 200 };

        expect( railRunDistance( run, 150 ) ).toBe( 0 );
        expect( railRunDistance( run, 80 ) ).toBe( 20 );
        expect( railRunDistance( run, 260 ) ).toBe( 60 );
    } );
} );
